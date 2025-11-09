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
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md">
          <form onSubmit={handleConfirm} className="bg-white p-10 rounded-xl border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Confirm Your Account</h2>
              <p className="text-sm text-gray-500">Enter the confirmation code sent to your email</p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="mb-6 p-3 bg-gray-50 border border-gray-100 text-gray-700 rounded-lg text-sm">
              Confirmation code sent to <strong>{form.email}</strong>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmation Code</label>
              <input 
                type="text" 
                placeholder="Enter confirmation code" 
                className="input-field"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)} 
                required
              />
            </div>
            
            <button 
              type="submit"
              className="btn-primary w-full py-3 mb-3"
            >
              Confirm & Login
            </button>

            <button 
              type="button"
              onClick={handleResendCode}
              className="btn-secondary w-full py-3 mb-4"
            >
              Resend Code
            </button>
            
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setConfirmationRequired(false)}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md">
        <div className="bg-white p-10 rounded-xl border border-gray-100">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-sm text-gray-500">Sign in to your restaurant management system</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
              {error}
              {error.includes("not confirmed") && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmationRequired(true)}
                    className="text-gray-900 hover:underline font-medium text-sm"
                  >
                    Click here to confirm your account
                  </button>
                </div>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                placeholder="Enter your password" 
                className="input-field"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
                required
              />
            </div>
            
            <button 
              type="submit"
              className="btn-primary w-full py-3"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Don't have an account? </span>
            <Link to="/register" className="text-gray-900 hover:underline font-medium">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

