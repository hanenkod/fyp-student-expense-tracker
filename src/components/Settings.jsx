import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { useSettings } from "./SettingsContext";
import { useToast } from "./ToastContext";
import "../styles/style.css";
import "../styles/settings.css";

const getStoredJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

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

export const Settings = () => {
  const { settings, updateSetting, currencies } = useSettings();
  const { showToast } = useToast();

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
      user: getStoredJSON("pockeUser"),
      onboarding: getStoredJSON("pockeOnboarding"),
      transactions: getStoredJSON("pockeTransactions") || [],
      scheduledPayments: getStoredJSON("pockeScheduledPayments") || [],
      goals: getStoredJSON("pockeGoals") || [],
      customExpenseCategories: getStoredJSON("pockeCustomExpenseCategories") || [],
      customIncomeCategories: getStoredJSON("pockeCustomIncomeCategories") || [],
      settings,
    };
    const filename = `pocke-backup-${new Date().toISOString().split("T")[0]}.json`;
    triggerDownload(JSON.stringify(data, null, 2), filename, "application/json");
    showToast("Backup downloaded as JSON", { type: "success" });
  };

  const handleExportCSV = () => {
    const transactions = getStoredJSON("pockeTransactions") || [];
    if (transactions.length === 0) {
      showToast("No transactions to export", { type: "warning" });
      return;
    }
    const csv = txToCSV(transactions);
    const filename = `pocke-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    triggerDownload(csv, filename, "text/csv");
    showToast(`Exported ${transactions.length} transactions`, { type: "success" });
  };

  const txCount = (getStoredJSON("pockeTransactions") || []).length;
  const goalCount = (getStoredJSON("pockeGoals") || []).length;
  const spCount = (getStoredJSON("pockeScheduledPayments") || []).length;

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
                  <p className="overview-subtitle">
                    Customise your experience
                  </p>
                </div>
              </div>
            </header>

            <div className="settings-layout">
              {/* ── Appearance ── */}
              <section className="settings-section card-soft">
                <div className="settings-section__header">
                  <h2 className="settings-section__title">Appearance</h2>
                  <p className="settings-section__subtitle">How POCKE looks</p>
                </div>

                <div className="settings-row">
                  <div className="settings-row__info">
                    <span className="settings-row__label">Theme</span>
                    <span className="settings-row__hint">Choose light or dark mode</span>
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

              {/* ── Currency ── */}
              <section className="settings-section card-soft">
                <div className="settings-section__header">
                  <h2 className="settings-section__title">Currency & Format</h2>
                  <p className="settings-section__subtitle">How amounts are displayed</p>
                </div>

                <div className="settings-row">
                  <div className="settings-row__info">
                    <span className="settings-row__label">Currency</span>
                    <span className="settings-row__hint">Symbol and number formatting</span>
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
                    {(1234567.89).toLocaleString(currencies[settings.currency].locale, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </section>

              {/* ── Data ── */}
              <section className="settings-section card-soft">
                <div className="settings-section__header">
                  <h2 className="settings-section__title">Your Data</h2>
                  <p className="settings-section__subtitle">Export your information for backup</p>
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
                  <button type="button" className="export-btn" onClick={handleExportJSON}>
                    <div className="export-btn__icon">⬇</div>
                    <div className="export-btn__body">
                      <span className="export-btn__title">Full backup (JSON)</span>
                      <span className="export-btn__desc">Everything — transactions, goals, subscriptions, profile. Use this to restore all your data later.</span>
                    </div>
                  </button>

                  <button type="button" className="export-btn" onClick={handleExportCSV}>
                    <div className="export-btn__icon">⊞</div>
                    <div className="export-btn__body">
                      <span className="export-btn__title">Transactions (CSV)</span>
                      <span className="export-btn__desc">Opens in Excel, Google Sheets, Numbers. Good for analysis or your own records.</span>
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