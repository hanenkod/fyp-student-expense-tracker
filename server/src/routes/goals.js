/**
 * Savings goal routes.
 *
 * Goal mutations that affect a user's balance (add, withdraw,
 * delete-with-refund) run inside a Prisma transaction so the goal
 * state and the bookkeeping transaction are written atomically.
 * Ownership is enforced via findOwned() in a single query.
 */
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";
import { findOwned } from "../lib/ownership.js";

const router = Router();
router.use(requireAuth);

const goalSchema = z.object({
  title: z.string().min(1).trim(),
  icon: z.string().optional(),
  target: z.number().positive(),
  saved: z.number().nonnegative().optional(),
  color: z.string().optional(),
});

/**
 * GET /api/goals
 * Lists the caller's goals, newest first.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(goals);
  })
);

/**
 * POST /api/goals
 * Creates a new goal. `icon` defaults to a generic 🎯 emoji when omitted.
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = goalSchema.parse(req.body);
    const goal = await prisma.savingsGoal.create({
      data: {
        userId: req.userId,
        title: data.title,
        icon: data.icon || "🎯",
        target: data.target,
        saved: data.saved || 0,
        color: data.color || null,
      },
    });
    res.status(201).json(goal);
  })
);

/**
 * PATCH /api/goals/:id
 * Partial update of an owned goal.
 */
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const data = goalSchema.partial().parse(req.body);

    const existing = await findOwned(prisma.savingsGoal, id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const updated = await prisma.savingsGoal.update({ where: { id }, data });
    res.json(updated);
  })
);

/**
 * DELETE /api/goals/:id
 * Deletes the goal. If the goal had money saved, that amount is
 * refunded as an income transaction so the user's totals stay correct.
 */
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const existing = await findOwned(prisma.savingsGoal, id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await prisma.$transaction(async (tx) => {
      if (existing.saved > 0) {
        await tx.transaction.create({
          data: {
            userId: req.userId,
            type: "income",
            name: `Refund: ${existing.title}`,
            category: "Savings",
            amount: existing.saved,
            date: new Date(),
            source: "savings",
            goalId: existing.id,
          },
        });
      }
      await tx.savingsGoal.delete({ where: { id } });
    });

    res.json({ ok: true, refunded: existing.saved });
  })
);

const moveSchema = z.object({ amount: z.number().positive() });

/**
 * POST /api/goals/:id/add
 * Moves money from the user's general balance into the goal. The
 * addition is capped so `saved` never exceeds `target`. A matching
 * expense transaction is created in the same DB transaction.
 */
router.post(
  "/:id/add",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { amount } = moveSchema.parse(req.body);
    const goal = await findOwned(prisma.savingsGoal, id, req.userId);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const remaining = Math.max(0, goal.target - goal.saved);
    const actual = Math.min(amount, remaining);
    if (actual <= 0) {
      return res.status(400).json({ error: "Goal already at target" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedGoal = await tx.savingsGoal.update({
        where: { id },
        data: { saved: { increment: actual } },
      });
      const newTx = await tx.transaction.create({
        data: {
          userId: req.userId,
          type: "expense",
          name: `Savings: ${goal.title}`,
          category: "Savings",
          amount: actual,
          date: new Date(),
          source: "savings",
          goalId: goal.id,
        },
      });
      return { goal: updatedGoal, transaction: newTx };
    });

    res.json(result);
  })
);

/**
 * POST /api/goals/:id/withdraw
 * Pulls money out of the goal back into the user's general balance.
 * Capped at the currently saved amount. A matching income transaction
 * is created in the same DB transaction.
 */
router.post(
  "/:id/withdraw",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { amount } = moveSchema.parse(req.body);
    const goal = await findOwned(prisma.savingsGoal, id, req.userId);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }
    if (goal.saved <= 0) {
      return res.status(400).json({ error: "Nothing to withdraw" });
    }

    const actual = Math.min(amount, goal.saved);

    const result = await prisma.$transaction(async (tx) => {
      const updatedGoal = await tx.savingsGoal.update({
        where: { id },
        data: { saved: { decrement: actual } },
      });
      const newTx = await tx.transaction.create({
        data: {
          userId: req.userId,
          type: "income",
          name: `Withdraw: ${goal.title}`,
          category: "Savings",
          amount: actual,
          date: new Date(),
          source: "savings",
          goalId: goal.id,
        },
      });
      return { goal: updatedGoal, transaction: newTx };
    });

    res.json(result);
  })
);

export default router;
