import { describe, expect, it } from 'vitest'
import { createBundledSpellCatalog } from '../../../adapters/bundledSpellCatalog'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { clericSrd2024 } from '../../../content/packs/srd-2024/classes/cleric'
import {
  WARLOCK_PACT_SLOTS_BY_LEVEL,
  WIZARD_SPELLBOOK_INITIAL_COUNT,
  WIZARD_SPELLBOOK_PER_LEVEL,
} from '../../../content/packs/srd-2024/progressions'
import { spellbookSizeAtLevel } from '../../../domain/spell/progressions'
import type { ClassDefinition } from '../../../domain/class/types'
import {
  createTestPactCasterClass,
  createTestSpellbookCasterClass,
} from '../../../testing/createTestSpellbookAndPactClasses'
import { resolveCharacterSpellcasting } from '../../character/resolveCharacterSpellcasting'
import { prunePreparedSpellsNotInSpellbook } from '../prunePreparedSpellsNotInSpellbook'
import {
  collectSlotContributors,
  resolvePactMagicSlots,
  resolveSharedSpellSlots,
} from '../resolveSharedSpellSlots'
import { validateSpellSourceStates } from '../validateSpellSourceStates'

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

const SPELLBOOK_SPELLS = [
  'srd-2024:magic-missile',
  'srd-2024:shield',
  'srd-2024:mage-armor',
  'srd-2024:burning-hands',
  'srd-2024:detect-magic',
  'srd-2024:sleep',
] as const

describe('spellbook and pact magic architecture', () => {
  it('acquires spellbook entries and prepares only ⊆ book', async () => {
    const definition = createTestSpellbookCasterClass()
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'book-1',
          classId: definition.id,
          level: 1,
          choices: {},
        },
      ],
      spellSourceStates: [
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-1',
            entitlementId: 'cantrips',
          },
          selections: [
            { spellId: 'srd-2024:mage-hand' },
            { spellId: 'srd-2024:prestidigitation' },
            { spellId: 'srd-2024:light' },
          ],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-1',
            entitlementId: 'spellbook',
          },
          selections: SPELLBOOK_SPELLS.map((spellId) => ({ spellId })),
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-1',
            entitlementId: 'prepared',
          },
          selections: [
            { spellId: 'srd-2024:magic-missile' },
            { spellId: 'srd-2024:shield' },
            { spellId: 'srd-2024:mage-armor' },
            { spellId: 'srd-2024:sleep' },
          ],
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
    expect(prepared?.prepareFrom).toBe('spellbook')
    expect(prepared?.spellbookSpellIds).toEqual([...SPELLBOOK_SPELLS])
    expect(prepared?.label).toBe('Prepared Spells')

    const spellbook = summary.groups[0]?.entitlements.find(
      (entry) => entry.entitlementId === 'spellbook',
    )
    expect(spellbook?.label).toBe('Spellbook')
    expect(spellbook?.limit).toBe(
      spellbookSizeAtLevel(
        1,
        WIZARD_SPELLBOOK_INITIAL_COUNT,
        WIZARD_SPELLBOOK_PER_LEVEL,
      ),
    )

    const validation = await validateSpellSourceStates(
      summary,
      character.spellSourceStates,
      spellCatalog,
    )
    expect(validation.ok).toBe(true)
  })

  it('soft-invalidates prepared spells not in the spellbook', async () => {
    const definition = createTestSpellbookCasterClass()
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'book-1',
          classId: definition.id,
          level: 1,
          choices: {},
        },
      ],
      spellSourceStates: [
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-1',
            entitlementId: 'cantrips',
          },
          selections: [
            { spellId: 'srd-2024:mage-hand' },
            { spellId: 'srd-2024:prestidigitation' },
            { spellId: 'srd-2024:light' },
          ],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-1',
            entitlementId: 'spellbook',
          },
          selections: [
            { spellId: 'srd-2024:magic-missile' },
            { spellId: 'srd-2024:shield' },
            { spellId: 'srd-2024:mage-armor' },
            { spellId: 'srd-2024:burning-hands' },
            { spellId: 'srd-2024:detect-magic' },
            { spellId: 'srd-2024:sleep' },
          ],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-1',
            entitlementId: 'prepared',
          },
          selections: [
            { spellId: 'srd-2024:magic-missile' },
            { spellId: 'srd-2024:shield' },
            { spellId: 'srd-2024:mage-armor' },
            { spellId: 'srd-2024:thunderwave' },
          ],
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({ [definition.id]: definition }),
      character,
      { spellCatalog },
    )
    const validation = await validateSpellSourceStates(
      summary,
      character.spellSourceStates,
      spellCatalog,
    )

    expect(validation.ok).toBe(false)
    if (validation.ok) {
      return
    }
    expect(
      validation.issues.some(
        (issue) =>
          issue.code === 'not-in-spellbook' &&
          issue.spellId === 'srd-2024:thunderwave',
      ),
    ).toBe(true)
    expect(
      character.spellSourceStates.find(
        (state) => state.source.entitlementId === 'prepared',
      )?.selections,
    ).toHaveLength(4)
  })

  it('prunes prepared spells removed from the spellbook', async () => {
    const definition = createTestSpellbookCasterClass()
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'book-1',
          classId: definition.id,
          level: 1,
          choices: {},
        },
      ],
      spellSourceStates: [
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-1',
            entitlementId: 'spellbook',
          },
          selections: [
            { spellId: 'srd-2024:magic-missile' },
            { spellId: 'srd-2024:shield' },
          ],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-1',
            entitlementId: 'prepared',
          },
          selections: [
            { spellId: 'srd-2024:magic-missile' },
            { spellId: 'srd-2024:shield' },
            { spellId: 'srd-2024:mage-armor' },
          ],
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({ [definition.id]: definition }),
      character,
      { spellCatalog },
    )

    const nextBook = [
      {
        source: {
          kind: 'class-instance' as const,
          instanceId: 'book-1',
          entitlementId: 'spellbook',
        },
        selections: [{ spellId: 'srd-2024:magic-missile' }],
      },
      {
        source: {
          kind: 'class-instance' as const,
          instanceId: 'book-1',
          entitlementId: 'prepared',
        },
        selections: [
          { spellId: 'srd-2024:magic-missile' },
          { spellId: 'srd-2024:shield' },
          { spellId: 'srd-2024:mage-armor' },
        ],
      },
    ]

    const pruned = prunePreparedSpellsNotInSpellbook(nextBook, summary)
    const prepared = pruned.find(
      (state) => state.source.entitlementId === 'prepared',
    )
    expect(prepared?.selections.map((entry) => entry.spellId)).toEqual([
      'srd-2024:magic-missile',
    ])
  })

  it('isolates spellbooks across class instances', async () => {
    const definition = createTestSpellbookCasterClass()
    const character = createDefaultCharacter({
      targetLevel: 2,
      classes: [
        {
          instanceId: 'book-a',
          classId: definition.id,
          level: 1,
          choices: {},
        },
        {
          instanceId: 'book-b',
          classId: definition.id,
          level: 1,
          choices: {},
        },
      ],
      spellSourceStates: [
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-a',
            entitlementId: 'spellbook',
          },
          selections: [{ spellId: 'srd-2024:magic-missile' }],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-b',
            entitlementId: 'spellbook',
          },
          selections: [{ spellId: 'srd-2024:shield' }],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-a',
            entitlementId: 'prepared',
          },
          selections: [{ spellId: 'srd-2024:magic-missile' }],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-b',
            entitlementId: 'prepared',
          },
          selections: [{ spellId: 'srd-2024:shield' }],
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({ [definition.id]: definition }),
      character,
      { spellCatalog },
    )

    const groupA = summary.groups.find((group) => group.groupId === 'class:book-a')
    const groupB = summary.groups.find((group) => group.groupId === 'class:book-b')
    const preparedA = groupA?.entitlements.find(
      (entry) => entry.entitlementId === 'prepared',
    )
    const preparedB = groupB?.entitlements.find(
      (entry) => entry.entitlementId === 'prepared',
    )

    expect(preparedA?.spellbookSpellIds).toEqual(['srd-2024:magic-missile'])
    expect(preparedB?.spellbookSpellIds).toEqual(['srd-2024:shield'])
  })

  it('marks spellbook under-limit after level-down', async () => {
    const definition = createTestSpellbookCasterClass()
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'book-1',
          classId: definition.id,
          level: 1,
          choices: {},
        },
      ],
      spellSourceStates: [
        {
          source: {
            kind: 'class-instance',
            instanceId: 'book-1',
            entitlementId: 'spellbook',
          },
          selections: [
            { spellId: 'srd-2024:magic-missile' },
            { spellId: 'srd-2024:shield' },
            { spellId: 'srd-2024:mage-armor' },
            { spellId: 'srd-2024:burning-hands' },
          ],
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({ [definition.id]: definition }),
      character,
      { spellCatalog },
    )
    const validation = await validateSpellSourceStates(
      summary,
      character.spellSourceStates,
      spellCatalog,
    )

    expect(validation.ok).toBe(false)
    if (validation.ok) {
      return
    }
    expect(
      validation.issues.some(
        (issue) =>
          issue.code === 'under-limit' &&
          issue.entitlementId === 'spellbook',
      ),
    ).toBe(true)
    expect(
      spellbookSizeAtLevel(
        1,
        WIZARD_SPELLBOOK_INITIAL_COUNT,
        WIZARD_SPELLBOOK_PER_LEVEL,
      ),
    ).toBe(6)
  })

  it('resolves pact progression at several levels', () => {
    const definition = createTestPactCasterClass()
    const definitionsById = new Map([[definition.id, definition]])

    for (const level of [1, 2, 5, 11, 17] as const) {
      const expected = WARLOCK_PACT_SLOTS_BY_LEVEL[level - 1]!
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
        slotCount: expected.slotCount,
        slotLevel: expected.slotLevel,
        recovery: 'short-rest',
      })
    }
  })

  it('keeps Cleric shared slots separate from pact slots when multiclassing', async () => {
    const pact = createTestPactCasterClass()
    const character = createDefaultCharacter({
      targetLevel: 4,
      classes: [
        {
          instanceId: 'cleric-1',
          classId: clericSrd2024.id,
          level: 2,
          choices: {},
        },
        {
          instanceId: 'pact-1',
          classId: pact.id,
          level: 2,
          choices: {},
        },
      ],
    })

    const definitionsById = new Map<string, ClassDefinition>([
      [clericSrd2024.id, clericSrd2024],
      [pact.id, pact],
    ])
    const contributors = collectSlotContributors(
      character.classes,
      definitionsById,
    )
    expect(contributors).toHaveLength(1)
    expect(contributors[0]?.contributor).toBe('full')

    const shared = resolveSharedSpellSlots(contributors)
    expect(shared?.highestSlotLevel).toBeGreaterThan(0)

    const pactSlots = resolvePactMagicSlots(character.classes, definitionsById)
    expect(pactSlots?.sources).toHaveLength(1)
    expect(pactSlots?.sources[0]?.slotCount).toBe(2)
    expect(pactSlots?.sources[0]?.slotLevel).toBe(1)

    const summary = await resolveCharacterSpellcasting(
      createCatalog({
        [clericSrd2024.id]: clericSrd2024,
        [pact.id]: pact,
      }),
      character,
      { spellCatalog },
    )

    expect(summary.sharedSlots).not.toBeNull()
    expect(summary.pactSlots?.sources).toHaveLength(1)
    expect(
      summary.spellLines.some((line) => line.includes('Pact Magic')),
    ).toBe(true)
  })

  it('uses pact-slot-level as known-spell ceiling', async () => {
    const definition = createTestPactCasterClass()
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'pact-1',
          classId: definition.id,
          level: 5,
          choices: {},
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({ [definition.id]: definition }),
      character,
      { spellCatalog },
    )

    const known = summary.groups[0]?.entitlements.find(
      (entry) => entry.entitlementId === 'known',
    )
    expect(summary.pactSlots?.sources[0]?.slotLevel).toBe(3)
    expect(known?.accessibleLevels).toEqual([1, 2, 3])
  })

  it('lists multiple pact sources per instance without merging', () => {
    const definition = createTestPactCasterClass()
    const definitionsById = new Map([[definition.id, definition]])
    const pact = resolvePactMagicSlots(
      [
        {
          instanceId: 'pact-a',
          classId: definition.id,
          level: 3,
          choices: {},
        },
        {
          instanceId: 'pact-b',
          classId: definition.id,
          level: 5,
          choices: {},
        },
      ],
      definitionsById,
    )

    expect(pact?.sources).toHaveLength(2)
    expect(pact?.sources[0]?.instanceId).toBe('pact-a')
    expect(pact?.sources[1]?.instanceId).toBe('pact-b')
    expect(pact?.sources[0]?.slotLevel).toBe(2)
    expect(pact?.sources[1]?.slotLevel).toBe(3)
  })
})
