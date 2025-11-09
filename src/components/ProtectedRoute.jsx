import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/" />;

  if (!allowedRoles.includes(user.role)) return <h1>Access Denied</h1>;

  return children;
}

