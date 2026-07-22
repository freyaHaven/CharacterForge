import type { AbilityId } from '../abilities/types'
import { ABILITY_IDS } from '../abilities/types'
import { ASI_FEAT_SCORE_CHOICE_ID } from '../class/epicBoon'
import type { AsiScoreIncreaseMode, FeatChoice } from './types'

export type CreateAsiScoreIncreaseChoiceOptions = {
  id?: string
  prompt?: string
  required?: boolean
  modes?: AsiScoreIncreaseMode[]
  abilities?: AbilityId[]
  maximum?: number
}

export function createAsiScoreIncreaseChoice(
  options: CreateAsiScoreIncreaseChoiceOptions = {},
): Extract<FeatChoice, { type: 'asi-score-increase' }> {
  return {
    id: options.id ?? ASI_FEAT_SCORE_CHOICE_ID,
    prompt: options.prompt ?? 'Ability Score Increase',
    type: 'asi-score-increase',
    required: options.required ?? true,
    ...(options.modes !== undefined ? { modes: options.modes } : {}),
    ...(options.abilities !== undefined ? { abilities: options.abilities } : {}),
    ...(options.maximum !== undefined ? { maximum: options.maximum } : {}),
  }
}

/** Default modes for the Ability Score Improvement feat. */
export const DEFAULT_ASI_SCORE_INCREASE_MODES: readonly AsiScoreIncreaseMode[] =
  ['plus-2', 'plus-1-1']

export function getAsiScoreIncreaseModes(
  choice: Extract<FeatChoice, { type: 'asi-score-increase' }>,
): AsiScoreIncreaseMode[] {
  return choice.modes !== undefined && choice.modes.length > 0
    ? [...choice.modes]
    : [...DEFAULT_ASI_SCORE_INCREASE_MODES]
}

export function getAsiScoreIncreaseAbilities(
  choice: Extract<FeatChoice, { type: 'asi-score-increase' }>,
): AbilityId[] {
  return choice.abilities !== undefined && choice.abilities.length > 0
    ? [...choice.abilities]
    : [...ABILITY_IDS]
}

export function getAsiScoreIncreaseMaximum(
  choice: Extract<FeatChoice, { type: 'asi-score-increase' }>,
): number {
  return choice.maximum ?? 20
}
