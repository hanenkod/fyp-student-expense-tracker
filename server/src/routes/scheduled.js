import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";

const router = Router();
router.use(requireAuth);

const spSchema = z.object({
  name: z.string().min(1).trim(),
  amount: z.number().positive(),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  startDate: z.string(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const items = await prisma.scheduledPayment.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = spSchema.parse(req.body);
    const sp = await prisma.scheduledPayment.create({
      data: {
        userId: req.userId,
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        startDate: new Date(data.startDate),
      },
    });
    res.status(201).json(sp);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const existing = await prisma.scheduledPayment.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: "Scheduled payment not found" });
    }
    await prisma.scheduledPayment.delete({ where: { id } });
    res.json({ ok: true });
  })
);

export default router;
