import type { ComponentType, ReactNode } from 'react'

type SpeciesIconProps = {
  speciesId: string
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

function DwarfIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path
        fill="currentColor"
        d="M24 4c-4.2 0-7.5 3.3-7.5 7.5 0 2.6 1.3 4.9 3.3 6.2L8 34.5V44h32V34.5L28.2 17.7c2-1.3 3.3-3.6 3.3-6.2C31.5 7.3 28.2 4 24 4Zm0 6c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3Zm-8.8 24.8 4.8-9.6 3.2 2.4 4.8-7.2 4.8 7.2 3.2-2.4 4.8 9.6H15.2Z"
      />
    </IconShell>
  )
}

function DragonbornIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path
        fill="currentColor"
        d="M24 4c-7.2 0-13 5.8-13 13 0 4.2 2 7.9 5.1 10.3L10 44h28l-6.1-16.7C34 25.9 36 22.2 36 17c0-7.2-5.8-13-13-13Zm0 6c3.9 0 7 3.1 7 7s-3.1 7-7 7-7-3.1-7-7 3.1-7 7-7Zm-7.8 24.2 2.8-7.6 5 3.8 5-7.5 5 7.5 5-3.8 2.8 7.6H16.2Z"
      />
      <path
        fill="currentColor"
        d="M18 14.5c-.8 1.2-.5 2.8.7 3.6 1.2.8 2.8.5 3.6-.7.8-1.2.5-2.8-.7-3.6-1.2-.8-2.8-.5-3.6.7Zm12 0c-.8-1.2-2.4-1.5-3.6-.7-1.2.8-1.5 2.4-.7 3.6.8 1.2 2.4 1.5 3.6.7 1.2-.8 1.5-2.4.7-3.6Z"
      />
    </IconShell>
  )
}

function HumanIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path
        fill="currentColor"
        d="M24 6a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm-11 18c-2.8 0-5 2.2-5 5v15h32V29c0-2.8-2.2-5-5-5H13Z"
      />
    </IconShell>
  )
}

function ElfIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path
        fill="currentColor"
        d="M24 4c-6.1 0-11 4.9-11 11 0 3.4 1.6 6.4 4 8.3V44h14V23.3c2.4-1.9 4-4.9 4-8.3 0-6.1-4.9-11-11-11Zm0 6a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm-7 28V26.8c1.9 1 4 1.6 7 1.6s5.1-.6 7-1.6V38H17Z"
      />
    </IconShell>
  )
}

function DefaultSpeciesIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="3" />
      <path
        fill="currentColor"
        d="M24 14c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6Zm-9 20c0 3.3 4.5 6 9 6s9-2.7 9-6H15Z"
      />
    </IconShell>
  )
}

const SPECIES_ICON_SUFFIXES: Record<string, ComponentType<{ className?: string }>> = {
  dwarf: DwarfIcon,
  dragonborn: DragonbornIcon,
  human: HumanIcon,
  elf: ElfIcon,
}

function resolveSpeciesIcon(speciesId: string) {
  const suffix = speciesId.split(':').at(-1) ?? speciesId
  return SPECIES_ICON_SUFFIXES[suffix] ?? DefaultSpeciesIcon
}

export function SpeciesIcon({ speciesId, className }: SpeciesIconProps) {
  const Icon = resolveSpeciesIcon(speciesId)
  return <Icon className={className} />
}
