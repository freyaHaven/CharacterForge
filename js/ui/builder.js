/* Character Forge — guided builder. A draft character is saved after every choice, so nothing is lost. */
(function (root) {
  'use strict';
  var CF = root.CF, U = CF.util, R = CF.rules, C = CF.content, app = CF.app, h = U.esc, sg = U.signed;
  var CUR = null;

  var STEPS = [
    ['class', 'Class'], ['training', 'Class training'], ['background', 'Background'], ['species', 'Species'],
    ['abilities', 'Ability scores'], ['equipment', 'Equipment'], ['details', 'Details & review']
  ];
  var ARRAY = [15, 14, 13, 12, 10, 8];
  var COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  var PRIORITY = {
    barbarian: ['str', 'con', 'dex', 'wis', 'cha', 'int'], bard: ['cha', 'dex', 'con', 'wis', 'int', 'str'],
    cleric: ['wis', 'con', 'str', 'dex', 'cha', 'int'], druid: ['wis', 'con', 'dex', 'int', 'cha', 'str'],
    fighter: ['str', 'con', 'dex', 'wis', 'int', 'cha'], monk: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
    paladin: ['str', 'cha', 'con', 'wis', 'dex', 'int'], ranger: ['dex', 'wis', 'con', 'str', 'int', 'cha'],
    rogue: ['dex', 'con', 'int', 'wis', 'cha', 'str'], sorcerer: ['cha', 'con', 'dex', 'wis', 'int', 'str'],
    warlock: ['cha', 'con', 'dex', 'wis', 'int', 'str'], wizard: ['int', 'con', 'dex', 'wis', 'cha', 'str']
  };
  var ABIL_HELP = {
    str: 'Lifting, climbing, hitting hard with heavy weapons', dex: 'Agility, reflexes, aim and sneaking',
    con: 'Toughness and stamina: more hit points', int: 'Memory, reasoning and book learning',
    wis: 'Awareness, instinct and nature or divine magic', cha: 'Force of personality, persuasion and some magic'
  };
  var STYLE_FILTERS = [['all', 'Show all'], ['close', 'Up close'], ['ranged', 'From a distance'], ['magic', 'With magic'], ['support', 'Helping my friends']];

  /* ---------- helpers ---------- */
  function on(ch) { return C.on(ch); }
  function get(ch, section, id) { return id ? C.get(section, id, on(ch)) : null; }
  function cls(ch) { return ch.classes[0] ? get(ch, 'classes', ch.classes[0].id) : null; }
  function pick(ch) { return ch.classes[0] || {}; }
  function bgDef(ch) { return ch.background ? get(ch, 'backgrounds', ch.background.id) : null; }
  function spDef(ch) { return ch.species ? get(ch, 'species', ch.species.id) : null; }
  /** Skillful can come from the species itself (Human) or from the lineage you picked (Custom Lineage's variable trait). */
  function skillfulOn(ch, sp) { if (!sp) return false; if (sp.skillful) return true; var l = sp.lineages && ch.species && sp.lineages.find(function (x) { return x.id === ch.species.lineage; }); return !!(l && l.skillful); }
  function abName(id) { return R.ABILITIES.find(function (a) { return a.id === id; }).name; }
  function skillName(id) { return R.skill(id).name; }
  function uniq(a) { return a.filter(function (v, i) { return v && a.indexOf(v) === i; }); }
  function bview() { var v = app.view; v.b = v.b || { filter: 'all', hover: null }; return v.b; }

  function classCantrips(ch) {
    var c = cls(ch); if (!c || !c.spellcasting) return 0;
    var n = c.spellcasting.cantrips[0] || 0;
    (c.choices || []).forEach(function (q) {
      var o = (q.options || []).find(function (x) { return x.id === (pick(ch).choices || {})[q.id]; });
      if (o && o.grants && o.grants.extraCantrips) n += o.grants.extraCantrips;
    });
    return n;
  }
  function classPrepared(ch) { var c = cls(ch); return c && c.spellcasting ? c.spellcasting.prepared[0] || 0 : 0; }
  function spellsFor(ch, list, level) {
    return C.all('spells', on(ch)).filter(function (s) { return s.level === level && (s.classes || []).indexOf(list) >= 0; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }
  function languageCount(ch) { return 2; }
  function masteryChoices(ch) {
    var c = cls(ch); if (!c || !c.weaponMasteries) return [];
    var weaponProf = (c.weapons || []).slice();
    (c.choices || []).forEach(function (q) { var o = (q.options || []).find(function (x) { return x.id === (pick(ch).choices || {})[q.id]; }); if (o && o.grants && o.grants.weapons) weaponProf = weaponProf.concat(o.grants.weapons); });
    return C.all('items', on(ch)).filter(function (i) {
      return i.kind === 'weapon' && i.mastery && R.weaponAllowed(weaponProf, i) && (c.id !== 'barbarian' || i.attack === 'melee');
    });
  }

  /** Keep derived parts of the draft consistent after every change. */
  function normalize(ch) {
    var c = cls(ch), bg = bgDef(ch), sp = spDef(ch), p = ch.classes[0];
    if (p) {
      p.level = 1;
      if (c) {
        var allowed = c.skillChoices.from === 'any' ? R.SKILLS.map(function (s) { return s.id; }) : c.skillChoices.from;
        p.skills = (p.skills || []).filter(function (s) { return allowed.indexOf(s) >= 0; }).slice(0, c.skillChoices.count);
        var mOk = masteryChoices(ch).map(function (i) { return i.id; });
        p.masteries = (p.masteries || []).filter(function (m) { return mOk.indexOf(m) >= 0; }).slice(0, c.weaponMasteries || 0);
        p.expertise = (p.expertise || []).filter(function (s) { return (p.skills || []).indexOf(s) >= 0 || (bg && R.bgSkills(ch, bg).indexOf(s) >= 0); }).slice(0, c.expertise || 0);
        if (c.spellcasting) {
          var L = c.spellcasting.list;
          var cOk = spellsFor(ch, L, 0).map(function (s) { return s.id; }), pOk = spellsFor(ch, L, 1).map(function (s) { return s.id; });
          p.cantrips = (p.cantrips || []).filter(function (s) { return cOk.indexOf(s) >= 0; }).slice(0, classCantrips(ch));
          ch.spells.prepared = (ch.spells.prepared || []).filter(function (s) { return pOk.indexOf(s) >= 0; }).slice(0, classPrepared(ch));
        } else { p.cantrips = []; ch.spells.prepared = []; }
      }
    }
    if (bg && bg.skillChoice) ch.background.skills = R.bgSkills(ch, bg).slice(bg.skills.length); else if (ch.background) delete ch.background.skills;
    if (sp && ch.species && !skillfulOn(ch, sp)) ch.species.skill = null;
    // choices made for feats (options, spells): reset when the feat changes
    ch.featPicks = ch.featPicks || {};
    [['background', bg && !R.isOld(ch) ? bgFeat(ch, bg) : null], ['species', sp && sp.versatile ? ch.species.feat : null]].forEach(function (x) {
      if (!x[1]) { delete ch.featPicks[x[0]]; return; }
      if (!ch.featPicks[x[0]] || ch.featPicks[x[0]].feat !== x[1]) ch.featPicks[x[0]] = { feat: x[1] };
    });
    // tools
    var tools = [];
    if (bg && bg.tool) tools.push(bg.tool.fixed || ch.background.tool);
    if (c) tools = tools.concat(c.tools || [], (p && p.tools) || []);
    ch.tools = uniq(tools);
    // feats: background origin feat + Human Versatile feat
    if (bg && bg.featCategory && ch.background.feat && !C.all('feats', on(ch)).some(function (f) { return f.id === ch.background.feat && f.category === bg.featCategory; })) ch.background.feat = null;
    ch.feats = uniq([R.isOld(ch) ? null : bgFeat(ch, bg), sp && sp.versatile && ch.species.feat]);
    // Magic Initiate entries (background and/or Human feat)
    var mi = [];
    var miAb = c && c.spellcasting ? c.spellcasting.ability : 'wis';
    var miBg = (ch.magicInitiate || []).find(function (m) { return m.source === 'background'; });
    if (bg && bgFeat(ch, bg) === 'magic-initiate' && !R.isOld(ch)) mi.push(Object.assign({ source: 'background', list: bg.featList || 'wizard', cantrips: [], spell: null, ability: miAb }, miBg || {}, { list: bg.featList || (miBg && miBg.list) || 'wizard' }));
    if (sp && sp.versatile && ch.species.feat === 'magic-initiate') mi.push(Object.assign({ source: 'species', list: 'wizard', cantrips: [], spell: null, ability: miAb }, (ch.magicInitiate || []).find(function (m) { return m.source === 'species'; }) || {}));
    var have = ((p && p.cantrips) || []).concat((ch.spells && ch.spells.prepared) || []);
    if (c && c.alwaysPrepared) have = have.concat(c.alwaysPrepared.filter(function (a) { return a.level <= 1; }).map(function (a) { return a.spell; }));
    var lin = sp && sp.lineages && ch.species ? sp.lineages.find(function (l) { return l.id === ch.species.lineage; }) : null;
    have = have.concat((sp && sp.cantrips) || [], (lin && lin.cantrips) || []);
    mi.forEach(function (m) {
      m.cantrips = (m.cantrips || []).filter(function (id) { return have.indexOf(id) < 0; });
      if (m.spell && have.indexOf(m.spell) >= 0) m.spell = null;
      have = have.concat(m.cantrips, m.spell ? [m.spell] : []);
    });
    ch.magicInitiate = mi;
    if (!(sp && sp.versatile && ch.species.feat === 'skilled')) ch.skilled = [];
    if (!(bg && !R.isOld(ch) && bgFeat(ch, bg) === 'skilled')) ch.skilledBg = [];
    // languages: Common + chosen
    ch.languages = uniq(['common'].concat((ch.languages || []).filter(function (l) { return l !== 'common'; }).slice(0, languageCount(ch))));
    return ch;
  }

  /** What's still missing on each step. */
  function status(ch) {
    var c = cls(ch), p = pick(ch), bg = bgDef(ch), sp = spDef(ch), miss = {};
    STEPS.forEach(function (s) { miss[s[0]] = []; });
    if (!c) miss['class'].push('Choose a class');
    if (c) {
      if ((p.skills || []).length < c.skillChoices.count) miss.training.push('Choose ' + c.skillChoices.count + ' skills');
      if (c.weaponMasteries && (p.masteries || []).length < c.weaponMasteries) miss.training.push('Choose ' + c.weaponMasteries + ' weapon masteries');
      R.classChoices(c, null, 1).forEach(function (q) { if (!(p.choices || {})[q.id]) miss.training.push('Choose a ' + q.name); });
      if (c.expertise && (p.expertise || []).length < c.expertise) miss.training.push('Choose ' + c.expertise + ' Expertise skills');
      if (c.toolChoice && (p.tools || []).length < c.toolChoice.count) miss.training.push('Choose ' + c.toolChoice.label.toLowerCase());
      if (c.spellcasting) {
        if ((p.cantrips || []).length < classCantrips(ch)) miss.training.push('Choose ' + classCantrips(ch) + ' cantrips');
        if ((ch.spells.prepared || []).length < classPrepared(ch)) miss.training.push('Choose ' + classPrepared(ch) + ' 1st-level spells');
      }
    }
    if (!bg) miss.background.push('Choose a background');
    if (bg && bg.tool && bg.tool.choose && !ch.background.tool) miss.background.push('Choose ' + (bg.tool.choose === 'artisan' ? 'your artisan’s tools' : bg.tool.choose === 'musical-instrument' ? 'a musical instrument' : 'a gaming set'));
    if (bg && !R.isOld(ch) && bgFeat(ch, bg) === 'skilled' && (ch.skilledBg || []).length < 3) miss.background.push('Choose 3 skills or tools (Skilled)');
    if (bg && !R.isOld(ch) && bgFeat(ch, bg)) miss.background = miss.background.concat(CF.ui.featPicks.missing(get(ch, 'feats', bgFeat(ch, bg)), (ch.featPicks || {}).background));
    if (bg && bg.skillChoice && R.bgSkills(ch, bg).length < bg.skills.length + bg.skillChoice.count) miss.background.push('Choose ' + bg.skillChoice.count + ' background skill' + (bg.skillChoice.count > 1 ? 's' : ''));
    if (bg && bg.featCategory && !ch.background.feat && !R.isOld(ch)) miss.background.push('Choose your background feat');
    (ch.magicInitiate || []).forEach(function (m) {
      var where = m.source === 'background' ? 'background' : 'species';
      if ((m.cantrips || []).length < 2 || !m.spell) miss[where].push('Finish Magic Initiate (2 cantrips and 1 spell)');
    });
    if (!sp) miss.species.push('Choose a species');
    if (sp) {
      if (sp.lineages && !ch.species.lineage) miss.species.push('Choose ' + (sp.lineageLabel || 'a lineage').toLowerCase());
      if (sp.keenSenses && !ch.species.keenSense) miss.species.push('Choose a Keen Senses skill');
      if (skillfulOn(ch, sp) && !ch.species.skill) miss.species.push('Choose a skill' + (sp.skillful ? ' (Skillful)' : ''));
      if (sp.versatile && !ch.species.feat) miss.species.push('Choose an origin feat (Versatile)');
      if (sp.versatile && ch.species.feat) miss.species = miss.species.concat(CF.ui.featPicks.missing(get(ch, 'feats', ch.species.feat), (ch.featPicks || {}).species));
      if (sp.versatile && ch.species.feat === 'skilled' && (ch.skilled || []).length < 3) miss.species.push('Choose 3 skills or tools (Skilled)');
    }
    var a = ch.abilities;
    if (!a.method || a.method === 'unset') miss.abilities.push('Pick how to set your scores');
    else if (a.method === 'buy') { var spent = R.ABILITIES.reduce(function (t, x) { return t + (COST[a.base[x.id]] || 0); }, 0); if (spent > 27) miss.abilities.push('Too many points spent'); if (spent < 27) miss.abilities.push((27 - spent) + ' points left to spend'); }
    else if (a.method === 'roll' && !(a.rolled || []).length) miss.abilities.push('Roll your scores');
    if (bg && !Object.keys(ch.background.asi || {}).length) miss.abilities.push(R.isOld(ch) ? 'Choose your ability score increases' : 'Choose your background’s score increases');
    if (!c || !pick(ch).equipment) miss.equipment.push('Choose your class equipment');
    if (!bg || !ch.background.equipment) miss.equipment.push('Choose your background equipment');
    if (!ch.name || !ch.name.trim()) miss.details.push('Give your hero a name');
    if ((ch.languages || []).length < 1 + languageCount(ch)) miss.details.push('Choose ' + languageCount(ch) + ' languages');
    return miss;
  }

  /* ---------- screen ---------- */
  CF.ui.builder = function (route) {
    var ch = CF.store.get(route.id);
    CUR = route.id;
    if (!ch) return CF.ui.topbar() + '<main class="page"><div class="empty"><b>Draft not found</b><a class="btn" href="#/">Back to characters</a></div></main>';
    var step = (ch.builder && ch.builder.step) || 'class';
    var idx = STEPS.findIndex(function (s) { return s[0] === step; });
    var miss = status(ch);
    var body = ({ 'class': stepClass, training: stepTraining, background: stepBackground, species: stepSpecies, abilities: stepAbilities, equipment: stepEquipment, details: stepDetails })[step](ch, miss);
    var allDone = STEPS.every(function (s) { return !miss[s[0]].length; });

    return CF.ui.topbar('<span class="grow muted2" style="font-size:14px">Guided build · saved as you go · <a href="#/quick/' + encodeURIComponent(ch.id) + '" data-act="q-quick" data-arg="' + h(ch.id) + '">switch to quick build</a></span>') +
      '<div class="b-wrap">' +
      '<nav class="stepper" aria-label="Steps">' + STEPS.map(function (s, i) {
        var done = !miss[s[0]].length;
        return '<button type="button" class="' + (done ? 'done' : '') + '" data-act="b-step" data-arg="' + s[0] + '"' + (i === idx ? ' aria-current="step"' : '') + '>' +
          '<span class="n" aria-hidden="true">' + (done && i !== idx ? '✓' : i + 1) + '</span><span>' + h(s[1]) + '<span class="sub">' + h(stepSummary(ch, s[0])) + '</span></span></button>';
      }).join('') + '</nav>' +
      '<main class="b-main">' + CF.ui.notice() + '<div style="display:flex;flex-direction:column;gap:8px"><span class="b-kicker">Step ' + (idx + 1) + ' of ' + STEPS.length + '</span>' + body + '</main>' +
      '<aside class="b-side" aria-label="Your hero so far">' + soFar(ch, miss) + helpBox(step) +
        '<div class="b-nav">' + (idx > 0 ? '<button class="btn" data-act="b-step" data-arg="' + STEPS[idx - 1][0] + '">Back</button>' : '<a class="btn" href="#/">Back</a>') +
        (idx < STEPS.length - 1 ? '<button class="btn btn-teal" data-act="b-step" data-arg="' + STEPS[idx + 1][0] + '">Continue</button>'
          : '<button class="btn btn-teal" data-act="b-finish"' + (allDone ? '' : ' disabled') + '>Finish character</button>') + '</div>' +
      '</aside></div>';
  };

  function stepSummary(ch, step) {
    var c = cls(ch), bg = bgDef(ch), sp = spDef(ch);
    if (step === 'class') return c ? c.name : '';
    if (step === 'background') return bg ? bg.name : '';
    if (step === 'species') { if (!sp) return ''; var l = sp.lineages && (sp.lineages.find(function (x) { return x.id === ch.species.lineage; })); return l && l.name.indexOf(sp.name) >= 0 ? l.name : sp.name; }
    if (step === 'abilities') return ch.abilities.method === 'array' ? 'Standard array' : ch.abilities.method === 'buy' ? 'Point buy' : ch.abilities.method === 'roll' ? 'Rolled' : '';
    if (step === 'details') return ch.name || '';
    return '';
  }

  function soFar(ch, miss) {
    var d = R.derive(ch), c = cls(ch);
    var left = STEPS.reduce(function (a, s) { return a.concat(miss[s[0]]); }, []);
    return '<section class="card so-far"><h2 class="h-sec">Your hero so far</h2>' +
      (c ? '<span class="serif" style="font-size:26px;font-weight:600">' + h(ch.name || c.name) + '</span><span class="muted" style="font-size:14px">' + h(d.summary) + '</span>' : '<p class="muted2" style="margin:0;font-size:14px">Pick a class to get started.</p>') +
      (c ? '<dl><dt>Hit points</dt><dd>' + d.hpMax + '</dd><dt>Armor Class</dt><dd>' + (ch.inventory.length || pick(ch).equipment ? d.ac : '—') + '</dd><dt>Speed</dt><dd>' + d.speed + ' ft</dd><dt>Scores</dt><dd>' +
        R.ABILITIES.map(function (a) { return a.abbr + ' ' + d.scores[a.id]; }).join(' · ') + '</dd></dl>' : '') +
      (left.length ? '<div style="border-top:1px solid var(--soft);padding-top:10px"><span class="muted2" style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase">Still to do (' + left.length + ')</span><ul class="check-list" style="margin-top:6px">' +
        left.slice(0, 5).map(function (m) { return '<li><span class="no">•</span>' + h(m) + '</li>'; }).join('') + (left.length > 5 ? '<li class="muted2">…and ' + (left.length - 5) + ' more</li>' : '') + '</ul></div>'
        : '<div class="notice">Everything is chosen. Review and finish on the last step.</div>') + '</section>';
  }

  var HELP = {
    'class': ['What’s a class?', 'Your class is your hero’s job in the party: how they fight, what they’re good at and whether they use magic. Your hit die (d6 to d12) decides how many hit points you gain each level.'],
    training: ['What’s proficiency?', 'Being proficient with a skill or weapon means you add your proficiency bonus (+2 at level 1) to rolls with it. Cantrips are spells you can cast any time; 1st-level spells use a spell slot.'],
    background: ['What’s a background?', 'Your background is what you did before adventuring. It gives you two skills, a tool, an origin feat (a small special talent), some gear, and decides which ability scores you can increase.'],
    species: ['What’s a species?', 'Your species is your people (elf, dwarf, human…). It sets your size and speed and gives you special traits like seeing in the dark.'],
    abilities: ['How do scores work?', 'Higher is better and 10 is an average person. The modifier (the small number) is what you add to dice rolls. Ask your DM which method your group uses; the standard array is the safe choice.'],
    equipment: ['Gear or gold?', 'Each option is a ready-made kit. Taking only gold lets you buy your own gear later, but the kits are usually the easiest way to start.'],
    details: ['Almost there', 'Give your hero a name and pick two languages. Appearance and backstory are optional, but they help you role-play.']
  };
  function helpBox(step) { var x = HELP[step]; return '<section class="help"><h2>' + h(x[0]) + '</h2><p>' + h(x[1]) + '</p></section>'; }

  function header(title, lead) { return '<h1 class="b-title">' + h(title) + '</h1>' + (lead ? '<p class="b-lead">' + lead + '</p>' : '') + '</div>'; }
  function dots(n) { return '<span class="cx"><span style="display:flex;gap:3px" aria-hidden="true">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= n ? 'on' : '') + '"></i>'; }).join('') + '</span>' + ['Beginner-friendly', 'Some choices', 'Lots of choices'][n - 1] + '</span>'; }
  function sec(title, why, inner, count) {
    return '<section class="b-sec"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px"><h2>' + h(title) + '</h2>' + (count || '') + '</div>' + (why ? '<p class="why">' + why + '</p>' : '') + inner + '</section>';
  }
  function counter(n, max) { return '<span class="count' + (n >= max ? ' ok' : '') + '">' + n + ' of ' + max + ' chosen</span>'; }
  function pillToggle(action, arg, label, pressed, disabled, extra) {
    return '<button type="button" class="pill" data-act="' + action + '" data-arg="' + h(arg) + '" aria-pressed="' + !!pressed + '"' + (disabled ? ' disabled' : '') + '>' + label + (extra || '') + '</button>';
  }

  /* ---------- step 1: class ---------- */
  function stepClass(ch) {
    var v = bview(), cur = pick(ch).id;
    var list = C.all('classes', on(ch)).filter(function (c) { return v.filter === 'all' || (c.style || []).indexOf(v.filter) >= 0; });
    return header('What kind of hero do you want to play?', 'Your <strong>class</strong> is your hero’s job in the adventuring party. Not sure? Start with how you picture them in a fight.') +
      '<div class="pills" role="group" aria-label="Filter by play style">' + STYLE_FILTERS.map(function (f) { return pillToggle('b-filter', f[0], h(f[1]), v.filter === f[0]); }).join('') + '</div>' +
      '<div class="opt-grid">' + list.map(function (c) {
        return '<button type="button" class="opt" data-act="b-class" data-arg="' + h(c.id) + '" aria-pressed="' + (cur === c.id) + '">' +
          '<span class="t"><span class="nm">' + h(c.name) + '</span><span class="tag">' + h(c.sourceName.replace('System Reference Document ', 'SRD ')) + '</span></span>' +
          '<span class="p">' + h(c.pitch) + '</span>' + dots(c.complexity || 2) +
          '<span class="meta">Key ability: ' + c.primary.map(abName).join(' or ') + ' · Hit die d' + c.hitDie + (c.spellcasting ? ' · Casts spells' : '') + '</span></button>';
      }).join('') + '</div>' +
      (cur ? (function () { var c = cls(ch); return '<div class="notice"><strong>' + h(c.name) + ':</strong> ' + h(c.detail) + '</div>'; })() : '');
  }

  /* ---------- step 2: class training ---------- */
  function stepTraining(ch) {
    var c = cls(ch), p = pick(ch), v = bview(), bg = bgDef(ch);
    if (!c) return header('Class training', 'Choose a class first.') + '<button class="btn" data-act="b-step" data-arg="class">Choose a class</button>';
    var out = header('Your ' + c.name + ' training', 'These are the things your class lets you choose. Pick what sounds fun; nothing here is a trap.');
    // skills
    var from = c.skillChoices.from === 'any' ? R.SKILLS.map(function (s) { return s.id; }) : c.skillChoices.from;
    var n = (p.skills || []).length, max = c.skillChoices.count;
    out += sec('Skills', 'Skills you are trained in. You add your proficiency bonus (+2) when you use them.' + (bg ? ' Skills from your ' + bg.name + ' background are already covered.' : ''),
      '<div class="pills">' + from.map(function (id) {
        var fromBg = bg && R.bgSkills(ch, bg).indexOf(id) >= 0, sel = (p.skills || []).indexOf(id) >= 0;
        var s = R.skill(id);
        return pillToggle('b-skill', id, h(s.name) + ' <small>' + s.ability.toUpperCase() + '</small>', sel || fromBg, fromBg || (!sel && n >= max), fromBg ? ' <small>(background)</small>' : '');
      }).join('') + '</div>', counter(n, max));
    // class choices (fighting style, orders, invocations)
    R.classChoices(c, null, 1).forEach(function (q) {
      var curOpt = (p.choices || {})[q.id];
      out += sec(q.name, h(q.help).replace(' You get more at levels 2 and 5.', ''), '<div class="opt-grid">' + q.options.filter(function (o) { return (o.minLevel || 1) <= 1; }).map(function (o) {
        return '<button type="button" class="opt" data-act="b-choice" data-arg="' + h(q.id + ':' + o.id) + '" aria-pressed="' + (curOpt === o.id) + '"><span class="nm" style="font-size:18px">' + h(o.name) + '</span><span class="p">' + h(o.text) + '</span></button>';
      }).join('') + '</div>');
    });
    // expertise
    if (c.expertise) {
      var known = uniq((p.skills || []).concat(bg ? R.bgSkills(ch, bg) : []));
      var ne = (p.expertise || []).length;
      out += sec('Expertise', 'Pick ' + c.expertise + ' of your skills to get really good at: your proficiency bonus is doubled for them.',
        known.length ? '<div class="pills">' + known.map(function (id) { var sel = (p.expertise || []).indexOf(id) >= 0; return pillToggle('b-expertise', id, h(skillName(id)), sel, !sel && ne >= c.expertise); }).join('') + '</div>' : '<span class="muted2">Choose your skills above first.</span>',
        counter(ne, c.expertise));
    }
    // weapon masteries
    if (c.weaponMasteries) {
      var ws = masteryChoices(ch), nm = (p.masteries || []).length;
      var picked = ws.filter(function (w) { return (p.masteries || []).indexOf(w.id) >= 0; });
      out += sec('Weapon masteries', 'Pick ' + c.weaponMasteries + ' kinds of weapons whose special trick you can use. The trick is shown after each name.',
        '<div class="pills">' + ws.map(function (w) {
          var sel = (p.masteries || []).indexOf(w.id) >= 0;
          return pillToggle('b-mastery', w.id, h(w.name) + ' <small>· ' + h(R.MASTERY[w.mastery] ? R.MASTERY[w.mastery].name : w.mastery) + '</small>', sel, !sel && nm >= c.weaponMasteries);
        }).join('') + '</div>' +
        (picked.length ? '<div class="explain">' + uniq(picked.map(function (w) { return w.mastery; })).map(function (m) { return '<div><div class="k">' + h(R.MASTERY[m].name) + '</div><div class="v">' + h(R.MASTERY[m].text) + '</div></div>'; }).join('') + '</div>' : ''),
        counter(nm, c.weaponMasteries));
    }
    // tool choices
    if (c.toolChoice) {
      var groups = c.toolChoice.group === 'artisan-or-instrument' ? ['artisan', 'musical-instrument'] : [c.toolChoice.group];
      var tl = C.all('items', on(ch)).filter(function (i) { return i.kind === 'tool' && groups.indexOf(i.toolGroup) >= 0; });
      var nt = (p.tools || []).length;
      out += sec(c.toolChoice.label, 'Tools you know how to use well.', '<div class="pills">' + tl.map(function (t) { var sel = (p.tools || []).indexOf(t.id) >= 0; return pillToggle('b-tool', t.id, h(t.name), sel, !sel && nt >= c.toolChoice.count); }).join('') + '</div>', counter(nt, c.toolChoice.count));
    }
    // spells
    if (c.spellcasting) {
      var L = c.spellcasting.list, nc = classCantrips(ch), npr = classPrepared(ch);
      if (nc) out += sec('Cantrips', 'Spells you can cast as often as you like. Hover or tap one to read it.', spellPicker(ch, spellsFor(ch, L, 0), p.cantrips || [], nc, 'b-cantrip', 'class-c'), counter((p.cantrips || []).length, nc));
      if (npr) out += sec('1st-level spells', 'Spells you have prepared. Each cast uses a spell slot (you have ' + (c.spellcasting.slots[0][0]) + ' at level 1). You can change them after a Long Rest.' +
        (c.alwaysPrepared ? ' You also always have ' + c.alwaysPrepared.map(function (a) { var s = get(ch, 'spells', a.spell); return s ? s.name : a.spell; }).join(', ') + ' prepared.' : ''),
        spellPicker(ch, spellsFor(ch, L, 1).filter(function (s) { return !(c.alwaysPrepared || []).some(function (a) { return a.spell === s.id; }); }), ch.spells.prepared || [], npr, 'b-prepared', 'class-p'), counter((ch.spells.prepared || []).length, npr));
    }
    return out;
  }

  /** Spells the character already gets elsewhere, so a picker can show them as taken: {spellId: 'where'}. */
  function takenElsewhere(ch, ctx) {
    var out = {}, c = cls(ch), p = pick(ch), sp = spDef(ch);
    var mark = function (ids, label) { (ids || []).forEach(function (id) { if (id && !out[id]) out[id] = label; }); };
    var lin = sp && sp.lineages && ch.species ? sp.lineages.find(function (l) { return l.id === ch.species.lineage; }) : null;
    mark((sp && sp.cantrips) || [], 'species'); mark((lin && lin.cantrips) || [], 'species');
    if (ctx.indexOf('mi-') !== 0) {
      (ch.magicInitiate || []).forEach(function (m) { var l = 'Magic Initiate (' + (m.source === 'background' ? 'background' : 'Versatile') + ')'; mark(m.cantrips, l); mark([m.spell], l); });
    } else {
      mark(p.cantrips, 'class'); mark(ch.spells && ch.spells.prepared, 'class');
      if (c) mark((c.alwaysPrepared || []).filter(function (a) { return a.level <= 1; }).map(function (a) { return a.spell; }), 'class');
      (ch.magicInitiate || []).forEach(function (m) { if ('mi-' + m.source !== ctx) { var l = 'Magic Initiate (' + (m.source === 'background' ? 'background' : 'Versatile') + ')'; mark(m.cantrips, l); mark([m.spell], l); } });
    }
    return out;
  }
  function spellPicker(ch, list, chosen, max, action, ctx) {
    var v = bview(); ctx = ctx || action;
    var taken = takenElsewhere(ch, ctx);
    var hov = v.hoverCtx === ctx && list.find(function (s) { return s.id === v.hover; });
    return '<div class="spell-pick">' + list.map(function (s) {
      var sel = chosen.indexOf(s.id) >= 0, where = !sel && taken[s.id];
      var eff = s.effect ? (s.effect.dice ? s.effect.dice + ' ' + (s.effect.type || '') : s.effect.text || '') : '';
      return '<button type="button" data-act="' + action + '" data-arg="' + h(s.id) + '" data-hover="b-spell" data-ctx="' + h(ctx) + '" aria-pressed="' + sel + '"' + (where || (!sel && chosen.length >= max) ? ' disabled' : '') + '>' +
        '<b style="font-size:14px;display:inline-flex;align-items:center;gap:6px">' + h(s.name) + (s.concentration ? '<span class="conc" title="Concentration"><i role="img" aria-label="Concentration"></i></span>' : '') + '</b>' +
        '<small>' + h(where ? 'Already from ' + where : s.school + ' · ' + s.time) + '</small><small style="color:var(--body2)">' + h(eff) + '</small></button>';
    }).join('') + '</div>' +
      (hov ? '<div class="detail"><b>' + h(hov.name) + '</b><span class="muted2" style="font-size:12px">' + h([hov.school, hov.time, hov.range, hov.components, hov.duration].join(' · ')) + '</span><span style="font-size:13px;line-height:1.5;color:var(--body2);white-space:pre-line">' + h(hov.text) + '</span></div>'
        : '<div class="detail"><span class="muted2" style="font-size:13px">Hover or tap a spell to read what it does.</span></div>');
  }

  /* ---------- step 3: background ---------- */
  function stepBackground(ch) {
    var cur = ch.background && ch.background.id, bg = bgDef(ch);
    var old = R.isOld(ch);
    if (bg && !bview().bgList) return backgroundDetails(ch, bg);
    var out = (bg ? '<div><button type="button" class="link-btn back-link" data-act="b-bg-details">← Back to ' + h(bg.name) + '</button></div>' : '') + header('What did your hero do before adventuring?', 'Your <strong>background</strong> gives you two skills, a tool, ' + (old ? 'a background feature' : 'an origin feat') + ' and some starting gear.') + rulesSwitch(ch) +
      '<div class="opt-grid">' + byName(C.all('backgrounds', on(ch))).map(function (b) {
        var feat = get(ch, 'feats', b.feat);
        return '<button type="button" class="opt" data-act="b-bg" data-arg="' + h(b.id) + '" aria-pressed="' + (cur === b.id) + '"><span class="t"><span class="nm">' + h(b.name) + '</span><span class="tag">' + h(b.sourceName.replace('System Reference Document ', 'SRD ')) + '</span></span>' +
          '<span class="p">' + h(b.pitch) + '</span><span class="meta">Skills: ' + b.skills.map(skillName).concat(b.skillChoice ? ['+' + b.skillChoice.count + ' of your choice'] : []).join(', ') + (old ? '<br>Feature: ' + h(b.feature ? b.feature.name : 'pick one') : '<br>Feat: ' + h(feat ? feat.name : b.feat || (b.featText ? b.featText.charAt(0).toUpperCase() + b.featText.slice(1) : ''))) + (old ? '' : ' · Scores: ' + (b.abilityOptions.length >= 6 ? 'any' : b.abilityOptions.map(function (a) { return a.toUpperCase(); }).join(', '))) + '</span></button>';
      }).join('') + '</div>';
    return out;
  }

  /** The second page of the Background step: what this background gives you, and the choices it needs. */
  function backgroundDetails(ch, bg) {
    var old = R.isOld(ch), fixedTool = bg.tool && bg.tool.fixed ? get(ch, 'items', bg.tool.fixed) : null;
    var eq = bg.equipment && bg.equipment.A;
    var out = '<div><button type="button" class="link-btn back-link" data-act="b-bg-change">← Choose a different background</button></div>' +
      header(bg.name, h(bg.pitch)) + rulesSwitch(ch);
    out += '<div class="notice">' + h(bg.description) + '</div>';
    var gives = [['Skills', bg.skills.map(skillName).concat(bg.skillChoice ? [bg.skillChoice.count + (bg.skills.length ? ' more' : '') + ' of your choice'] : []).join(', ') || '—'],
      ['Tool', fixedTool ? fixedTool.name : bg.tool && bg.tool.choose ? 'one ' + toolGroupName(bg.tool.choose).toLowerCase() + ' of your choice' : bg.tool ? bg.tool.fixed : '—'],
      old ? ['Feature', bg.feature ? bg.feature.name : 'one of your choice'] : ['Origin feat', (get(ch, 'feats', bg.feat) || {}).name || (bg.featText ? bg.featText.charAt(0).toUpperCase() + bg.featText.slice(1) : '—')],
      ['Ability scores', old ? 'from your species (5e rules)' : R.asiOptions(ch, bg).length >= 6 ? 'any (you choose on the Ability scores step)' : R.asiOptions(ch, bg).map(abName).join(', ') + ' (you choose on the Ability scores step)'],
      ['Equipment', eq ? (eq.text || '') + ', or 50 GP instead' : '—']];
    out += sec('What you get', '', '<dl class="gives">' + gives.map(function (g) { return '<dt>' + g[0] + '</dt><dd>' + h(g[1]) + '</dd>'; }).join('') + '</dl>');
      var feat = get(ch, 'feats', bgFeat(ch, bg));
      if (bg.skillChoice) {
        var bsk = R.bgSkills(ch, bg).slice(bg.skills.length), nb = bg.skillChoice.count;
        out += sec('Background skills', (bg.skills.length ? 'You get ' + bg.skills.map(skillName).join(' and ') + '. ' : '') + 'Choose ' + nb + (bg.skills.length ? ' more' : '') + ' from your ' + h(bg.name) + ' background.',
          '<div class="pills">' + bg.skillChoice.from.map(function (id) { var sel = bsk.indexOf(id) >= 0; return pillToggle('b-bgskill', id, h(skillName(id)), sel, !sel && bsk.length >= nb); }).join('') + '</div>', counter(bsk.length, nb));
      }
      if (old) {
        var own = bg.feature, alt = ch.background.feature, list = bgFeatures(ch);
        var shown = R.backgroundFeature(ch, bg, on(ch));
        out += sec('Background feature (5e)', (own ? 'Your ' + h(bg.name) + ' background comes with <b>' + h(own.name) + '</b>. You can keep it or swap it for another feature, with your DM’s OK.' : 'This background has no feature of its own in the older rules. Pick one that fits your story, with your DM’s OK.'),
          (shown ? '<div class="feat-box">' + CF.util.rich(shown.text, '<b>' + h(shown.name) + ':</b> ') + '</div>' : '') +
          '<div class="pills">' + (own ? pillToggle('b-bgfeature', '', h(own.name) + ' (its own)', !alt) : '') + list.map(function (f) { return pillToggle('b-bgfeature', f.id, h(f.name), alt === f.id); }).join('') + '</div>');
      } else if (bg.featCategory) out += sec('Background feat', 'Your ' + h(bg.name) + ' background gives you ' + h(bg.featText || 'a feat of your choice') + '.',
        (feat ? '<div class="feat-box">' + CF.util.rich(feat.text, '<b>' + h(feat.name) + ':</b> ') + '</div>' : '') + '<div class="pills">' + byName(C.all('feats', on(ch)).filter(function (f) { return f.category === bg.featCategory; })).map(function (f) { return pillToggle('b-bgfeat', f.id, h(f.name), ch.background.feat === f.id); }).join('') + '</div>');
      else if (!old) out += sec('Origin feat: ' + (feat ? feat.name : ''), '', (feat ? '<div class="feat-box">' + CF.util.rich(feat.text) + (bg.feat === 'magic-initiate' && bg.featList ? '<p style="margin:8px 0 0"><b>Your ' + h(bg.name) + ' background sets the list: ' + h(bg.featList.charAt(0).toUpperCase() + bg.featList.slice(1)) + '.</b></p>' : '') + '</div>' : '') + (bg.feat === 'magic-initiate' ? magicInitiate(ch, 'background') : ''));
      if (bg.tool && bg.tool.choose) {
        var tl = C.all('items', on(ch)).filter(function (i) { return i.toolGroup === bg.tool.choose; });
        out += sec(toolGroupName(bg.tool.choose), 'Your ' + bg.name + ' background makes you proficient with one of these.', '<div class="pills">' + tl.map(function (t) { return pillToggle('b-bgtool', t.id, h(t.name), ch.background.tool === t.id); }).join('') + '</div>');
      }
    if (!old && bgFeat(ch, bg) === 'magic-initiate' && bg.featCategory) out += sec('Magic Initiate: your spells', 'Choose the spell list, two cantrips and one 1st-level spell.', magicInitiate(ch, 'background'));
    var fpBg = !old && bgFeat(ch, bg) ? featPickUI(ch, 'background', bgFeat(ch, bg)) : '';
    if (fpBg) out += sec((get(ch, 'feats', bgFeat(ch, bg)) || {}).name + ': your choices', 'This feat asks you to choose when you take it.', fpBg);
    if (!old && bgFeat(ch, bg) === 'skilled') out += sec('Skilled: choose 3', 'Your Skilled feat gives you proficiency in any combination of three skills or tools.', skilledPicker(ch, ch.skilledBg, 'b-skilledbg', profHave(ch, ch.skilledBg)), counter((ch.skilledBg || []).length, 3));
    out += sec('Personality (optional)', bg.personality ? 'Your ' + h(bg.name) + ' background suggests some traits, ideals, bonds and flaws. Pick the ones that fit, roll for them, or write your own.' : 'Write a few words for each, or leave them for later. You can change them any time on the sheet.', CF.ui.personality.editor(ch, bg));
    var left = (status(ch).background || []);
    out += left.length ? '<div class="notice">Still to choose here: ' + h(left.join(', ')) + '.</div>' : '<div class="notice ok-note">All set for your background. Continue when you’re ready.</div>';
    return out;
  }

  function magicInitiate(ch, source) {
    var mi = (ch.magicInitiate || []).find(function (m) { return m.source === source; }); if (!mi) return '';
    var out = '';
    if (source === 'species' || !(bgDef(ch) || {}).featList) out += '<div class="b-field">Spell list<div class="seg">' + ['cleric', 'druid', 'wizard'].map(function (l) { return '<button type="button" data-act="b-mi-list" data-arg="' + source + ':' + l + '" aria-pressed="' + (mi.list === l) + '">' + h(l.charAt(0).toUpperCase() + l.slice(1)) + '</button>'; }).join('') + '</div></div>';
    out += '<div class="b-field">Spellcasting ability for these spells<div class="seg">' + ['int', 'wis', 'cha'].map(function (a) { return '<button type="button" data-act="b-mi-ability" data-arg="' + source + ':' + a + '" aria-pressed="' + (mi.ability === a) + '">' + abName(a) + '</button>'; }).join('') + '</div></div>';
    out += '<div><b style="font-size:14px">Two ' + h(mi.list) + ' cantrips</b> ' + counter((mi.cantrips || []).length, 2) + '</div>' + spellPicker(ch, spellsFor(ch, mi.list, 0), mi.cantrips || [], 2, 'b-mi-cantrip-' + source, 'mi-' + source);
    out += '<div><b style="font-size:14px">One 1st-level ' + h(mi.list) + ' spell</b> ' + counter(mi.spell ? 1 : 0, 1) + '</div>' + spellPicker(ch, spellsFor(ch, mi.list, 1), mi.spell ? [mi.spell] : [], 1, 'b-mi-spell-' + source, 'mi-' + source);
    return out;
  }

  /* ---------- step 4: species ---------- */
  function stepSpecies(ch) {
    var sp = spDef(ch), cur = ch.species && ch.species.id;
    if (sp && !bview().spList) return speciesDetails(ch, sp);
    var out = (sp ? '<div><button type="button" class="link-btn back-link" data-act="b-sp-details">← Back to ' + h(sp.name) + '</button></div>' : '') + header('Who are your hero’s people?', 'Your <strong>species</strong> sets your size and speed and gives you special traits.') +
      '<div class="opt-grid">' + byName(C.all('species', on(ch))).map(function (s) {
        return '<button type="button" class="opt" data-act="b-species" data-arg="' + h(s.id) + '" aria-pressed="' + (cur === s.id) + '"><span class="t"><span class="nm">' + h(s.name) + '</span><span class="tag">' + h(s.size) + ' · ' + s.speed + ' ft</span></span>' +
          '<span class="p">' + h(s.pitch) + '</span><span class="meta">' + s.traits.slice(0, 3).map(function (t) { return h(t.name); }).join(' · ') + '</span></button>';
      }).join('') + '</div>';
    return out;
  }

  /** The second page of the Species step: what this species gives you, and the choices it needs. */
  function speciesDetails(ch, sp) {
    var out = '<div><button type="button" class="link-btn back-link" data-act="b-sp-change">← Choose a different species</button></div>' + header(sp.name, h(sp.pitch));
    var dv = sp.senses && sp.senses.darkvision;
    var gives = [['Size', sp.sizeChoice ? 'Medium or Small (your choice)' : sp.size], ['Speed', sp.speed + ' ft'], ['Darkvision', dv ? dv + ' ft' : '—']];
    if ((sp.defenses || []).length) gives.push(['Defenses', sp.defenses.map(function (d) { return ({ resist: 'Resistance to ', immune: 'Immune to ', advantage: 'Advantage on ' })[d.kind] + d.text; }).join('; ')]);
    if (R.isOld(ch)) gives.push(['Ability scores', '+2 / +1 or +1 / +1 / +1 to any scores (5e rules; you choose on the Ability scores step)']);
    out += sec('What you get', '', '<dl class="gives">' + gives.map(function (g) { return '<dt>' + g[0] + '</dt><dd>' + h(g[1]) + '</dd>'; }).join('') + '</dl>');
    out += sec(sp.name + ' traits', '', '<div style="display:flex;flex-direction:column;gap:8px">' + sp.traits.map(function (t) { return '<div><b style="font-size:14px">' + h(t.name) + '.</b> <span style="font-size:14px;color:var(--body2)">' + h(t.text) + '</span></div>'; }).join('') + '</div>');
    if (sp.lineages) out += sec(sp.lineageLabel || 'Lineage', 'Choose one.', '<div class="opt-grid">' + sp.lineages.map(function (l) {
      return '<button type="button" class="opt" data-act="b-lineage" data-arg="' + h(l.id) + '" aria-pressed="' + (ch.species.lineage === l.id) + '"><span class="nm" style="font-size:17px">' + h(l.name) + '</span><span class="p">' + h(l.text) + '</span></button>';
    }).join('') + '</div>');
    if (sp.keenSenses) out += sec('Keen Senses', 'Choose the skill your sharp elven senses help with.', '<div class="pills">' + sp.keenSenses.map(function (s) { return pillToggle('b-keen', s, h(skillName(s)), ch.species.keenSense === s); }).join('') + '</div>');
    var hasCantrip = (sp.cantrips || []).length || (sp.lineages || []).some(function (l) { return (l.cantrips || []).length; });
    if (hasCantrip) out += sec('Spellcasting ability', 'Your species gives you a cantrip. Choose which ability powers it (usually the same as your class’s).', '<div class="seg">' + ['int', 'wis', 'cha'].map(function (a) { return '<button type="button" data-act="b-spability" data-arg="' + a + '" aria-pressed="' + (ch.species.spellAbility === a) + '">' + abName(a) + '</button>'; }).join('') + '</div>');
    if (sp.size === 'Medium' && (sp.sizeChoice || sp.id === 'human' || sp.id === 'tiefling')) out += sec('Size', 'You can be Medium (about 4–7 ft tall) or Small (about 2–4 ft tall).', '<div class="seg">' + ['Medium', 'Small'].map(function (z) { return '<button type="button" data-act="b-size" data-arg="' + z + '" aria-pressed="' + ((ch.species.size || 'Medium') === z) + '">' + z + '</button>'; }).join('') + '</div>');
    if (skillfulOn(ch, sp)) {
      var taken = R.derive(ch).skills.filter(function (s) { return s.prof && s.from !== 'Skillful'; }).map(function (s) { return s.id; });
      out += sec(sp.skillful ? 'Skillful' : 'Skill proficiency', sp.id === 'human' ? 'Humans pick up one extra skill of their choice.' : 'You gain proficiency in one skill of your choice.', '<div class="pills">' + R.SKILLS.map(function (s) { var t = taken.indexOf(s.id) >= 0; return pillToggle('b-hskill', s.id, h(s.name), ch.species.skill === s.id || t, t, t ? ' <small>(have it)</small>' : ''); }).join('') + '</div>');
    }
    if (sp.versatile) {
      var bg = bgDef(ch);
      out += sec(sp.id === 'human' ? 'Versatile: origin feat' : 'Feat: origin feat', (sp.id === 'human' ? 'Humans get an extra origin feat.' : 'Your ' + h(sp.name) + ' gives you an origin feat of your choice.') + (bg ? ' (Your ' + bg.name + ' background already gives ' + (get(ch, 'feats', bg.feat) || {}).name + '.)' : ''),
        '<div class="opt-grid">' + byName(C.all('feats', on(ch)).filter(function (f) { return f.category === 'origin' && (!bg || f.id !== bg.feat || f.id === 'magic-initiate'); })).map(function (f) {
          return '<button type="button" class="opt" data-act="b-hfeat" data-arg="' + h(f.id) + '" aria-pressed="' + (ch.species.feat === f.id) + '"><span class="nm" style="font-size:17px">' + h(f.name) + '</span><span class="p">' + h(f.pitch) + '</span></button>';
        }).join('') + '</div>' +
        (ch.species.feat === 'magic-initiate' ? magicInitiate(ch, 'species') : '') + (ch.species.feat ? featPickUI(ch, 'species', ch.species.feat) : '') +
        (ch.species.feat === 'skilled' ? '<div><b style="font-size:14px">Skilled: choose 3</b> ' + counter((ch.skilled || []).length, 3) + '</div>' + skilledPicker(ch, ch.skilled, 'b-skilled', profHave(ch, ch.skilled)) : ''));
    }
    var left = status(ch).species || [];
    out += left.length ? '<div class="notice">Still to choose here: ' + h(left.join(', ')) + '.</div>' : '<div class="notice ok-note">All set for your species. Continue when you’re ready.</div>';
    return out;
  }

  /* ---------- step 5: ability scores ---------- */
  function stepAbilities(ch) {
    var a = ch.abilities, c = cls(ch), bg = bgDef(ch), m = a.method;
    var prio = c ? PRIORITY[c.id] || [] : [];
    var out = header('How strong, quick and clever is your hero?', 'Six <strong>ability scores</strong> describe your hero. Higher is better; 10 is an average person. The <strong>modifier</strong> is what you add to dice rolls.');
    out += '<div class="seg" role="group" aria-label="How to set scores">' + [['array', 'Standard array'], ['buy', 'Point buy'], ['roll', 'Roll dice'], ['manual', 'Enter my own']].map(function (x) {
      return '<button type="button" data-act="q-method" data-arg="' + x[0] + '" aria-pressed="' + (m === x[0]) + '">' + x[1] + '</button>';
    }).join('') + '</div>';
    var helpTxt = { manual: 'You entered your own scores (for example rolled at the table). Change them here or in the quick builder.', array: 'Everyone gets the same six numbers: 15, 14, 13, 12, 10, 8. Put each one where you like.', buy: 'Every score starts at 8. Spend 27 points to raise them; higher scores cost more. Nothing goes above 15 before bonuses.', roll: 'Roll four six-sided dice for each score and drop the lowest. Exciting, but heroes can end up uneven. Check with your DM first.' };
    if (m && helpTxt[m]) {
      var spent = R.ABILITIES.reduce(function (t, x) { return t + (COST[a.base[x.id]] || 0); }, 0);
      out += '<div class="b-sec" style="flex-direction:row;flex-wrap:wrap;align-items:center;gap:10px 16px"><p class="why" style="flex:1 1 300px">' + helpTxt[m] + '</p>' +
        (m === 'buy' ? '<span class="count' + (spent === 27 ? ' ok' : '') + '">' + (27 - spent) + ' of 27 points left</span>' : '') +
        (m === 'roll' ? '<button class="btn btn-teal" data-act="b-roll">' + ((a.rolled || []).length ? 'Roll again' : 'Roll the dice') + '</button>' : '') +
        (m !== 'buy' && c && (m === 'array' || (a.rolled || []).length) ? '<button class="btn" data-act="b-recommend">Use recommended for ' + h(c.name) + '</button>' : '') + '</div>';
    } else out += '<div class="notice">Pick a method above to set your scores.</div>';

    var d = R.derive(ch), asi = (ch.background && ch.background.asi) || {};
    if (m) {
      var pool = m === 'array' ? ARRAY : m === 'roll' ? (a.rolled || []) : null;
      out += '<div class="card">' + R.ABILITIES.map(function (ab) {
        var base = a.base[ab.id], key = prio.slice(0, 2).indexOf(ab.id) >= 0;
        var ctrl;
        if (m === 'buy') ctrl = '<button class="step-btn" data-act="b-buy" data-arg="' + ab.id + ':-1" aria-label="Lower ' + ab.name + '"' + (base <= 8 ? ' disabled' : '') + '>−</button><span style="width:40px;text-align:center;font-size:22px;font-weight:600">' + base + '</span><button class="step-btn" data-act="b-buy" data-arg="' + ab.id + ':1" aria-label="Raise ' + ab.name + '"' + (base >= 15 || COST[base + 1] - COST[base] > 27 - R.ABILITIES.reduce(function (t, x) { return t + (COST[a.base[x.id]] || 0); }, 0) ? ' disabled' : '') + '>+</button>';
        else if (m === 'manual') ctrl = '<input type="number" min="3" max="20" value="' + base + '" data-act="q-score" data-arg="' + ab.id + '" data-key="q-score-' + ab.id + '" aria-label="' + ab.name + ' base score" style="width:72px;min-height:44px;border-radius:10px;border:1.5px solid var(--line2);background:var(--surface);padding:0 10px;font-size:17px">';
        else if (pool && pool.length) ctrl = '<select data-act="b-assign" data-arg="' + ab.id + '" aria-label="' + ab.name + ' score">' + pool.map(function (v, i) { return '<option value="' + i + '"' + ((a.assign || {})[ab.id] === i ? ' selected' : '') + '>' + v + '</option>'; }).join('') + '</select>';
        else ctrl = '<span class="muted2">—</span>';
        return '<div class="abil-row"><div class="nm"><span style="display:flex;align-items:center;gap:8px"><b style="font-size:17px">' + ab.name + '</b>' + (key && c ? '<span class="badge" style="font-size:12px">Key for ' + h(c.name) + 's</span>' : '') + '</span><span class="muted2" style="font-size:14px">' + h(ABIL_HELP[ab.id]) + '</span></div>' +
          '<div style="display:flex;align-items:center;gap:8px">' + ctrl + '</div>' +
          '<span style="width:110px;font-size:14px;font-weight:500;color:var(--teal)">' + (asi[ab.id] ? '+' + asi[ab.id] + (R.isOld(ch) ? ' species' : ' background') : '') + '</span>' +
          '<div class="fin"><b>' + sg(d.mods[ab.id]) + '</b><span>score ' + d.scores[ab.id] + '</span></div></div>';
      }).join('') + '</div>';
    }
    if (bg) {
      var mode = ch.background.asiMode || 'two';
      var opts = R.asiOptions(ch, bg), many = opts.length > 3, old = R.isOld(ch);
      var sel = function (role, val) {
        return '<select data-act="b-asi" data-arg="' + role + '" aria-label="' + (role === 'p2' ? 'Ability to increase by 2' : 'Ability to increase by 1') + '"><option value="">Choose…</option>' + opts.map(function (o) { return '<option value="' + o + '"' + (val === o ? ' selected' : '') + '>' + abName(o) + '</option>'; }).join('') + '</select>';
      };
      var p2 = Object.keys(asi).find(function (k) { return asi[k] === 2; }), p1 = Object.keys(asi).find(function (k) { return asi[k] === 1; });
      var three = threeOf(asi);
      var sel3 = function (i) { return '<select data-act="b-asi" data-arg="t' + i + '" aria-label="Ability to increase by 1 (' + (i + 1) + ' of 3)"><option value="">Choose…</option>' + opts.map(function (o) { return '<option value="' + o + '"' + (three[i] === o ? ' selected' : '') + '>' + abName(o) + '</option>'; }).join('') + '</select>'; };
      out += sec(old ? 'Species bonus (5e rules)' : 'Background bonus: ' + bg.name, old ? 'In the 5e rules your species raises your scores. Following the custom origin option, choose +2 to one score and +1 to another, or +1 to three different scores. Scores can’t go above 20.' : 'Your background lets you raise ' + (many ? 'any of your scores' : opts.map(abName).join(', ')) + '. Choose +2 to one and +1 to another, or +1 to ' + (many ? 'three of them' : 'all three') + '. Scores can’t go above 20.',
        '<div class="seg">' + [['two', '+2 and +1'], ['three', many ? '+1 to three' : '+1 to all three']].map(function (x) { return '<button type="button" data-act="b-asimode" data-arg="' + x[0] + '" aria-pressed="' + (mode === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        (mode === 'two' ? '<div style="display:flex;flex-wrap:wrap;gap:12px"><label class="b-field">+2 to' + sel('p2', p2) + '</label><label class="b-field">+1 to' + sel('p1', p1) + '</label></div>' : (many ? '<div style="display:flex;flex-wrap:wrap;gap:12px">' + [0, 1, 2].map(function (i) { return '<label class="b-field">+1 to' + sel3(i) + '</label>'; }).join('') + '</div>' : '<p class="why">+1 to ' + opts.map(abName).join(', ') + '.</p>')));
    }
    return out;
  }

  /* ---------- step 6: equipment ---------- */
  function itemsList(ch, o) {
    return '<ul>' + (o.items || []).map(function (it) { var d = get(ch, 'items', it[0]); return '<li>' + (it[1] > 1 ? it[1] + ' × ' : '') + h(d ? d.name : it[0]) + '</li>'; }).join('') + (o.gp ? '<li>' + o.gp + ' GP</li>' : '') + '</ul>';
  }
  function stepEquipment(ch) {
    var c = cls(ch), bg = bgDef(ch);
    var out = header('What are you carrying?', 'Pick a starting kit from your class and from your background. You can also take gold instead and buy things later.');
    if (c) out += sec(c.name + ' equipment', '', '<div class="opt-grid">' + Object.keys(c.equipment).map(function (k) {
      var o = c.equipment[k];
      return '<button type="button" class="opt equip-opt" data-act="b-cequip" data-arg="' + k + '" aria-pressed="' + (pick(ch).equipment === k) + '"><span class="nm" style="font-size:18px">Option ' + k + (o.items.length ? '' : ': gold only') + '</span>' + itemsList(ch, o) + '</button>';
    }).join('') + '</div>');
    else out += '<div class="notice">Choose a class first to see its equipment.</div>';
    if (bg) out += sec(bg.name + ' equipment', '', '<div class="opt-grid">' + Object.keys(bg.equipment).map(function (k) {
      var o = bg.equipment[k];
      var shown = Object.assign({}, o, { items: (o.items || []).map(function (it) { return (it[0] === 'dice-set' || it[0] === '@tool') && ch.background.tool ? [ch.background.tool, it[1]] : it; }) });
      return '<button type="button" class="opt equip-opt" data-act="b-bequip" data-arg="' + k + '" aria-pressed="' + (ch.background.equipment === k) + '"><span class="nm" style="font-size:18px">Option ' + k + (o.items.length ? '' : ': gold only') + '</span>' + itemsList(ch, shown) + '</button>';
    }).join('') + '</div>');
    else out += '<div class="notice">Choose a background first to see its equipment.</div>';
    if (c && bg && pick(ch).equipment && ch.background.equipment) {
      var tmp = R.applyStartingEquipment(U.clone(ch)), d = R.derive(tmp);
      out += '<div class="notice">You’ll start with ' + tmp.inventory.length + ' items and ' + tmp.currency.gp + ' GP. Armor Class with this gear: <strong>' + d.ac + '</strong>' + (d.acNote ? ' (' + h(d.acNote) + ')' : '') + '.</div>';
    }
    return out;
  }

  /* ---------- step 7: details & review ---------- */
  function stepDetails(ch, miss) {
    var d = R.derive(ch), n = languageCount(ch);
    var chosenLang = (ch.languages || []).filter(function (l) { return l !== 'common'; });
    var out = header('Name your hero and review', 'Give your hero a name, pick languages, and check everything before you finish.');
    out += sec('Name', '', '<label class="b-field">Character name<input type="text" value="' + h(ch.name) + '" data-act="b-name" data-key="b-name" placeholder="e.g. Ilsa Thornwood" autocomplete="off"></label>');
    out += sec('Languages', 'Everyone speaks Common. Pick ' + n + ' more.', '<div class="pills">' + R.STANDARD_LANGUAGES.map(function (l) {
      var sel = chosenLang.indexOf(l) >= 0; return pillToggle('b-lang', l, h(R.LANGUAGES[l]), sel, !sel && chosenLang.length >= n);
    }).join('') + '</div>', counter(chosenLang.length, n));
    var det = ch.details || {};
    out += sec('About your hero (optional)', '', '<label class="b-field">Alignment<select data-act="b-detail" data-arg="alignment"><option value="">Not decided</option>' +
      ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'].map(function (x) { return '<option' + (det.alignment === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
      '<label class="b-field">Appearance<textarea data-act="b-detail" data-arg="appearance" data-key="b-app" placeholder="Hair, eyes, clothes, scars…">' + h(det.appearance || '') + '</textarea></label>' +
      '<label class="b-field">Backstory<textarea data-act="b-detail" data-arg="backstory" data-key="b-story" placeholder="Where do they come from? What do they want?">' + h(det.backstory || '') + '</textarea></label>');
    var all = STEPS.map(function (s) { return [s, miss[s[0]]]; });
    out += sec('Review', 'Here’s your hero at level 1.',
      '<div class="spell-stats">' + [['HP', d.hpMax], ['AC', ch.inventory.length || pick(ch).equipment ? R.derive(R.applyStartingEquipment(U.clone(ch))).ac : '—'], ['Initiative', sg(d.initiative)], ['Speed', d.speed + ' ft'], ['Proficiency', sg(d.pb)]].map(function (x) { return '<div><span class="v">' + x[1] + '</span><span class="k">' + x[0] + '</span></div>'; }).join('') + '</div>' +
      '<ul class="check-list">' + all.map(function (x) {
        return '<li>' + (x[1].length ? '<span class="no">!</span><span><button class="link-btn" style="font-size:14px;padding:0;color:var(--ink)" data-act="b-step" data-arg="' + x[0][0] + '">' + h(x[0][1]) + '</button>: ' + h(x[1].join(', ')) + '</span>' : '<span class="ok">✓</span><span>' + h(x[0][1]) + '</span>') + '</li>';
      }).join('') + '</ul>');
    return out;
  }

  /* ---------- handlers ---------- */
  var H = app.handlers, HV = app.hoverHandlers;
  function cur() { return CF.store.get(CUR); }
  function bmut(fn, keepFocus) {
    var ch = cur(); if (!ch) return;
    fn(ch); normalize(ch);
    if (!CF.store.put(ch)) app.flash('Couldn’t save the draft: this browser’s storage is full or blocked.', true);
    app.render();
  }
  function toggleIn(list, id, max) { list = list || []; var i = list.indexOf(id); if (i >= 0) list.splice(i, 1); else if (list.length < max) list.push(id); return list; }

  CF.ui.newDraft = function (mode) {
    var ch = R.blankCharacter();
    ch.rules = (CF.store.settings().rules === '2014') ? '2014' : '2024';
    ch.draft = true; ch.builder = mode === 'quick' ? { mode: 'quick', step: 'class', target: 1 } : { step: 'class' };
    ch.abilities = { method: 'array', base: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }, assign: { str: 0, dex: 1, con: 2, int: 3, wis: 4, cha: 5 } };
    if (!CF.store.put(ch)) { app.flash('Couldn’t save: this browser’s storage is full or blocked.', true); app.render(); return; }
    app.go((mode === 'quick' ? '#/quick/' : '#/build/') + encodeURIComponent(ch.id));
  };

  H['b-step'] = function (s) { bmut(function (ch) { ch.builder = ch.builder || {}; ch.builder.step = s; }); app.view.b = Object.assign(bview(), { hover: null }); try { root.scrollTo(0, 0); } catch (e) { /* ignore */ } };
  H['b-filter'] = function (f) { bview().filter = f; app.render(); };
  HV['b-spell'] = function (id, el) {
    var ctx = (el && el.getAttribute('data-ctx')) || '';
    if (bview().hover !== id || bview().hoverCtx !== ctx) { bview().hover = id; bview().hoverCtx = ctx; app.render(); }
  };

  H['b-class'] = function (id) {
    bmut(function (ch) {
      if (pick(ch).id === id) return;
      ch.classes = [{ id: id, level: 1, skills: [], masteries: [], choices: {}, expertise: [], cantrips: [], tools: [] }];
      ch.spells.prepared = [];
      var p = PRIORITY[id];
      if (ch.abilities.method === 'array' && p) { ch.abilities.assign = {}; p.forEach(function (ab, i) { ch.abilities.assign[ab] = i; ch.abilities.base[ab] = ARRAY[i]; }); }
    });
  };
  H['b-skill'] = function (id) { bmut(function (ch) { var c = cls(ch); ch.classes[0].skills = toggleIn(ch.classes[0].skills, id, c.skillChoices.count); }); };
  H['b-mastery'] = function (id) { bmut(function (ch) { ch.classes[0].masteries = toggleIn(ch.classes[0].masteries, id, cls(ch).weaponMasteries); }); };
  H['b-expertise'] = function (id) { bmut(function (ch) { ch.classes[0].expertise = toggleIn(ch.classes[0].expertise, id, cls(ch).expertise); }); };
  H['b-tool'] = function (id) { bmut(function (ch) { ch.classes[0].tools = toggleIn(ch.classes[0].tools, id, cls(ch).toolChoice.count); }); };
  H['b-choice'] = function (arg) { var p = arg.split(':'); bmut(function (ch) { ch.classes[0].choices = ch.classes[0].choices || {}; ch.classes[0].choices[p[0]] = p[1]; }); };
  H['b-cantrip'] = function (id) { bmut(function (ch) { ch.classes[0].cantrips = toggleIn(ch.classes[0].cantrips, id, classCantrips(ch)); }); };
  H['b-prepared'] = function (id) { bmut(function (ch) { ch.spells.prepared = toggleIn(ch.spells.prepared, id, classPrepared(ch)); }); };

  H['b-bg-change'] = function () { bview().bgList = true; try { root.scrollTo(0, 0); } catch (e) {} app.render(); };
  H['b-bg-details'] = function () { bview().bgList = false; try { root.scrollTo(0, 0); } catch (e) {} app.render(); };
  H['b-bg'] = function (id) {
    bview().bgList = false; try { root.scrollTo(0, 0); } catch (e) {}
    bmut(function (ch) {
      if (ch.background && ch.background.id === id) return;
      var b = get(ch, 'backgrounds', id), c = cls(ch), prio = c ? PRIORITY[c.id] : ['str', 'dex', 'con', 'int', 'wis', 'cha'];
      var best = R.asiOptions(ch, b).slice().sort(function (x, y) { return (prio.indexOf(x) + 99) % 99 - (prio.indexOf(y) + 99) % 99; });
      var asi = {}; asi[best[0]] = 2; asi[best[1]] = 1;
      ch.background = { id: id, asi: asi, asiMode: 'two', tool: b.tool && b.tool.fixed ? b.tool.fixed : null, equipment: null };
    });
  };
  H['b-bgtool'] = function (id) { bmut(function (ch) { ch.background.tool = id; }); };
  H['b-bgskill'] = function (id) {
    bmut(function (ch) {
      var bg = bgDef(ch); if (!bg || !bg.skillChoice) return;
      var cur = (ch.background.skills || []).slice(), i = cur.indexOf(id);
      if (i >= 0) cur.splice(i, 1); else if (cur.length < bg.skillChoice.count) cur.push(id);
      ch.background.skills = cur;
      var p = ch.classes && ch.classes[0]; if (p && p.skills) p.skills = p.skills.filter(function (s) { return cur.indexOf(s) < 0; });
    });
  };
  H['b-rules'] = function (r) { bmut(function (ch) { ch.rules = r === '2014' ? '2014' : '2024'; if (ch.background) { ch.background.asi = {}; ch.background.asiMode = 'two'; } }); };
  H['b-bgfeature'] = function (id) { bmut(function (ch) { ch.background.feature = id || null; }); };
  H['b-bgfeat'] = function (id) { bmut(function (ch) { ch.background.feat = id; }); };
  function byName(list) { return list.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }); }
  /** The +1/+1/+1 picker when there are more than three options (any score). */
  function threeOf(asi) { return Object.keys(asi).filter(function (k) { return asi[k] === 1; }); }
  function rulesSwitch(ch) {
    return '<div class="rules-switch"><span class="muted" style="font-size:14px">Rules for this hero</span><div class="seg">' + [['2024', '5.5e (2024)'], ['2014', '5e (2014)']].map(function (x) {
      return '<button type="button" data-act="b-rules" data-arg="' + x[0] + '" aria-pressed="' + ((R.isOld(ch) ? '2014' : '2024') === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<span class="muted2" style="font-size:13px">' + (R.isOld(ch) ? 'Ability bonuses come from your species, your background gives a background feature instead of a feat.' : 'Ability bonuses and an origin feat come from your background.') + '</span></div>';
  }
  function bgFeatures(ch) { return byName(C.all('backgroundFeatures', on(ch))); }
  /** Skilled: three skills or tools, in any mix. picks = current list; have = ids proficient from elsewhere. */
  function skilledPicker(ch, picks, act, have) {
    picks = picks || []; var full = picks.length >= 3;
    var one = function (id, label) { var sel = picks.indexOf(id) >= 0, got = !sel && have.indexOf(id) >= 0; return pillToggle(act, id, h(label) + (got ? ' <small>(have it)</small>' : ''), sel || got, got || (!sel && full)); };
    return '<div class="skilled-pick"><div class="muted" style="font-size:13px">Any mix of skills and tools, ' + picks.length + ' of 3 chosen' + (picks.length ? ': ' + h(picks.map(function (id) { var sk = R.skill(id); if (sk) return sk.name; var t = get(ch, 'items', id); return t ? t.name : id; }).join(', ')) : '') + '.</div>' +
      '<div class="skilled-group"><b>Skills</b><div class="pills">' + R.SKILLS.map(function (sk) { return one(sk.id, sk.name); }).join('') + '</div></div>' +
      R.skilledTools(on(ch)).map(function (g) { return '<div class="skilled-group"><b>' + h(g[0]) + '</b><div class="pills">' + g[1].map(function (t) { return one(t.id, t.name); }).join('') + '</div></div>'; }).join('') + '</div>';
  }
  /** What a hero already has, so Skilled doesn't waste a pick. */
  function profHave(ch, except) {
    var d = R.derive(ch);
    return d.skills.filter(function (s) { return s.prof && s.from !== 'Skilled'; }).map(function (s) { return s.id; }).concat(ch.tools || []).filter(function (id) { return (except || []).indexOf(id) < 0; });
  }
  function knownSpellIds(ch) { var d = R.derive(ch); return d.spell ? d.spell.spells.map(function (s) { return s.id; }) : []; }
  function featPickUI(ch, key, featId) { var f = get(ch, 'feats', featId); return f ? CF.ui.featPicks.render(f, (ch.featPicks || {})[key], 'fp', key, on(ch), knownSpellIds(ch)) : ''; }
  function bgFeat(ch, bg) { return bg ? bg.feat || (bg.featCategory && ch.background && ch.background.feat) || null : null; }
  function toolGroupName(g) { return ({ artisan: 'Artisan’s tools', 'gaming-set': 'Gaming set', 'musical-instrument': 'Musical instrument' })[g] || 'Tool'; }
  function miFor(ch, source) { return (ch.magicInitiate || []).find(function (m) { return m.source === source; }); }
  H['b-mi-list'] = function (arg) { var p = arg.split(':'); bmut(function (ch) { var m = miFor(ch, p[0]); if (m && m.list !== p[1]) { m.list = p[1]; m.cantrips = []; m.spell = null; } }); };
  H['b-mi-ability'] = function (arg) { var p = arg.split(':'); bmut(function (ch) { var m = miFor(ch, p[0]); if (m) m.ability = p[1]; }); };
  ['background', 'species'].forEach(function (src) {
    H['b-mi-cantrip-' + src] = function (id) { bmut(function (ch) { var m = miFor(ch, src); if (m) m.cantrips = toggleIn(m.cantrips, id, 2); }); };
    H['b-mi-spell-' + src] = function (id) { bmut(function (ch) { var m = miFor(ch, src); if (m) m.spell = m.spell === id ? null : id; }); };
  });

  H['b-sp-change'] = function () { bview().spList = true; try { root.scrollTo(0, 0); } catch (e) {} app.render(); };
  H['b-sp-details'] = function () { bview().spList = false; try { root.scrollTo(0, 0); } catch (e) {} app.render(); };
  H['b-species'] = function (id) {
    bview().spList = false; try { root.scrollTo(0, 0); } catch (e) {}
    bmut(function (ch) {
      if (ch.species && ch.species.id === id) return;
      var c = cls(ch), ab = c && c.spellcasting ? c.spellcasting.ability : 'wis';
      ch.species = { id: id, lineage: null, keenSense: null, spellAbility: ab, size: null, skill: null, feat: null };
    });
  };
  H['b-lineage'] = function (id) { bmut(function (ch) { ch.species.lineage = id; }); };
  H['b-keen'] = function (id) { bmut(function (ch) { ch.species.keenSense = id; }); };
  H['b-spability'] = function (a) { bmut(function (ch) { ch.species.spellAbility = a; }); };
  H['b-size'] = function (z) { bmut(function (ch) { ch.species.size = z; }); };
  H['b-hskill'] = function (id) { bmut(function (ch) { ch.species.skill = ch.species.skill === id ? null : id; }); };
  H['b-hfeat'] = function (id) { bmut(function (ch) { ch.species.feat = id; }); };
  ['opt', 'sp', 'ab'].forEach(function (kind) {
    H['fp-' + kind] = function (arg) {
      var parts = String(arg).split('|'), key = parts.shift();
      bmut(function (ch) {
        var fid = key === 'background' ? bgFeat(ch, bgDef(ch)) : ch.species && ch.species.feat;
        var f = fid && get(ch, 'feats', fid); if (!f) return;
        ch.featPicks = ch.featPicks || {};
        ch.featPicks[key] = CF.ui.featPicks.apply(f, ch.featPicks[key] && ch.featPicks[key].feat === fid ? ch.featPicks[key] : { feat: fid }, kind, parts);
      });
    };
  });
  H['b-skilled'] = function (id) { bmut(function (ch) { ch.skilled = toggleIn(ch.skilled, id, 3); }); };
  H['b-skilledbg'] = function (id) { bmut(function (ch) { ch.skilledBg = toggleIn(ch.skilledBg, id, 3); }); };

  H['b-method'] = function (m) {
    bmut(function (ch) {
      var a = ch.abilities; if (a.method === m) return;
      a.method = m;
      var c = cls(ch), prio = c ? PRIORITY[c.id] : R.ABILITIES.map(function (x) { return x.id; });
      if (m === 'buy') R.ABILITIES.forEach(function (x) { a.base[x.id] = 8; });
      if (m === 'array') { a.assign = {}; prio.forEach(function (ab, i) { a.assign[ab] = i; a.base[ab] = ARRAY[i]; }); }
      if (m === 'roll') { a.rolled = []; a.assign = {}; R.ABILITIES.forEach(function (x) { a.base[x.id] = 10; }); }
    });
  };
  H['b-buy'] = function (arg) {
    var p = arg.split(':');
    bmut(function (ch) {
      var a = ch.abilities, v = a.base[p[0]] + (+p[1]);
      var spent = R.ABILITIES.reduce(function (t, x) { return t + (COST[a.base[x.id]] || 0); }, 0) - COST[a.base[p[0]]] + (COST[v] == null ? 99 : COST[v]);
      if (v >= 8 && v <= 15 && spent <= 27) a.base[p[0]] = v;
    });
  };
  H['b-roll'] = function () {
    bmut(function (ch) {
      var a = ch.abilities;
      a.rolled = R.ABILITIES.map(function () { var r = [0, 0, 0, 0].map(function () { return 1 + Math.floor(Math.random() * 6); }).sort(function (x, y) { return x - y; }); return r[1] + r[2] + r[3]; });
      var c = cls(ch), prio = c ? PRIORITY[c.id] : R.ABILITIES.map(function (x) { return x.id; });
      var order = a.rolled.map(function (v, i) { return i; }).sort(function (x, y) { return a.rolled[y] - a.rolled[x]; });
      a.assign = {}; prio.forEach(function (ab, i) { a.assign[ab] = order[i]; a.base[ab] = a.rolled[order[i]]; });
    });
  };
  H['b-recommend'] = function () {
    bmut(function (ch) {
      var a = ch.abilities, c = cls(ch), prio = PRIORITY[c.id];
      var pool = a.method === 'array' ? ARRAY : a.rolled;
      var order = pool.map(function (v, i) { return i; }).sort(function (x, y) { return pool[y] - pool[x]; });
      a.assign = {}; prio.forEach(function (ab, i) { a.assign[ab] = order[i]; a.base[ab] = pool[order[i]]; });
    });
  };
  H['b-assign'] = function (ab, el) {
    var idx = +el.value;
    bmut(function (ch) {
      var a = ch.abilities, pool = a.method === 'array' ? ARRAY : a.rolled;
      var other = Object.keys(a.assign).find(function (k) { return a.assign[k] === idx && k !== ab; });
      if (other) { a.assign[other] = a.assign[ab]; a.base[other] = pool[a.assign[other]]; }   // swap
      a.assign[ab] = idx; a.base[ab] = pool[idx];
    });
  };
  H['b-asimode'] = function (mode) {
    bmut(function (ch) {
      var b = bgDef(ch), opts = R.asiOptions(ch, b); ch.background.asiMode = mode;
      var prio = cls(ch) ? PRIORITY[cls(ch).id].concat(['con', 'dex', 'wis', 'str', 'int', 'cha']) : opts;
      var best = opts.slice().sort(function (x, y) { return (prio.indexOf(x) + 99) % 99 - (prio.indexOf(y) + 99) % 99; });
      ch.background.asi = {};
      if (mode === 'three') best.slice(0, 3).forEach(function (o) { ch.background.asi[o] = 1; });
      else { ch.background.asi[best[0]] = 2; ch.background.asi[best[1]] = 1; }
    });
  };
  H['b-asi'] = function (role, el) {
    var v = el.value;
    bmut(function (ch) {
      var asi = ch.background.asi || {};
      if (role.charAt(0) === 't') {
        var three = threeOf(asi), i = +role.slice(1), j = three.indexOf(v);
        if (j >= 0 && j !== i) three[j] = three[i];      // swap
        three[i] = v; ch.background.asi = {}; three.forEach(function (k) { if (k) ch.background.asi[k] = 1; }); return;
      }
      var p2 = Object.keys(asi).find(function (k) { return asi[k] === 2; }), p1 = Object.keys(asi).find(function (k) { return asi[k] === 1; });
      if (role === 'p2') { if (v === p1) p1 = p2; p2 = v; } else { if (v === p2) p2 = p1; p1 = v; }
      ch.background.asi = {}; if (p2) ch.background.asi[p2] = 2; if (p1) ch.background.asi[p1] = 1;
    });
  };
  H['b-cequip'] = function (k) { bmut(function (ch) { ch.classes[0].equipment = k; }); };
  H['b-bequip'] = function (k) { bmut(function (ch) { ch.background.equipment = k; }); };
  H['b-name'] = function (a, el) { var ch = cur(); if (!ch) return; ch.name = el.value; CF.store.putSoon(ch); };
  H['b-lang'] = function (l) { bmut(function (ch) { var rest = (ch.languages || []).filter(function (x) { return x !== 'common'; }); ch.languages = ['common'].concat(toggleIn(rest, l, languageCount(ch))); }); };
  H['b-detail'] = function (k, el) { var ch = cur(); if (!ch) return; ch.details = ch.details || {}; ch.details[k] = el.value; CF.store.putSoon(ch); };
  H['b-finish'] = function () {
    var ch = cur(); if (!ch) return;
    var name = (app.el.querySelector('[data-key="b-name"]') || app.el.querySelector('[data-key="q-name"]') || {}).value; if (name != null) ch.name = name;
    normalize(ch);
    var miss = status(ch);
    if (STEPS.some(function (s) { return miss[s[0]].length; })) { app.flash('A few choices are still missing. See the list on the right.', true); CF.store.put(ch); app.render(); return; }
    R.applyStartingEquipment(ch);
    var target = (ch.builder && ch.builder.target) || 1;
    delete ch.draft; delete ch.builder;
    // a Human gets Heroic Inspiration from Resourceful
    ch.play = Object.assign(R.freshPlayState(), { inspiration: ch.species.id === 'human' });
    if (target > 1) ch.quickChain = target;
    CF.store.put(ch);
    if (target > 1) {
      app.flash(ch.name + ' is ready at level 1. Now make the choices for level 2 (' + (target - 1) + ' level' + (target > 2 ? 's' : '') + ' to go).');
      app.go('#/levelup/' + encodeURIComponent(ch.id));
      return;
    }
    app.flash(ch.name + ' is ready! This is the overview; switch to Play when your session starts.');
    app.go('#/c/' + encodeURIComponent(ch.id));
  };


  /* ================= quick builder: everything on one page, for players who know the rules ================= */
  function opt(v, label, cur, dis) { return '<option value="' + h(v) + '"' + (cur === v ? ' selected' : '') + (dis ? ' disabled' : '') + '>' + h(label) + '</option>'; }
  function qsel(kind, label, options, cur, placeholder) {
    return '<label class="b-field">' + h(label) + '<select data-act="q-sel" data-arg="' + h(kind) + '">' + (cur ? '' : '<option value="">' + h(placeholder || 'Choose…') + '</option>') +
      options.map(function (o) { return opt(o[0], o[1], cur, o[2]); }).join('') + '</select></label>';
  }
  function qsec(title, inner, right) {
    return '<section class="q-sec"><div class="q-head"><h2>' + h(title) + '</h2>' + (right || '') + '</div>' + inner + '</section>';
  }
  function qrow(label, inner, count) {
    return '<div class="q-row"><div class="q-lbl">' + h(label) + (count || '') + '</div><div class="pills">' + inner + '</div></div>';
  }
  function qcount(n, max) { return ' <span class="count' + (n >= max ? ' ok' : '') + '">' + n + '/' + max + '</span>'; }
  function spellPills(ch, list, chosen, max, action, ctx) {
    var taken = takenElsewhere(ch, ctx);
    return list.map(function (s) {
      var sel = chosen.indexOf(s.id) >= 0, where = !sel && taken[s.id];
      return '<button type="button" class="pill" data-act="' + action + '" data-arg="' + h(s.id) + '" data-hover="b-spell" data-ctx="' + h(ctx) + '" aria-pressed="' + sel + '"' + (where || (!sel && chosen.length >= max) ? ' disabled' : '') + (where ? ' title="Already from ' + h(where) + '"' : '') + '>' + h(s.name) +
        (s.concentration ? ' <span class="conc" title="Concentration"><i role="img" aria-label="Concentration"></i></span>' : '') + (where ? ' <small>' + h(where) + '</small>' : '') + '</button>';
    }).join('');
  }

  CF.ui.quick = function (route) {
    var ch = CF.store.get(route.id);
    CUR = route.id;
    if (!ch) return CF.ui.topbar() + '<main class="page"><div class="empty"><b>Draft not found</b><a class="btn" href="#/">Back to characters</a></div></main>';
    var c = cls(ch), p = pick(ch), bg = bgDef(ch), sp = spDef(ch), miss = status(ch);
    var left = STEPS.reduce(function (a, st) { return a.concat(miss[st[0]]); }, []);
    var target = (ch.builder && ch.builder.target) || 1;
    var out = '';

    /* basics */
    var lineage = sp && sp.lineages ? qsel('lineage', sp.lineageLabel || 'Lineage', sp.lineages.map(function (l) { return [l.id, l.name]; }), ch.species.lineage) : '';
    out += qsec('Basics', rulesSwitch(ch) +
      '<div class="q-grid">' +
        '<label class="b-field">Name<input type="text" value="' + h(ch.name) + '" data-act="b-name" data-key="q-name" placeholder="Character name" autocomplete="off"></label>' +
        qsel('class', 'Class', C.all('classes', on(ch)).map(function (x) { return [x.id, x.name + ' (d' + x.hitDie + ')']; }), p.id) +
        qsel('bg', 'Background', byName(C.all('backgrounds', on(ch))).map(function (x) { return [x.id, x.name]; }), ch.background && ch.background.id) +
        qsel('species', 'Species', byName(C.all('species', on(ch))).map(function (x) { return [x.id, x.name]; }), ch.species && ch.species.id) + lineage +
        '<label class="b-field">Starting level<select data-act="q-sel" data-arg="level" aria-label="Starting level">' + Array.apply(null, Array((c && c.maxLevel) || 20)).map(function (x, i) { return opt(String(i + 1), 'Level ' + (i + 1) + (i ? ' (then ' + i + ' level-up' + (i > 1 ? 's' : '') + ')' : ''), String(target)); }).join('') + '</select></label>' +
      '</div>');

    /* ability scores */
    var a = ch.abilities, m = a.method, asi = (ch.background && ch.background.asi) || {}, d = R.derive(ch);
    var pool = m === 'array' ? ARRAY : m === 'roll' ? (a.rolled || []) : null;
    var spent = R.ABILITIES.reduce(function (t, x) { return t + (COST[a.base[x.id]] || 0); }, 0);
    var cells = R.ABILITIES.map(function (ab) {
      var base = a.base[ab.id], ctrl;
      if (m === 'manual') ctrl = '<input type="number" min="3" max="20" value="' + base + '" data-act="q-score" data-arg="' + ab.id + '" data-key="q-score-' + ab.id + '" aria-label="' + ab.name + ' base score">';
      else if (m === 'buy') ctrl = '<span class="q-buy"><button class="step-btn" data-act="b-buy" data-arg="' + ab.id + ':-1" aria-label="Lower ' + ab.name + '"' + (base <= 8 ? ' disabled' : '') + '>−</button><b>' + base + '</b><button class="step-btn" data-act="b-buy" data-arg="' + ab.id + ':1" aria-label="Raise ' + ab.name + '"' + (base >= 15 || COST[base + 1] - COST[base] > 27 - spent ? ' disabled' : '') + '>+</button></span>';
      else if (pool && pool.length) ctrl = '<select data-act="b-assign" data-arg="' + ab.id + '" aria-label="' + ab.name + ' score">' + pool.map(function (v, i) { return '<option value="' + i + '"' + ((a.assign || {})[ab.id] === i ? ' selected' : '') + '>' + v + '</option>'; }).join('') + '</select>';
      else ctrl = '<span class="muted2">—</span>';
      return '<div class="q-ab"><span class="k">' + ab.abbr + '</span>' + ctrl + '<span class="fin">' + d.scores[ab.id] + ' <b>' + sg(d.mods[ab.id]) + '</b>' + (asi[ab.id] ? '<small>+' + asi[ab.id] + (R.isOld(ch) ? ' sp' : ' bg') + '</small>' : '') + '</span></div>';
    }).join('');
    var bgAsi = '';
    if (bg) {
      var mode = ch.background.asiMode || 'two', opts = R.asiOptions(ch, bg), many = opts.length > 3, three = threeOf(asi);
      var p2 = Object.keys(asi).find(function (k) { return asi[k] === 2; }), p1 = Object.keys(asi).find(function (k) { return asi[k] === 1; });
      var sel = function (role, val) { return '<select data-act="b-asi" data-arg="' + role + '" aria-label="' + (role === 'p2' ? '+2 to' : '+1 to') + '"><option value="">…</option>' + opts.map(function (o) { return opt(o, o.toUpperCase(), val); }).join('') + '</select>'; };
      var sel3 = function (i) { return '<select data-act="b-asi" data-arg="t' + i + '" aria-label="+1 to"><option value="">…</option>' + opts.map(function (o) { return opt(o, o.toUpperCase(), three[i]); }).join('') + '</select>'; };
      bgAsi = '<div class="q-inline"><span class="q-lbl">' + (R.isOld(ch) ? 'Species bonus (5e)' : h(bg.name) + ' bonus') + '</span><div class="seg">' + [['two', '+2 / +1'], ['three', '+1 / +1 / +1']].map(function (x) { return '<button type="button" data-act="b-asimode" data-arg="' + x[0] + '" aria-pressed="' + (mode === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        (mode === 'two' ? '<label class="q-mini">+2 ' + sel('p2', p2) + '</label><label class="q-mini">+1 ' + sel('p1', p1) + '</label>' : (many ? [0, 1, 2].map(function (i) { return '<label class="q-mini">+1 ' + sel3(i) + '</label>'; }).join('') : '<span class="muted2" style="font-size:13px">' + opts.map(function (o) { return o.toUpperCase(); }).join(', ') + '</span>')) + '</div>';
    }
    out += qsec('Ability scores',
      '<div class="seg" role="group" aria-label="Method">' + [['array', 'Standard array'], ['buy', 'Point buy'], ['roll', '4d6 drop lowest'], ['manual', 'Enter my own']].map(function (x) { return '<button type="button" data-act="q-method" data-arg="' + x[0] + '" aria-pressed="' + (m === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="q-abils">' + cells + '</div>' + bgAsi,
      (m === 'buy' ? '<span class="count' + (spent === 27 ? ' ok' : '') + '">' + (27 - spent) + ' pts left</span>' : '') +
      (m === 'roll' ? '<button class="btn btn-sm" data-act="b-roll">' + ((a.rolled || []).length ? 'Reroll' : 'Roll') + '</button>' : '') +
      (c && (m === 'array' || (m === 'roll' && (a.rolled || []).length)) ? '<button class="btn btn-sm" data-act="b-recommend">Auto-assign</button>' : ''));

    /* class */
    if (c) {
      var inner = '';
      var from = c.skillChoices.from === 'any' ? R.SKILLS.map(function (x) { return x.id; }) : c.skillChoices.from;
      var ns = (p.skills || []).length;
      inner += qrow('Skills', from.map(function (id) {
        var fromBg = bg && R.bgSkills(ch, bg).indexOf(id) >= 0, sel = (p.skills || []).indexOf(id) >= 0;
        return pillToggle('b-skill', id, h(R.skill(id).name), sel || fromBg, fromBg || (!sel && ns >= c.skillChoices.count), fromBg ? ' <small>bg</small>' : '');
      }).join(''), qcount(ns, c.skillChoices.count));
      R.classChoices(c, null, 1).forEach(function (q) {
        inner += '<div class="q-row"><div class="q-lbl">' + h(q.name) + '</div><select data-act="q-sel" data-arg="choice:' + h(q.id) + '" aria-label="' + h(q.name) + '">' + ((p.choices || {})[q.id] ? '' : '<option value="">Choose…</option>') +
          q.options.filter(function (o) { return (o.minLevel || 1) <= 1; }).map(function (o) { return opt(o.id, o.name + ' — ' + o.text.slice(0, 70) + (o.text.length > 70 ? '…' : ''), (p.choices || {})[q.id]); }).join('') + '</select></div>';
      });
      if (c.expertise) {
        var known = uniq((p.skills || []).concat(bg ? R.bgSkills(ch, bg) : [])), ne = (p.expertise || []).length;
        inner += qrow('Expertise', known.length ? known.map(function (id) { var sel = (p.expertise || []).indexOf(id) >= 0; return pillToggle('b-expertise', id, h(skillName(id)), sel, !sel && ne >= c.expertise); }).join('') : '<span class="muted2" style="font-size:13px">Pick skills first</span>', qcount(ne, c.expertise));
      }
      if (c.weaponMasteries) {
        var nm = (p.masteries || []).length;
        inner += qrow('Weapon masteries', masteryChoices(ch).map(function (w) { var sel = (p.masteries || []).indexOf(w.id) >= 0; return pillToggle('b-mastery', w.id, h(w.name) + ' <small>' + h(R.MASTERY[w.mastery] ? R.MASTERY[w.mastery].name : w.mastery) + '</small>', sel, !sel && nm >= c.weaponMasteries); }).join(''), qcount(nm, c.weaponMasteries));
      }
      if (c.toolChoice) {
        var groups = c.toolChoice.group === 'artisan-or-instrument' ? ['artisan', 'musical-instrument'] : [c.toolChoice.group], nt = (p.tools || []).length;
        inner += qrow(c.toolChoice.label, C.all('items', on(ch)).filter(function (i) { return i.kind === 'tool' && groups.indexOf(i.toolGroup) >= 0; }).map(function (t) { var sel = (p.tools || []).indexOf(t.id) >= 0; return pillToggle('b-tool', t.id, h(t.name), sel, !sel && nt >= c.toolChoice.count); }).join(''), qcount(nt, c.toolChoice.count));
      }
      if (c.spellcasting) {
        var L = c.spellcasting.list, nc = classCantrips(ch), npr = classPrepared(ch);
        if (nc) inner += qrow('Cantrips', spellPills(ch, spellsFor(ch, L, 0), p.cantrips || [], nc, 'b-cantrip', 'class'), qcount((p.cantrips || []).length, nc));
        if (npr) inner += qrow('1st-level spells', spellPills(ch, spellsFor(ch, L, 1).filter(function (s) { return !(c.alwaysPrepared || []).some(function (x) { return x.spell === s.id; }); }), ch.spells.prepared || [], npr, 'b-prepared', 'class'), qcount((ch.spells.prepared || []).length, npr));
        if (nc || npr) inner += spellHover(ch, 'class');
      }
      out += qsec(c.name, inner, target > 1 ? '<span class="muted2" style="font-size:12px">Level 1 choices · levels 2–' + target + ' come next</span>' : '');
    }

    /* origin: background + species extras */
    var oi = '';
    if (bg) {
      var feat = get(ch, 'feats', bgFeat(ch, bg));
      oi += '<div class="q-note"><b>' + h(bg.name) + ':</b> ' + R.bgSkills(ch, bg).map(skillName).join(', ') + ' · ' + h(R.isOld(ch) ? (R.backgroundFeature(ch, bg, on(ch)) || { name: 'pick a background feature' }).name : feat ? feat.name : bg.featText || '') + '</div>';
      if (bg.skillChoice) { var qb = R.bgSkills(ch, bg).slice(bg.skills.length); oi += qrow('Background skills', bg.skillChoice.from.map(function (id) { var sel = qb.indexOf(id) >= 0; return pillToggle('b-bgskill', id, h(skillName(id)), sel, !sel && qb.length >= bg.skillChoice.count); }).join(''), qcount(qb.length, bg.skillChoice.count)); }
      if (!R.isOld(ch) && bgFeat(ch, bg)) { var qfp = featPickUI(ch, 'background', bgFeat(ch, bg)); if (qfp) oi += '<div class="q-row"><div class="q-lbl">' + h((get(ch, 'feats', bgFeat(ch, bg)) || {}).name) + '</div>' + qfp + '</div>'; }
      if (!R.isOld(ch) && bgFeat(ch, bg) === 'skilled') oi += '<div class="q-row"><div class="q-lbl">Skilled (' + h(bg.name) + ')' + qcount((ch.skilledBg || []).length, 3) + '</div>' + skilledPicker(ch, ch.skilledBg, 'b-skilledbg', profHave(ch, ch.skilledBg)) + '</div>';
      if (R.isOld(ch)) oi += '<div class="q-row"><div class="q-lbl">Background feature</div><select data-act="q-sel" data-arg="bgfeature" aria-label="Background feature">' + (bg.feature ? '<option value="">' + h(bg.feature.name) + ' (its own)</option>' : '<option value="">Choose…</option>') + bgFeatures(ch).map(function (f) { return opt(f.id, f.name, ch.background.feature); }).join('') + '</select></div>';
      else if (bg.featCategory) oi += '<div class="q-row"><div class="q-lbl">Background feat</div><select data-act="q-sel" data-arg="bgfeat" aria-label="Background feat"><option value="">Choose…</option>' + byName(C.all('feats', on(ch)).filter(function (f) { return f.category === bg.featCategory; })).map(function (f) { return opt(f.id, f.name, ch.background.feat); }).join('') + '</select></div>';
      if (bg.tool && bg.tool.choose) oi += '<div class="q-row"><div class="q-lbl">' + toolGroupName(bg.tool.choose) + '</div><select data-act="q-sel" data-arg="bgtool" aria-label="' + toolGroupName(bg.tool.choose) + '">' + C.all('items', on(ch)).filter(function (i) { return i.toolGroup === bg.tool.choose; }).map(function (t) { return opt(t.id, t.name, ch.background.tool); }).join('') + '</select></div>';
    }
    if (sp) {
      var traits = sp.traits.map(function (t) { return t.name; }).join(', ');
      oi += '<div class="q-note"><b>' + h(sp.name) + ':</b> ' + h(traits) + '</div>';
      var extras = '';
      if (sp.keenSenses) extras += qsel('keen', 'Keen Senses', sp.keenSenses.map(function (x) { return [x, skillName(x)]; }), ch.species.keenSense);
      var hasCantrip = (sp.cantrips || []).length || (sp.lineages || []).some(function (l) { return (l.cantrips || []).length; });
      if (hasCantrip) extras += qsel('spab', 'Species spell ability', ['int', 'wis', 'cha'].map(function (x) { return [x, abName(x)]; }), ch.species.spellAbility);
      if (sp.size === 'Medium' && (sp.sizeChoice || sp.id === 'human' || sp.id === 'tiefling')) extras += qsel('size', 'Size', [['Medium', 'Medium'], ['Small', 'Small']], ch.species.size || 'Medium');
      if (skillfulOn(ch, sp)) {
        var taken = R.derive(ch).skills.filter(function (x) { return x.prof && x.from !== 'Skillful'; }).map(function (x) { return x.id; });
        extras += qsel('hskill', 'Skillful', R.SKILLS.map(function (x) { return [x.id, x.name, taken.indexOf(x.id) >= 0]; }), ch.species.skill);
      }
      if (sp.versatile) extras += qsel('hfeat', 'Versatile feat', C.all('feats', on(ch)).filter(function (f) { return f.category === 'origin' && (!bg || f.id !== bg.feat || f.id === 'magic-initiate'); }).map(function (f) { return [f.id, f.name]; }), ch.species.feat);
      if (extras) oi += '<div class="q-grid">' + extras + '</div>';
      if (sp.versatile && ch.species.feat) { var qfs = featPickUI(ch, 'species', ch.species.feat); if (qfs) oi += '<div class="q-row"><div class="q-lbl">' + h((get(ch, 'feats', ch.species.feat) || {}).name) + ' (' + h(sp.name) + ')</div>' + qfs + '</div>'; }
      if (sp.versatile && ch.species.feat === 'skilled') oi += '<div class="q-row"><div class="q-lbl">Skilled (' + h(sp.name) + ')' + qcount((ch.skilled || []).length, 3) + '</div>' + skilledPicker(ch, ch.skilled, 'b-skilled', profHave(ch, ch.skilled)) + '</div>';
    }
    (ch.magicInitiate || []).forEach(function (mi) {
      var src = mi.source;
      oi += '<div class="q-sub"><div class="q-inline"><b style="font-size:14px">Magic Initiate (' + (src === 'background' ? 'background' : 'Versatile') + ')</b>' +
        (src === 'species' || !(bgDef(ch) || {}).featList ? '<select data-act="q-sel" data-arg="milist:' + src + '" aria-label="Spell list">' + ['cleric', 'druid', 'wizard'].map(function (l) { return opt(l, l.charAt(0).toUpperCase() + l.slice(1), mi.list); }).join('') + '</select>' : '<span class="muted2" style="font-size:13px">' + h(mi.list) + ' list</span>') +
        '<select data-act="q-sel" data-arg="miab:' + src + '" aria-label="Spellcasting ability">' + ['int', 'wis', 'cha'].map(function (x) { return opt(x, abName(x), mi.ability); }).join('') + '</select></div>' +
        qrow('Cantrips', spellPills(ch, spellsFor(ch, mi.list, 0), mi.cantrips || [], 2, 'b-mi-cantrip-' + src, 'mi-' + src), qcount((mi.cantrips || []).length, 2)) +
        qrow('1st-level spell', spellPills(ch, spellsFor(ch, mi.list, 1), mi.spell ? [mi.spell] : [], 1, 'b-mi-spell-' + src, 'mi-' + src), qcount(mi.spell ? 1 : 0, 1)) + spellHover(ch, 'mi-' + src) + '</div>';
    });
    if (oi) out += qsec('Origin', oi);

    /* gear & languages */
    var gi = '<div class="q-stack">';
    if (c) gi += qsel('cequip', c.name + ' equipment', Object.keys(c.equipment).map(function (k) { var o = c.equipment[k]; return [k, 'Option ' + k + ': ' + (o.items.length ? o.items.map(function (it) { var x = get(ch, 'items', it[0]); return (it[1] > 1 ? it[1] + ' ' : '') + (x ? x.name : it[0]); }).join(', ') + (o.gp ? ', ' + o.gp + ' GP' : '') : o.gp + ' GP')]; }), p.equipment);
    if (bg) gi += qsel('bequip', bg.name + ' equipment', Object.keys(bg.equipment).map(function (k) { var o = bg.equipment[k]; return [k, 'Option ' + k + ': ' + (o.items.length ? o.items.map(function (it) { var x = get(ch, 'items', (it[0] === 'dice-set' || it[0] === '@tool') && ch.background.tool ? ch.background.tool : it[0]); return (it[1] > 1 ? it[1] + ' ' : '') + (x ? x.name : it[0] === '@tool' ? 'Tool of your choice' : it[0]); }).join(', ') + (o.gp ? ', ' + o.gp + ' GP' : '') : o.gp + ' GP')]; }), ch.background.equipment);
    gi += '</div>';
    var chosenLang = (ch.languages || []).filter(function (l) { return l !== 'common'; }), nl = languageCount(ch);
    gi += qrow('Languages (Common +' + nl + ')', R.STANDARD_LANGUAGES.map(function (l) { var sel = chosenLang.indexOf(l) >= 0; return pillToggle('b-lang', l, h(R.LANGUAGES[l]), sel, !sel && chosenLang.length >= nl); }).join(''), qcount(chosenLang.length, nl));
    out += qsec('Gear & languages', gi);

    /* preview */
    var prevCh = c && p.equipment && ch.background && ch.background.equipment ? R.applyStartingEquipment(U.clone(ch)) : ch;
    var pd = R.derive(prevCh);
    var profSkills = pd.skills.filter(function (x) { return x.prof; }).map(function (x) { return x.name + (x.prof === 2 ? ' ★' : '') + ' ' + sg(x.bonus); });
    var preview = '<section class="card so-far"><h2 class="h-sec">Preview · level 1</h2>' +
      '<span class="serif" style="font-size:24px;font-weight:600">' + h(ch.name || (c ? c.name : 'New hero')) + '</span><span class="muted" style="font-size:13px">' + h(pd.summary || 'Pick a class, background and species') + '</span>' +
      '<div class="q-stats">' + [['HP', pd.hpMax], ['AC', prevCh === ch ? '—' : pd.ac], ['Init', sg(pd.initiative)], ['Speed', pd.speed], ['Prof', sg(pd.pb)]].map(function (x) { return '<div><b>' + x[1] + '</b><span>' + x[0] + '</span></div>'; }).join('') + '</div>' +
      '<div class="q-stats six">' + R.ABILITIES.map(function (ab) { return '<div><b>' + pd.scores[ab.id] + '</b><span>' + ab.abbr + ' ' + sg(pd.mods[ab.id]) + '</span></div>'; }).join('') + '</div>' +
      '<dl><dt>Saves</dt><dd>' + (pd.saves.filter(function (x) { return x.prof; }).map(function (x) { return x.abbr + ' ' + sg(x.bonus); }).join(', ') || '—') + '</dd>' +
      '<dt>Skills</dt><dd>' + (h(profSkills.join(', ')) || '—') + '</dd>' +
      (pd.spell ? '<dt>Spells</dt><dd>DC ' + pd.spell.dc + ', ' + sg(pd.spell.attack) + ' to hit · ' + h(pd.spell.spells.map(function (x) { return x.name; }).join(', ')) + '</dd>' : '') +
      (pd.feats.length ? '<dt>Feats</dt><dd>' + h(pd.feats.map(function (f) { return f.name; }).join(', ')) + '</dd>' : '') + '</dl>' +
      (left.length ? '<div style="border-top:1px solid var(--soft);padding-top:10px"><span class="muted2" style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase">Missing (' + left.length + ')</span><ul class="check-list" style="margin-top:6px">' +
        left.map(function (x) { return '<li><span class="no">•</span>' + h(x) + '</li>'; }).join('') + '</ul></div>' : '') + '</section>';

    return CF.ui.topbar('<span class="grow muted2" style="font-size:14px">Quick build · saved as you go · <a href="#/build/' + encodeURIComponent(ch.id) + '" data-act="q-guided" data-arg="' + h(ch.id) + '">switch to guided</a></span>') +
      '<div class="b-wrap"><main class="b-main q-main">' + CF.ui.notice() + '<h1 class="b-title" style="font-size:30px">Quick build</h1>' + out + '</main>' +
      '<aside class="b-side q-side" aria-label="Preview">' + preview +
        '<div class="b-nav"><a class="btn" href="#/">Back</a><button class="btn btn-teal" data-act="b-finish"' + (left.length ? ' disabled' : '') + '>' + (target > 1 ? 'Create, then level to ' + target : 'Create character') + '</button></div>' +
      '</aside></div>';
  };

  function spellHover(ch, ctx) {
    var hov = bview().hoverCtx === ctx && bview().hover && get(ch, 'spells', bview().hover);
    return hov ? '<div class="detail"><b>' + h(hov.name) + '</b><span class="muted2" style="font-size:12px">' + h([hov.level ? hov.level + (hov.level === 1 ? 'st' : hov.level === 2 ? 'nd' : 'rd') + ' level' : 'Cantrip', hov.school, hov.time, hov.range, hov.duration].join(' · ')) + '</span><span style="font-size:13px;line-height:1.5;color:var(--body2);white-space:pre-line">' + h(hov.text) + '</span></div>'
      : '<div class="detail" style="min-height:0"><span class="muted2" style="font-size:12px">Hover a spell to read it.</span></div>';
  }

  H['q-sel'] = function (kind, el) {
    var v = el.value; if (!v && kind !== 'bgfeature') return;
    var k = kind.split(':');
    if (k[0] === 'class') return H['b-class'](v);
    if (k[0] === 'bg') return H['b-bg'](v);
    if (k[0] === 'species') return H['b-species'](v);
    if (k[0] === 'choice') return H['b-choice'](k[1] + ':' + v);
    if (k[0] === 'milist') return H['b-mi-list'](k[1] + ':' + v);
    if (k[0] === 'miab') return H['b-mi-ability'](k[1] + ':' + v);
    if (k[0] === 'level') return H['q-level'](v);
    bmut(function (ch) {
      if (k[0] === 'lineage') ch.species.lineage = v;
      else if (k[0] === 'keen') ch.species.keenSense = v;
      else if (k[0] === 'spab') ch.species.spellAbility = v;
      else if (k[0] === 'size') ch.species.size = v;
      else if (k[0] === 'hskill') ch.species.skill = v;
      else if (k[0] === 'hfeat') ch.species.feat = v;
      else if (k[0] === 'bgtool') ch.background.tool = v;
      else if (k[0] === 'bgfeat') ch.background.feat = v;
      else if (k[0] === 'bgfeature') ch.background.feature = v || null;
      else if (k[0] === 'cequip') ch.classes[0].equipment = v;
      else if (k[0] === 'bequip') ch.background.equipment = v;
    });
  };
  H['q-quick'] = function (id) { bmut(function (ch) { ch.builder = Object.assign({}, ch.builder, { mode: 'quick' }); }); app.go('#/quick/' + encodeURIComponent(id)); };
  H['q-level'] = function (n) { bmut(function (ch) { ch.builder = ch.builder || {}; ch.builder.target = +n; }); };
  H['q-method'] = function (m) {
    if (m !== 'manual') return H['b-method'](m);
    bmut(function (ch) { ch.abilities.method = 'manual'; });
  };
  H['q-score'] = function (ab, el) {
    var n = parseInt(el.value, 10);
    if (!(n >= 3 && n <= 20)) return;          // wait until the number is complete
    bmut(function (ch) { ch.abilities.base[ab] = n; });
  };
  H['q-guided'] = function (id) { bmut(function (ch) { ch.builder = Object.assign({}, ch.builder, { mode: 'guided' }); }); app.go('#/build/' + encodeURIComponent(id)); };

  CF.ui.builderStatus = status;
  CF.ui.builderNormalize = normalize;
})(window);
