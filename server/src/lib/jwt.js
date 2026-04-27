/**
 * JSON Web Token helpers.
 *
 * Tokens carry only the user id in the `sub` claim. Every authenticated
 * request looks the user up by id, so we never have stale data baked
 * into a token (such as a name change that hasn't propagated).
 */
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "168h";

if (!SECRET) {
  throw new Error("JWT_SECRET env var is required");
}

/**
 * Sign a JWT for the given user id.
 *
 * @param {string} userId
 * @returns {string} signed JWT
 */
export const signToken = (userId) =>
  jwt.sign({ sub: userId }, SECRET, { expiresIn: EXPIRES_IN });

/**
 * Verify a JWT and return its decoded payload.
 *
 * @param {string} token
 * @returns {object|null} decoded payload, or null if the token is
 *   missing, malformed, or expired.
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
};
