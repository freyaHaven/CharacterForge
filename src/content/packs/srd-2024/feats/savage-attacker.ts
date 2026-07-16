import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const savageAttackerSrd2024: FeatDefinition = {
  id: 'srd-2024:savage-attacker',
  editionId: 'srd-2024',
  name: 'Savage Attacker',
  summary: 'Make the most of every successful strike.',
  description:
    'Once per turn when you hit a target with a weapon, you can roll the weapon’s damage dice twice and use either total.',
  source: SRD_2024_SOURCE,
  category: 'origin',
  prerequisite: { kind: 'none' },
  benefits: [
    {
      id: 'damage-reroll',
      name: 'Damage Reroll',
      description:
        'Once per turn when you hit with a weapon, roll the weapon’s damage dice twice and use either total.',
    },
  ],
  repeatable: false,
  choices: [],
}
