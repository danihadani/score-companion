// ============================================================
// Checks the data a client sends to create or update a project.
// Returns clean values, or throws an Error with a short code
// that the route turns into a 400 answer.
// ============================================================

// The frame rates offered by DAWs like Logic and Pro Tools.
// Timecode is always non-drop: drop-frame is not supported.
export const ALLOWED_FPS = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60];

export function validateProject(body) {
  // A title must be text, and not only spaces.
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) throw new Error("TITLE_REQUIRED");

  const director = typeof body.director === "string" ? body.director.trim() || null : null;

  if (body.fps === undefined || body.fps === null || body.fps === "") {
    throw new Error("FPS_REQUIRED");
  }

  const fps = Number(body.fps);

  if (!ALLOWED_FPS.includes(fps)) {
    throw new Error("INVALID_FPS");
  }
  return { title, director, fps };
}
