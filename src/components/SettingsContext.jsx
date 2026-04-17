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

  useEffect(() => {
    localStorage.setItem("pockeSettings", JSON.stringify(settings));
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const currencyInfo = CURRENCIES[settings.currency] || CURRENCIES.GBP;

  const formatMoney = (value, options = {}) => {
    const num = Number(value || 0);
    const { minFractionDigits = 0, maxFractionDigits = 2, showSign = false } = options;

    const formatted = num.toLocaleString(currencyInfo.locale, {
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    });

    const sign = showSign && num > 0 ? "+" : "";
    return `${sign}${currencyInfo.symbol}${formatted}`;
  };

  const formatMoneyFixed = (value) => formatMoney(value, { minFractionDigits: 2, maxFractionDigits: 2 });

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