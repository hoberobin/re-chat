export function ArrowUpIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={20}
      height={20}
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

export function ArrowDownIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={20}
      height={20}
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
