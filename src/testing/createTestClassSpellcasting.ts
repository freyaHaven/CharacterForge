import type { ClassSpellcasting } from '../domain/class/types'
import {
  FULL_CASTER_SLOTS_BY_LEVEL,
  ZERO_CANTRIPS_BY_LEVEL,
} from '../domain/spell/progressions'

/** Minimal spellcasting block for tests that only need the ability flag. */
export function createTestClassSpellcasting(
  overrides: Partial<ClassSpellcasting> & Pick<ClassSpellcasting, 'ability'>,
): ClassSpellcasting {
  return {
    spellListId: 'test:spell-list',
    slotContributor: 'full',
    slotsByLevel: FULL_CASTER_SLOTS_BY_LEVEL,
    cantripsKnownByLevel: ZERO_CANTRIPS_BY_LEVEL,
    preparedSpellsByLevel: Array.from({ length: 20 }, () => 0),
    entitlements: [],
    ...overrides,
  }
}
