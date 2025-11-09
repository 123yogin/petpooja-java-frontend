import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    username: "", 
    email: "", 
    password: "", 
    role: "CASHIER" 
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [userEmail, setUserEmail] = useState(""); // Store email for confirmation
  const [userRole, setUserRole] = useState(""); // Store role for confirmation

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    
    try {
      // Use Cognito signup endpoint
      const res = await fetch("http://localhost:8080/api/auth/cognito/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      
      if (res.ok) {
        if (data.confirmationRequired || !data.confirmed) {
          // User needs to confirm via email
          setUserEmail(form.email); // Store email for confirmation
          setUserRole(form.role); // Store role for confirmation
          setConfirmationRequired(true);
          setMessage(data.message || "Please check your email for confirmation code.");
        } else {
          // User auto-confirmed, can login now
          setMessage(data.message || "User registered successfully! You can now login.");
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
      console.error("Registration error:", err);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    try {
      const res = await fetch("http://localhost:8080/api/auth/cognito/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail || form.email,
          confirmationCode: confirmationCode,
          role: userRole || form.role // Include role for group assignment
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage(data.message || "Account confirmed successfully! Redirecting to login...");
        // Redirect to login page after confirmation
        setTimeout(() => {
          navigate("/");
        }, 2000);
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
    setMessage("");
    
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
        setMessage(data.message || "Confirmation code has been resent to your email.");
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
          
          {message && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded text-sm">
            We've sent a confirmation code to <strong>{userEmail || form.email}</strong>. Please enter it below.
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
            Confirm Account
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
              Back to Registration
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-6 font-bold text-center text-gray-800">Register</h2>
        
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <input 
          type="text" 
          placeholder="Username" 
          className="w-full p-2 mb-3 border rounded"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })} 
          required
        />
        
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
        
        <select 
          className="w-full p-2 mb-3 border rounded"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })} 
          required
        >
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="CASHIER">Cashier</option>
        </select>
        
        <button 
          type="submit"
          className="bg-blue-600 text-white w-full p-2 rounded hover:bg-blue-700 mb-3"
        >
          Register
        </button>
        
        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link to="/" className="text-blue-600 hover:underline">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
}

