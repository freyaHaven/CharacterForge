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

/** Player-facing Spells-page band (presentation only). */
export type SpellPresentationCategory =
  | 'species'
  | 'background'
  | 'class'
  | 'subclass'
  | 'feat'
  | 'item'

/** Presentation grouping for Spells UI — does not affect rules or persistence. */
export type SpellPresentationSourceRef = {
  category: SpellPresentationCategory
  sourceId: string
  sourceTitle: string
}

export function presentationCategoryForOrigin(
  originKind: SpellSourceOriginKind,
): SpellPresentationCategory {
  switch (originKind) {
    case 'species-trait':
      return 'species'
    case 'background-origin':
      return 'background'
    case 'subclass-feature':
      return 'subclass'
    case 'character-feat':
    case 'species-feat-grant':
    case 'class-feat-grant':
      return 'feat'
    case 'class-core':
    case 'class-choice-option':
    case 'class-feature':
      return 'class'
  }
}

/**
 * Group-level band used to order Spells sections.
 * Class core / choice / subclass / feature / class-feat-grant share one
 * class-instance band so ASI feat spells interleave by granting level.
 */
export type SpellSourceGroupBand =
  | 'species-trait'
  | 'background-origin'
  | 'species-feat-grant'
  | 'character-feat'
  | 'class-instance'

export type SpellSourceSortKey = {
  originKind: SpellSourceOriginKind
  /** Index in `character.classes` (−1 when not class-scoped). */
  classInstanceIndex: number
  /** Choice / feature / entitlement unlock level (1 when not level-gated). */
  grantingLevel: number
  /** Stable insertion counter within the collector. */
  progressionOrder: number
  /** Final deterministic tie-breaker. */
  displayName: string
}

const GROUP_BAND_PRIORITY: Readonly<Record<SpellSourceGroupBand, number>> = {
  'species-trait': 10,
  'background-origin': 20,
  'species-feat-grant': 30,
  'character-feat': 31,
  'class-instance': 40,
}

/**
 * Within the same class instance and granting level, order:
 * activating choice → subclass package features → other features →
 * selectable class entitlements → class-granted feat spellcasting.
 */
const WITHIN_LEVEL_ORIGIN_PRIORITY: Readonly<
  Record<SpellSourceOriginKind, number>
> = {
  'species-trait': 0,
  'background-origin': 0,
  'species-feat-grant': 0,
  'character-feat': 0,
  'class-choice-option': 10,
  'subclass-feature': 20,
  'class-feature': 30,
  'class-core': 40,
  'class-feat-grant': 50,
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
    case 'class-core':
    case 'class-choice-option':
    case 'class-feature':
    case 'subclass-feature':
      return 'class-instance'
  }
}

export function compareSpellSourceGroupBands(
  left: SpellSourceGroupBand,
  right: SpellSourceGroupBand,
): number {
  return GROUP_BAND_PRIORITY[left] - GROUP_BAND_PRIORITY[right]
}

/**
 * Stable progression order for spell sources.
 *
 * Cross-band: species → background → feats → class instance.
 * Within a class instance: granting level, then within-level origin priority,
 * then display name, then collector insertion order (collision only).
 */
export function compareSpellSourceSortKeys(
  left: SpellSourceSortKey,
  right: SpellSourceSortKey,
): number {
  const bandDelta = compareSpellSourceGroupBands(
    spellSourceGroupBand(left.originKind),
    spellSourceGroupBand(right.originKind),
  )
  if (bandDelta !== 0) {
    return bandDelta
  }

  if (left.classInstanceIndex !== right.classInstanceIndex) {
    return left.classInstanceIndex - right.classInstanceIndex
  }

  if (left.grantingLevel !== right.grantingLevel) {
    return left.grantingLevel - right.grantingLevel
  }

  const originDelta =
    WITHIN_LEVEL_ORIGIN_PRIORITY[left.originKind] -
    WITHIN_LEVEL_ORIGIN_PRIORITY[right.originKind]
  if (originDelta !== 0) {
    return originDelta
  }

  // Prefer display name over collector insertion so pack/homebrew definition
  // order does not reshuffle same-level, same-priority sources.
  const nameDelta = left.displayName.localeCompare(right.displayName)
  if (nameDelta !== 0) {
    return nameDelta
  }

  return left.progressionOrder - right.progressionOrder
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

  const nameDelta = left.displayName.localeCompare(right.displayName)
  if (nameDelta !== 0) {
    return nameDelta
  }

  return left.progressionOrder - right.progressionOrder
}

/** True when a class choice is a subclass selection (content-pack extensible). */
export function isSubclassClassChoice(choice: {
  id: string
  role?: 'subclass'
}): boolean {
  return choice.role === 'subclass' || choice.id.endsWith('-subclass')
}
