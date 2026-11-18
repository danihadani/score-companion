import { Router } from "express";
import { prisma } from "../prisma.js";
import { validateProject } from "../validation/projects.js";
import { CUE_STATUSES, validateCue } from "../validation/cues.js";
import { DEFAULT_CHECKLIST } from "../validation/checklist.js";
import { durationTimecode, totalDuration } from "../timecode.js";

import { logger } from "../logger.js";

export const projectsRouter = Router();

// POST /api/projects - create a project
projectsRouter.post("/", async (req, res) => {
  let project;
  try {
    project = validateProject(req.body);
  } catch (err) {
    logger.warn(`Project refused: ${err.message}`);
    // Bad input from the client: answer 400 with the error code.
    return res.status(400).json({ error: err.message });
  }

  const saved = await prisma.project.create({ data: project });
  logger.info(`Project created: id=${saved.id} "${saved.title}" (${saved.fps} fps)`);
  res.status(201).json(saved);
});

// GET /api/projects - all projects, newest first
projectsRouter.get("/", async (req, res) => {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  res.json(projects);
});

// GET /api/projects/:id - specific project

projectsRouter.get("/:id", async (req, res) => {
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

  return res.json(project);
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
  logger.info(`Project deleted: id=${projectId} "${project.title}"`);

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
    logger.warn(`Project ${projectId} not updated: ${err.message}`);
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
  logger.info(`Project updated: id=${updated.id} "${updated.title}"`);
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
    logger.warn(`Cue refused for project ${project.id}: ${err.message}`);
    // Bad input from the client: answer 400 with the error code.
    return res.status(400).json({ error: err.message });
  }
  // Every new cue starts with the default checklist (nested create).
  const saved = await prisma.cue.create({
    data: {
      ...cue,
      projectId: project.id,
      checklist: {
        create: DEFAULT_CHECKLIST.map((label, position) => ({ label, position })),
      },
    },
  });
  logger.info(`Cue added: id=${saved.id} "${saved.name}" to project ${project.id}`);
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

  // The checklist comes along, only to count how much of it is done.
  const cues = await prisma.cue.findMany({
    where: { projectId },
    orderBy: { timecodeIn: "asc" },
    include: { checklist: { select: { done: true } } },
  });

  res.json(
    cues.map(({ checklist, ...cue }) => ({
      ...cue,
      duration: durationTimecode(cue.timecodeIn, cue.timecodeOut, project.fps),
      checklistDone: checklist.filter((item) => item.done).length,
      checklistTotal: checklist.length,
    })),
  );

  res.json(
    cues.map((cue) => ({
      ...cue,
      duration: durationTimecode(cue.timecodeIn, cue.timecodeOut, project.fps),
    })),
  );
});

// GET /api/projects/:id/summary - how much music, overall and per status
projectsRouter.get("/:id/summary", async (req, res) => {
  const projectId = Number(req.params.id);
  if (!Number.isInteger(projectId)) {
    return res.status(404).json({ error: "PROJECT_NOT_FOUND" });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return res.status(404).json({ error: "PROJECT_NOT_FOUND" });
  }

  const cues = await prisma.cue.findMany({ where: { projectId } });

  const byStatus = {};
  for (const status of CUE_STATUSES) {
    const statusCues = cues.filter((cue) => cue.status === status);
    byStatus[status] = {
      count: statusCues.length,
      duration: totalDuration(statusCues, project.fps),
    };
  }

  res.json({
    count: cues.length,
    duration: totalDuration(cues, project.fps),
    byStatus,
  });
});
