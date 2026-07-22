import { ABILITY_LABELS } from '../../domain/abilities/types'
import type { AbilityScores } from '../../domain/types'
import type {
  CharacterClassSelection,
  ClassDefinition,
  MulticlassPrerequisite,
} from '../../domain/class/types'
import type { ClassInstanceValidationError } from './classRules'

export function meetsMulticlassPrerequisite(
  prerequisite: MulticlassPrerequisite,
  abilityScores: AbilityScores,
): boolean {
  if (prerequisite.kind === 'all-of') {
    return prerequisite.abilities.every(
      (abilityId) => abilityScores[abilityId] >= prerequisite.minimum,
    )
  }

  return prerequisite.abilities.some(
    (abilityId) => abilityScores[abilityId] >= prerequisite.minimum,
  )
}

export function formatMulticlassPrerequisiteFailure(
  className: string,
  prerequisite: MulticlassPrerequisite,
  abilityScores: AbilityScores,
): string {
  const detail =
    prerequisite.kind === 'all-of'
      ? prerequisite.abilities
          .map((abilityId) => {
            const score = abilityScores[abilityId]
            const label = ABILITY_LABELS[abilityId]
            return `${label} ${score} (need ${prerequisite.minimum}+)`
          })
          .join(', ')
      : (() => {
          const best = prerequisite.abilities.reduce(
            (current, abilityId) => {
              const score = abilityScores[abilityId]
              if (current === null || score > current.score) {
                return { abilityId, score }
              }
              return current
            },
            null as { abilityId: (typeof prerequisite.abilities)[number]; score: number } | null,
          )
          const options = prerequisite.abilities
            .map((abilityId) => ABILITY_LABELS[abilityId])
            .join(' or ')
          return `${options} ${prerequisite.minimum}+ (best: ${ABILITY_LABELS[best!.abilityId]} ${best!.score})`
        })()

  return `${className} multiclass prerequisite not met: ${prerequisite.summary}. Current: ${detail}.`
}

/**
 * SRD multiclassing: when the character has levels in more than one class,
 * every class must meet its ability score prerequisite.
 */
export function evaluateMulticlassAbilityPrerequisites(
  classes: readonly CharacterClassSelection[],
  getDefinition: (classId: string) => ClassDefinition | null,
  abilityScores: AbilityScores,
): ClassInstanceValidationError[] {
  if (classes.length <= 1) {
    return []
  }

  const issues: ClassInstanceValidationError[] = []

  for (const instance of classes) {
    const definition = getDefinition(instance.classId)
    if (definition === null) {
      continue
    }

    const prerequisite = definition.multiclassPrerequisite
    if (meetsMulticlassPrerequisite(prerequisite, abilityScores)) {
      continue
    }

    issues.push({
      sourceInstanceId: instance.instanceId,
      sourceClassId: instance.classId,
      code: 'multiclass-ability-prerequisite',
      message: formatMulticlassPrerequisiteFailure(
        definition.name,
        prerequisite,
        abilityScores,
      ),
    })
  }

  return issues
}
