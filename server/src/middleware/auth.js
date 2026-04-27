/**
 * Express middleware that protects authenticated routes.
 *
 * Reads `Authorization: Bearer <token>`, verifies the token, and on
 * success attaches `req.userId` for downstream handlers. Returns 401
 * for missing, malformed, or expired tokens.
 */
import { verifyToken } from "../lib/jwt.js";

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or malformed token" });
  }

  const payload = verifyToken(token);
  if (!payload?.sub) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.userId = payload.sub;
  next();
};
