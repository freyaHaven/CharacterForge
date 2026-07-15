import { describe, expect, it } from 'vitest'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { WIZARD_STEPS } from './steps'
import {
  createWizardStepContext,
  getVisibleWizardSteps,
  hasFeatChoices,
  hasSpellSelections,
  isWizardStepVisible,
} from './stepVisibility'

describe('wizard step visibility', () => {
  const context = createWizardStepContext(createDefaultCharacter())

  it('hides feats and spells until choices exist', () => {
    expect(hasFeatChoices(context)).toBe(false)
    expect(hasSpellSelections(context)).toBe(false)

    const visibleIds = getVisibleWizardSteps(context).map((step) => step.id)

    expect(visibleIds).toEqual([
      'basics',
      'species',
      'character-details',
      'ability-scores',
      'class',
      'background',
      'equipment',
      'review',
    ])
  })

  it('marks conditional steps in the full step list', () => {
    const featsStep = WIZARD_STEPS.find((step) => step.id === 'feats')
    const spellsStep = WIZARD_STEPS.find((step) => step.id === 'spells')

    expect(featsStep?.visibility).toEqual({ kind: 'conditional', when: 'feats' })
    expect(spellsStep?.visibility).toEqual({
      kind: 'conditional',
      when: 'spells',
    })
    expect(isWizardStepVisible(featsStep!, context)).toBe(false)
    expect(isWizardStepVisible(spellsStep!, context)).toBe(false)
  })
})
