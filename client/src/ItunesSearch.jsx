import { useState } from "react";

// Search iTunes (through our server) and pick a song.
// onPick(song) hands the chosen song back to the temp track form.
export default function ItunesSearch({ onPick }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // encodeURIComponent: "rock & roll" stays one search term
      const res = await fetch(`/api/itunes/search?term=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "TERM_REQUIRED"
            ? "Type a song or an artist"
            : "iTunes can't be reached right now",
        );
        return;
      }
      setResults(data);
      setSearched(true);
    } catch {
      setError("Can't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="itunes">
      <form className="form" onSubmit={handleSearch}>
        <label className="grow">
          Search iTunes
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Song or artist, e.g. Hans Zimmer Time"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {searched && results.length === 0 && <p className="empty">No songs found.</p>}

      {results.length > 0 && (
        <ul className="results">
          {results.map((song) => (
            <li key={song.trackId} className="result">
              <img src={song.artworkUrl} alt="" width="48" height="48" />
              <div className="result-text">
                <strong>{song.title}</strong>
                <span className="meta">{song.artist}</span>
              </div>
              {/* preload="none": nothing downloads until Play is pressed */}
              <audio controls preload="none" src={song.previewUrl} />
              <button
                type="button"
                className="secondary small"
                onClick={() => {
                  onPick(song);
                  setResults([]);
                  setSearched(false);
                }}
              >
                Use
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}