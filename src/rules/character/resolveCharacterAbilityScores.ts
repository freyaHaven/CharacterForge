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
  getEpicBoonFeatIdFromChoiceValue,
  isEpicBoonChoiceId,
} from '../../domain/class/epicBoon'
import {
  getCatalogueFeatGrantIdFromChoiceValue,
  isCatalogueFeatGrantChoiceId,
} from '../../domain/class/catalogueFeatGrant'
import {
  getFightingStyleFeatIdFromChoiceValue,
  isFightingStyleFeatGrantChoiceId,
} from '../../domain/class/fightingStyle'
import { collectAsiFeatAbilityBonuses } from '../../domain/feat/resolveFeatProficiencies'
import {
  BACKGROUND_ORIGIN_FEAT_GRANT_SLOT_ID,
  readFeatGrantChoices,
} from '../../domain/feat/featGrantChoiceStorage'
import type { FeatDefinition } from '../../domain/feat/types'
import type { SpeciesSelection } from '../../domain/species/types'

type AbilityBonusMap = Partial<Record<(typeof ABILITY_IDS)[number], number>>

export type ResolveCharacterAbilityScoresInput = {
  baseScores: AbilityScores
  backgroundDefinition?: BackgroundDefinition | null
  backgroundSelection?: BackgroundSelection | null
  classes?: readonly CharacterClassSelection[]
  /** Species selection — for nested ASI-feat grants under feat-grant choices. */
  speciesSelection?: SpeciesSelection | null
  /** Feat definitions keyed by id (needed for ASI nested score picks). */
  featById?: ReadonlyMap<string, FeatDefinition>
}

function mergeBonuses(target: AbilityBonusMap, source: AbilityBonusMap): void {
  for (const abilityId of ABILITY_IDS) {
    const bonus = source[abilityId]
    if (typeof bonus === 'number') {
      target[abilityId] = (target[abilityId] ?? 0) + bonus
    }
  }
}

function applyBonuses(totals: AbilityScores, bonuses: AbilityBonusMap): void {
  for (const abilityId of ABILITY_IDS) {
    const bonus = bonuses[abilityId]
    if (typeof bonus === 'number') {
      totals[abilityId] += bonus
    }
  }
}

function collectNestedAsiFeatBonusesFromHost(
  hostChoices: Record<string, string | string[] | undefined>,
  featById: ReadonlyMap<string, FeatDefinition> | undefined,
): AbilityBonusMap {
  const bonuses: AbilityBonusMap = {}

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
    } else if (isCatalogueFeatGrantChoiceId(choiceId)) {
      featId = getCatalogueFeatGrantIdFromChoiceValue(value)
    } else if (isEpicBoonChoiceId(choiceId)) {
      featId = getEpicBoonFeatIdFromChoiceValue(value)
    } else if (isFightingStyleFeatGrantChoiceId(choiceId)) {
      featId = getFightingStyleFeatIdFromChoiceValue(value)
    } else if (featById.has(value)) {
      // Species feat-grant stores bare feat ids.
      featId = value
    }

    if (featId === null) {
      continue
    }

    const definition = featById.get(featId)
    if (definition === undefined) {
      continue
    }

    if (
      !definition.choices.some((choice) => choice.type === 'asi-score-increase')
    ) {
      continue
    }

    const nested = readFeatGrantChoices(hostChoices, choiceId)
    mergeBonuses(bonuses, collectAsiFeatAbilityBonuses(definition, nested))
  }

  return bonuses
}

/**
 * Resolve final ability scores for creation-time rules checks and sheet math:
 * base scores + background ASI + completed class ASI choice bonuses + nested
 * feat score picks under feat grants (ASI feat, Grappler, Epic Boons, etc.).
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
    applyBonuses(
      totals,
      computeAbilityScoreBonuses(
        input.backgroundDefinition,
        input.backgroundSelection.abilityScoreIncrease,
      ),
    )

    if (input.featById !== undefined) {
      const originFeatId = input.backgroundDefinition.originFeat.featId
      const originDefinition = input.featById.get(originFeatId)
      if (
        originDefinition !== undefined &&
        originDefinition.choices.some(
          (choice) => choice.type === 'asi-score-increase',
        )
      ) {
        const nested = readFeatGrantChoices(
          input.backgroundSelection.choices,
          BACKGROUND_ORIGIN_FEAT_GRANT_SLOT_ID,
        )
        applyBonuses(
          totals,
          collectAsiFeatAbilityBonuses(originDefinition, nested),
        )
      }
    }
  }

  for (const instance of input.classes ?? []) {
    applyBonuses(totals, collectAsiAbilityScoreBonuses(instance.choices))
    applyBonuses(
      totals,
      collectNestedAsiFeatBonusesFromHost(instance.choices, input.featById),
    )
  }

  if (input.speciesSelection != null) {
    applyBonuses(
      totals,
      collectNestedAsiFeatBonusesFromHost(
        input.speciesSelection.choices,
        input.featById,
      ),
    )
  }

  return totals
}
