import { useState } from "react";
import { Card, CardContent, CardFooter } from "./Card";

export const SafeToSpendCard = ({
  title = "Safe to Spend Today",
  amount = "£30",
}) => {
  const [showInfo, setShowInfo] = useState(false);

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
            <p className="safe-tooltip-title">Calculation</p>

            <p>
              <strong>Remaining Budget</strong> = Income − Expenses
            </p>
            <p>
              <strong>Days Left</strong> = Days in month − Today
            </p>
            <p>
              <strong>Safe to Spend</strong> = Remaining Budget ÷ Days Left
            </p>

            <button
              className="safe-tooltip-close"
              onClick={() => setShowInfo(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};