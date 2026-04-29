/**
 * JSON parsing helpers that never throw.
 *
 * The pre-backend version of POCKE persisted user data as JSON
 * strings, and the server still stores `settingsJson` and the two
 * `customXxxCategories` columns the same way. Components that read
 * those fields would crash if the value was ever malformed (a
 * partially written localStorage entry, a hand-edited row, etc.),
 * so every call site historically wrapped JSON.parse in its own
 * try/catch — copy-pasted in five different files.
 *
 * These two helpers replace those copies. Use `safeJSON` for objects
 * and `safeArray` when the parsed value is expected to be a list.
 */

/**
 * Parse a JSON string. Returns `fallback` (default `null`) if the
 * input is null/undefined or fails to parse.
 *
 * @param {string|null|undefined} raw
 * @param {*} [fallback=null]
 * @returns {*} parsed value or fallback
 */
export const safeJSON = (raw, fallback = null) => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

/**
 * Parse a JSON string that should contain an array. Returns `[]` for
 * null, undefined, malformed JSON, or any non-array value (a string,
 * number, object, etc.).
 *
 * @param {string|null|undefined} raw
 * @returns {Array}
 */
export const safeArray = (raw) => {
  const parsed = safeJSON(raw, null);
  return Array.isArray(parsed) ? parsed : [];
};
