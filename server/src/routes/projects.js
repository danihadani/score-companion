import { Router } from "express";
import { prisma } from "../prisma.js";
import { validateProject } from "../validation/projects.js";

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
