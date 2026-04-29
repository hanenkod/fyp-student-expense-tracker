/**
 * One-shot migration of LocalStorage data to the backend.
 *
 * Pre-backend versions of POCKE stored everything in LocalStorage. The
 * very first time this browser logs into the new backend, this helper
 * uploads the existing legacy data so it isn't lost.
 *
 * The migration is per-browser, not per-user. Once it has run, a
 * global flag `pockeLegacyMigrated` is written and the helper becomes
 * a no-op for every subsequent login or registration. This prevents
 * legacy data being re-imported into freshly registered accounts that
 * happen to be created in the same browser.
 */
import { api } from "./api.js";

const MIGRATION_FLAG = "pockeLegacyMigrated";
const LEGACY_PER_USER_PREFIX = "pockeMigrated:";

/**
 * Read a JSON value from LocalStorage, returning null if the key is
 * missing or the contents are corrupt.
 */
/**
 * Read and parse a JSON value from LocalStorage by key. Returns null
 * if the key is missing or the contents fail to parse.
 *
 * Note: this is intentionally separate from `safeJSON` in utils/json
 * (which takes a raw string). Keeping it here as a key-aware helper
 * means the migration code reads more like a series of named lookups.
 */
const loadJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Treat any leftover `pockeMigrated:<userId>` flag from the previous
 * version of this code as proof that migration already happened in
 * this browser. Without this check, accounts that were already
 * migrated under the old per-user scheme would be migrated a second
 * time when the new code first runs.
 */
const hasLegacyPerUserFlag = () => {
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(LEGACY_PER_USER_PREFIX)) return true;
  }
  return false;
};

/**
 * Run the migration if (and only if) it hasn't been run in this
 * browser yet. Safe to call on every login.
 */
export const migrateLocalStorageIfNeeded = async () => {
  if (localStorage.getItem(MIGRATION_FLAG)) return;
  if (hasLegacyPerUserFlag()) {
    // Already done under the old scheme — set the new flag so we
    // never check again, and exit.
    localStorage.setItem(MIGRATION_FLAG, "legacy");
    return;
  }

  const onboarding = loadJSON("pockeOnboarding");
  const settings = loadJSON("pockeSettings");
  const customExpenseCategories = loadJSON("pockeCustomExpenseCategories");
  const customIncomeCategories = loadJSON("pockeCustomIncomeCategories");
  const transactions = loadJSON("pockeTransactions");
  const scheduledPayments = loadJSON("pockeScheduledPayments");
  const goals = loadJSON("pockeGoals");

  const hasAnyData =
    onboarding ||
    settings ||
    customExpenseCategories?.length ||
    customIncomeCategories?.length ||
    transactions?.length ||
    scheduledPayments?.length ||
    goals?.length;

  // No legacy data — record an empty migration so we never re-check.
  if (!hasAnyData) {
    localStorage.setItem(MIGRATION_FLAG, "empty");
    return;
  }

  const payload = {
    onboarding: onboarding || undefined,
    settings: settings || undefined,
    customExpenseCategories: customExpenseCategories || undefined,
    customIncomeCategories: customIncomeCategories || undefined,
    transactions: transactions || undefined,
    scheduledPayments: scheduledPayments || undefined,
    goals: goals || undefined,
  };

  await api.migrate(payload);

  // Mark migration done. Original LocalStorage entries are kept as a
  // safety net — they can be cleared from Settings.
  localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
};

/**
 * Clear all legacy LocalStorage entries (including the per-user
 * migration flags from older code). Exposed so the user can press a
 * "Clear local cache" button in Settings once they're sure their
 * migration succeeded.
 */
export const purgeLegacyLocalStorage = () => {
  const fixedKeys = [
    "pockeOnboarding",
    "pockeSettings",
    "pockeCustomExpenseCategories",
    "pockeCustomIncomeCategories",
    "pockeTransactions",
    "pockeScheduledPayments",
    "pockeGoals",
    "pockeAchievements",
    "pockeUser",
    "pockeSession",
  ];
  fixedKeys.forEach((k) => localStorage.removeItem(k));

  // Sweep up any old per-user migration flags too.
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(LEGACY_PER_USER_PREFIX)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
};