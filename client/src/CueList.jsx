import { Fragment, useEffect, useState } from "react";
import CreateCueForm from "./CreateCueForm.jsx";
import TempTracks from "./TempTracks.jsx";

const CUE_STATUSES = ["sketch", "sent", "approved", "recorded", "mixed"];

// A project's cues in film order, with a form to add more.
export default function CueList({ project }) {
  const [cues, setCues] = useState([]);
  const [error, setError] = useState("");
  // The cue whose temp tracks are open, or null when none is.
  const [openCueId, setOpenCueId] = useState(null);

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
      {error && <p className="error">{error}</p>}

      {!error &&
        (cues.length === 0 ? (
          <p className="empty">No cues yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="cues">
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
                  <Fragment key={cue.id}>
                    <tr>
                      <td className="cue-name">{cue.name}</td>
                      <td className="tc">{cue.timecodeIn}</td>
                      <td className="tc">{cue.timecodeOut}</td>
                      <td className="tc">{cue.duration}</td>
                      <td>{cue.scene}</td>
                      <td>
                        <select
                          className={`status status-${cue.status}`}
                          value={cue.status}
                          onChange={(e) =>
                            handleStatusChange(cue, e.target.value)
                          }
                        >
                          {CUE_STATUSES.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="row-actions">
                        <button
                          className="secondary small"
                          onClick={() =>
                            setOpenCueId(openCueId === cue.id ? null : cue.id)
                          }
                        >
                          {openCueId === cue.id ? "Hide temps" : "Temps"}
                        </button>
                        <button
                          className="danger small"
                          onClick={() => handleDelete(cue)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {openCueId === cue.id && (
                      <tr className="temps-row">
                        <td colSpan={7}>
                          <TempTracks cue={cue} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      <CreateCueForm project={project} onCreated={loadCues} />
    </div>
  );
}
