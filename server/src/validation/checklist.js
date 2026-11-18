// ============================================================
// Checks the data a client sends for a cue's checklist.
// ============================================================

// What every new cue still needs, in order.
export const DEFAULT_CHECKLIST = [
  "Sketch",
  "Director approved",
  "Orchestration",
  "Recording",
  "Mix",
  "Stems delivered",
];

const MAX_LABEL = 100;

// A new item: { label: "  Choir session " } → { label: "Choir session" }
export function validateChecklistItem(body = {}) {
  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label) throw new Error("LABEL_REQUIRED");
  if (label.length > MAX_LABEL) throw new Error("LABEL_TOO_LONG");
  return { label };
}

// Checking or unchecking an item: { done: true }
export function validateDone(body = {}) {
  if (typeof body.done !== "boolean") throw new Error("INVALID_DONE");
  return { done: body.done };
}
