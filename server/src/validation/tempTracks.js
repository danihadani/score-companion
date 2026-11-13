// ============================================================
// Checks the data a client sends to attach a temp track to a cue.
// ============================================================

const MAX_TEXT = 200;
const MAX_NOTES = 2000;

// "  Hans Zimmer " → "Hans Zimmer", and "   " or a missing field → null
function optionalText(value, max, errorCode) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length > max) throw new Error(errorCode);
  return text || null;
}

// Only http and https links are saved. A link such as
// "javascript:alert(1)" would run code when someone clicks it.
function optionalLink(value) {
  const text = optionalText(value, MAX_TEXT * 5, "INVALID_LINK");
  if (!text) return null;

  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error("INVALID_LINK");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("INVALID_LINK");
  }
  return url.href;
}

export function validateTempTrack(body) {
  const title = optionalText(body.title, MAX_TEXT, "TITLE_TOO_LONG");
  if (!title) throw new Error("TITLE_REQUIRED");

  return {
    title,
    artist: optionalText(body.artist, MAX_TEXT, "ARTIST_TOO_LONG"),
    link: optionalLink(body.link),
    notes: optionalText(body.notes, MAX_NOTES, "NOTES_TOO_LONG"),
  };
}
