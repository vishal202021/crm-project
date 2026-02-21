import { Navigate } from "react-router-dom";
import { getToken, getRole } from "./auth";

const RoleProtectedRoute = ({ roles = [], children }) => {

  const token = getToken();
  const role = getRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length && !roles.includes(role)) {
    return <Navigate to="/app" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
