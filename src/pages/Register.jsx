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
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="w-full max-w-md">
          <form onSubmit={handleConfirm} className="bg-white p-10 rounded-xl border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Confirm Your Account</h2>
              <p className="text-sm text-gray-500">Enter the confirmation code sent to your email</p>
            </div>
            
            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm">
                {message}
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="mb-6 p-3 bg-gray-50 border border-gray-100 text-gray-700 rounded-lg text-sm">
              Confirmation code sent to <strong>{userEmail || form.email}</strong>
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
              Confirm Account
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
                ← Back to Registration
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create Account</h2>
            <p className="text-sm text-gray-500">Sign up for restaurant management system</p>
          </div>
          
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input 
                type="text" 
                placeholder="Enter your username" 
                className="input-field"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} 
                required
              />
            </div>
            
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select 
                className="input-field"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })} 
                required
              >
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="CASHIER">Cashier</option>
              </select>
            </div>
            
            <button 
              type="submit"
              className="btn-primary w-full py-3"
            >
              Register
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <Link to="/" className="text-gray-900 hover:underline font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

