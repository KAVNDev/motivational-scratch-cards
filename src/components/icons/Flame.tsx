interface FlameProps {
  size?: number;
  color?: string;
  className?: string;
}

export function Flame({ size = 24, color = 'currentColor', className }: FlameProps): JSX.Element {
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
      {/* Flame silhouette drawn with bezier curves */}
      <path d="M12 2 C12 2 8 7 8 11 C8 11 6 10 7 7 C7 7 3 11 3 15 C3 19.42 7.03 23 12 23 C16.97 23 21 19.42 21 15 C21 9 15 5 12 2 Z M12 20 C9.79 20 8 18.43 8 16.5 C8 14.5 10 13 12 11 C14 13 16 14.5 16 16.5 C16 18.43 14.21 20 12 20 Z" />
    </svg>
  );
}
