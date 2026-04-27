/**
 * SafeToSpendCard — the headline tile on the Dashboard.
 *
 * Implements the FYP report's "Safe to Spend Today" formula in two
 * variants:
 *   Method 1 (Basic):     income / days_in_month — daily allowance.
 *   Method 2 (Extended):  factors in already-logged transactions and
 *                         upcoming subscription debits this month.
 *
 * The user can toggle between them on the card itself.
 */
import { useState } from "react";
import { Card, CardContent, CardFooter } from "./Card";

/**
 * Safe to Spend Today card with explanation tooltip.
 *
 * Two-level formula matching the FYP report definition:
 *
 *   Method 1 — BASIC: (onboardingIncome − fixedExpenses) ÷ daysLeft
 *   Method 2 — EXTENDED: (onboardingIncome − fixedExpenses
 *                        − loggedExpensesThisMonth
 *                        + loggedIncomeThisMonth
 *                        − upcomingSubscriptionsThisMonth) ÷ daysLeft
 */
export const SafeToSpendCard = ({
  title = "Safe to Spend Today",
  amount = "£30",
  income = 0,
  fixedExpenses = 0,
  loggedExpenses = 0,
  loggedIncome = 0,
  upcomingSubscriptions = 0,
  daysLeft = 1,
  currencySymbol = "£",
}) => {
  const [showInfo, setShowInfo] = useState(false);

  const fmt = (v) =>
    `${currencySymbol}${Number(v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  const method1Remaining = Math.max(0, income - fixedExpenses);
  const method1Daily = daysLeft > 0 ? method1Remaining / daysLeft : 0;

  const method2Remaining = Math.max(
    0,
    income - fixedExpenses - loggedExpenses + loggedIncome - upcomingSubscriptions
  );
  const method2Daily = daysLeft > 0 ? method2Remaining / daysLeft : 0;

  return (
    <Card className="safe safe-card">
      <CardContent className="stack-5">
        <div className="card-title big-title">{title}</div>
        <div className="card-value big-value">{amount}</div>
      </CardContent>

      <CardFooter className="card-footer--safe">
        <button
          className="card-link"
          type="button"
          onClick={() => setShowInfo((prev) => !prev)}
          aria-expanded={showInfo}
          aria-controls="safe-tooltip-panel"
        >
          How it's calculated?
        </button>
      </CardFooter>

      {showInfo && (
        <div className="safe-tooltip" id="safe-tooltip-panel">
          <div className="safe-tooltip-content">
            <div className="safe-tooltip-header">
              <p className="safe-tooltip-title">How Safe to Spend works</p>
              <button
                className="safe-tooltip-close-x"
                onClick={() => setShowInfo(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="safe-tooltip-intro">
              A deterministic algorithm with two levels of detail. As your data grows, the formula transitions from the basic estimate to the extended one — and the app always shows the safer of the two.
            </p>

            <div className="safe-formula-block">
              <div className="safe-formula-title">Method 1 — Basic (profile setup only)</div>
              <div className="safe-formula-row">
                <span className="safe-formula-label">Monthly income</span>
                <span className="safe-formula-value">{fmt(income)}</span>
              </div>
              <div className="safe-formula-row">
                <span className="safe-formula-label">− Fixed expenses</span>
                <span className="safe-formula-value">{fmt(fixedExpenses)}</span>
              </div>
              <div className="safe-formula-row">
                <span className="safe-formula-label">÷ Days left in month</span>
                <span className="safe-formula-value">{daysLeft}</span>
              </div>
              <div className="safe-formula-row safe-formula-row--result">
                <span className="safe-formula-label">= Daily allowance</span>
                <span className="safe-formula-value">{fmt(method1Daily)}</span>
              </div>
            </div>

            <div className="safe-formula-block">
              <div className="safe-formula-title">Method 2 — Extended (logged data)</div>
              <div className="safe-formula-row">
                <span className="safe-formula-label">Monthly income</span>
                <span className="safe-formula-value">{fmt(income)}</span>
              </div>
              <div className="safe-formula-row">
                <span className="safe-formula-label">− Fixed expenses</span>
                <span className="safe-formula-value">{fmt(fixedExpenses)}</span>
              </div>
              <div className="safe-formula-row">
                <span className="safe-formula-label">− Logged expenses (net)</span>
                <span className="safe-formula-value">{fmt(loggedExpenses - loggedIncome)}</span>
              </div>
              <div className="safe-formula-row">
                <span className="safe-formula-label">− Upcoming subscriptions</span>
                <span className="safe-formula-value">{fmt(upcomingSubscriptions)}</span>
              </div>
              <div className="safe-formula-row">
                <span className="safe-formula-label">÷ Days left in month</span>
                <span className="safe-formula-value">{daysLeft}</span>
              </div>
              <div className="safe-formula-row safe-formula-row--result">
                <span className="safe-formula-label">= Daily allowance</span>
                <span className="safe-formula-value">{fmt(method2Daily)}</span>
              </div>
            </div>

            <p className="safe-tooltip-note">
              Spending under this amount each day keeps you on track. The number updates in real time as you log transactions and add subscriptions.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};