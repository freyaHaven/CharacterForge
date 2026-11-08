/*
 * SRD 5.2 class progression, levels 6–20, merged on top of srd-classes.js and srd-levels.js.
 * Includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, CC-BY-4.0.
 *
 * Extra fields used here:
 *   grantsAt[]  {level, grants}  on a class or subclass: rules that switch on at a level
 *               grants: saves[] (proficiency), saveMod (add that ability's modifier, min +1, to every save),
 *                       abilityBonus {abilities[], amount, cap}, attacks (attacks per Attack action), defenses[], cantripMod
 *   levelPicks kind 'arcanum' {spellLevel}: Warlock Mystic Arcanum
 *   spellcasting.extraLists {level: [lists]}: Bard Magical Secrets
 */
(function () {
  'use strict';
  var pack = CF.content.pack('srd-5.2');
  var byId = {};
  pack.classes.forEach(function (c) { byId[c.id] = c; });

  /** {1: 2, 4: 3} → a 20-entry table that keeps each value until the next key. */
  function T(map) { var out = [], v = 0; for (var l = 1; l <= 20; l++) { if (map[l] !== undefined) v = map[l]; out.push(v); } return out; }
  function dice(map) { return T(map); }
  function res(cls, id) { return byId[cls].resources.find(function (r) { return r.id === id; }); }
  function add(cls, p) {
    var c = byId[cls];
    if (p.features) c.features = c.features.concat(p.features);
    if (p.resources) c.resources = (c.resources || []).concat(p.resources);
    if (p.choices) c.choices = (c.choices || []).concat(p.choices);
    if (p.levelPicks) c.levelPicks = (c.levelPicks || []).concat(p.levelPicks);
    if (p.grantsAt) c.grantsAt = (c.grantsAt || []).concat(p.grantsAt);
    if (p.alwaysPrepared) c.alwaysPrepared = (c.alwaysPrepared || []).concat(p.alwaysPrepared);
    if (p.speedBonus) c.speedBonus = (c.speedBonus || []).concat(p.speedBonus);
    var sub = p.sub && c.subclasses[0];
    if (sub) ['features', 'alwaysPrepared', 'choices', 'resources', 'grantsAt', 'levelPicks'].forEach(function (k) { if (p.sub[k]) sub[k] = (sub[k] || []).concat(p.sub[k]); });
    c.maxLevel = 20;
    if (!p.asiLevels) c.asiLevels = [4, 8, 12, 16, 19];
    else c.asiLevels = p.asiLevels;
  }
  function F(level, name, text, action) { var f = { level: level, name: name, text: text }; if (action) f.action = action; return f; }
  function ASI(levels) { return levels.map(function (l) { return F(l, 'Ability Score Improvement', 'Increase one ability score by 2, or two scores by 1 (none above 20). Instead, you can take a feat you qualify for.'); }); }
  var BOON = F(19, 'Epic Boon', 'You gain an Epic Boon feat (or another feat you qualify for). Epic Boons also raise one ability score by 1, up to 30.');
  function spells(list) { var out = []; Object.keys(list).forEach(function (l) { list[l].forEach(function (s) { out.push({ level: +l, spell: s }); }); }); return out; }

  /* ---------- shared spellcasting tables (2024) ---------- */
  var FULL = [[2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1]];
  var HALF = [[2], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2]];
  var PACT = T({ 1: 1, 2: 2, 11: 3, 17: 4 }).map(function (n, i) { var lvl = T({ 1: 1, 3: 2, 5: 3, 7: 4, 9: 5 })[i], row = []; for (var k = 1; k < lvl; k++) row.push(0); row.push(n); return row; });
  var PREP_FULL = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
  var PREP_HALF = [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15];
  var sc = function (id) { return byId[id].spellcasting; };
  ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'].forEach(function (id) { sc(id).slots = FULL; });
  ['paladin', 'ranger'].forEach(function (id) { sc(id).slots = HALF; sc(id).prepared = PREP_HALF; sc(id).cantrips = T({ 1: 0 }); });
  sc('warlock').slots = PACT;
  sc('bard').prepared = PREP_FULL; sc('cleric').prepared = PREP_FULL; sc('druid').prepared = PREP_FULL;
  sc('sorcerer').prepared = [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
  sc('wizard').prepared = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25];
  sc('warlock').prepared = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15];
  sc('bard').cantrips = T({ 1: 2, 4: 3, 10: 4 }); sc('druid').cantrips = T({ 1: 2, 4: 3, 10: 4 }); sc('warlock').cantrips = T({ 1: 2, 4: 3, 10: 4 });
  sc('cleric').cantrips = T({ 1: 3, 4: 4, 10: 5 }); sc('wizard').cantrips = T({ 1: 3, 4: 4, 10: 5 });
  sc('sorcerer').cantrips = T({ 1: 4, 4: 5, 10: 6 });
  sc('bard').extraLists = { 10: ['cleric', 'druid', 'wizard'] };

  /* ---------- Barbarian ---------- */
  res('barbarian', 'rage').uses = T({ 1: 2, 3: 3, 6: 4, 12: 5, 17: 6 });
  byId.barbarian.masteryCount = T({ 1: 2, 4: 3, 10: 4 });
  byId.barbarian.scaling = { rage: dice({ 1: [2, 6], 9: [3, 6], 16: [4, 6] }), brutal: dice({ 1: [1, 10], 17: [2, 10] }) };
  byId.barbarian.subclasses[0].features[0].action.rolls = [['{n}d6 Frenzy', 'scale:rage', 0]];
  byId.barbarian.features[0].text += ' Rage Damage: +2, +3 from level 9, +4 from level 16.';
  add('barbarian', {
    features: ASI([8, 12, 16]).concat([
      F(7, 'Feral Instinct', 'You have Advantage on Initiative rolls.'),
      F(7, 'Instinctive Pounce', 'As part of the Bonus Action you take to enter your Rage, you can move up to half your Speed.'),
      F(9, 'Brutal Strike', 'If you use Reckless Attack, you can forgo Advantage on one STR-based attack. If it hits, it deals an extra 1d10 damage (2d10 from level 17) and you add one effect: Forceful Blow (push 15 ft) or Hamstring Blow (Speed −15 ft). From level 13 you can also pick Staggering Blow or Sundering Blow; from level 17 two effects.',
        { time: 'Other', text: 'Instead of Advantage on one reckless attack.', rolls: [['{n}d10 Brutal Strike', 'scale:brutal', 0]] }),
      F(11, 'Relentless Rage', 'If you drop to 0 HP while raging and don’t die outright, make a DC 10 CON save (DC +5 each time after, reset on a rest). On a success your HP becomes twice your Barbarian level.'),
      F(13, 'Improved Brutal Strike', 'Brutal Strike gains Staggering Blow (Disadvantage on its next save, no Opportunity Attacks) and Sundering Blow (+5 to the next ally’s attack against it).'),
      F(15, 'Persistent Rage', 'When you roll Initiative you can regain all Rage uses (once per Long Rest), and your Rage lasts 10 minutes without needing to be extended.'),
      F(17, 'Improved Brutal Strike', 'Brutal Strike deals 2d10 extra damage, and you can apply two effects.'),
      F(18, 'Indomitable Might', 'If your total for a STR check or STR save is less than your STR score, you can use that score instead.'),
      BOON,
      F(20, 'Primal Champion', 'Your STR and CON scores increase by 4, to a maximum of 25.')
    ]),
    grantsAt: [{ level: 20, grants: { abilityBonus: { abilities: ['str', 'con'], amount: 4, cap: 25 } } }],
    sub: { features: [
      F(6, 'Mindless Rage', 'You have Immunity to the Charmed and Frightened conditions while raging. Entering a Rage ends them on you.'),
      F(10, 'Retaliation', 'When a creature within 5 ft damages you, you can use your Reaction to make one melee attack against it.', { time: 'Reaction', text: 'When a creature within 5 ft damages you.' }),
      F(14, 'Intimidating Presence', 'As a Bonus Action, creatures of your choice in a 30-ft Emanation make a WIS save (DC 8 + STR mod + proficiency) or are Frightened for 1 minute. Once per Long Rest, or expend a Rage use to do it again.', { time: 'Bonus Action' })
    ] }
  });

  /* ---------- Bard ---------- */
  byId.bard.scaling.inspiration = dice({ 1: [1, 6], 5: [1, 8], 10: [1, 10], 15: [1, 12] });
  add('bard', {
    features: ASI([8, 12, 16]).concat([
      F(7, 'Countercharm', 'When you or a creature within 30 ft fails a save against being Charmed or Frightened, you can use your Reaction to let it reroll with Advantage.', { time: 'Reaction', text: 'Reroll a failed save against Charmed or Frightened.' }),
      F(9, 'Expertise', 'You gain Expertise in two more of your skill proficiencies.'),
      F(10, 'Magical Secrets', 'You can choose spells from the Bard, Cleric, Druid and Wizard lists when you prepare spells; they count as Bard spells for you.'),
      F(18, 'Superior Inspiration', 'When you roll Initiative, you regain Bardic Inspiration uses until you have two, if you have fewer.'),
      BOON,
      F(20, 'Words of Creation', 'You always have Power Word Heal and Power Word Kill prepared, and you can target a second creature within 10 ft of the first with either.')
    ]),
    levelPicks: [{ level: 9, kind: 'expertise', count: 2, label: 'Expertise', help: 'Pick two more of your skills: your proficiency bonus is doubled for them.' }],
    alwaysPrepared: [{ level: 20, spell: 'power-word-heal' }, { level: 20, spell: 'power-word-kill' }],
    sub: { features: [
      F(6, 'Magical Discoveries', 'You learn two spells of your choice from the Cleric, Druid or Wizard lists. They are always prepared and count as Bard spells. (Add them to your notes; any prepared spell from those lists works from level 10 too.)'),
      F(14, 'Peerless Skill', 'When you make an ability check or attack roll and fail, you can expend a Bardic Inspiration use, roll the die and add it, possibly turning it into a success. If it still fails, the use isn’t spent.', { time: 'Other', resource: 'bardic-inspiration', rolls: [['1d{d} Peerless Skill', 'scale:inspiration', 0]] })
    ] }
  });

  /* ---------- Cleric ---------- */
  res('cleric', 'channel-divinity').uses = T({ 1: 0, 2: 2, 6: 3, 18: 4 });
  byId.cleric.scaling = { spark: dice({ 1: [1, 8], 7: [2, 8], 13: [3, 8], 18: [4, 8] }), strike: dice({ 1: [1, 8], 14: [2, 8] }) };
  byId.cleric.features.find(function (f) { return f.name === 'Divine Spark'; }).action.rolls = [['{n}d8 + WIS', 'scale:spark', 'wis']];
  add('cleric', {
    features: ASI([8, 12, 16]).concat([
      F(7, 'Blessed Strikes', 'Divine power infuses you in battle. Choose Divine Strike or Potent Spellcasting.'),
      F(10, 'Divine Intervention', 'As a Magic action, cast any Cleric spell of 5th level or lower that doesn’t take a Reaction, without a slot or components. Once per Long Rest.', { time: 'Action', resource: 'divine-intervention' }),
      F(14, 'Improved Blessed Strikes', 'Divine Strike deals 2d8; Potent Spellcasting also gives you Temporary HP equal to twice your WIS modifier when you cast a Cleric cantrip.'),
      BOON,
      F(20, 'Greater Divine Intervention', 'You can call on Divine Intervention to cast Wish. Afterwards you can’t use Divine Intervention again until 2d4 Long Rests pass.')
    ]),
    resources: [{ id: 'divine-intervention', name: 'Divine Intervention', recharge: 'long', uses: T({ 1: 0, 10: 1 }) }],
    choices: [{ id: 'blessed-strikes', level: 7, name: 'Blessed Strikes', help: 'Pick how your god empowers your attacks.',
      options: [
        { id: 'divine-strike', name: 'Divine Strike', text: 'Once on each of your turns when you hit with a weapon attack, deal an extra 1d8 Necrotic or Radiant damage (2d8 from level 14).', grants: { strike: 'Divine Strike' } },
        { id: 'potent-spellcasting', name: 'Potent Spellcasting', text: 'Add your WIS modifier to the damage you deal with any Cleric cantrip.', grants: { cantripMod: true } }
      ] }],
    sub: {
      alwaysPrepared: spells({ 7: ['death-ward', 'guardian-of-faith'], 9: ['greater-restoration', 'mass-cure-wounds'] }),
      features: [
        F(6, 'Blessed Healer', 'When you cast a spell with a slot that restores HP to another creature, you regain HP equal to 2 + the slot’s level.'),
        F(17, 'Supreme Healing', 'When you would roll dice to restore HP with a spell or Channel Divinity, use the highest number possible for each die instead.')
      ]
    }
  });

  /* ---------- Druid ---------- */
  res('druid', 'wild-shape').uses = T({ 1: 0, 2: 2, 6: 3, 17: 4 });
  byId.druid.scaling = { landsaid: dice({ 1: [2, 6], 10: [3, 6], 14: [4, 6] }), strike: dice({ 1: [1, 8], 15: [2, 8] }) };
  var la = byId.druid.subclasses[0].features.find(function (f) { return f.name === 'Land’s Aid'; });
  la.action.rolls = [['{n}d6 necrotic', 'scale:landsaid', 0], ['{n}d6 healing', 'scale:landsaid', 0]];
  la.text = la.text.replace(/2d6/g, '2d6 (3d6 at 10, 4d6 at 14)');
  var landType = byId.druid.subclasses[0].choices[0];
  var LAND_HIGH = { arid: [['blight'], ['wall-of-stone']], polar: [['ice-storm'], ['cone-of-cold']], temperate: [['freedom-of-movement'], ['tree-stride']], tropical: [['polymorph'], ['insect-plague']] };
  landType.options.forEach(function (o) {
    var h = LAND_HIGH[o.id];
    o.grants.spells = o.grants.spells.concat([{ level: 7, spell: h[0][0] }, { level: 9, spell: h[1][0] }]);
    o.text = o.text.replace(' (the last from level 5).', ', ' + h[0][0].replace(/-/g, ' ') + ' (level 7), ' + h[1][0].replace(/-/g, ' ') + ' (level 9).').replace(/\b(\w)/g, function (m) { return m; });
  });
  add('druid', {
    features: ASI([8, 12, 16]).concat([
      F(7, 'Elemental Fury', 'The power of the elements flows through you. Choose Potent Spellcasting or Primal Strike.'),
      F(15, 'Improved Elemental Fury', 'Primal Strike deals 2d8; with Potent Spellcasting, the range of your Druid cantrips with a range of 10 ft or more increases by 300 ft.'),
      F(18, 'Beast Spells', 'While in Wild Shape you can cast spells, except spells with a costly material component.'),
      BOON,
      F(20, 'Archdruid', 'When you roll Initiative and have no Wild Shape uses left, you regain one. You can convert Wild Shape uses into spell slots, and you age slowly.')
    ]),
    choices: [{ id: 'elemental-fury', level: 7, name: 'Elemental Fury', help: 'Pick how the elements empower you.',
      options: [
        { id: 'potent-spellcasting', name: 'Potent Spellcasting', text: 'Add your WIS modifier to the damage you deal with any Druid cantrip.', grants: { cantripMod: true } },
        { id: 'primal-strike', name: 'Primal Strike', text: 'Once on each of your turns when you hit with a weapon or a Beast form attack, deal an extra 1d8 Cold, Fire, Lightning or Thunder damage (2d8 from level 15).', grants: { strike: 'Primal Strike' } }
      ] }],
    sub: { features: [
      F(6, 'Natural Recovery', 'You can cast one of your Circle spells without a slot once per Long Rest. After a Short Rest, once per Long Rest, recover spell slots with a combined level up to half your Druid level (rounded up), none 6th or higher.'),
      F(10, 'Nature’s Ward', 'You are immune to the Poisoned condition, and have Resistance to a damage type from your land: Fire (arid), Cold (polar), Lightning (temperate) or Poison (tropical).'),
      F(14, 'Nature’s Sanctuary', 'As a Magic action, expend a Wild Shape use to make trees and vines appear in a 15-ft Cube within 120 ft for 1 minute. You and allies have Half Cover there and your Nature’s Ward resistance.', { time: 'Action', resource: 'wild-shape' })
    ] }
  });

  /* ---------- Fighter ---------- */
  res('fighter', 'second-wind').uses = T({ 1: 2, 4: 3, 10: 4 });
  res('fighter', 'action-surge').uses = T({ 1: 0, 2: 1, 17: 2 });
  byId.fighter.masteryCount = T({ 1: 3, 4: 4, 10: 5, 16: 6 });
  add('fighter', {
    asiLevels: [4, 6, 8, 12, 14, 16, 19],
    features: ASI([6, 8, 12, 14, 16]).concat([
      F(9, 'Indomitable', 'If you fail a saving throw, you can reroll it with a bonus equal to your Fighter level. Once per Long Rest (twice from level 13, three times from level 17).', { time: 'Other', resource: 'indomitable' }),
      F(9, 'Tactical Master', 'When you attack with a weapon whose mastery you can use, you can replace its mastery with Push, Sap or Slow for that attack.'),
      F(11, 'Two Extra Attacks', 'You can attack three times instead of once whenever you take the Attack action on your turn.'),
      F(13, 'Studied Attacks', 'If you miss a creature with an attack roll, you have Advantage on your next attack roll against it before the end of your next turn.'),
      F(17, 'Action Surge (two uses)', 'You can use Action Surge twice before a rest, but only once on a turn.'),
      BOON,
      F(20, 'Three Extra Attacks', 'You can attack four times instead of once whenever you take the Attack action on your turn.')
    ]),
    resources: [{ id: 'indomitable', name: 'Indomitable', recharge: 'long', uses: T({ 1: 0, 9: 1, 13: 2, 17: 3 }) }],
    grantsAt: [{ level: 11, grants: { attacks: 3 } }, { level: 20, grants: { attacks: 4 } }],
    sub: {
      choices: [{ id: 'champion-style', level: 7, name: 'Additional Fighting Style', help: 'Pick a second Fighting Style.', options: byId.fighter.choices[0].options }],
      grantsAt: [{ level: 15, grants: { critRange: 18 } }],
      features: [
        F(7, 'Additional Fighting Style', 'You gain another Fighting Style feat of your choice.'),
        F(10, 'Heroic Warrior', 'During combat, you can give yourself Heroic Inspiration whenever you start your turn without it.'),
        F(15, 'Superior Critical', 'Your attack rolls with weapons and Unarmed Strikes score a Critical Hit on a roll of 18–20.'),
        F(18, 'Survivor', 'You have Advantage on death saving throws, and when you start your turn Bloodied (but above 0 HP), you regain 5 + CON modifier HP.')
      ]
    }
  });

  /* ---------- Monk ---------- */
  res('monk', 'focus').uses = T({ 1: 0, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20 });
  byId.monk.scaling.martial = dice({ 1: [1, 6], 5: [1, 8], 11: [1, 10], 17: [1, 12] });
  byId.monk.features[0].text = byId.monk.features[0].text.replace('1d8 from level 5', '1d8 from level 5, 1d10 from 11, 1d12 from 17');
  add('monk', {
    features: ASI([8, 12, 16]).concat([
      F(6, 'Empowered Strikes', 'Whenever you deal damage with an Unarmed Strike, it can be Force damage or its normal type.'),
      F(7, 'Evasion', 'When an effect lets you make a DEX save for half damage, you take no damage on a success and half on a failure (unless Incapacitated).'),
      F(9, 'Acrobatic Movement', 'While wearing no armor or shield, you can move along vertical surfaces and across liquids on your turn without falling.'),
      F(10, 'Heightened Focus', 'Flurry of Blows makes three Unarmed Strikes; Patient Defense also gives Temporary HP (two Martial Arts dice); Step of the Wind lets you carry a willing ally.'),
      F(10, 'Self-Restoration', 'At the end of each of your turns you can end one Charmed, Frightened or Poisoned condition on yourself. You don’t suffer Exhaustion from going without food or water.'),
      F(13, 'Deflect Energy', 'Deflect Attacks now works against any damage type, not only Bludgeoning, Piercing and Slashing.'),
      F(14, 'Disciplined Survivor', 'You gain proficiency in all saving throws. When you fail a save, you can spend 1 Focus Point to reroll it.'),
      F(15, 'Perfect Focus', 'When you roll Initiative and have 3 or fewer Focus Points (and don’t use Uncanny Metabolism), you regain points until you have 4.'),
      F(18, 'Superior Defense', 'At the start of your turn you can spend 3 Focus Points to gain Resistance to all damage except Force for 1 minute.', { time: 'Other', resource: 'focus' }),
      BOON,
      F(20, 'Body and Mind', 'Your DEX and WIS scores increase by 4, to a maximum of 25.')
    ]),
    speedBonus: [{ level: 6, amount: 5, unless: 'armor' }, { level: 10, amount: 5, unless: 'armor' }, { level: 14, amount: 5, unless: 'armor' }, { level: 18, amount: 5, unless: 'armor' }],
    grantsAt: [{ level: 14, grants: { saves: ['str', 'dex', 'con', 'int', 'wis', 'cha'] } }, { level: 20, grants: { abilityBonus: { abilities: ['dex', 'wis'], amount: 4, cap: 25 } } }],
    sub: {
      resources: [{ id: 'wholeness-of-body', name: 'Wholeness of Body', recharge: 'long', usesMod: 'wis', fromLevel: 6 }],
      features: [
        F(6, 'Wholeness of Body', 'As a Bonus Action, roll your Martial Arts die and regain that many HP plus your WIS modifier (minimum 1). Uses equal your WIS modifier (minimum 1) per Long Rest.', { time: 'Bonus Action', resource: 'wholeness-of-body', rolls: [['1d{d} + WIS', 'scale:martial', 'wis']] }),
        F(11, 'Fleet Step', 'When you take a Bonus Action other than Step of the Wind, you can also use Step of the Wind immediately after it.'),
        F(17, 'Quivering Palm', 'When you hit with an Unarmed Strike, you can spend 4 Focus Points to start lethal vibrations. Later, as part of the Attack action, end them: the target makes a CON save, taking 10d12 Force damage on a failure or half on a success.', { time: 'Other', resource: 'focus', rolls: [['10d12 Quivering Palm', 10, 12, 0]] })
      ]
    }
  });

  /* ---------- Paladin ---------- */
  res('paladin', 'channel-divinity').uses = T({ 1: 0, 3: 2, 11: 3 });
  add('paladin', {
    features: ASI([8, 12, 16]).concat([
      F(6, 'Aura of Protection', 'You and allies within 10 ft of you add your CHA modifier (minimum +1) to saving throws while you aren’t Incapacitated. The aura grows to 30 ft at level 18.'),
      F(9, 'Abjure Foes', 'As a Magic action, use Channel Divinity: creatures of your choice within 60 ft (up to your CHA modifier) make a WIS save or are Frightened for 1 minute and can only move, act or take a Bonus Action each turn.', { time: 'Action', resource: 'channel-divinity' }),
      F(10, 'Aura of Courage', 'You and allies in your Aura of Protection have Immunity to the Frightened condition.'),
      F(11, 'Radiant Strikes', 'When you hit with a Melee weapon or an Unarmed Strike, the target takes an extra 1d8 Radiant damage.', { time: 'Other', text: 'On every melee hit.', rolls: [['1d8 radiant', 1, 8, 0]] }),
      F(14, 'Restoring Touch', 'When you use Lay on Hands, you can also remove Blinded, Charmed, Deafened, Frightened, Paralyzed or Stunned by spending 5 HP from the pool per condition.'),
      F(18, 'Aura Expansion', 'Your Aura of Protection is now a 30-ft Emanation.'),
      BOON
    ]),
    grantsAt: [{ level: 6, grants: { saveMod: 'cha' } }],
    sub: {
      alwaysPrepared: spells({ 9: ['beacon-of-hope', 'dispel-magic'], 13: ['freedom-of-movement', 'guardian-of-faith'], 17: ['commune', 'flame-strike'] }),
      features: [
        F(7, 'Aura of Devotion', 'You and allies in your Aura of Protection have Immunity to the Charmed condition.'),
        F(15, 'Smite of Protection', 'Whenever you cast Divine Smite, you and allies in your aura have Half Cover until the start of your next turn.'),
        F(20, 'Holy Nimbus', 'As a Bonus Action, for 10 minutes your aura shines with holy light: you have Advantage on saves against Fiends and Undead, enemies starting their turn in it take Radiant damage equal to your CHA modifier + proficiency bonus, and it sheds Bright Light. Once per Long Rest (or spend a 5th-level slot).', { time: 'Bonus Action' })
      ]
    }
  });

  /* ---------- Ranger ---------- */
  res('ranger', 'favored-enemy').uses = T({ 1: 2, 5: 3, 9: 4, 13: 5, 17: 6 });
  add('ranger', {
    features: ASI([8, 12, 16]).concat([
      F(6, 'Roving', 'Your Speed increases by 10 ft while you aren’t wearing Heavy armor, and you have a Climb Speed and a Swim Speed equal to your Speed.'),
      F(9, 'Expertise', 'You gain Expertise in two of your skill proficiencies.'),
      F(10, 'Tireless', 'As a Magic action, gain Temporary HP equal to 1d8 + WIS modifier (uses: WIS modifier per Long Rest). Each Short Rest reduces your Exhaustion by 1.', { time: 'Action', resource: 'tireless', rolls: [['1d8 + WIS temp HP', 1, 8, 'wis']] }),
      F(13, 'Relentless Hunter', 'Taking damage can’t break your Concentration on Hunter’s Mark.'),
      F(14, 'Nature’s Veil', 'As a Bonus Action, you become Invisible until the end of your next turn. Uses: WIS modifier per Long Rest.', { time: 'Bonus Action', resource: 'natures-veil' }),
      F(17, 'Precise Hunter', 'You have Advantage on attack rolls against the creature marked by your Hunter’s Mark.'),
      F(18, 'Feral Senses', 'You have Blindsight with a range of 30 ft.'),
      BOON,
      F(20, 'Foe Slayer', 'The damage die of your Hunter’s Mark is a d10 instead of a d6.')
    ]),
    speedBonus: [{ level: 6, amount: 10, unless: 'heavy' }],
    resources: [
      { id: 'tireless', name: 'Tireless', recharge: 'long', usesMod: 'wis', fromLevel: 10 },
      { id: 'natures-veil', name: 'Nature’s Veil', recharge: 'long', usesMod: 'wis', fromLevel: 14 }
    ],
    levelPicks: [{ level: 9, kind: 'expertise', count: 2, label: 'Expertise', help: 'Pick two of your skills: your proficiency bonus is doubled for them.' }],
    sub: {
      choices: [
        { id: 'defensive-tactics', level: 7, name: 'Defensive Tactics', help: 'Pick a defensive technique. You can change it after a Short or Long Rest.',
          options: [
            { id: 'escape-the-horde', name: 'Escape the Horde', text: 'Opportunity Attacks have Disadvantage against you.' },
            { id: 'multiattack-defense', name: 'Multiattack Defense', text: 'When a creature hits you, you gain a +4 bonus to AC against its other attacks for the rest of the turn.' }
          ] }
      ],
      features: [
        F(7, 'Defensive Tactics', 'You gain Escape the Horde or Multiattack Defense (your choice).'),
        F(11, 'Superior Hunter’s Prey', 'Once per turn when you deal damage to a creature marked by your Hunter’s Mark, you can also deal the extra mark damage to a different creature you can see within 30 ft of it.'),
        F(15, 'Superior Hunter’s Defense', 'When you take damage, you can use your Reaction to gain Resistance to that damage and any other damage of the same type until the end of the turn.', { time: 'Reaction', text: 'When you take damage.' })
      ]
    }
  });

  /* ---------- Rogue ---------- */
  byId.rogue.scaling.sneak = dice({ 1: [1, 6], 3: [2, 6], 5: [3, 6], 7: [4, 6], 9: [5, 6], 11: [6, 6], 13: [7, 6], 15: [8, 6], 17: [9, 6], 19: [10, 6] });
  byId.rogue.features[1].text = byId.rogue.features[1].text.replace('(1d6, 2d6 from level 3, 3d6 from level 5)', '(1d6, plus 1d6 every odd level, up to 10d6 at level 19)');
  byId.rogue.masteryCount = T({ 1: 2 });
  add('rogue', {
    asiLevels: [4, 8, 10, 12, 16, 19],
    features: ASI([8, 10, 12, 16]).concat([
      F(6, 'Expertise', 'You gain Expertise in two more of your skill proficiencies.'),
      F(7, 'Evasion', 'When an effect lets you make a DEX save for half damage, you take no damage on a success and half on a failure (unless Incapacitated).'),
      F(7, 'Reliable Talent', 'Whenever you make an ability check that uses a skill or tool you are proficient with, you can treat a d20 roll of 9 or lower as a 10.'),
      F(11, 'Improved Cunning Strike', 'You can use up to two Cunning Strike effects when you deal Sneak Attack damage, paying the die cost for each.'),
      F(14, 'Devious Strikes', 'New Cunning Strike options: Daze (2d6: CON save or only one of move/action/bonus action), Knock Out (6d6: CON save or Unconscious for 1 minute) and Obscure (3d6: DEX save or Blinded).'),
      F(15, 'Slippery Mind', 'You gain proficiency in WIS and CHA saving throws.'),
      F(18, 'Elusive', 'No attack roll can have Advantage against you unless you are Incapacitated.'),
      BOON,
      F(20, 'Stroke of Luck', 'If you fail a d20 Test, you can turn the roll into a 20. Once per Short or Long Rest.', { time: 'Other', resource: 'stroke-of-luck' })
    ]),
    resources: [{ id: 'stroke-of-luck', name: 'Stroke of Luck', recharge: 'short', uses: T({ 1: 0, 20: 1 }) }],
    levelPicks: [{ level: 6, kind: 'expertise', count: 2, label: 'Expertise', help: 'Pick two more of your skills: your proficiency bonus is doubled for them.' }],
    grantsAt: [{ level: 15, grants: { saves: ['wis', 'cha'] } }],
    sub: { features: [
      F(9, 'Supreme Sneak', 'You gain the Stealth Attack Cunning Strike option (1d6): if you have the Invisible condition from Hide, this attack doesn’t end it if you end the turn behind cover.'),
      F(13, 'Use Magic Device', 'You can attune to up to four magic items, ignore class requirements on them, and have a chance not to expend a charge or a scroll.'),
      F(17, 'Thief’s Reflexes', 'You take two turns during the first round of any combat: your normal turn and another at your Initiative minus 10.')
    ] }
  });

  /* ---------- Sorcerer ---------- */
  res('sorcerer', 'sorcery-points').uses = T({ 1: 0, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20 });
  res('sorcerer', 'sorcery-points').shortRestBy = T({ 1: 0, 5: 2, 6: 3, 8: 4, 10: 5, 12: 6, 14: 7, 16: 8, 18: 9, 20: 10 });
  byId.sorcerer.choices.find(function (q) { return q.id === 'metamagic'; }).count = T({ 1: 0, 2: 2, 10: 4, 17: 6 });
  add('sorcerer', {
    features: ASI([8, 12, 16]).concat([
      F(7, 'Sorcery Incarnate', 'If you have no Innate Sorcery uses left, you can spend 2 Sorcery Points to activate it. While it is active, you can use up to two Metamagic options on each spell.'),
      F(10, 'Metamagic', 'You learn two more Metamagic options (and two more at level 17).'),
      BOON,
      F(20, 'Arcane Apotheosis', 'While Innate Sorcery is active, you can use one Metamagic option on each of your turns without spending Sorcery Points.')
    ]),
    sub: {
      alwaysPrepared: spells({ 7: ['arcane-eye', 'charm-monster'], 9: ['legend-lore', 'summon-dragon'] }),
      choices: [{ id: 'elemental-affinity', level: 6, name: 'Elemental Affinity', help: 'Pick the damage type of your draconic ancestor.',
        options: ['acid', 'cold', 'fire', 'lightning', 'poison'].map(function (t) { var T2 = t.charAt(0).toUpperCase() + t.slice(1); return { id: t, name: T2, text: 'Resistance to ' + T2 + ' damage, and add your CHA modifier to one damage roll of a spell that deals ' + T2 + ' damage.', grants: { defenses: [{ kind: 'resist', text: T2 }] } }; }) }],
      features: [
        F(6, 'Elemental Affinity', 'Your draconic magic has an affinity with a damage type: you have Resistance to it, and you add your CHA modifier to one damage roll of any spell you cast that deals that type.'),
        F(14, 'Dragon Wings', 'As a Bonus Action, sprout draconic wings for 1 hour: you gain a Fly Speed of 60 ft. Once per Long Rest, or spend 3 Sorcery Points.', { time: 'Bonus Action' }),
        F(18, 'Dragon Companion', 'You can cast Summon Dragon without its material component, and once per Long Rest without a spell slot; it lasts 1 minute without needing Concentration.')
      ]
    }
  });

  /* ---------- Warlock ---------- */
  byId.warlock.choices[0].count = T({ 1: 1, 2: 3, 5: 5, 7: 6, 9: 7, 12: 8, 15: 9, 18: 10 });
  add('warlock', {
    features: ASI([8, 12, 16]).concat([
      F(9, 'Contact Patron', 'You always have Contact Other Plane prepared, and you can cast it once per Long Rest without a slot; you automatically succeed on its save.'),
      F(11, 'Mystic Arcanum', 'Your patron grants you one 6th-level Warlock spell, which you can cast once per Long Rest without a slot. You gain a 7th-level one at 13, 8th at 15 and 9th at 17.'),
      BOON,
      F(20, 'Eldritch Master', 'When you use Magical Cunning, you regain all your expended Pact Magic slots.')
    ]),
    alwaysPrepared: [{ level: 9, spell: 'contact-other-plane' }],
    levelPicks: [6, 7, 8, 9].map(function (sl, i) { return { level: [11, 13, 15, 17][i], kind: 'arcanum', spellLevel: sl, count: 1, label: 'Mystic Arcanum (' + sl + 'th level)', help: 'Pick one ' + sl + 'th-level Warlock spell. You can cast it once per Long Rest without a spell slot.' }; }),
    sub: {
      alwaysPrepared: spells({ 7: ['fire-shield', 'wall-of-fire'], 9: ['geas', 'insect-plague'] }),
      features: [
        F(6, 'Dark One’s Own Luck', 'When you make an ability check or saving throw, you can add 1d10 to it after seeing the roll. Uses: CHA modifier (minimum 1) per Long Rest.', { time: 'Other', resource: 'dark-ones-luck', rolls: [['1d10 luck', 1, 10, 0]] }),
        F(10, 'Fiendish Resilience', 'After a Short or Long Rest, choose a damage type other than Force: you have Resistance to it until you choose another.'),
        F(14, 'Hurl Through Hell', 'Once per turn when you hit a creature with an attack roll, it makes a CHA save or vanishes through the lower planes until the end of your next turn, taking 8d10 Psychic damage when it returns (non-Fiends). Once per Long Rest, or spend a Pact slot.', { time: 'Other', rolls: [['8d10 psychic', 8, 10, 0]] })
      ],
      resources: [{ id: 'dark-ones-luck', name: 'Dark One’s Own Luck', recharge: 'long', usesMod: 'cha', fromLevel: 6 }]
    }
  });

  /* ---------- Wizard ---------- */
  add('wizard', {
    features: ASI([8, 12, 16]).concat([
      F(18, 'Spell Mastery', 'Choose a 1st-level and a 2nd-level spell in your spellbook that take an action. You always have them prepared and can cast them at their lowest level without a slot.'),
      BOON,
      F(20, 'Signature Spells', 'Choose two 3rd-level spells in your spellbook. You always have them prepared and can cast each once at 3rd level without a slot, regaining them on a Short or Long Rest.')
    ]),
    sub: { features: [
      F(6, 'Sculpt Spells', 'When you cast an Evocation spell that affects other creatures you can see, choose up to 1 + the spell’s level of them: they automatically succeed on its save and take no damage if they would take half.'),
      F(10, 'Empowered Evocation', 'Whenever you cast a Wizard Evocation spell, you can add your INT modifier to one damage roll of it.'),
      F(14, 'Overchannel', 'When you cast a Wizard spell of 1st–5th level that deals damage, you can deal maximum damage with it. Using it again before a Long Rest deals Necrotic damage to you that grows each time.')
    ] }
  });

  /* ---------- Epic Boons (feats at level 19) ---------- */
  var ANY = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  function boon(id, name, pitch, text, asi) { return { id: id, name: name, category: 'epic', pitch: pitch, text: text, asi: asi || ANY, asiCap: 30, prereq: { level: 19 } }; }
  CF.content.extendPack('srd-5.2', {
    feats: [
      boon('boon-of-combat-prowess', 'Boon of Combat Prowess', 'Turn one miss per turn into a hit; +1 to any score.', 'Increase one ability score by 1 (max 30). Peerless Aim: when you miss with an attack roll, you can hit instead. Once per turn.'),
      boon('boon-of-dimensional-travel', 'Boon of Dimensional Travel', 'Teleport 30 ft after attacking or casting; +1 to any score.', 'Increase one ability score by 1 (max 30). Blink Steps: immediately after you take the Attack action or the Magic action, you can teleport up to 30 ft to a space you can see.'),
      boon('boon-of-fate', 'Boon of Fate', 'Bend a d20 roll by 2d4; +1 to any score.', 'Increase one ability score by 1 (max 30). Improve Fate: when you or a creature within 60 ft succeeds or fails a d20 Test, roll 2d4 and add or subtract it. Once per Initiative roll or Short/Long Rest.'),
      boon('boon-of-irresistible-offense', 'Boon of Irresistible Offense', 'Your weapon damage ignores resistance; +1 STR or DEX.', 'Increase STR or DEX by 1 (max 30). Your Bludgeoning, Piercing and Slashing damage always ignores Resistance. Overwhelming Strike: on a natural 20, deal extra damage equal to the score you increased.', ['str', 'dex']),
      boon('boon-of-spell-recall', 'Boon of Spell Recall', 'Cast one 1st–4th level spell free per day; +1 INT, WIS or CHA.', 'Increase INT, WIS or CHA by 1 (max 30). Free Casting: once per Long Rest, cast a spell you have prepared using a level 1–4 slot without expending the slot.', ['int', 'wis', 'cha']),
      boon('boon-of-the-night-spirit', 'Boon of the Night Spirit', 'Vanish into darkness; resist damage in the dark; +1 to any score.', 'Increase one ability score by 1 (max 30). Merge with Shadows: in Dim Light or Darkness, give yourself the Invisible condition as a Bonus Action. Shadowy Form: while in Dim Light or Darkness, you have Resistance to all damage except Psychic and Radiant.'),
      boon('boon-of-truesight', 'Boon of Truesight', 'Truesight 60 ft; +1 to any score.', 'Increase one ability score by 1 (max 30). You have Truesight with a range of 60 ft.')
    ]
  });
})();
