/**
 * Transaction CRUD routes.
 *
 * Every endpoint requires authentication and only operates on rows
 * owned by the calling user — even on PATCH/DELETE we double-check
 * the row's userId before mutating it.
 */
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";

const router = Router();
router.use(requireAuth);

const txSchema = z.object({
  type: z.enum(["expense", "income"]),
  name: z.string().min(1).trim(),
  category: z.string().min(1).trim(),
  amount: z.number().positive(),
  date: z.string(), // ISO 8601 string from the frontend
  source: z.string().optional(),
  goalId: z.string().optional(),
});

/**
 * GET /api/transactions
 * Returns every transaction belonging to the user, newest first.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { date: "desc" },
    });
    res.json(transactions);
  })
);

/**
 * POST /api/transactions
 * Creates a new transaction.
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = txSchema.parse(req.body);
    const tx = await prisma.transaction.create({
      data: {
        userId: req.userId,
        type: data.type,
        name: data.name,
        category: data.category,
        amount: data.amount,
        date: new Date(data.date),
        source: data.source || null,
        goalId: data.goalId || null,
      },
    });
    res.status(201).json(tx);
  })
);

/**
 * PATCH /api/transactions/:id
 * Partial update. Only the row owner may patch.
 */
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const data = txSchema.partial().parse(req.body);

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
    res.json(updated);
  })
);

/**
 * DELETE /api/transactions/:id
 * Removes a single transaction owned by the caller.
 */
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    await prisma.transaction.delete({ where: { id } });
    res.json({ ok: true });
  })
);

export default router;
