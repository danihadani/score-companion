// ============================================================
// Checks the data a client sends to create or update a project.
// Returns clean values, or throws an Error with a short code
// that the route turns into a 400 answer.
// ============================================================

export function validateProject(body) {
  // A title must be text, and not only spaces.
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) throw new Error("TITLE_REQUIRED");

  const director = typeof body.director === "string" ? body.director.trim() || null : null;
  return { title, director };
}
