import type { BackgroundDefinition } from '../../../domain/background/types'
import { SRD_2024_SOURCE } from '../../content/srd-2024/source'
import { createStandardEquipmentChoice } from './equipment'

export const sageSrd2024: BackgroundDefinition = {
  id: 'srd-2024:sage',
  editionId: 'srd-2024',
  name: 'Sage',
  description:
    'You spent years learning the lore of the multiverse, scouring tomes and consulting experts.',
  source: SRD_2024_SOURCE,
  eligibleAbilityScores: ['constitution', 'intelligence', 'wisdom'],
  originFeat: {
    id: 'magic-initiate-wizard',
    name: 'Magic Initiate (Wizard)',
    description:
      'You learn two cantrips and one 1st-level spell from the Wizard spell list. Spell selection will be configured in a later step.',
    magicInitiateClass: 'wizard',
  },
  skillProficiencies: ['arcana', 'history'],
  toolProficiency: {
    kind: 'fixed',
    toolId: 'calligraphers-supplies',
    label: "Calligrapher's Supplies",
  },
  equipment: createStandardEquipmentChoice(
    "Quarterstaff, Calligrapher's Supplies, Book (history), Parchment (8 sheets), Robe, 8 GP",
  ),
  choices: [],
}
