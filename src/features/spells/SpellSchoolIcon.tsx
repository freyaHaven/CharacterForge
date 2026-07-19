import {
  getSpellSchoolGlyph,
  normalizeSpellSchool,
} from './spellSchool'

export type SpellSchoolIconProps = {
  school: string
  /** Optional future artwork URL; when set, replaces the glyph. */
  artworkSrc?: string | null
  className?: string
}

/**
 * Reusable school mark for spell cards.
 * Starts as a coloured glyph disc; swap in artwork later via `artworkSrc`
 * without changing card layout.
 */
export function SpellSchoolIcon({
  school,
  artworkSrc = null,
  className,
}: SpellSchoolIconProps) {
  const slug = normalizeSpellSchool(school)
  const classes = [
    'spell-school-icon',
    `spell-school-icon--${slug}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={classes}
      data-school={slug}
      aria-hidden="true"
    >
      <span className="spell-school-icon__accent" />
      {artworkSrc !== null && artworkSrc.length > 0 ? (
        <img
          className="spell-school-icon__art"
          src={artworkSrc}
          alt=""
          draggable={false}
        />
      ) : (
        <span className="spell-school-icon__glyph">
          {getSpellSchoolGlyph(school)}
        </span>
      )}
    </span>
  )
}
