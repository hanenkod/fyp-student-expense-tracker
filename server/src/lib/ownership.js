/**
 * Ownership helpers for resource routes.
 *
 * Every per-resource endpoint (transactions, scheduled payments,
 * goals) needs to fetch a row by id AND verify it belongs to the
 * caller. Doing this in two queries (findUnique → manual userId
 * check) leaves a tiny race window between the two reads and
 * duplicates the same boilerplate in every route file.
 *
 * `findOwned` collapses that into a single `findFirst` with both
 * filters baked into the WHERE clause. The caller decides what to
 * do when the row is missing — usually returning a 404, since we
 * intentionally don't distinguish "doesn't exist" from "exists but
 * not yours" (preventing resource-enumeration attacks).
 */

/**
 * Fetch a row by id only if it belongs to the given user.
 *
 * @param {object} model    A Prisma delegate (prisma.transaction, etc.)
 * @param {string} id       Row id to look up.
 * @param {string} userId   The expected owner.
 * @returns {Promise<object|null>}  The row, or null if missing/foreign.
 *
 * @example
 *   const tx = await findOwned(prisma.transaction, req.params.id, req.userId);
 *   if (!tx) return res.status(404).json({ error: "Transaction not found" });
 */
export const findOwned = (model, id, userId) =>
  model.findFirst({ where: { id, userId } });
