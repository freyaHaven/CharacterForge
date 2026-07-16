import type {
  ClassDefinition,
  CharacterClassSelection,
  HitDie,
} from '../../domain/class/types'
import {
  getHitDieContribution,
  syncHitPointIncreases,
  type HitPointIncrease,
} from '../../domain/class/hitPointIncreases'
import { getAbilityModifier } from '../../domain/abilities'
import type { AbilityScores } from '../../domain/types'
import type { SpeciesDefinition, SpeciesSelection } from '../../domain/species/types'
import { resolveSpeciesEffects } from '../species/resolveSpeciesEffects'
import type { RandomSource } from '../rolled/random'

export type HitPointLevelBreakdown = {
  instanceId: string
  classId: string
  classLevel: number
  method: HitPointIncrease['method']
  hitDieContribution: number
  constitutionModifier: number
  speciesBonus: number
  total: number
}

export type ResolvedHitPoints = {
  maximum: number
  constitutionModifier: number
  speciesBonusPerLevel: number
  levels: HitPointLevelBreakdown[]
  isComplete: boolean
}

function getSpeciesBonusPerLevel(
  speciesDefinition: SpeciesDefinition | null,
  speciesSelection: SpeciesSelection | null,
): number {
  if (speciesDefinition === null || speciesSelection === null) {
    return 0
  }

  let total = 0
  for (const effect of resolveSpeciesEffects(
    speciesDefinition,
    speciesSelection,
  )) {
    if (effect.kind === 'hit-point-maximum-per-level') {
      total += effect.amount
    }
  }

  return total
}

export function rollHitDie(
  sides: HitDie['sides'],
  rng: RandomSource = Math.random,
): number {
  const raw = Math.floor(rng() * sides) + 1
  return Math.min(sides, Math.max(1, raw))
}

export function resolveHitPointMaximum(input: {
  classes: readonly CharacterClassSelection[]
  startingClassInstanceId: string | null
  classDefinitionsById: ReadonlyMap<string, ClassDefinition>
  abilityScores: AbilityScores
  speciesDefinition: SpeciesDefinition | null
  speciesSelection: SpeciesSelection | null
}): ResolvedHitPoints {
  const constitutionModifier = getAbilityModifier(
    input.abilityScores.constitution,
  )
  const speciesBonusPerLevel = getSpeciesBonusPerLevel(
    input.speciesDefinition,
    input.speciesSelection,
  )
  const levels: HitPointLevelBreakdown[] = []
  let maximum = 0
  let isComplete = true

  for (const instance of input.classes) {
    const definition = input.classDefinitionsById.get(instance.classId)
    if (definition === undefined) {
      isComplete = false
      continue
    }

    const isStartingClass =
      input.startingClassInstanceId !== null &&
      instance.instanceId === input.startingClassInstanceId
    const increases = syncHitPointIncreases(instance.hitPointIncreases, instance.level, {
      isStartingClass,
    })

    for (const increase of increases) {
      const hitDieContribution = getHitDieContribution(
        increase,
        definition.hitDie.sides,
      )

      if (hitDieContribution === null) {
        isComplete = false
        continue
      }

      const total =
        hitDieContribution + constitutionModifier + speciesBonusPerLevel
      maximum += total
      levels.push({
        instanceId: instance.instanceId,
        classId: instance.classId,
        classLevel: increase.classLevel,
        method: increase.method,
        hitDieContribution,
        constitutionModifier,
        speciesBonus: speciesBonusPerLevel,
        total,
      })
    }
  }

  return {
    maximum,
    constitutionModifier,
    speciesBonusPerLevel,
    levels,
    isComplete,
  }
}
