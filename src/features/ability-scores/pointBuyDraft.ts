import type { AbilityScores } from '../../domain/types'
import {
  MINIMUM_POINT_BUY_ASSIGNMENT,
  validatePointBuyAssignment,
} from '../../rules/point-buy'

/** Temporary Point Buy workflow state. Always numeric, never persisted directly. */
export type PointBuyDraftScores = AbilityScores

export function createMinimumPointBuyDraft(): PointBuyDraftScores {
  return { ...MINIMUM_POINT_BUY_ASSIGNMENT }
}

export function initializePointBuyDraftFromAbilityScores(
  scores: AbilityScores,
): PointBuyDraftScores | null {
  const validation = validatePointBuyAssignment(scores)

  if (!validation.valid) {
    return null
  }

  return { ...scores }
}

export function resetPointBuyDraft(): PointBuyDraftScores {
  return createMinimumPointBuyDraft()
}

export function adjustPointBuyDraftScore(
  draft: PointBuyDraftScores,
  ability: keyof AbilityScores,
  delta: -1 | 1,
): PointBuyDraftScores {
  return {
    ...draft,
    [ability]: draft[ability] + delta,
  }
}
