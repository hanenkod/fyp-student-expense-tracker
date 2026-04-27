/**
 * Authentication routes — registration and login.
 *
 * Passwords are stored as bcrypt hashes (cost factor 12). On success
 * each endpoint returns a JWT plus the public-safe user record.
 */
import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { asyncHandler } from "../middleware/errors.js";

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().trim().optional(),
});

/**
 * POST /api/auth/register
 * Creates a new user with a bcrypt-hashed password and returns a JWT.
 */
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, name } = credentialsSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hash, name: name || null },
    });

    const token = signToken(user.id);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboarded: user.onboarded,
      },
    });
  })
);

/**
 * POST /api/auth/login
 * Verifies credentials and returns a JWT.
 *
 * The error message for both "user not found" and "wrong password" is
 * intentionally identical to prevent email-enumeration attacks.
 */
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = credentialsSchema
      .pick({ email: true, password: true })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboarded: user.onboarded,
      },
    });
  })
);

export default router;
