import type { BackgroundDefinition } from '../../../domain/background/types'
import { SRD_2024_SOURCE } from '../../content/srd-2024/source'
import { createStandardEquipmentChoice } from './equipment'

export const criminalSrd2024: BackgroundDefinition = {
  id: 'srd-2024:criminal',
  editionId: 'srd-2024',
  name: 'Criminal',
  description:
    'You honed your skills in the shadows, surviving by your wit and agility.',
  source: SRD_2024_SOURCE,
  eligibleAbilityScores: ['dexterity', 'constitution', 'intelligence'],
  originFeat: {
    id: 'alert',
    featId: 'srd-2024:alert',
    name: 'Alert',
    description:
      'You gain a +2 bonus to Initiative rolls and cannot be Surprised while conscious.',
  },
  skillProficiencies: ['sleight-of-hand', 'stealth'],
  toolProficiency: {
    kind: 'fixed',
    toolId: 'thieves-tools',
    label: "Thieves' Tools",
  },
  equipment: createStandardEquipmentChoice(
    "2 Daggers, Thieves' Tools, Crowbar, 2 Pouches, Traveler's Clothes, 16 GP",
  ),
  choices: [],
}
