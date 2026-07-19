const SCHOOL_SLUGS = [
  'abjuration',
  'conjuration',
  'divination',
  'enchantment',
  'evocation',
  'illusion',
  'necromancy',
  'transmutation',
] as const

export type SpellSchoolSlug = (typeof SCHOOL_SLUGS)[number]

const SCHOOL_GLYPHS: Record<SpellSchoolSlug, string> = {
  abjuration: 'Ab',
  conjuration: 'Co',
  divination: 'Di',
  enchantment: 'En',
  evocation: 'Ev',
  illusion: 'Il',
  necromancy: 'Ne',
  transmutation: 'Tr',
}

export function normalizeSpellSchool(school: string): SpellSchoolSlug | 'unknown' {
  const slug = school.trim().toLowerCase()
  return (SCHOOL_SLUGS as readonly string[]).includes(slug)
    ? (slug as SpellSchoolSlug)
    : 'unknown'
}

export function getSpellSchoolGlyph(school: string): string {
  const slug = normalizeSpellSchool(school)
  if (slug === 'unknown') {
    return school.trim().slice(0, 2).toUpperCase() || '?'
  }
  return SCHOOL_GLYPHS[slug]
}
