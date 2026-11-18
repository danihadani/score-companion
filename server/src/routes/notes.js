import { Router } from "express";
import { prisma } from "../prisma.js";
import { logger } from "../logger.js";

export const notesRouter = Router();

// DELETE /api/notes/:id - delete a note
notesRouter.delete("/:id", async (req, res) => {
  const noteId = Number(req.params.id);
  if (!Number.isInteger(noteId)) {
    return res.status(404).json({ error: "NOTE_NOT_FOUND" });
  }

  const existing = await prisma.note.findFirst({
    where: { id: noteId, cue: { project: { userId: req.userId } } },
  });
  if (!existing) {
    return res.status(404).json({ error: "NOTE_NOT_FOUND" });
  }

  await prisma.note.delete({ where: { id: noteId } });
  logger.info(`Note deleted: id=${noteId} (cue ${existing.cueId})`);
  res.status(204).end();
});
