import type { BackgroundDefinition } from '../../../domain/background/types'
import { SRD_2024_SOURCE } from '../../content/srd-2024/source'
import { createStandardEquipmentChoice } from './equipment'

export const acolyteSrd2024: BackgroundDefinition = {
  id: 'srd-2024:acolyte',
  editionId: 'srd-2024',
  name: 'Acolyte',
  description:
    'You spent your life in service to a temple, learning the rites and ceremonies of your faith.',
  source: SRD_2024_SOURCE,
  eligibleAbilityScores: ['intelligence', 'wisdom', 'charisma'],
  originFeat: {
    id: 'magic-initiate-cleric',
    name: 'Magic Initiate (Cleric)',
    description:
      'You learn two cantrips and one 1st-level spell from the Cleric spell list. Spell selection will be configured in a later step.',
    magicInitiateClass: 'cleric',
  },
  skillProficiencies: ['insight', 'religion'],
  toolProficiency: {
    kind: 'fixed',
    toolId: 'calligraphers-supplies',
    label: "Calligrapher's Supplies",
  },
  equipment: createStandardEquipmentChoice(
    "Calligrapher's Supplies, Book (prayers), Holy Symbol, Parchment (10 sheets), Robe, 8 GP",
  ),
  choices: [],
}
