import type { SubclassDefinition } from '../../../../domain/class/types'
import { SRD_2024_SOURCE } from '../source'
import {
  createEvocationSavantSlotEntitlements,
  evocationSavantInitialEntitlement,
} from '../spellcasting/wizard'

export const evokerSrd2024: SubclassDefinition = {
  id: 'srd-2024:evoker',
  classId: 'srd-2024:wizard',
  editionId: 'srd-2024',
  name: 'Evoker',
  description:
    'Your studies focus on magic that creates powerful elemental effects such as bitter cold, searing flame, rolling thunder, crackling lightning, and burning acid.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'evoker',
  features: [
    {
      id: 'evocation-savant',
      name: 'Evocation Savant',
      level: 3,
      description:
        'Choose two Wizard spells from the Evocation school, each of which must be no higher than level 2, and add them to your spellbook for free.\nIn addition, whenever you gain access to a new level of spell slots in this class, you can add one Wizard spell from the Evocation school to your spellbook for free. The chosen spell must be of a level for which you have spell slots.',
      spellEntitlements: [
        evocationSavantInitialEntitlement,
        ...createEvocationSavantSlotEntitlements(),
      ],
    },
    {
      id: 'potent-cantrip',
      name: 'Potent Cantrip',
      level: 3,
      description:
        "Your damaging cantrips affect even creatures that avoid the brunt of the effect. When a creature succeeds on a saving throw against your cantrip or when a cantrip's attack misses a creature, the creature takes half the cantrip's damage (if any) but suffers no additional effect from the cantrip.",
    },
    {
      id: 'sculpt-spells',
      name: 'Sculpt Spells',
      level: 6,
      description:
        'You can create pockets of relative safety within the effects of your Evocation spells. When you cast an Evocation spell that affects other creatures that you can see, you can choose a number of them equal to 1 plus the spell\'s level. The chosen creatures automatically succeed on their saving throws against the spell, and they take no damage if they would normally take half damage on a successful save.',
    },
    {
      id: 'empowered-evocation',
      name: 'Empowered Evocation',
      level: 10,
      description:
        'Whenever you cast a Wizard spell from the Evocation school, you can add your Intelligence modifier to one damage roll of that spell.',
    },
    {
      id: 'overchannel',
      name: 'Overchannel',
      level: 14,
      description:
        'You can increase the power of your spells. When you cast a Wizard spell of levels 1–5 with a spell slot and the spell deals damage, you can deal maximum damage with that spell on its initial damage roll.\nThe first time you do so, you suffer no adverse effect. If you use this feature again before you finish a Long Rest, you take 2d12 Necrotic damage for each level of the spell immediately after you cast it. This damage ignores Resistance and Immunity, and it increases by 1d12 for each use of this feature before you finish a Long Rest.',
    },
  ],
}
