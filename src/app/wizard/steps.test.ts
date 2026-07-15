import { describe, expect, it } from 'vitest'
import { DEFAULT_WIZARD_UI_STATE, WIZARD_STEPS } from './steps'
import type { WizardStepId } from './types'

describe('WIZARD_STEPS', () => {
  it('defines all wizard steps in the intended order', () => {
    const ids = WIZARD_STEPS.map((step) => step.id)

    expect(ids).toEqual([
      'basics',
      'species',
      'character-details',
      'ability-scores',
      'class',
      'background',
      'equipment',
      'feats',
      'spells',
      'review',
    ])
  })

  it('uses unique step IDs', () => {
    const ids = WIZARD_STEPS.map((step) => step.id)
    const uniqueIds = new Set(ids)

    expect(uniqueIds.size).toBe(ids.length)
  })

  it('marks Basics, Species, Class, and Ability Scores as required', () => {
    const requiredById = Object.fromEntries(
      WIZARD_STEPS.map((step) => [step.id, step.required]),
    ) as Record<WizardStepId, boolean>

    expect(requiredById.basics).toBe(true)
    expect(requiredById.species).toBe(true)
    expect(requiredById.class).toBe(true)
    expect(requiredById['ability-scores']).toBe(true)
  })

  it('marks optional steps as not required', () => {
    const requiredById = Object.fromEntries(
      WIZARD_STEPS.map((step) => [step.id, step.required]),
    ) as Record<WizardStepId, boolean>

    expect(requiredById['character-details']).toBe(false)
    expect(requiredById.background).toBe(false)
    expect(requiredById.equipment).toBe(false)
    expect(requiredById.feats).toBe(false)
    expect(requiredById.spells).toBe(false)
    expect(requiredById.review).toBe(false)
  })

  it('places Review last', () => {
    expect(WIZARD_STEPS.at(-1)?.id).toBe('review')
  })
})

describe('DEFAULT_WIZARD_UI_STATE', () => {
  it('starts on the Basics step', () => {
    expect(DEFAULT_WIZARD_UI_STATE.activeStepId).toBe('basics')
  })
})
