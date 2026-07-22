import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const twoWeaponFightingSrd2024: FeatDefinition = {
  id: 'srd-2024:two-weapon-fighting',
  editionId: 'srd-2024',
  name: 'Two-Weapon Fighting',
  summary: 'Add your ability modifier to Light-weapon extra attack damage.',
  description:
    'When you make an extra attack as a result of using a weapon that has the Light property, you can add your ability modifier to the damage of that attack if you aren’t already adding it to the damage.',
  source: SRD_2024_SOURCE,
  category: 'fighting-style',
  prerequisite: {
    kind: 'requirements',
    summary: 'Fighting Style Feature',
    requirements: [{ kind: 'has-fighting-style' }],
  },
  benefits: [
    {
      id: 'light-weapon-damage',
      name: 'Light Weapon Damage',
      description:
        'When you make an extra attack as a result of using a weapon that has the Light property, you can add your ability modifier to the damage of that attack if you aren’t already adding it to the damage.',
    },
  ],
  repeatable: false,
  choices: [],
}
