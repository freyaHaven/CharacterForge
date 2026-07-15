import type { FeatDefinition } from '../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../../content/srd-2024/source'

export const magicInitiateClericSrd2024: FeatDefinition = {
  id: 'srd-2024:magic-initiate-cleric',
  editionId: 'srd-2024',
  name: 'Magic Initiate (Cleric)',
  summary: 'Learn two cantrips and one 1st-level Cleric spell.',
  description:
    'You learn two cantrips and one 1st-level spell from the Cleric spell list. Spell selection will be configured in a later step.',
  source: SRD_2024_SOURCE,
  category: 'origin',
  prerequisite: { kind: 'none' },
  benefits: [
    {
      id: 'cleric-cantrips',
      name: 'Cleric Cantrips',
      description: 'Learn two cantrips from the Cleric spell list.',
    },
    {
      id: 'cleric-1st-level-spell',
      name: '1st-Level Cleric Spell',
      description:
        'Learn one 1st-level spell from the Cleric spell list. You can cast it once per Long Rest without a spell slot, and you can also cast it using any spell slots you have.',
    },
  ],
  repeatable: false,
  choices: [],
  magicInitiateClass: 'cleric',
}
