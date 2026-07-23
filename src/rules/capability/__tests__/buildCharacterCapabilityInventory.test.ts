import { describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import { createBundledSpellCatalog } from '../../../adapters/bundledSpellCatalog'
import {
  evaluateSpellPickOverlap,
} from '../../../domain/capability/evaluateOptionOverlap'
import { hasCapability } from '../../../domain/capability/types'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import type {
  CharacterSpellcastingSummary,
  ResolvedSpellEntitlement,
  ResolvedSpellSourceGroup,
} from '../../character/resolveCharacterSpellcasting'
import { resolveCharacterSpellcasting } from '../../character/resolveCharacterSpellcasting'
import { SPELL_LIST_IDS } from '../../../content/packs/srd-2024/spell-lists'
import {
  buildCharacterCapabilityInventory,
  buildSpellListAccessTokensFromClasses,
} from '../buildCharacterCapabilityInventory'

function baseGroup(
  overrides: Partial<ResolvedSpellSourceGroup> & {
    groupId: string
    label: string
    entitlements: ResolvedSpellEntitlement[]
  },
): ResolvedSpellSourceGroup {
  return {
    ability: 'intelligence',
    saveDc: 13,
    attackBonus: 5,
    saveDcLabel: '13',
    attackBonusLabel: '+5',
    sortKey: {
      originKind: 'species-trait',
      classInstanceIndex: -1,
      grantingLevel: 1,
      progressionOrder: 0,
      displayName: overrides.label,
    },
    ...overrides,
  }
}

function selectEntitlement(
  overrides: Partial<ResolvedSpellEntitlement> & {
    entitlementId: string
    label: string
    selectionKind: ResolvedSpellEntitlement['selectionKind']
  },
): ResolvedSpellEntitlement {
  return {
    kind: 'select',
    limit: 3,
    accessibleLevels: [0, 1],
    selectedSpellIds: [],
    grantedSpells: [],
    remainingPicks: 3,
    ability: 'intelligence',
    saveDc: 13,
    attackBonus: 5,
    saveDcLabel: '13',
    attackBonusLabel: '+5',
    ...overrides,
  }
}

function grantedEntitlement(
  overrides: Partial<ResolvedSpellEntitlement> & {
    entitlementId: string
    label: string
    grantedSpells: ResolvedSpellEntitlement['grantedSpells']
  },
): ResolvedSpellEntitlement {
  return {
    kind: 'granted',
    selectionKind: 'prepared',
    limit: 0,
    accessibleLevels: [],
    selectedSpellIds: [],
    remainingPicks: 0,
    ability: 'charisma',
    saveDc: 13,
    attackBonus: 5,
    saveDcLabel: '13',
    attackBonusLabel: '+5',
    ...overrides,
  }
}

function summaryFromGroups(
  groups: ResolvedSpellSourceGroup[],
): CharacterSpellcastingSummary {
  return {
    hasSpellcastingCapability: true,
    hasSpellContent: true,
    spellLines: [],
    sharedSlots: { slotsByLevel: [], highestSlotLevel: 0 },
    pactSlots: null,
    activeSources: [],
    groups,
  }
}

describe('buildCharacterCapabilityInventory', () => {
  it('indexes standalone granted entitlements from species, background, subclass, and feat groups', () => {
    const summary = summaryFromGroups([
      baseGroup({
        groupId: 'species-trait:srd-2024:elf:elven-lineage',
        label: 'Elf: Elven Lineage',
        entitlements: [
          grantedEntitlement({
            entitlementId: 'drow-cantrip',
            label: 'Elf: Elven Lineage',
            grantedSpells: [
              {
                spellId: 'srd-2024:dancing-lights',
                name: 'Dancing Lights',
                level: 0,
                countsAgainstLimit: false,
                entitlementId: 'drow-cantrip',
                label: 'Elf: Elven Lineage',
              },
            ],
          }),
        ],
      }),
      baseGroup({
        groupId: 'background-origin:srd-2024:sage',
        label: 'Sage',
        entitlements: [
          grantedEntitlement({
            entitlementId: 'sage-cantrip',
            label: 'Sage',
            grantedSpells: [
              {
                spellId: 'srd-2024:light',
                name: 'Light',
                level: 0,
                countsAgainstLimit: false,
                entitlementId: 'sage-cantrip',
                label: 'Sage',
              },
            ],
          }),
        ],
      }),
      baseGroup({
        groupId: 'class:cleric-1:life-domain',
        label: 'Life Domain',
        entitlements: [
          grantedEntitlement({
            entitlementId: 'life-domain-spells',
            label: 'Life Domain',
            grantedSpells: [
              {
                spellId: 'srd-2024:bless',
                name: 'Bless',
                level: 1,
                countsAgainstLimit: false,
                entitlementId: 'life-domain-spells',
                label: 'Life Domain',
              },
            ],
          }),
        ],
      }),
      baseGroup({
        groupId: 'feat:character-feat:srd-2024:magic-initiate-cleric',
        label: 'Magic Initiate (Cleric)',
        entitlements: [
          selectEntitlement({
            entitlementId: 'mi-cantrips',
            label: 'Cantrips',
            selectionKind: 'cantrip',
            selectedSpellIds: ['srd-2024:thaumaturgy'],
          }),
        ],
      }),
    ])

    const inventory = buildCharacterCapabilityInventory({ spellcasting: summary })

    expect(hasCapability(inventory, 'spell', 'srd-2024:dancing-lights')).toBe(
      true,
    )
    expect(hasCapability(inventory, 'spell', 'srd-2024:light')).toBe(true)
    expect(hasCapability(inventory, 'spell', 'srd-2024:bless')).toBe(true)
    expect(hasCapability(inventory, 'spell', 'srd-2024:thaumaturgy')).toBe(true)

    const speciesVerdict = evaluateSpellPickOverlap(
      'srd-2024:dancing-lights',
      inventory,
    )
    expect(speciesVerdict.status).toBe('redundant')
    expect(speciesVerdict.reasons[0]?.message).toMatch(/Elf: Elven Lineage/i)

    const backgroundVerdict = evaluateSpellPickOverlap(
      'srd-2024:light',
      inventory,
    )
    expect(backgroundVerdict.status).toBe('redundant')
    expect(backgroundVerdict.reasons[0]?.message).toMatch(/Sage/i)

    const subclassVerdict = evaluateSpellPickOverlap(
      'srd-2024:bless',
      inventory,
    )
    expect(subclassVerdict.status).toBe('redundant')
    expect(subclassVerdict.reasons[0]?.message).toMatch(/Life Domain/i)

    const featVerdict = evaluateSpellPickOverlap(
      'srd-2024:thaumaturgy',
      inventory,
    )
    expect(featVerdict.status).toBe('redundant')
    expect(featVerdict.reasons[0]?.message).toMatch(/Magic Initiate/i)
  })

  it('indexes item grants supplied via extraTokens until equipment spell resolution exists', () => {
    const inventory = buildCharacterCapabilityInventory({
      extraTokens: [
        {
          kind: 'spell',
          id: 'srd-2024:fireball',
          source: {
            label: 'Staff of Power',
            kind: 'item',
            id: 'homebrew:staff-of-power',
          },
          how: 'granted',
        },
      ],
    })

    const verdict = evaluateSpellPickOverlap('srd-2024:fireball', inventory)
    expect(verdict.status).toBe('redundant')
    expect(verdict.reasons[0]?.message).toMatch(/Staff of Power/i)
  })

  it('records known/prepared selections separately from always-prepared grants', () => {
    const summary = summaryFromGroups([
      baseGroup({
        groupId: 'class:wizard-1',
        label: 'Wizard',
        entitlements: [
          selectEntitlement({
            entitlementId: 'cantrips',
            label: 'Cantrips',
            selectionKind: 'cantrip',
            listId: SPELL_LIST_IDS.wizard,
            selectedSpellIds: ['srd-2024:mage-hand'],
          }),
          selectEntitlement({
            entitlementId: 'prepared',
            label: 'Prepared Spells',
            selectionKind: 'prepared',
            listId: SPELL_LIST_IDS.wizard,
            selectedSpellIds: ['srd-2024:magic-missile'],
            grantedSpells: [
              {
                spellId: 'srd-2024:shield',
                name: 'Shield',
                level: 1,
                countsAgainstLimit: false,
                entitlementId: 'abjurer',
                label: 'Abjurer',
              },
            ],
          }),
        ],
      }),
    ])

    const inventory = buildCharacterCapabilityInventory({ spellcasting: summary })
    const mageHand = inventory.tokens.find(
      (token) => token.id === 'srd-2024:mage-hand',
    )
    const missile = inventory.tokens.find(
      (token) => token.id === 'srd-2024:magic-missile',
    )
    const shield = inventory.tokens.find(
      (token) => token.id === 'srd-2024:shield',
    )

    expect(mageHand?.how).toBe('selected')
    expect(missile?.how).toBe('selected')
    expect(shield?.how).toBe('granted')
  })

  it('does not treat spell-list access as knowing every spell on that list', () => {
    const summary = summaryFromGroups([
      baseGroup({
        groupId: 'class:wizard-1',
        label: 'Wizard',
        entitlements: [
          selectEntitlement({
            entitlementId: 'cantrips',
            label: 'Cantrips',
            selectionKind: 'cantrip',
            listId: SPELL_LIST_IDS.wizard,
            selectedSpellIds: [],
          }),
        ],
      }),
    ])

    const inventory = buildCharacterCapabilityInventory({ spellcasting: summary })

    expect(
      inventory.tokens.some(
        (token) =>
          token.kind === 'spell-list-access' &&
          token.id === SPELL_LIST_IDS.wizard,
      ),
    ).toBe(true)
    expect(hasCapability(inventory, 'spell', 'srd-2024:dancing-lights')).toBe(
      false,
    )
    expect(
      evaluateSpellPickOverlap('srd-2024:dancing-lights', inventory).status,
    ).toBe('recommended')
  })

  it('recognises a Drow species grant when another source offers the same cantrip', async () => {
    const character = {
      ...createDefaultCharacter(),
      targetLevel: 1,
      species: {
        speciesId: 'srd-2024:elf',
        choices: {
          'elven-lineage': 'drow',
          'keen-senses': 'perception',
          'spellcasting-ability': 'charisma',
          'standard-languages': ['elvish', 'dwarvish'],
        },
      },
      classes: [
        {
          instanceId: 'wizard-1',
          classId: 'srd-2024:wizard',
          level: 1,
          choices: {},
        },
      ],
    }

    const summary = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      character,
      {
        speciesCatalog: createBundledSpeciesCatalog(),
        spellCatalog: createBundledSpellCatalog(),
      },
    )

    const inventory = buildCharacterCapabilityInventory({ spellcasting: summary })
    const verdict = evaluateSpellPickOverlap(
      'srd-2024:dancing-lights',
      inventory,
    )

    expect(verdict.status).toBe('redundant')
    expect(verdict.reasons[0]?.message).toMatch(/Elf|Elven Lineage|Drow/i)
    expect(verdict.reasons[0]?.message).not.toMatch(/Wizard spellcasting/i)
  })

  it('buildSpellListAccessTokensFromClasses only grants list access, not concrete spells', () => {
    const tokens = buildSpellListAccessTokensFromClasses(
      [{ instanceId: 'wizard-1', classId: 'srd-2024:wizard' }],
      new Map([
        [
          'srd-2024:wizard',
          { name: 'Wizard', spellcasting: { spellListId: SPELL_LIST_IDS.wizard } },
        ],
      ]),
    )

    const inventory = buildCharacterCapabilityInventory({ extraTokens: tokens })
    expect(hasCapability(inventory, 'spell-list-access', SPELL_LIST_IDS.wizard)).toBe(
      true,
    )
    expect(hasCapability(inventory, 'spell', 'srd-2024:fireball')).toBe(false)
  })
})
