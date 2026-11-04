import { useEffect, useState } from "react";
import CreateCueForm from "./CreateCueForm.jsx";

const CUE_STATUSES = ["sketch", "sent", "approved", "recorded", "mixed"];

// A project's cues in film order, with a form to add more.
export default function CueList({ project }) {
  const [cues, setCues] = useState([]);
  const [error, setError] = useState("");

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

  // Load the cues once, when the project is shown.
  useEffect(() => {
    loadCues();
  }, [project.id]);

  async function handleStatusChange(cue, status) {
    // PUT sends the whole cue: the new status, and everything else as it was.
    const res = await fetch(`/api/cues/${cue.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...cue, status }),
    });
    if (!res.ok) {
      setError("The status could not be saved");
      return;
    }
    loadCues();
  }

  async function handleDelete(cue) {
    if (!window.confirm(`Delete cue "${cue.name}"?`)) return;

    await fetch(`/api/cues/${cue.id}`, { method: "DELETE" });
    loadCues();
  }

  return (
    <div>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!error && (cues.length === 0 ? (
        <p>No cues yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Cue</th>
              <th>In</th>
              <th>Out</th>
              <th>Duration</th>
              <th>Scene</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cues.map((cue) => (
              <tr key={cue.id}>
                <td>{cue.name}</td>
                <td>{cue.timecodeIn}</td>
                <td>{cue.timecodeOut}</td>
                <td>{cue.duration}</td>
                <td>{cue.scene}</td>
                <td>
                  <select
                    value={cue.status}
                    onChange={(e) => handleStatusChange(cue, e.target.value)}
                  >
                    {CUE_STATUSES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button onClick={() => handleDelete(cue)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
      )}

      <CreateCueForm project={project} onCreated={loadCues} />
    </div>
  );
}
