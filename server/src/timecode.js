// ============================================================
// Timecode math. A timecode is HH:MM:SS:FF, always non-drop.
// At 23.976 and 29.97 the frame counter still runs to 23 and 29,
// so the math uses the rounded rate (24, 30).
// ============================================================

const TIMECODE_PATTERN = /^(\d{2}):(\d{2}):(\d{2}):(\d{2})$/;

// "01:02:03:12" at 24 fps → 89,364 frames since 00:00:00:00
export function timecodeToFrames(timecode, fps) {
  const base = Math.round(fps);

  const match = TIMECODE_PATTERN.exec(timecode);
  if (!match) throw new Error("INVALID_TIMECODE");

  const [hours, minutes, seconds, frames] = match.slice(1).map(Number);
  if (minutes > 59 || seconds > 59 || frames >= base) {
    throw new Error("INVALID_TIMECODE");
  }

  return ((hours * 60 + minutes) * 60 + seconds) * base + frames;
}

// 89,364 frames at 24 fps → "01:02:03:12"
export function framesToTimecode(totalFrames, fps) {
  const base = Math.round(fps);

  if (!Number.isInteger(totalFrames) || totalFrames < 0) {
    throw new Error("INVALID_FRAMES");
  }

  const frames = totalFrames % base;
  const totalSeconds = Math.floor(totalFrames / base);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  // 7 → "07"
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}