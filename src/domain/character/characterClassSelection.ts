import type {
  CharacterClassSelection,
  ClassLevel,
  ClassSelection,
} from '../class/types'
import type { Character } from '../types'
import { createClassInstanceId } from './createClassInstanceId'

export const EMPTY_CLASS_STATE = {
  targetLevel: 1 as const,
  classes: [] as CharacterClassSelection[],
  startingClassInstanceId: null as string | null,
}

export function classInstanceToSelection(
  instance: CharacterClassSelection,
): ClassSelection {
  return {
    classId: instance.classId,
    level: instance.level,
    choices: { ...instance.choices },
  }
}

export function selectionToClassInstance(
  selection: ClassSelection,
  instanceId: string,
): CharacterClassSelection {
  return {
    instanceId,
    classId: selection.classId,
    level: selection.level,
    choices: { ...selection.choices },
  }
}

export function getCommittedClassSelection(
  character: Character,
): ClassSelection | null {
  if (character.classes.length === 0) {
    return null
  }

  return classInstanceToSelection(character.classes[0])
}

export function withSingleClassInstance(
  instance: CharacterClassSelection,
): Pick<Character, 'targetLevel' | 'classes' | 'startingClassInstanceId'> {
  return {
    targetLevel: instance.level,
    classes: [instance],
    startingClassInstanceId: instance.instanceId,
  }
}

export function upsertClassInstance(
  character: Character,
  instance: CharacterClassSelection,
): Character {
  const existingIndex = character.classes.findIndex(
    (entry) => entry.instanceId === instance.instanceId,
  )
  const classes =
    existingIndex === -1
      ? [...character.classes, instance]
      : character.classes.map((entry, index) =>
          index === existingIndex ? instance : entry,
        )

  let startingClassInstanceId = character.startingClassInstanceId

  if (classes.length === 1) {
    startingClassInstanceId = classes[0].instanceId
  } else if (
    startingClassInstanceId === null &&
    classes.length > 0
  ) {
    startingClassInstanceId = classes[0].instanceId
  }

  return {
    ...character,
    classes,
    startingClassInstanceId,
  }
}

export function removeClassInstanceFromCharacter(
  character: Character,
  instanceId: string,
): Character {
  const classes = character.classes.filter(
    (entry) => entry.instanceId !== instanceId,
  )

  let startingClassInstanceId = character.startingClassInstanceId

  if (startingClassInstanceId === instanceId) {
    startingClassInstanceId = classes[0]?.instanceId ?? null
  }

  if (classes.length === 0) {
    startingClassInstanceId = null
  }

  return {
    ...character,
    classes,
    startingClassInstanceId,
  }
}

export function setCharacterTargetLevel(
  character: Character,
  targetLevel: ClassLevel,
): Character {
  return {
    ...character,
    targetLevel,
  }
}

export function setStartingClassInstanceId(
  character: Character,
  instanceId: string,
): Character {
  return {
    ...character,
    startingClassInstanceId: instanceId,
  }
}

export function clearAllClassInstances(character: Character): Character {
  return {
    ...character,
    ...EMPTY_CLASS_STATE,
  }
}

export function applyCommittedClassSelection(
  character: Character,
  selection: ClassSelection | null,
  options: {
    createInstanceId?: () => string
    instanceId?: string
  } = {},
): Character {
  const createInstanceId = options.createInstanceId ?? createClassInstanceId

  if (selection === null) {
    return clearAllClassInstances(character)
  }

  const existingInstance = character.classes.find(
    (entry) => entry.classId === selection.classId,
  )
  const instanceId =
    options.instanceId ??
    existingInstance?.instanceId ??
    createInstanceId()
  const instance = selectionToClassInstance(selection, instanceId)

  return {
    ...upsertClassInstance(character, instance),
    targetLevel: selection.level,
    startingClassInstanceId: instanceId,
    classes: [instance],
  }
}
