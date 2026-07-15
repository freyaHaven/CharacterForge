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

  it('shows feats for manual optional selection while spells stay hidden', () => {
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
      'feats',
      'review',
    ])
  })

  it('keeps feats always visible and spells conditional', () => {
    const featsStep = WIZARD_STEPS.find((step) => step.id === 'feats')
    const spellsStep = WIZARD_STEPS.find((step) => step.id === 'spells')

    expect(featsStep?.visibility).toBeUndefined()
    expect(spellsStep?.visibility).toEqual({
      kind: 'conditional',
      when: 'spells',
    })
    expect(isWizardStepVisible(featsStep!, context)).toBe(true)
    expect(isWizardStepVisible(spellsStep!, context)).toBe(false)
  })
})
