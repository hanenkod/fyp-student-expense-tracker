/**
 * BarChartMock — minimal bar-chart primitive used on the Dashboard.
 *
 * Each bar can be passed as a plain number (height in px) for legacy
 * callers, or as an object { height, className, label, tooltip } for
 * richer usage. Object-form bars are wrapped in a hover cell that
 * reveals a tooltip on mouse-over and keyboard focus, and date
 * labels render as a row underneath the bars.
 */
export const BarChartMock = ({ bars = [] }) => {
  const hasLabels = bars.some(
    (b) => typeof b === "object" && b.label !== undefined && b.label !== null
  );

  return (
    <div className="chart-bars-wrap">
      <div className="chart-bars">
        {bars.map((bar, index) => {
          const isObject = typeof bar === "object";
          const height = isObject ? bar.height : bar;
          const className = isObject ? bar.className || "" : "";
          const tooltip = isObject ? bar.tooltip : null;

          // Plain-number bars stay as a single div for legacy callers.
          if (!tooltip) {
            return (
              <div
                key={index}
                className={`bar ${className}`.trim()}
                style={{ height: `${height}px` }}
              />
            );
          }

          // Object bars with a tooltip get wrapped in a hover cell.
          // We use tabIndex=0 so keyboard users can also see the tip
          // by focusing the bar.
          return (
            <div
              key={index}
              className="chart-bar-cell"
              tabIndex={0}
              aria-label={tooltip.aria || `${tooltip.amount} on ${tooltip.date}`}
            >
              <div
                className={`bar ${className}`.trim()}
                style={{ height: `${height}px` }}
              />
              <div className="chart-bar-cell__tooltip" role="tooltip">
                {tooltip.amount}
                {tooltip.date && (
                  <span className="chart-bar-cell__date">{tooltip.date}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasLabels && (
        <div className="chart-xlabels" aria-hidden="true">
          {bars.map((bar, index) => (
            <span key={index} className="chart-xlabel">
              {typeof bar === "object" ? bar.label : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};