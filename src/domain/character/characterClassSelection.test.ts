import { describe, expect, it } from 'vitest'
import {
  applyCommittedClassSelection,
  classInstanceToSelection,
  createTestFighterClassInstance,
  getCommittedClassSelection,
  removeClassInstanceFromCharacter,
  selectionToClassInstance,
  upsertClassInstance,
  withSingleClassInstance,
} from './characterClassSelection'
import { createDefaultCharacter } from './defaults'

describe('characterClassSelection helpers', () => {
  it('converts between class instances and legacy selection payloads', () => {
    const selection = {
      classId: 'srd-2024:fighter',
      level: 3,
      choices: { 'fighting-style': 'defense' },
    }

    expect(
      classInstanceToSelection(
        selectionToClassInstance(selection, 'instance-1'),
      ),
    ).toEqual(selection)
  })

  it('returns null when no classes are committed', () => {
    expect(getCommittedClassSelection(createDefaultCharacter())).toBeNull()
  })

  it('returns the first committed class as a selection payload', () => {
    const instance = createTestFighterClassInstance()

    expect(
      getCommittedClassSelection({
        ...createDefaultCharacter(),
        ...withSingleClassInstance(instance),
      }),
    ).toEqual({
      classId: 'srd-2024:fighter',
      level: 1,
      choices: {
        'fighting-style': 'defense',
        'skill-proficiencies': ['athletics', 'perception'],
      },
    })
  })

  it('clears class state when committing null', () => {
    const instance = createTestFighterClassInstance()
    const character = {
      ...createDefaultCharacter(),
      ...withSingleClassInstance(instance),
    }

    expect(applyCommittedClassSelection(character, null)).toEqual({
      ...character,
      targetLevel: 1,
      classes: [],
      startingClassInstanceId: null,
    })
  })

  it('creates a new instance id when committing a fresh class', () => {
    const committed = applyCommittedClassSelection(
      createDefaultCharacter(),
      {
        classId: 'srd-2024:fighter',
        level: 2,
        choices: {},
      },
      { createInstanceId: () => 'new-instance' },
    )

    expect(committed).toEqual({
      ...createDefaultCharacter(),
      targetLevel: 2,
      classes: [
        {
          instanceId: 'new-instance',
          classId: 'srd-2024:fighter',
          level: 2,
          choices: {},
        },
      ],
      startingClassInstanceId: 'new-instance',
    })
  })

  it('upserts class instances without replacing other committed classes', () => {
    const fighter = createTestFighterClassInstance()
    const barbarian = {
      instanceId: 'barbarian-instance',
      classId: 'srd-2024:barbarian',
      level: 2,
      choices: {},
    }
    const character = {
      ...createDefaultCharacter(),
      targetLevel: 5,
      classes: [fighter],
      startingClassInstanceId: fighter.instanceId,
    }

    expect(upsertClassInstance(character, barbarian)).toEqual({
      ...character,
      classes: [fighter, barbarian],
      startingClassInstanceId: fighter.instanceId,
    })
  })

  it('removes a class instance and fixes the starting class reference', () => {
    const fighter = createTestFighterClassInstance()
    const barbarian = {
      instanceId: 'barbarian-instance',
      classId: 'srd-2024:barbarian',
      level: 2,
      choices: {},
    }
    const character = {
      ...createDefaultCharacter(),
      targetLevel: 3,
      classes: [fighter, barbarian],
      startingClassInstanceId: barbarian.instanceId,
    }

    expect(removeClassInstanceFromCharacter(character, barbarian.instanceId)).toEqual({
      ...character,
      classes: [fighter],
      startingClassInstanceId: fighter.instanceId,
    })
  })
})
