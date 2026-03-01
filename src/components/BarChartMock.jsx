export const BarChartMock = ({ bars = [] }) => {
  return (
    <div className="chart">
      {bars.map((h, i) => (
        <div className="bar" key={i} style={{ height: `${h}px` }} />
      ))}
    </div>
  );
};
