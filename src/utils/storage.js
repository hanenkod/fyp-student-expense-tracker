/**
 * Centralised LocalStorage helpers used across the app.
 *
 * Wrapping localStorage access here protects each caller from
 * duplicate code and JSON.parse errors.
 */

export const getStoredJSON = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const saveJSON = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error(`Failed to save ${key}`, err);
    return false;
  }
};

export const removeKey = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};


export const STORAGE_KEYS = {
  USER: "pockeUser",
  SESSION: "pockeSession",
  ONBOARDING: "pockeOnboarding",
  TRANSACTIONS: "pockeTransactions",
  SCHEDULED: "pockeScheduledPayments",
  GOALS: "pockeGoals",
  EXPENSE_CATS: "pockeCustomExpenseCategories",
  INCOME_CATS: "pockeCustomIncomeCategories",
  SETTINGS: "pockeSettings",
  ACHIEVEMENTS: "pockeAchievements",
};