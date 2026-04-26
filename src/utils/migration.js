import { api } from "./api.js";

/**
 * Migrates any data the user has accumulated in LocalStorage (from the
 * pre-backend version of POCKE) up to the API.
 *
 * Called once after a successful login or registration. Skips entirely
 * if the user has no legacy data, or if the migration has already been
 * marked as done in this browser.
 *
 * Once successful, sets `pockeMigrated:<userId>` in LocalStorage to
 * prevent re-uploading on subsequent logins from the same browser.
 */
const MIGRATION_FLAG_PREFIX = "pockeMigrated:";

export const migrateLocalStorageIfNeeded = async (userId) => {
  if (!userId) return;
  const flagKey = `${MIGRATION_FLAG_PREFIX}${userId}`;
  if (localStorage.getItem(flagKey)) return; // already migrated for this user

  // Read everything we used to keep in LocalStorage.
  const safeJSON = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const onboarding = safeJSON("pockeOnboarding");
  const settings = safeJSON("pockeSettings");
  const customExpenseCategories = safeJSON("pockeCustomExpenseCategories");
  const customIncomeCategories = safeJSON("pockeCustomIncomeCategories");
  const transactions = safeJSON("pockeTransactions");
  const scheduledPayments = safeJSON("pockeScheduledPayments");
  const goals = safeJSON("pockeGoals");

  const hasAnyData =
    onboarding ||
    settings ||
    (customExpenseCategories?.length) ||
    (customIncomeCategories?.length) ||
    (transactions?.length) ||
    (scheduledPayments?.length) ||
    (goals?.length);

  if (!hasAnyData) {
    // Nothing to migrate; mark as done so we never check again.
    localStorage.setItem(flagKey, "empty");
    return;
  }

  // Build the payload. The backend ignores undefined keys.
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

  // Mark migration as done. We deliberately keep the original LocalStorage
  // entries around as a safety net — they can be cleared later from Settings.
  localStorage.setItem(flagKey, new Date().toISOString());
};

/**
 * Clear all legacy LocalStorage entries (call from Settings as cleanup).
 */
export const purgeLegacyLocalStorage = () => {
  [
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
  ].forEach((k) => localStorage.removeItem(k));
};
