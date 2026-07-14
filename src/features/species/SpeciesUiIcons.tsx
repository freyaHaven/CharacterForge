import type { ComponentType, ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function UiIconShell({
  className,
  children,
  viewBox = '0 0 24 24',
}: {
  className?: string
  children: ReactNode
  viewBox?: string
}) {
  return (
    <svg
      className={className}
      viewBox={viewBox}
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function SelectionCheckIcon({ className }: IconProps) {
  return (
    <UiIconShell className={className}>
      <path
        fill="currentColor"
        d="M9.5 16.2 5.8 12.5l-1.3 1.4 5 5 10-10-1.4-1.4-8.6 8.7Z"
      />
    </UiIconShell>
  )
}

export function SizeStatIcon({ className }: IconProps) {
  return (
    <UiIconShell className={className}>
      <path
        fill="currentColor"
        d="M12 3a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm-7.5 13.5c0-2.5 3.4-4.5 7.5-4.5s7.5 2 7.5 4.5V21h-15v-4.5Z"
      />
      <path
        fill="currentColor"
        d="M18.5 8.5h2.25v1.5H18.5V8.5Zm0 3h2.25v1.5H18.5v-3Z"
        opacity="0.55"
      />
    </UiIconShell>
  )
}

export function SpeedStatIcon({ className }: IconProps) {
  return (
    <UiIconShell className={className}>
      <path
        fill="currentColor"
        d="M6.5 18.5c-2.2-2.2-2.2-5.8 0-8l1.1 1.1c-1.6 1.6-1.6 4.2 0 5.8l-1.1 1.1Zm11 0-1.1-1.1c1.6-1.6 1.6-4.2 0-5.8l1.1-1.1c2.2 2.2 2.2 5.8 0 8ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-1.5 2h3l-1.5 2.6L10.5 10Z"
      />
      <path
        fill="currentColor"
        d="M8.5 19.5h7v1.5h-7v-1.5Z"
      />
    </UiIconShell>
  )
}

function ShieldTraitIcon({ className }: IconProps) {
  return (
    <UiIconShell className={className}>
      <path
        fill="currentColor"
        d="M12 2 5 5v6c0 4.4 3 8.5 7 9 4-.5 7-4.6 7-9V5l-7-3Zm0 2.2 5 2.1v4.7c0 3.2-2.1 6.1-5 6.5-2.9-.4-5-3.3-5-6.5V6.3l5-2.1Z"
      />
    </UiIconShell>
  )
}

function HeartTraitIcon({ className }: IconProps) {
  return (
    <UiIconShell className={className}>
      <path
        fill="currentColor"
        d="M12 20.5s-6.8-4.2-8.6-8.1C1.8 9.1 3.6 6 6.7 6c1.7 0 3.1.9 3.9 2.2.8-1.3 2.2-2.2 3.9-2.2 3.1 0 4.9 3.1 3.3 6.4-1.8 3.9-8.6 8.1-8.6 8.1Z"
      />
    </UiIconShell>
  )
}

function TremorTraitIcon({ className }: IconProps) {
  return (
    <UiIconShell className={className}>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        d="M4 12h2l1-3 2 6 2-8 2 5 1-3h2"
      />
      <circle cx="12" cy="18.5" r="1.25" fill="currentColor" />
    </UiIconShell>
  )
}

function DefaultTraitIcon({ className }: IconProps) {
  return (
    <UiIconShell className={className}>
      <path
        fill="currentColor"
        d="M12 2.5 9.8 9H3.5l5.4 3.9-2.1 6.6L12 15.8l5.2 3.7-2.1-6.6 5.4-3.9h-6.3L12 2.5Z"
      />
    </UiIconShell>
  )
}

const TRAIT_ICON_BY_ID: Record<string, ComponentType<IconProps>> = {
  'dwarven-resilience': ShieldTraitIcon,
  'dwarven-toughness': HeartTraitIcon,
  stonecunning: TremorTraitIcon,
}

export function TraitIcon({
  traitId,
  className,
}: {
  traitId: string
  className?: string
}) {
  const Icon = TRAIT_ICON_BY_ID[traitId] ?? DefaultTraitIcon
  return <Icon className={className} />
}
