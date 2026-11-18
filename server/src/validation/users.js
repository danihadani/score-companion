// ============================================================
// Checks the data a client sends to sign up.
// ============================================================

export function validateSignup(body = {}) {
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !fullName || !email || !password) throw new Error("ALL_FIELDS_REQUIRED");
  if (!/^[A-Za-z0-9_.-]{3,50}$/.test(username)) throw new Error("INVALID_USERNAME");
  if (fullName.length > 100) throw new Error("NAME_TOO_LONG");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("INVALID_EMAIL");
  if (password.length < 8) throw new Error("PASSWORD_TOO_SHORT");
  // bcrypt only reads the first 72 bytes of a password.
  if (password.length > 72) throw new Error("PASSWORD_TOO_LONG");

  return { username, fullName, email, password };
}
