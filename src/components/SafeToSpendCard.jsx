import { Card, CardContent, CardFooter } from "./Card";

export const SafeToSpendCard = ({
  title = "Safe to Spend Today",
  amount = "£30",
  actionText = "How it’s calculated?",
  onAction,
}) => {
  return (
    <Card className="safe">
      <CardContent className="stack-5">
        <div className="card-title big-title">{title}</div>
        <div className="card-value big-value">{amount}</div>
      </CardContent>

      <CardFooter className="card-footer--safe">
        <button className="card-link" type="button" onClick={onAction}>
          {actionText}
        </button>
      </CardFooter>
    </Card>
  );
};