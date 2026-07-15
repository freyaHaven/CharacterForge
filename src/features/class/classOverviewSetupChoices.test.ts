import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../data/classes/srd-2024/fighter'
import {
  formatOverviewSetupChoicePrompt,
  getOverviewSetupChoiceHeading,
  getOverviewSetupChoices,
  isSkillProficiencyChoice,
} from './classOverviewSetupChoices'

describe('classOverviewSetupChoices', () => {
  it('returns unlinked multi-select choices available at the current level', () => {
    const setupChoices = getOverviewSetupChoices(fighterSrd2024, 1)

    expect(setupChoices.map((choice) => choice.id)).toEqual([
      'skill-proficiencies',
    ])
    expect(setupChoices[0]?.max).toBe(2)
    expect(setupChoices[0]?.options.length).toBeGreaterThan(0)
  })

  it('excludes linked single-select choices from overview setup', () => {
    const setupChoices = getOverviewSetupChoices(fighterSrd2024, 3)

    expect(setupChoices.map((choice) => choice.id)).toEqual([
      'skill-proficiencies',
    ])
  })

  it('formats skill proficiency setup copy from the choice definition', () => {
    const [skillChoice] = getOverviewSetupChoices(fighterSrd2024, 1)

    expect(skillChoice).toBeDefined()
    expect(isSkillProficiencyChoice(skillChoice!)).toBe(true)
    expect(getOverviewSetupChoiceHeading(skillChoice!)).toBe(
      'Skill Proficiencies',
    )
    expect(formatOverviewSetupChoicePrompt(skillChoice!)).toBe('Choose 2 from:')
  })
})
