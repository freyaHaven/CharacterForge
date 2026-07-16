import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function UiIconShell({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

/** Fallback only — no PNG exists yet for proficiency bonus. */
export function ProficiencyStatIcon({ className }: IconProps) {
  return (
    <UiIconShell className={className}>
      <path
        fill="currentColor"
        d="M12 2.5 4.5 6v5.2c0 4.6 3.1 8.9 7.5 9.8 4.4-.9 7.5-5.2 7.5-9.8V6L12 2.5Zm0 2.3 5.5 2.5v4c0 3.4-2.2 6.5-5.5 7.3-3.3-.8-5.5-3.9-5.5-7.3v-4L12 4.8Z"
      />
    </UiIconShell>
  )
}
