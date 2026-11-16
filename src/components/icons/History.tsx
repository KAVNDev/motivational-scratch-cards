interface HistoryProps {
  size?: number;
  color?: string;
  className?: string;
}

export function History({ size = 24, color = 'currentColor', className }: HistoryProps): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  );
}
