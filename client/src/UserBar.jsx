import { useNavigate } from "react-router";
import { getUser, logout } from "./auth.js";

// Who is logged in, with a way out. Shown above every page that needs a login.
export default function UserBar() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="user-bar">
      <span className="meta">
        Logged in as <strong>{user?.fullName}</strong>
      </span>
      <button className="secondary small" onClick={handleLogout}>
        Log out
      </button>
    </div>
  );
}
