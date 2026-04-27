/**
 * Settings page.
 *
 * Three sections: Appearance (theme), Currency & Format, and Your Data
 * (export and legacy-cache cleanup). Theme and currency are stored
 * locally because they're per-device UI preferences; everything else
 * comes from the API.
 */
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { useSettings } from "./SettingsContext";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";
import { useData } from "./DataContext";
import { purgeLegacyLocalStorage } from "../utils/migration";
import "../styles/style.css";
import "../styles/settings.css";

/**
 * Trigger a file download from a string. Used for both JSON and CSV
 * exports — the only differences are the MIME type and filename.
 */
const triggerDownload = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Build a CSV blob from an array of transactions. Doubled-up quotes
 * inside fields follow the standard CSV escape rule.
 */
const txToCSV = (transactions) => {
  const header = ["Date", "Type", "Name", "Category", "Amount"];
  const rows = transactions.map((t) => [
    t.date || "",
    t.type || "",
    (t.name || "").replace(/"/g, '""'),
    (t.category || "").replace(/"/g, '""'),
    t.amount || 0,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
  return csv;
};

/**
 * Decode a JSON-encoded array string from the server. Returns [] for
 * null, undefined, or malformed input — never throws.
 */
const safeArray = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const Settings = () => {
  const { settings, updateSetting, currencies } = useSettings();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { transactions, scheduled, goals } = useData();

  const [legacyCleared, setLegacyCleared] = useState(false);

  const handleThemeChange = (theme) => {
    updateSetting("theme", theme);
    showToast(`Switched to ${theme} theme`, { type: "success" });
  };

  const handleCurrencyChange = (code) => {
    updateSetting("currency", code);
    const name = currencies[code]?.label || code;
    showToast(`Currency changed to ${name}`, { type: "success" });
  };

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      user: user
        ? { id: user.id, email: user.email, name: user.name }
        : null,
      onboarding: {
        income: user?.income || 0,
        expenses: user?.expenses || 0,
        onboarded: user?.onboarded,
      },
      transactions,
      scheduledPayments: scheduled,
      goals,
      customExpenseCategories: safeArray(user?.customExpenseCategories),
      customIncomeCategories: safeArray(user?.customIncomeCategories),
      settings,
    };
    const filename = `pocke-backup-${new Date().toISOString().split("T")[0]}.json`;
    triggerDownload(JSON.stringify(data, null, 2), filename, "application/json");
    showToast("Backup downloaded as JSON", { type: "success" });
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showToast("No transactions to export", { type: "warning" });
      return;
    }
    const csv = txToCSV(transactions);
    const filename = `pocke-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    triggerDownload(csv, filename, "text/csv");
    showToast(`Exported ${transactions.length} transactions`, { type: "success" });
  };

  /**
   * Wipe the legacy LocalStorage keys left behind by the pre-backend
   * migration. The data has already been mirrored to the server so
   * this is purely a cleanup action.
   */
  const handleClearLegacy = () => {
    purgeLegacyLocalStorage();
    setLegacyCleared(true);
    showToast("Legacy local data cleared", { type: "success" });
  };

  const txCount = transactions.length;
  const goalCount = goals.length;
  const spCount = scheduled.length;

  return (
    <div className="dashboard">
      <div className="app-shell">
        <div className="layout">
          <Sidebar />

          <main className="content">
            <header className="overview card card-soft card-overview">
              <div className="overview-bar">
                <div className="overview-text stack-5">
                  <h1 className="overview-title">Settings</h1>
                  <p className="overview-subtitle">Customise your experience</p>
                </div>
              </div>
            </header>

            <div className="settings-layout">
              <section className="settings-section card-soft">
                <div className="settings-section__header">
                  <h2 className="settings-section__title">Appearance</h2>
                  <p className="settings-section__subtitle">How POCKE looks</p>
                </div>

                <div className="settings-row">
                  <div className="settings-row__info">
                    <span className="settings-row__label">Theme</span>
                    <span className="settings-row__hint">
                      Choose light or dark mode
                    </span>
                  </div>

                  <div className="theme-toggle">
                    <button
                      type="button"
                      className={`theme-toggle__btn ${settings.theme === "light" ? "theme-toggle__btn--active" : ""}`}
                      onClick={() => handleThemeChange("light")}
                    >
                      <span className="theme-toggle__icon">☀</span>
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-toggle__btn ${settings.theme === "dark" ? "theme-toggle__btn--active" : ""}`}
                      onClick={() => handleThemeChange("dark")}
                    >
                      <span className="theme-toggle__icon">☾</span>
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
              </section>

              <section className="settings-section card-soft">
                <div className="settings-section__header">
                  <h2 className="settings-section__title">Currency & Format</h2>
                  <p className="settings-section__subtitle">
                    How amounts are displayed
                  </p>
                </div>

                <div className="settings-row">
                  <div className="settings-row__info">
                    <span className="settings-row__label">Currency</span>
                    <span className="settings-row__hint">
                      Symbol and number formatting
                    </span>
                  </div>

                  <div className="currency-grid">
                    {Object.values(currencies).map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        className={`currency-btn ${settings.currency === c.code ? "currency-btn--active" : ""}`}
                        onClick={() => handleCurrencyChange(c.code)}
                      >
                        <span className="currency-btn__symbol">{c.symbol}</span>
                        <span className="currency-btn__code">{c.code}</span>
                        <span className="currency-btn__label">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-preview">
                  <span className="settings-preview__label">Preview</span>
                  <span className="settings-preview__value">
                    {currencies[settings.currency].symbol}
                    {(1234567.89).toLocaleString(
                      currencies[settings.currency].locale,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </span>
                </div>
              </section>

              <section className="settings-section card-soft">
                <div className="settings-section__header">
                  <h2 className="settings-section__title">Your Data</h2>
                  <p className="settings-section__subtitle">
                    Export your information for backup
                  </p>
                </div>

                <div className="data-stats">
                  <div className="data-stat">
                    <span className="data-stat__value">{txCount}</span>
                    <span className="data-stat__label">Transactions</span>
                  </div>
                  <div className="data-stat">
                    <span className="data-stat__value">{spCount}</span>
                    <span className="data-stat__label">Subscriptions</span>
                  </div>
                  <div className="data-stat">
                    <span className="data-stat__value">{goalCount}</span>
                    <span className="data-stat__label">Savings goals</span>
                  </div>
                </div>

                <div className="export-grid">
                  <button
                    type="button"
                    className="export-btn"
                    onClick={handleExportJSON}
                  >
                    <div className="export-btn__icon">⬇</div>
                    <div className="export-btn__body">
                      <span className="export-btn__title">Full backup (JSON)</span>
                      <span className="export-btn__desc">
                        Everything — transactions, goals, subscriptions,
                        profile. Use this to restore all your data later.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="export-btn"
                    onClick={handleExportCSV}
                  >
                    <div className="export-btn__icon">⊞</div>
                    <div className="export-btn__body">
                      <span className="export-btn__title">Transactions (CSV)</span>
                      <span className="export-btn__desc">
                        Opens in Excel, Google Sheets, Numbers. Good for
                        analysis or your own records.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="export-btn"
                    onClick={handleClearLegacy}
                    disabled={legacyCleared}
                  >
                    <div className="export-btn__icon">⌫</div>
                    <div className="export-btn__body">
                      <span className="export-btn__title">
                        {legacyCleared ? "Legacy cache cleared" : "Clear legacy local cache"}
                      </span>
                      <span className="export-btn__desc">
                        Removes the pre-backend LocalStorage entries kept as
                        a safety net. Safe to do once you're confident your
                        data has migrated.
                      </span>
                    </div>
                  </button>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
