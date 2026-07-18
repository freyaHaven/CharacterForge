import { getClassIcon } from '../../assets/iconRegistry'

type ClassIconProps = {
  classId: string
  className?: string
  /** When set, the image is meaningful and receives this alt text. */
  alt?: string
}

/** Intrinsic pixel size of registered class glyph PNGs (and matching fallback). */
export const CLASS_ICON_INTRINSIC_SIZE = 192

function DefaultClassIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      width={CLASS_ICON_INTRINSIC_SIZE}
      height={CLASS_ICON_INTRINSIC_SIZE}
      aria-hidden="true"
      focusable="false"
    >
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
    </svg>
  )
}

/** Compact class glyph for headers, summaries, pills, review, and navigation. */
export function ClassIcon({ classId, className, alt }: ClassIconProps) {
  const iconSrc = getClassIcon(classId)
  const isDecorative = alt === undefined

  if (iconSrc !== null) {
    return (
      <img
        className={className}
        src={iconSrc}
        width={CLASS_ICON_INTRINSIC_SIZE}
        height={CLASS_ICON_INTRINSIC_SIZE}
        alt={isDecorative ? '' : alt}
        aria-hidden={isDecorative ? true : undefined}
        draggable={false}
      />
    )
  }

  return <DefaultClassIcon className={className} />
}
