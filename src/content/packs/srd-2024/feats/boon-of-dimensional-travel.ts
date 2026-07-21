import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const boonOfDimensionalTravelSrd2024: FeatDefinition = {
  id: 'srd-2024:boon-of-dimensional-travel',
  editionId: 'srd-2024',
  name: 'Boon of Dimensional Travel',
  summary: 'Teleport after Attack or Magic actions.',
  description:
    'You gain the following benefits. Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30. Blink Steps. Immediately after you take the Attack action or the Magic action, you can teleport up to 30 feet to an unoccupied space you can see.',
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
      id: 'blink-steps',
      name: 'Blink Steps',
      description:
        'Immediately after you take the Attack action or the Magic action, you can teleport up to 30 feet to an unoccupied space you can see.',
    },
  ],
  repeatable: false,
  choices: [],
}
