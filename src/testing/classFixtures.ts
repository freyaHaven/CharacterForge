import { createAsiChoicesUpToLevel } from '../domain/class/abilityScoreImprovement'
import type { CharacterClassSelection } from '../domain/class/types'
import { createWeaponMasteryChoices } from '../domain/class/weaponMastery'
import { createFighterWeaponMasteryChoices } from '../content/packs/srd-2024/classes/fighter.weaponMastery'

/**
 * Test fixtures for class selections.
 *
 * Intentionally allowed to import content packs: this module is test-only
 * infrastructure, not production domain/rules/features/app code.
 * See src/architecture/contentPackBoundaries.test.ts.
 */

/** Builds a class instance from caller-supplied ids and choices — no pack knowledge. */
export function createTestClassInstance(
  overrides: Partial<CharacterClassSelection> &
    Pick<CharacterClassSelection, 'classId'> = {
    classId: 'test:sample-class',
  },
): CharacterClassSelection {
  return {
    instanceId: 'test-instance-1',
    level: 1,
    choices: {},
    ...overrides,
  }
}

/**
 * Deterministic Fighter fixture for integration tests that exercise real
 * SRD 2024 Fighter choice ids (weapon mastery, Champion, etc.).
 */
export function createTestFighterClassInstance(
  overrides: Partial<CharacterClassSelection> = {},
): CharacterClassSelection {
  const level = overrides.level ?? 1

  return {
    instanceId: 'fighter-instance-1',
    classId: 'srd-2024:fighter',
    level,
    choices: {
      'fighting-style': 'defense',
      'skill-proficiencies': ['athletics', 'perception'],
      ...createFighterWeaponMasteryChoices(level),
      ...createAsiChoicesUpToLevel(level),
      ...(level >= 3 ? { 'fighter-subclass': 'champion' } : {}),
    },
    ...overrides,
  }
}

/** Synthetic weapon-mastery choices for domain tests (no pack import). */
export function createSyntheticWeaponMasteryChoices(
  level: number,
): Record<string, string[]> {
  return createWeaponMasteryChoices(
    level,
    [
      { level: 1, total: 2, choiceId: 'weapon-mastery' },
      { level: 5, total: 3, choiceId: 'weapon-mastery-extra' },
    ],
    ['longsword', 'battleaxe', 'warhammer'],
  )
}
