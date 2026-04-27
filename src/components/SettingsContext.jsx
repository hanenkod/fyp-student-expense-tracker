/**
 * SettingsContext — per-device UI preferences.
 *
 * Stores theme (light/dark) and currency (GBP/USD/EUR) in LocalStorage
 * because they're a property of *this browser*, not the user's account.
 * A user might prefer dark mode on their laptop but light mode on
 * their phone, and that's fine.
 *
 * Also exposes a formatMoney helper so every component renders amounts
 * the same way without each maintaining its own Intl options.
 */
import { createContext, useContext, useEffect, useState } from "react";

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
  try {
    const raw = localStorage.getItem("pockeSettings");
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(getStoredSettings);

  // Persist on every change and apply the theme attribute on <html>.
  useEffect(() => {
    localStorage.setItem("pockeSettings", JSON.stringify(settings));
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings]);

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
