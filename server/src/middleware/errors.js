import { ZodError } from "zod";

/**
 * Wrap async route handlers so thrown errors propagate to the error
 * middleware below instead of crashing the process.
 *   router.get("/x", asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Final error middleware. Translates known errors into appropriate HTTP
 * codes; everything else becomes a 500.
 */
export const errorHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
  }

  // Prisma duplicate-key violation
  if (err?.code === "P2002") {
    return res.status(409).json({
      error: "Resource already exists",
      target: err.meta?.target,
    });
  }

  // Prisma record-not-found
  if (err?.code === "P2025") {
    return res.status(404).json({ error: "Resource not found" });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
};
