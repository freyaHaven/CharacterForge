import { describe, expect, it } from 'vitest'
import {
  applyCommittedClassSelection,
  classInstanceToSelection,
  getCommittedClassSelection,
  removeClassInstanceFromCharacter,
  selectionToClassInstance,
  upsertClassInstance,
  withSingleClassInstance,
} from '../characterClassSelection'
import { createDefaultCharacter } from '../defaults'
import {
  createTestClassInstance,
  createTestFighterClassInstance,
} from '../../../testing/classFixtures'

describe('characterClassSelection helpers', () => {
  it('converts between class instances and legacy selection payloads', () => {
    const selection = {
      classId: 'test:sample-fighter',
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
    const instance = createTestClassInstance({
      instanceId: 'fighter-instance-1',
      classId: 'test:sample-fighter',
      level: 1,
      choices: { 'fighting-style': 'defense' },
    })

    expect(
      getCommittedClassSelection({
        ...createDefaultCharacter(),
        ...withSingleClassInstance(instance),
      }),
    ).toEqual({
      classId: 'test:sample-fighter',
      level: 1,
      choices: { 'fighting-style': 'defense' },
    })
  })

  it('clears class state when committing null', () => {
    const instance = createTestClassInstance({
      instanceId: 'fighter-instance-1',
      classId: 'test:sample-fighter',
    })
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
        classId: 'test:sample-fighter',
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
          classId: 'test:sample-fighter',
          level: 2,
          choices: {},
        },
      ],
      startingClassInstanceId: 'new-instance',
    })
  })

  it('upserts class instances without replacing other committed classes', () => {
    const fighter = createTestClassInstance({
      instanceId: 'fighter-instance-1',
      classId: 'test:sample-fighter',
    })
    const barbarian = createTestClassInstance({
      instanceId: 'barbarian-instance',
      classId: 'test:sample-barbarian',
      level: 2,
    })
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
    const fighter = createTestClassInstance({
      instanceId: 'fighter-instance-1',
      classId: 'test:sample-fighter',
    })
    const barbarian = createTestClassInstance({
      instanceId: 'barbarian-instance',
      classId: 'test:sample-barbarian',
      level: 2,
    })
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

  it('supports real fighter fixture from testing module', () => {
    const instance = createTestFighterClassInstance()

    expect(instance.classId).toBe('srd-2024:fighter')
    expect(instance.choices['fighting-style']).toBe('defense')
    expect(instance.choices['skill-proficiencies']).toEqual([
      'athletics',
      'perception',
    ])
  })
})
