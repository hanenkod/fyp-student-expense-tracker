export const IconBox = ({
  className = "",
  size = 39,
  innerW = 24,
  innerH = 24,
  opticalScale = 1,
  children,
}) => {
  const baseScale = Math.min(24 / innerW, 24 / innerH);
  const scale = baseScale * opticalScale;

  const scaledW = innerW * scale;
  const scaledH = innerH * scale;

  const tx = (24 - scaledW) / 2;
  const ty = (24 - scaledH) / 2;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
        {children}
      </g>
    </svg>
  );
};
