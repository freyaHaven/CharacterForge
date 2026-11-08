/* Character Forge — rules engine. Turns a saved character (choices only) into everything the sheet shows. */
(function (root) {
  'use strict';
  var CF = root.CF, U = CF.util, R = CF.rules, C = CF.content;

  var SKILL_BY_ID = {};
  R.SKILLS.forEach(function (s) { SKILL_BY_ID[s.id] = s; });
  R.skill = function (id) { return SKILL_BY_ID[id]; };
  R.LANGUAGES.druidic = 'Druidic';
  R.LANGUAGES['thieves-cant'] = 'Thieves’ Cant';

  R.profBonus = function (level) { return 2 + Math.floor((level - 1) / 4); };

  /** A new, empty character in the save format. */
  /** 5e (2014) rule options: ability bonuses from species, no origin feat from the background, background features. */
  R.isOld = function (ch) { return !!ch && ch.rules === '2014'; };
  R.asiOptions = function (ch, bg) { return R.isOld(ch) || !bg ? R.ABILITIES.map(function (a) { return a.id; }) : bg.abilityOptions; };
  R.backgroundFeature = function (ch, bg, on) {
    if (!R.isOld(ch) || !bg) return null;
    var alt = ch.background && ch.background.feature;
    if (alt) { var f = C.get('backgroundFeatures', alt, on); if (f) return f; }
    return bg.feature || null;
  };
  /** A background's skills: the fixed ones plus what the player picked from its skill choice (if it has one). */
  R.bgSkills = function (ch, bg) {
    if (!bg) return [];
    var fixed = bg.skills || [], c = bg.skillChoice;
    if (!c) return fixed;
    var picked = ((ch && ch.background && ch.background.skills) || []).filter(function (s) { return c.from.indexOf(s) >= 0 && fixed.indexOf(s) < 0; }).slice(0, c.count);
    return fixed.concat(picked);
  };
  /** Tools you can pick with the Skilled feat, grouped for display. */
  R.skilledTools = function (on) {
    var tools = C.all('items', on).filter(function (i) { return i.kind === 'tool'; });
    var groups = [['artisan', 'Artisan’s tools'], ['musical-instrument', 'Musical instruments'], ['gaming-set', 'Gaming sets'], ['', 'Other tools']];
    return groups.map(function (g) { return [g[1], tools.filter(function (t) { return (t.toolGroup || '') === g[0] || (!g[0] && ['artisan', 'musical-instrument', 'gaming-set'].indexOf(t.toolGroup) < 0); }).sort(function (a, b) { return a.name.localeCompare(b.name); })]; }).filter(function (g) { return g[1].length; });
  };
  /** Spells a feat lets you choose from (one block of its "spells"). */
  R.featSpellChoices = function (block, on) {
    if (block.from) return block.from.map(function (id) { return C.get('spells', id, on); }).filter(Boolean);
    return C.all('spells', on).filter(function (s) {
      return s.level >= (block.minLevel || 0) && s.level <= (block.maxLevel === undefined ? 9 : block.maxLevel) &&
        (!block.lists || block.lists.some(function (l) { return (s.classes || []).indexOf(l) >= 0; })) &&
        (!block.schools || block.schools.indexOf(s.school) >= 0) && (!block.ritual || s.ritual);
    }).sort(function (a, b) { return a.level - b.level || a.name.localeCompare(b.name); });
  };
  /** What still needs choosing for a feat, given its picks. */
  R.featPicksMissing = function (feat, picks) {
    picks = picks || {}; var miss = [];
    if (!feat) return miss;
    if (feat.options && !picks.option) miss.push(feat.name + ': choose an option');
    (feat.spells || []).forEach(function (b, bi) { if (!b.fixed && ((picks.spells || {})[bi] || []).length < (b.count || 1)) miss.push(feat.name + ': choose ' + b.label); });
    return miss;
  };
  /** A line for the sheet saying what was chosen for a feat. */
  R.featPickText = function (feat, picks) {
    if (!feat || !picks) return '';
    var out = [];
    if (feat.options && picks.option) { var o = feat.options.find(function (x) { return x.id === picks.option; }); if (o) out.push('Chosen: ' + o.name + (o.text ? '. ' + o.text : '')); }
    return out.length ? '\n' + out.join('\n') : '';
  };
  R.blankCharacter = function () {
    return {
      schema: 'character-forge/character@1', id: U.uid(), name: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      rules: '2024', modules: ['srd-5.2'],
      species: null, background: null, classes: [],
      abilities: { method: 'standard', base: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } },
      feats: [], magicInitiate: [], skilled: [], languages: ['common'], tools: [],
      spells: { prepared: [] },
      inventory: [], currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
      details: { alignment: '', appearance: '', backstory: '' },
      play: R.freshPlayState()
    };
  };

  R.freshPlayState = function () {
    return { hpLost: 0, temp: 0, inspiration: false, conditions: [], deathSaves: { s: 0, f: 0 }, slotsUsed: {}, resourcesUsed: {}, hdUsed: 0, notes: '' };
  };

  /** Does a class weapon-proficiency entry cover this weapon? */
  R.weaponAllowed = function (profs, d) {
    return profs.some(function (p) {
      if (p === d.category) return true;
      var props = d.props || [];
      if (p === 'martial-light') return d.category === 'martial' && props.indexOf('light') >= 0;
      if (p === 'martial-finesse-light') return d.category === 'martial' && (props.indexOf('light') >= 0 || props.indexOf('finesse') >= 0);
      return false;
    });
  };

  /** Class + subclass choices available at a level (fighting style, invocations, land type…). */
  R.classChoices = function (def, sub, lv) {
    return (def.choices || []).concat((sub && sub.choices) || []).filter(function (q) { return (q.level || 1) <= lv; });
  };
  /** How many options a choice allows at a level (most allow one). */
  R.choiceCount = function (q, lv) { return q.count ? q.count[Math.min(q.count.length, lv) - 1] || 0 : 1; };
  /** Class + subclass features up to a level, each tagged with where it comes from. */
  R.classFeatures = function (def, sub, lv) {
    var out = (def.features || []).filter(function (f) { return f.level <= lv; }).map(function (f) { return Object.assign({ from: def.name + ' ' + f.level }, f); });
    if (sub) out = out.concat((sub.features || []).filter(function (f) { return f.level <= lv; }).map(function (f) { return Object.assign({ from: sub.name + ' ' + f.level, fromSub: true }, f); }));
    return out.sort(function (a, b) { return a.level - b.level; });
  };
  /** Level picks (expertise, skills, languages) from class and subclass, for one level. */
  R.levelPicks = function (def, sub, level) {
    return (def.levelPicks || []).concat((sub && sub.levelPicks) || []).filter(function (p) { return p.level === level; });
  };

  /** Derive the full sheet. Never mutates the character. */
  R.derive = function (ch) {
    var on = C.on(ch);
    var get = function (section, id) { return id ? C.get(section, id, on) : null; };

    var cls = (ch.classes || []).map(function (c) {
      var def = get('classes', c.id); if (!def) return null;
      var lv = c.level || 1;
      var sub = c.subclass && lv >= (def.subclassLevel || 3) ? (def.subclasses || []).find(function (x) { return x.id === c.subclass; }) || null : null;
      return { pick: c, def: def, lv: lv, sub: sub };
    }).filter(Boolean);
    var level = cls.reduce(function (a, c) { return a + (c.pick.level || 1); }, 0) || 1;
    var main = cls[0] || null;
    var pb = R.profBonus(level);

    var species = ch.species ? get('species', ch.species.id) : null;
    var lineage = species && ch.species.lineage ? (species.lineages || []).find(function (l) { return l.id === ch.species.lineage; }) : null;
    var bg = ch.background ? get('backgrounds', ch.background.id) : null;

    /* class choices (fighting style, divine order…) collect into one "grants" object */
    var grants = { armor: [], weapons: [], extraCantrips: 0, rangedHit: 0, armoredAC: 0, twfMod: false, checkBonus: [], spells: [], unarmoredDefense: null, hpPerLevel: 0, critRange: 20, agonizing: false, extraAttack: false, saves: [], saveMod: null, abilityBonus: [], attacks: 1, defenses: [], cantripMod: false, speed: 0 };
    var addGrants = function (g, lv) {
      g = g || {};
      grants.armor = grants.armor.concat(g.armor || []);
      grants.weapons = grants.weapons.concat(g.weapons || []);
      grants.extraCantrips += g.extraCantrips || 0;
      grants.rangedHit += g.rangedHit || 0;
      grants.armoredAC += g.armoredAC || 0;
      if (g.twfMod) grants.twfMod = true;
      if (g.checkBonus) grants.checkBonus.push(g.checkBonus);
      grants.spells = grants.spells.concat((g.spells || []).filter(function (s) { return s.level <= lv; }));
      if (g.unarmoredDefense) grants.unarmoredDefense = g.unarmoredDefense;
      if (g.hpPerLevel) grants.hpPerLevel += g.hpPerLevel * lv;
      if (g.critRange) grants.critRange = Math.min(grants.critRange, g.critRange);
      if (g.agonizing) grants.agonizing = true;
      if (g.extraAttack) grants.extraAttack = true;
      if (g.saves) grants.saves = grants.saves.concat(g.saves);
      if (g.saveMod) grants.saveMod = g.saveMod;
      if (g.abilityBonus) grants.abilityBonus.push(g.abilityBonus);
      if (g.attacks) grants.attacks = Math.max(grants.attacks, g.attacks);
      if (g.defenses) grants.defenses = grants.defenses.concat(g.defenses);
      if (g.cantripMod) grants.cantripMod = true;
      if (g.speed) grants.speed += g.speed;
    };
    var choiceInfo = [];
    cls.forEach(function (c) {
      R.classChoices(c.def, c.sub, c.lv).forEach(function (q) {
        var picked = (c.pick.choices || {})[q.id];
        var ids = Array.isArray(picked) ? picked : picked ? [picked] : [];
        ids.forEach(function (id) {
          var opt = (q.options || []).find(function (o) { return o.id === id; });
          if (!opt) return;
          choiceInfo.push({ name: q.name + ': ' + opt.name.replace(/ \(\d SP\)$/, ''), from: (c.sub && (c.sub.choices || []).indexOf(q) >= 0 ? c.sub.name : c.def.name) + ' ' + (q.level || 1), text: opt.text });
          addGrants(opt.grants, c.lv);
        });
      });
      if (c.sub) addGrants(c.sub.grants, c.lv);
      (c.def.grantsAt || []).concat((c.sub && c.sub.grantsAt) || []).forEach(function (x) { if (c.lv >= x.level) addGrants(x.grants, c.lv); });
    });

    /* ability scores */
    var scores = {}, mods = {}, bonus = (ch.background && ch.background.asi) || {};
    var levelFeats = [];   // {feat, level, cls, skills}
    var lvlAsi = {}, epicAsi = {};
    cls.forEach(function (c) {
      Object.keys(c.pick.asi || {}).forEach(function (L) {
        if (+L > c.lv) return;
        var x = c.pick.asi[L] || {};
        var fd = x.feat && get('feats', x.feat), bag = fd && fd.asiCap > 20 ? epicAsi : lvlAsi;
        Object.keys(x.asi || {}).forEach(function (k) { bag[k] = (bag[k] || 0) + (x.asi[k] || 0); });
        if (x.feat) levelFeats.push({ feat: x.feat, level: +L, cls: c.def.name, clsId: c.def.id, skills: x.skills || [], picks: { option: x.option, spells: x.spells, ability: x.spellAbility } });
      });
    });
    R.ABILITIES.forEach(function (a) {
      var sc0 = Math.min(20, (ch.abilities.base[a.id] || 10) + (bonus[a.id] || 0) + ((ch.abilities.extra || {})[a.id] || 0) + (lvlAsi[a.id] || 0));
      grants.abilityBonus.forEach(function (b) { if (b.abilities.indexOf(a.id) >= 0) sc0 = Math.max(sc0, Math.min(b.cap, sc0 + b.amount)); });   // capstones like Primal Champion
      if (epicAsi[a.id]) sc0 = Math.min(30, sc0 + epicAsi[a.id]);
      scores[a.id] = sc0;
      mods[a.id] = U.mod(scores[a.id]);
    });

    /* saves */
    var saveProf = {};
    if (main) (main.def.saves || []).forEach(function (s) { saveProf[s] = true; });
    grants.saves.forEach(function (s) { saveProf[s] = true; });
    var auraBonus = grants.saveMod ? Math.max(1, mods[grants.saveMod]) : 0;
    var saves = R.ABILITIES.map(function (a) {
      return { id: a.id, abbr: a.abbr, name: a.name, prof: !!saveProf[a.id], bonus: mods[a.id] + (saveProf[a.id] ? pb : 0) + auraBonus };
    });

    /* skills: 1 = proficient, 2 = expertise */
    var skillProf = {}, skillFrom = {};
    var addSkill = function (id, from) { if (!id || !SKILL_BY_ID[id]) return; skillProf[id] = Math.max(skillProf[id] || 0, 1); skillFrom[id] = skillFrom[id] || from; };
    cls.forEach(function (c) { (c.pick.skills || []).forEach(function (s) { addSkill(s, c.def.name); }); });
    if (bg) R.bgSkills(ch, bg).forEach(function (s) { addSkill(s, bg.name); });
    if (ch.species && ch.species.keenSense) addSkill(ch.species.keenSense, 'Keen Senses');
    if (ch.species && ch.species.skill) addSkill(ch.species.skill, 'Skillful');
    var skilledTools = [];
    (ch.skilled || []).concat(ch.skilledBg || []).forEach(function (s) { if (SKILL_BY_ID[s]) addSkill(s, 'Skilled'); else skilledTools.push(s); });
    cls.forEach(function (c) { (c.pick.extraSkills || []).forEach(function (s) { addSkill(s, c.def.name); }); });
    levelFeats.forEach(function (f) { f.skills.forEach(function (s) { if (SKILL_BY_ID[s]) addSkill(s, 'Skilled'); else skilledTools.push(s); }); });
    var jack = main && main.def.jackOfAllTrades && main.lv >= main.def.jackOfAllTrades ? Math.floor(pb / 2) : 0;
    var expertise = (ch.expertise || []).concat(cls.reduce(function (a, c) { return a.concat(c.pick.expertise || []); }, []));
    expertise.forEach(function (s) { if (skillProf[s]) skillProf[s] = 2; });
    var skills = R.SKILLS.map(function (s) {
      var p = skillProf[s.id] || 0;
      var extra = grants.checkBonus.reduce(function (a, cb) { return a + (cb.skills.indexOf(s.id) >= 0 ? Math.max(1, mods[cb.mod]) : 0); }, 0);
      return { id: s.id, name: s.name, ability: s.ability, abbr: s.ability.toUpperCase(), prof: p, from: skillFrom[s.id] || '', bonus: mods[s.ability] + (p ? p * pb : jack) + extra };
    });
    var skillBonus = function (id) { var s = skills.find(function (x) { return x.id === id; }); return s ? s.bonus : 0; };

    /* inventory */
    var inv = (ch.inventory || []).map(function (e) {
      var def = get('items', e.item) || { id: e.item, name: e.name || e.item, kind: 'gear', w: e.w || 0, c: e.c || 0 };
      return Object.assign({}, e, { def: def });
    });
    var equipped = inv.filter(function (e) { return e.equipped; });

    /* armor class */
    var armorProf = (main ? main.def.armor || [] : []).concat(grants.armor);
    var body = equipped.find(function (e) { return e.def.kind === 'armor' && e.def.armor !== 'shield'; });
    var shield = equipped.find(function (e) { return e.def.armor === 'shield'; });
    var ac, acNote = '';
    var ud = (main && main.def.unarmoredDefense) || grants.unarmoredDefense;
    if (!body) {
      if (ud && !(ud === 'wis' && shield)) { ac = 10 + mods.dex + mods[ud]; acNote = main.def.unarmoredDefense ? 'Unarmored Defense' : 'Draconic Resilience'; }
      else { ac = 10 + mods.dex; acNote = 'Unarmored'; }
    } else {
      if (body.def.armor === 'light') ac = body.def.ac + mods.dex;
      else if (body.def.armor === 'medium') ac = body.def.ac + Math.min(2, mods.dex);
      else ac = body.def.ac;
      ac += grants.armoredAC;
      if (armorProf.indexOf(body.def.armor) < 0) acNote = 'Not proficient with this armor';
    }
    if (shield) ac += shield.def.ac;

    /* hit points: max at level 1, then average per level */
    var hpMax = 0;
    cls.forEach(function (c, i) {
      var hd = c.def.hitDie, lv = c.lv, rolls = c.pick.hp || {};
      for (var l = 1; l <= lv; l++) {
        var gain = i === 0 && l === 1 ? hd : rolls[l] != null ? rolls[l] : hd / 2 + 1;
        hpMax += Math.max(1, gain + mods.con);
      }
    });
    if (species && species.hpPerLevel) hpMax += species.hpPerLevel * level;
    hpMax += grants.hpPerLevel;
    hpMax = Math.max(1, hpMax);
    var play = ch.play || R.freshPlayState();
    var hp = Math.max(0, hpMax - (play.hpLost || 0));

    /* speed & senses */
    var speed = (lineage && lineage.speed) || (species && species.speed) || 30;
    if (main) (main.def.speedBonus || []).forEach(function (b) {
      if (main.lv < b.level) return;
      if (b.unless === 'heavy' && body && body.def.armor === 'heavy') return;
      if (b.unless === 'armor' && (body || shield)) return;
      speed += b.amount;
    });
    speed += grants.speed;
    var darkvision = (lineage && lineage.senses && lineage.senses.darkvision) || (species && species.senses && species.senses.darkvision) || 0;
    var feats = (ch.feats || []).concat(levelFeats.map(function (l) { return l.feat; })).map(function (id) { return get('feats', id); }).filter(Boolean);
    var hasFeat = function (id) { return feats.some(function (f) { return f.id === id; }); };

    /* weapons & attacks */
    var weaponProf = (main ? main.def.weapons || [] : []).concat(grants.weapons);
    var masteries = cls.reduce(function (a, c) { return a.concat(c.pick.masteries || []); }, []);
    var martialArts = main && main.def.martialArts;
    var scaleOf = function (key) { var t = main && ((main.def.scaling && main.def.scaling[key]) || (main.sub && main.sub.scaling && main.sub.scaling[key])); return t ? t[Math.min(t.length, main.lv) - 1] : null; };
    var maDie = martialArts ? (scaleOf('martial') || [1, martialArts.die])[1] : 0;
    var monkWeapon = function (d) { return martialArts && (d.category === 'simple' || (d.props || []).indexOf('light') >= 0) && d.attack === 'melee'; };
    var attackFor = function (w, opts) {
      opts = opts || {};
      var d = w.def, props = d.props || [];
      var useDex = d.attack === 'ranged' || props.indexOf('finesse') >= 0 || (monkWeapon(d) && !body && !shield);
      var ability = d.attack === 'ranged' ? 'dex' : (useDex && mods.dex >= mods.str ? 'dex' : 'str');
      var proficient = R.weaponAllowed(weaponProf, d);
      var hit = mods[ability] + (proficient ? pb : 0) + (d.attack === 'ranged' ? grants.rangedHit : 0);
      var dmgMod = opts.noMod && !grants.twfMod ? Math.min(0, mods[ability]) : mods[ability];
      var hasMastery = masteries.indexOf(d.id) >= 0 && d.mastery;
      var notes = [d.category === 'martial' ? 'Martial' : 'Simple'].concat(props.map(function (p) { return R.PROPERTY_NAMES[p] || p; }));
      if (d.mastery) notes.push(R.MASTERY[d.mastery] ? R.MASTERY[d.mastery].name : d.mastery);
      if (!proficient) notes.unshift('Not proficient');
      if (grants.critRange < 20) notes.push('Crit ' + grants.critRange + '–20');
      return {
        kind: 'weapon', item: d.id, name: d.name, icon: /bow|crossbow|sling|blowgun|dart/.test(d.id) ? 'bow' : d.id === 'scimitar' ? 'scimitar' : 'shortsword',
        sub: (d.attack === 'ranged' ? 'Ranged weapon' : 'Melee weapon') + (hasMastery ? ' · Mastery' : ''),
        mastery: !!hasMastery, masteryId: d.mastery,
        range: d.attack === 'ranged' && d.range ? { main: d.range[0], long: d.range[1], label: 'Range' } : { main: props.indexOf('reach') >= 0 ? 10 : 5, label: 'Reach', thrown: d.range },
        hit: hit, dice: d.damage, mod: dmgMod, type: d.type, notes: notes.join(', ')
      };
    };
    var weapons = equipped.filter(function (e) { return e.def.kind === 'weapon'; });
    var seenW = {};
    var attacks = weapons.filter(function (w) { if (seenW[w.def.id]) return false; seenW[w.def.id] = 1; return true; }).map(function (w) { return attackFor(w); });
    var uAbility = martialArts && mods.dex > mods.str ? 'dex' : 'str';
    var unarmed = {
      kind: 'unarmed', name: 'Unarmed Strike', icon: 'fist', sub: martialArts ? 'Melee attack · Martial Arts' : 'Melee attack', range: { main: 5, label: 'Reach' },
      hit: mods[uAbility] + pb, type: 'bludgeoning', notes: 'Or Grapple / Shove (DC ' + (8 + mods.str + pb) + ' STR or DEX)'
    };
    if (martialArts) { unarmed.dice = '1d' + maDie; unarmed.mod = mods[uAbility]; } else unarmed.flat = Math.max(1, 1 + mods.str);
    attacks.push(unarmed);
    var light = weapons.filter(function (w) { return (w.def.props || []).indexOf('light') >= 0; });
    var nickW = light.find(function (w) { return w.def.mastery === 'nick' && masteries.indexOf(w.def.id) >= 0; });
    var otherLight = nickW && light.find(function (w) { return w !== nickW; });
    var extraAttack = null;
    if (nickW && otherLight) {
      extraAttack = Object.assign(attackFor(nickW, { noMod: true }), {
        sub: 'Extra attack · Nick · Mastery', notes: 'After attacking with the ' + otherLight.def.name + ' · part of the Attack action' + (grants.twfMod ? '' : ' · no modifier to damage')
      });
    }
    var twoWeapon = light.length >= 2 ? { offhand: light.find(function (w) { return w.def.mastery === 'nick'; }) || light[1] } : null;
    if (twoWeapon) twoWeapon.attack = attackFor(twoWeapon.offhand, { noMod: true });
    var melee = weapons.filter(function (w) { return w.def.attack === 'melee'; })
      .map(function (w) { return attackFor(w); })
      .sort(function (a, b) { return (b.mastery ? 1 : 0) - (a.mastery ? 1 : 0); });
    var opportunity = melee[0] || unarmed;
    var breath = null;
    if (species && species.breathWeapon && lineage) {
      breath = { name: 'Breath Weapon', icon: 'force', sub: lineage.name + ' · replaces one attack', range: { main: '15-ft Cone / 30-ft Line', label: '' }, hit: null,
        dc: 8 + mods.con + pb, dcAbility: 'DEX', dice: '1d10', mod: 0, type: lineage.damageType, notes: 'Half damage on a success · ' + pb + ' uses per Long Rest' };
    }

    /* feats you have, where they came from, and what was chosen for them */
    var featPicks = ch.featPicks || {};
    var featInst = [];
    var bgFeatId = bg && !R.isOld(ch) ? (bg.feat || (ch.background && ch.background.feat)) : null;
    if (bgFeatId) featInst.push({ id: bgFeatId, key: 'background', picks: featPicks.background || {} });
    if (species && species.versatile && ch.species && ch.species.feat) featInst.push({ id: ch.species.feat, key: 'species', picks: featPicks.species || {} });
    levelFeats.forEach(function (f) { featInst.push({ id: f.feat, key: 'lvl-' + f.clsId + '-' + f.level, picks: f.picks || {} }); });
    featInst = featInst.map(function (fi) { fi.def = get('feats', fi.id); return fi; }).filter(function (fi) { return fi.def; });
    var featSpellAbility = function (fi) {
      if (fi.picks.ability) return fi.picks.ability;
      var lvl = /^lvl-/.test(fi.key) ? fi.key.split('-') : null;
      if (lvl) { var c0 = cls.find(function (c) { return c.def.id === lvl[1]; }); var x0 = c0 && (c0.pick.asi || {})[lvl[2]]; var up = x0 && Object.keys(x0.asi || {}).find(function (k) { return ['int', 'wis', 'cha'].indexOf(k) >= 0; }); if (up) return up; }
      return null;
    };

    /* spellcasting */
    var spell = null;
    var sc = main && (main.def.spellcasting || (main.sub && main.sub.spellcasting));   // a subclass can bring its own (Profane Soul, Eldritch Knight…)
    var lv1 = main ? main.lv : 1;
    var lineageCantrips = ((species && species.cantrips) || []).concat((lineage && lineage.cantrips) || []);
    var miPicks = ch.magicInitiate || [];
    var classCantrips = (main && main.pick.cantrips) || [];
    var always = main ? (main.def.alwaysPrepared || []).concat((main.sub && main.sub.alwaysPrepared) || [], grants.spells).filter(function (a) { return a.level <= lv1; }).map(function (a) { return a.spell; }) : [];
    var prepared = (ch.spells && ch.spells.prepared) || [];
    var anySpells = (sc && (classCantrips.length || prepared.length || always.length || Object.keys((main && main.pick.arcanum) || {}).length)) || lineageCantrips.length || miPicks.length || featInst.some(function (fi) { return fi.def.spells; });
    if (anySpells) {
      var highestMental = ['int', 'wis', 'cha'].sort(function (a, b) { return mods[b] - mods[a]; })[0];
      var ab = sc ? sc.ability : (ch.species && ch.species.spellAbility) || highestMental;
      var mk = function (a) { return { ability: a, abbr: a.toUpperCase(), mod: mods[a], dc: 8 + pb + mods[a], attack: pb + mods[a] }; };
      var base = mk(ab);
      var list = [];
      var add = function (id, origin, abil, extra) {
        if (list.some(function (x) { return x.id === id; })) return;
        var s = get('spells', id); if (!s) return;
        var m = mk(abil || ab);
        var e = Object.assign({}, s, { origin: origin, dc: m.dc, spellAttack: m.attack, castMod: m.mod, castAbility: m.abbr }, extra || {});
        if (s.effect) e.effect = Object.assign({}, s.effect);
        var tier = level >= 17 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1;
        if (s.level === 0 && e.effect && e.effect.dice && tier > 1) {
          if (s.id === 'eldritch-blast') e.beams = tier;
          else e.effect.dice = e.effect.dice.replace(/^(\d+)d/, function (all, n) { return (n * tier) + 'd'; });
        }
        if (s.id === 'eldritch-blast' && grants.agonizing) e.effect.addMod = true;
        if (grants.cantripMod && s.level === 0 && e.effect && e.effect.dice && e.effect.type !== 'healing' && /cantrip$/.test(origin)) e.effect.addMod = true;
        list.push(e);
      };
      classCantrips.forEach(function (id) { add(id, main.def.name + ' cantrip'); });
      Object.keys((main && main.pick.arcanum) || {}).forEach(function (L) { if (main.lv >= ({ 6: 11, 7: 13, 8: 15, 9: 17 })[L]) add(main.pick.arcanum[L], 'Mystic Arcanum · once per Long Rest', null, { freeCast: 'arcanum-' + L }); });
      lineageCantrips.forEach(function (id) { add(id, (lineage ? lineage.name : species.name) + ' (species)', (ch.species && ch.species.spellAbility) || ab); });
      always.forEach(function (id) { add(id, 'Always prepared'); });
      prepared.forEach(function (id) { add(id, 'Prepared'); });
      featInst.forEach(function (fi) {
        (fi.def.spells || []).forEach(function (b, bi) {
          var ids = b.fixed ? b.fixed : ((fi.picks.spells || {})[bi] || []);
          ids.forEach(function (id) {
            var s0 = get('spells', id); if (!s0) return;
            var once = b.once && s0.level > 0;
            add(id, fi.def.name + (once ? ' · 1 free cast per Long Rest' : ' (feat)'), featSpellAbility(fi) || highestMental, once ? { freeCast: 'feat-' + fi.key + '-' + id } : null);
          });
        });
      });
      miPicks.forEach(function (mi) {
        (mi.cantrips || []).forEach(function (id) { add(id, 'Magic Initiate (' + mi.list + ')', mi.ability); });
        if (mi.spell) add(mi.spell, 'Magic Initiate · 1 free cast per Long Rest', mi.ability, { freeCast: 'mi-' + (mi.source || 'feat') });
      });
      var slotRow = sc ? (sc.slots[lv1 - 1] || []) : [];
      spell = Object.assign(base, {
        pact: !!(sc && sc.pact),
        slots: slotRow.map(function (n, i) { return { level: i + 1, max: n, used: Math.min(n, (play.slotsUsed || {})[i + 1] || 0) }; }).filter(function (s) { return s.max > 0; }),
        spells: list.sort(function (a, b) { return a.level - b.level || a.name.localeCompare(b.name); })
      });
    }

    /* limited-use resources */
    var resources = [];
    cls.forEach(function (c) {
      var lv = c.lv;
      (c.def.resources || []).concat((c.sub && c.sub.resources) || []).forEach(function (r) {
        if (r.fromLevel && lv < r.fromLevel) return;
        var max = r.uses ? (r.uses[Math.min(r.uses.length, lv) - 1] || 0) : r.usesMod ? Math.max(r.usesMin || 1, (r.usesMod === 'prof' ? pb : mods[r.usesMod]) * (r.usesMult || 1) + (r.usesPlus || 0)) : r.pool ? r.pool * lv : 0;
        if (!max) return;
        var recharge = r.shortFrom && lv >= r.shortFrom ? 'short' : r.recharge;
        var sr = r.shortRestBy ? r.shortRestBy[Math.min(r.shortRestBy.length, lv) - 1] || 0 : r.shortRest || 0;
        resources.push({ id: r.id, name: r.name, spell: r.spell || null, recharge: recharge, shortRest: sr, max: max, used: Math.min(max, (play.resourcesUsed || {})[r.id] || 0) });
      });
    });
    if (main) Object.keys(main.pick.arcanum || {}).forEach(function (L) {
      var asp = get('spells', main.pick.arcanum[L]), rid = 'arcanum-' + L;
      if (asp && main.lv >= ({ 6: 11, 7: 13, 8: 15, 9: 17 })[L]) resources.push({ id: rid, name: asp.name + ' (Mystic Arcanum)', spell: asp.id, recharge: 'long', max: 1, used: Math.min(1, (play.resourcesUsed || {})[rid] || 0) });
    });
    if (breath) resources.push({ id: 'breath-weapon', name: 'Breath Weapon', recharge: 'long', max: pb, used: Math.min(pb, (play.resourcesUsed || {})['breath-weapon'] || 0) });
    featInst.forEach(function (fi) {
      (fi.def.spells || []).forEach(function (b, bi) {
        if (!b.once) return;
        (b.fixed ? b.fixed : ((fi.picks.spells || {})[bi] || [])).forEach(function (sid) {
          var s0 = get('spells', sid); if (!s0 || !s0.level) return;
          var rid = 'feat-' + fi.key + '-' + sid;
          resources.push({ id: rid, name: s0.name + ' (' + fi.def.name + ')', spell: sid, recharge: 'long', max: 1, used: Math.min(1, (play.resourcesUsed || {})[rid] || 0) });
        });
      });
    });
    miPicks.forEach(function (mi) {
      if (!mi.spell) return;
      var sp = get('spells', mi.spell); if (!sp) return;
      var id = 'mi-' + (mi.source || 'feat');
      resources.push({ id: id, name: sp.name + ' (free cast)', spell: mi.spell, recharge: 'long', max: 1, used: Math.min(1, (play.resourcesUsed || {})[id] || 0) });
    });

    /* feature actions shown in the Actions tab */
    var featureActions = [];
    cls.forEach(function (c) {
      R.classFeatures(c.def, c.sub, c.lv).filter(function (f) { return f.action; }).forEach(function (f) {
        var rolls = (f.action.rolls || []).map(function (r) {
          if (typeof r[1] === 'string' && r[1].indexOf('scale:') === 0) {
            var sc2 = scaleOf(r[1].slice(6)) || [1, 6];
            return [r[0].replace('{n}', sc2[0]).replace('{d}', sc2[1]), sc2[0], sc2[1], r[2]];
          }
          return r;
        });
        featureActions.push({ name: f.name, from: f.from, text: f.text, time: f.action.time, resource: f.action.resource || null, rolls: rolls, note: f.action.text || '' });
      });
    });

    /* proficiencies & training */
    var toolNames = (ch.tools || []).concat(skilledTools.filter(function (t) { return (ch.tools || []).indexOf(t) < 0; })).filter(function (t, i, a) { return a.indexOf(t) === i; }).map(function (t) { var d = get('items', t); return d ? d.name : t; });
    var cap = function (s) { return s.replace(/^./, function (c) { return c.toUpperCase(); }); };
    var wpText = weaponProf.filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (w) {
      return w === 'martial-light' ? 'martial weapons with the Light property' : w === 'martial-finesse-light' ? 'martial weapons with the Finesse or Light property' : w + ' weapons';
    });
    var armorText = armorProf.filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (a) { return a === 'shield' ? 'shields' : a + ' armor'; });
    var langs = (ch.languages || []).concat(cls.reduce(function (a, c) { return a.concat(c.def.languagesGranted || []); }, []))
      .filter(function (v, i, a) { return a.indexOf(v) === i; });
    var training = {
      armor: armorText.length ? cap(armorText.join(', ')) : 'None',
      weapons: wpText.length ? cap(wpText.join(', ')) : 'None',
      tools: toolNames.join(', ') || 'None',
      languages: langs.map(function (l) { return R.LANGUAGES[l] || l; }).join(', ')
    };

    /* features */
    var features = [];
    cls.forEach(function (c) {
      R.classFeatures(c.def, c.sub, c.lv).forEach(function (f) {
        if (f.name === 'Ability Score Improvement' || f.name === 'Epic Boon') {
          var x = (c.pick.asi || {})[f.level], fd = x && x.feat && get('feats', x.feat);
          if (fd) {
            var inc = Object.keys(x.asi || {}).map(function (k) { return k.toUpperCase() + ' +' + x.asi[k]; }).join(', ');
            features.push({ name: fd.name, from: f.from, text: R.featPickText(fd, x).replace(/^\n/, '') + (R.featPickText(fd, x) ? '\n' : '') + (inc ? inc + '. ' : '') + (fd.id === 'ability-score-improvement' ? '' : fd.text) + (x.skills && x.skills.length ? ' Chosen: ' + x.skills.map(function (s) { if (SKILL_BY_ID[s]) return SKILL_BY_ID[s].name; var t = get('items', s); return t ? t.name : s; }).join(', ') + '.' : ''), source: c.def.sourceName });
            return;
          }
        }
        features.push({ name: f.name, from: f.from, text: f.text, source: f.fromSub && c.sub && c.sub.sourceName ? c.sub.sourceName : c.def.sourceName });
      });
    });
    choiceInfo.forEach(function (x) { features.push(Object.assign({ source: main.def.sourceName }, x)); });
    var bgFeature = R.backgroundFeature(ch, bg, on);
    if (bgFeature) features.push({ name: bgFeature.name, from: bg.name + ' (background feature)', text: bgFeature.text, source: bgFeature.sourceName || bg.sourceName });
    if (species) species.traits.forEach(function (t) { features.push({ name: t.name, from: species.name, text: t.text, source: species.sourceName }); });
    if (lineage) features.push({ name: lineage.name, from: species.name + (species.lineageLabel ? ' · ' + species.lineageLabel : ' lineage'), text: lineage.text, source: species.sourceName });
    (ch.feats || []).map(function (id) { return get('feats', id); }).filter(Boolean).forEach(function (f) {
      var from = bg && (bg.feat || (ch.background && ch.background.feat)) === f.id ? bg.name + ' (origin feat)' : (ch.species && ch.species.feat === f.id ? (species && species.id !== 'human' ? species.name + ' (feat)' : 'Human (Versatile)') : 'Feat');
      var fi = featInst.find(function (x) { return x.id === f.id && !/^lvl-/.test(x.key); });
      features.push({ name: f.name, from: from, text: f.text + R.featPickText(f, fi && fi.picks), source: f.sourceName });
    });

    /* weight */
    var totalLb = inv.reduce(function (a, e) { return a + (e.def.w || 0) * (e.qty || 1); }, 0);
    var capacity = scores.str * 15 * ((species && species.carryMultiplier) || 1);

    var defenses = ((species && species.defenses) || []).concat((lineage && lineage.defenses) || [], grants.defenses);

    return {
      name: ch.name || 'Unnamed hero', level: level, pb: pb,
      summary: [lineage && species && lineage.name.indexOf(species.name) >= 0 ? lineage.name : species ? species.name : '', main ? main.def.name + ' ' + main.lv + (main.sub ? ' (' + main.sub.name + ')' : '') : '', bg ? bg.name + ' background' : ''].filter(Boolean).join(' · '),
      scores: scores, mods: mods, saves: saves, skills: skills, skillBonus: skillBonus,
      ac: ac, acNote: acNote, hpMax: hpMax, hp: hp, temp: play.temp || 0, speed: speed, size: (ch.species && ch.species.size) || (species && species.size) || 'Medium',
      initiative: mods.dex + (hasFeat('alert') ? pb : jack),
      hitDie: main ? '1d' + main.def.hitDie : '1d8', hitDice: main ? main.lv + 'd' + main.def.hitDie : '1d8',
      attacksPerAction: Math.max(grants.attacks, (main && main.def.extraAttack && main.lv >= main.def.extraAttack) || grants.extraAttack ? 2 : 1),
      critRange: grants.critRange, subclass: main ? main.sub : null, classLevel: main ? main.lv : 1,
      senses: [
        { value: 10 + skillBonus('perception'), label: 'Passive Perception' },
        { value: 10 + skillBonus('investigation'), label: 'Passive Investigation' },
        { value: 10 + skillBonus('insight'), label: 'Passive Insight' }
      ].concat(darkvision ? [{ value: darkvision + ' ft', label: 'Darkvision' }] : []),
      defenses: defenses,
      training: training, weaponProf: weaponProf, armorProf: armorProf,
      attacks: attacks, extraAttack: extraAttack, twoWeapon: twoWeapon, opportunity: opportunity, breath: breath,
      spell: spell, resources: resources, featureActions: featureActions, features: features, feats: feats,
      species: species, lineage: lineage, background: bg, backgroundPick: ch.background, mainClass: main,
      inventory: inv, totalLb: totalLb, capacity: capacity, currency: ch.currency || {},
      play: play
    };
  };

  /**
   * Add an item to an inventory list. Stackable items merge; a pack is opened into its contents
   * (the backpack sits with your equipment and everything else goes inside it). Returns the list.
   */
  R.addItem = function (inv, id, qty, on, container, equip) {
    var def = C.get('items', id, on || ['srd-5.2']); if (!def) return inv;
    if (def.contents) {
      var hasBag = def.contents.some(function (c) { return c[0] === 'backpack'; });
      for (var n = 0; n < qty; n++) def.contents.forEach(function (c) {
        R.addItem(inv, c[0], c[1], on, c[0] === 'backpack' || !hasBag ? container || 'equipment' : 'backpack', false);
      });
      return inv;
    }
    var where = def.id === 'arrows' || def.id === 'bolts' ? 'quiver' : container || 'equipment';
    var existing = def.stack && inv.find(function (e) { return e.item === id && (e.container || 'equipment') === where; });
    if (existing) { existing.qty += qty; return inv; }
    var wearable = equip && (def.kind === 'weapon' || def.kind === 'armor');
    if (def.stack || def.kind === 'weapon' && def.props && def.props.indexOf('thrown') >= 0 && qty > 1) inv.push({ uid: U.uid(), item: id, qty: qty, equipped: !!wearable, container: where });
    else for (var i = 0; i < qty; i++) inv.push({ uid: U.uid(), item: id, qty: 1, equipped: false, container: where });
    if (wearable) inv[inv.length - 1].equipped = true;
    return inv;
  };

  /** Open a pack that is already in the inventory (characters made before packs were opened automatically). */
  R.unpack = function (ch, uid) {
    var on = C.on(ch);
    var i = (ch.inventory || []).findIndex(function (e) { return e.uid === uid; });
    if (i < 0) return false;
    var e = ch.inventory[i], def = C.get('items', e.item, on);
    if (!def || !def.contents) return false;
    ch.inventory.splice(i, 1);
    R.addItem(ch.inventory, e.item, e.qty || 1, on, e.container === 'backpack' ? 'equipment' : e.container);
    return true;
  };

  /** Turn chosen starting equipment (class option + background option) into inventory and coins. */
  R.applyStartingEquipment = function (ch) {
    var on = C.on(ch);
    var main = ch.classes[0] && C.get('classes', ch.classes[0].id, on);
    var bg = ch.background && C.get('backgrounds', ch.background.id, on);
    var inv = [], gp = 0;
    var addItem = function (id, qty) { R.addItem(inv, id, qty, on, null, true); };
    var pick = function (opts, key) { var o = opts && opts[key || 'A']; if (!o) return; (o.items || []).forEach(function (it) { addItem(it[0], it[1]); }); gp += o.gp || 0; };
    if (main) pick(main.equipment, ch.classes[0].equipment);
    if (bg) {
      var o = bg.equipment && bg.equipment[ch.background.equipment || 'A'];
      if (o) {
        (o.items || []).forEach(function (it) {
          var id = it[0];
          if ((id === 'dice-set' || id === '@tool') && ch.background.tool) id = ch.background.tool;     // "gaming set (same as above)"
          addItem(id, it[1]);
        });
        gp += o.gp || 0;
      }
    }
    // only one body armor, one shield and two-ish weapons start equipped
    var bodyDone = false, shieldDone = false;
    inv.forEach(function (e) {
      var d = C.get('items', e.item, on);
      if (d.kind === 'armor' && d.armor !== 'shield') { e.equipped = !bodyDone; bodyDone = true; }
      if (d.armor === 'shield') { e.equipped = !shieldDone; shieldDone = true; }
    });
    ch.inventory = inv;
    ch.currency = { pp: 0, gp: gp, ep: 0, sp: 0, cp: 0 };
    return ch;
  };

  /** The example character used to test the app (also offered as "Try a sample character"). */
  R.sampleIlsa = function () {
    var ch = R.blankCharacter();
    Object.assign(ch, {
      name: 'Ilsa Thornwood',
      species: { id: 'elf', lineage: 'wood-elf', keenSense: 'perception', spellAbility: 'wis' },
      background: { id: 'soldier', asi: { dex: 2, con: 1 }, tool: 'dice-set', equipment: 'B' },
      classes: [{ id: 'ranger', level: 1, skills: ['animal-handling', 'stealth', 'survival'], masteries: ['longbow', 'scimitar'], equipment: 'A' }],
      abilities: { method: 'standard', base: { str: 12, dex: 15, con: 13, int: 8, wis: 14, cha: 10 } },
      feats: ['savage-attacker'], languages: ['common', 'elvish', 'dwarvish'], tools: ['dice-set'],
      spells: { prepared: ['cure-wounds', 'ensnaring-strike'] },
      currency: { pp: 0, gp: 57, ep: 0, sp: 0, cp: 0 },
      inventory: [
        ['studded-leather', 1, true, 'equipment'], ['scimitar', 1, true, 'equipment'], ['shortsword', 1, true, 'equipment'],
        ['longbow', 1, true, 'equipment'], ['sprig-of-mistletoe', 1, false, 'equipment'], ['quiver', 1, false, 'equipment'],
        ['backpack', 1, false, 'equipment'], ['arrows', 20, false, 'quiver'], ['bedroll', 1, false, 'backpack'],
        ['oil', 2, false, 'backpack'], ['rations', 10, false, 'backpack'], ['rope', 1, false, 'backpack'],
        ['tinderbox', 1, false, 'backpack'], ['torch', 2, false, 'backpack'], ['waterskin', 1, false, 'backpack'], ['dice-set', 1, false, 'backpack']
      ].map(function (r) { return { uid: U.uid(), item: r[0], qty: r[1], equipped: r[2], container: r[3] }; })
    });
    return ch;
  };
})(typeof window !== 'undefined' ? window : globalThis);
