import type { SubclassDefinition } from '../../../../domain/class/types'
import { SRD_2024_SOURCE } from '../source'

export const lifeDomainSrd2024: SubclassDefinition = {
  id: 'srd-2024:life-domain',
  classId: 'srd-2024:cleric',
  editionId: 'srd-2024',
  name: 'Life Domain',
  description:
    'Soothe the hurts of the world. The Life Domain focuses on the positive energy that helps sustain all life in the multiverse. Clerics who tap into this domain are masters of healing.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'life-domain',
  features: [
    {
      id: 'life-disciple-of-life',
      name: 'Disciple of Life',
      level: 3,
      description:
        "When a spell you cast with a spell slot restores Hit Points to a creature, that creature regains additional Hit Points on the turn you cast the spell. The additional Hit Points equal 2 plus the spell slot's level.",
    },
    {
      id: 'life-domain-spells',
      name: 'Life Domain Spells',
      level: 3,
      description:
        'Your connection to this divine domain ensures you always have certain spells ready. When you reach a Cleric level specified in the Life Domain Spells table, you thereafter always have the listed spells prepared.\n3rd: Aid, Bless, Cure Wounds, Lesser Restoration\n5th: Mass Healing Word, Revivify\n7th: Aura of Life, Death Ward\n9th: Greater Restoration, Mass Cure Wounds',
      spellEntitlements: [
        {
          id: 'domain-spells',
          kind: 'granted',
          countsAgainstLimit: false,
          appliesTo: 'prepared',
          spells: [
            { spellId: 'srd-2024:aid', minLevel: 3 },
            { spellId: 'srd-2024:bless', minLevel: 3 },
            { spellId: 'srd-2024:cure-wounds', minLevel: 3 },
            { spellId: 'srd-2024:lesser-restoration', minLevel: 3 },
            { spellId: 'srd-2024:mass-healing-word', minLevel: 5 },
            { spellId: 'srd-2024:revivify', minLevel: 5 },
            { spellId: 'srd-2024:aura-of-life', minLevel: 7 },
            { spellId: 'srd-2024:death-ward', minLevel: 7 },
            { spellId: 'srd-2024:greater-restoration', minLevel: 9 },
            { spellId: 'srd-2024:mass-cure-wounds', minLevel: 9 },
          ],
        },
      ],
    },
    {
      id: 'life-preserve-life',
      name: 'Preserve Life',
      level: 3,
      description:
        'As a Magic action, you present your Holy Symbol and expend a use of your Channel Divinity to evoke healing energy that can restore a number of Hit Points equal to five times your Cleric level. Choose Bloodied creatures within 30 feet of yourself (which can include you), and divide those Hit Points among them. This feature can restore a creature to no more than half its Hit Point maximum.',
    },
    {
      id: 'life-blessed-healer',
      name: 'Blessed Healer',
      level: 6,
      description:
        "The healing spells you cast on others heal you as well. Immediately after you cast a spell with a spell slot that restores Hit Points to one or more creatures other than yourself, you regain Hit Points equal to 2 plus the spell slot's level.",
    },
    {
      id: 'life-supreme-healing',
      name: 'Supreme Healing',
      level: 17,
      description:
        "When you would normally roll one or more dice to restore Hit Points to a creature with a spell or Channel Divinity, don't roll those dice for the healing; instead use the highest number possible for each die. For example, instead of restoring 2d6 Hit Points to a creature with a spell, you restore 12.",
    },
  ],
}
