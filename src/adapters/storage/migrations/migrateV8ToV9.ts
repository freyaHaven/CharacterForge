import type { ClassSelection } from '../../../domain/class/types'
import type { CharacterClassSelection } from '../../../domain/class/types'
import type {
  StoredCharacterV8,
  StoredCharacterV9,
} from '../storedCharacter'
import { selectionToClassInstance } from '../../../domain/character/characterClassSelection'

type MigrateV8ToV9Options = {
  createInstanceId?: () => string
}

function isLegacyClassSelection(value: unknown): value is ClassSelection {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.classId === 'string' &&
    candidate.classId.length > 0 &&
    typeof candidate.level === 'number' &&
    typeof candidate.choices === 'object' &&
    candidate.choices !== null
  )
}

function isClassInstanceArray(
  value: unknown,
): value is CharacterClassSelection[] {
  return Array.isArray(value)
}

/**
 * Replaces legacy `class` with `targetLevel`, `classes[]`, and
 * `startingClassInstanceId`. Already-multiclass saves (e.g. feature-branch
 * schema 4) are preserved and only have leftover `class` stripped.
 */
export function migrateV8ToV9(
  envelope: unknown,
  { createInstanceId = () => crypto.randomUUID() }: MigrateV8ToV9Options = {},
): StoredCharacterV9 {
  const v8 = envelope as StoredCharacterV8
  const {
    class: legacyClass,
    classes: existingClasses,
    targetLevel: existingTargetLevel,
    startingClassInstanceId: existingStartingId,
    ...rest
  } = v8.character as StoredCharacterV8['character'] & {
    classes?: unknown
    targetLevel?: unknown
    startingClassInstanceId?: unknown
  }

  if (isClassInstanceArray(existingClasses)) {
    return {
      schemaVersion: 9,
      character: {
        ...rest,
        targetLevel:
          typeof existingTargetLevel === 'number' ? existingTargetLevel : 1,
        classes: existingClasses,
        startingClassInstanceId:
          typeof existingStartingId === 'string' || existingStartingId === null
            ? existingStartingId
            : existingClasses[0]?.instanceId ?? null,
      },
    }
  }

  if (legacyClass === null || legacyClass === undefined) {
    return {
      schemaVersion: 9,
      character: {
        ...rest,
        targetLevel: 1,
        classes: [],
        startingClassInstanceId: null,
      },
    }
  }

  if (!isLegacyClassSelection(legacyClass)) {
    throw new Error('Invalid legacy class selection in schema v8 character')
  }

  const instanceId = createInstanceId()
  const instance = selectionToClassInstance(legacyClass, instanceId)

  return {
    schemaVersion: 9,
    character: {
      ...rest,
      targetLevel: legacyClass.level,
      classes: [instance],
      startingClassInstanceId: instanceId,
    },
  }
}
