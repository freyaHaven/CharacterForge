import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const greatWeaponFightingSrd2024: FeatDefinition = {
  id: 'srd-2024:great-weapon-fighting',
  editionId: 'srd-2024',
  name: 'Great Weapon Fighting',
  summary: 'Reroll 1s and 2s on two-handed or versatile melee damage dice.',
  description:
    'When you roll a 1 or 2 on a damage die for an attack you make with a Melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll. The weapon must have the Two-Handed or Versatile property for you to gain this benefit.',
  source: SRD_2024_SOURCE,
  category: 'fighting-style',
  prerequisite: {
    kind: 'requirements',
    summary: 'Fighting Style Feature',
    requirements: [{ kind: 'has-fighting-style' }],
  },
  benefits: [
    {
      id: 'damage-die-reroll',
      name: 'Damage Die Reroll',
      description:
        'When you roll a 1 or 2 on a damage die for an attack you make with a Melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll. The weapon must have the Two-Handed or Versatile property for you to gain this benefit.',
    },
  ],
  repeatable: false,
  choices: [],
}
