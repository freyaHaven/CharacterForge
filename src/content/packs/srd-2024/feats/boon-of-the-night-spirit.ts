import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const boonOfTheNightSpiritSrd2024: FeatDefinition = {
  id: 'srd-2024:boon-of-the-night-spirit',
  editionId: 'srd-2024',
  name: 'Boon of the Night Spirit',
  summary: 'Become Invisible and resist damage in Dim Light or Darkness.',
  description:
    'You gain the following benefits. Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30. Merge with Shadows. While within Dim Light or Darkness, you can give yourself the Invisible condition as a Bonus Action. The condition ends on you immediately after you take an action, a Bonus Action, or a Reaction. Shadowy Form. While within Dim Light or Darkness, you have Resistance to all damage except Psychic and Radiant.',
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
      id: 'merge-with-shadows',
      name: 'Merge with Shadows',
      description:
        'While within Dim Light or Darkness, you can give yourself the Invisible condition as a Bonus Action. The condition ends on you immediately after you take an action, a Bonus Action, or a Reaction.',
    },
    {
      id: 'shadowy-form',
      name: 'Shadowy Form',
      description:
        'While within Dim Light or Darkness, you have Resistance to all damage except Psychic and Radiant.',
    },
  ],
  repeatable: false,
  choices: [],
}
