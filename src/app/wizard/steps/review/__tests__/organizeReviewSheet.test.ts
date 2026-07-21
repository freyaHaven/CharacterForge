import { describe, expect, it } from 'vitest'
import { organizeReviewSheet } from '../organizeReviewSheet'
import type { StepStatus, WizardStepId } from '../../../types'

function createStatuses(
  overrides: Partial<Record<Exclude<WizardStepId, 'review'>, StepStatus>> = {},
): Record<Exclude<WizardStepId, 'review'>, StepStatus> {
  const defaultStatus: StepStatus = {
    completion: 'not-started',
    hasValidationErrors: false,
  }

  return {
    basics: defaultStatus,
    species: defaultStatus,
    class: defaultStatus,
    'ability-scores': defaultStatus,
    background: defaultStatus,
    equipment: defaultStatus,
    feats: defaultStatus,
    spells: defaultStatus,
    ...overrides,
  }
}

const emptySheetModels = {
  hitPointMaximumLabel: '—',
  armorClassLabel: '10',
  initiativeLabel: '+0',
  speedLabel: null as string | null,
  proficiencyBonusLabel: '+2',
}

describe('organizeReviewSheet', () => {
  it('groups class choices into skills and features while omitting sticky-header duplicates', () => {
    const sheet = organizeReviewSheet({
      summaries: {
        basics: ['Name: Aldric', 'Edition: D&D 5e 2024'],
        species: ['Species: Dwarf'],
        class: [
          'Class: Fighter',
          'Level: 1',
          'Choose a Fighting Style: Defense',
          'Choose two skill proficiencies: Athletics, Perception',
          'Class selection complete',
        ],
        'ability-scores': ['Method: Manual', 'STR 14 (+2)'],
        background: ['Coming soon'],
        equipment: ['Coming soon'],
        feats: [],
        spells: [],
      },
      stepStatuses: createStatuses({
        class: { completion: 'complete', hasValidationErrors: false },
      }),
      sheetModels: emptySheetModels,
      speciesDisplay: {
        speciesName: 'Dwarf',
        ancestryLabel: null,
      },
      classDisplay: {
        entries: [
          {
            classId: 'srd-2024:fighter',
            className: 'Fighter',
            level: 1,
            subclassName: null,
          },
        ],
        className: 'Fighter',
        subclassName: null,
        level: 1,
        characterLevel: 1,
        choiceLines: [
          {
            prompt: 'Choose a Fighting Style',
            summary: 'Defense',
            heading: 'Defense',
            description:
              'While you are wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.',
          },
          {
            prompt: 'Choose two skill proficiencies',
            summary: 'Athletics, Perception',
          },
        ],
      },
      unresolvedDeferredRequirements: [],
      hasSpellcastingCapability: false,
      spellLines: [],
    })

    expect(sheet.features).toEqual([
      {
        label: 'Defense',
        value: 'Defense',
        description:
          'While you are wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.',
        entries: undefined,
      },
    ])
    expect(sheet.skillsAndSaves).toEqual([
      {
        label: 'Choose two skill proficiencies',
        value: 'Athletics, Perception',
        description: undefined,
        entries: undefined,
      },
    ])
    expect(sheet.backgroundLines).toEqual([])
    expect(sheet.sectionVisibility).toEqual({
      skills: true,
      equipment: false,
      features: true,
      spells: false,
      background: false,
    })
  })

  it('omits name-only subclass choices from Features once shown in the header', () => {
    const sheet = organizeReviewSheet({
      summaries: {
        basics: [],
        species: [],
        class: [
          'Class: Fighter',
          'Level: 3',
          'Choose a Fighting Style: Defense',
          'Choose a Fighter Subclass: Champion',
        ],
        'ability-scores': [],
        background: [],
        equipment: [],
        feats: [],
        spells: [],
      },
      stepStatuses: createStatuses({
        class: { completion: 'complete', hasValidationErrors: false },
      }),
      sheetModels: emptySheetModels,
      speciesDisplay: {
        speciesName: 'Dwarf',
        ancestryLabel: null,
      },
      classDisplay: {
        entries: [
          {
            classId: 'srd-2024:fighter',
            className: 'Fighter',
            level: 3,
            subclassName: 'Champion',
          },
        ],
        className: 'Fighter',
        subclassName: 'Champion',
        level: 3,
        characterLevel: 3,
        choiceLines: [
          {
            prompt: 'Choose a Fighting Style',
            summary: 'Defense',
            heading: 'Defense',
            description:
              'While you are wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.',
          },
          {
            prompt: 'Choose a Fighter Subclass',
            summary: 'Champion',
          },
        ],
      },
      unresolvedDeferredRequirements: [],
      hasSpellcastingCapability: false,
      spellLines: [],
    })

    expect(sheet.features).toEqual([
      {
        label: 'Defense',
        value: 'Defense',
        description:
          'While you are wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.',
        entries: undefined,
      },
    ])
    expect(
      sheet.features.some((feature) => /\bsubclass\b/i.test(feature.label)),
    ).toBe(false)
  })

  it('renders selected subclass features as nested entries', () => {
    const sheet = organizeReviewSheet({
      summaries: {
        basics: [],
        species: [],
        class: [],
        'ability-scores': [],
        background: [],
        equipment: [],
        feats: [],
        spells: [],
      },
      stepStatuses: createStatuses({
        class: { completion: 'complete', hasValidationErrors: false },
      }),
      sheetModels: emptySheetModels,
      speciesDisplay: {
        speciesName: 'Dwarf',
        ancestryLabel: null,
      },
      classDisplay: {
        entries: [
          {
            classId: 'srd-2024:fighter',
            className: 'Fighter',
            level: 3,
            subclassName: 'Champion',
          },
        ],
        className: 'Fighter',
        subclassName: 'Champion',
        level: 3,
        characterLevel: 3,
        choiceLines: [
          {
            prompt: 'Choose a Fighter Subclass',
            summary: 'Champion',
            heading: 'Champion',
            entries: [
              {
                label: 'Improved Critical',
                description:
                  'Your attack rolls with weapons and Unarmed Strikes can score a Critical Hit on a roll of 19 or 20 on the d20.',
              },
              {
                label: 'Remarkable Athlete',
                description:
                  'Thanks to your athleticism, you have Advantage on Initiative rolls and Strength (Athletics) checks.',
              },
            ],
          },
        ],
      },
      unresolvedDeferredRequirements: [],
      hasSpellcastingCapability: false,
      spellLines: [],
    })

    expect(sheet.features).toEqual([
      {
        label: 'Champion',
        value: 'Champion',
        description: undefined,
        entries: [
          {
            label: 'Improved Critical',
            description:
              'Your attack rolls with weapons and Unarmed Strikes can score a Critical Hit on a roll of 19 or 20 on the d20.',
          },
          {
            label: 'Remarkable Athlete',
            description:
              'Thanks to your athleticism, you have Advantage on Initiative rolls and Strength (Athletics) checks.',
          },
        ],
      },
    ])
  })

  it('renders weapon mastery as nested feature entries', () => {
    const sheet = organizeReviewSheet({
      summaries: {
        basics: [],
        species: [],
        class: [],
        'ability-scores': [],
        background: [],
        equipment: [],
        feats: [],
        spells: [],
      },
      stepStatuses: createStatuses(),
      sheetModels: emptySheetModels,
      speciesDisplay: {
        speciesName: null,
        ancestryLabel: null,
      },
      classDisplay: {
        entries: [
          {
            classId: 'srd-2024:fighter',
            className: 'Fighter',
            level: 1,
            subclassName: null,
          },
        ],
        className: 'Fighter',
        subclassName: null,
        level: 1,
        characterLevel: 1,
        choiceLines: [
          {
            prompt: 'Choose 3 weapon masteries',
            summary: 'Greatsword (Graze), Javelin (Slow)',
            heading: 'Weapon Mastery',
            entries: [
              {
                label: 'Greatsword (Graze)',
                description:
                  'If your attack roll with a Greatsword misses a creature, you can deal damage to that creature equal to the ability modifier you used to make the attack roll. This damage is the same type dealt by the Greatsword, and the damage can be increased only by increasing the ability modifier.',
              },
              {
                label: 'Javelin (Slow)',
                description:
                  'If you hit a creature with a Javelin and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn. If the creature is hit more than once by weapons that have this property, the Speed reduction doesn’t exceed 10 feet.',
              },
            ],
          },
        ],
      },
      unresolvedDeferredRequirements: [],
      hasSpellcastingCapability: false,
      spellLines: [],
    })

    expect(sheet.features).toEqual([
      {
        label: 'Weapon Mastery',
        value: 'Greatsword (Graze), Javelin (Slow)',
        description: undefined,
        entries: [
          {
            label: 'Greatsword (Graze)',
            description:
              'If your attack roll with a Greatsword misses a creature, you can deal damage to that creature equal to the ability modifier you used to make the attack roll. This damage is the same type dealt by the Greatsword, and the damage can be increased only by increasing the ability modifier.',
          },
          {
            label: 'Javelin (Slow)',
            description:
              'If you hit a creature with a Javelin and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn. If the creature is hit more than once by weapons that have this property, the Speed reduction doesn’t exceed 10 feet.',
          },
        ],
      },
    ])
  })

  it('shows optional sections only when they contain meaningful data', () => {
    const sheet = organizeReviewSheet({
      summaries: {
        basics: [],
        species: ['Species: Dragonborn'],
        class: ['Not selected'],
        'ability-scores': ['Method: Manual'],
        background: ['Coming soon'],
        equipment: ['Coming soon'],
        feats: [],
        spells: [],
      },
      stepStatuses: createStatuses(),
      sheetModels: emptySheetModels,
      speciesDisplay: {
        speciesName: 'Dragonborn',
        ancestryLabel: 'Red (Fire)',
      },
      classDisplay: {
        entries: [],
        className: null,
        subclassName: null,
        level: null,
        characterLevel: null,
        choiceLines: [],
      },
      unresolvedDeferredRequirements: [],
      hasSpellcastingCapability: true,
      spellLines: ['Cantrips: Fire Bolt'],
    })

    expect(sheet.sectionVisibility.background).toBe(true)
    expect(sheet.sectionVisibility.spells).toBe(true)
    expect(sheet.sectionVisibility.equipment).toBe(false)
    expect(sheet.sectionVisibility.features).toBe(false)
    expect(sheet.sectionVisibility.skills).toBe(false)
  })
})
