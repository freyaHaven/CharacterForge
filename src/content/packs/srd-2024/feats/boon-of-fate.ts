import type { FeatDefinition } from '../../../../domain/feat/types'
import { createAsiScoreIncreaseChoice } from '../../../../domain/feat/asiScoreIncreaseChoice'
import { SRD_2024_SOURCE } from '../source'

export const boonOfFateSrd2024: FeatDefinition = {
  id: 'srd-2024:boon-of-fate',
  editionId: 'srd-2024',
  name: 'Boon of Fate',
  summary: 'Add or subtract 2d4 from a nearby D20 Test.',
  description:
    'You gain the following benefits. Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30. Improve Fate. When you or another creature within 60 feet of you succeeds on or fails a D20 Test, you can roll 2d4 and apply the total rolled as a bonus or penalty to the d20 roll. Once you use this benefit, you can’t use it again until you roll Initiative or finish a Short or Long Rest.',
  source: SRD_2024_SOURCE,
  category: 'epic-boon',
  prerequisite: {
    kind: 'requirements',
    summary: 'Level 19+',
    requirements: [{ kind: 'min-character-level', level: 19 }],
  },
  benefits: [
    {
      id: 'ability-score-increase',
      name: 'Ability Score Increase',
      description:
        'Increase one ability score of your choice by 1, to a maximum of 30.',
    },
    {
      id: 'improve-fate',
      name: 'Improve Fate',
      description:
        'When you or another creature within 60 feet of you succeeds on or fails a D20 Test, you can roll 2d4 and apply the total rolled as a bonus or penalty to the d20 roll. Once you use this benefit, you can’t use it again until you roll Initiative or finish a Short or Long Rest.',
    },
  ],
  repeatable: false,
  choices: [
    createAsiScoreIncreaseChoice({
      modes: ['plus-1'],
      maximum: 30,
    }),
  ],
}
