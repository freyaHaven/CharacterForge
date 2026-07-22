import type { SubclassDefinition } from '../../../../domain/class/types'
import { SRD_2024_SOURCE } from '../source'

export const draconicSorcerySrd2024: SubclassDefinition = {
  id: 'srd-2024:draconic-sorcery',
  classId: 'srd-2024:sorcerer',
  editionId: 'srd-2024',
  name: 'Draconic Sorcery',
  description:
    'Your innate magic comes from the gift of a dragon. Perhaps an ancient dragon facing death bequeathed some of its magical power to you or your ancestor. You might have absorbed magic from a site infused with draconic power, or you claim a dragon as an ancestor.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'draconic-sorcery',
  features: [
    {
      id: 'draconic-resilience',
      name: 'Draconic Resilience',
      level: 3,
      description:
        'The magic in your body manifests physical traits of your draconic gift. Your Hit Point maximum increases by 3, and it increases by 1 whenever you gain another Sorcerer level.\nParts of you are also covered by dragon-like scales. While you aren\'t wearing armor, you can calculate your base Armor Class as 10 plus your Dexterity and Charisma modifiers.',
      effects: [
        {
          kind: 'hit-point-maximum-per-class-level',
          amount: 1,
        },
        {
          kind: 'unarmored-defense',
          abilities: ['dexterity', 'charisma'],
        },
      ],
    },
    {
      id: 'draconic-spells',
      name: 'Draconic Spells',
      level: 3,
      description:
        'When you reach a Sorcerer level specified in the Draconic Spells table, you thereafter always have the listed spells prepared.\n3rd: Alter Self, Chromatic Orb, Command, Dragon\'s Breath\n5th: Fear, Fly\n7th: Arcane Eye, Charm Monster\n9th: Legend Lore, Summon Dragon',
      spellEntitlements: [
        {
          id: 'draconic-spells',
          kind: 'granted',
          countsAgainstLimit: false,
          appliesTo: 'prepared',
          spells: [
            { spellId: 'srd-2024:alter-self', minLevel: 3 },
            { spellId: 'srd-2024:chromatic-orb', minLevel: 3 },
            { spellId: 'srd-2024:command', minLevel: 3 },
            { spellId: 'srd-2024:dragons-breath', minLevel: 3 },
            { spellId: 'srd-2024:fear', minLevel: 5 },
            { spellId: 'srd-2024:fly', minLevel: 5 },
            { spellId: 'srd-2024:arcane-eye', minLevel: 7 },
            { spellId: 'srd-2024:charm-monster', minLevel: 7 },
            { spellId: 'srd-2024:legend-lore', minLevel: 9 },
            { spellId: 'srd-2024:summon-dragon', minLevel: 9 },
          ],
        },
      ],
    },
    {
      id: 'elemental-affinity',
      name: 'Elemental Affinity',
      level: 6,
      description:
        'Your draconic magic has an affinity with a damage type associated with dragons. Choose one of those types: Acid, Cold, Fire, Lightning, or Poison. You have Resistance to that damage type, and when you cast a spell that deals damage of that type, you can add your Charisma modifier to one damage roll of that spell.',
    },
    {
      id: 'dragon-wings',
      name: 'Dragon Wings',
      level: 14,
      description:
        'As a Bonus Action, you can cause draconic wings to appear on your back. The wings last for 1 hour or until you dismiss them (no action required). For the duration, you have a Fly Speed of 60 feet.\nOnce you use this feature, you can\'t use it again until you finish a Long Rest unless you spend 3 Sorcery Points (no action required) to restore your use of it.\nCharacter Forge records this feature only — it does not track flight activation or Sorcery Point spends during play.',
    },
    {
      id: 'dragon-companion',
      name: 'Dragon Companion',
      level: 18,
      description:
        'You can call forth a spectral dragon companion. You always have the Summon Dragon spell prepared, and casting it doesn\'t require a Material component. In addition, you can cast the spell once without expending a spell slot, and you regain the ability to do so when you finish a Long Rest.\nWhenever you start casting the spell, you can modify it so that it doesn\'t require Concentration. If you do so, the spell\'s duration becomes 1 minute for that casting.\nCharacter Forge records this feature only — Summon Dragon is already always prepared from Draconic Spells (level 9). Play-time casting and concentration waivers are not tracked.',
    },
  ],
}
