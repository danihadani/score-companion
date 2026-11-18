import { Navigate, useLocation } from "react-router";
import { isLoggedIn } from "./auth.js";

// Wraps a page only a logged-in composer may see. A visitor without a token
// is sent to /login, and we remember where she was heading.
export default function RequireAuth({ children }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}
