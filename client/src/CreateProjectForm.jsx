import { useState } from "react";

// Same list as the server. Kept here too, so the form can offer it.
const ALLOWED_FPS = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60];

const MESSAGES = {
  TITLE_REQUIRED: "Please enter the film's title",
   FPS_REQUIRED: "Please choose frame rate",
 INVALID_FPS: "Please add a valid frame rate"
};

export default function CreateProjectForm({onCreated}) {
  const [title, setTitle] = useState("");
  const [director, setDirector] = useState("");
  const [fps, setFps] = useState("24");
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCreated(null);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, director, fps }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(MESSAGES[data.error] || "Something went wrong");
      return;
    }
    setCreated(data);
    onCreated();
    setTitle("");
    setDirector("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>New project</h2>

      <label>
        Film title
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label>
        Director
        <input value={director} onChange={(e) => setDirector(e.target.value)} />
      </label>

      <label>
        Frame rate
        <select value={fps} onChange={(e) => setFps(e.target.value)}>
          {ALLOWED_FPS.map((rate) => (
            <option key={rate} value={rate}>
              {rate} fps
            </option>
          ))}
        </select>
      </label>

      <button type="submit">Create project</button>

      {error && <p>{error}</p>}
      {created && <p>Created “{created.title}”</p>}
    </form>
  );
}