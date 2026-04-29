/**
 * SettingsContext — UI preferences plus the account-locked currency.
 *
 * Theme is per-device (a user might prefer dark on laptop, light on
 * phone) and lives in LocalStorage. Currency, on the other hand, is
 * locked to the account: it's chosen during onboarding and never
 * changes again, because POCKE doesn't perform conversion and silently
 * relabelling existing amounts would misrepresent the data.
 *
 * The currency is stored in `user.settingsJson` on the server (so it
 * follows the user across devices) and mirrored to LocalStorage so
 * the formatter has a value to use before the user record arrives
 * from the API on first paint.
 *
 * Also exposes a formatMoney helper so every component renders amounts
 * the same way without each maintaining its own Intl options.
 */
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { safeJSON } from "../utils/json";

const SettingsContext = createContext(null);

const CURRENCIES = {
  GBP: { code: "GBP", symbol: "£", label: "British Pound", locale: "en-GB" },
  USD: { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", label: "Euro", locale: "de-DE" },
};

const DEFAULT_SETTINGS = {
  theme: "light",
  currency: "GBP",
  numberFormat: "comma",
};

/**
 * Read settings from LocalStorage. Falls back to defaults if the key
 * is missing or contains malformed JSON.
 */
const getStoredSettings = () => {
  const stored = safeJSON(localStorage.getItem("pockeSettings"), null);
  return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
};

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(getStoredSettings);

  // When the user record arrives (or changes), pull their saved
  // currency out of settingsJson and merge it into local state.
  // This makes the choice follow the account across devices.
  useEffect(() => {
    if (!user?.settingsJson) return;
    const serverSettings = safeJSON(user.settingsJson, null);
    if (
      serverSettings?.currency &&
      CURRENCIES[serverSettings.currency]
    ) {
      setSettings((prev) => ({
        ...prev,
        currency: serverSettings.currency,
      }));
    }
  }, [user?.settingsJson]);

  // Persist on every change and apply the theme attribute on <html>.
  useEffect(() => {
    localStorage.setItem("pockeSettings", JSON.stringify(settings));
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings]);

  /**
   * Update a local setting. Note: callers that change `currency`
   * during onboarding are responsible for also persisting the choice
   * to user.settingsJson via api.updateMe() — this helper only
   * touches local state and LocalStorage.
   */
  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const currencyInfo = CURRENCIES[settings.currency] || CURRENCIES.GBP;

  /**
   * Format a numeric value in the user's chosen currency.
   *
   * @param {number} value
   * @param {object} [options]
   * @param {number} [options.minFractionDigits=0]
   * @param {number} [options.maxFractionDigits=2]
   * @param {boolean} [options.showSign=false]  prepend "+" for positive numbers
   */
  const formatMoney = (value, options = {}) => {
    const num = Number(value || 0);
    const {
      minFractionDigits = 0,
      maxFractionDigits = 2,
      showSign = false,
    } = options;

    const formatted = num.toLocaleString(currencyInfo.locale, {
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    });

    const sign = showSign && num > 0 ? "+" : "";
    return `${sign}${currencyInfo.symbol}${formatted}`;
  };

  /** Convenience wrapper that always shows two decimal places. */
  const formatMoneyFixed = (value) =>
    formatMoney(value, { minFractionDigits: 2, maxFractionDigits: 2 });

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        currencyInfo,
        formatMoney,
        formatMoneyFixed,
        currencies: CURRENCIES,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};