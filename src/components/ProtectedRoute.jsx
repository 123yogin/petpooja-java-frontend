import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import AccessDenied from "../pages/AccessDenied";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useContext(AuthContext);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Show access denied page if user doesn't have required role
  if (!allowedRoles.includes(user.role)) {
    return <AccessDenied />;
  }

  return children;
}

