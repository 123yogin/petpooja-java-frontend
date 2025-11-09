import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await API.post("/auth/login", form);
      const token = res.data;
      
      // Check if response is actually a token (starts with eyJ) or an error message
      if (token && token.startsWith("eyJ")) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        login(token, decoded.role);
        navigate("/dashboard");
      } else {
        setError(token || "Invalid credentials");
      }
    } catch (err) {
      setError(err.response?.data || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-6 font-bold text-center text-gray-800">Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
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

