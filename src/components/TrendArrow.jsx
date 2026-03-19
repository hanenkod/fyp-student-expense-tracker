export const TrendArrow = ({ direction = "up", className = "" }) => {
  return (
    <svg
      className={`trend-arrow ${direction === "down" ? "trend-arrow--down" : ""} ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      width="9"
      height="9"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12.707 3.636a1 1 0 0 0-1.414 0L5.636 9.293a1 1 0 1 0 1.414 1.414L11 6.757V20a1 1 0 1 0 2 0V6.757l3.95 3.95a1 1 0 0 0 1.414-1.414z"
      />
    </svg>
  );
};