import { ProgressBar } from "./ProgressBar";

export const SavingsPanel = ({
  title,
  leftAmount,
  percent,
  target,
  progressValue,
}) => {
  return (
    <div className="subcard">
      <div className="subcard__header">
        <div className="subcard__title">{title}</div>
      </div>

      <div className="subcard__content">
        <ProgressBar value={progressValue} />
      </div>

      <div className="subcard__footer">
        <div className="subcard__footer-left">
          <span className="subcard__amount">{leftAmount}</span>
          {typeof percent === "number" && (
            <span className="subcard__percent">{percent}%</span>
          )}
        </div>

        <div className="subcard__target">
          <span className="subcard__target-label">Target:</span>
          <span className="subcard__target-value">{target}</span>
        </div>
      </div>
    </div>
  );
};