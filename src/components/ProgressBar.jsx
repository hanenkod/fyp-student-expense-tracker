export const ProgressBar = ({ value = 0 }) => {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="progress">
      <div className="progress-bar" style={{ width: `${safe}%` }} />
    </div>
  );
};
