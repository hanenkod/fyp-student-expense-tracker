export const BarChartMock = ({ bars = [] }) => {
  return (
    <div className="chart-bars">
      {bars.map((bar, index) => {
        const height = typeof bar === "number" ? bar : bar.height;
        const className = typeof bar === "number" ? "" : bar.className || "";

        return (
          <div
            key={index}
            className={`bar ${className}`.trim()}
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
};