import { describe, expect, it } from 'vitest'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { WIZARD_STEPS } from '../steps'
import {
  createWizardStepContext,
  getVisibleWizardSteps,
  hasCharacterDetailsStep,
  hasFeatChoices,
  hasSpellContent,
  isWizardStepVisible,
} from '../stepVisibility'

describe('wizard step visibility', () => {
  const context = createWizardStepContext(createDefaultCharacter())

  it('shows the primary flow and hides deferred steps', () => {
    expect(hasCharacterDetailsStep(context)).toBe(false)
    expect(hasFeatChoices(context)).toBe(false)
    expect(hasSpellContent(context)).toBe(false)

    const visibleIds = getVisibleWizardSteps(context).map((step) => step.id)

    expect(visibleIds).toEqual([
      'basics',
      'class',
      'background',
      'species',
      'ability-scores',
      'equipment',
      'review',
    ])
  })

  it('shows Spells when hasSpellContent is true', () => {
    const withSpells = createWizardStepContext(createDefaultCharacter(), {
      hasSpellContent: true,
    })

    expect(hasSpellContent(withSpells)).toBe(true)
    expect(
      getVisibleWizardSteps(withSpells).map((step) => step.id),
    ).toContain('spells')
  })

  it('keeps character details, feats, and spells conditional', () => {
    const characterDetailsStep = WIZARD_STEPS.find(
      (step) => step.id === 'character-details',
    )
    const featsStep = WIZARD_STEPS.find((step) => step.id === 'feats')
    const spellsStep = WIZARD_STEPS.find((step) => step.id === 'spells')

    expect(characterDetailsStep?.visibility).toEqual({
      kind: 'conditional',
      when: 'character-details',
    })
    expect(featsStep?.visibility).toEqual({
      kind: 'conditional',
      when: 'feats',
    })
    expect(spellsStep?.visibility).toEqual({
      kind: 'conditional',
      when: 'spells',
    })
    expect(isWizardStepVisible(characterDetailsStep!, context)).toBe(false)
    expect(isWizardStepVisible(featsStep!, context)).toBe(false)
    expect(isWizardStepVisible(spellsStep!, context)).toBe(false)
  })
})
