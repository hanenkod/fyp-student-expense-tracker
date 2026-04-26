import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import txRoutes from "./routes/transactions.js";
import spRoutes from "./routes/scheduled.js";
import goalRoutes from "./routes/goals.js";
import { errorHandler } from "./middleware/errors.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const ORIGIN = process.env.CORS_ORIGIN || "*";

// ── Global middleware ────────────────────────────────────────────────
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// Lightweight request log — handy during development.
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ── Health check ─────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ── API routes ───────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", txRoutes);
app.use("/api/scheduled", spRoutes);
app.use("/api/goals", goalRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found", path: req.path }));

// Error handler must come last.
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`POCKE API listening on http://localhost:${PORT}`);
  console.log(`CORS origin: ${ORIGIN}`);
});
