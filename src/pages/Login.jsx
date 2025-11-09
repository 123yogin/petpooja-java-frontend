import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      // Use Cognito signin endpoint
      const res = await fetch("http://localhost:8080/api/auth/cognito/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      
      if (res.ok && data.idToken) {
        // Decode Cognito ID token to get role
        const tokenParts = data.idToken.split(".");
        const payload = JSON.parse(atob(tokenParts[1]));
        
        // Extract role from Cognito token (from cognito:groups or custom:role)
        let role = "USER";
        if (payload["cognito:groups"] && payload["cognito:groups"].length > 0) {
          role = payload["cognito:groups"][0].toUpperCase();
        } else if (payload["custom:role"]) {
          role = payload["custom:role"].toUpperCase();
        }
        
        // Store Cognito ID token
        login(data.idToken, role);
        navigate("/dashboard");
      } else {
        const errorMsg = data.error || data.message || "Invalid credentials";
        setError(errorMsg);
        
        // Check if user needs confirmation
        if (data.confirmationRequired || errorMsg.includes("not confirmed")) {
          setConfirmationRequired(true);
        }
      }
    } catch (err) {
      setError("Invalid credentials. Please try again.");
      console.error("Login error:", err);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await fetch("http://localhost:8080/api/auth/cognito/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          confirmationCode: confirmationCode
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setError("");
        setConfirmationRequired(false);
        // After confirmation, try to login again
        setTimeout(() => {
          handleSubmit(new Event('submit'));
        }, 1000);
      } else {
        setError(data.error || "Confirmation failed. Please try again.");
      }
    } catch (err) {
      setError("Confirmation failed. Please try again.");
      console.error("Confirmation error:", err);
    }
  };

  const handleResendCode = async () => {
    setError("");
    
    try {
      const res = await fetch("http://localhost:8080/api/auth/cognito/resend-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setError("");
        alert("Confirmation code has been resent to your email.");
      } else {
        setError(data.error || "Failed to resend code. Please try again.");
      }
    } catch (err) {
      setError("Failed to resend code. Please try again.");
      console.error("Resend code error:", err);
    }
  };

  // Show confirmation form if confirmation is required
  if (confirmationRequired) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <form onSubmit={handleConfirm} className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-2xl mb-6 font-bold text-center text-gray-800">Confirm Your Account</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded text-sm">
            Your account needs to be confirmed. We've sent a confirmation code to <strong>{form.email}</strong>. Please enter it below.
          </div>

          <input 
            type="text" 
            placeholder="Confirmation Code" 
            className="w-full p-2 mb-3 border rounded"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)} 
            required
          />
          
          <button 
            type="submit"
            className="bg-blue-600 text-white w-full p-2 rounded hover:bg-blue-700 mb-3"
          >
            Confirm & Login
          </button>

          <button 
            type="button"
            onClick={handleResendCode}
            className="bg-gray-200 text-gray-700 w-full p-2 rounded hover:bg-gray-300 mb-3"
          >
            Resend Code
          </button>
          
          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => setConfirmationRequired(false)}
              className="text-blue-600 hover:underline"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-6 font-bold text-center text-gray-800">Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
            {error.includes("not confirmed") && (
              <div className="mt-2 text-sm">
                <button
                  type="button"
                  onClick={() => setConfirmationRequired(true)}
                  className="text-blue-600 hover:underline"
                >
                  Click here to confirm your account
                </button>
              </div>
            )}
          </div>
        )}
        
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full p-2 mb-3 border rounded"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} 
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full p-2 mb-3 border rounded"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} 
          required
        />
        <button 
          type="submit"
          className="bg-blue-600 text-white w-full p-2 rounded hover:bg-blue-700 mb-3"
        >
          Login
        </button>
        
        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </div>
      </form>
    </div>
  );
}

