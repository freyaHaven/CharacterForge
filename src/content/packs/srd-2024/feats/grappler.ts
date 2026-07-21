import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const grapplerSrd2024: FeatDefinition = {
  id: 'srd-2024:grappler',
  editionId: 'srd-2024',
  name: 'Grappler',
  summary: 'Improve your grappling and unarmed strikes.',
  description:
    'You gain the following benefits. Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 20. Punch and Grab. When you hit a creature with an Unarmed Strike as part of the Attack action on your turn, you can use both the Damage and the Grapple option. You can use this benefit only once per turn. Attack Advantage. You have Advantage on attack rolls against a creature Grappled by you. Fast Wrestler. You don’t have to spend extra movement to move a creature Grappled by you if the creature is your size or smaller.',
  source: SRD_2024_SOURCE,
  category: 'general',
  prerequisite: {
    kind: 'requirements',
    summary: 'Level 4+, Strength or Dexterity 13+',
    requirements: [
      { kind: 'min-character-level', level: 4 },
      {
        kind: 'min-ability-score-any',
        abilities: ['strength', 'dexterity'],
        minimum: 13,
      },
    ],
  },
  benefits: [
    {
      id: 'ability-score-increase',
      name: 'Ability Score Increase',
      description:
        'Increase your Strength or Dexterity score by 1, to a maximum of 20.',
    },
    {
      id: 'punch-and-grab',
      name: 'Punch and Grab',
      description:
        'When you hit a creature with an Unarmed Strike as part of the Attack action on your turn, you can use both the Damage and the Grapple option. You can use this benefit only once per turn.',
    },
    {
      id: 'attack-advantage',
      name: 'Attack Advantage',
      description:
        'You have Advantage on attack rolls against a creature Grappled by you.',
    },
    {
      id: 'fast-wrestler',
      name: 'Fast Wrestler',
      description:
        'You don’t have to spend extra movement to move a creature Grappled by you if the creature is your size or smaller.',
    },
  ],
  repeatable: false,
  choices: [],
}
