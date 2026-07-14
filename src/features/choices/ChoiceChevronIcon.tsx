type ChoiceChevronIconProps = {
  className?: string
}

export function ChoiceChevronIcon({ className }: ChoiceChevronIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M8.12 9.29 12 13.17l3.88-3.88a1 1 0 1 1 1.41 1.41l-4.59 4.59a1 1 0 0 1-1.41 0L6.71 10.7a1 1 0 0 1 1.41-1.41Z"
      />
    </svg>
  )
}
