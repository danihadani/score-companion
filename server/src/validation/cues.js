import { timecodeToFrames } from "../timecode.js";

// ============================================================
// Checks the data a client sends to create or update a cue.
// The timecodes are checked against the project's frame rate.
// ============================================================

export const CUE_STATUSES = ["sketch", "sent", "approved", "recorded", "mixed"];

export function validateCue(body, fps) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) throw new Error("NAME_REQUIRED");

  const scene = typeof body.scene === "string" ? body.scene.trim() || null : null;

  const status = body.status || "sketch";
  if (!CUE_STATUSES.includes(status)) throw new Error("INVALID_STATUS");

  const framesIn = timecodeToFrames(body.timecodeIn, fps); // throws if invalid
  const framesOut = timecodeToFrames(body.timecodeOut, fps); // throws if invalid

  if (framesOut <= framesIn) {
    throw new Error("TIMECODE_OUT_BEFORE_IN");
  }

  return {
    name,
    timecodeIn: body.timecodeIn,
    timecodeOut: body.timecodeOut,
    scene,
    status,
  };
}
