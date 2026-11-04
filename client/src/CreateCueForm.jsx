import { useState } from "react";

const CUE_STATUSES = ["sketch", "sent", "approved", "recorded", "mixed"];

const MESSAGES = {
  NAME_REQUIRED: "Please give the cue a name, like 1m1",
  INVALID_TIMECODE: "Timecodes look like 01:00:00:00",
  TIMECODE_OUT_BEFORE_IN: "The cue must end after it starts",
  INVALID_STATUS: "Please choose a status",
};

export default function CreateCueForm({ project, onCreated }) {
  const [name, setName] = useState("");
  const [timecodeIn, setTimecodeIn] = useState("");
  const [timecodeOut, setTimecodeOut] = useState("");
  const [scene, setScene] = useState("");
  const [status, setStatus] = useState("sketch");
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCreated(null);

    let res, data;
    try {
      res = await fetch(`/api/projects/${project.id}/cues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timecodeIn, timecodeOut, scene, status }),
      });
      data = await res.json();
    } catch {
      setError("Can't reach the server. Please try again.");
      return;
    }

    if (!res.ok) {
      setError(MESSAGES[data.error] || "Something went wrong");
      return;
    }
    setCreated(data);
    onCreated();
    setName("");
    setTimecodeIn("");
    setTimecodeOut("");
    setScene("");
  }

  return (
    <form className="form cue-form" onSubmit={handleSubmit}>
      <h4>Add a cue</h4>

      <label>
        Cue Name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label>
        Timecode In
        <input
          value={timecodeIn}
          onChange={(e) => setTimecodeIn(e.target.value)}
          placeholder="01:00:00:00"
        />
      </label>

      <label>
        Timecode Out
        <input
          value={timecodeOut}
          onChange={(e) => setTimecodeOut(e.target.value)}
          placeholder="01:00:30:00"
        />
      </label>

      <label>
        Scene
        <input value={scene} onChange={(e) => setScene(e.target.value)} />
      </label>

      <label>
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {CUE_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <button type="submit">Create cue</button>

      {error && <p className="error">{error}</p>}
      {created && <p className="success">Added “{created.name}”</p>}
    </form>
  );
}
