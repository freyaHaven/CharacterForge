import type { SubclassDefinition } from '../../../../domain/class/types'
import { SRD_2024_SOURCE } from '../source'

export const openHandSrd2024: SubclassDefinition = {
  id: 'srd-2024:warrior-of-the-open-hand',
  classId: 'srd-2024:monk',
  editionId: 'srd-2024',
  name: 'Warrior of the Open Hand',
  description:
    'Master unarmed combat techniques — push, trip, and protect yourself by manipulating your own energy.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'warrior-of-the-open-hand',
  features: [
    {
      id: 'open-hand-technique',
      name: 'Open Hand Technique',
      level: 3,
      description:
        'Whenever you hit a creature with an attack granted by your Flurry of Blows, you can impose one of the following effects on that target.\nAddle. The target can\'t make Opportunity Attacks until the start of its next turn.\nPush. The target must succeed on a Strength saving throw or be pushed up to 15 feet away from you.\nTopple. The target must succeed on a Dexterity saving throw or have the Prone condition.',
    },
    {
      id: 'open-hand-wholeness-of-body',
      name: 'Wholeness of Body',
      level: 6,
      description:
        'You gain the ability to heal yourself. As a Bonus Action, you can roll your Martial Arts die. You regain a number of Hit Points equal to the number rolled plus your Wisdom modifier (minimum of 1 Hit Point regained).\nYou can use this feature a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.',
    },
    {
      id: 'open-hand-fleet-step',
      name: 'Fleet Step',
      level: 11,
      description:
        'When you take a Bonus Action other than Step of the Wind, you can also use Step of the Wind immediately after that Bonus Action.',
    },
    {
      id: 'open-hand-quivering-palm',
      name: 'Quivering Palm',
      level: 17,
      description:
        'You gain the ability to set up lethal vibrations in someone\'s body. When you hit a creature with an Unarmed Strike, you can expend 4 Focus Points to start these imperceptible vibrations, which last for a number of days equal to your Monk level. The vibrations are harmless unless you take an action to end them. Alternatively, when you take the Attack action on your turn, you can forgo one of the attacks to end the vibrations. To end them, you and the target must be on the same plane of existence. When you end them, the target must make a Constitution saving throw, taking 10d12 Force damage on a failed save or half as much damage on a successful one.\nYou can have only one creature under the effect of this feature at a time. You can end the vibrations harmlessly (no action required).',
    },
  ],
}
