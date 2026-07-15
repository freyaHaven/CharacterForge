import { describe, expect, it } from 'vitest'
import { createDefaultCharacterDetails } from '../../domain/character/details'
import { createDefaultCharacter } from '../../domain/character/defaults'
import {
  createTestFighterClassInstance,
  withSingleClassInstance,
} from '../../domain/character/characterClassSelection'
import type { Character } from '../../domain/types'
import {
  getAbilityScoresStepStatus,
  getCharacterDetailsStepStatus,
  getAllStepStatuses,
  getBasicsStepStatus,
  getClassStepStatus,
  getNonReviewStepStatuses,
  getPlaceholderStepStatus,
  getReviewStepStatus,
  getSpeciesStepStatus,
  type StepValidationContext,
} from './stepStatus'

function createContext(
  overrides: Partial<StepValidationContext> = {},
): StepValidationContext {
  return {
    character: createDefaultCharacter(),
    basicsTouched: false,
    detailsTouched: false,
    abilityScoresTouched: false,
    speciesDraft: null,
    speciesDraftValidation: null,
    committedSpeciesValid: false,
    classDraft: null,
    classDraftValidation: null,
    committedClassValid: false,
    backgroundDraft: null,
    backgroundDraftValidation: null,
    committedBackgroundValid: false,
    featDraft: null,
    featDraftValidation: null,
    committedFeatValid: false,
    standardArrayValidation: null,
    pointBuyValidation: null,
    rolledValidation: null,
    ...overrides,
  }
}

function createCharacter(overrides: Partial<Character> = {}): Character {
  return createDefaultCharacter(overrides)
}

describe('getBasicsStepStatus', () => {
  it('is not-started when untouched and the name is empty', () => {
    expect(getBasicsStepStatus(createContext())).toEqual({
      completion: 'not-started',
      hasValidationErrors: false,
    })
  })

  it('is in-progress with validation errors when touched but the name is empty', () => {
    expect(
      getBasicsStepStatus(createContext({ basicsTouched: true })),
    ).toEqual({
      completion: 'in-progress',
      hasValidationErrors: true,
    })
  })

  it('is complete when the trimmed name is non-empty', () => {
    expect(
      getBasicsStepStatus(
        createContext({
          character: createCharacter({ name: '  Aldric  ' }),
        }),
      ),
    ).toEqual({
      completion: 'complete',
      hasValidationErrors: false,
    })
  })
})

describe('getSpeciesStepStatus', () => {
  it('is not-started when there is no committed selection and no draft', () => {
    expect(getSpeciesStepStatus(createContext())).toEqual({
      completion: 'not-started',
      hasValidationErrors: false,
    })
  })

  it('is in-progress with validation errors when a draft is incomplete', () => {
    expect(
      getSpeciesStepStatus(
        createContext({
          speciesDraft: { speciesId: 'srd-2024:dragonborn', choices: {} },
          speciesDraftValidation: {
            ok: false,
            issues: [{ code: 'missing-required-choice', choiceId: 'draconic-ancestry' }],
          },
        }),
      ),
    ).toEqual({
      completion: 'in-progress',
      hasValidationErrors: true,
    })
  })

  it('is in-progress without validation errors when a valid draft has not been committed yet', () => {
    expect(
      getSpeciesStepStatus(
        createContext({
          speciesDraft: {
            speciesId: 'srd-2024:dwarf',
            choices: {},
          },
          speciesDraftValidation: { ok: true },
        }),
      ),
    ).toEqual({
      completion: 'in-progress',
      hasValidationErrors: false,
    })
  })

  it('is complete when a valid committed species exists and no incomplete draft is active', () => {
    expect(
      getSpeciesStepStatus(
        createContext({
          character: createCharacter({
            species: { speciesId: 'srd-2024:dwarf', choices: {} },
          }),
          committedSpeciesValid: true,
        }),
      ),
    ).toEqual({
      completion: 'complete',
      hasValidationErrors: false,
    })
  })

  it('is in-progress with validation errors when the committed species is invalid', () => {
    expect(
      getSpeciesStepStatus(
        createContext({
          character: createCharacter({
            species: { speciesId: 'srd-2024:dwarf', choices: {} },
          }),
          committedSpeciesValid: false,
        }),
      ),
    ).toEqual({
      completion: 'in-progress',
      hasValidationErrors: true,
    })
  })
})

describe('getClassStepStatus', () => {
  it('is not-started when there is no committed selection and no draft', () => {
    expect(getClassStepStatus(createContext())).toEqual({
      completion: 'not-started',
      hasValidationErrors: false,
    })
  })

  it('is complete when a valid committed class exists and no incomplete draft is active', () => {
    expect(
      getClassStepStatus(
        createContext({
          character: createCharacter(
            withSingleClassInstance(createTestFighterClassInstance()),
          ),
          committedClassValid: true,
        }),
      ),
    ).toEqual({
      completion: 'complete',
      hasValidationErrors: false,
    })
  })

  it('is in-progress with validation errors when a draft is incomplete', () => {
    expect(
      getClassStepStatus(
        createContext({
          classDraft: {
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {},
          },
          classDraftValidation: {
            ok: false,
            issues: [
              { code: 'missing-required-choice', choiceId: 'fighting-style' },
            ],
          },
        }),
      ),
    ).toEqual({
      completion: 'in-progress',
      hasValidationErrors: true,
    })
  })
})

describe('getPlaceholderStepStatus', () => {
  it('reports optional placeholder steps as not-started without validation errors', () => {
    expect(getPlaceholderStepStatus()).toEqual({
      completion: 'not-started',
      hasValidationErrors: false,
    })
  })
})

describe('getAbilityScoresStepStatus', () => {
  it('is not-started when untouched even if manual scores are valid by default', () => {
    expect(getAbilityScoresStepStatus(createContext())).toEqual({
      completion: 'not-started',
      hasValidationErrors: false,
    })
  })

  it('is complete when touched and the active manual method is valid', () => {
    expect(
      getAbilityScoresStepStatus(
        createContext({
          abilityScoresTouched: true,
        }),
      ),
    ).toEqual({
      completion: 'complete',
      hasValidationErrors: false,
    })
  })

  it('is in-progress with validation errors when point buy is touched but invalid', () => {
    expect(
      getAbilityScoresStepStatus(
        createContext({
          character: createCharacter({ creationMethod: 'point-buy' }),
          abilityScoresTouched: true,
          pointBuyValidation: {
            valid: false,
            issues: [{ code: 'over-budget', spent: 54, budget: 27 }],
            spent: 54,
            remaining: -27,
          },
        }),
      ),
    ).toEqual({
      completion: 'in-progress',
      hasValidationErrors: true,
    })
  })

  it('is complete when touched and point buy is valid', () => {
    expect(
      getAbilityScoresStepStatus(
        createContext({
          character: createCharacter({ creationMethod: 'point-buy' }),
          abilityScoresTouched: true,
          pointBuyValidation: {
            valid: true,
            spent: 27,
            remaining: 0,
          },
        }),
      ),
    ).toEqual({
      completion: 'complete',
      hasValidationErrors: false,
    })
  })

  it('is in-progress with validation errors when standard array is touched but incomplete', () => {
    expect(
      getAbilityScoresStepStatus(
        createContext({
          character: createCharacter({ creationMethod: 'standard-array' }),
          abilityScoresTouched: true,
          standardArrayValidation: {
            valid: false,
            issues: [{ code: 'unassigned-ability', ability: 'strength' }],
          },
        }),
      ),
    ).toEqual({
      completion: 'in-progress',
      hasValidationErrors: true,
    })
  })

  it('is complete when touched and rolled assignment is valid', () => {
    expect(
      getAbilityScoresStepStatus(
        createContext({
          character: createCharacter({ creationMethod: 'rolled' }),
          abilityScoresTouched: true,
          rolledValidation: { valid: true },
        }),
      ),
    ).toEqual({
      completion: 'complete',
      hasValidationErrors: false,
    })
  })
})

describe('getReviewStepStatus', () => {
  it('is in-progress when required steps are incomplete', () => {
    expect(
      getReviewStepStatus({
        basics: { completion: 'not-started', hasValidationErrors: false },
        species: { completion: 'not-started', hasValidationErrors: false },
        'character-details': {
          completion: 'not-started',
          hasValidationErrors: false,
        },
        class: { completion: 'not-started', hasValidationErrors: false },
        'ability-scores': { completion: 'not-started', hasValidationErrors: false },
        background: { completion: 'not-started', hasValidationErrors: false },
        equipment: { completion: 'not-started', hasValidationErrors: false },
        feats: { completion: 'not-started', hasValidationErrors: false },
        spells: { completion: 'not-started', hasValidationErrors: false },
      }),
    ).toEqual({
      completion: 'in-progress',
      hasValidationErrors: false,
    })
  })

  it('ignores optional placeholder steps when deciding completion', () => {
    expect(
      getReviewStepStatus({
        basics: { completion: 'complete', hasValidationErrors: false },
        species: { completion: 'complete', hasValidationErrors: false },
        'character-details': { completion: 'complete', hasValidationErrors: false },
        class: { completion: 'complete', hasValidationErrors: false },
        'ability-scores': { completion: 'complete', hasValidationErrors: false },
        background: { completion: 'not-started', hasValidationErrors: false },
        equipment: { completion: 'not-started', hasValidationErrors: false },
        feats: { completion: 'not-started', hasValidationErrors: false },
        spells: { completion: 'not-started', hasValidationErrors: false },
      }),
    ).toEqual({
      completion: 'complete',
      hasValidationErrors: false,
    })
  })

  it('reports validation errors when any required step has errors', () => {
    expect(
      getReviewStepStatus({
        basics: { completion: 'in-progress', hasValidationErrors: true },
        species: { completion: 'complete', hasValidationErrors: false },
        'character-details': { completion: 'complete', hasValidationErrors: false },
        class: { completion: 'not-started', hasValidationErrors: false },
        'ability-scores': { completion: 'complete', hasValidationErrors: false },
        background: { completion: 'not-started', hasValidationErrors: false },
        equipment: { completion: 'not-started', hasValidationErrors: false },
        feats: { completion: 'not-started', hasValidationErrors: false },
        spells: { completion: 'not-started', hasValidationErrors: false },
      }),
    ).toEqual({
      completion: 'in-progress',
      hasValidationErrors: true,
    })
  })
})

describe('getCharacterDetailsStepStatus', () => {
  it('is not-started when untouched and empty', () => {
    expect(getCharacterDetailsStepStatus(createContext())).toEqual({
      completion: 'not-started',
      hasValidationErrors: false,
    })
  })

  it('is in-progress when touched but empty', () => {
    expect(
      getCharacterDetailsStepStatus(createContext({ detailsTouched: true })),
    ).toEqual({
      completion: 'in-progress',
      hasValidationErrors: false,
    })
  })

  it('is complete when any field is populated', () => {
    expect(
      getCharacterDetailsStepStatus(
        createContext({
          character: createCharacter({
            details: {
              ...createDefaultCharacterDetails(),
              backstoryNotes: 'A note',
            },
          }),
        }),
      ),
    ).toEqual({
      completion: 'complete',
      hasValidationErrors: false,
    })
  })
})

describe('getAllStepStatuses', () => {
  it('returns placeholder steps as optional and not-started', () => {
    const statuses = getAllStepStatuses(createContext())

    expect(statuses.class).toEqual({
      completion: 'not-started',
      hasValidationErrors: false,
    })
    expect(statuses.background).toEqual({
      completion: 'not-started',
      hasValidationErrors: false,
    })
    expect(statuses.equipment).toEqual({
      completion: 'not-started',
      hasValidationErrors: false,
    })
  })

  it('derives review from required steps without circular dependencies', () => {
    const statuses = getAllStepStatuses(
      createContext({
        character: createCharacter({
          name: 'Aldric',
          species: { speciesId: 'srd-2024:dwarf', choices: {} },
          ...withSingleClassInstance(createTestFighterClassInstance()),
        }),
        committedSpeciesValid: true,
        committedClassValid: true,
        abilityScoresTouched: true,
      }),
    )

    expect(statuses.basics.completion).toBe('complete')
    expect(statuses.species.completion).toBe('complete')
    expect(statuses.class.completion).toBe('complete')
    expect(statuses['ability-scores'].completion).toBe('complete')
    expect(statuses.review).toEqual({
      completion: 'complete',
      hasValidationErrors: false,
    })
  })

  it('keeps review in-progress while a required step remains incomplete', () => {
    const statuses = getAllStepStatuses(
      createContext({
        character: createCharacter({ name: 'Aldric' }),
        abilityScoresTouched: true,
      }),
    )

    expect(statuses.species.completion).toBe('not-started')
    expect(statuses.review).toEqual({
      completion: 'in-progress',
      hasValidationErrors: false,
    })
  })
})

describe('getNonReviewStepStatuses', () => {
  it('does not include review', () => {
    expect(getNonReviewStepStatuses(createContext())).not.toHaveProperty('review')
  })
})
