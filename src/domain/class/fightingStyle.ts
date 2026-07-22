import type { FeatCategory } from '../feat/types'
import type { ClassChoice, ClassChoiceOption } from './types'
import {
  isCompleteAsiChoiceValue,
  parseAsiChoice,
  selectAsiFeat,
} from './abilityScoreImprovement'

export const FIGHTING_STYLE_CHOICE_ID = 'fighting-style' as const
export const CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID =
  'champion-additional-fighting-style' as const

/** Legacy bare option ids → catalogue feat ids (pre-P2.2 saves). */
export const FIGHTING_STYLE_LEGACY_OPTION_TO_FEAT_ID = {
  archery: 'srd-2024:archery',
  defense: 'srd-2024:defense',
  'great-weapon-fighting': 'srd-2024:great-weapon-fighting',
  'two-weapon-fighting': 'srd-2024:two-weapon-fighting',
} as const satisfies Record<string, string>

export type FightingStyleLegacyOptionId =
  keyof typeof FIGHTING_STYLE_LEGACY_OPTION_TO_FEAT_ID

export function isFightingStyleLegacyOptionId(
  value: string,
): value is FightingStyleLegacyOptionId {
  return Object.prototype.hasOwnProperty.call(
    FIGHTING_STYLE_LEGACY_OPTION_TO_FEAT_ID,
    value,
  )
}

/**
 * True for class choices that grant Fighting Style feats via the shared
 * feat-grant encoding (`feat:{id}`), including Champion L7.
 */
export function isFightingStyleFeatGrantChoice(
  choice: ClassChoice,
): choice is Extract<ClassChoice, { type: 'single-select' }> {
  return (
    choice.type === 'single-select' &&
    choice.featGrantCategory === 'fighting-style'
  )
}

export function isFightingStyleFeatGrantChoiceId(choiceId: string): boolean {
  return (
    choiceId === FIGHTING_STYLE_CHOICE_ID ||
    choiceId === CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID
  )
}

export function selectFightingStyleFeat(featId: string): string {
  return selectAsiFeat(featId)
}

/**
 * Resolve a Fighting Style choice value to a catalogue feat id.
 * Accepts `feat:{id}` and legacy bare option ids. Returns null for
 * class alternates (Blessed Warrior / Druidic Warrior).
 */
export function getFightingStyleFeatIdFromChoiceValue(
  value: string | undefined,
): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }

  const parsed = parseAsiChoice(value)
  if (parsed?.kind === 'feat') {
    return parsed.featId.length > 0 ? parsed.featId : null
  }

  if (isFightingStyleLegacyOptionId(value)) {
    return FIGHTING_STYLE_LEGACY_OPTION_TO_FEAT_ID[value]
  }

  return null
}

export function isFightingStyleAlternateOptionValue(
  choice: Extract<ClassChoice, { type: 'single-select' }>,
  value: string,
): boolean {
  return choice.options.some((option) => option.id === value)
}

export function isCompleteFightingStyleChoiceValue(
  choice: Extract<ClassChoice, { type: 'single-select' }>,
  value: string | undefined,
): boolean {
  if (typeof value !== 'string' || value.length === 0) {
    return false
  }

  if (getFightingStyleFeatIdFromChoiceValue(value) !== null) {
    return isCompleteAsiChoiceValue(value) || isFightingStyleLegacyOptionId(value)
  }

  return isFightingStyleAlternateOptionValue(choice, value)
}

export function formatFightingStyleChoiceSummary(
  value: string,
  featNameById?: ReadonlyMap<string, string>,
  alternateLabelById?: ReadonlyMap<string, string>,
): string | null {
  const featId = getFightingStyleFeatIdFromChoiceValue(value)
  if (featId !== null) {
    const featName =
      featNameById?.get(featId) ?? formatFightingStyleFeatFallbackName(featId)
    return `Fighting Style: ${featName}`
  }

  const alternateLabel = alternateLabelById?.get(value)
  if (alternateLabel !== undefined) {
    return alternateLabel
  }

  return null
}

function formatFightingStyleFeatFallbackName(featId: string): string {
  const slug = featId.includes(':') ? featId.slice(featId.indexOf(':') + 1) : featId
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export type CreateFightingStyleChoiceOptions = {
  id?: string
  level: number
  prompt?: string
  recommendedFeatId?: string
  /** Class-specific alternates (Blessed Warrior, Druidic Warrior). */
  alternateOptions?: ClassChoiceOption[]
  availableWhen?: { choiceId: string; optionId: string }
}

/**
 * Fighting Style class choice. Catalogue options come from feats with
 * `category: 'fighting-style'`; `options` holds class-only alternates.
 */
export function createFightingStyleChoiceDefinition(
  options: CreateFightingStyleChoiceOptions,
): Extract<ClassChoice, { type: 'single-select' }> {
  return {
    id: options.id ?? FIGHTING_STYLE_CHOICE_ID,
    level: options.level,
    prompt: options.prompt ?? 'Choose a Fighting Style',
    type: 'single-select',
    required: true,
    options: options.alternateOptions ?? [],
    recommendedFeatId: options.recommendedFeatId,
    featGrantCategory: 'fighting-style' satisfies FeatCategory,
    ...(options.availableWhen !== undefined
      ? { availableWhen: options.availableWhen }
      : {}),
  }
}
