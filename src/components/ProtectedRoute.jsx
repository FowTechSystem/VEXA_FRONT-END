// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../api/authService";

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!authService.isAuthenticated()) {
    authService.logout();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
