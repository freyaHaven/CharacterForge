import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../../../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import { createBundledSpellCatalog } from '../../../adapters/bundledSpellCatalog'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { resolveCharacterSpellcasting } from '../resolveCharacterSpellcasting'

describe('resolveCharacterSpellcasting source ordering', () => {
  it('orders species → background → class regardless of collection order', async () => {
    const character = createDefaultCharacter({
      targetLevel: 3,
      species: {
        speciesId: 'srd-2024:elf',
        choices: {
          'elven-lineage': 'high-elf',
          'spellcasting-ability': 'intelligence',
        },
      },
      background: {
        backgroundId: 'srd-2024:sage',
        choices: {
          'feat-choices:origin-feat:spellcasting-ability': 'intelligence',
        },
      },
      classes: [
        {
          instanceId: 'wizard-1',
          classId: 'srd-2024:wizard',
          level: 3,
          choices: {
            'wizard-subclass': 'evoker',
          },
        },
      ],
      abilityScores: {
        strength: 8,
        dexterity: 14,
        constitution: 14,
        intelligence: 16,
        wisdom: 12,
        charisma: 10,
      },
    })

    const summary = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      character,
      {
        featCatalog: createBundledFeatCatalog(),
        backgroundCatalog: createBundledBackgroundCatalog(),
        speciesCatalog: createBundledSpeciesCatalog(),
        spellCatalog: createBundledSpellCatalog(),
      },
    )

    const labels = summary.groups.map((group) => group.label)
    const speciesIndex = labels.findIndex((label) => /elf/i.test(label))
    const backgroundIndex = labels.findIndex((label) =>
      /magic initiate|background|sage/i.test(label),
    )
    const wizardIndex = labels.findIndex((label) => label === 'Wizard')

    expect(speciesIndex).toBeGreaterThanOrEqual(0)
    expect(backgroundIndex).toBeGreaterThanOrEqual(0)
    expect(wizardIndex).toBeGreaterThanOrEqual(0)
    expect(speciesIndex).toBeLessThan(backgroundIndex)
    expect(backgroundIndex).toBeLessThan(wizardIndex)
  })

  it('keeps multiclass sources in class instance order', async () => {
    const character = createDefaultCharacter({
      targetLevel: 4,
      classes: [
        {
          instanceId: 'cleric-1',
          classId: 'srd-2024:cleric',
          level: 2,
          choices: {
            'divine-order': 'thaumaturge',
          },
        },
        {
          instanceId: 'wizard-1',
          classId: 'srd-2024:wizard',
          level: 2,
          choices: {},
        },
      ],
      abilityScores: {
        strength: 8,
        dexterity: 12,
        constitution: 14,
        intelligence: 15,
        wisdom: 15,
        charisma: 10,
      },
    })

    const summary = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      character,
      {
        spellCatalog: createBundledSpellCatalog(),
      },
    )

    const classLabels = summary.groups
      .filter((group) => group.groupId.startsWith('class:'))
      .map((group) => group.label)

    expect(classLabels).toEqual(['Cleric', 'Wizard'])
  })

  it('places subclass entitlements after class core within a class group', async () => {
    const character = createDefaultCharacter({
      targetLevel: 3,
      classes: [
        {
          instanceId: 'cleric-1',
          classId: 'srd-2024:cleric',
          level: 3,
          choices: {
            'divine-order': 'thaumaturge',
            'cleric-subclass': 'life-domain',
          },
        },
      ],
      abilityScores: {
        strength: 8,
        dexterity: 12,
        constitution: 14,
        intelligence: 10,
        wisdom: 16,
        charisma: 10,
      },
    })

    const summary = await resolveCharacterSpellcasting(
      createBundledClassCatalog(),
      character,
      {
        spellCatalog: createBundledSpellCatalog(),
      },
    )

    const cleric = summary.groups.find((group) => group.label === 'Cleric')
    expect(cleric).toBeDefined()
    const entitlementLabels = cleric!.entitlements.map((entry) => entry.label)
    const cantripsIndex = entitlementLabels.findIndex((label) =>
      /cantrip/i.test(label),
    )
    const domainIndex = entitlementLabels.findIndex((label) =>
      /life|domain|prepared/i.test(label),
    )

    expect(cantripsIndex).toBeGreaterThanOrEqual(0)
    if (domainIndex >= 0) {
      expect(cantripsIndex).toBeLessThan(domainIndex)
    }
  })
})
