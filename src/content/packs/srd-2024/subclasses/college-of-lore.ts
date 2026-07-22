import type { SubclassDefinition } from '../../../../domain/class/types'
import { magicalDiscoveriesEntitlement } from '../spellcasting/bard'
import { SRD_2024_SOURCE } from '../source'

export const collegeOfLoreSrd2024: SubclassDefinition = {
  id: 'srd-2024:college-of-lore',
  classId: 'srd-2024:bard',
  editionId: 'srd-2024',
  name: 'College of Lore',
  description:
    'Bards of the College of Lore know something about most things, collecting bits of lore from obscure sources. Whether scholars, entertainers, or scoundrels, these bards use their gifts to uncover secrets and share them with the world.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'college-of-lore',
  features: [
    {
      id: 'bonus-proficiencies',
      name: 'Bonus Proficiencies',
      level: 3,
      description:
        'You gain proficiency with three skills of your choice. Choose the skills for this feature when you gain it.',
    },
    {
      id: 'cutting-words',
      name: 'Cutting Words',
      level: 3,
      description:
        'You learn to use your wit to supernaturally distract, confuse, and otherwise sap the confidence and competence of others. When a creature that you can see within 60 feet of yourself makes a damage roll or succeeds on an ability check or attack roll, you can take a Reaction to expend one use of your Bardic Inspiration; roll your Bardic Inspiration die, and subtract the number rolled from the creature\'s roll, reducing the damage or potentially turning the success into a failure.',
    },
    {
      id: 'magical-discoveries',
      name: 'Magical Discoveries',
      level: 6,
      description:
        'You learn two spells of your choice. These spells can come from the Cleric, Druid, or Wizard spell list or any combination thereof. A spell you choose must be a cantrip or a spell for which you have spell slots, as shown in the Bard Features table. You always have the chosen spells prepared, and whenever you gain a Bard level, you can replace one of the spells with another spell that meets these requirements.',
      spellEntitlements: [magicalDiscoveriesEntitlement],
    },
    {
      id: 'peerless-skill',
      name: 'Peerless Skill',
      level: 14,
      description:
        'When you make an ability check or attack roll and fail, you can expend one use of Bardic Inspiration; roll the Bardic Inspiration die, and add the number rolled to the d20, potentially turning a failure into a success. On a failure, the Bardic Inspiration isn\'t expended.',
    },
  ],
}
