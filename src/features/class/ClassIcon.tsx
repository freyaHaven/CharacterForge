import type { ComponentType, ReactNode } from 'react'

type ClassIconProps = {
  classId: string
  className?: string
}

function IconShell({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width="48"
      height="48"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

function FighterIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path
        fill="currentColor"
        d="M24 4 14 12v8l-4 4v16h28V24l-4-4v-8L24 4Zm0 6 6 5v6.2l3 3V36H15v-11.8l3-3V15l6-5Z"
      />
      <path
        fill="currentColor"
        d="M22 26h4v10h-4V26Z"
      />
    </IconShell>
  )
}

function DefaultClassIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        fill="currentColor"
        d="M24 12c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8Zm-12 22c0 4.4 5.4 8 12 8s12-3.6 12-8H12Z"
      />
    </IconShell>
  )
}

const CLASS_ICON_SUFFIXES: Record<
  string,
  ComponentType<{ className?: string }>
> = {
  fighter: FighterIcon,
}

function resolveClassIcon(classId: string) {
  const suffix = classId.split(':').at(-1) ?? classId
  return CLASS_ICON_SUFFIXES[suffix] ?? DefaultClassIcon
}

export function ClassIcon({ classId, className }: ClassIconProps) {
  const Icon = resolveClassIcon(classId)
  return <Icon className={className} />
}
