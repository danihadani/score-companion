import { useEffect, useState } from "react";

// A first page that only checks the client can reach the server.
export default function App() {
  const [status, setStatus] = useState("checking…");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("server is not reachable"));
  }, []);

  return (
    <main>
      <h1>Score Companion</h1>
      <p>Server: {status}</p>
    </main>
  );
}
