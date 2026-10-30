export default function ProjectList({ projects, onChanged }) {
  async function handleDelete(project) {
    if (!window.confirm(`Delete "${project.title}"?`)) return;

    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    onChanged();
  }

  async function handleRename(project) {
    const title = window.prompt("New title", project.title);
    if (title === null) return; // she clicked Cancel

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      // PUT sends the whole project: the new title, and everything else as it was.
      body: JSON.stringify({ title, director: project.director, fps: project.fps }),
    });

    if (!res.ok) {
      window.alert("The title can't be empty");
      return;
    }
    onChanged();
  }

  if (projects.length === 0) {
    return <p>No projects yet. Create the first one above.</p>;
  }

  return (
    <section>
      <h2>My projects</h2>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <strong>{project.title}</strong>
            {project.director && ` — ${project.director}`}
            {` · ${project.fps} fps`}
            <button onClick={() => handleRename(project)}>Rename</button>
            <button onClick={() => handleDelete(project)}>Delete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}