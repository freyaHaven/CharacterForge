import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const archerySrd2024: FeatDefinition = {
  id: 'srd-2024:archery',
  editionId: 'srd-2024',
  name: 'Archery',
  summary: 'You gain a +2 bonus to attack rolls with Ranged weapons.',
  description:
    'You gain a +2 bonus to attack rolls you make with Ranged weapons.',
  source: SRD_2024_SOURCE,
  category: 'fighting-style',
  prerequisite: {
    kind: 'requirements',
    summary: 'Fighting Style Feature',
    requirements: [{ kind: 'has-fighting-style' }],
  },
  benefits: [
    {
      id: 'ranged-attack-bonus',
      name: 'Ranged Attack Bonus',
      description:
        'You gain a +2 bonus to attack rolls you make with Ranged weapons.',
    },
  ],
  repeatable: false,
  choices: [],
}
