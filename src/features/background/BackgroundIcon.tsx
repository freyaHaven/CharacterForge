type BackgroundIconProps = {
  backgroundId: string
  className?: string
}

const BACKGROUND_INITIALS: Record<string, string> = {
  'srd-2024:acolyte': 'AC',
  'srd-2024:criminal': 'CR',
  'srd-2024:sage': 'SA',
  'srd-2024:soldier': 'SO',
}

function getBackgroundInitials(backgroundId: string): string {
  return BACKGROUND_INITIALS[backgroundId] ?? 'BG'
}

export function BackgroundIcon({ backgroundId, className }: BackgroundIconProps) {
  return (
    <span className={className} aria-hidden="true">
      {getBackgroundInitials(backgroundId)}
    </span>
  )
}
