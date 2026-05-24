import { Navigate } from "react-router-dom";

function ProtectedRoute({ userEmail, children }) {
  if (!userEmail) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
