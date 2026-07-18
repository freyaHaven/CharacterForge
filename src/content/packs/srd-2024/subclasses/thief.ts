import type { SubclassDefinition } from '../../../../domain/class/types'
import { SRD_2024_SOURCE } from '../source'

export const thiefSrd2024: SubclassDefinition = {
  id: 'srd-2024:thief',
  classId: 'srd-2024:rogue',
  editionId: 'srd-2024',
  name: 'Thief',
  description:
    'Hunt for treasure as a classic adventurer — burglar, treasure hunter, and explorer.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'thief',
  features: [
    {
      id: 'thief-fast-hands',
      name: 'Fast Hands',
      level: 3,
      description:
        'As a Bonus Action, you can do one of the following.\nSleight of Hand. Make a Dexterity (Sleight of Hand) check to pick a lock or disarm a trap with Thieves\' Tools or to pick a pocket.\nUse an Object. Take the Utilize action, or take the Magic action to use a magic item that requires that action.',
    },
    {
      id: 'thief-second-story-work',
      name: 'Second-Story Work',
      level: 3,
      description:
        'You\'ve trained to get into especially hard-to-reach places, granting you these benefits.\nClimber. You gain a Climb Speed equal to your Speed.\nJumper. You can determine your jump distance using your Dexterity rather than your Strength.',
    },
    {
      id: 'thief-supreme-sneak',
      name: 'Supreme Sneak',
      level: 9,
      description:
        'You gain the following Cunning Strike option.\nStealth Attack (Cost: 1d6). If you have the Hide action\'s Invisible condition, this attack doesn\'t end that condition on you if you end the turn behind Three-Quarters Cover or Total Cover.',
    },
    {
      id: 'thief-use-magic-device',
      name: 'Use Magic Device',
      level: 13,
      description:
        'You\'ve learned how to maximize use of magic items, granting you the following benefits.\nAttunement. You can attune to up to four magic items at once.\nCharges. Whenever you use a magic item property that expends charges, roll 1d6. On a roll of 6, you use the property without expending the charges.\nScrolls. You can use any Spell Scroll, using Intelligence as your spellcasting ability for the spell. If the spell is a cantrip or a level 1 spell, you can cast it reliably. If the scroll contains a higher-level spell, you must first succeed on an Intelligence (Arcana) check (DC 10 plus the spell\'s level). On a successful check, you cast the spell from the scroll. On a failed check, the scroll disintegrates.',
    },
    {
      id: 'thief-thiefs-reflexes',
      name: 'Thief\'s Reflexes',
      level: 17,
      description:
        'You are adept at laying ambushes and quickly escaping danger. You can take two turns during the first round of any combat. You take your first turn at your normal Initiative and your second turn at your Initiative minus 10.',
    },
  ],
}
