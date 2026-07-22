import { describe, expect, it } from 'vitest'
import { createBundledSpellCatalog } from '../../../adapters/bundledSpellCatalog'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import type { ClassDefinition } from '../../../domain/class/types'
import type { PactMagicSlotRow } from '../../../domain/spell/progressions'
import { FULL_CASTER_SLOTS_BY_LEVEL } from '../../../domain/spell/progressions'
import { createSyntheticClassDefinition } from '../../../testing/syntheticClassDefinition'
import { resolveCharacterSpellcasting } from '../../character/resolveCharacterSpellcasting'
import {
  resolvePactMagicSlots,
  resolveSharedSpellSlots,
} from '../resolveSharedSpellSlots'

const spellCatalog = createBundledSpellCatalog()

function createCatalog(definitions: Record<string, ClassDefinition | null>) {
  return {
    listClasses: async () =>
      Object.values(definitions).filter(
        (definition): definition is ClassDefinition => definition !== null,
      ),
    getClass: async (classId: string) => definitions[classId] ?? null,
  }
}

/** Non-Warlock pact curve: always 2 slots at level min(classLevel, 3). */
const CUSTOM_PACT_SLOTS_BY_LEVEL: PactMagicSlotRow[] = Array.from(
  { length: 20 },
  (_, index) => ({
    slotCount: 2,
    slotLevel: Math.min(index + 1, 3),
  }),
)

/** Prepared curve unlike any SRD class — flat 1 at every level. */
const FLAT_ONE_PREPARED_BY_LEVEL = Array.from({ length: 20 }, () => 1)

const CUSTOM_SLOTS_A: number[][] = Array.from({ length: 20 }, (_, index) => [
  index + 1,
])

/** Distinct from CUSTOM_SLOTS_A and from FULL_CASTER (e.g. level 5 → [2, 2]). */
const CUSTOM_SLOTS_B: number[][] = Array.from({ length: 20 }, () => [2, 2])

const CUSTOM_MULTICLASS_SLOTS: number[][] = Array.from(
  { length: 20 },
  (_, index) => [index + 3],
)

describe('content-driven progressions (extensibility)', () => {
  it('resolves custom Pact Magic from definition tables (not Warlock)', () => {
    const definition = createSyntheticClassDefinition({
      id: 'test:custom-pact',
      name: 'Custom Pact',
      spellcasting: {
        ability: 'charisma',
        spellListId: 'srd-2024:spell-list:wizard',
        slotContributor: 'pact',
        slotsByLevel: [],
        cantripsKnownByLevel: Array.from({ length: 20 }, () => 2),
        preparedSpellsByLevel: Array.from({ length: 20 }, () => 2),
        pactSlotsByLevel: CUSTOM_PACT_SLOTS_BY_LEVEL,
        slotRecovery: 'short-rest',
        entitlements: [],
      },
    })

    const definitionsById = new Map([[definition.id, definition]])

    for (const level of [1, 2, 3, 5, 10] as const) {
      const pact = resolvePactMagicSlots(
        [
          {
            instanceId: 'pact-1',
            classId: definition.id,
            level,
            choices: {},
          },
        ],
        definitionsById,
      )

      expect(pact?.sources).toHaveLength(1)
      expect(pact?.sources[0]).toMatchObject({
        slotCount: 2,
        slotLevel: Math.min(level, 3),
      })
    }
  })

  it('respects a custom prepared curve via resolveCharacterSpellcasting', async () => {
    const cantrips = Array.from({ length: 20 }, () => 0)
    const definition = createSyntheticClassDefinition({
      id: 'test:flat-prepared',
      name: 'Flat Prepared',
      primaryAbilities: ['intelligence'],
      spellcasting: {
        ability: 'intelligence',
        spellListId: 'srd-2024:spell-list:wizard',
        slotContributor: 'full',
        slotsByLevel: FULL_CASTER_SLOTS_BY_LEVEL,
        cantripsKnownByLevel: cantrips,
        preparedSpellsByLevel: FLAT_ONE_PREPARED_BY_LEVEL,
        entitlements: [
          {
            id: 'prepared',
            kind: 'select',
            listId: 'srd-2024:spell-list:wizard',
            selectionKind: 'prepared',
            count: {
              kind: 'by-source-level',
              table: FLAT_ONE_PREPARED_BY_LEVEL,
            },
            levelRange: { min: 1, max: 'slot-ceiling' },
          },
        ],
      },
    })

    for (const level of [1, 5, 11, 20] as const) {
      const character = createDefaultCharacter({
        classes: [
          {
            instanceId: 'flat-1',
            classId: definition.id,
            level,
            choices: {},
          },
        ],
      })

      const summary = await resolveCharacterSpellcasting(
        createCatalog({ [definition.id]: definition }),
        character,
        { spellCatalog },
      )

      const prepared = summary.groups[0]?.entitlements.find(
        (entry) => entry.entitlementId === 'prepared',
      )
      expect(prepared?.limit).toBe(1)
    }
  })

  it('uses each full caster class own slotsByLevel for single-class resolution', () => {
    const classA = createSyntheticClassDefinition({
      id: 'test:slots-a',
      name: 'Slots A',
      spellcasting: {
        ability: 'intelligence',
        spellListId: 'srd-2024:spell-list:wizard',
        slotContributor: 'full',
        slotsByLevel: CUSTOM_SLOTS_A,
        cantripsKnownByLevel: Array.from({ length: 20 }, () => 0),
        preparedSpellsByLevel: Array.from({ length: 20 }, () => 0),
        entitlements: [],
      },
    })
    const classB = createSyntheticClassDefinition({
      id: 'test:slots-b',
      name: 'Slots B',
      spellcasting: {
        ability: 'charisma',
        spellListId: 'srd-2024:spell-list:wizard',
        slotContributor: 'full',
        slotsByLevel: CUSTOM_SLOTS_B,
        cantripsKnownByLevel: Array.from({ length: 20 }, () => 0),
        preparedSpellsByLevel: Array.from({ length: 20 }, () => 0),
        entitlements: [],
      },
    })

    const slotsA = resolveSharedSpellSlots([
      { level: 5, contributor: 'full', slotsByLevel: classA.spellcasting!.slotsByLevel },
    ])
    const slotsB = resolveSharedSpellSlots([
      { level: 5, contributor: 'full', slotsByLevel: classB.spellcasting!.slotsByLevel },
    ])

    expect(slotsA?.slotsByLevel).toEqual([5])
    expect(slotsB?.slotsByLevel).toEqual([2, 2])
    expect(slotsA?.slotsByLevel).not.toEqual(slotsB?.slotsByLevel)
    expect(slotsA?.slotsByLevel).not.toEqual(FULL_CASTER_SLOTS_BY_LEVEL[4])
    expect(slotsB?.slotsByLevel).not.toEqual(FULL_CASTER_SLOTS_BY_LEVEL[4])
  })

  it('uses injected multiclassSlotsByLevel instead of FULL_CASTER', () => {
    const contributors = [
      {
        level: 3,
        contributor: 'full' as const,
        slotsByLevel: CUSTOM_SLOTS_A,
      },
      {
        level: 2,
        contributor: 'full' as const,
        slotsByLevel: CUSTOM_SLOTS_B,
      },
    ]

    const withDefault = resolveSharedSpellSlots(contributors)
    const withInjected = resolveSharedSpellSlots(contributors, {
      multiclassSlotsByLevel: CUSTOM_MULTICLASS_SLOTS,
    })

    // Multiclass caster level = 3 + 2 = 5 → FULL_CASTER row vs injected row
    expect(withDefault?.slotsByLevel).toEqual(FULL_CASTER_SLOTS_BY_LEVEL[4])
    expect(withInjected?.slotsByLevel).toEqual([7])
    expect(withInjected?.slotsByLevel).not.toEqual(withDefault?.slotsByLevel)
  })
})
