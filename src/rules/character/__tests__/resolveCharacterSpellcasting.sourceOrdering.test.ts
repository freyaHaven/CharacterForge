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
      /life|domain/i.test(label),
    )

    expect(cantripsIndex).toBeGreaterThanOrEqual(0)
    // Cantrips unlock at level 1; Life Domain package unlocks at subclass level 3.
    if (domainIndex >= 0) {
      expect(cantripsIndex).toBeLessThan(domainIndex)
    }
  })

  it('keeps Evocation Savant with Wizard level 3 content before level 4', async () => {
    const character = createDefaultCharacter({
      targetLevel: 4,
      classes: [
        {
          instanceId: 'wizard-1',
          classId: 'srd-2024:wizard',
          level: 4,
          choices: {
            'wizard-subclass': 'evoker',
            'ability-score-improvement-4': 'feat:srd-2024:magic-initiate-wizard',
            'feat-choices:ability-score-improvement-4:spellcasting-ability':
              'intelligence',
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
        spellCatalog: createBundledSpellCatalog(),
      },
    )

    // Class-feat-grant now shares the Wizard class-instance group band.
    const wizardRelated = summary.groups.filter(
      (group) =>
        group.groupId === 'class:wizard-1' ||
        group.groupId.includes('wizard-1'),
    )
    const entitlementLabels = wizardRelated.flatMap((group) =>
      group.entitlements.map((entry) => entry.label),
    )

    const savantIndex = entitlementLabels.findIndex((label) =>
      /evocation savant \(initial\)/i.test(label),
    )
    const spellbook3Index = entitlementLabels.findIndex((label) =>
      /wizard level 3 spellbook addition/i.test(label),
    )
    const spellbook4Index = entitlementLabels.findIndex((label) =>
      /wizard level 4 spellbook addition/i.test(label),
    )
    const asiFeatIndex = entitlementLabels.findIndex((label) =>
      /magic initiate|granted by ability score improvement/i.test(label),
    )

    expect(entitlementLabels).toEqual(expect.arrayContaining([
      expect.stringMatching(/evocation savant \(initial\)/i),
      expect.stringMatching(/wizard level 3 spellbook addition/i),
      expect.stringMatching(/wizard level 4 spellbook addition/i),
    ]))
    expect(savantIndex).toBeGreaterThanOrEqual(0)
    expect(spellbook3Index).toBeGreaterThanOrEqual(0)
    expect(spellbook4Index).toBeGreaterThanOrEqual(0)

    // Subclass package before same-level spellbook addition.
    expect(savantIndex).toBeLessThan(spellbook3Index)
    // Level 3 package before level 4 content.
    expect(savantIndex).toBeLessThan(spellbook4Index)
    if (asiFeatIndex >= 0) {
      expect(savantIndex).toBeLessThan(asiFeatIndex)
      expect(spellbook3Index).toBeLessThan(asiFeatIndex)
    }

    // Granting-level order must not flip if later-level core entitlements were
    // collected / defined before the subclass package (regression for
    // insertion-order dependence).
    const levelOrdered = entitlementLabels.filter((label) =>
      /evocation savant \(initial\)|wizard level [34] spellbook addition/i.test(
        label,
      ),
    )
    expect(levelOrdered).toEqual([
      'Evocation Savant (initial)',
      'Wizard level 3 spellbook addition',
      'Wizard level 4 spellbook addition',
    ])
  })

  it('orders another subclass package the same way (Life Domain)', async () => {
    const character = createDefaultCharacter({
      targetLevel: 4,
      classes: [
        {
          instanceId: 'cleric-1',
          classId: 'srd-2024:cleric',
          level: 4,
          choices: {
            'divine-order': 'thaumaturge',
            'cleric-subclass': 'life-domain',
            'ability-score-improvement-4': 'plus-2:wisdom',
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
    const labels = cleric!.entitlements.map((entry) => entry.label)
    const cantripsIndex = labels.findIndex((label) => /cantrip/i.test(label))
    const domainIndex = labels.findIndex((label) => /life|domain/i.test(label))
    const preparedIndex = labels.findIndex((label) =>
      /prepared/i.test(label),
    )

    expect(cantripsIndex).toBeGreaterThanOrEqual(0)
    if (domainIndex >= 0 && preparedIndex >= 0) {
      // Domain package (level 3) sits with level-3 content; cantrips remain first.
      expect(cantripsIndex).toBeLessThan(domainIndex)
    }
  })
})
