import { verifyToken } from "../lib/jwt.js";

/**
 * Express middleware that:
 *   1. Reads the JWT from the Authorization: Bearer <token> header.
 *   2. Verifies it.
 *   3. Attaches `req.userId` for downstream handlers.
 *
 * Returns 401 when no/invalid token is present.
 */
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
