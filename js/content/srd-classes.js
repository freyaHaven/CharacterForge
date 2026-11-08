/*
 * SRD 5.2 classes — level 1 data (higher levels are added later in the same shape).
 * Includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, CC-BY-4.0.
 *
 * Class fields used by the builder and rules engine:
 *   pitch / complexity (1-3) / primary / style tags  → plain-language cards for new players
 *   skillChoices {count, from:[…]|'any'}, toolChoice, tools, armor, weapons, weaponMasteries
 *   unarmoredDefense: ability added to 10 + DEX when wearing no armor
 *   choices: extra picks at level 1 (fighting style, divine order…)
 *   spellcasting {ability, list, cantrips[], prepared[], slots[][], pact}
 *   resources: limited uses ({uses:[…]} per level, or usesMod: ability modifier, or pool: n × level)
 *   features[].action: shows the feature in the Actions tab ({time, resource, rolls})
 *   equipment: starting equipment options; items are [itemId, quantity]
 */
(function () {
  'use strict';
  var FULL_SLOTS = [[2], [3], [4, 2], [4, 3], [4, 3, 2]];
  var HALF_SLOTS = [[2], [2], [3], [3], [4, 2]];
  CF.content.extendPack('srd-5.2', {
    classes: [
      {
        id: 'barbarian', name: 'Barbarian', hitDie: 12, primary: ['str'], complexity: 1, style: ['close'],
        pitch: 'A furious warrior who shrugs off blows and hits back harder.',
        detail: 'Rage turns you into the toughest thing on the battlefield. Simple to play and very forgiving.',
        saves: ['str', 'con'], armor: ['light', 'medium', 'shield'], weapons: ['simple', 'martial'], weaponMasteries: 2,
        skillChoices: { count: 2, from: ['animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'] },
        unarmoredDefense: 'con',
        resources: [{ id: 'rage', name: 'Rage', recharge: 'long', shortRest: 1, uses: [2, 2, 3, 3, 3] }],
        features: [
          { level: 1, name: 'Rage', text: 'As a Bonus Action, enter a Rage for up to 10 minutes if you aren’t wearing Heavy armor. While raging you have Resistance to Bludgeoning, Piercing and Slashing damage, +2 damage with STR weapon attacks, and Advantage on STR checks and saves. You can’t cast or concentrate on spells. You regain one use on a Short Rest and all on a Long Rest.',
            action: { time: 'Bonus Action', resource: 'rage' } },
          { level: 1, name: 'Unarmored Defense', text: 'While you aren’t wearing armor, your AC equals 10 + DEX modifier + CON modifier. You can still use a Shield.' },
          { level: 1, name: 'Weapon Mastery', text: 'You can use the mastery properties of two kinds of Simple or Martial Melee weapons. You can change one choice after a Long Rest.' }
        ],
        equipment: { A: { items: [['greataxe', 1], ['handaxe', 4], ['explorers-pack', 1]], gp: 15 }, B: { items: [], gp: 75 } }
      },
      {
        id: 'bard', name: 'Bard', hitDie: 8, primary: ['cha'], complexity: 2, style: ['magic', 'support'],
        pitch: 'A performer whose music and words are literally magic.',
        detail: 'Inspire friends, charm enemies and patch up wounds. Great if you like talking your way through problems.',
        saves: ['dex', 'cha'], armor: ['light'], weapons: ['simple'],
        skillChoices: { count: 3, from: 'any' }, toolChoice: { count: 3, group: 'musical-instrument', label: 'Musical instruments' },
        spellcasting: { ability: 'cha', list: 'bard', cantrips: [2, 2, 2, 3, 3], prepared: [4, 5, 6, 7, 9], slots: FULL_SLOTS },
        resources: [{ id: 'bardic-inspiration', name: 'Bardic Inspiration', recharge: 'long', usesMod: 'cha' }],
        features: [
          { level: 1, name: 'Bardic Inspiration', text: 'As a Bonus Action, inspire a creature within 60 ft who can see or hear you. Once within the next hour, when it fails a d20 test, it can roll a d6 and add it, possibly turning the failure into a success. Uses equal your CHA modifier (minimum 1), regained on a Long Rest.',
            action: { time: 'Bonus Action', resource: 'bardic-inspiration', rolls: [['d6 inspiration', 1, 6, 0]] } },
          { level: 1, name: 'Spellcasting', text: 'You can cast Bard spells, using CHA as your spellcasting ability. A Musical Instrument can be your spellcasting focus.' }
        ],
        equipment: { A: { items: [['leather', 1], ['dagger', 2], ['lute', 1], ['entertainers-pack', 1]], gp: 19 }, B: { items: [], gp: 90 } }
      },
      {
        id: 'cleric', name: 'Cleric', hitDie: 8, primary: ['wis'], complexity: 2, style: ['magic', 'support', 'close'],
        pitch: 'A champion of a god who heals, protects and smites.',
        detail: 'The party healer who can also wear armor and hold the front line.',
        saves: ['wis', 'cha'], armor: ['light', 'medium', 'shield'], weapons: ['simple'],
        skillChoices: { count: 2, from: ['history', 'insight', 'medicine', 'persuasion', 'religion'] },
        spellcasting: { ability: 'wis', list: 'cleric', cantrips: [3, 3, 3, 4, 4], prepared: [4, 5, 6, 7, 9], slots: FULL_SLOTS },
        choices: [{
          id: 'divine-order', name: 'Divine Order', help: 'Pick the role your god gave you.',
          options: [
            { id: 'protector', name: 'Protector', text: 'Trained for battle: you gain proficiency with Martial weapons and Heavy armor.', grants: { armor: ['heavy'], weapons: ['martial'] } },
            { id: 'thaumaturge', name: 'Thaumaturge', text: 'You know one extra cantrip, and add your WIS modifier (minimum +1) to INT (Arcana or Religion) checks.', grants: { extraCantrips: 1, checkBonus: { skills: ['arcana', 'religion'], mod: 'wis' } } }
          ]
        }],
        features: [
          { level: 1, name: 'Spellcasting', text: 'You can cast Cleric spells, using WIS as your spellcasting ability. A Holy Symbol can be your spellcasting focus.' },
          { level: 1, name: 'Divine Order', text: 'You dedicate yourself to one of the sacred roles: Protector or Thaumaturge.' }
        ],
        equipment: { A: { items: [['chain-shirt', 1], ['shield', 1], ['mace', 1], ['holy-symbol', 1], ['priests-pack', 1]], gp: 7 }, B: { items: [], gp: 110 } }
      },
      {
        id: 'druid', name: 'Druid', hitDie: 8, primary: ['wis'], complexity: 3, style: ['magic', 'support'],
        pitch: 'A guardian of nature who can later turn into animals.',
        detail: 'Lots of flexible nature spells. Rewarding, but many choices each day.',
        saves: ['int', 'wis'], armor: ['light', 'shield'], weapons: ['simple'], tools: ['herbalism-kit'],
        skillChoices: { count: 2, from: ['arcana', 'animal-handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'] },
        spellcasting: { ability: 'wis', list: 'druid', cantrips: [2, 2, 2, 3, 3], prepared: [4, 5, 6, 7, 9], slots: FULL_SLOTS },
        alwaysPrepared: [{ level: 1, spell: 'speak-with-animals' }],
        languagesGranted: ['druidic'],
        choices: [{
          id: 'primal-order', name: 'Primal Order', help: 'Pick how nature calls you.',
          options: [
            { id: 'magician', name: 'Magician', text: 'You know one extra cantrip, and add your WIS modifier (minimum +1) to INT (Arcana or Nature) checks.', grants: { extraCantrips: 1, checkBonus: { skills: ['arcana', 'nature'], mod: 'wis' } } },
            { id: 'warden', name: 'Warden', text: 'Trained for battle: you gain proficiency with Martial weapons and Medium armor.', grants: { armor: ['medium'], weapons: ['martial'] } }
          ]
        }],
        features: [
          { level: 1, name: 'Spellcasting', text: 'You can cast Druid spells, using WIS as your spellcasting ability. A Druidic Focus can be your spellcasting focus.' },
          { level: 1, name: 'Druidic', text: 'You know Druidic, the secret language of druids, and you always have Speak with Animals prepared.' },
          { level: 1, name: 'Primal Order', text: 'You dedicate yourself to one of the sacred roles: Magician or Warden.' }
        ],
        equipment: { A: { items: [['leather', 1], ['shield', 1], ['sickle', 1], ['quarterstaff', 1], ['explorers-pack', 1], ['herbalism-kit', 1]], gp: 9 }, B: { items: [], gp: 50 } }
      },
      {
        id: 'fighter', name: 'Fighter', hitDie: 10, primary: ['str', 'dex'], complexity: 1, style: ['close', 'ranged'],
        pitch: 'A master of weapons and armor, with sword or bow.',
        detail: 'Reliable, sturdy and straightforward. The classic first character.',
        saves: ['str', 'con'], armor: ['light', 'medium', 'heavy', 'shield'], weapons: ['simple', 'martial'], weaponMasteries: 3,
        skillChoices: { count: 2, from: ['acrobatics', 'animal-handling', 'athletics', 'history', 'insight', 'intimidation', 'persuasion', 'perception', 'survival'] },
        resources: [{ id: 'second-wind', name: 'Second Wind', recharge: 'long', shortRest: 1, uses: [2, 2, 2, 3, 3] }],
        choices: [{
          id: 'fighting-style', name: 'Fighting Style', help: 'Pick the way you like to fight.',
          options: [
            { id: 'archery', name: 'Archery', text: '+2 bonus to attack rolls with Ranged weapons.', grants: { rangedHit: 2 } },
            { id: 'defense', name: 'Defense', text: '+1 bonus to AC while you wear Light, Medium or Heavy armor.', grants: { armoredAC: 1 } },
            { id: 'great-weapon', name: 'Great Weapon Fighting', text: 'When you roll damage for a two-handed or versatile melee weapon held in two hands, treat any 1 or 2 on a damage die as a 3.' },
            { id: 'two-weapon', name: 'Two-Weapon Fighting', text: 'When you make the extra attack of the Light property, add your ability modifier to its damage.', grants: { twfMod: true } }
          ]
        }],
        features: [
          { level: 1, name: 'Fighting Style', text: 'You have honed your martial prowess with a fighting style of your choice.' },
          { level: 1, name: 'Second Wind', text: 'As a Bonus Action, regain HP equal to 1d10 + your Fighter level. You regain one use on a Short Rest and all on a Long Rest.',
            action: { time: 'Bonus Action', resource: 'second-wind', rolls: [['Heal 1d10 + level', 1, 10, 'level']] } },
          { level: 1, name: 'Weapon Mastery', text: 'You can use the mastery properties of three kinds of Simple or Martial weapons. You can change one choice after a Long Rest.' }
        ],
        equipment: {
          A: { items: [['chain-mail', 1], ['greatsword', 1], ['flail', 1], ['javelin', 8], ['dungeoneers-pack', 1]], gp: 4 },
          B: { items: [['studded-leather', 1], ['scimitar', 1], ['shortsword', 1], ['longbow', 1], ['arrows', 20], ['quiver', 1], ['dungeoneers-pack', 1]], gp: 11 },
          C: { items: [], gp: 155 }
        }
      },
      {
        id: 'monk', name: 'Monk', hitDie: 8, primary: ['dex', 'wis'], complexity: 2, style: ['close'],
        pitch: 'A lightning-fast martial artist who fights unarmed.',
        detail: 'Quick, mobile, and hard to pin down. You strike several times a turn.',
        saves: ['str', 'dex'], armor: [], weapons: ['simple', 'martial-light'],
        skillChoices: { count: 2, from: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'] },
        toolChoice: { count: 1, group: 'artisan-or-instrument', label: 'Artisan’s tools or a musical instrument' },
        unarmoredDefense: 'wis', martialArts: { die: 6 },
        features: [
          { level: 1, name: 'Martial Arts', text: 'While unarmed or wielding only Monk weapons and wearing no armor or shield: you can use DEX instead of STR for those attacks, your Unarmed Strikes deal 1d6 damage, and when you take the Attack action you can make one Unarmed Strike as a Bonus Action.',
            action: { time: 'Bonus Action', text: 'One Unarmed Strike after you take the Attack action.', rolls: [['Unarmed Strike', 'unarmed'], ['1d6 + DEX', 1, 6, 'dex']] } },
          { level: 1, name: 'Unarmored Defense', text: 'While you wear no armor and no shield, your AC equals 10 + DEX modifier + WIS modifier.' }
        ],
        equipment: { A: { items: [['spear', 1], ['dagger', 5], ['explorers-pack', 1]], gp: 11 }, B: { items: [], gp: 50 } }
      },
      {
        id: 'paladin', name: 'Paladin', hitDie: 10, primary: ['str', 'cha'], complexity: 2, style: ['close', 'support'],
        pitch: 'A holy knight bound by a sacred oath.',
        detail: 'Heavy armor, big hits and a little healing magic. A natural leader.',
        saves: ['wis', 'cha'], armor: ['light', 'medium', 'heavy', 'shield'], weapons: ['simple', 'martial'], weaponMasteries: 2,
        skillChoices: { count: 2, from: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'] },
        spellcasting: { ability: 'cha', list: 'paladin', cantrips: [0, 0, 0, 0, 0], prepared: [2, 3, 4, 5, 6], slots: HALF_SLOTS },
        resources: [{ id: 'lay-on-hands', name: 'Lay on Hands (HP pool)', recharge: 'long', pool: 5 }],
        features: [
          { level: 1, name: 'Lay on Hands', text: 'You have a pool of healing equal to 5 × your Paladin level. As a Bonus Action, touch a creature and restore HP from the pool, or spend 5 HP from it to remove the Poisoned condition. The pool refills on a Long Rest.',
            action: { time: 'Bonus Action', resource: 'lay-on-hands' } },
          { level: 1, name: 'Spellcasting', text: 'You can cast Paladin spells, using CHA as your spellcasting ability. A Holy Symbol can be your spellcasting focus.' },
          { level: 1, name: 'Weapon Mastery', text: 'You can use the mastery properties of two kinds of weapons. You can change one choice after a Long Rest.' }
        ],
        equipment: { A: { items: [['chain-mail', 1], ['shield', 1], ['longsword', 1], ['javelin', 6], ['holy-symbol', 1], ['priests-pack', 1]], gp: 9 }, B: { items: [], gp: 150 } }
      },
      {
        id: 'ranger', name: 'Ranger', hitDie: 10, primary: ['dex', 'wis'], complexity: 2, style: ['ranged', 'magic'],
        pitch: 'A wilderness hunter with a bow and a few nature spells.',
        detail: 'You track your prey, strike from a distance and keep the party alive in the wild.',
        saves: ['str', 'dex'], armor: ['light', 'medium', 'shield'], weapons: ['simple', 'martial'], weaponMasteries: 2,
        skillChoices: { count: 3, from: ['animal-handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'] },
        spellcasting: { ability: 'wis', list: 'ranger', cantrips: [0, 0, 0, 0, 0], prepared: [2, 3, 4, 5, 6], slots: HALF_SLOTS },
        resources: [{ id: 'favored-enemy', name: "Hunter's Mark (free casts)", spell: 'hunters-mark', recharge: 'long', uses: [2, 2, 2, 2, 3] }],
        alwaysPrepared: [{ level: 1, spell: 'hunters-mark' }],
        features: [
          { level: 1, name: 'Spellcasting', text: 'You can cast Ranger spells, using WIS as your spellcasting ability. A Druidic Focus can be your spellcasting focus.' },
          { level: 1, name: 'Favored Enemy', text: "You always have Hunter's Mark prepared, and you can cast it without a spell slot twice. You regain all uses on a Long Rest." },
          { level: 1, name: 'Weapon Mastery', text: 'You can use the mastery properties of two kinds of weapons you are proficient with. You can change one choice when you finish a Long Rest.' }
        ],
        equipment: { A: { items: [['studded-leather', 1], ['scimitar', 1], ['shortsword', 1], ['longbow', 1], ['arrows', 20], ['quiver', 1], ['sprig-of-mistletoe', 1], ['explorers-pack', 1]], gp: 7 }, B: { items: [], gp: 150 } }
      },
      {
        id: 'rogue', name: 'Rogue', hitDie: 8, primary: ['dex'], complexity: 1, style: ['close', 'ranged'],
        pitch: 'A sneaky expert who strikes where it hurts most.',
        detail: 'Sneak, pick locks, disarm traps and deal big damage when an enemy is distracted.',
        saves: ['dex', 'int'], armor: ['light'], weapons: ['simple', 'martial-finesse-light'], weaponMasteries: 2, tools: ['thieves-tools'],
        skillChoices: { count: 4, from: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'persuasion', 'sleight-of-hand', 'stealth'] },
        expertise: 2, languagesGranted: ['thieves-cant'], sneakAttack: '1d6',
        features: [
          { level: 1, name: 'Expertise', text: 'Choose two of your skill proficiencies. Your proficiency bonus is doubled for checks with them.' },
          { level: 1, name: 'Sneak Attack', text: 'Once per turn, deal an extra 1d6 damage to one creature you hit with a Finesse or Ranged weapon if you have Advantage, or if an ally is within 5 ft of the target and you don’t have Disadvantage.',
            action: { time: 'Other', text: 'Once per turn, on a qualifying hit.', rolls: [['1d6 Sneak Attack', 1, 6, 0]] } },
          { level: 1, name: 'Thieves’ Cant', text: 'You know Thieves’ Cant, a secret mix of jargon and signs, plus one other language.' },
          { level: 1, name: 'Weapon Mastery', text: 'You can use the mastery properties of two kinds of weapons you are proficient with.' }
        ],
        equipment: { A: { items: [['leather', 1], ['dagger', 2], ['shortsword', 1], ['shortbow', 1], ['arrows', 20], ['quiver', 1], ['thieves-tools', 1], ['burglars-pack', 1]], gp: 8 }, B: { items: [], gp: 100 } }
      },
      {
        id: 'sorcerer', name: 'Sorcerer', hitDie: 6, primary: ['cha'], complexity: 2, style: ['magic', 'ranged'],
        pitch: 'Born with raw magic in their blood.',
        detail: 'Fewer spells than a wizard, but powerful and flexible. Later you can bend spells on the fly.',
        saves: ['con', 'cha'], armor: [], weapons: ['simple'],
        skillChoices: { count: 2, from: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'] },
        spellcasting: { ability: 'cha', list: 'sorcerer', cantrips: [4, 4, 4, 5, 5], prepared: [2, 4, 6, 7, 9], slots: FULL_SLOTS },
        resources: [{ id: 'innate-sorcery', name: 'Innate Sorcery', recharge: 'long', uses: [2, 2, 2, 2, 2] }],
        features: [
          { level: 1, name: 'Spellcasting', text: 'You can cast Sorcerer spells, using CHA as your spellcasting ability. An Arcane Focus can be your spellcasting focus.' },
          { level: 1, name: 'Innate Sorcery', text: 'As a Bonus Action, unleash your inner magic for 1 minute: your spell save DC increases by 1 and you have Advantage on attack rolls for Sorcerer spells you cast. Twice per Long Rest.',
            action: { time: 'Bonus Action', resource: 'innate-sorcery' } }
        ],
        equipment: { A: { items: [['spear', 1], ['dagger', 2], ['arcane-focus-crystal', 1], ['dungeoneers-pack', 1]], gp: 28 }, B: { items: [], gp: 50 } }
      },
      {
        id: 'warlock', name: 'Warlock', hitDie: 8, primary: ['cha'], complexity: 2, style: ['magic', 'ranged'],
        pitch: 'Made a pact with a mysterious, powerful patron.',
        detail: 'A strong signature blast and spells that come back on a short rest.',
        saves: ['wis', 'cha'], armor: ['light'], weapons: ['simple'],
        skillChoices: { count: 2, from: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'] },
        spellcasting: { ability: 'cha', list: 'warlock', cantrips: [2, 2, 2, 3, 3], prepared: [2, 3, 4, 5, 6], slots: [[1], [2], [0, 2], [0, 2], [0, 0, 2]], pact: true },
        choices: [{
          id: 'invocation', name: 'Eldritch Invocation', help: 'Pick one gift from your patron.',
          options: [
            { id: 'pact-of-the-blade', name: 'Pact of the Blade', text: 'As a Bonus Action, conjure a pact weapon in your hand, or bond with a magic weapon you touch. You are proficient with it, can use it as a Spellcasting Focus, and can use CHA for its attack and damage rolls.' },
            { id: 'pact-of-the-chain', name: 'Pact of the Chain', text: 'You learn Find Familiar and can cast it as a Magic action without a spell slot. Your familiar can take a special form such as an imp, pseudodragon or sprite.' },
            { id: 'pact-of-the-tome', name: 'Pact of the Tome', text: 'You get a Book of Shadows holding three extra cantrips and two 1st-level Ritual spells of your choice from any class. You always have them prepared.' },
            { id: 'armor-of-shadows', name: 'Armor of Shadows', text: 'You can cast Mage Armor on yourself without expending a spell slot.' },
            { id: 'eldritch-mind', name: 'Eldritch Mind', text: 'You have Advantage on CON saves you make to maintain Concentration.' }
          ]
        }],
        features: [
          { level: 1, name: 'Pact Magic', text: 'You can cast Warlock spells, using CHA as your spellcasting ability. Your spell slots recharge on a Short or Long Rest.' },
          { level: 1, name: 'Eldritch Invocations', text: 'You have unearthed one Eldritch Invocation, a fragment of forbidden knowledge that gives you a lasting magical ability.' }
        ],
        equipment: { A: { items: [['leather', 1], ['sickle', 1], ['dagger', 2], ['arcane-focus-orb', 1], ['book', 1], ['scholars-pack', 1]], gp: 15 }, B: { items: [], gp: 100 } }
      },
      {
        id: 'wizard', name: 'Wizard', hitDie: 6, primary: ['int'], complexity: 3, style: ['magic', 'ranged'],
        pitch: 'A scholar of magic with the biggest spellbook.',
        detail: 'The widest range of spells in the game. Fragile, but endlessly clever.',
        saves: ['int', 'wis'], armor: [], weapons: ['simple'],
        skillChoices: { count: 2, from: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'nature', 'religion'] },
        spellcasting: { ability: 'int', list: 'wizard', cantrips: [3, 3, 3, 4, 4], prepared: [4, 5, 6, 7, 9], slots: FULL_SLOTS, spellbook: true },
        resources: [{ id: 'arcane-recovery', name: 'Arcane Recovery', recharge: 'long', uses: [1, 1, 1, 1, 1] }],
        features: [
          { level: 1, name: 'Spellcasting', text: 'You can cast Wizard spells from your spellbook, using INT as your spellcasting ability. Your spellbook starts with six 1st-level spells; you prepare some of them each day.' },
          { level: 1, name: 'Ritual Adept', text: 'You can cast any spell in your spellbook that has the Ritual tag as a ritual, without preparing it.' },
          { level: 1, name: 'Arcane Recovery', text: 'Once per day after a Short Rest, recover expended spell slots with a combined level of up to half your Wizard level (rounded up).' }
        ],
        equipment: { A: { items: [['dagger', 2], ['quarterstaff', 1], ['robe', 1], ['spellbook', 1], ['scholars-pack', 1]], gp: 5 }, B: { items: [], gp: 55 } }
      }
    ]
  });
})();
