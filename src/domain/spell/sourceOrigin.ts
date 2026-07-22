/**
 * Machine-readable spell-source origin for stable Spells-page ordering.
 * Set at collection time in the resolver — never inferred from display labels.
 */

export type SpellSourceOriginKind =
  | 'species-trait'
  | 'background-origin'
  | 'species-feat-grant'
  | 'character-feat'
  | 'class-feat-grant'
  | 'class-core'
  | 'class-choice-option'
  | 'class-feature'
  | 'subclass-feature'

/**
 * Group-level band used to order Spells sections.
 * Class core / choice / subclass / feature share one class-instance group.
 */
export type SpellSourceGroupBand =
  | 'species-trait'
  | 'background-origin'
  | 'species-feat-grant'
  | 'character-feat'
  | 'class-feat-grant'
  | 'class-instance'

export type SpellSourceSortKey = {
  originKind: SpellSourceOriginKind
  /** Index in `character.classes` (−1 when not class-scoped). */
  classInstanceIndex: number
  /** Choice / feature unlock level (1 when not level-gated). */
  grantingLevel: number
  /** Stable insertion counter within the collector. */
  progressionOrder: number
  /** Final deterministic tie-breaker. */
  displayName: string
}

const ORIGIN_PRIORITY: Readonly<Record<SpellSourceOriginKind, number>> = {
  'species-trait': 10,
  'background-origin': 20,
  'species-feat-grant': 30,
  'character-feat': 31,
  'class-feat-grant': 32,
  'class-core': 40,
  'class-choice-option': 41,
  'class-feature': 42,
  'subclass-feature': 43,
}

const GROUP_BAND_PRIORITY: Readonly<Record<SpellSourceGroupBand, number>> = {
  'species-trait': 10,
  'background-origin': 20,
  'species-feat-grant': 30,
  'character-feat': 31,
  'class-feat-grant': 32,
  'class-instance': 40,
}

export function spellSourceGroupBand(
  originKind: SpellSourceOriginKind,
): SpellSourceGroupBand {
  switch (originKind) {
    case 'species-trait':
      return 'species-trait'
    case 'background-origin':
      return 'background-origin'
    case 'species-feat-grant':
      return 'species-feat-grant'
    case 'character-feat':
      return 'character-feat'
    case 'class-feat-grant':
      return 'class-feat-grant'
    case 'class-core':
    case 'class-choice-option':
    case 'class-feature':
    case 'subclass-feature':
      return 'class-instance'
  }
}

export function compareSpellSourceSortKeys(
  left: SpellSourceSortKey,
  right: SpellSourceSortKey,
): number {
  const originDelta =
    ORIGIN_PRIORITY[left.originKind] - ORIGIN_PRIORITY[right.originKind]
  if (originDelta !== 0) {
    return originDelta
  }

  if (left.classInstanceIndex !== right.classInstanceIndex) {
    return left.classInstanceIndex - right.classInstanceIndex
  }

  if (left.grantingLevel !== right.grantingLevel) {
    return left.grantingLevel - right.grantingLevel
  }

  if (left.progressionOrder !== right.progressionOrder) {
    return left.progressionOrder - right.progressionOrder
  }

  return left.displayName.localeCompare(right.displayName)
}

export function compareSpellSourceGroupBands(
  left: SpellSourceGroupBand,
  right: SpellSourceGroupBand,
): number {
  return GROUP_BAND_PRIORITY[left] - GROUP_BAND_PRIORITY[right]
}

export type SpellSourceGroupSortKey = {
  band: SpellSourceGroupBand
  classInstanceIndex: number
  grantingLevel: number
  progressionOrder: number
  displayName: string
}

export function compareSpellSourceGroupSortKeys(
  left: SpellSourceGroupSortKey,
  right: SpellSourceGroupSortKey,
): number {
  const bandDelta = compareSpellSourceGroupBands(left.band, right.band)
  if (bandDelta !== 0) {
    return bandDelta
  }

  if (left.classInstanceIndex !== right.classInstanceIndex) {
    return left.classInstanceIndex - right.classInstanceIndex
  }

  if (left.grantingLevel !== right.grantingLevel) {
    return left.grantingLevel - right.grantingLevel
  }

  if (left.progressionOrder !== right.progressionOrder) {
    return left.progressionOrder - right.progressionOrder
  }

  return left.displayName.localeCompare(right.displayName)
}

/** True when a class choice is a subclass selection (content-pack extensible). */
export function isSubclassClassChoice(choice: {
  id: string
  role?: 'subclass'
}): boolean {
  return choice.role === 'subclass' || choice.id.endsWith('-subclass')
}
