/**
 * Centralised error handling for Express routes.
 *
 * Provides:
 *   - asyncHandler: a wrapper that forwards rejected promises to the
 *     error handler instead of crashing the process.
 *   - errorHandler: the final middleware that maps known error types
 *     (Zod validation, Prisma constraint violations) to appropriate
 *     HTTP status codes and falls back to 500 for anything unrecognised.
 */
import { ZodError } from "zod";

/**
 * Wrap async route handlers so thrown errors propagate to the error
 * middleware below. Without this, an unhandled rejection would crash
 * the Node process.
 *
 *   router.get("/x", asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Final error middleware. Translates known errors into HTTP responses;
 * everything else becomes a generic 500 with a console log for debugging.
 */
export const errorHandler = (err, req, res, _next) => {
  // Validation errors from zod schemas — surface the structured details
  // so the frontend can show field-level feedback.
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
  }

  // Prisma duplicate-key violation (e.g. trying to register an email
  // that already exists).
  if (err?.code === "P2002") {
    return res.status(409).json({
      error: "Resource already exists",
      target: err.meta?.target,
    });
  }

  // Prisma record-not-found (e.g. updating a row that no longer exists).
  if (err?.code === "P2025") {
    return res.status(404).json({ error: "Resource not found" });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
};
