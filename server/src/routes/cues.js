import { Router } from "express";
import { prisma } from "../prisma.js";
import { validateCue } from "../validation/cues.js";
import { logger } from "../logger.js";

export const cuesRouter = Router();

// PUT /api/cues/:id - update a cue
cuesRouter.put("/:id", async (req, res) => {
  const cueId = Number(req.params.id);
  if (!Number.isInteger(cueId)) {
    return res.status(404).json({ error: "CUE_NOT_FOUND" });
  }

  // The project comes along, because the timecodes are checked at its frame rate.
  const existing = await prisma.cue.findUnique({
    where: { id: cueId },
    include: { project: true },
  });
  if (!existing) {
    return res.status(404).json({ error: "CUE_NOT_FOUND" });
  }

  let cue;
  try {
    cue = validateCue(req.body, existing.project.fps);
  } catch (err) {
    logger.warn(`Cue ${cueId} not updated: ${err.message}`);
    return res.status(400).json({ error: err.message });
  }

  const updated = await prisma.cue.update({ where: { id: cueId }, data: cue });
  logger.info(`Cue updated: id=${updated.id} "${updated.name}" (status: ${updated.status})`);
  res.json(updated);
});

// DELETE /api/cues/:id - delete a cue
cuesRouter.delete("/:id", async (req, res) => {
  const cueId = Number(req.params.id);
  if (!Number.isInteger(cueId)) {
    return res.status(404).json({ error: "CUE_NOT_FOUND" });
  }

  const existing = await prisma.cue.findUnique({ where: { id: cueId } });
  if (!existing) {
    return res.status(404).json({ error: "CUE_NOT_FOUND" });
  }

  await prisma.cue.delete({ where: { id: cueId } });
  logger.info(`Cue deleted: id=${cueId} "${existing.name}"`);
  res.status(204).end();
});
