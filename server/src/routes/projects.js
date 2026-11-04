import { Router } from "express";
import { prisma } from "../prisma.js";
import { validateProject } from "../validation/projects.js";
import { validateCue } from "../validation/cues.js";
import { durationTimecode } from "../timecode.js";

export const projectsRouter = Router();

// POST /api/projects - create a project
projectsRouter.post("/", async (req, res) => {
  let project;
  try {
    project = validateProject(req.body);
  } catch (err) {
    // Bad input from the client: answer 400 with the error code.
    return res.status(400).json({ error: err.message });
  }

  const saved = await prisma.project.create({ data: project });
  res.status(201).json(saved);
});

// GET /api/projects - all projects, newest first
projectsRouter.get("/", async (req, res) => {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  res.json(projects);
});

// DELETE /api/projects/:id - delete one project
projectsRouter.delete("/:id", async (req, res) => {
  const projectId = Number(req.params.id);

  if (!Number.isInteger(projectId)) {
    return res.status(404).json({ error: "PROJECT_NOT_FOUND" });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return res.status(404).json({ error: "PROJECT_NOT_FOUND" });
  }

  await prisma.project.delete({ where: { id: projectId } });

  return res.status(204).end();
});

// PUT /api/projects/:id - update a project
projectsRouter.put("/:id", async (req, res) => {
  const projectId = Number(req.params.id);

  if (!Number.isInteger(projectId)) {
    return res.status(404).json({ error: "PROJECT_NOT_FOUND" });
  }
  let project;
  try {
    project = validateProject(req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existing) {
    return res.status(404).json({ error: "PROJECT_NOT_FOUND" });
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: project,
  });
  res.json(updated);
});

// POST /api/projects/:id/cues - add a cue to a project
projectsRouter.post("/:id/cues", async (req, res) => {
  const projectId = Number(req.params.id);

  if (!Number.isInteger(projectId)) {
    return res.status(404).json({ error: "PROJECT_NOT_FOUND" });
  }
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return res.status(404).json({ error: "PROJECT_NOT_FOUND" });
  }

  let cue;
  try {
    cue = validateCue(req.body, project.fps);
  } catch (err) {
    // Bad input from the client: answer 400 with the error code.
    return res.status(400).json({ error: err.message });
  }
  const saved = await prisma.cue.create({
    data: { ...cue, projectId: project.id },
  });
  res.status(201).json(saved);
});

// GET /api/projects/:id/cues - a project's cues in film order, with their durations
projectsRouter.get("/:id/cues", async (req, res) => {
  const projectId = Number(req.params.id);
  if (!Number.isInteger(projectId)) {
    return res.status(404).json({ error: "PROJECT_NOT_FOUND" });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ error: "PROJECT_NOT_FOUND" });
  }

  // Timecodes are always HH:MM:SS:FF, so sorting them as text is film order.
  const cues = await prisma.cue.findMany({
    where: { projectId },
    orderBy: { timecodeIn: "asc" },
  });

  res.json(
    cues.map((cue) => ({
      ...cue,
      duration: durationTimecode(cue.timecodeIn, cue.timecodeOut, project.fps),
    })),
  );
});
