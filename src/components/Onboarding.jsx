/**
 * Onboarding — three-step setup wizard shown to new accounts.
 *
 * Step 1 — choose the account's primary currency. This is the only
 *          chance the user gets: once onboarding completes the choice
 *          is locked, because the app does not perform conversion and
 *          changing the symbol mid-flight would silently misrepresent
 *          all stored amounts.
 * Step 2 — enter monthly income, formatted in the chosen currency.
 * Step 3 — preview the resulting "Safe to Spend Today" and confirm.
 *          On confirm we persist income, the chosen currency (in
 *          user.settingsJson), and flip the user's `onboarded` flag.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Module } from "./Module";
import { useSettings } from "./SettingsContext";
import { useAuth } from "./AuthContext";
import { api } from "../utils/api";
import "../styles/auth.css";

const formatCurrencyInput = (rawValue, symbol) => {
  const cleaned = String(rawValue).replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  const integerPart = parts[0] || "";
  const decimalPart = parts[1] ? parts[1].slice(0, 2) : "";
  if (!integerPart && !decimalPart) return "";
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimalPart !== ""
    ? `${symbol}${formattedInteger}.${decimalPart}`
    : `${symbol}${formattedInteger}`;
};

const parseCurrencyValue = (value) => {
  const numeric = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const getRemainingDaysInMonth = () => {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return lastDay - today.getDate() + 1;
};

export const Onboarding = () => {
  const navigate = useNavigate();
  const { formatMoney, currencyInfo, currencies, updateSetting } = useSettings();
  const { user, setUser } = useAuth();

  const [step, setStep] = useState(1);
  const [income, setIncome] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const numericIncome = useMemo(() => parseCurrencyValue(income), [income]);
  const remainingDays = useMemo(() => getRemainingDaysInMonth(), []);
  const safeToSpend = remainingDays > 0 ? numericIncome / remainingDays : 0;

  const handleIncomeChange = (event) => {
    setIncome(formatCurrencyInput(event.target.value, currencyInfo.symbol));
  };

  /**
   * Update the local currency preference. We deliberately reset the
   * income input here — currency changes happen on a step before the
   * income field is shown anyway, but if the user navigates back and
   * picks a different currency we want a clean slate so there's no
   * chance of the formatter mis-parsing a half-typed number with the
   * wrong symbol prefix.
   */
  const handleCurrencyPick = (code) => {
    updateSetting("currency", code);
    setIncome("");
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      // Merge the chosen currency into whatever else lives in
      // settingsJson so we never overwrite future preferences.
      const existingSettings = (() => {
        try {
          return user?.settingsJson ? JSON.parse(user.settingsJson) : {};
        } catch {
          return {};
        }
      })();

      const updatedUser = await api.updateMe({
        income: numericIncome,
        expenses: 0,
        onboarded: true,
        settingsJson: JSON.stringify({
          ...existingSettings,
          currency: currencyInfo.code,
        }),
      });
      setUser(updatedUser);
      navigate("/dashboard");
    } catch (err) {
      console.error("Onboarding save failed:", err);
      // Errors are logged but not surfaced — the button stays
      // enabled in the finally block below so the user can retry.
    } finally {
      setSubmitting(false);
    }
  };

  const isIncomeStepDisabled = numericIncome <= 0;

  return (
    <section className="registration page-shell authScreen authScreen--animated">
      <div className="registration__shell app-shell">
        <aside className="registration__sidebar">
          <div className="registration__sidebarContent">
            <div className="registration__artwork" aria-hidden="true">
              <span className="registration__orb registration__orb--violet" />
              <span className="registration__orb registration__orb--blue" />
              <span className="registration__orb registration__orb--pink" />
            </div>
            <div className="registration__brandBlock">
              <h2 className="registration__logo registration__logo--light">POCKE</h2>
              <p className="registration__tagline">
                Know what you can spend today.
                <br />
                Track. Save. Stay in control.
              </p>
            </div>
          </div>
        </aside>

        <main className="registration__content app-panel">
          <div className="registration__contentInner">
            <div className="registration__header">
              <div className="registration__logo registration__logo--dark">POCKE</div>
            </div>

            {step === 1 && (
              <div className="onboardingStep">
                <div className="onboardingStep__head">
                  <span className="onboardingStep__counter">01/03</span>
                  <h2 className="onboardingStep__title">Choose Your Currency</h2>
                  <p className="onboardingStep__description">
                    POCKE shows all amounts in this currency. Pick the one
                    that matches your bank account — this can&apos;t be
                    changed later, so all your figures stay consistent.
                  </p>
                </div>

                <div className="onboardingStep__currencyGrid">
                  {Object.values(currencies).map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      className={`onboardingStep__currencyBtn ${
                        currencyInfo.code === c.code
                          ? "onboardingStep__currencyBtn--active"
                          : ""
                      }`}
                      onClick={() => handleCurrencyPick(c.code)}
                      aria-pressed={currencyInfo.code === c.code}
                    >
                      <span className="onboardingStep__currencySymbol">
                        {c.symbol}
                      </span>
                      <span>
                        <span className="onboardingStep__currencyCode">
                          {c.code}
                        </span>
                        <span className="onboardingStep__currencyLabel">
                          {c.label}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="onboardingStep__next app-button"
                  onClick={() => setStep(2)}
                >
                  Next
                </button>
              </div>
            )}

            {step === 2 && (
              <Module
                title="Tell Us More About Yourself"
                description="Enter your monthly income so we can calculate your daily safe-to-spend amount. Your expenses will be tracked automatically as you add transactions."
                label="Your Monthly Income"
                placeholder={`${currencyInfo.symbol}0`}
                buttonText="Next"
                step="02/03"
                value={income}
                onChange={handleIncomeChange}
                onNext={() => setStep(3)}
                isNextDisabled={isIncomeStepDisabled}
              />
            )}

            {step === 3 && (
              <Module
                title="You're Now All Set"
                description={`Your monthly income is ${formatMoney(
                  numericIncome
                )}. With ${remainingDays} day${
                  remainingDays === 1 ? "" : "s"
                } left this month, your Safe to Spend Today is ${formatMoney(
                  safeToSpend,
                  { minFractionDigits: 2, maxFractionDigits: 2 }
                )}. Start adding transactions to track your spending!`}
                buttonText={submitting ? "Saving…" : "Go to Dashboard"}
                step="03/03"
                showInput={false}
                onNext={handleFinish}
                isNextDisabled={submitting}
              />
            )}
          </div>
        </main>
      </div>
    </section>
  );
};