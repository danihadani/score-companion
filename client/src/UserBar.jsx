import { Link, useNavigate } from "react-router";
import { getUser, logout } from "./auth.js";

// The band at the top: the name (with a red "recording" light), who is logged in, and a way out.
export default function UserBar() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="topbar">
      <div className="topbar-in">
        <Link to="/" className="logo">
          <span className="rec" aria-hidden="true" />
          Score Companion
        </Link>
        <div className="user">
          <span>
            Logged in as <strong>{user?.fullName}</strong>
          </span>
          <button className="ghost small" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
