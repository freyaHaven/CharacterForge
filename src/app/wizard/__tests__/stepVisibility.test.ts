import { describe, expect, it } from 'vitest'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { WIZARD_STEPS } from '../steps'
import {
  createWizardStepContext,
  getVisibleWizardSteps,
  hasFeatChoices,
  hasSpellContent,
  isWizardStepVisible,
} from '../stepVisibility'

describe('wizard step visibility', () => {
  const context = createWizardStepContext(createDefaultCharacter())

  it('shows the primary flow and hides deferred steps', () => {
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

  it('keeps feats and spells conditional', () => {
    const featsStep = WIZARD_STEPS.find((step) => step.id === 'feats')
    const spellsStep = WIZARD_STEPS.find((step) => step.id === 'spells')

    expect(WIZARD_STEPS.find((step) => step.id === 'character-details')).toBeUndefined()
    expect(featsStep?.visibility).toEqual({
      kind: 'conditional',
      when: 'feats',
    })
    expect(spellsStep?.visibility).toEqual({
      kind: 'conditional',
      when: 'spells',
    })
    expect(isWizardStepVisible(featsStep!, context)).toBe(false)
    expect(isWizardStepVisible(spellsStep!, context)).toBe(false)
  })
})
