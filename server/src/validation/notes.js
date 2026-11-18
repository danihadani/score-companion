// ============================================================
// Checks the data a client sends to write a note on a cue.
// ============================================================

const MAX_TEXT = 2000;

// { text: "  Less drums in the chase  " } → { text: "Less drums in the chase" }
export function validateNote(body = {}) {
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) throw new Error("TEXT_REQUIRED");
  if (text.length > MAX_TEXT) throw new Error("TEXT_TOO_LONG");
  return { text };
}
