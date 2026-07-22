import type {
  CharacterClassSelection,
  CharacterLevel,
  ClassDefinition,
} from '../../domain/class/types'
import type { AbilityScores, EditionId } from '../../domain/types'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type {
  BackgroundDefinition,
  BackgroundSelection,
} from '../../domain/background/types'
import { getAllocatedLevel, getRemainingLevels } from '../../domain/character/classLevels'
import { resolveCharacterAbilityScores } from '../character/resolveCharacterAbilityScores'
import {
  validateClassInstance,
  type ClassInstanceValidationError,
} from './classRules'
import { evaluateMulticlassAbilityPrerequisites } from './multiclassPrerequisites'

export type CharacterClassesValidationStatus =
  | 'structurally-invalid'
  | 'incomplete'
  | 'complete'

export type CharacterClassesValidationResult = {
  status: CharacterClassesValidationStatus
  structurallyValid: boolean
  allocationComplete: boolean
  allocatedLevel: number
  remainingLevels: number
  issues: ClassInstanceValidationError[]
}

export type ValidateCharacterClassesInput = {
  classes: CharacterClassSelection[]
  targetLevel: CharacterLevel
  editionId: EditionId
  startingClassInstanceId?: string | null
  /**
   * Base ability scores from character creation. When provided (with optional
   * background), multiclass ability prerequisites are evaluated against
   * resolved totals (base + background ASI + class ASI choices).
   */
  abilityScores?: AbilityScores
  backgroundDefinition?: BackgroundDefinition | null
  backgroundSelection?: BackgroundSelection | null
}

type StructuralValidationResult = {
  structurallyValid: boolean
  issues: ClassInstanceValidationError[]
}

function createStructuralError(
  instance: CharacterClassSelection | null,
  code: ClassInstanceValidationError['code'],
  message: string,
): ClassInstanceValidationError {
  return {
    sourceInstanceId: instance?.instanceId ?? '__character__',
    sourceClassId: instance?.classId ?? '__character__',
    code,
    message,
  }
}

function validateCharacterClassStructure(
  input: ValidateCharacterClassesInput,
): StructuralValidationResult {
  const issues: ClassInstanceValidationError[] = []
  const seenInstanceIds = new Set<string>()
  const seenClassIds = new Set<string>()

  for (const instance of input.classes) {
    if (seenInstanceIds.has(instance.instanceId)) {
      issues.push(
        createStructuralError(
          instance,
          'duplicate-instance-id',
          `Duplicate class instance id "${instance.instanceId}".`,
        ),
      )
    } else {
      seenInstanceIds.add(instance.instanceId)
    }

    if (seenClassIds.has(instance.classId)) {
      issues.push(
        createStructuralError(
          instance,
          'duplicate-class-id',
          `Duplicate class id "${instance.classId}".`,
        ),
      )
    } else {
      seenClassIds.add(instance.classId)
    }

    if (
      !Number.isInteger(instance.level) ||
      instance.level < 1 ||
      instance.level > 20
    ) {
      issues.push(
        createStructuralError(
          instance,
          'invalid-level',
          'Choose a valid class level between 1 and 20.',
        ),
      )
    }
  }

  const allocatedLevel = getAllocatedLevel(input.classes)
  if (allocatedLevel > input.targetLevel) {
    issues.push(
      createStructuralError(
        null,
        'allocation-exceeds-target',
        `Allocated level ${allocatedLevel} exceeds target level ${input.targetLevel}.`,
      ),
    )
  }

  const startingClassInstanceId =
    input.startingClassInstanceId === undefined
      ? null
      : input.startingClassInstanceId

  if (input.classes.length === 0) {
    if (startingClassInstanceId !== null) {
      issues.push(
        createStructuralError(
          null,
          'invalid-starting-class-reference',
          'Starting class reference must be null when no classes are selected.',
        ),
      )
    }
  } else if (
    startingClassInstanceId !== null &&
    !input.classes.some(
      (instance) => instance.instanceId === startingClassInstanceId,
    )
  ) {
    issues.push(
      createStructuralError(
        null,
        'invalid-starting-class-reference',
        'Starting class reference does not match any selected class.',
      ),
    )
  }

  return {
    structurallyValid: issues.length === 0,
    issues,
  }
}

function deriveStatus(
  structurallyValid: boolean,
  allocationComplete: boolean,
  instanceIssues: ClassInstanceValidationError[],
): CharacterClassesValidationStatus {
  if (!structurallyValid) {
    return 'structurally-invalid'
  }

  if (!allocationComplete || instanceIssues.length > 0) {
    return 'incomplete'
  }

  return 'complete'
}

export async function validateCharacterClasses(
  input: ValidateCharacterClassesInput,
  catalog: ClassCatalog,
): Promise<CharacterClassesValidationResult> {
  const structural = validateCharacterClassStructure(input)
  const allocatedLevel = getAllocatedLevel(input.classes)
  const remainingLevels = getRemainingLevels(input.targetLevel, input.classes)
  const allocationComplete = remainingLevels === 0

  if (!structural.structurallyValid) {
    return {
      status: 'structurally-invalid',
      structurallyValid: false,
      allocationComplete,
      allocatedLevel,
      remainingLevels,
      issues: structural.issues,
    }
  }

  const instanceIssues: ClassInstanceValidationError[] = []

  for (const instance of input.classes) {
    const definition = await catalog.getClass(instance.classId)
    const result = validateClassInstance(instance, input.editionId, definition)

    if (!result.ok) {
      instanceIssues.push(...result.errors)
    }
  }

  if (input.abilityScores !== undefined) {
    const resolvedScores = resolveCharacterAbilityScores({
      baseScores: input.abilityScores,
      backgroundDefinition: input.backgroundDefinition,
      backgroundSelection: input.backgroundSelection,
      classes: input.classes,
    })
    const definitionsById = new Map<string, ClassDefinition>()
    await Promise.all(
      input.classes.map(async (instance) => {
        if (definitionsById.has(instance.classId)) {
          return
        }
        const definition = await catalog.getClass(instance.classId)
        if (definition !== null) {
          definitionsById.set(instance.classId, definition)
        }
      }),
    )
    instanceIssues.push(
      ...evaluateMulticlassAbilityPrerequisites(
        input.classes,
        (classId) => definitionsById.get(classId) ?? null,
        resolvedScores,
      ),
    )
  }

  return {
    status: deriveStatus(true, allocationComplete, instanceIssues),
    structurallyValid: true,
    allocationComplete,
    allocatedLevel,
    remainingLevels,
    issues: instanceIssues,
  }
}

export function validateCharacterClassesWithDefinitions(
  input: ValidateCharacterClassesInput,
  getDefinition: (classId: string) => ClassDefinition | null,
): CharacterClassesValidationResult {
  const structural = validateCharacterClassStructure(input)
  const allocatedLevel = getAllocatedLevel(input.classes)
  const remainingLevels = getRemainingLevels(input.targetLevel, input.classes)
  const allocationComplete = remainingLevels === 0

  if (!structural.structurallyValid) {
    return {
      status: 'structurally-invalid',
      structurallyValid: false,
      allocationComplete,
      allocatedLevel,
      remainingLevels,
      issues: structural.issues,
    }
  }

  const instanceIssues: ClassInstanceValidationError[] = []

  for (const instance of input.classes) {
    const definition = getDefinition(instance.classId)
    const result = validateClassInstance(instance, input.editionId, definition)

    if (!result.ok) {
      instanceIssues.push(...result.errors)
    }
  }

  if (input.abilityScores !== undefined) {
    const resolvedScores = resolveCharacterAbilityScores({
      baseScores: input.abilityScores,
      backgroundDefinition: input.backgroundDefinition,
      backgroundSelection: input.backgroundSelection,
      classes: input.classes,
    })
    instanceIssues.push(
      ...evaluateMulticlassAbilityPrerequisites(
        input.classes,
        getDefinition,
        resolvedScores,
      ),
    )
  }

  return {
    status: deriveStatus(true, allocationComplete, instanceIssues),
    structurallyValid: true,
    allocationComplete,
    allocatedLevel,
    remainingLevels,
    issues: instanceIssues,
  }
}
