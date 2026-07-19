import type { SpeciesDefinition } from '../../../../domain/species/types'
import { SRD_2024_SOURCE } from '../source'
import { SRD_2024_ORIGIN_LANGUAGES } from './originLanguages'
import { SRD_2024_SIZE_CHOICE } from './sharedChoices'

export const humanSrd2024: SpeciesDefinition = {
  id: 'srd-2024:human',
  editionId: 'srd-2024',
  name: 'Human',
  description:
    'Humans are the most adaptable and ambitious people among the common species, with a broad range of appearances and cultures.',
  source: SRD_2024_SOURCE,
  creatureType: 'humanoid',
  size: 'medium',
  speed: { walk: 30 },
  languages: SRD_2024_ORIGIN_LANGUAGES,
  traits: [
    {
      id: 'resourceful',
      name: 'Resourceful',
      description:
        'You gain Heroic Inspiration whenever you finish a Long Rest.',
    },
    {
      id: 'skillful',
      name: 'Skillful',
      description: 'You gain proficiency in one skill of your choice.',
    },
    {
      id: 'versatile',
      name: 'Versatile',
      description:
        'You gain an Origin feat of your choice. Skilled is recommended.',
    },
  ],
  effects: [],
  choices: [SRD_2024_SIZE_CHOICE],
  guidance: {
    age: 'Humans reach adulthood in their late teens and live less than a century.',
    height: 'Typical height: 60–210 cm (Small or Medium)',
  },
}
