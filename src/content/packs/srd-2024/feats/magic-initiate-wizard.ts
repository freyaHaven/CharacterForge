import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const magicInitiateWizardSrd2024: FeatDefinition = {
  id: 'srd-2024:magic-initiate-wizard',
  editionId: 'srd-2024',
  name: 'Magic Initiate (Wizard)',
  summary: 'Learn two cantrips and one 1st-level Wizard spell.',
  description:
    'You learn two cantrips and one 1st-level spell from the Wizard spell list. Spell selection will be configured in a later step.',
  source: SRD_2024_SOURCE,
  category: 'origin',
  prerequisite: { kind: 'none' },
  benefits: [
    {
      id: 'wizard-cantrips',
      name: 'Wizard Cantrips',
      description: 'Learn two cantrips from the Wizard spell list.',
    },
    {
      id: 'wizard-1st-level-spell',
      name: '1st-Level Wizard Spell',
      description:
        'Learn one 1st-level spell from the Wizard spell list. You can cast it once per Long Rest without a spell slot, and you can also cast it using any spell slots you have.',
    },
  ],
  repeatable: false,
  choices: [],
  magicInitiateClass: 'wizard',
}
