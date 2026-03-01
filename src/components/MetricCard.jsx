import { Card } from "./Card";

export const MetricCard = ({ title, value, footer }) => {
  return (
    <Card className="metric">
      <div className="card__content">
        <div className="metric-title">{title}</div>
        <div className="metric-value">{value}</div>
      </div>

      <div className="card__footer">{footer}</div>
    </Card>
  );
};