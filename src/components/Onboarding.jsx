import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Module } from "./Module";
import removebg1 from "./removebg-1.png";
import "../styles/auth.css";

const formatCurrencyInput = (rawValue) => {
  const cleaned = rawValue.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");

  const integerPart = parts[0] || "";
  const decimalPart = parts[1] ? parts[1].slice(0, 2) : "";

  if (!integerPart && !decimalPart) {
    return "";
  }

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimalPart !== ""
    ? `£${formattedInteger}.${decimalPart}`
    : `£${formattedInteger}`;
};

const parseCurrencyValue = (value) => {
  const numeric = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const getRemainingDaysInMonth = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = today.getDate();

  return lastDayOfMonth - todayDate + 1;
};

export const Onboarding = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");

  const numericIncome = useMemo(() => parseCurrencyValue(income), [income]);
  const numericExpenses = useMemo(() => parseCurrencyValue(expenses), [expenses]);

  const remainingDays = useMemo(() => getRemainingDaysInMonth(), []);
  const remainingBudget = Math.max(numericIncome - numericExpenses, 0);
  const safeToSpend = remainingDays > 0 ? remainingBudget / remainingDays : 0;

  const handleIncomeChange = (event) => {
    setIncome(formatCurrencyInput(event.target.value));
  };

  const handleExpensesChange = (event) => {
    setExpenses(formatCurrencyInput(event.target.value));
  };

  const handleFinish = () => {
    const onboardingData = {
      income: numericIncome,
      expenses: numericExpenses,
      remainingBudget,
      remainingDays,
      safeToSpend,
      completed: true,
    };

    localStorage.setItem("pockeOnboarding", JSON.stringify(onboardingData));
    localStorage.setItem("pockeSession", JSON.stringify({ isLoggedIn: true }));
    navigate("/dashboard");
  };

  const isIncomeStepDisabled = numericIncome <= 0;
  const isExpensesStepDisabled = numericExpenses < 0 || expenses.trim() === "";

  return (
    <section className="registration page-shell authScreen authScreen--animated">
      <div className="registration__shell app-shell">
        <aside className="registration__sidebar">
          <div className="registration__sidebarContent">
            <div className="registration__artwork">
              <div className="registration__artworkGlow" />
              <img
                className="registration__image"
                src={removebg1}
                alt="POCKE"
              />
            </div>

            <div className="registration__brandBlock">
              <h2 className="registration__logo registration__logo--light">
                POCKE
              </h2>

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
              <div className="registration__logo registration__logo--dark">
                POCKE
              </div>
            </div>

            {step === 1 && (
              <Module
                title="Tell Us More About Yourself"
                description="As we do not use any bank integrations, some details will need to be entered manually once. You can change these details at any time."
                label="Your Monthly Income"
                placeholder="£0"
                buttonText="Next"
                step="01/03"
                value={income}
                onChange={handleIncomeChange}
                onNext={() => setStep(2)}
                isNextDisabled={isIncomeStepDisabled}
              />
            )}

            {step === 2 && (
              <Module
                title="Tell Us More About Yourself"
                description="Add your estimated monthly expenses so we can prepare your dashboard and calculate your daily safe-to-spend amount."
                label="Your Monthly Expenses"
                placeholder="£0"
                buttonText="Next"
                step="02/03"
                value={expenses}
                onChange={handleExpensesChange}
                onNext={() => setStep(3)}
                isNextDisabled={isExpensesStepDisabled}
              />
            )}

            {step === 3 && (
              <Module
                title="You're Now All Set"
                description={`Your estimated Safe to Spend Today is £${safeToSpend.toFixed(
                  2
                )}. This is based on a remaining budget of £${remainingBudget.toLocaleString()} across ${remainingDays} day${
                  remainingDays === 1 ? "" : "s"
                } left this month.`}
                buttonText="Finish"
                step="03/03"
                showInput={false}
                onNext={handleFinish}
              />
            )}
          </div>
        </main>
      </div>
    </section>
  );
};