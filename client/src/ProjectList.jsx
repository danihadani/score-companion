export default function ProjectList({ projects }) {
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
          </li>
        ))}
      </ul>
    </section>
  );
}