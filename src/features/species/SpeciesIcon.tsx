import { getRaceIcon } from '../../assets/iconRegistry'

type SpeciesIconProps = {
  speciesId: string
  className?: string
  /** When set, the image is meaningful and receives this alt text. */
  alt?: string
}

/** Intrinsic pixel size of registered species glyph PNGs (and matching fallback). */
export const SPECIES_ICON_INTRINSIC_SIZE = 256

function DefaultSpeciesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width={SPECIES_ICON_INTRINSIC_SIZE}
      height={SPECIES_ICON_INTRINSIC_SIZE}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="3" />
      <path
        fill="currentColor"
        d="M24 14c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6Zm-9 20c0 3.3 4.5 6 9 6s9-2.7 9-6H15Z"
      />
    </svg>
  )
}

export function SpeciesIcon({ speciesId, className, alt }: SpeciesIconProps) {
  const iconSrc = getRaceIcon(speciesId)
  const isDecorative = alt === undefined

  if (iconSrc !== null) {
    return (
      <img
        className={className}
        src={iconSrc}
        width={SPECIES_ICON_INTRINSIC_SIZE}
        height={SPECIES_ICON_INTRINSIC_SIZE}
        alt={isDecorative ? '' : alt}
        aria-hidden={isDecorative ? true : undefined}
        draggable={false}
      />
    )
  }

  return <DefaultSpeciesIcon className={className} />
}
