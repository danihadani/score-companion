import { Router } from "express";
import { prisma } from "../prisma.js";
import { validateDone } from "../validation/checklist.js";
import { logger } from "../logger.js";

export const checklistRouter = Router();

// PUT /api/checklist/:id - check or uncheck an item
checklistRouter.put("/:id", async (req, res) => {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId)) {
    return res.status(404).json({ error: "CHECKLIST_ITEM_NOT_FOUND" });
  }

  const existing = await prisma.checklistItem.findUnique({ where: { id: itemId } });
  if (!existing) {
    return res.status(404).json({ error: "CHECKLIST_ITEM_NOT_FOUND" });
  }

  let change;
  try {
    change = validateDone(req.body);
  } catch (err) {
    logger.warn(`Checklist item ${itemId} not updated: ${err.message}`);
    return res.status(400).json({ error: err.message });
  }

  const updated = await prisma.checklistItem.update({ where: { id: itemId }, data: change });
  const action = updated.done ? "checked" : "unchecked";
  logger.info(`Checklist item ${action}: "${updated.label}" (cue ${updated.cueId})`);
  res.json(updated);
});

// DELETE /api/checklist/:id - remove an item
checklistRouter.delete("/:id", async (req, res) => {
  const itemId = Number(req.params.id);
  if (!Number.isInteger(itemId)) {
    return res.status(404).json({ error: "CHECKLIST_ITEM_NOT_FOUND" });
  }

  const existing = await prisma.checklistItem.findUnique({ where: { id: itemId } });
  if (!existing) {
    return res.status(404).json({ error: "CHECKLIST_ITEM_NOT_FOUND" });
  }

  await prisma.checklistItem.delete({ where: { id: itemId } });
  logger.info(`Checklist item removed: "${existing.label}" (cue ${existing.cueId})`);
  res.status(204).end();
});
