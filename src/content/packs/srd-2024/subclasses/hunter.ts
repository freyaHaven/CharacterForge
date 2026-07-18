import type { SubclassDefinition } from '../../../../domain/class/types'
import { SRD_2024_SOURCE } from '../source'

export const hunterSrd2024: SubclassDefinition = {
  id: 'srd-2024:hunter',
  classId: 'srd-2024:ranger',
  editionId: 'srd-2024',
  name: 'Hunter',
  description:
    'Protect nature and people from destruction. You stalk prey in the wilds and elsewhere, using your abilities as a Hunter to protect nature and people everywhere from forces that would destroy them.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'hunter',
  features: [
    {
      id: 'hunter-hunters-lore',
      name: "Hunter's Lore",
      level: 3,
      description:
        "You can call on the forces of nature to reveal certain strengths and weaknesses of your prey. While a creature is marked by your Hunter's Mark, you know whether that creature has any Immunities, Resistances, or Vulnerabilities, and if the creature has any, you know what they are.",
    },
    {
      id: 'hunter-hunters-prey',
      name: "Hunter's Prey",
      level: 3,
      description:
        'You gain one of the following feature options of your choice. Whenever you finish a Short or Long Rest, you can replace the chosen option with the other one.\nColossus Slayer. Your tenacity can wear down even the most resilient foes. When you hit a creature with a weapon, the weapon deals an extra 1d8 damage to the target if it\'s missing any of its Hit Points. You can deal this extra damage only once per turn.\nHorde Breaker. Once on each of your turns when you make an attack with a weapon, you can make another attack with the same weapon against a different creature that is within 5 feet of the original target, that is within the weapon\'s range, and that you haven\'t attacked this turn.',
    },
    {
      id: 'hunter-defensive-tactics',
      name: 'Defensive Tactics',
      level: 7,
      description:
        'You gain one of the following feature options of your choice. Whenever you finish a Short or Long Rest, you can replace the chosen option with the other one.\nEscape the Horde. Opportunity Attacks have Disadvantage against you.\nMultiattack Defense. When a creature hits you with an attack roll, that creature has Disadvantage on all other attack rolls against you this turn.',
    },
    {
      id: 'hunter-superior-hunters-prey',
      name: "Superior Hunter's Prey",
      level: 11,
      description:
        "Once per turn when you deal damage to a creature marked by your Hunter's Mark, you can also deal that spell's extra damage to a different creature that you can see within 30 feet of the first creature.",
    },
    {
      id: 'hunter-superior-hunters-defense',
      name: "Superior Hunter's Defense",
      level: 15,
      description:
        'When you take damage, you can take a Reaction to give yourself Resistance to that damage and any other damage of the same type until the end of the current turn.',
    },
  ],
}
