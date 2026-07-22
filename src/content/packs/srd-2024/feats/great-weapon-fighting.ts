import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const greatWeaponFightingSrd2024: FeatDefinition = {
  id: 'srd-2024:great-weapon-fighting',
  editionId: 'srd-2024',
  name: 'Great Weapon Fighting',
  summary:
    'Treat 1s and 2s as 3s on two-handed or versatile melee damage dice.',
  description:
    'When you roll damage for an attack you make with a Melee weapon that you are wielding with two hands, you can treat any 1 or 2 on a damage die as a 3. The weapon must have the Two-Handed or Versatile property to gain this benefit.',
  source: SRD_2024_SOURCE,
  category: 'fighting-style',
  prerequisite: {
    kind: 'requirements',
    summary: 'Fighting Style Feature',
    requirements: [{ kind: 'has-fighting-style' }],
  },
  benefits: [
    {
      id: 'damage-die-floor',
      name: 'Damage Die Floor',
      description:
        'When you roll damage for an attack you make with a Melee weapon that you are wielding with two hands, you can treat any 1 or 2 on a damage die as a 3. The weapon must have the Two-Handed or Versatile property to gain this benefit.',
    },
  ],
  repeatable: false,
  choices: [],
}
