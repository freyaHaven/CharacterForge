/*
 * SRD 5.2 class progression, levels 2–5, plus the SRD subclass for each class.
 * Merged into the level 1 class data from srd-classes.js.
 * Includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, CC-BY-4.0.
 *
 * Extra class fields:
 *   maxLevel                  highest level this data covers
 *   subclassLevel / subclassLabel / subclasses[]   {id, name, pitch, features, alwaysPrepared, choices, grants:{…}}
 *   asiLevels                 levels that give an Ability Score Improvement or a feat
 *   extraAttack               level that gives two attacks per Attack action
 *   masteryCount[]            weapon masteries known per level
 *   scaling {key: [[n, die] per level]}  dice that grow with level, used by rolls like ['{n}d{d} …', 'scale:key', mod]
 *   speedBonus[]              {level, amount, unless:'heavy'|'armor'}
 *   levelPicks[]              {level, kind:'expertise'|'skill'|'languages', count, from?, label, help}
 *   jackOfAllTrades           level at which half proficiency is added to unskilled checks
 *   choices[].level / count[] / options[].minLevel / options[].requires  (choices can grow with level)
 */
(function () {
  'use strict';
  var pack = CF.content.pack('srd-5.2');
  var byId = {};
  pack.classes.forEach(function (c) { byId[c.id] = c; });
  function patch(id, p) {
    var c = byId[id];
    Object.keys(p).forEach(function (k) {
      if (k === 'features' || k === 'resources' || k === 'choices' || k === 'alwaysPrepared') c[k] = (c[k] || []).concat(p[k]);
      else c[k] = p[k];
    });
    c.maxLevel = 5; c.subclassLevel = c.subclassLevel || 3; c.asiLevels = c.asiLevels || [4];
  }
  var FIGHTING_STYLES = byId.fighter.choices[0].options;
  var ASI = { level: 4, name: 'Ability Score Improvement', text: 'Increase one ability score by 2, or two scores by 1 (none above 20). Instead, you can take a feat you qualify for.' };

  /* ---------- Barbarian ---------- */
  patch('barbarian', {
    subclassLabel: 'Primal Path', extraAttack: 5, masteryCount: [2, 2, 2, 3, 3],
    speedBonus: [{ level: 5, amount: 10, unless: 'heavy' }],
    levelPicks: [{ level: 3, kind: 'skill', count: 1, from: ['animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'], label: 'Primal Knowledge', help: 'Gain one more skill from the Barbarian list.' }],
    features: [
      { level: 2, name: 'Danger Sense', text: 'You have Advantage on DEX saving throws unless you have the Incapacitated condition.' },
      { level: 2, name: 'Reckless Attack', text: 'When you make your first attack roll on your turn, you can attack recklessly: you have Advantage on STR-based attack rolls until the start of your next turn, but attack rolls against you have Advantage during that time.',
        action: { time: 'Other', text: 'Decide on your first attack each turn.' } },
      { level: 3, name: 'Primal Knowledge', text: 'You gain one more Barbarian skill. While raging, you can use STR for Acrobatics, Intimidation, Perception, Stealth and Survival checks.' },
      Object.assign({}, ASI),
      { level: 5, name: 'Extra Attack', text: 'You can attack twice instead of once whenever you take the Attack action on your turn.' },
      { level: 5, name: 'Fast Movement', text: 'Your Speed increases by 10 ft while you aren’t wearing Heavy armor.' }
    ],
    subclasses: [{
      id: 'berserker', name: 'Path of the Berserker', pitch: 'Pure, violent fury: more damage when you throw caution away.',
      features: [{ level: 3, name: 'Frenzy', text: 'If you use Reckless Attack while raging, the first creature you hit on your turn with a STR-based attack takes extra damage: roll d6s equal to your Rage Damage bonus (2d6 at these levels) and add them.',
        action: { time: 'Other', text: 'While raging and attacking recklessly, first hit each turn.', rolls: [['2d6 Frenzy', 2, 6, 0]] } }]
    }]
  });

  /* ---------- Bard ---------- */
  patch('bard', {
    subclassLabel: 'Bard College', jackOfAllTrades: 2,
    scaling: { inspiration: [[1, 6], [1, 6], [1, 6], [1, 6], [1, 8]] },
    levelPicks: [{ level: 2, kind: 'expertise', count: 2, label: 'Expertise', help: 'Pick two of your skills: your proficiency bonus is doubled for them.' }],
    features: [
      { level: 2, name: 'Expertise', text: 'Choose two of your skill proficiencies. Your proficiency bonus is doubled for checks with them.' },
      { level: 2, name: 'Jack of All Trades', text: 'You add half your proficiency bonus (rounded down) to any ability check that doesn’t already use it.' },
      Object.assign({}, ASI),
      { level: 5, name: 'Font of Inspiration', text: 'You regain all Bardic Inspiration on a Short or Long Rest, and you can expend a spell slot to regain one use. Your Bardic Inspiration die becomes a d8.' }
    ],
    subclasses: [{
      id: 'lore', name: 'College of Lore', pitch: 'Collect knowledge and use clever words to undercut your foes.',
      levelPicks: [{ level: 3, kind: 'skill', count: 3, from: 'any', label: 'Bonus Proficiencies', help: 'Gain three skills of your choice.' }],
      features: [
        { level: 3, name: 'Bonus Proficiencies', text: 'You gain proficiency with three skills of your choice.' },
        { level: 3, name: 'Cutting Words', text: 'When a creature you can see within 60 ft makes a damage roll or succeeds on an ability check or attack roll, you can use your Reaction to expend a Bardic Inspiration die, roll it and subtract it from the roll, possibly turning a success into a failure.',
          action: { time: 'Reaction', resource: 'bardic-inspiration', rolls: [['1d{d} Cutting Words', 'scale:inspiration', 0]] } }
      ]
    }]
  });
  byId.bard.resources[0].shortFrom = 5;
  byId.bard.features[0].action.rolls = [['1d{d} inspiration', 'scale:inspiration', 0]];
  byId.bard.features[0].text = byId.bard.features[0].text.replace('roll a d6', 'roll the Bardic Inspiration die (d6, d8 from level 5)');

  /* ---------- Cleric ---------- */
  patch('cleric', {
    subclassLabel: 'Divine Domain',
    resources: [{ id: 'channel-divinity', name: 'Channel Divinity', recharge: 'long', shortRest: 1, uses: [0, 2, 2, 2, 2] }],
    features: [
      { level: 2, name: 'Channel Divinity', text: 'You can channel divine energy twice per Long Rest (one use back on a Short Rest). Every Cleric has Divine Spark and Turn Undead; your domain may add more options.' },
      { level: 2, name: 'Divine Spark', text: 'As a Magic action, point your Holy Symbol at a creature within 30 ft and roll 1d8 + WIS modifier. Either restore that many HP, or deal that much Necrotic or Radiant damage (CON save for half).',
        action: { time: 'Action', resource: 'channel-divinity', rolls: [['1d8 + WIS', 1, 8, 'wis']] } },
      { level: 2, name: 'Turn Undead', text: 'As a Magic action, each Undead of your choice within 30 ft makes a WIS save. On a failure it is Frightened and Incapacitated for 1 minute, trying to move away from you. It ends early if it takes damage.',
        action: { time: 'Action', resource: 'channel-divinity', text: 'Undead within 30 ft make a WIS save.' } },
      Object.assign({}, ASI),
      { level: 5, name: 'Sear Undead', text: 'When you use Turn Undead, roll d8s equal to your WIS modifier (minimum 1) and deal that much Radiant damage to each Undead that fails the save.' }
    ],
    subclasses: [{
      id: 'life', name: 'Life Domain', pitch: 'The best healer in the game.',
      alwaysPrepared: [{ level: 3, spell: 'aid' }, { level: 3, spell: 'bless' }, { level: 3, spell: 'cure-wounds' }, { level: 3, spell: 'lesser-restoration' }, { level: 5, spell: 'mass-healing-word' }, { level: 5, spell: 'revivify' }],
      features: [
        { level: 3, name: 'Disciple of Life', text: 'When a spell you cast with a spell slot restores HP to a creature, it regains extra HP equal to 2 + the spell slot’s level.' },
        { level: 3, name: 'Life Domain Spells', text: 'You always have Aid, Bless, Cure Wounds and Lesser Restoration prepared, and Mass Healing Word and Revivify from level 5.' },
        { level: 3, name: 'Preserve Life', text: 'As a Magic action, use Channel Divinity to restore HP equal to five times your Cleric level, divided as you choose among Bloodied creatures within 30 ft. A creature can’t be healed above half its HP maximum this way.',
          action: { time: 'Action', resource: 'channel-divinity', text: '5 × Cleric level HP, shared out.' } }
      ]
    }]
  });

  /* ---------- Druid ---------- */
  var LAND = function (id, name, l3, l5) { return { id: id, name: name, text: 'Always prepared: ' + l3.concat(l5).map(function (s) { return s.replace(/-/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); }); }).join(', ') + ' (the last from level 5).', grants: { spells: l3.map(function (s) { return { level: 3, spell: s }; }).concat(l5.map(function (s) { return { level: 5, spell: s }; })) } }; };
  patch('druid', {
    subclassLabel: 'Druid Circle',
    resources: [{ id: 'wild-shape', name: 'Wild Shape', recharge: 'long', shortRest: 1, uses: [0, 2, 2, 2, 2] }],
    features: [
      { level: 2, name: 'Wild Shape', text: 'As a Bonus Action, shape-shift into a Beast form you have learned (up to CR 1/4 with no Fly Speed; CR 1/2 from level 4). You keep your mind and gain Temporary HP equal to your Druid level. It lasts hours equal to half your Druid level. Two uses per Long Rest, one back on a Short Rest.',
        action: { time: 'Bonus Action', resource: 'wild-shape' } },
      { level: 2, name: 'Wild Companion', text: 'As a Magic action, expend a spell slot or a use of Wild Shape to cast Find Familiar without material components. The familiar is a Fey and vanishes after a Long Rest.' },
      Object.assign({}, ASI),
      { level: 5, name: 'Wild Resurgence', text: 'Once per turn, if you have no Wild Shape uses left, you can expend a spell slot to regain one. Once per Long Rest, you can expend a Wild Shape use to regain a 1st-level spell slot.' }
    ],
    subclasses: [{
      id: 'land', name: 'Circle of the Land', pitch: 'Draw magic from the land you love: extra spells and a healing burst.',
      choices: [{ id: 'land-type', level: 3, name: 'Land type', help: 'Pick the land your magic comes from. It decides your extra spells; you can change it after a Long Rest.',
        options: [
          LAND('arid', 'Arid', ['blur', 'burning-hands', 'fire-bolt'], ['fireball']),
          LAND('polar', 'Polar', ['fog-cloud', 'hold-person', 'ray-of-frost'], ['sleet-storm']),
          LAND('temperate', 'Temperate', ['misty-step', 'shocking-grasp', 'sleep'], ['lightning-bolt']),
          LAND('tropical', 'Tropical', ['acid-splash', 'ray-of-sickness', 'web'], ['stinking-cloud'])
        ] }],
      features: [
        { level: 3, name: 'Circle of the Land Spells', text: 'You always have spells prepared that depend on your chosen land type.' },
        { level: 3, name: 'Land’s Aid', text: 'As a Magic action, expend a use of Wild Shape and choose a point within 60 ft. Flowers and thorns fill a 10-ft-radius Sphere: each creature of your choice there makes a CON save, taking 2d6 Necrotic damage on a failure or half on a success, and one creature you choose there regains 2d6 HP.',
          action: { time: 'Action', resource: 'wild-shape', rolls: [['2d6 necrotic', 2, 6, 0], ['2d6 healing', 2, 6, 0]] } }
      ]
    }]
  });

  /* ---------- Fighter ---------- */
  patch('fighter', {
    subclassLabel: 'Martial Archetype', extraAttack: 5, masteryCount: [3, 3, 3, 4, 4],
    resources: [{ id: 'action-surge', name: 'Action Surge', recharge: 'short', uses: [0, 1, 1, 1, 1] }],
    features: [
      { level: 2, name: 'Action Surge', text: 'On your turn, you can take one additional action (except the Magic action). Once per Short or Long Rest.',
        action: { time: 'Other', resource: 'action-surge', text: 'One extra action on your turn.' } },
      { level: 2, name: 'Tactical Mind', text: 'When you fail an ability check, you can expend a use of Second Wind to roll 1d10 and add it, possibly turning it into a success. If it still fails, the use isn’t spent.',
        action: { time: 'Other', resource: 'second-wind', rolls: [['1d10 to the check', 1, 10, 0]] } },
      Object.assign({}, ASI),
      { level: 5, name: 'Extra Attack', text: 'You can attack twice instead of once whenever you take the Attack action on your turn.' },
      { level: 5, name: 'Tactical Shift', text: 'Whenever you use Second Wind, you can move up to half your Speed without provoking Opportunity Attacks.' }
    ],
    subclasses: [{
      id: 'champion', name: 'Champion', pitch: 'Simple and strong: more critical hits and athletic feats.',
      grants: { critRange: 19 },
      features: [
        { level: 3, name: 'Improved Critical', text: 'Your attack rolls with weapons and Unarmed Strikes score a Critical Hit on a roll of 19 or 20.' },
        { level: 3, name: 'Remarkable Athlete', text: 'You have Advantage on Initiative rolls and STR (Athletics) checks. After you score a Critical Hit, you can move up to half your Speed without provoking Opportunity Attacks.' }
      ]
    }]
  });

  /* ---------- Monk ---------- */
  patch('monk', {
    subclassLabel: 'Monastic Tradition', extraAttack: 5,
    scaling: { martial: [[1, 6], [1, 6], [1, 6], [1, 6], [1, 8]] },
    speedBonus: [{ level: 2, amount: 10, unless: 'armor' }],
    resources: [{ id: 'focus', name: 'Focus Points', recharge: 'short', uses: [0, 2, 3, 4, 5] }],
    features: [
      { level: 2, name: 'Monk’s Focus', text: 'You have Focus Points equal to your Monk level, regained on a Short or Long Rest. Flurry of Blows: spend 1 to make two Unarmed Strikes as a Bonus Action. Patient Defense: Disengage as a Bonus Action, or spend 1 to Disengage and Dodge. Step of the Wind: Dash as a Bonus Action, or spend 1 to Disengage and Dash with doubled jump distance.',
        action: { time: 'Bonus Action', resource: 'focus', text: 'Flurry of Blows, Patient Defense or Step of the Wind.' } },
      { level: 2, name: 'Unarmored Movement', text: 'Your Speed increases by 10 ft while you aren’t wearing armor or wielding a Shield.' },
      { level: 2, name: 'Uncanny Metabolism', text: 'When you roll Initiative, you can regain all expended Focus Points and HP equal to a roll of your Martial Arts die + your Monk level. Once per Long Rest.' },
      { level: 3, name: 'Deflect Attacks', text: 'When an attack roll hits you and deals Bludgeoning, Piercing or Slashing damage, use your Reaction to reduce the damage by 1d10 + DEX modifier + your Monk level. If you reduce it to 0, you can spend 1 Focus Point to redirect some of it at another creature.',
        action: { time: 'Reaction', rolls: [['1d10 + DEX + level', 1, 10, 'dex+level']] } },
      Object.assign({}, ASI),
      { level: 4, name: 'Slow Fall', text: 'As a Reaction when you fall, reduce the falling damage you take by five times your Monk level.' },
      { level: 5, name: 'Extra Attack', text: 'You can attack twice instead of once whenever you take the Attack action on your turn.' },
      { level: 5, name: 'Stunning Strike', text: 'Once per turn when you hit with a Monk weapon or an Unarmed Strike, spend 1 Focus Point: the target makes a CON save or is Stunned until the start of your next turn. On a success its Speed is halved and the next attack against it has Advantage.',
        action: { time: 'Other', resource: 'focus', text: 'Once per turn, on a hit.' } }
    ],
    subclasses: [{
      id: 'open-hand', name: 'Warrior of the Open Hand', pitch: 'Master of unarmed combat: knock foes down and push them around.',
      features: [{ level: 3, name: 'Open Hand Technique', text: 'Whenever you hit with an attack from Flurry of Blows, you can impose one effect: Addle (it can’t make Opportunity Attacks until its next turn), Push (STR save or pushed 15 ft) or Topple (DEX save or Prone).' }]
    }]
  });
  byId.monk.features[0].action.rolls = [['Unarmed Strike', 'unarmed'], ['1d{d} + DEX', 'scale:martial', 'dex']];
  byId.monk.features[0].text = byId.monk.features[0].text.replace('deal 1d6 damage', 'deal your Martial Arts die in damage (1d6, 1d8 from level 5)');

  /* ---------- Paladin ---------- */
  patch('paladin', {
    subclassLabel: 'Sacred Oath', extraAttack: 5,
    resources: [
      { id: 'paladins-smite', name: 'Divine Smite (free cast)', spell: 'divine-smite', recharge: 'long', uses: [0, 1, 1, 1, 1] },
      { id: 'channel-divinity', name: 'Channel Divinity', recharge: 'long', shortRest: 1, uses: [0, 0, 2, 2, 2] },
      { id: 'faithful-steed', name: 'Find Steed (free cast)', spell: 'find-steed', recharge: 'long', uses: [0, 0, 0, 0, 1] }
    ],
    alwaysPrepared: [{ level: 2, spell: 'divine-smite' }, { level: 5, spell: 'find-steed' }],
    choices: [{ id: 'paladin-style', level: 2, name: 'Fighting Style', help: 'Pick the way you like to fight.', options: FIGHTING_STYLES }],
    features: [
      { level: 2, name: 'Fighting Style', text: 'You gain a Fighting Style feat of your choice.' },
      { level: 2, name: 'Paladin’s Smite', text: 'You always have Divine Smite prepared, and you can cast it without a spell slot once per Long Rest.' },
      { level: 3, name: 'Channel Divinity', text: 'You can channel divine energy twice per Long Rest (one use back on a Short Rest). Every Paladin has Divine Sense; your oath adds more options.' },
      { level: 3, name: 'Divine Sense', text: 'As a Bonus Action, for 10 minutes you know the location of any Celestial, Fiend or Undead within 60 ft, and of places consecrated or desecrated.',
        action: { time: 'Bonus Action', resource: 'channel-divinity' } },
      Object.assign({}, ASI),
      { level: 5, name: 'Extra Attack', text: 'You can attack twice instead of once whenever you take the Attack action on your turn.' },
      { level: 5, name: 'Faithful Steed', text: 'You always have Find Steed prepared, and you can cast it without a spell slot once per Long Rest.' }
    ],
    subclasses: [{
      id: 'devotion', name: 'Oath of Devotion', pitch: 'The classic shining knight: honesty, courage and a glowing weapon.',
      alwaysPrepared: [{ level: 3, spell: 'protection-from-evil-and-good' }, { level: 3, spell: 'shield-of-faith' }, { level: 5, spell: 'aid' }, { level: 5, spell: 'zone-of-truth' }],
      features: [
        { level: 3, name: 'Oath of Devotion Spells', text: 'You always have Protection from Evil and Good and Shield of Faith prepared, and Aid and Zone of Truth from level 5.' },
        { level: 3, name: 'Sacred Weapon', text: 'When you take the Attack action, you can use Channel Divinity to imbue one weapon for 10 minutes: add your CHA modifier (minimum +1) to its attack rolls, it can deal Radiant damage, and it sheds Bright Light in a 20-ft radius.',
          action: { time: 'Other', resource: 'channel-divinity', text: 'As part of the Attack action.' } }
      ]
    }]
  });

  /* ---------- Ranger ---------- */
  patch('ranger', {
    subclassLabel: 'Ranger Archetype', extraAttack: 5,
    choices: [{ id: 'ranger-style', level: 2, name: 'Fighting Style', help: 'Pick the way you like to fight.', options: FIGHTING_STYLES }],
    levelPicks: [
      { level: 2, kind: 'expertise', count: 1, label: 'Deft Explorer: Expertise', help: 'Pick one of your skills: your proficiency bonus is doubled for it.' },
      { level: 2, kind: 'languages', count: 2, label: 'Deft Explorer: Languages', help: 'You learn two languages of your choice.' }
    ],
    features: [
      { level: 2, name: 'Deft Explorer', text: 'You gain Expertise in one of your skills, and you learn two languages of your choice.' },
      { level: 2, name: 'Fighting Style', text: 'You gain a Fighting Style feat of your choice.' },
      Object.assign({}, ASI),
      { level: 5, name: 'Extra Attack', text: 'You can attack twice instead of once whenever you take the Attack action on your turn.' }
    ],
    subclasses: [{
      id: 'hunter', name: 'Hunter', pitch: 'A monster slayer who knows exactly where to strike.',
      choices: [{ id: 'hunters-prey', level: 3, name: 'Hunter’s Prey', help: 'Pick your hunting technique. You can change it after a Short or Long Rest.',
        options: [
          { id: 'colossus-slayer', name: 'Colossus Slayer', text: 'Once per turn, when you hit a creature that is missing any HP with a weapon, it takes an extra 1d8 damage.' },
          { id: 'horde-breaker', name: 'Horde Breaker', text: 'Once on each of your turns when you attack with a weapon, you can make another attack with the same weapon against a different creature within 5 ft of the first and within range.' }
        ] }],
      features: [
        { level: 3, name: 'Hunter’s Lore', text: 'While a creature is marked by your Hunter’s Mark, you know whether it has any Immunities, Resistances or Vulnerabilities, and what they are.' },
        { level: 3, name: 'Hunter’s Prey', text: 'You gain Colossus Slayer or Horde Breaker (your choice).' }
      ]
    }]
  });

  /* ---------- Rogue ---------- */
  patch('rogue', {
    subclassLabel: 'Roguish Archetype',
    scaling: { sneak: [[1, 6], [1, 6], [2, 6], [2, 6], [3, 6]] },
    features: [
      { level: 2, name: 'Cunning Action', text: 'On each of your turns, you can take the Dash, Disengage or Hide action as a Bonus Action.',
        action: { time: 'Bonus Action', text: 'Dash, Disengage or Hide.' } },
      { level: 3, name: 'Steady Aim', text: 'As a Bonus Action, give yourself Advantage on your next attack roll this turn. You can use it only if you haven’t moved this turn, and your Speed is 0 until the end of the turn.',
        action: { time: 'Bonus Action', text: 'Only if you haven’t moved this turn.' } },
      Object.assign({}, ASI),
      { level: 5, name: 'Cunning Strike', text: 'When you deal Sneak Attack damage, you can give up Sneak Attack dice for an effect: Poison (1d6: CON save or Poisoned for 1 minute), Trip (1d6: Large or smaller, DEX save or Prone) or Withdraw (1d6: move half your Speed without provoking Opportunity Attacks).' },
      { level: 5, name: 'Uncanny Dodge', text: 'When an attacker you can see hits you with an attack roll, you can use your Reaction to halve the attack’s damage against you.',
        action: { time: 'Reaction', text: 'Halve the damage of one attack that hits you.' } }
    ],
    subclasses: [{
      id: 'thief', name: 'Thief', pitch: 'Burglar and treasure hunter: fast hands and great climbing.',
      features: [
        { level: 3, name: 'Fast Hands', text: 'As a Bonus Action you can make a DEX (Sleight of Hand) check, use Thieves’ Tools to pick a lock or disarm a trap, or take the Utilize action.',
          action: { time: 'Bonus Action', text: 'Sleight of Hand, Thieves’ Tools, or Utilize.' } },
        { level: 3, name: 'Second-Story Work', text: 'You gain a Climb Speed equal to your Speed, and you can use DEX instead of STR to work out how far you can jump.' }
      ]
    }]
  });
  byId.rogue.features[1].action.rolls = [['{n}d{d} Sneak Attack', 'scale:sneak', 0]];
  byId.rogue.features[1].text = byId.rogue.features[1].text.replace('an extra 1d6 damage', 'extra damage (1d6, 2d6 from level 3, 3d6 from level 5)');

  /* ---------- Sorcerer ---------- */
  var MM = function (id, name, cost, text) { return { id: id, name: name + ' (' + cost + ' SP)', text: text }; };
  patch('sorcerer', {
    subclassLabel: 'Sorcerous Origin',
    resources: [{ id: 'sorcery-points', name: 'Sorcery Points', recharge: 'long', uses: [0, 2, 3, 4, 5], shortRestBy: [0, 0, 0, 0, 2] }],
    choices: [{ id: 'metamagic', level: 2, name: 'Metamagic', count: [0, 2, 2, 2, 2], help: 'Pick two ways to twist your spells. Each costs Sorcery Points (SP).',
      options: [
        MM('careful', 'Careful Spell', 1, 'Creatures of your choice (up to your CHA modifier) automatically succeed on a spell’s save and take no damage on a success.'),
        MM('distant', 'Distant Spell', 1, 'Double a spell’s range, or make a Touch spell reach 30 ft.'),
        MM('empowered', 'Empowered Spell', 1, 'Reroll damage dice up to your CHA modifier and use the new rolls.'),
        MM('extended', 'Extended Spell', 1, 'Double a spell’s duration (up to 24 hours) and get Advantage on Concentration saves for it.'),
        MM('heightened', 'Heightened Spell', 2, 'One target has Disadvantage on its saves against the spell.'),
        MM('quickened', 'Quickened Spell', 2, 'Cast a spell that takes an action as a Bonus Action instead.'),
        MM('seeking', 'Seeking Spell', 1, 'If you miss with a spell attack, reroll the d20 and use the new roll.'),
        MM('subtle', 'Subtle Spell', 1, 'Cast without Verbal, Somatic or Material (not costly) components.'),
        MM('transmuted', 'Transmuted Spell', 1, 'Change a spell’s damage type to another of Acid, Cold, Fire, Lightning, Poison or Thunder.'),
        MM('twinned', 'Twinned Spell', 1, 'A spell that targets one creature can target a second one (if cast at a higher level it could).')
      ] }],
    features: [
      { level: 2, name: 'Font of Magic', text: 'You have Sorcery Points equal to your Sorcerer level, regained on a Long Rest. As a Bonus Action you can turn a spell slot into Sorcery Points (its level), or spend points to create a slot (2 SP for 1st level, 3 for 2nd, 5 for 3rd).',
        action: { time: 'Bonus Action', resource: 'sorcery-points', text: 'Convert slots and points.' } },
      { level: 2, name: 'Metamagic', text: 'You learn two Metamagic options, which let you change spells as you cast them by spending Sorcery Points.' },
      Object.assign({}, ASI),
      { level: 5, name: 'Sorcerous Restoration', text: 'When you finish a Short Rest, you regain Sorcery Points equal to half your Sorcerer level (rounded down). Once per Long Rest.' }
    ],
    subclasses: [{
      id: 'draconic', name: 'Draconic Sorcery', pitch: 'Dragon blood in your veins: tougher skin, more HP and dragon spells.',
      grants: { unarmoredDefense: 'cha', hpPerLevel: 1 },
      alwaysPrepared: [{ level: 3, spell: 'alter-self' }, { level: 3, spell: 'chromatic-orb' }, { level: 3, spell: 'command' }, { level: 3, spell: 'dragons-breath' }, { level: 5, spell: 'fear' }, { level: 5, spell: 'fly' }],
      features: [
        { level: 3, name: 'Draconic Resilience', text: 'Your HP maximum increases by 1 for each Sorcerer level. While you aren’t wearing armor, your base AC equals 10 + DEX modifier + CHA modifier.' },
        { level: 3, name: 'Draconic Spells', text: 'You always have Alter Self, Chromatic Orb, Command and Dragon’s Breath prepared, and Fear and Fly from level 5.' }
      ]
    }]
  });

  /* ---------- Warlock ---------- */
  var inv = byId.warlock.choices[0];
  inv.count = [1, 3, 3, 3, 5];
  inv.help = 'Pick gifts from your patron. You get more at levels 2 and 5.';
  inv.options = inv.options.concat([
    { id: 'agonizing-blast', name: 'Agonizing Blast', minLevel: 2, requires: { cantrip: 'eldritch-blast' }, text: 'Add your CHA modifier to the damage of Eldritch Blast.', grants: { agonizing: true } },
    { id: 'devils-sight', name: 'Devil’s Sight', minLevel: 2, text: 'You can see normally in Dim Light and Darkness, magical or not, within 120 ft.' },
    { id: 'eldritch-spear', name: 'Eldritch Spear', minLevel: 2, requires: { cantrip: 'eldritch-blast' }, text: 'Eldritch Blast’s range increases by 30 ft times your Warlock level.' },
    { id: 'fiendish-vigor', name: 'Fiendish Vigor', minLevel: 2, text: 'You can cast False Life on yourself without a spell slot.' },
    { id: 'mask-of-many-faces', name: 'Mask of Many Faces', minLevel: 2, text: 'You can cast Disguise Self without a spell slot.' },
    { id: 'misty-visions', name: 'Misty Visions', minLevel: 2, text: 'You can cast Silent Image without a spell slot.' },
    { id: 'repelling-blast', name: 'Repelling Blast', minLevel: 2, requires: { cantrip: 'eldritch-blast' }, text: 'When you hit a Large or smaller creature with Eldritch Blast, you can push it up to 10 ft straight away from you.' },
    { id: 'one-with-shadows', name: 'One with Shadows', minLevel: 5, text: 'While in Dim Light or Darkness, you can take a Magic action to become Invisible until you move or take an action, Bonus Action or Reaction.' },
    { id: 'thirsting-blade', name: 'Thirsting Blade', minLevel: 5, requires: { choice: 'pact-of-the-blade' }, text: 'You can attack twice with your pact weapon whenever you take the Attack action.', grants: { extraAttack: true } }
  ]);
  patch('warlock', {
    subclassLabel: 'Otherworldly Patron',
    resources: [{ id: 'magical-cunning', name: 'Magical Cunning', recharge: 'long', uses: [0, 1, 1, 1, 1] }],
    features: [
      { level: 2, name: 'Magical Cunning', text: 'You can perform a 1-minute rite to regain expended Pact Magic slots, up to half your maximum (rounded up). Once per Long Rest.' },
      { level: 2, name: 'More Invocations', text: 'You learn two more Eldritch Invocations at level 2, and two more at level 5.' },
      Object.assign({}, ASI)
    ],
    subclasses: [{
      id: 'fiend', name: 'Fiend Patron', pitch: 'A pact with a devil or demon: fire spells and a burst of toughness when foes fall.',
      alwaysPrepared: [{ level: 3, spell: 'burning-hands' }, { level: 3, spell: 'command' }, { level: 3, spell: 'scorching-ray' }, { level: 3, spell: 'suggestion' }, { level: 5, spell: 'fireball' }, { level: 5, spell: 'stinking-cloud' }],
      features: [
        { level: 3, name: 'Dark One’s Blessing', text: 'When you reduce an enemy to 0 HP, or someone else does within 10 ft of you, you gain Temporary HP equal to your CHA modifier + your Warlock level (minimum 1).',
          action: { time: 'Other', text: 'When an enemy near you drops to 0 HP.' } },
        { level: 3, name: 'Fiend Spells', text: 'You always have Burning Hands, Command, Scorching Ray and Suggestion prepared, and Fireball and Stinking Cloud from level 5.' }
      ]
    }]
  });

  /* ---------- Wizard ---------- */
  patch('wizard', {
    subclassLabel: 'Arcane Tradition',
    levelPicks: [{ level: 2, kind: 'expertise', count: 1, from: ['arcana', 'history', 'investigation', 'medicine', 'nature', 'religion'], label: 'Scholar', help: 'Pick one of these skills you are proficient in: your proficiency bonus is doubled for it.' }],
    features: [
      { level: 2, name: 'Scholar', text: 'You gain Expertise in one of these skills you are proficient in: Arcana, History, Investigation, Medicine, Nature or Religion.' },
      Object.assign({}, ASI),
      { level: 5, name: 'Memorize Spell', text: 'Whenever you finish a Short Rest, you can swap one of your prepared spells for another spell in your spellbook.' }
    ],
    subclasses: [{
      id: 'evoker', name: 'Evoker', pitch: 'Master of destructive magic: fire, lightning and force.',
      features: [
        { level: 3, name: 'Evocation Savant', text: 'Choose two Evocation spells of up to 2nd level and add them to your spellbook for free. Each time you gain access to a new spell level, add one more Evocation spell for free.' },
        { level: 3, name: 'Potent Cantrip', text: 'When you cast a damaging cantrip and miss, or the target succeeds on its save, it still takes half the cantrip’s damage (but no other effect).' }
      ]
    }]
  });

  /* ---------- feats you can take at level 4 ---------- */
  CF.content.extendPack('srd-5.2', {
    feats: [
      { id: 'ability-score-improvement', name: 'Ability Score Improvement', category: 'general', pitch: '+2 to one score, or +1 to two scores.', asi: 'flex', repeatable: true,
        text: 'Increase one ability score of your choice by 2, or two ability scores by 1. You can’t increase a score above 20.' },
      { id: 'grappler', name: 'Grappler', category: 'general', pitch: 'Grab foes as you punch them; +1 STR or DEX.', asi: ['str', 'dex'], prereq: { level: 4, any: { str: 13, dex: 13 } },
        text: 'Increase your STR or DEX by 1. Punch and Grab: when you hit with an Unarmed Strike as part of the Attack action, you can use both the Damage and the Grapple option, once per turn. Attack Advantage: you have Advantage on attacks against a creature Grappled by you. Fast Wrestler: moving a creature Grappled by you costs no extra movement if it is your size or smaller.' }
    ]
  });
})();
