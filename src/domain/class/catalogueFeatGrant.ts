import type { FeatCategory } from '../feat/types'
import type { ClassChoice } from './types'
import {
  getFightingStyleFeatIdFromChoiceValue,
  isCompleteFightingStyleChoiceValue,
  isFightingStyleFeatGrantChoice,
  isFightingStyleFeatGrantChoiceId,
} from './fightingStyle'
import {
  getEpicBoonFeatIdFromChoiceValue,
  isCompleteEpicBoonChoiceValue,
  isEpicBoonChoiceId,
} from './epicBoon'
import {
  isCompleteAsiChoiceValue,
  parseAsiChoice,
  selectAsiFeat,
} from './abilityScoreImprovement'

/** Generic catalogue feat-grant choice ids: `feat-grant:{slot}`. */
export const FEAT_GRANT_CHOICE_ID_PREFIX = 'feat-grant:' as const

export function isCatalogueFeatGrantChoiceId(choiceId: string): boolean {
  return (
    choiceId.startsWith(FEAT_GRANT_CHOICE_ID_PREFIX) ||
    isFightingStyleFeatGrantChoiceId(choiceId) ||
    isEpicBoonChoiceId(choiceId)
  )
}

export function isCatalogueFeatGrantChoice(
  choice: ClassChoice,
): choice is Extract<ClassChoice, { type: 'single-select' }> & {
  featGrantCategory: FeatCategory
} {
  return (
    choice.type === 'single-select' &&
    choice.featGrantCategory !== undefined &&
    !isFightingStyleFeatGrantChoice(choice)
  )
}

export function selectCatalogueFeatGrant(featId: string): string {
  return selectAsiFeat(featId)
}

export function getCatalogueFeatGrantIdFromChoiceValue(
  value: string | undefined,
): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }

  const parsed = parseAsiChoice(value)
  if (parsed?.kind === 'feat' && parsed.featId.length > 0) {
    return parsed.featId
  }

  return getFightingStyleFeatIdFromChoiceValue(value)
}

export function isCompleteCatalogueFeatGrantValue(
  value: string | undefined,
): boolean {
  return (
    isCompleteAsiChoiceValue(value) ||
    isCompleteEpicBoonChoiceValue(value) ||
    (typeof value === 'string' &&
      getFightingStyleFeatIdFromChoiceValue(value) !== null)
  )
}

export {
  isFightingStyleFeatGrantChoice,
  isFightingStyleFeatGrantChoiceId,
  isCompleteFightingStyleChoiceValue,
  getEpicBoonFeatIdFromChoiceValue,
}
