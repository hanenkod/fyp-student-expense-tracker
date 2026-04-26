import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "168h";

if (!SECRET) {
  throw new Error("JWT_SECRET env var is required");
}

/**
 * Sign a JWT for a given user id.
 * Token payload is intentionally minimal — we look up the user by id
 * on every request, so no stale data ends up in tokens.
 */
export const signToken = (userId) =>
  jwt.sign({ sub: userId }, SECRET, { expiresIn: EXPIRES_IN });

/**
 * Verify a JWT and return its decoded payload, or null if invalid/expired.
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
};
