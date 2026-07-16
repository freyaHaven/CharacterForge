import type { SubclassDefinition } from '../../../../domain/class/types'
import { SRD_2024_SOURCE } from '../source'

export const berserkerSrd2024: SubclassDefinition = {
  id: 'srd-2024:path-of-the-berserker',
  classId: 'srd-2024:barbarian',
  editionId: 'srd-2024',
  name: 'Path of the Berserker',
  description:
    'Channel Rage into violent fury, thriving in the chaos of battle.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'path-of-the-berserker',
  features: [
    {
      id: 'berserker-frenzy',
      name: 'Frenzy',
      level: 3,
      description:
        'If you use Reckless Attack while your Rage is active, you deal extra damage to the first target you hit on your turn with a Strength-based attack. To determine the extra damage, roll a number of d6s equal to your Rage Damage bonus, and add them together. The damage has the same type as the weapon or Unarmed Strike used for the attack.',
    },
    {
      id: 'berserker-mindless-rage',
      name: 'Mindless Rage',
      level: 6,
      description:
        'You have Immunity to the Charmed and Frightened conditions while your Rage is active. If you\'re Charmed or Frightened when you enter your Rage, the condition ends on you.',
    },
    {
      id: 'berserker-retaliation',
      name: 'Retaliation',
      level: 10,
      description:
        'When you take damage from a creature that is within 5 feet of you, you can take a Reaction to make one melee attack against that creature, using a weapon or an Unarmed Strike.',
    },
    {
      id: 'berserker-intimidating-presence',
      name: 'Intimidating Presence',
      level: 14,
      description:
        'As a Bonus Action, you can strike terror into others with your menacing presence and primal power. When you do so, each creature of your choice in a 30-foot Emanation originating from you must make a Wisdom saving throw (DC 8 plus your Strength modifier and Proficiency Bonus). On a failed save, a creature has the Frightened condition for 1 minute. At the end of each of the Frightened creature\'s turns, the creature repeats the save, ending the effect on itself on a success.\nOnce you use this feature, you can\'t use it again until you finish a Long Rest unless you expend a use of your Rage (no action required) to restore your use of it.',
    },
  ],
}
