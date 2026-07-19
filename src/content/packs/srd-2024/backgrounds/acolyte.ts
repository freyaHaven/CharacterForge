import type { BackgroundDefinition } from '../../../../domain/background/types'
import { createBackgroundStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { SRD_2024_SOURCE } from '../source'
import { ACOLYTE_PACKAGE } from '../equipment/packages'

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
    featId: 'srd-2024:magic-initiate-cleric',
    name: 'Magic Initiate (Cleric)',
    description:
      'You learn two cantrips and one 1st-level spell from the Cleric spell list. Configure spell selections on the Spells step.',
  },
  skillProficiencies: ['insight', 'religion'],
  toolProficiency: {
    kind: 'fixed',
    toolId: 'calligraphers-supplies',
    label: "Calligrapher's Supplies",
  },
  equipment: createBackgroundStartingEquipment(ACOLYTE_PACKAGE),
  choices: [],
}
