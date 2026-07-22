import type { ClassDefinition } from '../domain/class/types'
import {
  FULL_CASTER_SLOTS_BY_LEVEL,
  PACT_MAGIC_CANTRIPS_KNOWN_BY_LEVEL,
  PACT_MAGIC_SLOTS_BY_LEVEL,
  PACT_MAGIC_SPELLS_KNOWN_BY_LEVEL,
  wizardSpellbookSizeAtLevel,
} from '../domain/spell/progressions'
import { createSyntheticClassDefinition } from './syntheticClassDefinition'

/**
 * Synthetic spellbook caster for unit tests (Wizard-shaped architecture).
 * Not registered in the bundled content pack.
 */
export function createTestSpellbookCasterClass(
  overrides: Partial<ClassDefinition> = {},
): ClassDefinition {
  const spellbookSizeTable = Array.from({ length: 20 }, (_, index) =>
    wizardSpellbookSizeAtLevel(index + 1),
  )
  const preparedTable = [
    4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
  ]
  const cantripsTable = [
    3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  ]

  return createSyntheticClassDefinition({
    id: 'test:spellbook-caster',
    name: 'Spellbook Caster',
    primaryAbilities: ['intelligence'],
    multiclassPrerequisite: {
      kind: 'all-of',
      abilities: ['intelligence'],
      minimum: 13,
      summary: 'Intelligence 13',
    },
    savingThrows: ['intelligence', 'wisdom'],
    spellcasting: {
      ability: 'intelligence',
      spellListId: 'srd-2024:spell-list:wizard',
      slotContributor: 'full',
      slotsByLevel: FULL_CASTER_SLOTS_BY_LEVEL,
      cantripsKnownByLevel: cantripsTable,
      preparedSpellsByLevel: preparedTable,
      slotRecovery: 'long-rest',
      entitlements: [
        {
          id: 'cantrips',
          kind: 'select',
          listId: 'srd-2024:spell-list:wizard',
          selectionKind: 'cantrip',
          count: { kind: 'by-source-level', table: cantripsTable },
          levelRange: { min: 0, max: 0 },
        },
        {
          id: 'spellbook',
          kind: 'select',
          listId: 'srd-2024:spell-list:wizard',
          selectionKind: 'spellbook',
          count: { kind: 'by-source-level', table: spellbookSizeTable },
          levelRange: { min: 1, max: 'slot-ceiling' },
        },
        {
          id: 'prepared',
          kind: 'select',
          listId: 'srd-2024:spell-list:wizard',
          selectionKind: 'prepared',
          count: { kind: 'by-source-level', table: preparedTable },
          levelRange: { min: 1, max: 'slot-ceiling' },
          prepareFrom: 'spellbook',
          spellbookEntitlementId: 'spellbook',
        },
      ],
    },
    ...overrides,
  })
}

/**
 * Synthetic Pact Magic caster for unit tests (Warlock-shaped architecture).
 * Not registered in the bundled content pack.
 */
export function createTestPactCasterClass(
  overrides: Partial<ClassDefinition> = {},
): ClassDefinition {
  return createSyntheticClassDefinition({
    id: 'test:pact-caster',
    name: 'Pact Caster',
    primaryAbilities: ['charisma'],
    multiclassPrerequisite: {
      kind: 'all-of',
      abilities: ['charisma'],
      minimum: 13,
      summary: 'Charisma 13',
    },
    savingThrows: ['wisdom', 'charisma'],
    spellcasting: {
      ability: 'charisma',
      spellListId: 'srd-2024:spell-list:wizard',
      slotContributor: 'pact',
      slotsByLevel: [],
      cantripsKnownByLevel: PACT_MAGIC_CANTRIPS_KNOWN_BY_LEVEL,
      preparedSpellsByLevel: PACT_MAGIC_SPELLS_KNOWN_BY_LEVEL,
      spellsKnownByLevel: PACT_MAGIC_SPELLS_KNOWN_BY_LEVEL,
      pactSlotsByLevel: PACT_MAGIC_SLOTS_BY_LEVEL,
      slotRecovery: 'short-rest',
      entitlements: [
        {
          id: 'cantrips',
          kind: 'select',
          listId: 'srd-2024:spell-list:wizard',
          selectionKind: 'cantrip',
          count: {
            kind: 'by-source-level',
            table: PACT_MAGIC_CANTRIPS_KNOWN_BY_LEVEL,
          },
          levelRange: { min: 0, max: 0 },
        },
        {
          id: 'known',
          kind: 'select',
          listId: 'srd-2024:spell-list:wizard',
          selectionKind: 'known',
          count: {
            kind: 'by-source-level',
            table: PACT_MAGIC_SPELLS_KNOWN_BY_LEVEL,
          },
          levelRange: { min: 1, max: 'pact-slot-level' },
        },
      ],
    },
    ...overrides,
  })
}
