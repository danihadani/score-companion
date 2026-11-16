import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import CueList from "./CueList.jsx";

// One project's page: /projects/7
export default function ProjectPage() {
  // The :id from the address, as text: "7"
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");

  // Load the project when the page opens, and again if the id changes.
  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${id}`);
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
          <section className="card">
            <CueList project={project} />
          </section>
        </>
      )}
    </main>
  );
}