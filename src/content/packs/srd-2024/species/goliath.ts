import type {
  SpeciesChoiceOption,
  SpeciesDefinition,
} from '../../../../domain/species/types'
import { SRD_2024_SOURCE } from '../source'
import { SRD_2024_ORIGIN_LANGUAGES } from './originLanguages'

const GIANT_ANCESTRY_OPTIONS: SpeciesChoiceOption[] = [
  {
    id: 'clouds-jaunt',
    label: "Cloud's Jaunt (Cloud Giant)",
    description:
      'As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see.',
  },
  {
    id: 'fires-burn',
    label: "Fire's Burn (Fire Giant)",
    description:
      'When you hit a target with an attack roll and deal damage to it, you can also deal 1d10 Fire damage to that target.',
  },
  {
    id: 'frosts-chill',
    label: "Frost's Chill (Frost Giant)",
    description:
      'When you hit a target with an attack roll and deal damage to it, you can also deal 1d6 Cold damage to that target and reduce its Speed by 10 feet until the start of your next turn.',
  },
  {
    id: 'hills-tumble',
    label: "Hill's Tumble (Hill Giant)",
    description:
      'When you hit a Large or smaller creature with an attack roll and deal damage to it, you can give that target the Prone condition.',
  },
  {
    id: 'stones-endurance',
    label: "Stone's Endurance (Stone Giant)",
    description:
      'When you take damage, you can take a Reaction to roll 1d12. Add your Constitution modifier to the number rolled and reduce the damage by that total.',
  },
  {
    id: 'storms-thunder',
    label: "Storm's Thunder (Storm Giant)",
    description:
      'When you take damage from a creature within 60 feet of you, you can take a Reaction to deal 1d8 Thunder damage to that creature.',
  },
]

export const goliathSrd2024: SpeciesDefinition = {
  id: 'srd-2024:goliath',
  editionId: 'srd-2024',
  name: 'Goliath',
  description:
    'Goliaths are distant descendants of giants who seek heights above those reached by their ancestors.',
  source: SRD_2024_SOURCE,
  creatureType: 'humanoid',
  size: 'medium',
  speed: { walk: 35 },
  languages: SRD_2024_ORIGIN_LANGUAGES,
  traits: [
    {
      id: 'giant-ancestry',
      name: 'Giant Ancestry',
      description:
        'You are descended from Giants. Choose one supernatural boon from your ancestry; you can use the chosen benefit a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.',
    },
    {
      id: 'large-form',
      name: 'Large Form',
      description:
        "Starting at character level 5, you can change your size to Large as a Bonus Action if you're in a big enough space. This transformation lasts for 10 minutes or until you end it (no action required). For that duration, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once you use this trait, you can't use it again until you finish a Long Rest.",
    },
    {
      id: 'powerful-build',
      name: 'Powerful Build',
      description:
        'You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.',
    },
  ],
  effects: [],
  choices: [
    {
      id: 'giant-ancestry',
      prompt: 'Choose your giant ancestry benefit',
      type: 'single-select',
      required: true,
      helperText:
        'You can use the chosen benefit a number of times equal to your Proficiency Bonus per Long Rest.',
      options: GIANT_ANCESTRY_OPTIONS,
    },
  ],
  guidance: {
    age: 'Goliaths reach adulthood in their late teens and live less than a century.',
    height: 'Typical height: 210–240 cm',
  },
}
