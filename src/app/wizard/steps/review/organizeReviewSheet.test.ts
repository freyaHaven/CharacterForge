import { describe, expect, it } from 'vitest'
import { organizeReviewSheet } from './organizeReviewSheet'
import type { StepStatus, WizardStepId } from '../../types'

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
    'character-details': defaultStatus,
    class: defaultStatus,
    'ability-scores': defaultStatus,
    background: defaultStatus,
    equipment: defaultStatus,
    feats: defaultStatus,
    spells: defaultStatus,
    ...overrides,
  }
}

describe('organizeReviewSheet', () => {
  it('groups class choices into skills and features while omitting sticky-header duplicates', () => {
    const sheet = organizeReviewSheet({
      summaries: {
        basics: ['Name: Aldric', 'Edition: D&D 5e 2024'],
        species: ['Species: Dwarf'],
        'character-details': [],
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
      speciesDisplay: {
        speciesName: 'Dwarf',
        ancestryLabel: null,
      },
      classDisplay: {
        className: 'Fighter',
        level: 1,
        choiceLines: [
          {
            prompt: 'Choose a Fighting Style',
            summary: 'Defense',
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
        label: 'Choose a Fighting Style',
        value: 'Defense',
      },
    ])
    expect(sheet.skillsAndSaves).toEqual([
      {
        label: 'Choose two skill proficiencies',
        value: 'Athletics, Perception',
      },
    ])
    expect(sheet.abilityScoreNotes).toEqual(['Method: Manual'])
    expect(sheet.backgroundLines).toEqual([])
    expect(sheet.sectionVisibility).toEqual({
      skills: true,
      equipment: false,
      features: true,
      spells: false,
      background: false,
    })
  })

  it('shows optional sections only when they contain meaningful data', () => {
    const sheet = organizeReviewSheet({
      summaries: {
        basics: [],
        species: ['Species: Dragonborn'],
        'character-details': [],
        class: ['Not selected'],
        'ability-scores': ['Method: Manual'],
        background: ['Coming soon'],
        equipment: ['Coming soon'],
        feats: [],
        spells: [],
      },
      stepStatuses: createStatuses(),
      speciesDisplay: {
        speciesName: 'Dragonborn',
        ancestryLabel: 'Red (Fire)',
      },
      classDisplay: {
        className: null,
        level: null,
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
