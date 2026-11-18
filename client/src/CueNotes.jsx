import { useEffect, useState } from "react";
import { apiFetch } from "./api.js";

const MESSAGES = {
  TEXT_REQUIRED: "Write something first",
  TEXT_TOO_LONG: "The note is too long",
};

// "2026-11-18T08:30:00.000Z" → "18 Nov 2026, 10:30" (in the viewer's time zone)
function formatDate(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// A cue's notes, newest first: what changed, and why.
export default function CueNotes({ cue }) {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function loadNotes() {
    try {
      const res = await apiFetch(`/api/cues/${cue.id}/notes`);
      const data = await res.json();
      if (!res.ok) {
        setError("The notes could not be loaded");
        return;
      }
      setNotes(data);
    } catch {
      setError("Can't reach the server. Please try again.");
    }
  }

  // Load the notes when a cue is opened, and again for another cue.
  useEffect(() => {
    loadNotes();
  }, [cue.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await apiFetch(`/api/cues/${cue.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(MESSAGES[data.error] || "The note could not be saved");
        return;
      }
    } catch {
      setError("Can't reach the server. Please try again.");
      return;
    }
    setText("");
    loadNotes();
  }

  async function handleDelete(note) {
    if (!window.confirm("Delete this note?")) return;

    try {
      const res = await apiFetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("The note could not be deleted");
        return;
      }
    } catch {
      setError("Can't reach the server. Please try again.");
      return;
    }
    loadNotes();
  }

  return (
    <div className="notes">
      <h4>Notes</h4>

      <form className="form" onSubmit={handleSubmit}>
        <label className="grow">
          New note
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Director: less drums in the chase, keep the strings"
            maxLength={2000}
            rows={2}
          />
        </label>
        <button type="submit">Add note</button>
      </form>

      {error && <p className="error">{error}</p>}

      {notes.length === 0 ? (
        <p className="empty">No notes yet.</p>
      ) : (
        <ul className="note-list">
          {notes.map((note) => (
            <li key={note.id} className="note">
              <div>
                <time className="meta" dateTime={note.createdAt}>
                  {formatDate(note.createdAt)}
                </time>
                <p>{note.text}</p>
              </div>
              <button
                className="link small"
                onClick={() => handleDelete(note)}
                aria-label="Delete note"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
