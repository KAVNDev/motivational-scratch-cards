interface SparkleProps {
  size?: number;
  color?: string;
  className?: string;
}

export function Sparkle({ size = 24, color = 'currentColor', className }: SparkleProps): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
      className={className}
    >
      {/* Four-point star / sparkle shape */}
      <path d="M12 2 L13.2 10.0 L21 12 L13.2 14.0 L12 22 L10.8 14.0 L3 12 L10.8 10.0 Z" />
      <circle cx="5" cy="5" r="1.1" />
      <circle cx="19" cy="5" r="0.8" />
      <circle cx="19" cy="19" r="1.1" />
    </svg>
  );
}
