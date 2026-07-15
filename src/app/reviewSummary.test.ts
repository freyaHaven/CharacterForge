import { describe, expect, it } from 'vitest'
import { buildReviewSummaries } from './reviewSummary'
import type { ReviewSummaryContext } from './reviewSummary'
import { createDefaultCharacter } from '../domain/character/defaults'
import { MINIMUM_POINT_BUY_ASSIGNMENT } from '../rules/point-buy'
import type { StepStatus, WizardStepId } from './wizard/types'

function createContext(
  overrides: Partial<ReviewSummaryContext> = {},
): ReviewSummaryContext {
  return {
    character: createDefaultCharacter(),
    speciesDraft: null,
    speciesDisplay: { speciesName: null, ancestryLabel: null },
    classDraft: null,
    classDisplay: {
      className: null,
      level: null,
      choiceLines: [],
    },
    backgroundDraft: null,
    backgroundDisplay: {
      backgroundName: null,
      choiceLines: [],
    },
    standardArrayValidation: null,
    pointBuyValidation: null,
    rolledValidation: null,
    ...overrides,
  }
}

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
    ...overrides,
  }
}

describe('buildReviewSummaries', () => {
  it('summarises basics with the edition label and name', () => {
    const summaries = buildReviewSummaries(
      createContext({
        character: createDefaultCharacter({
          name: 'Aldric',
          editionId: 'srd-2024',
        }),
      }),
      createStatuses({
        basics: { completion: 'complete', hasValidationErrors: false },
      }),
    )

    expect(summaries.basics).toEqual([
      'Name: Aldric',
      'Edition: D&D 5e 2024',
    ])
  })

  it('summarises a committed species and ancestry', () => {
    const summaries = buildReviewSummaries(
      createContext({
        speciesDisplay: {
          speciesName: 'Dragonborn',
          ancestryLabel: 'Red (Fire)',
        },
      }),
      createStatuses({
        species: { completion: 'complete', hasValidationErrors: false },
      }),
    )

    expect(summaries.species).toEqual([
      'Species: Dragonborn',
      'Ancestry: Red (Fire)',
    ])
  })

  it('shows choice incomplete when the species status has validation errors', () => {
    const summaries = buildReviewSummaries(
      createContext({
        speciesDisplay: {
          speciesName: 'Dragonborn',
          ancestryLabel: null,
        },
      }),
      createStatuses({
        species: { completion: 'in-progress', hasValidationErrors: true },
      }),
    )

    expect(summaries.species).toEqual([
      'Species: Dragonborn',
      'Choice incomplete',
    ])
  })

  it('summarises ability scores with method details and modifiers', () => {
    const summaries = buildReviewSummaries(
      createContext({
        character: createDefaultCharacter({
          creationMethod: 'point-buy',
          abilityScores: MINIMUM_POINT_BUY_ASSIGNMENT,
        }),
        pointBuyValidation: {
          valid: true,
          spent: 0,
          remaining: 27,
        },
      }),
      createStatuses({
        'ability-scores': { completion: 'complete', hasValidationErrors: false },
      }),
    )

    expect(summaries['ability-scores'][0]).toBe('Method: Point Buy')
    expect(summaries['ability-scores']).toContain('STR 8 (-1)')
    expect(summaries['ability-scores']).toContain(
      'Point Buy: 0 / 27 spent · 27 remaining',
    )
  })

  it('summarises a committed class with level and choices', () => {
    const summaries = buildReviewSummaries(
      createContext({
        classDisplay: {
          className: 'Fighter',
          level: 3,
          choiceLines: [
            {
              prompt: 'Choose a Fighting Style',
              summary: 'Defense',
            },
            {
              prompt: 'Choose two skill proficiencies',
              summary: 'Athletics, Perception',
            },
            {
              prompt: 'Choose a Martial Archetype',
              summary: 'Champion (placeholder)',
            },
          ],
        },
      }),
      createStatuses({
        class: { completion: 'complete', hasValidationErrors: false },
      }),
    )

    expect(summaries.class).toEqual([
      'Class: Fighter',
      'Level: 3',
      'Choose a Fighting Style: Defense',
      'Choose two skill proficiencies: Athletics, Perception',
      'Choose a Martial Archetype: Champion (placeholder)',
    ])
  })

  it('uses not selected for optional steps without a selection', () => {
    const summaries = buildReviewSummaries(createContext(), createStatuses())

    expect(summaries.class).toEqual(['Not selected'])
    expect(summaries.background).toEqual(['Not selected'])
    expect(summaries.equipment).toEqual(['Coming soon'])
  })
})
