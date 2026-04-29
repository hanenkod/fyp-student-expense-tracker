/**
 * Calendar-aware date helpers.
 *
 * The two functions below replace logic that was previously inlined
 * across four pages (Dashboard, Profile, WhatIf, TransactionList) and
 * two onboarding helpers. Centralising them removes copy-paste drift
 * — earlier versions of the project disagreed on whether "today"
 * counts as "1 day left" or "0 days left", which cascaded into
 * Safe-to-Spend rounding bugs.
 */

/**
 * True if `value` (a Date or anything `new Date(value)` accepts) falls
 * within the same calendar month and year as `reference` (defaults to
 * now).
 *
 * @param {Date|string|number} value
 * @param {Date} [reference=new Date()]
 * @returns {boolean}
 */
export const isInCurrentMonth = (value, reference = new Date()) => {
  const d = value instanceof Date ? value : new Date(value);
  return (
    d.getMonth() === reference.getMonth() &&
    d.getFullYear() === reference.getFullYear()
  );
};

/**
 * Number of days remaining in the current month, *including today*.
 *
 * On the last day of the month this returns 1, not 0 — the user can
 * still spend money today. Used by the Safe-to-Spend formula and by
 * the onboarding preview.
 *
 * @param {Date} [reference=new Date()]
 * @returns {number}
 */
export const getDaysLeftInMonth = (reference = new Date()) => {
  const lastDay = new Date(
    reference.getFullYear(),
    reference.getMonth() + 1,
    0
  ).getDate();
  return lastDay - reference.getDate() + 1;
};

/**
 * Total number of days in the current month.
 *
 * @param {Date} [reference=new Date()]
 * @returns {number}
 */
export const getDaysInMonth = (reference = new Date()) =>
  new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
