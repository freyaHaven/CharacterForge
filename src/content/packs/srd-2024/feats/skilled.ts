import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const skilledSrd2024: FeatDefinition = {
  id: 'srd-2024:skilled',
  editionId: 'srd-2024',
  name: 'Skilled',
  summary: 'Gain proficiency in any combination of three skills or tools.',
  description:
    'You gain proficiency in any combination of three skills or tools of your choice. You can take this feat more than once.',
  source: SRD_2024_SOURCE,
  category: 'origin',
  prerequisite: { kind: 'none' },
  benefits: [
    {
      id: 'skill-or-tool-proficiencies',
      name: 'Skill or Tool Proficiencies',
      description:
        'You gain proficiency in any combination of three skills or tools of your choice.',
    },
  ],
  repeatable: true,
  choices: [],
}
