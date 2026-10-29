// ============================================================
// The Express app itself, without app.listen().
// Keeping listen() in server.js lets the tests import the app
// and send it requests without opening a real port.
// ============================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import morgan from "morgan";
import { projectsRouter } from "./routes/projects.js";

import { logger } from "./logger.js";

export const app = express();

/******************** General Middleware ********************/
app.use(express.json());

// One log line for every request that reaches the server.
app.use(
  morgan(":method :url :status - :response-time ms", {
    stream: { write: (line) => logger.info(line.trim()) },
  }),
);

/******************** API Routes ********************/
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/projects", projectsRouter);

// Any /api address that no route above answered.
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

/******************** The React Client ********************/
// In Docker, the built client is copied into server/public and
// Express serves it. In development, Vite serves it instead.
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

/******************** Errors ********************/
// Express sends every error thrown in a route here.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Errors from express itself (like broken JSON) carry their own
  // 4xx status. Anything else is a bug on our side.
  if (err.status >= 400 && err.status < 500) {
    logger.warn(`${req.method} ${req.url} - ${err.message}`);
    return res.status(err.status).json({ error: err.message });
  }

  logger.error(`${req.method} ${req.url} - ${err.stack}`);
  res.status(500).json({ error: "Something went wrong on the server" });
});
