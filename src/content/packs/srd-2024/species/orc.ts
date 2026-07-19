import type { SpeciesDefinition } from '../../../../domain/species/types'
import { SRD_2024_SOURCE } from '../source'
import { SRD_2024_ORIGIN_LANGUAGES } from './originLanguages'

const DARKVISION_DESCRIPTION =
  'You have Darkvision with a range of 120 feet.'

export const orcSrd2024: SpeciesDefinition = {
  id: 'srd-2024:orc',
  editionId: 'srd-2024',
  name: 'Orc',
  description:
    'Orcs are equipped with gifts that help them wander great plains, vast caverns, and churning seas.',
  source: SRD_2024_SOURCE,
  creatureType: 'humanoid',
  size: 'medium',
  speed: { walk: 30 },
  languages: SRD_2024_ORIGIN_LANGUAGES,
  traits: [
    {
      id: 'adrenaline-rush',
      name: 'Adrenaline Rush',
      description:
        'You can take the Dash action as a Bonus Action. When you do so, you gain a number of Temporary Hit Points equal to your Proficiency Bonus. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Short or Long Rest.',
    },
    {
      id: 'darkvision',
      name: 'Darkvision',
      description: DARKVISION_DESCRIPTION,
      effects: [{ kind: 'darkvision', rangeFeet: 120 }],
    },
    {
      id: 'relentless-endurance',
      name: 'Relentless Endurance',
      description:
        "When you are reduced to 0 Hit Points but not killed outright, you can drop to 1 Hit Point instead. Once you use this trait, you can't do so again until you finish a Long Rest.",
    },
  ],
  effects: [],
  choices: [],
  guidance: {
    age: 'Orcs reach adulthood at age 16 and live up to 80 years.',
    height: 'Typical height: 180–210 cm',
  },
}
