import type { BackgroundDefinition } from '../../../../domain/background/types'
import { createBackgroundStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { createGamingSetOptions } from '../../../../domain/tools/types'
import { SRD_2024_SOURCE } from '../source'
import { SOLDIER_PACKAGE } from '../equipment/packages'

export const soldierSrd2024: BackgroundDefinition = {
  id: 'srd-2024:soldier',
  editionId: 'srd-2024',
  name: 'Soldier',
  description:
    'War has been your life for as long as you can remember, and you are skilled in martial discipline.',
  source: SRD_2024_SOURCE,
  eligibleAbilityScores: ['strength', 'dexterity', 'constitution'],
  originFeat: {
    id: 'savage-attacker',
    featId: 'srd-2024:savage-attacker',
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
  equipment: createBackgroundStartingEquipment(SOLDIER_PACKAGE, {
    packageEntitlements: [
      {
        type: 'choose-items',
        id: 'gaming-set',
        label: 'Choose a Gaming Set',
        count: 1,
        catalogueFilter: { kind: 'tags', tags: ['gaming-set'] },
      },
    ],
  }),
  choices: [],
}
