import { Card } from "./Card";

export const SafeToSpendCard = ({
  title = "Safe to Spend Today",
  amount = "£30",
  actionText = "How it’s calculated?",
  onAction,
}) => {
  return (
    <Card className="safe-to-spend">
      <div className="card__content">
        <div className="safe-title">{title}</div>
        <div className="safe-amount">{amount}</div>
      </div>

      <div className="card__footer card__footer--safe">
        <button className="safe-action" type="button" onClick={onAction}>
          {actionText}
        </button>
      </div>
    </Card>
  );
};