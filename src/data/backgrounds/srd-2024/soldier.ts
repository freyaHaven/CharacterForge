import type { BackgroundDefinition } from '../../../domain/background/types'
import { createGamingSetOptions } from '../../../domain/tools/types'
import { SRD_2024_SOURCE } from '../../content/srd-2024/source'
import { createStandardEquipmentChoice } from './equipment'

export const soldierSrd2024: BackgroundDefinition = {
  id: 'srd-2024:soldier',
  editionId: 'srd-2024',
  name: 'Soldier',
  description:
    'War has been your life for as long as you care to remember, and you are skilled in martial discipline.',
  source: SRD_2024_SOURCE,
  eligibleAbilityScores: ['strength', 'dexterity', 'constitution'],
  originFeat: {
    id: 'savage-attacker',
    name: 'Savage Attacker',
    description:
      'Once per turn when you hit with a weapon attack, you can roll the weapon’s damage dice twice and use either total.',
  },
  skillProficiencies: ['athletics', 'intimidation'],
  toolProficiency: {
    kind: 'choice',
    choiceId: 'gaming-set',
    prompt: 'Choose a Gaming Set',
    options: createGamingSetOptions(),
  },
  equipment: createStandardEquipmentChoice(
    "Spear, Shortbow, 20 Arrows, Gaming Set (same as above), Healer's Kit, Quiver, Traveler's Clothes, 14 GP",
  ),
  choices: [],
}
