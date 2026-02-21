import { Navigate } from "react-router-dom";
import { getToken } from "./auth";

const RequireAuth = ({ children }) => {

  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RequireAuth;
