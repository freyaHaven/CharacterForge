import type { SubclassDefinition } from '../../../../domain/class/types'
import { SRD_2024_SOURCE } from '../source'

export const devotionSrd2024: SubclassDefinition = {
  id: 'srd-2024:oath-of-devotion',
  classId: 'srd-2024:paladin',
  editionId: 'srd-2024',
  name: 'Oath of Devotion',
  description:
    'Uphold the ideals of justice and order — the archetype of the knight in shining armor.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'oath-of-devotion',
  features: [
    {
      id: 'devotion-oath-spells',
      name: 'Oath of Devotion Spells',
      level: 3,
      description:
        'The magic of your oath ensures you always have certain spells ready; when you reach a Paladin level specified in the Oath of Devotion Spells table, you thereafter always have the listed spells prepared.\n3rd: Protection from Evil and Good, Shield of Faith\n5th: Aid, Zone of Truth\n9th: Beacon of Hope, Dispel Magic\n13th: Freedom of Movement, Guardian of Faith\n17th: Commune, Flame Strike',
    },
    {
      id: 'devotion-sacred-weapon',
      name: 'Sacred Weapon',
      level: 3,
      description:
        'When you take the Attack action, you can expend one use of your Channel Divinity to imbue one Melee weapon that you are holding with positive energy. For 10 minutes or until you use this feature again, you add your Charisma modifier to attack rolls you make with that weapon (minimum bonus of +1), and each time you hit with it, you cause it to deal its normal damage type or Radiant damage.\nThe weapon also emits Bright Light in a 20-foot radius and Dim Light 20 feet beyond that.\nYou can end this effect early (no action required). This effect also ends if you aren\'t carrying the weapon.',
    },
    {
      id: 'devotion-aura-of-devotion',
      name: 'Aura of Devotion',
      level: 7,
      description:
        'You and your allies have Immunity to the Charmed condition while in your Aura of Protection. If a Charmed ally enters the aura, that condition has no effect on that ally while there.',
    },
    {
      id: 'devotion-smite-of-protection',
      name: 'Smite of Protection',
      level: 15,
      description:
        'Your magical smite now radiates protective energy. Whenever you cast Divine Smite, you and your allies have Half Cover while in your Aura of Protection. The aura has this benefit until the start of your next turn.',
    },
    {
      id: 'devotion-holy-nimbus',
      name: 'Holy Nimbus',
      level: 20,
      description:
        'As a Bonus Action, you can imbue your Aura of Protection with holy power, granting the benefits below for 10 minutes or until you end them (no action required). Once you use this feature, you can\'t use it again until you finish a Long Rest. You can also restore your use of it by expending a level 5 spell slot (no action required).\nHoly Ward. You have Advantage on any saving throw you are forced to make by a Fiend or an Undead.\nRadiant Damage. Whenever an enemy starts its turn in the aura, that creature takes Radiant damage equal to your Charisma modifier plus your Proficiency Bonus.\nSunlight. The aura is filled with Bright Light that is sunlight.',
    },
  ],
}
