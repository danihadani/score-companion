import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import CueList from "./CueList.jsx";
import CueBoard from "./CueBoard.jsx";
import { apiFetch } from "./api.js";

// One project's page: /projects/7
export default function ProjectPage() {
  // The :id from the address, as text: "7"
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");

  // Which view of the cues is shown: "board" or "table"
  const [view, setView] = useState("board");
  const [exportError, setExportError] = useState("");

  // Downloads the cue sheet. A plain <a href> wouldn't send the login token,
  // so the file is fetched with apiFetch, then handed to the browser to save.
  async function handleExport() {
    setExportError("");
    try {
      const res = await apiFetch(`/api/projects/${project.id}/cue-sheet`);
      if (!res.ok) {
        setExportError("The cue sheet could not be made");
        return;
      }
      const file = await res.blob();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.title} - cue sheet.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Can't reach the server. Please try again.");
    }
  }
  // Load the project when the page opens, and again if the id changes.
  useEffect(() => {
    async function loadProject() {
      try {
        const res = await apiFetch(`/api/projects/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(
            res.status === 404
              ? "This project doesn't exist"
              : "The project could not be loaded",
          );
          return;
        }
        setProject(data);
      } catch {
        setError("Can't reach the server. Please try again.");
      }
    }
    loadProject();
  }, [id]);

  return (
    <main>
      <Link to="/" className="back">
        ← All projects
      </Link>

      {error && <p className="error">{error}</p>}

      {project && (
        <>
          <header className="page-head">
            <h1>{project.title}</h1>
            <p className="tagline">
              {project.director && `${project.director} · `}
              {project.fps} fps
            </p>
          </header>
          <div className="view-switch">
            <button
              className={view === "board" ? "" : "secondary"}
              onClick={() => setView("board")}
            >
              Board
            </button>
            <button
              className={view === "table" ? "" : "secondary"}
              onClick={() => setView("table")}
            >
              Table
            </button>
            <button className="secondary export" onClick={handleExport}>
              Export cue sheet
            </button>
          </div>
          {exportError && <p className="error">{exportError}</p>}
          <section className="card">
            {view === "board" ? (
              <CueBoard project={project} />
            ) : (
              <CueList project={project} />
            )}
          </section>
        </>
      )}
    </main>
  );
}
