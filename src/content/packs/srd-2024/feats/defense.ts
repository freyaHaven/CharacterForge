import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const defenseSrd2024: FeatDefinition = {
  id: 'srd-2024:defense',
  editionId: 'srd-2024',
  name: 'Defense',
  summary: '+1 AC while wearing armor.',
  description:
    'While you are wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.',
  source: SRD_2024_SOURCE,
  category: 'fighting-style',
  prerequisite: {
    kind: 'requirements',
    summary: 'Fighting Style Feature',
    requirements: [{ kind: 'has-fighting-style' }],
  },
  benefits: [
    {
      id: 'armored-ac-bonus',
      name: 'Armored AC Bonus',
      description:
        'While you are wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.',
    },
  ],
  effects: [
    { kind: 'armor-class-bonus', amount: 1, when: 'wearing-armor' },
  ],
  repeatable: false,
  choices: [],
}
