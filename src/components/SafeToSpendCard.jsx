import { useState } from "react";
import { Card, CardContent, CardFooter } from "./Card";

export const SafeToSpendCard = ({
  title = "Safe to Spend Today",
  amount = "£30",
  income = 0,
  expenses = 0,
  currentBalance = 0,
  daysLeft = 1,
  currencySymbol = "£",
}) => {
  const [showInfo, setShowInfo] = useState(false);

  const fmt = (v) =>
    `${currencySymbol}${Number(v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  const budgetFormula = daysLeft > 0 ? Math.max(0, income - expenses) / daysLeft : 0;

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
        >
          How it’s calculated?
        </button>
      </CardFooter>

      {showInfo && (
        <div className="safe-tooltip">
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
              Your daily spending allowance for the rest of the month. Two methods keep you honest — we use the tighter of the two.
            </p>

            <div className="safe-formula-block">
              <div className="safe-formula-title">Method 1 — Budget split</div>
              <div className="safe-formula-row">
                <span className="safe-formula-label">Income − Expenses this month</span>
                <span className="safe-formula-value">{fmt(Math.max(0, income - expenses))}</span>
              </div>
              <div className="safe-formula-row">
                <span className="safe-formula-label">÷ Days left in month</span>
                <span className="safe-formula-value">{daysLeft}</span>
              </div>
              <div className="safe-formula-row safe-formula-row--result">
                <span className="safe-formula-label">= Daily allowance</span>
                <span className="safe-formula-value">{fmt(budgetFormula)}</span>
              </div>
            </div>

            <div className="safe-formula-block">
              <div className="safe-formula-title">Method 2 — Live balance</div>
              <div className="safe-formula-row">
                <span className="safe-formula-label">Current balance</span>
                <span className="safe-formula-value">{fmt(currentBalance)}</span>
              </div>
              <div className="safe-formula-row">
                <span className="safe-formula-label">÷ Days left in month</span>
                <span className="safe-formula-value">{daysLeft}</span>
              </div>
              <div className="safe-formula-row safe-formula-row--result">
                <span className="safe-formula-label">= Daily allowance</span>
                <span className="safe-formula-value">{fmt(daysLeft > 0 ? Math.max(0, currentBalance) / daysLeft : 0)}</span>
              </div>
            </div>

            <p className="safe-tooltip-note">
              Spending under this amount each day keeps you on track. It updates in real time as you log transactions.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};