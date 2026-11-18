import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { saveLogin } from "./auth.js";

const MESSAGES = {
  ALL_FIELDS_REQUIRED: "Please fill in every field",
  INVALID_USERNAME: "Username: 3–50 characters, letters, digits, . _ or -",
  NAME_TOO_LONG: "The name is too long",
  INVALID_EMAIL: "That email address is not valid",
  PASSWORD_TOO_SHORT: "The password must be at least 8 characters",
  PASSWORD_TOO_LONG: "The password can be up to 72 characters",
  USERNAME_TAKEN: "That username is taken",
};

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Only the browser can check this: the server never sees the second copy.
    if (password !== passwordAgain) {
      setError("The two passwords don't match");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, fullName, email, password }),
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
      saveLogin(data); // signing up logs you straight in
      navigate("/", { replace: true });
    } catch {
      setError("Can't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <header className="page-head">
        <h1>Score Companion</h1>
        <p className="tagline">Every cue in your film, from sketch to mix.</p>
      </header>

      <form className="card form auth-form" onSubmit={handleSubmit}>
        <h2>Sign up</h2>
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
          Full name
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          Password (8 characters or more)
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label>
          Password again
          <input
            type="password"
            value={passwordAgain}
            onChange={(e) => setPasswordAgain(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Signing up…" : "Sign up"}
        </button>
        {error && <p className="error">{error}</p>}
        <p className="meta">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
