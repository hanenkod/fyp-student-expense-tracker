import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Module } from "./Module";
import { useSettings } from "./SettingsContext";
import { useAuth } from "./AuthContext";
import { api } from "../utils/api";
import removebg1 from "./removebg-1.png";
import "../styles/auth.css";

const formatCurrencyInput = (rawValue, symbol) => {
  const cleaned = rawValue.replace(/[^\d.]/g, "");
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
  const numeric = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const getRemainingDaysInMonth = () => {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return lastDay - today.getDate() + 1;
};

export const Onboarding = () => {
  const navigate = useNavigate();
  const { formatMoney, currencyInfo } = useSettings();
  const { setUser } = useAuth();

  const [step, setStep] = useState(1);
  const [income, setIncome] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const numericIncome = useMemo(() => parseCurrencyValue(income), [income]);
  const remainingDays = useMemo(() => getRemainingDaysInMonth(), []);
  const safeToSpend = remainingDays > 0 ? numericIncome / remainingDays : 0;

  const handleIncomeChange = (event) => {
    setIncome(formatCurrencyInput(event.target.value, currencyInfo.symbol));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      // Persist onboarding result to the API and refresh local user state.
      const updatedUser = await api.updateMe({
        income: numericIncome,
        expenses: 0,
        onboarded: true,
      });
      setUser(updatedUser);
      navigate("/dashboard");
    } catch (err) {
      console.error("Onboarding save failed:", err);
      // Fall through — the button just stays clickable for retry.
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
            <div className="registration__artwork">
              <div className="registration__artworkGlow" />
              <img className="registration__image" src={removebg1} alt="POCKE" />
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
              <Module
                title="Tell Us More About Yourself"
                description="Enter your monthly income so we can calculate your daily safe-to-spend amount. Your expenses will be tracked automatically as you add transactions."
                label="Your Monthly Income"
                placeholder={`${currencyInfo.symbol}0`}
                buttonText="Next"
                step="01/02"
                value={income}
                onChange={handleIncomeChange}
                onNext={() => setStep(2)}
                isNextDisabled={isIncomeStepDisabled}
              />
            )}

            {step === 2 && (
              <Module
                title="You're Now All Set"
                description={`Your monthly income is ${formatMoney(numericIncome)}. With ${remainingDays} day${
                  remainingDays === 1 ? "" : "s"
                } left this month, your Safe to Spend Today is ${formatMoney(safeToSpend, { minFractionDigits: 2, maxFractionDigits: 2 })}. Start adding transactions to track your spending!`}
                buttonText={submitting ? "Saving…" : "Go to Dashboard"}
                step="02/02"
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
