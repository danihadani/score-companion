// ============================================================
// A cue sheet: every cue of a film, in film order, as a CSV file
// that opens in Excel, Numbers or Google Sheets.
// ============================================================
import { durationTimecode, totalDuration } from "./timecode.js";

// One value, made safe for a CSV cell.
export function csvCell(value) {
  let text = value === null || value === undefined ? "" : String(value);

  // A cell that starts with = + - or @ is run as a formula by Excel.
  // A scene called '=HYPERLINK("http://evil...")' would become a live link,
  // so such a cell gets a ' in front, which makes it plain text.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;

  // Commas, quotes and line breaks are allowed inside quotes,
  // with every " written twice.
  if (/[",\n\r]/.test(text)) text = `"${text.replaceAll('"', '""')}"`;
  return text;
}

// Rows of values → the text of a CSV file, one line per row.
export function toCsv(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

// A project and its cues (in film order) → the cue sheet as CSV.
export function cueSheet(project, cues) {
  const rows = [
    ["Cue", "Scene", "Timecode In", "Timecode Out", "Duration", "Status"],
    ...cues.map((cue) => [
      cue.name,
      cue.scene,
      cue.timecodeIn,
      cue.timecodeOut,
      durationTimecode(cue.timecodeIn, cue.timecodeOut, project.fps),
      cue.status,
    ]),
    [],
    ["Total music", "", "", "", totalDuration(cues, project.fps), `${cues.length} cues`],
  ];
  return toCsv(rows);
}
