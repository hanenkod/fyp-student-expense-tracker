/**
 * User account routes.
 *
 * Every endpoint here requires authentication. Operations are scoped
 * to the calling user's record; we never expose another user's data.
 */
import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";

const router = Router();

router.use(requireAuth);

/**
 * Field whitelist used by every "return user" response so we never
 * accidentally leak the password hash.
 */
const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  name: true,
  income: true,
  expenses: true,
  onboarded: true,
  settingsJson: true,
  customExpenseCategories: true,
  customIncomeCategories: true,
  createdAt: true,
};

/**
 * GET /api/users/me
 * Returns the authenticated user's profile (without password).
 */
router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: PUBLIC_USER_FIELDS,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  })
);

const updateProfileSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  income: z.number().nonnegative().optional(),
  expenses: z.number().nonnegative().optional(),
  onboarded: z.boolean().optional(),
  settingsJson: z.string().optional(),
  customExpenseCategories: z.string().optional(),
  customIncomeCategories: z.string().optional(),
});

/**
 * PATCH /api/users/me
 * Partial update of profile fields. Email collisions surface as 409
 * via the Prisma P2002 handler in errors.js.
 */
router.patch(
  "/me",
  asyncHandler(async (req, res) => {
    const data = updateProfileSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: PUBLIC_USER_FIELDS,
    });
    res.json(updated);
  })
);

const passwordSchema = z.object({
  current: z.string(),
  new: z.string().min(6),
});

/**
 * POST /api/users/me/password
 * Verifies the current password, then writes a new bcrypt hash.
 */
router.post(
  "/me/password",
  asyncHandler(async (req, res) => {
    const { current, new: newPassword } = passwordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(current, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hash },
    });
    res.json({ ok: true });
  })
);

/**
 * DELETE /api/users/me
 * Permanently deletes the user's account and all related rows.
 * Cascades are configured on the relations in schema.prisma.
 */
router.delete(
  "/me",
  asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ ok: true });
  })
);

/**
 * Schema for the one-shot LocalStorage migration payload.
 *
 * All keys are optional so legacy users with partial state can still
 * migrate cleanly. The frontend only sends fields that actually exist
 * in their browser.
 */
const migrateSchema = z.object({
  onboarding: z
    .object({
      income: z.number().nonnegative().optional(),
      expenses: z.number().nonnegative().optional(),
      completed: z.boolean().optional(),
    })
    .optional(),
  settings: z.any().optional(),
  customExpenseCategories: z.array(z.string()).optional(),
  customIncomeCategories: z.array(z.string()).optional(),
  transactions: z
    .array(
      z.object({
        type: z.enum(["expense", "income"]),
        name: z.string(),
        category: z.string(),
        amount: z.number(),
        date: z.string(),
        source: z.string().optional(),
        goalId: z.string().optional(),
      })
    )
    .optional(),
  scheduledPayments: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number(),
        frequency: z.enum(["weekly", "monthly", "yearly"]),
        startDate: z.string(),
      })
    )
    .optional(),
  goals: z
    .array(
      z.object({
        title: z.string(),
        icon: z.string().optional(),
        target: z.number().nonnegative(),
        saved: z.number().nonnegative().optional(),
        color: z.string().optional(),
      })
    )
    .optional(),
});

/**
 * POST /api/users/me/migrate
 * One-shot import of LocalStorage data sent by the frontend after the
 * first login post-backend release. The whole import runs inside a
 * single Prisma transaction so a partial failure (e.g. one bad row)
 * leaves the user with no half-imported data.
 */
router.post(
  "/me/migrate",
  asyncHandler(async (req, res) => {
    const payload = migrateSchema.parse(req.body);

    await prisma.$transaction(async (tx) => {
      // Build the user-record patch from whichever optional fields
      // were included in the payload.
      const updates = {};
      if (payload.onboarding?.income !== undefined) {
        updates.income = payload.onboarding.income;
      }
      if (payload.onboarding?.expenses !== undefined) {
        updates.expenses = payload.onboarding.expenses;
      }
      if (payload.onboarding?.completed) {
        updates.onboarded = true;
      }
      if (payload.settings) {
        updates.settingsJson = JSON.stringify(payload.settings);
      }
      if (payload.customExpenseCategories) {
        updates.customExpenseCategories = JSON.stringify(
          payload.customExpenseCategories
        );
      }
      if (payload.customIncomeCategories) {
        updates.customIncomeCategories = JSON.stringify(
          payload.customIncomeCategories
        );
      }
      if (Object.keys(updates).length > 0) {
        await tx.user.update({ where: { id: req.userId }, data: updates });
      }

      if (payload.transactions?.length) {
        await tx.transaction.createMany({
          data: payload.transactions.map((t) => ({
            userId: req.userId,
            type: t.type,
            name: t.name,
            category: t.category,
            amount: t.amount,
            date: new Date(t.date),
            source: t.source || null,
            goalId: t.goalId || null,
          })),
        });
      }

      if (payload.scheduledPayments?.length) {
        await tx.scheduledPayment.createMany({
          data: payload.scheduledPayments.map((p) => ({
            userId: req.userId,
            name: p.name,
            amount: p.amount,
            frequency: p.frequency,
            startDate: new Date(p.startDate),
          })),
        });
      }

      if (payload.goals?.length) {
        await tx.savingsGoal.createMany({
          data: payload.goals.map((g) => ({
            userId: req.userId,
            title: g.title,
            icon: g.icon || "🎯",
            target: g.target,
            saved: g.saved || 0,
            color: g.color || null,
          })),
        });
      }
    });

    res.json({ ok: true });
  })
);

export default router;
