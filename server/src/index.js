/**
 * POCKE API — Express application entry point.
 *
 * Wires global middleware (CORS, JSON body parsing, request logging),
 * mounts the route modules, then starts the HTTP listener.
 */
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

// CORS allows the frontend dev server (default http://localhost:5173) to call us.
app.use(cors({ origin: ORIGIN, credentials: true }));

// Limit request body to 1 MB — protects against accidental huge payloads.
app.use(express.json({ limit: "1mb" }));

// Lightweight request log; useful while developing, easy to remove or replace
// with a proper logger such as morgan or pino in production.
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health-check endpoint used by the frontend startup banner and by uptime
// monitors. Intentionally not behind auth.
app.get("/health", (_req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// API routes. All mounted under /api/<resource>.
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", txRoutes);
app.use("/api/scheduled", spRoutes);
app.use("/api/goals", goalRoutes);

// Catch-all 404 for unknown routes.
app.use((req, res) =>
  res.status(404).json({ error: "Not found", path: req.path })
);

// Centralised error handler must be the last middleware on the stack.
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`POCKE API listening on http://localhost:${PORT}`);
  console.log(`CORS origin: ${ORIGIN}`);
});
