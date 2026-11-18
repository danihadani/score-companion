import { useEffect, useState } from "react";
import CreateCueForm from "./CreateCueForm.jsx";

const CUE_STATUSES = ["sketch", "sent", "approved", "recorded", "mixed"];

// A project's cues as a board: one column per status.
// Dragging a card to another column changes the cue's status.
export default function CueBoard({ project }) {
  const [cues, setCues] = useState([]);
  const [error, setError] = useState("");
  // The column a card is being dragged over, to highlight it
  const [overStatus, setOverStatus] = useState(null);
    // Totals from the server: { count, duration, byStatus: { sketch: {...}, ... } }
  const [summary, setSummary] = useState(null);

  async function loadCues() {
    try {
      const res = await fetch(`/api/projects/${project.id}/cues`);
      const data = await res.json();
      if (!res.ok) {
        setError("The cues could not be loaded");
        return;
      }
      setCues(data);
      setError("");
    } catch {
      setError("Can't reach the server. Please try again.");
    }
  }

   async function loadSummary() {
    try {
      const res = await fetch(`/api/projects/${project.id}/summary`);
      if (res.ok) setSummary(await res.json());
    } catch {
      // The cues show their own error; the totals just stay as they were.
    }
  }

  // Everything that changes the cues calls this, so the totals stay right.
  function reload() {
    loadCues();
    loadSummary();
  }

  // Load the cues and the totals once, when the board is shown.
  useEffect(() => {
    reload();
  }, [project.id]);

  async function moveCue(cueId, status) {
    const cue = cues.find((c) => c.id === cueId);
    if (!cue || cue.status === status) return;

    // Move the card right away, and put it back if the server refuses.
    const before = cues;
    setCues(cues.map((c) => (c.id === cueId ? { ...c, status } : c)));
    setError("");

    try {
      const res = await fetch(`/api/cues/${cueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cue, status }),
      });
      if (!res.ok) throw new Error("The server refused the move");
      loadSummary();
    } catch {
      setCues(before);
      setError(`"${cue.name}" could not be moved. Please try again.`);
    }
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}
        {summary && (
        <p className="summary">
          <strong className="tc">{summary.duration}</strong> of music in{" "}
          {summary.count} cues · {summary.byStatus.mixed.count} mixed
        </p>
      )}

      <div className="board">
        {CUE_STATUSES.map((status) => {
          const columnCues = cues.filter((cue) => cue.status === status);
          return (
            <section
              key={status}
              className={`column ${overStatus === status ? "over" : ""}`}
              // Without preventDefault the browser doesn't allow a drop here.
              onDragOver={(e) => {
                e.preventDefault();
                setOverStatus(status);
              }}
              onDragLeave={() => setOverStatus(null)}
              onDrop={(e) => {
                e.preventDefault();
                setOverStatus(null);
                moveCue(Number(e.dataTransfer.getData("text/plain")), status);
              }}
            >
              <h4 className="column-head">
                <span className={`status status-${status}`}>{status}</span>
                <span className="count">{columnCues.length}</span>
              </h4>
                            {summary && (
                <p className="column-time tc">
                  {summary.byStatus[status].duration}
                </p>
              )}

              {columnCues.map((cue) => (
                <article
                  key={cue.id}
                  className="cue-card"
                  draggable
                  // The card carries its cue's id while it is dragged.
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", String(cue.id))
                  }
                >
                  <strong>{cue.name}</strong>
                  <span className="tc">{cue.timecodeIn}</span>
                  <span className="meta">
                    {cue.duration}
                    {cue.scene && ` · ${cue.scene}`}
                  </span>
                </article>
              ))}
            </section>
          );
        })}
      </div>

      <CreateCueForm project={project} onCreated={reload} />
    </div>
  );
}