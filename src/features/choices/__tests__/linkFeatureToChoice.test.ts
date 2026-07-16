import { describe, expect, it } from 'vitest'
import type { ClassChoice } from '../../../domain/class/types'
import {
  findMultiSelectChoiceForFeature,
  findSingleSelectChoiceForFeature,
  getChoicesNotLinkedToFeatures,
} from '../linkFeatureToChoice'

const FIGHTING_STYLE_CHOICE = {
  id: 'fighting-style',
  level: 1,
  prompt: 'Choose a Fighting Style',
  type: 'single-select',
  required: true,
  options: [{ id: 'defense', label: 'Defense' }],
} as const satisfies ClassChoice

const SKILL_CHOICE = {
  id: 'skill-proficiencies',
  level: 1,
  prompt: 'Choose two skill proficiencies',
  type: 'multi-select',
  required: true,
  min: 2,
  max: 2,
  options: [{ id: 'athletics', label: 'Athletics' }],
} as const satisfies ClassChoice

const WEAPON_MASTERY_CHOICE = {
  id: 'weapon-mastery',
  level: 1,
  prompt: 'Choose 3 weapon masteries',
  type: 'multi-select',
  required: true,
  min: 3,
  max: 3,
  options: [{ id: 'longsword', label: 'Longsword' }],
} as const satisfies ClassChoice

describe('linkFeatureToChoice', () => {
  it('links a feature to a single-select choice with the same id', () => {
    expect(
      findSingleSelectChoiceForFeature('fighting-style', [
        FIGHTING_STYLE_CHOICE,
        SKILL_CHOICE,
      ]),
    ).toEqual(FIGHTING_STYLE_CHOICE)
  })

  it('links a feature to a multi-select choice with the same id', () => {
    expect(
      findMultiSelectChoiceForFeature('weapon-mastery', [
        WEAPON_MASTERY_CHOICE,
        SKILL_CHOICE,
      ]),
    ).toEqual(WEAPON_MASTERY_CHOICE)
  })

  it('returns null when no matching single-select choice exists', () => {
    expect(
      findSingleSelectChoiceForFeature('second-wind', [FIGHTING_STYLE_CHOICE]),
    ).toBeNull()
  })

  it('excludes choices already rendered on feature cards', () => {
    expect(
      getChoicesNotLinkedToFeatures(
        [FIGHTING_STYLE_CHOICE, SKILL_CHOICE, WEAPON_MASTERY_CHOICE],
        ['fighting-style', 'second-wind', 'weapon-mastery'],
      ),
    ).toEqual([SKILL_CHOICE])
  })
})
