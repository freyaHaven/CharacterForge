import { describe, expect, it } from 'vitest'
import { abilityScoreImprovementSrd2024 } from '../../../content/packs/srd-2024/feats/ability-score-improvement'
import { skilledSrd2024 } from '../../../content/packs/srd-2024/feats/skilled'
import {
  areFeatDefinitionChoicesComplete,
  validateFeatDefinitionChoices,
} from '../validateFeatChoices'

describe('validateFeatDefinitionChoices', () => {
  it('requires three skill/tool picks for Skilled', () => {
    expect(
      validateFeatDefinitionChoices(skilledSrd2024, {}),
    ).toEqual([
      {
        code: 'missing-required-choice',
        choiceId: 'skill-or-tool-proficiencies',
      },
    ])

    expect(
      areFeatDefinitionChoicesComplete(skilledSrd2024, {
        'skill-or-tool-proficiencies': [
          'skill:athletics',
          'skill:perception',
          'tool:thieves-tools',
        ],
      }),
    ).toBe(true)
  })

  it('rejects already-owned skill picks when configured', () => {
    expect(
      validateFeatDefinitionChoices(
        skilledSrd2024,
        {
          'skill-or-tool-proficiencies': [
            'skill:athletics',
            'skill:perception',
            'tool:thieves-tools',
          ],
        },
        { ownedSkillIds: new Set(['athletics']) },
      ),
    ).toEqual([
      { code: 'already-proficient', choiceId: 'skill-or-tool-proficiencies' },
    ])
  })

  it('rejects nested feat mode for ASI score increase (cycle guard)', () => {
    expect(
      validateFeatDefinitionChoices(abilityScoreImprovementSrd2024, {
        'ability-score-increase': 'feat:srd-2024:alert',
      }),
    ).toEqual([
      { code: 'invalid-choice', choiceId: 'ability-score-increase' },
    ])

    expect(
      areFeatDefinitionChoicesComplete(abilityScoreImprovementSrd2024, {
        'ability-score-increase': 'plus-2:strength',
      }),
    ).toBe(true)
  })
})
