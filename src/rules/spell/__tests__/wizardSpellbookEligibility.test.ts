import { describe, expect, it } from 'vitest'
import { createBundledSpellCatalog } from '../../../adapters/bundledSpellCatalog'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { clericSrd2024 } from '../../../content/packs/srd-2024/classes/cleric'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import { wizardSrd2024 } from '../../../content/packs/srd-2024/classes/wizard'
import type { ClassDefinition } from '../../../domain/class/types'
import {
  countUnlockLevel,
  isClassSpellEntitlementActiveAtLevel,
  resolveCharacterSpellcasting,
  resolveEntitlementSlotCeiling,
} from '../../character/resolveCharacterSpellcasting'
import { validateSpellSourceStates } from '../validateSpellSourceStates'
import { FULL_CASTER_SLOTS_BY_LEVEL } from '../../../domain/spell/progressions'

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

function spellbookIds(
  summary: Awaited<ReturnType<typeof resolveCharacterSpellcasting>>,
) {
  return summary.activeSources
    .filter(
      (source) =>
        source.kind === 'class-instance' &&
        source.entitlementId.startsWith('spellbook-'),
    )
    .map((source) =>
      source.kind === 'class-instance' ? source.entitlementId : '',
    )
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

describe('Wizard spellbook accessible levels', () => {
  it('derives count-unlock levels for level-gated additions', () => {
    const spellbook3 = wizardSrd2024.spellcasting?.entitlements.find(
      (entry) => entry.kind === 'select' && entry.id === 'spellbook-3',
    )
    expect(spellbook3?.kind).toBe('select')
    if (spellbook3?.kind !== 'select') {
      return
    }
    expect(countUnlockLevel(spellbook3.count)).toBe(3)
    expect(
      resolveEntitlementSlotCeiling({
        entitlement: spellbook3,
        sourceLevel: 10,
        classSlotsByLevel: FULL_CASTER_SLOTS_BY_LEVEL,
        sharedSlotCeiling: 5,
      }),
    ).toBe(2)
  })

  it('limits each spellbook addition to the grant-level slot ceiling', async () => {
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'wiz-1',
          classId: wizardSrd2024.id,
          level: 5,
          choices: {},
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({ [wizardSrd2024.id]: wizardSrd2024 }),
      character,
      { spellCatalog },
    )

    const group = summary.groups[0]
    const byId = new Map(
      group?.entitlements.map((entry) => [entry.entitlementId, entry]),
    )

    expect(byId.get('spellbook-1')?.accessibleLevels).toEqual([1])
    expect(byId.get('spellbook-2')?.accessibleLevels).toEqual([1])
    expect(byId.get('spellbook-3')?.accessibleLevels).toEqual([1, 2])
    expect(byId.get('spellbook-4')?.accessibleLevels).toEqual([1, 2])
    expect(byId.get('spellbook-5')?.accessibleLevels).toEqual([1, 2, 3])
    expect(byId.get('prepared')?.accessibleLevels).toEqual([1, 2, 3])
  })

  it('does not let multiclass shared slots unlock higher Wizard spell levels', async () => {
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'wiz-1',
          classId: wizardSrd2024.id,
          level: 5,
          choices: {},
        },
        {
          instanceId: 'clr-1',
          classId: clericSrd2024.id,
          level: 5,
          choices: {},
        },
      ],
      startingClassInstanceId: 'wiz-1',
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({
        [wizardSrd2024.id]: wizardSrd2024,
        [clericSrd2024.id]: clericSrd2024,
      }),
      character,
      { spellCatalog },
    )

    expect(summary.sharedSlots?.highestSlotLevel).toBeGreaterThan(3)

    const wizardGroup = summary.groups.find((group) =>
      group.groupId.includes('wiz-1'),
    )
    const prepared = wizardGroup?.entitlements.find(
      (entry) => entry.entitlementId === 'prepared',
    )
    const spellbook5 = wizardGroup?.entitlements.find(
      (entry) => entry.entitlementId === 'spellbook-5',
    )

    expect(prepared?.accessibleLevels).toEqual([1, 2, 3])
    expect(spellbook5?.accessibleLevels).toEqual([1, 2, 3])
    expect(prepared?.accessibleLevels.includes(5)).toBe(false)
  })
})

describe('Wizard spellbook level gating', () => {
  it('treats zero-count select entitlements as inactive at the class instance level', () => {
    const spellbook9 = wizardSrd2024.spellcasting?.entitlements.find(
      (entry) => entry.kind === 'select' && entry.id === 'spellbook-9',
    )
    expect(spellbook9?.kind).toBe('select')
    if (spellbook9?.kind !== 'select') {
      return
    }
    expect(isClassSpellEntitlementActiveAtLevel(spellbook9, 8)).toBe(false)
    expect(isClassSpellEntitlementActiveAtLevel(spellbook9, 9)).toBe(true)
  })

  it('excludes level 9+ spellbook additions for Wizard 8', async () => {
    const character = createDefaultCharacter({
      targetLevel: 8,
      classes: [
        {
          instanceId: 'wiz-1',
          classId: wizardSrd2024.id,
          level: 8,
          choices: {},
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({ [wizardSrd2024.id]: wizardSrd2024 }),
      character,
      { spellCatalog },
    )

    const books = spellbookIds(summary)
    expect(books).toContain('spellbook-1')
    expect(books).toContain('spellbook-8')
    expect(books).not.toContain('spellbook-9')
    expect(books).not.toContain('spellbook-20')
    expect(
      summary.groups[0]?.entitlements.some(
        (entry) => entry.entitlementId === 'spellbook-9',
      ),
    ).toBe(false)
    expect(
      summary.activeSources.some(
        (source) =>
          source.kind === 'class-instance' &&
          source.entitlementId === 'spell-mastery-1',
      ),
    ).toBe(false)
  })

  it('includes the level 9 spellbook addition for Wizard 9', async () => {
    const character = createDefaultCharacter({
      targetLevel: 9,
      classes: [
        {
          instanceId: 'wiz-1',
          classId: wizardSrd2024.id,
          level: 9,
          choices: {},
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({ [wizardSrd2024.id]: wizardSrd2024 }),
      character,
      { spellCatalog },
    )

    const books = spellbookIds(summary)
    expect(books).toContain('spellbook-9')
    expect(books).not.toContain('spellbook-10')
  })

  it('scopes additions to Wizard class level, not total character level', async () => {
    const character = createDefaultCharacter({
      targetLevel: 9,
      classes: [
        {
          instanceId: 'wiz-1',
          classId: wizardSrd2024.id,
          level: 5,
          choices: {},
        },
        {
          instanceId: 'ftr-1',
          classId: fighterSrd2024.id,
          level: 4,
          choices: {},
        },
      ],
      startingClassInstanceId: 'wiz-1',
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({
        [wizardSrd2024.id]: wizardSrd2024,
        [fighterSrd2024.id]: fighterSrd2024,
      }),
      character,
      { spellCatalog },
    )

    expect(spellbookIds(summary)).toEqual([
      'spellbook-1',
      'spellbook-2',
      'spellbook-3',
      'spellbook-4',
      'spellbook-5',
    ])
  })

  it('scopes each Wizard class instance to its own level', async () => {
    const character = createDefaultCharacter({
      targetLevel: 10,
      classes: [
        {
          instanceId: 'wiz-a',
          classId: wizardSrd2024.id,
          level: 3,
          choices: {},
        },
        {
          instanceId: 'wiz-b',
          classId: wizardSrd2024.id,
          level: 7,
          choices: {},
        },
      ],
      startingClassInstanceId: 'wiz-a',
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({ [wizardSrd2024.id]: wizardSrd2024 }),
      character,
      { spellCatalog },
    )

    const booksFor = (instanceId: string) =>
      summary.activeSources
        .filter(
          (source) =>
            source.kind === 'class-instance' &&
            source.instanceId === instanceId &&
            source.entitlementId.startsWith('spellbook-'),
        )
        .map((source) =>
          source.kind === 'class-instance' ? source.entitlementId : '',
        )
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    expect(booksFor('wiz-a')).toEqual([
      'spellbook-1',
      'spellbook-2',
      'spellbook-3',
    ])
    expect(booksFor('wiz-b')).toEqual([
      'spellbook-1',
      'spellbook-2',
      'spellbook-3',
      'spellbook-4',
      'spellbook-5',
      'spellbook-6',
      'spellbook-7',
    ])
  })

  it('does not create validation issues for inactive future spellbook additions', async () => {
    const character = createDefaultCharacter({
      targetLevel: 8,
      classes: [
        {
          instanceId: 'wiz-1',
          classId: wizardSrd2024.id,
          level: 8,
          choices: {},
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog({ [wizardSrd2024.id]: wizardSrd2024 }),
      character,
      { spellCatalog },
    )

    const result = await validateSpellSourceStates(summary, [], spellCatalog)

    const underLimitEntitlementIds = result.ok
      ? []
      : result.issues
          .filter((issue) => issue.code === 'under-limit')
          .map((issue) => issue.entitlementId)

    expect(underLimitEntitlementIds).not.toContain('spellbook-9')
    expect(underLimitEntitlementIds).not.toContain('spellbook-20')
    expect(underLimitEntitlementIds).not.toContain('spell-mastery-1')
    expect(
      underLimitEntitlementIds.some(
        (id) => id !== undefined && /^spellbook-(9|[1-9][0-9])$/.test(id),
      ),
    ).toBe(false)
  })
})
