import type { SpeciesDefinition } from '../../../../domain/species/types'
import { SRD_2024_SOURCE } from '../source'
import { SRD_2024_ORIGIN_LANGUAGES } from './originLanguages'

export const halflingSrd2024: SpeciesDefinition = {
  id: 'srd-2024:halfling',
  editionId: 'srd-2024',
  name: 'Halfling',
  description:
    'Halflings possess a brave and adventurous spirit that leads them on journeys of discovery.',
  source: SRD_2024_SOURCE,
  creatureType: 'humanoid',
  size: 'small',
  speed: { walk: 30 },
  languages: SRD_2024_ORIGIN_LANGUAGES,
  traits: [
    {
      id: 'brave',
      name: 'Brave',
      description:
        'You have Advantage on saving throws you make to avoid or end the Frightened condition.',
      effects: [{ kind: 'save-advantage', condition: 'frightened' }],
    },
    {
      id: 'halfling-nimbleness',
      name: 'Halfling Nimbleness',
      description:
        "You can move through the space of any creature that is a size larger than you, but you can't stop in the same space.",
    },
    {
      id: 'luck',
      name: 'Luck',
      description:
        'When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll.',
    },
    {
      id: 'naturally-stealthy',
      name: 'Naturally Stealthy',
      description:
        'You can take the Hide action even when you are obscured only by a creature that is at least one size larger than you.',
    },
  ],
  effects: [],
  choices: [],
  guidance: {
    age: 'Halflings reach adulthood at age 20 and live into the middle of their second century.',
    height: 'Typical height: 60–90 cm',
  },
}
