import type { ClassDefinition } from '../../../domain/class/types'
import { SRD_2024_SOURCE } from './source'

export const barbarianSrd2024: ClassDefinition = {
  id: 'srd-2024:barbarian',
  editionId: 'srd-2024',
  name: 'Barbarian',
  catalogStatus: 'preview',
  description:
    'A fierce warrior who can enter a battle rage and shrug off deadly blows.',
  source: SRD_2024_SOURCE,
  hitDie: { sides: 12 },
  primaryAbilities: ['strength', 'constitution'],
  savingThrows: ['strength', 'constitution'],
  proficiencies: {
    armor: ['light', 'medium', 'shield'],
    weapons: ['simple', 'martial'],
    tools: [],
    skillOptions: ['athletics', 'intimidation', 'nature', 'perception', 'survival'],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'rage',
          name: 'Rage',
          description:
            'Enter a battle rage as a bonus action to gain combat benefits.',
        },
      ],
    },
  ],
  choices: [],
  deferredRequirements: [],
}
