import { Card, CardContent, CardFooter } from "./Card";

export const MetricCard = ({ title, value, footer, className = "" }) => {
  return (
    <Card className={`metric ${className}`.trim()}>
      <CardContent className="stack-5">
        <div className="card-title">{title}</div>
        <div className="card-value">{value}</div>
      </CardContent>

      <CardFooter>
        {footer}
      </CardFooter>
    </Card>
  );
};