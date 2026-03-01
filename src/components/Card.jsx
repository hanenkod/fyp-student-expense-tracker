export const Card = ({ className = "", children }) => {
  return <section className={`card ${className}`.trim()}>{children}</section>;
};
