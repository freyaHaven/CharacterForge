import { describe, expect, it } from 'vitest'
import type {
  CharacterSpellcastingSummary,
  ResolvedSpellEntitlement,
  ResolvedSpellSourceGroup,
} from '../../../rules/character/resolveCharacterSpellcasting'
import { buildSpellPresentationModel } from '../spellPresentationModel'

function entitlement(
  partial: Partial<ResolvedSpellEntitlement> &
    Pick<ResolvedSpellEntitlement, 'entitlementId' | 'kind' | 'label'>,
): ResolvedSpellEntitlement {
  return {
    limit: 0,
    accessibleLevels: [],
    selectedSpellIds: [],
    grantedSpells: [],
    remainingPicks: 0,
    ability: 'intelligence',
    saveDc: 13,
    attackBonus: 5,
    saveDcLabel: '13',
    attackBonusLabel: '+5',
    ...partial,
  }
}

function group(
  partial: Partial<ResolvedSpellSourceGroup> &
    Pick<ResolvedSpellSourceGroup, 'groupId' | 'label' | 'entitlements'>,
): ResolvedSpellSourceGroup {
  return {
    ability: 'intelligence',
    saveDc: 13,
    attackBonus: 5,
    saveDcLabel: '13',
    attackBonusLabel: '+5',
    sortKey: {
      originKind: 'class-core',
      classInstanceIndex: 0,
      grantingLevel: 1,
      progressionOrder: 0,
      displayName: partial.label,
    },
    ...partial,
  }
}

describe('buildSpellPresentationModel', () => {
  it('groups by presentation category and merges species grants', () => {
    const summary: CharacterSpellcastingSummary = {
      hasSpellcastingCapability: true,
      hasSpellContent: true,
      spellLines: [],
      sharedSlots: null,
      pactSlots: null,
      activeSources: [],
      groups: [
        group({
          groupId: 'species-trait:srd-2024:elf:drow',
          label: 'Elf: Drow',
          sortKey: {
            originKind: 'species-trait',
            classInstanceIndex: -1,
            grantingLevel: 1,
            progressionOrder: 0,
            displayName: 'Elf: Drow',
          },
          entitlements: [
            entitlement({
              entitlementId: 'drow-cantrip',
              kind: 'granted',
              label: 'Elf: Drow',
              originKind: 'species-trait',
              presentation: {
                category: 'species',
                sourceId: 'species:srd-2024:elf',
                sourceTitle: 'Elf: Drow',
              },
              grantedSpells: [
                {
                  spellId: 'srd-2024:dancing-lights',
                  name: 'Dancing Lights',
                  level: 0,
                  countsAgainstLimit: false,
                  entitlementId: 'drow-cantrip',
                  label: 'Elf: Drow',
                },
              ],
            }),
            entitlement({
              entitlementId: 'drow-spells',
              kind: 'granted',
              label: 'Elf: Drow',
              originKind: 'species-trait',
              presentation: {
                category: 'species',
                sourceId: 'species:srd-2024:elf',
                sourceTitle: 'Elf: Drow',
              },
              grantedSpells: [
                {
                  spellId: 'srd-2024:faerie-fire',
                  name: 'Faerie Fire',
                  level: 1,
                  countsAgainstLimit: false,
                  entitlementId: 'drow-spells',
                  label: 'Elf: Drow',
                },
                {
                  spellId: 'srd-2024:darkness',
                  name: 'Darkness',
                  level: 2,
                  countsAgainstLimit: false,
                  entitlementId: 'drow-spells',
                  label: 'Elf: Drow',
                },
              ],
            }),
          ],
        }),
        group({
          groupId: 'class:wiz-1',
          label: 'Wizard',
          entitlements: [
            entitlement({
              entitlementId: 'cantrips',
              kind: 'select',
              selectionKind: 'cantrip',
              label: 'Cantrips',
              limit: 4,
              accessibleLevels: [0],
              remainingPicks: 4,
              originKind: 'class-core',
              presentation: {
                category: 'class',
                sourceId: 'class:wiz-1',
                sourceTitle: 'Wizard',
              },
            }),
            entitlement({
              entitlementId: 'evocation-savant-initial',
              kind: 'select',
              selectionKind: 'spellbook',
              label: 'Evocation Savant (initial)',
              limit: 2,
              accessibleLevels: [1, 2],
              remainingPicks: 2,
              originKind: 'subclass-feature',
              presentation: {
                category: 'subclass',
                sourceId: 'subclass:wiz-1:evoker',
                sourceTitle: 'Evoker',
              },
            }),
          ],
        }),
      ],
    }

    const sections = buildSpellPresentationModel(summary)

    expect(sections.map((section) => section.label)).toEqual([
      'Granted by Species',
      'Granted by Class',
      'Granted by Subclass',
    ])

    const species = sections[0]!.sources[0]!
    expect(species.title).toBe('Elf: Drow')
    expect(species.alwaysPrepared.map((grant) => grant.name)).toEqual([
      'Dancing Lights',
      'Faerie Fire',
      'Darkness',
    ])
    expect(species.pools).toEqual([])

    expect(sections[1]!.sources[0]!.title).toBe('Wizard')
    expect(sections[1]!.sources[0]!.pools.map((pool) => pool.title)).toEqual([
      'Cantrips',
    ])

    expect(sections[2]!.sources[0]!.title).toBe('Evoker')
    expect(sections[2]!.sources[0]!.pools.map((pool) => pool.title)).toEqual([
      'Evocation Savant (initial)',
    ])
  })

  it('keeps one class source for multiple class entitlements', () => {
    const summary: CharacterSpellcastingSummary = {
      hasSpellcastingCapability: true,
      hasSpellContent: true,
      spellLines: [],
      sharedSlots: null,
      pactSlots: null,
      activeSources: [],
      groups: [
        group({
          groupId: 'class:wiz-1',
          label: 'Wizard',
          entitlements: [
            entitlement({
              entitlementId: 'cantrips',
              kind: 'select',
              selectionKind: 'cantrip',
              label: 'Cantrips',
              limit: 3,
              accessibleLevels: [0],
              remainingPicks: 3,
              presentation: {
                category: 'class',
                sourceId: 'class:wiz-1',
                sourceTitle: 'Wizard',
              },
            }),
            entitlement({
              entitlementId: 'spellbook-1',
              kind: 'select',
              selectionKind: 'spellbook',
              label: 'Wizard level 1 spellbook',
              limit: 6,
              accessibleLevels: [1],
              remainingPicks: 6,
              presentation: {
                category: 'class',
                sourceId: 'class:wiz-1',
                sourceTitle: 'Wizard',
              },
            }),
            entitlement({
              entitlementId: 'prepared',
              kind: 'select',
              selectionKind: 'prepared',
              label: 'Prepared Spells',
              limit: 4,
              accessibleLevels: [1],
              remainingPicks: 4,
              presentation: {
                category: 'class',
                sourceId: 'class:wiz-1',
                sourceTitle: 'Wizard',
              },
            }),
          ],
        }),
      ],
    }

    const sections = buildSpellPresentationModel(summary)
    expect(sections).toHaveLength(1)
    expect(sections[0]!.sources).toHaveLength(1)
    expect(sections[0]!.sources[0]!.pools.map((pool) => pool.title)).toEqual([
      'Cantrips',
      'Wizard level 1 spellbook',
      'Prepared Spells',
    ])
  })
})
