import { getClassInsignia } from '../../assets/iconRegistry'
import { ClassIcon } from './ClassIcon'

type ClassInsigniaProps = {
  classId: string
  className?: string
  /** When set, the image is meaningful and receives this alt text. */
  alt?: string
}

/** Intrinsic pixel size of registered class insignia PNGs. */
export const CLASS_INSIGNIA_INTRINSIC_SIZE = 192

/**
 * Class crest for primary selection cards.
 * Falls back to the compact glyph when no insignia asset is registered.
 */
export function ClassInsignia({ classId, className, alt }: ClassInsigniaProps) {
  const insigniaSrc = getClassInsignia(classId)
  const isDecorative = alt === undefined

  if (insigniaSrc !== null) {
    return (
      <img
        className={className}
        src={insigniaSrc}
        width={CLASS_INSIGNIA_INTRINSIC_SIZE}
        height={CLASS_INSIGNIA_INTRINSIC_SIZE}
        alt={isDecorative ? '' : alt}
        aria-hidden={isDecorative ? true : undefined}
        draggable={false}
      />
    )
  }

  return <ClassIcon classId={classId} className={className} alt={alt} />
}
