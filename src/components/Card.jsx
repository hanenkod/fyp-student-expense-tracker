export const Card = ({ className = "", children }) => {
  return <section className={`card ${className}`.trim()}>{children}</section>;
};

export const CardHeader = ({
  title,
  subtitle,
  action,
  className = "",
  textClassName = "",
  children,
}) => {
  if (children) {
    return <div className={`card-header ${className}`.trim()}>{children}</div>;
  }

  return (
    <div className={`card-header ${className}`.trim()}>
      <div className={`card-header__text ${textClassName}`.trim()}>
        <div className="card-title">{title}</div>
        {subtitle && <div className="card-muted">{subtitle}</div>}
      </div>

      {action && <div className="card-header__action">{action}</div>}
    </div>
  );
};

export const CardContent = ({ className = "", children }) => {
  return <div className={`card-content ${className}`.trim()}>{children}</div>;
};

export const CardFooter = ({ className = "", children }) => {
  return <div className={`card-footer ${className}`.trim()}>{children}</div>;
};