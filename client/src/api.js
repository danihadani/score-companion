import { getToken, logout } from "./auth.js";

// ============================================================
// fetch(), plus the login token on every request:
//   Authorization: Bearer <token>
// Every component calls apiFetch() instead of fetch().
// ============================================================
export async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  // The token is missing, changed or expired: back to the log in page.
  if (res.status === 401) {
    logout();
    window.location.assign("/login");
  }
  return res;
}
