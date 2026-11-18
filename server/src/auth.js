// ============================================================
// Everything to do with passwords and login tokens.
// (The same approach as in my hotel booking project.)
// ============================================================
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Refuse to start without a secret rather than quietly falling back to one
// written in the code: this file is on GitHub, so a fallback secret would be
// public, and anyone could forge a token with it.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing. Copy server/.env.example to server/.env and set it.");
}

const JWT_SECRET = process.env.JWT_SECRET;

// How long a login lasts.
const TOKEN_LIFETIME = "1d";

/******************** Passwords ********************/
// A hash is one-way: we can check a password against it, but nobody -
// including us - can turn it back into the original password.
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

/******************** Tokens ********************/
// The token is a signed note that says "this is user 3". The client keeps it
// and sends it back on every request. Because it is signed with JWT_SECRET,
// nobody can forge one or change the id inside it.
export function createToken(user) {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_LIFETIME });
}

/******************** The login guard ********************/
// Put this in front of a route and only a logged-in composer gets through.
export function auth(req, res, next) {
  const header = req.headers.authorization || "";

  // The header looks like:  Authorization: Bearer <token>
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "NOT_LOGGED_IN" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId; // every guarded route can now use req.userId
    return next();
  } catch {
    return res.status(401).json({ error: "LOGIN_EXPIRED" });
  }
}
