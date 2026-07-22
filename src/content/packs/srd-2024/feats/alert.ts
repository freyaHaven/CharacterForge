import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const alertSrd2024: FeatDefinition = {
  id: 'srd-2024:alert',
  editionId: 'srd-2024',
  name: 'Alert',
  summary: 'Always on the lookout for danger.',
  description:
    'You gain Initiative Proficiency and can swap Initiative with a willing ally when you roll Initiative.',
  source: SRD_2024_SOURCE,
  category: 'origin',
  prerequisite: { kind: 'none' },
  benefits: [
    {
      id: 'initiative-proficiency',
      name: 'Initiative Proficiency',
      description:
        'When you roll Initiative, you can add your Proficiency Bonus to the roll.',
    },
    {
      id: 'initiative-swap',
      name: 'Initiative Swap',
      description:
        'Immediately after you roll Initiative, you can swap your Initiative with that of one willing ally in the same combat.',
    },
  ],
  effects: [{ kind: 'initiative-proficiency' }],
  repeatable: false,
  choices: [],
}
