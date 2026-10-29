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
