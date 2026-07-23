import { describe, expect, it } from 'vitest'
import type { CharacterSpellcastingSummary } from '../../character/resolveCharacterSpellcasting'
import {
  collectSpellAvailability,
  evaluateSpellSelectionEligibility,
} from '../spellSelectionEligibility'

function makeSummary(): CharacterSpellcastingSummary {
  return {
    hasSpellcastingCapability: true,
    hasSpellContent: true,
    spellLines: [],
    sharedSlots: { slotsByLevel: [2], highestSlotLevel: 1 },
    pactSlots: null,
    activeSources: [],
    groups: [
      {
        groupId: 'class:cleric-1',
        label: 'Cleric',
        ability: 'wisdom',
        saveDc: 10,
        attackBonus: 2,
        saveDcLabel: '10',
        attackBonusLabel: '+2',
        entitlements: [
          {
            entitlementId: 'cantrips',
            kind: 'select',
            selectionKind: 'cantrip',
            label: 'Cantrips',
            limit: 3,
            accessibleLevels: [0],
            selectedSpellIds: ['srd-2024:guidance'],
            grantedSpells: [],
            remainingPicks: 2,
            ability: 'wisdom',
            saveDc: 10,
            attackBonus: 2,
            saveDcLabel: '10',
            attackBonusLabel: '+2',
          },
          {
            entitlementId: 'prepared',
            kind: 'select',
            selectionKind: 'prepared',
            label: 'Prepared Spells',
            limit: 4,
            accessibleLevels: [1],
            selectedSpellIds: [],
            grantedSpells: [
              {
                spellId: 'srd-2024:bless',
                name: 'Bless',
                level: 1,
                countsAgainstLimit: false,
                entitlementId: 'life-domain',
                label: 'Life Domain',
              },
            ],
            remainingPicks: 4,
            ability: 'wisdom',
            saveDc: 10,
            attackBonus: 2,
            saveDcLabel: '10',
            attackBonusLabel: '+2',
          },
        ],
      },
      {
        groupId: 'feat:character-feat:srd-2024:magic-initiate-cleric',
        label: 'Magic Initiate (Cleric)',
        ability: 'wisdom',
        saveDc: 10,
        attackBonus: 2,
        saveDcLabel: '10',
        attackBonusLabel: '+2',
        entitlements: [
          {
            entitlementId: 'mi-cantrips',
            kind: 'select',
            selectionKind: 'cantrip',
            label: 'Cantrips',
            limit: 2,
            accessibleLevels: [0],
            selectedSpellIds: [],
            grantedSpells: [],
            remainingPicks: 2,
            ability: 'wisdom',
            saveDc: 10,
            attackBonus: 2,
            saveDcLabel: '10',
            attackBonusLabel: '+2',
          },
          {
            entitlementId: 'mi-1st-level',
            kind: 'select',
            selectionKind: 'known',
            label: 'Known Spells',
            limit: 1,
            accessibleLevels: [1],
            selectedSpellIds: [],
            grantedSpells: [],
            remainingPicks: 1,
            ability: 'wisdom',
            saveDc: 10,
            attackBonus: 2,
            saveDcLabel: '10',
            attackBonusLabel: '+2',
          },
        ],
      },
    ],
  }
}

describe('spellSelectionEligibility', () => {
  it('marks cantrips already known on another source as blocked by default', () => {
    const summary = makeSummary()
    const miGroup = summary.groups[1]!
    const miCantrips = miGroup.entitlements[0]!

    const eligibility = evaluateSpellSelectionEligibility({
      spellId: 'srd-2024:guidance',
      summary,
      group: miGroup,
      entitlement: miCantrips,
    })

    expect(eligibility.alreadyAvailableFromOtherSource).toBe(true)
    expect(eligibility.duplicateWithinCurrentSource).toBe(false)
    expect(eligibility.recommendation).toBe('blocked')
    expect(eligibility.canSelect).toBe(false)
    expect(eligibility.duplicateReason).toMatch(/Cleric/i)
  })

  it('discourages known-spell duplicates that remain legal', () => {
    const summary = makeSummary()
    const miGroup = summary.groups[1]!
    const miKnown = miGroup.entitlements[1]!

    const eligibility = evaluateSpellSelectionEligibility({
      spellId: 'srd-2024:bless',
      summary,
      group: miGroup,
      entitlement: miKnown,
    })

    expect(eligibility.alreadyAvailableFromOtherSource).toBe(true)
    expect(eligibility.recommendation).toBe('discouraged')
    expect(eligibility.canSelect).toBe(true)
    expect(eligibility.duplicateReason).toMatch(/Life Domain|Cleric/i)
  })

  it('detects duplicates within the same source group', () => {
    const summary = makeSummary()
    summary.groups[0]!.entitlements.push({
      entitlementId: 'thaumaturge-cantrip',
      kind: 'select',
      selectionKind: 'cantrip',
      label: 'Thaumaturge Cantrip',
      limit: 1,
      accessibleLevels: [0],
      selectedSpellIds: ['srd-2024:thaumaturgy'],
      grantedSpells: [],
      remainingPicks: 0,
      ability: 'wisdom',
      saveDc: 10,
      attackBonus: 2,
      saveDcLabel: '10',
      attackBonusLabel: '+2',
    })

    const clericGroup = summary.groups[0]!
    const cantrips = clericGroup.entitlements[0]!

    const eligibility = evaluateSpellSelectionEligibility({
      spellId: 'srd-2024:thaumaturgy',
      summary,
      group: clericGroup,
      entitlement: cantrips,
    })

    expect(eligibility.alreadyAvailableFromOtherSource).toBe(false)
    expect(eligibility.duplicateWithinCurrentSource).toBe(true)
    expect(eligibility.recommendation).toBe('blocked')
    expect(eligibility.canSelect).toBe(false)
  })

  it('indexes availability without double-counting folded grants', () => {
    const summary = makeSummary()
    const availability = collectSpellAvailability(summary)
    expect(availability.get('srd-2024:bless')).toHaveLength(1)
    expect(availability.get('srd-2024:guidance')).toHaveLength(1)
  })

  it('indexes standalone granted entitlements (species / lineage style)', () => {
    const summary = makeSummary()
    summary.groups.push({
      groupId: 'species-trait:srd-2024:elf:elven-lineage',
      label: 'Elf: Elven Lineage',
      ability: 'charisma',
      saveDc: 10,
      attackBonus: 2,
      saveDcLabel: '10',
      attackBonusLabel: '+2',
      sortKey: {
        originKind: 'species-trait',
        classInstanceIndex: -1,
        grantingLevel: 1,
        progressionOrder: 0,
        displayName: 'Elf: Elven Lineage',
      },
      entitlements: [
        {
          entitlementId: 'drow-cantrip',
          kind: 'granted',
          selectionKind: 'cantrip',
          label: 'Elf: Elven Lineage',
          limit: 0,
          accessibleLevels: [],
          selectedSpellIds: [],
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
          remainingPicks: 0,
          ability: 'charisma',
          saveDc: 10,
          attackBonus: 2,
          saveDcLabel: '10',
          attackBonusLabel: '+2',
        },
      ],
    })

    const availability = collectSpellAvailability(summary)
    const origins = availability.get('srd-2024:dancing-lights')
    expect(origins).toHaveLength(1)
    expect(origins?.[0]?.groupLabel).toMatch(/Elf: Elven Lineage/i)
    expect(origins?.[0]?.how).toBe('granted')

    const miGroup = summary.groups[1]!
    const miCantrips = miGroup.entitlements[0]!
    const eligibility = evaluateSpellSelectionEligibility({
      spellId: 'srd-2024:dancing-lights',
      summary,
      group: miGroup,
      entitlement: miCantrips,
    })

    expect(eligibility.alreadyAvailableFromOtherSource).toBe(true)
    expect(eligibility.duplicateReason).toMatch(/Elf: Elven Lineage/i)
  })

  it('honours an allow policy override from content', () => {
    const summary = makeSummary()
    const miGroup = summary.groups[1]!
    const miCantrips = {
      ...miGroup.entitlements[0]!,
      crossSourceDuplicatePolicy: 'allow' as const,
    }

    const eligibility = evaluateSpellSelectionEligibility({
      spellId: 'srd-2024:guidance',
      summary,
      group: miGroup,
      entitlement: miCantrips,
    })

    expect(eligibility.alreadyAvailableFromOtherSource).toBe(true)
    expect(eligibility.recommendation).toBe('normal')
    expect(eligibility.canSelect).toBe(true)
  })

  it('marks spellbook additions redundant when the spell is already recorded', () => {
    const summary = makeSummary()
    summary.groups[0] = {
      ...summary.groups[0]!,
      entitlements: [
        {
          entitlementId: 'spellbook-1',
          kind: 'select',
          selectionKind: 'spellbook',
          label: 'Wizard level 1 spellbook',
          limit: 6,
          accessibleLevels: [1],
          selectedSpellIds: ['srd-2024:magic-missile'],
          grantedSpells: [],
          remainingPicks: 5,
          ability: 'intelligence',
          saveDc: 10,
          attackBonus: 2,
          saveDcLabel: '10',
          attackBonusLabel: '+2',
        },
        {
          entitlementId: 'spellbook-3',
          kind: 'select',
          selectionKind: 'spellbook',
          label: 'Wizard level 3 spellbook addition',
          limit: 2,
          accessibleLevels: [1, 2],
          selectedSpellIds: [],
          grantedSpells: [],
          remainingPicks: 2,
          ability: 'intelligence',
          saveDc: 10,
          attackBonus: 2,
          saveDcLabel: '10',
          attackBonusLabel: '+2',
        },
        {
          entitlementId: 'prepared',
          kind: 'select',
          selectionKind: 'prepared',
          label: 'Prepared Spells',
          limit: 4,
          accessibleLevels: [1],
          selectedSpellIds: ['srd-2024:magic-missile'],
          grantedSpells: [],
          remainingPicks: 3,
          ability: 'intelligence',
          saveDc: 10,
          attackBonus: 2,
          saveDcLabel: '10',
          attackBonusLabel: '+2',
          prepareFrom: 'spellbook',
        },
      ],
    }

    const group = summary.groups[0]!
    const addition = group.entitlements[1]!
    const prepared = group.entitlements[2]!

    const additionEligibility = evaluateSpellSelectionEligibility({
      spellId: 'srd-2024:magic-missile',
      summary,
      group,
      entitlement: addition,
    })
    expect(additionEligibility.recommendation).toBe('discouraged')
    expect(additionEligibility.duplicateReason).toMatch(
      /Wizard level 1 spellbook/i,
    )
    expect(additionEligibility.duplicateReason).not.toMatch(/Prepared Spells/i)

    const preparedEligibility = evaluateSpellSelectionEligibility({
      spellId: 'srd-2024:magic-missile',
      summary,
      group,
      entitlement: prepared,
    })
    expect(preparedEligibility.recommendation).toBe('normal')
    expect(preparedEligibility.duplicateReason).toBeNull()
  })
})
