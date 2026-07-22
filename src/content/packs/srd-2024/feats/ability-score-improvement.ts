import type { FeatDefinition } from '../../../../domain/feat/types'
import { createAsiScoreIncreaseChoice } from '../../../../domain/feat/asiScoreIncreaseChoice'
import { SRD_2024_SOURCE } from '../source'

export const abilityScoreImprovementSrd2024: FeatDefinition = {
  id: 'srd-2024:ability-score-improvement',
  editionId: 'srd-2024',
  name: 'Ability Score Improvement',
  summary:
    'Increase one ability score by 2, or two ability scores by 1 (maximum 20).',
  description:
    'Increase one ability score of your choice by 2, or increase two ability scores of your choice by 1. This feat can’t increase an ability score above 20. You can take this feat more than once.',
  source: SRD_2024_SOURCE,
  category: 'general',
  prerequisite: {
    kind: 'requirements',
    summary: 'Level 4+',
    requirements: [{ kind: 'min-character-level', level: 4 }],
  },
  benefits: [
    {
      id: 'ability-score-increase',
      name: 'Ability Score Increase',
      description:
        'Increase one ability score of your choice by 2, or increase two ability scores of your choice by 1, to a maximum of 20.',
    },
  ],
  repeatable: true,
  choices: [
    createAsiScoreIncreaseChoice({
      modes: ['plus-2', 'plus-1-1'],
      maximum: 20,
    }),
  ],
}
