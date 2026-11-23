import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { saveLogin } from "./auth.js";

const MESSAGES = {
  ALL_FIELDS_REQUIRED: "Please fill in your username and password",
  INVALID_CREDENTIALS: "Wrong username or password",
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      // Not apiFetch: there is no token yet.
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "Too many tries. Please wait a few minutes."
            : MESSAGES[data.error] || "Something went wrong",
        );
        return;
      }
      saveLogin(data); // the token goes into localStorage
      // Back to the page she wanted, or to her projects.
      navigate(location.state?.from || "/", { replace: true });
    } catch {
      setError("Can't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <header className="auth-head">
        <p className="logo auth-logo">
          <span className="rec" aria-hidden="true" />
          Score Companion
        </p>
        <p className="tagline">Every cue in your film, from sketch to mix.</p>
      </header>

      <form className="card form auth-form" onSubmit={handleSubmit}>
        <h2>Log in</h2>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
        {error && <p className="error">{error}</p>}
        <p className="meta">
          No account yet? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </main>
  );
}
