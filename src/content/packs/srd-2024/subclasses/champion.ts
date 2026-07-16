import type { SubclassDefinition } from '../../../../domain/class/types'
import { SRD_2024_SOURCE } from '../source'

export const championSrd2024: SubclassDefinition = {
  id: 'srd-2024:champion',
  classId: 'srd-2024:fighter',
  editionId: 'srd-2024',
  name: 'Champion',
  description:
    'Pursue physical excellence in combat through relentless training and devastating blows.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'champion',
  features: [
    {
      id: 'champion-improved-critical',
      name: 'Improved Critical',
      level: 3,
      description:
        'Your attack rolls with weapons and Unarmed Strikes can score a Critical Hit on a roll of 19 or 20 on the d20.',
    },
    {
      id: 'champion-remarkable-athlete',
      name: 'Remarkable Athlete',
      level: 3,
      description:
        'Thanks to your athleticism, you have Advantage on Initiative rolls and Strength (Athletics) checks.\nIn addition, immediately after you score a Critical Hit, you can move up to half your Speed without provoking Opportunity Attacks.',
    },
    {
      id: 'champion-additional-fighting-style',
      name: 'Additional Fighting Style',
      level: 7,
      description: 'You gain another Fighting Style feat of your choice.',
    },
    {
      id: 'champion-heroic-warrior',
      name: 'Heroic Warrior',
      level: 10,
      description:
        'The thrill of battle drives you toward victory. During combat, you can give yourself Heroic Inspiration whenever you start your turn without it.',
    },
    {
      id: 'champion-superior-critical',
      name: 'Superior Critical',
      level: 15,
      description:
        'Your attack rolls with weapons and Unarmed Strikes can now score a Critical Hit on a roll of 18–20 on the d20.',
    },
    {
      id: 'champion-survivor',
      name: 'Survivor',
      level: 18,
      description:
        'You attain the pinnacle of resilience in battle, giving you these benefits.\nDefy Death. You have Advantage on Death Saving Throws. Moreover, when you roll 18–20 on a Death Saving Throw, you gain the benefit of rolling a 20 on it.\nHeroic Rally. At the start of each of your turns, you regain Hit Points equal to 5 plus your Constitution modifier if you are Bloodied and have at least 1 Hit Point.',
    },
  ],
}
