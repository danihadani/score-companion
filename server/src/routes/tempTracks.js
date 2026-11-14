import { Router } from "express";
import { prisma } from "../prisma.js";
import { logger } from "../logger.js";

export const tempTracksRouter = Router();

// DELETE /api/temp-tracks/:id - remove a temp track from its cue
tempTracksRouter.delete("/:id", async (req, res) => {
  const trackId = Number(req.params.id);
  if (!Number.isInteger(trackId)) {
    return res.status(404).json({ error: "TEMP_TRACK_NOT_FOUND" });
  }

  const existing = await prisma.tempTrack.findUnique({ where: { id: trackId } });
  if (!existing) {
    return res.status(404).json({ error: "TEMP_TRACK_NOT_FOUND" });
  }

  await prisma.tempTrack.delete({ where: { id: trackId } });
  logger.info(`Temp track deleted: id=${trackId} "${existing.title}" (cue ${existing.cueId})`);
  res.status(204).end();
});
