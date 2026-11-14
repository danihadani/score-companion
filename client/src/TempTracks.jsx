import { useEffect, useState } from "react";

const MESSAGES = {
  TITLE_REQUIRED: "Please give the track a title",
  TITLE_TOO_LONG: "The title is too long",
  ARTIST_TOO_LONG: "The artist name is too long",
  INVALID_LINK: "The link must start with http:// or https://",
  NOTES_TOO_LONG: "The notes are too long",
};

// The temp tracks of one cue: the references the director liked,
// with a form to add another.
export default function TempTracks({ cue }) {
  const [tracks, setTracks] = useState([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  async function loadTracks() {
    try {
      const res = await fetch(`/api/cues/${cue.id}/temp-tracks`);
      const data = await res.json();
      if (!res.ok) {
        setError("The temp tracks could not be loaded");
        return;
      }
      setTracks(data);
    } catch {
      setError("Can't reach the server. Please try again.");
    }
  }

  // Load the tracks once, when the cue is opened.
  useEffect(() => {
    loadTracks();
  }, [cue.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    let res, data;
    try {
      res = await fetch(`/api/cues/${cue.id}/temp-tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, artist, link, notes }),
      });
      data = await res.json();
    } catch {
      setError("Can't reach the server. Please try again.");
      return;
    }

    if (!res.ok) {
      setError(MESSAGES[data.error] || "Something went wrong");
      return;
    }
    setTitle("");
    setArtist("");
    setLink("");
    setNotes("");
    loadTracks();
  }

  async function handleDelete(track) {
    if (!window.confirm(`Remove "${track.title}"?`)) return;

    try {
      const res = await fetch(`/api/temp-tracks/${track.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("The temp track could not be removed");
        return;
      }
    } catch {
      setError("Can't reach the server. Please try again.");
      return;
    }
    loadTracks();
  }

  return (
    <div className="temp-tracks">
      <h4>Temp tracks for {cue.name}</h4>

      {tracks.length === 0 ? (
        <p className="empty">No temp tracks yet.</p>
      ) : (
        <ul className="track-list">
          {tracks.map((track) => (
            <li key={track.id} className="track">
              <div>
                <strong>{track.title}</strong>
                {track.artist && (
                  <span className="meta"> · {track.artist}</span>
                )}
                {track.link && (
                  <>
                    {" · "}
                    {/* noopener: the opened page can't control this tab */}
                    <a
                      href={track.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open link
                    </a>
                  </>
                )}
                {track.notes && <p className="track-notes">{track.notes}</p>}
              </div>
              <button
                className="danger small"
                onClick={() => handleDelete(track)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="form track-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Artist
          <input value={artist} onChange={(e) => setArtist(e.target.value)} />
        </label>
        <label>
          Link
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://"
          />
        </label>
        <label className="wide">
          Notes
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What the director liked about it"
          />
        </label>
        <button type="submit">Add temp track</button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
