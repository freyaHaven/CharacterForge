import type { BackgroundDefinition } from '../../../../domain/background/types'
import { createBackgroundStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { SRD_2024_SOURCE } from '../source'
import { SAGE_PACKAGE } from '../equipment/packages'

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
    featId: 'srd-2024:magic-initiate-wizard',
    name: 'Magic Initiate (Wizard)',
    description:
      'You learn two cantrips and one 1st-level spell from the Wizard spell list. Configure spell selections on the Spells step.',
  },
  skillProficiencies: ['arcana', 'history'],
  toolProficiency: {
    kind: 'fixed',
    toolId: 'calligraphers-supplies',
    label: "Calligrapher's Supplies",
  },
  equipment: createBackgroundStartingEquipment(SAGE_PACKAGE),
  choices: [],
}
