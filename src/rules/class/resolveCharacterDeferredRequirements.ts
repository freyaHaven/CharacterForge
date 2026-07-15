import type {
  CharacterClassSelection,
  ClassDefinition,
  ClassLevel,
  ResolvedDeferredCharacterRequirement,
} from '../../domain/class/types'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import { resolveDeferredCharacterRequirements } from './deferredRequirements'

type OrderedRequirement = ResolvedDeferredCharacterRequirement & {
  requirementLevel: ClassLevel
  _definitionOrder: number
}

function resolveForInstance(
  instance: CharacterClassSelection,
  definition: ClassDefinition,
): OrderedRequirement[] {
  const requirements = resolveDeferredCharacterRequirements(
    definition,
    instance.level,
  )

  return requirements.map((requirement, index) => ({
    requirementId: requirement.id,
    sourceInstanceId: instance.instanceId,
    sourceClassId: instance.classId,
    sourceClassLevel: instance.level,
    destinationStep: requirement.destinationStep,
    label: requirement.label,
    description: requirement.description,
    requirementLevel: requirement.level,
    _definitionOrder: index,
  }))
}

function sortResolvedRequirements(
  classes: CharacterClassSelection[],
  requirements: OrderedRequirement[],
): ResolvedDeferredCharacterRequirement[] {
  const classOrder = new Map(
    classes.map((instance, index) => [instance.instanceId, index]),
  )

  return requirements
    .sort((left, right) => {
      const leftClassIndex =
        classOrder.get(left.sourceInstanceId) ?? Number.MAX_SAFE_INTEGER
      const rightClassIndex =
        classOrder.get(right.sourceInstanceId) ?? Number.MAX_SAFE_INTEGER

      if (leftClassIndex !== rightClassIndex) {
        return leftClassIndex - rightClassIndex
      }

      if (left.requirementLevel !== right.requirementLevel) {
        return left.requirementLevel - right.requirementLevel
      }

      return left._definitionOrder - right._definitionOrder
    })
    .map(({ requirementLevel: _level, _definitionOrder: _ignored, ...requirement }) => requirement)
}

export function resolveDeferredRequirementsForInstances(
  classes: CharacterClassSelection[],
  getDefinition: (classId: string) => ClassDefinition | null,
): ResolvedDeferredCharacterRequirement[] {
  const resolved: OrderedRequirement[] = []

  for (const instance of classes) {
    const definition = getDefinition(instance.classId)

    if (definition === null) {
      continue
    }

    resolved.push(...resolveForInstance(instance, definition))
  }

  return sortResolvedRequirements(classes, resolved)
}

export async function resolveDeferredRequirementsForCharacter(
  classes: CharacterClassSelection[],
  catalog: ClassCatalog,
): Promise<ResolvedDeferredCharacterRequirement[]> {
  const resolved: OrderedRequirement[] = []

  for (const instance of classes) {
    const definition = await catalog.getClass(instance.classId)

    if (definition === null) {
      continue
    }

    resolved.push(...resolveForInstance(instance, definition))
  }

  return sortResolvedRequirements(classes, resolved)
}

export function getEffectiveClassesForDeferredRequirements(
  committedClasses: CharacterClassSelection[],
  draftInstance: CharacterClassSelection | null,
): CharacterClassSelection[] {
  if (draftInstance === null) {
    return committedClasses
  }

  const existingIndex = committedClasses.findIndex(
    (instance) => instance.instanceId === draftInstance.instanceId,
  )

  if (existingIndex === -1) {
    return [...committedClasses, draftInstance]
  }

  return committedClasses.map((instance, index) =>
    index === existingIndex ? draftInstance : instance,
  )
}
