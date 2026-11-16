interface StarProps {
  size?: number;
  color?: string;
  className?: string;
}

export function Star({ size = 24, color = 'currentColor', className }: StarProps): JSX.Element {
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
      {/* Classic five-point star */}
      <path d="M12 2 L14.09 8.26 L20.63 8.27 L15.19 12.14 L17.18 18.41 L12 14.77 L6.82 18.41 L8.81 12.14 L3.37 8.27 L9.91 8.26 Z" />
    </svg>
  );
}
