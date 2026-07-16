import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  applyCommittedClassSelection,
  classInstanceToSelection,
  selectionToClassInstance,
  withSingleClassInstance,
} from '../../domain/character/characterClassSelection'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { createTestClassInstance } from '../../testing/classFixtures'

describe('characterClassSelection architecture', () => {
  it('does not import content packs from the production module', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/domain/character/characterClassSelection.ts'),
      'utf8',
    )

    expect(source).not.toMatch(/content\/packs/)
    expect(source).not.toMatch(/fighter\.weaponMastery/)
    expect(source).not.toMatch(/createTestFighterClassInstance/)
  })

  it('applies the same selection helpers to a synthetic class instance', () => {
    const synthetic = createTestClassInstance({
      instanceId: 'synthetic-1',
      classId: 'test:warden',
      level: 4,
      choices: {
        'weapon-mastery': ['longsword', 'battleaxe'],
        'skill-proficiencies': ['athletics', 'perception'],
      },
    })

    const character = {
      ...createDefaultCharacter(),
      ...withSingleClassInstance(synthetic),
    }

    expect(classInstanceToSelection(synthetic)).toEqual({
      classId: 'test:warden',
      level: 4,
      choices: synthetic.choices,
    })

    const roundTripped = selectionToClassInstance(
      classInstanceToSelection(synthetic),
      synthetic.instanceId,
    )
    expect(roundTripped).toEqual(synthetic)

    const cleared = applyCommittedClassSelection(character, null)
    expect(cleared.classes).toEqual([])
    expect(cleared.startingClassInstanceId).toBeNull()
  })
})
