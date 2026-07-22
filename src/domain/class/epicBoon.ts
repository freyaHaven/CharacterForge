import type { ClassChoice } from './types'
import {
  isCompleteAsiChoiceValue,
  parseAsiChoice,
  selectAsiFeat,
} from './abilityScoreImprovement'

export const EPIC_BOON_CHOICE_ID = 'epic-boon' as const

/** Nested ASI feat score-choice id (`feat-choices:{slot}:ability-score-increase`). */
export const ASI_FEAT_SCORE_CHOICE_ID = 'ability-score-increase' as const

/** General Ability Score Improvement feat (nested score picks via companion keys). */
export const ABILITY_SCORE_IMPROVEMENT_FEAT_ID =
  'srd-2024:ability-score-improvement' as const

export function isEpicBoonChoiceId(choiceId: string): boolean {
  return choiceId === EPIC_BOON_CHOICE_ID
}

export function isAbilityScoreImprovementFeatId(featId: string): boolean {
  return featId === ABILITY_SCORE_IMPROVEMENT_FEAT_ID
}

/**
 * Cycle guard for ASI class choice "Choose a Feat" mode: the Ability Score
 * Improvement feat must not appear there (players already have +2 / +1+1 modes).
 * Epic Boon and other feat-only grant pickers may offer the ASI feat — nested
 * score picks live in companion keys (`feat-choices:{slot}:…`).
 */
export function isFeatExcludedFromAsiFeatModePicker(featId: string): boolean {
  return isAbilityScoreImprovementFeatId(featId)
}

/**
 * @deprecated Prefer {@link isFeatExcludedFromAsiFeatModePicker}. Kept as an
 * alias for ASI feat-mode exclusion only (not Epic Boon / species grants).
 */
export function isFeatExcludedFromFeatGrantPickers(featId: string): boolean {
  return isFeatExcludedFromAsiFeatModePicker(featId)
}

export function isCompleteEpicBoonChoiceValue(
  value: string | undefined,
): boolean {
  if (typeof value !== 'string' || value.length === 0) {
    return false
  }

  const parsed = parseAsiChoice(value)
  return parsed?.kind === 'feat' && parsed.featId.length > 0
}

export function selectEpicBoonFeat(featId: string): string {
  return selectAsiFeat(featId)
}

export function getEpicBoonFeatIdFromChoiceValue(
  value: string | undefined,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const parsed = parseAsiChoice(value)
  return parsed?.kind === 'feat' ? parsed.featId : null
}

export function formatEpicBoonChoiceSummary(
  value: string,
  featNameById?: ReadonlyMap<string, string>,
): string | null {
  if (!isCompleteAsiChoiceValue(value)) {
    return null
  }

  const featId = getEpicBoonFeatIdFromChoiceValue(value)
  if (featId === null) {
    return null
  }

  const featName = featNameById?.get(featId) ?? featId
  return `Feat: ${featName}`
}

export type CreateEpicBoonChoiceOptions = {
  /** Class-recommended epic boon feat id (SRD recommendation). */
  recommendedFeatId: string
}

/**
 * Level-19 Epic Boon class choice. Linked to feature id `epic-boon`.
 * Options are empty — the UI loads feats from the catalogue.
 */
export function createEpicBoonChoiceDefinition(
  options: CreateEpicBoonChoiceOptions,
): Extract<ClassChoice, { type: 'single-select' }> {
  return {
    id: EPIC_BOON_CHOICE_ID,
    level: 19,
    prompt: 'Epic Boon',
    type: 'single-select',
    required: true,
    options: [],
    recommendedFeatId: options.recommendedFeatId,
  }
}
