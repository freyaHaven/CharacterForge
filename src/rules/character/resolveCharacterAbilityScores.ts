import { ABILITY_IDS } from '../../domain/abilities/types'
import type { AbilityScores } from '../../domain/types'
import type {
  BackgroundDefinition,
  BackgroundSelection,
} from '../../domain/background/types'
import { computeAbilityScoreBonuses } from '../../domain/background/computeAbilityScoreBonuses'
import type { CharacterClassSelection } from '../../domain/class/types'
import {
  collectAsiAbilityScoreBonuses,
  isAbilityScoreImprovementChoiceId,
  parseAsiChoice,
} from '../../domain/class/abilityScoreImprovement'
import {
  ABILITY_SCORE_IMPROVEMENT_FEAT_ID,
  getEpicBoonFeatIdFromChoiceValue,
  isEpicBoonChoiceId,
} from '../../domain/class/epicBoon'
import {
  getFightingStyleFeatIdFromChoiceValue,
  isFightingStyleFeatGrantChoiceId,
} from '../../domain/class/fightingStyle'
import { collectAsiFeatAbilityBonuses } from '../../domain/feat/resolveFeatProficiencies'
import { readFeatGrantChoices } from '../../domain/feat/featGrantChoiceStorage'
import type { FeatDefinition } from '../../domain/feat/types'
import type { SpeciesSelection } from '../../domain/species/types'

export type ResolveCharacterAbilityScoresInput = {
  baseScores: AbilityScores
  backgroundDefinition?: BackgroundDefinition | null
  backgroundSelection?: BackgroundSelection | null
  classes?: readonly CharacterClassSelection[]
  /** Species selection — for nested ASI-feat grants under feat-grant choices. */
  speciesSelection?: SpeciesSelection | null
  /** Feat definitions keyed by id (needed for ASI-feat nested score picks). */
  featById?: ReadonlyMap<string, FeatDefinition>
}

function collectNestedAsiFeatBonusesFromHost(
  hostChoices: Record<string, string | string[] | undefined>,
  featById: ReadonlyMap<string, FeatDefinition> | undefined,
): Partial<Record<(typeof ABILITY_IDS)[number], number>> {
  const bonuses: Partial<Record<(typeof ABILITY_IDS)[number], number>> = {}

  if (featById === undefined) {
    return bonuses
  }

  for (const [choiceId, value] of Object.entries(hostChoices)) {
    if (typeof value !== 'string') {
      continue
    }

    let featId: string | null = null
    if (isAbilityScoreImprovementChoiceId(choiceId)) {
      const parsed = parseAsiChoice(value)
      featId = parsed?.kind === 'feat' ? parsed.featId : null
    } else if (isEpicBoonChoiceId(choiceId)) {
      featId = getEpicBoonFeatIdFromChoiceValue(value)
    } else if (isFightingStyleFeatGrantChoiceId(choiceId)) {
      featId = getFightingStyleFeatIdFromChoiceValue(value)
    } else if (value === ABILITY_SCORE_IMPROVEMENT_FEAT_ID) {
      // Species feat-grant stores bare feat ids.
      featId = value
    }

    if (featId !== ABILITY_SCORE_IMPROVEMENT_FEAT_ID) {
      continue
    }

    const definition = featById.get(featId)
    if (definition === undefined) {
      continue
    }

    const nested = readFeatGrantChoices(hostChoices, choiceId)
    const nestedBonuses = collectAsiFeatAbilityBonuses(definition, nested)
    for (const abilityId of ABILITY_IDS) {
      const bonus = nestedBonuses[abilityId]
      if (typeof bonus === 'number') {
        bonuses[abilityId] = (bonuses[abilityId] ?? 0) + bonus
      }
    }
  }

  return bonuses
}

/**
 * Resolve final ability scores for creation-time rules checks and sheet math:
 * base scores + background ASI + completed class ASI choice bonuses + nested
 * ASI-feat score picks under feat grants.
 *
 * Does not mutate persisted `character.abilityScores`.
 */
export function resolveCharacterAbilityScores(
  input: ResolveCharacterAbilityScoresInput,
): AbilityScores {
  const totals: AbilityScores = { ...input.baseScores }

  if (
    input.backgroundDefinition != null &&
    input.backgroundSelection != null
  ) {
    const backgroundBonuses = computeAbilityScoreBonuses(
      input.backgroundDefinition,
      input.backgroundSelection.abilityScoreIncrease,
    )
    for (const abilityId of ABILITY_IDS) {
      const bonus = backgroundBonuses[abilityId]
      if (typeof bonus === 'number') {
        totals[abilityId] += bonus
      }
    }
  }

  for (const instance of input.classes ?? []) {
    const asiBonuses = collectAsiAbilityScoreBonuses(instance.choices)
    for (const abilityId of ABILITY_IDS) {
      const bonus = asiBonuses[abilityId]
      if (typeof bonus === 'number') {
        totals[abilityId] += bonus
      }
    }

    const nestedBonuses = collectNestedAsiFeatBonusesFromHost(
      instance.choices,
      input.featById,
    )
    for (const abilityId of ABILITY_IDS) {
      const bonus = nestedBonuses[abilityId]
      if (typeof bonus === 'number') {
        totals[abilityId] += bonus
      }
    }
  }

  if (input.speciesSelection != null) {
    const nestedBonuses = collectNestedAsiFeatBonusesFromHost(
      input.speciesSelection.choices,
      input.featById,
    )
    for (const abilityId of ABILITY_IDS) {
      const bonus = nestedBonuses[abilityId]
      if (typeof bonus === 'number') {
        totals[abilityId] += bonus
      }
    }
  }

  return totals
}
