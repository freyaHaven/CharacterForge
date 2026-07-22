import { describe, expect, it } from 'vitest'
import { createSyntheticClassDefinition } from '../../../testing/syntheticClassDefinition'
import {
  collectSkillExpertiseSelections,
  collectSkillProficiencySelections,
  getExcludedExpertiseOptionIds,
} from '../skillProficiencySelections'

const multiSkillClass = createSyntheticClassDefinition({
  choices: [
    {
      id: 'skill-proficiencies',
      level: 1,
      prompt: 'Choose skills',
      type: 'multi-select',
      required: true,
      min: 2,
      max: 2,
      options: [
        {
          id: 'athletics',
          label: 'Athletics',
          effects: [{ kind: 'skill-proficiency', skillId: 'athletics' }],
        },
        {
          id: 'perception',
          label: 'Perception',
          effects: [{ kind: 'skill-proficiency', skillId: 'perception' }],
        },
        {
          id: 'intimidation',
          label: 'Intimidation',
          effects: [{ kind: 'skill-proficiency', skillId: 'intimidation' }],
        },
      ],
    },
    {
      id: 'bonus-skill',
      level: 3,
      prompt: 'Choose one additional skill',
      type: 'multi-select',
      required: true,
      min: 1,
      max: 1,
      options: [
        {
          id: 'athletics',
          label: 'Athletics',
          effects: [{ kind: 'skill-proficiency', skillId: 'athletics' }],
        },
        {
          id: 'intimidation',
          label: 'Intimidation',
          effects: [{ kind: 'skill-proficiency', skillId: 'intimidation' }],
        },
      ],
    },
    {
      id: 'expertise',
      level: 1,
      prompt: 'Choose expertise',
      type: 'multi-select',
      required: true,
      min: 2,
      max: 2,
      options: [
        {
          id: 'athletics',
          label: 'Athletics',
          effects: [{ kind: 'skill-expertise', skillId: 'athletics' }],
        },
        {
          id: 'perception',
          label: 'Perception',
          effects: [{ kind: 'skill-expertise', skillId: 'perception' }],
        },
        {
          id: 'intimidation',
          label: 'Intimidation',
          effects: [{ kind: 'skill-expertise', skillId: 'intimidation' }],
        },
      ],
    },
  ],
})

describe('collectSkillProficiencySelections', () => {
  it('collects skills across multiple skill choices', () => {
    expect(
      collectSkillProficiencySelections(multiSkillClass, {
        'skill-proficiencies': ['athletics', 'perception'],
        'bonus-skill': ['intimidation'],
      }),
    ).toEqual(['athletics', 'perception', 'intimidation'])
  })

  it('can exclude one skill choice when collecting', () => {
    expect(
      collectSkillProficiencySelections(
        multiSkillClass,
        {
          'skill-proficiencies': ['athletics', 'perception'],
          'bonus-skill': ['intimidation'],
        },
        'bonus-skill',
      ),
    ).toEqual(['athletics', 'perception'])
  })
})

describe('expertise selection helpers', () => {
  it('collects expertise skill ids', () => {
    expect(
      collectSkillExpertiseSelections(multiSkillClass, {
        expertise: ['athletics', 'perception'],
      }),
    ).toEqual(['athletics', 'perception'])
  })

  it('excludes non-proficient skills and expertise taken on other choices', () => {
    expect(
      getExcludedExpertiseOptionIds(multiSkillClass, 'expertise', {
        'skill-proficiencies': ['athletics', 'perception'],
        expertise: ['athletics'],
      }),
    ).toEqual(['intimidation'])
  })

  it('can use character-wide proficient skills when provided', () => {
    expect(
      getExcludedExpertiseOptionIds(
        multiSkillClass,
        'expertise',
        {
          'skill-proficiencies': ['athletics'],
          expertise: [],
        },
        ['athletics', 'intimidation'],
      ),
    ).toEqual(['perception'])
  })

  it('allows expertise on a background skill outside class picks', () => {
    expect(
      getExcludedExpertiseOptionIds(
        multiSkillClass,
        'expertise',
        {
          'skill-proficiencies': ['athletics'],
          expertise: [],
        },
        // Background granted Perception; class only picked Athletics.
        ['athletics', 'perception'],
      ),
    ).toEqual(['intimidation'])
  })
})
