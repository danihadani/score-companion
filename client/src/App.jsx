import { useEffect, useState } from "react";
import CreateProjectForm from "./CreateProjectForm.jsx";
import ProjectList from "./ProjectList.jsx";

export default function App() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");

  async function loadProjects() {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (!res.ok) {
        setError("The projects could not be loaded");
        return;
      }
      setProjects(data);
      setError("");
    } catch {
      setError("Can't reach the server. Please try again.");
    }
  }

  // Load the list once, when the page opens.
  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <main>
      <header className="page-head">
        <h1>Score Companion</h1>
        <p className="tagline">Every cue in your film, from sketch to mix.</p>
      </header>
      {error && <p className="error">{error}</p>}
      <CreateProjectForm onCreated={loadProjects} />
      {!error && <ProjectList projects={projects} onChanged={loadProjects} />}
    </main>
  );
}
