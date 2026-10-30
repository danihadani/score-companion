import { useEffect, useState } from "react";
import CreateProjectForm from "./CreateProjectForm.jsx";
import ProjectList from "./ProjectList.jsx";

export default function App() {
  const [projects, setProjects] = useState([]);

  async function loadProjects() {
    const res = await fetch("/api/projects");
    setProjects(await res.json());
  }

  // Load the list once, when the page opens.
  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <main>
      <h1>Score Companion</h1>
      <CreateProjectForm onCreated={loadProjects} />
      <ProjectList projects={projects} onChanged= {loadProjects} />
    </main>
  );
}