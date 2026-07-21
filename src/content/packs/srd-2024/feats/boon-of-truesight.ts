import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const boonOfTruesightSrd2024: FeatDefinition = {
  id: 'srd-2024:boon-of-truesight',
  editionId: 'srd-2024',
  name: 'Boon of Truesight',
  summary: 'Gain Truesight with a range of 60 feet.',
  description:
    'You gain the following benefits. Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30. Truesight. You have Truesight with a range of 60 feet.',
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
      id: 'truesight',
      name: 'Truesight',
      description: 'You have Truesight with a range of 60 feet.',
    },
  ],
  repeatable: false,
  choices: [],
}
