import { useEffect, useState } from "react";
import { apiFetch } from "./api.js";

const MESSAGES = {
  LABEL_REQUIRED: "Write what the cue still needs",
  LABEL_TOO_LONG: "That's too long for a checklist item",
};

// What one cue still needs. onChanged() tells the board to update the card.
export default function Checklist({ cue, onChanged }) {
  const [items, setItems] = useState([]);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  async function loadItems() {
    try {
      const res = await apiFetch(`/api/cues/${cue.id}/checklist`);
      const data = await res.json();
      if (!res.ok) {
        setError("The checklist could not be loaded");
        return;
      }
      setItems(data);
    } catch {
      setError("Can't reach the server. Please try again.");
    }
  }

  // Load the checklist when a cue is opened, and again for another cue.
  useEffect(() => {
    loadItems();
  }, [cue.id]);

  // Sends a request, then reloads the list and the card. Shows an error if it fails.
  async function send(url, options, failMessage) {
    setError("");
    try {
      const res = await apiFetch(url, options);
      if (!res.ok) {
        const data = await res.json();
        setError(MESSAGES[data.error] || failMessage);
        return false;
      }
    } catch {
      setError("Can't reach the server. Please try again.");
      return false;
    }
    loadItems();
    onChanged();
    return true;
  }

  function handleToggle(item) {
    send(
      `/api/checklist/${item.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !item.done }),
      },
      "The item could not be saved",
    );
  }

  function handleRemove(item) {
    send(
      `/api/checklist/${item.id}`,
      { method: "DELETE" },
      "The item could not be removed",
    );
  }

  async function handleAdd(e) {
    e.preventDefault();
    const added = await send(
      `/api/cues/${cue.id}/checklist`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      },
      "The item could not be added",
    );
    if (added) setLabel("");
  }

  const done = items.filter((item) => item.done).length;

  return (
    <div className="checklist">
      <h4>
        What it still needs{" "}
        <span className="count">
          {done}/{items.length}
        </span>
      </h4>

      <ul className="checklist-items">
        {items.map((item) => (
          <li key={item.id} className={item.done ? "done" : ""}>
            <label className="check">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => handleToggle(item)}
              />
              {item.label}
            </label>
            <button
              className="link small"
              onClick={() => handleRemove(item)}
              aria-label={`Remove ${item.label}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <form className="form" onSubmit={handleAdd}>
        <label className="grow">
          Add an item
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Choir session"
            maxLength={100}
          />
        </label>
        <button type="submit" className="secondary">
          Add
        </button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
