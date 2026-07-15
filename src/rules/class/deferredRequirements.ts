import type {
  ClassDefinition,
  ClassLevel,
  DeferredCharacterRequirement,
} from '../../domain/class/types'

const WEAPON_MASTERY_SELECTION_PREFIX = 'weapon-mastery-selection'

function collapseWeaponMasteryRequirements(
  requirements: DeferredCharacterRequirement[],
): DeferredCharacterRequirement[] {
  const weaponMasteryRequirements = requirements.filter((requirement) =>
    requirement.id.startsWith(WEAPON_MASTERY_SELECTION_PREFIX),
  )

  if (weaponMasteryRequirements.length === 0) {
    return requirements
  }

  const latestWeaponMasteryRequirement = weaponMasteryRequirements.reduce(
    (latest, current) => (current.level > latest.level ? current : latest),
  )

  return [
    ...requirements.filter(
      (requirement) =>
        !requirement.id.startsWith(WEAPON_MASTERY_SELECTION_PREFIX),
    ),
    latestWeaponMasteryRequirement,
  ]
}

export function resolveDeferredCharacterRequirements(
  definition: ClassDefinition,
  level: ClassLevel,
): DeferredCharacterRequirement[] {
  const applicable = definition.deferredRequirements
    .filter((requirement) => requirement.level <= level)
    .sort((left, right) => {
      if (left.level !== right.level) {
        return left.level - right.level
      }

      return left.label.localeCompare(right.label)
    })

  return collapseWeaponMasteryRequirements(applicable)
}
