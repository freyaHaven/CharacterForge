import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../../../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import { createBundledSpellCatalog } from '../../../adapters/bundledSpellCatalog'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { COMPLETE_WOOD_ELF_SELECTION } from '../../../testing/speciesSelectionTestUtils'
import { resolveCharacterSpellcasting } from '../resolveCharacterSpellcasting'
import { resolveCharacterFeatGrants } from '../resolveCharacterFeatGrants'

describe('species spell and feat grants', () => {
  it('exposes High Elf cantrip selection and level-gated grants', async () => {
    const character = {
      ...createDefaultCharacter(),
      targetLevel: 5,
      species: {
        speciesId: 'srd-2024:elf',
        choices: {
          'elven-lineage': 'high-elf',
          'keen-senses': 'insight',
          'spellcasting-ability': 'intelligence',
          'standard-languages': ['elvish', 'dwarvish'],
        },
      },
    }

    const summary = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      character,
      {
        speciesCatalog: createBundledSpeciesCatalog(),
        spellCatalog: createBundledSpellCatalog(),
      },
    )

    expect(summary.hasSpellContent).toBe(true)
    const lineageGroup = summary.groups.find((group) =>
      group.groupId.includes('elven-lineage'),
    )
    expect(lineageGroup).toBeDefined()
    expect(
      lineageGroup?.entitlements.some(
        (entitlement) =>
          entitlement.kind === 'select' &&
          entitlement.entitlementId === 'high-elf-cantrip',
      ),
    ).toBe(true)
    expect(
      lineageGroup?.entitlements
        .flatMap((entitlement) => entitlement.grantedSpells.map((spell) => spell.spellId))
        .sort(),
    ).toEqual(['srd-2024:detect-magic', 'srd-2024:misty-step'])
  })

  it('shows species-only spell content for Wood Elf at level 1', async () => {
    const character = {
      ...createDefaultCharacter(),
      targetLevel: 1,
      species: {
        ...COMPLETE_WOOD_ELF_SELECTION,
        choices: { ...COMPLETE_WOOD_ELF_SELECTION.choices },
      },
    }

    const summary = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      character,
      {
        speciesCatalog: createBundledSpeciesCatalog(),
        spellCatalog: createBundledSpellCatalog(),
      },
    )

    expect(summary.hasSpellContent).toBe(true)
    expect(
      summary.groups
        .flatMap((group) =>
          group.entitlements.flatMap((entitlement) =>
            entitlement.grantedSpells.map((spell) => spell.spellId),
          ),
        )
        .sort(),
    ).toEqual(['srd-2024:druidcraft'])
  })

  it('grants Human Versatile through resolveCharacterFeatGrants without character.feat', async () => {
    const character = {
      ...createDefaultCharacter(),
      feat: null,
      species: {
        speciesId: 'srd-2024:human',
        choices: {
          size: 'medium',
          skillful: 'perception',
          versatile: 'srd-2024:alert',
          'standard-languages': ['dwarvish', 'elvish'],
        },
      },
    }

    const resolved = await resolveCharacterFeatGrants(character, {
      classCatalog: createBundledClassCatalog(),
      backgroundCatalog: createBundledBackgroundCatalog(),
      featCatalog: createBundledFeatCatalog(),
      speciesCatalog: createBundledSpeciesCatalog(),
    })

    expect(resolved.grants).toEqual([
      expect.objectContaining({
        featId: 'srd-2024:alert',
        source: expect.objectContaining({
          kind: 'species-feat-grant',
          choiceId: 'versatile',
          grantLabel: 'Versatile',
        }),
      }),
    ])
  })
})
