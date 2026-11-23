import { Link } from "react-router";
import { apiFetch } from "./api.js";

export default function ProjectList({ projects, onChanged }) {
  async function handleDelete(project) {
    if (!window.confirm(`Delete "${project.title}"?`)) return;

    await apiFetch(`/api/projects/${project.id}`, { method: "DELETE" });
    onChanged();
  }

  async function handleRename(project) {
    const title = window.prompt("New title", project.title);
    if (title === null) return; // she clicked Cancel

    const res = await apiFetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      // PUT sends the whole project: the new title, and everything else as it was.
      body: JSON.stringify({
        title,
        director: project.director,
        fps: project.fps,
      }),
    });

    if (!res.ok) {
      window.alert("The title can't be empty");
      return;
    }
    onChanged();
  }

  if (projects.length === 0) {
    return (
      <p className="empty">No projects yet. Create the first one above.</p>
    );
  }

  return (
    <section>
      <ul className="projects">
        {projects.map((project) => (
          <li key={project.id} className="card project">
            <div className="project-head">
              <div>
                <h3>
                  <Link to={`/projects/${project.id}`}>{project.title}</Link>
                </h3>
                <p className="meta">
                  {project.director && `${project.director} · `}
                  {project.fps} fps
                </p>
              </div>
              <div className="actions">
                <button
                  className="secondary"
                  onClick={() => handleRename(project)}
                >
                  Rename
                </button>
                <button
                  className="danger"
                  onClick={() => handleDelete(project)}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
