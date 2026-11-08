/* Character Forge — level up. Choices are kept on a working copy and only saved when you confirm. */
(function (root) {
  'use strict';
  var CF = root.CF, U = CF.util, R = CF.rules, C = CF.content, app = CF.app, h = U.esc, sg = U.signed;
  var LU = null;   // { id, stamp, base, sel }

  /* ---------- helpers ---------- */
  function on(ch) { return C.on(ch); }
  function get(ch, section, id) { return id ? C.get(section, id, on(ch)) : null; }
  function abName(id) { return R.ABILITIES.find(function (a) { return a.id === id; }).name; }
  function uniq(a) { return a.filter(function (v, i) { return v && a.indexOf(v) === i; }); }
  function ordinal(n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); }
  function lv(row, L) { return row ? row[Math.min(row.length, L) - 1] || 0 : 0; }
  function asList(v) { return Array.isArray(v) ? v.slice() : v ? [v] : []; }
  function lview() { var v = app.view; v.lu = v.lu || { hover: null }; return v.lu; }

  function freshSel(base) {
    return { target: defaultTarget(base), hpMode: 'avg', hpRoll: null, subclass: null, feat: null, asi: {}, asiMode: 'two', featSkills: [], featPicks: {}, choices: {}, picks: {}, masteries: [], cantrips: [], prepared: null, mcSkills: [], mcTool: null };
  }
  /** Which class gains the level: "c:<index>" for a class you have, "new:<id>" to multiclass. */
  function defaultTarget(base) {
    var i = (base.classes || []).findIndex(function (c) { var d = get(base, 'classes', c.id); return d && (c.level || 1) < (d.maxLevel || 1); });
    if (i < 0) { var nd = C.all('classes', on(base)).find(function (d) { return !base.classes.some(function (c) { return c.id === d.id; }) && R.mcCheck(base, d).ok; }); if (nd) return 'new:' + nd.id; }
    return 'c:' + Math.max(0, i);
  }
  function target(base) {
    var t = (LU && LU.sel.target) || 'c:0';
    if (t.indexOf('new:') === 0) return { isNew: true, id: t.slice(4), idx: base.classes.length };
    var i = +t.slice(2) || 0;
    return { isNew: false, id: base.classes[i] && base.classes[i].id, idx: i };
  }
  function allCantrips(ch) { return (ch.classes || []).reduce(function (a, c) { return a.concat(c.cantrips || []); }, []); }
  /** Spells another of your classes already has: shown as known in this class's pickers. */
  function otherClassSpells(ch, idx) {
    var out = [];
    (ch.classes || []).forEach(function (c, i) { if (i !== idx) out = out.concat(c.cantrips || [], R.preparedOf(ch, i)); });
    return out;
  }
  function start(id) {
    var ch = CF.store.get(id); if (!ch) { LU = null; return; }
    if (LU && LU.id === id && LU.stamp === ch.updatedAt) return;
    LU = { id: id, stamp: ch.updatedAt, base: ch, sel: freshSel(ch) };
  }

  /** The character as it will be after this level up, built from the saved character plus the current choices. */
  function build() {
    var ch = U.clone(LU.base), s = LU.sel, t = target(ch), p;
    if (t.isNew) { p = { id: t.id, level: 0, multiclass: true, skills: [], tools: [], choices: {}, masteries: [], cantrips: [], expertise: [], prepared: [] }; ch.classes.push(p); }
    else p = ch.classes[t.idx];
    var def = get(ch, 'classes', p.id);
    var L = (t.isNew ? 0 : p.level || 1) + 1;
    p.level = L;
    if (t.isNew) {
      var mc = R.mcInfo(def);
      p.skills = s.mcSkills.slice();
      p.tools = mc.tools.concat(s.mcTool ? [s.mcTool] : []);
    }
    p.hp = Object.assign({}, p.hp || {}); p.hp[L] = s.hpMode === 'roll' && s.hpRoll != null ? s.hpRoll : null;
    if (L === def.subclassLevel && s.subclass) p.subclass = s.subclass;
    if ((def.asiLevels || []).indexOf(L) >= 0 && s.feat) {
      p.asi = Object.assign({}, p.asi || {});
      p.asi[L] = { feat: s.feat, asi: Object.assign({}, s.asi), skills: s.feat === 'skilled' ? s.featSkills.slice() : [] };
      if (s.featPicks && (s.featPicks.option || s.featPicks.spells || s.featPicks.ability)) { var fp0 = JSON.parse(JSON.stringify(s.featPicks)); if (fp0.option) p.asi[L].option = fp0.option; if (fp0.spells) p.asi[L].spells = fp0.spells; if (fp0.ability) p.asi[L].spellAbility = fp0.ability; }
    }
    p.choices = Object.assign({}, p.choices || {});
    Object.keys(s.choices).forEach(function (q) {
      var had = asList(p.choices[q]);
      var add = s.choices[q] || [];
      var qd = allChoices(def, L, s.subclass || p.subclass).find(function (x) { return x.id === q; });
      if (!qd) return;
      p.choices[q] = qd.count ? had.concat(add) : add[0] || had[0] || null;
    });
    var sub = subDef(def, s.subclass || p.subclass, L);
    R.levelPicks(def, sub, L).forEach(function (lp, i) {
      var chosen = s.picks[lp.kind + i] || [];
      if (lp.kind === 'skill') p.extraSkills = (p.extraSkills || []).concat(chosen);
      if (lp.kind === 'expertise') p.expertise = (p.expertise || []).concat(chosen);
      if (lp.kind === 'languages') ch.languages = uniq((ch.languages || []).concat(chosen));
      if (lp.kind === 'arcanum' && chosen[0]) { p.arcanum = Object.assign({}, p.arcanum || {}); p.arcanum[lp.spellLevel] = chosen[0]; }
    });
    p.masteries = (p.masteries || []).concat(s.masteries);
    p.cantrips = (p.cantrips || []).concat(s.cantrips);
    if (s.prepared) { if (t.idx === 0) ch.spells = Object.assign({}, ch.spells, { prepared: s.prepared.slice() }); else p.prepared = s.prepared.slice(); }
    return ch;
  }
  function subDef(def, id, L) { return id && L >= (def.subclassLevel || 3) ? (def.subclasses || []).find(function (x) { return x.id === id; }) || null : null; }
  function allChoices(def, L, subId) { return R.classChoices(def, subDef(def, subId, L), L); }

  /** Everything this level asks for. */
  function plan() {
    var base = LU.base, s = LU.sel, t = target(base), p = t.isNew ? { id: t.id, level: 0 } : base.classes[t.idx], def = get(base, 'classes', p.id), L = (t.isNew ? 0 : p.level || 1) + 1;
    var subId = p.subclass || s.subclass, sub = subDef(def, subId, L);
    var out = { def: def, L: L, idx: t.idx, isNew: t.isNew, p: p, charL: R.totalLevel(base) + 1, multi: base.classes.length > 1 || t.isNew, mc: t.isNew ? R.mcInfo(def) : null,
      sub: sub, needSub: L === def.subclassLevel && !p.subclass, asi: (def.asiLevels || []).indexOf(L) >= 0, choices: [], picks: [], masteries: 0, cantrips: 0, prepared: 0, maxSpell: 0 };
    R.classChoices(def, sub, L).forEach(function (q) {
      var now = R.choiceCount(q, L), had = (q.level || 1) === L ? 0 : asList((p.choices || {})[q.id]).length;
      if (now - had > 0) out.choices.push({ q: q, need: now - had, had: asList((p.choices || {})[q.id]).filter(function () { return (q.level || 1) < L; }) });
    });
    out.picks = R.levelPicks(def, sub, L);
    if (def.masteryCount) out.masteries = Math.max(0, lv(def.masteryCount, L) - lv(def.masteryCount, L - 1));
    var sc = out.sc = def.spellcasting || (sub && sub.spellcasting) || null;
    if (sc) {
      out.cantrips = Math.max(0, lv(sc.cantrips, L) - lv(sc.cantrips, L - 1));
      out.prepared = lv(sc.prepared, L);
      var row = sc.slots[L - 1] || [];
      row.forEach(function (n, i) { if (n > 0) out.maxSpell = i + 1; });
      var prevRow = sc.slots[L - 2] || [], prevMax = 0;
      prevRow.forEach(function (n, i) { if (n > 0) prevMax = i + 1; });
      out.newSpellLevel = out.maxSpell > prevMax ? out.maxSpell : 0;
    }
    return out;
  }

  /** Expertise can only go on skills you're proficient in; a multiclass hero may have none of the listed ones. */
  function pickNeed(lp, draft) {
    if (lp.kind !== 'expertise') return lp.count;
    var d = R.derive(draft);
    var pool = (lp.from || R.SKILLS.map(function (x) { return x.id; })).filter(function (id) { var sk = d.skills.find(function (x) { return x.id === id; }); return sk && sk.prof > 0; });
    return Math.min(lp.count, pool.length);
  }
  /** What's still missing. */
  function status(pl, draft) {
    var s = LU.sel, miss = [];
    if (s.hpMode === 'roll' && s.hpRoll == null) miss.push('Roll your hit points (or take the average)');
    if (pl.mc && pl.mc.skills && s.mcSkills.length < pl.mc.skills.count) miss.push('Choose ' + pl.mc.skills.count + ' ' + pl.def.name + ' skill');
    if (pl.mc && pl.mc.toolChoice && !s.mcTool) miss.push('Choose a ' + pl.mc.toolChoice.label.toLowerCase());
    if (pl.needSub && !s.subclass) miss.push('Choose your ' + (pl.def.subclassLabel || 'subclass'));
    if (pl.asi) {
      if (!s.feat) miss.push('Choose an Ability Score Improvement or a feat');
      else {
        var f = get(draft, 'feats', s.feat), total = Object.keys(s.asi).reduce(function (t, k) { return t + s.asi[k]; }, 0);
        if (f && f.asi === 'flex' && total < 2) miss.push('Choose which scores to increase');
        if (f && Array.isArray(f.asi) && total < 1) miss.push('Choose which score ' + f.name + ' increases');
        if (s.feat === 'skilled' && s.featSkills.length < 3) miss.push('Choose 3 skills or tools for Skilled');
        if (f) miss = miss.concat(CF.ui.featPicks.missing(f, s.featPicks));
      }
    }
    pl.choices.forEach(function (c) { if ((s.choices[c.q.id] || []).length < c.need) miss.push('Choose ' + (c.need > 1 ? c.need + ' ' : '') + c.q.name + (c.need > 1 ? ' options' : '')); });
    pl.picks.forEach(function (lp, i) { if ((s.picks[lp.kind + i] || []).length < pickNeed(lp, draft)) miss.push('Choose ' + lp.label); });
    if (pl.masteries && s.masteries.length < pl.masteries) miss.push('Choose ' + pl.masteries + ' more weapon mastery');
    if (pl.cantrips && s.cantrips.length < pl.cantrips) miss.push('Choose ' + pl.cantrips + ' new cantrip' + (pl.cantrips > 1 ? 's' : ''));
    var pt = pl.prepared ? preparedTarget(pl, draft) : 0;
    var nowPrep = R.preparedOf(draft, pl.idx).length;
    if (pl.prepared && nowPrep !== pt) miss.push('Prepare ' + pt + ' ' + (pl.multi ? pl.def.name + ' ' : '') + 'spells (' + nowPrep + ' chosen)');
    return miss;
  }

  /* ---------- screen ---------- */
  CF.ui.levelup = function (route) {
    start(route.id);
    if (!LU) return CF.ui.topbar() + '<main class="page"><div class="empty"><b>Character not found</b><a class="btn" href="#/">Back to characters</a></div></main>';
    var base = LU.base, p0 = base.classes[0], def0 = p0 && get(base, 'classes', p0.id);
    var back = '<a class="btn" href="#/c/' + encodeURIComponent(base.id) + '">Back to sheet</a>';
    if (!def0) return CF.ui.topbar() + '<main class="page"><div class="empty"><b>This character has no class yet</b>' + back + '</div></main>';
    var curL = R.totalLevel(base);
    var canGrow = curL < 20 && (base.classes.some(function (c) { var d = get(base, 'classes', c.id); return d && (c.level || 1) < (d.maxLevel || 1); }) ||
      C.all('classes', on(base)).some(function (d) { return !base.classes.some(function (c) { return c.id === d.id; }) && R.mcCheck(base, d).ok; }));
    var maxL = canGrow ? curL + 1 : curL;
    var undo = (base.levelHistory || []).length ? '<button class="btn" data-act="lu-undo">Undo the last level up (back to level ' + (curL - 1) + ')</button>' : '';
    var confirmBox = lview().confirmUndo && undo ? '<div class="notice" role="alertdialog" aria-label="Undo level up" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px"><span style="flex:1 1 300px">Go back to level ' + (curL - 1) + '? The choices made at level ' + curL + ' are removed. Inventory, notes and current HP stay as they are.</span>' +
      '<button class="btn" data-act="lu-undo-no">Cancel</button><button class="btn btn-teal" data-act="lu-undo-yes">Yes, undo</button></div>' : '';
    if (curL >= maxL) {
      return CF.ui.topbar() + '<main class="page" style="max-width:720px;display:flex;flex-direction:column;gap:14px">' + CF.ui.notice() + confirmBox +
        '<h1 class="b-title">' + h(base.name) + ' is level ' + curL + '</h1><p class="b-lead">' + (curL >= 20 ? 'Level 20 is the highest level a character can reach. Congratulations!' : 'None of your classes can go higher with the content you have turned on, and your scores don’t allow a new class yet.') + '</p>' +
        '<div style="display:flex;flex-wrap:wrap;gap:10px">' + back + undo + '</div></main>';
    }
    if (!get(base, 'classes', target(base).id)) LU.sel.target = defaultTarget(base);
    if (!LU.sel.prepared && plan().sc) LU.sel.prepared = validPrepared(base, plan());
    var pl = plan(), draft = build(), miss = status(pl, draft);
    var before = R.derive(base), after = R.derive(draft), def = pl.def;
    var titleCls = pl.isNew ? 'level ' + curL + ' → ' + pl.charL + ' · new class: ' + def.name + ' 1' : pl.multi ? 'level ' + curL + ' → ' + pl.charL + ' · ' + def.name + ' ' + (pl.L - 1) + ' → ' + pl.L : def.name + ' ' + curL + ' → ' + pl.L;

    var chain = base.quickChain && base.quickChain > curL ? base.quickChain : 0;
    var body = '<div style="display:flex;flex-direction:column;gap:8px"><span class="b-kicker">' + (chain ? 'Quick build · level ' + pl.charL + ' of ' + chain + ' · <button class="link-btn" style="font-size:13px;padding:0" data-act="lu-stop">stop at level ' + curL + '</button>' : 'Level up') + '</span><h1 class="b-title">' + h(base.name) + ': ' + h(titleCls) + '</h1>' +
      '<p class="b-lead">Here’s what your hero gains at level ' + pl.charL + '. Make the choices below, then confirm. Nothing is saved until you do.</p></div>';
    if (!chain) body += classPickSection(base, pl, before);
    body += hpSection(pl, before, after);
    if (pl.mc) body += mcSection(pl, base);
    if (pl.needSub) body += subclassSection(pl);
    body += featuresSection(pl, draft);
    if (pl.asi) body += asiSection(pl, draft, before);
    pl.choices.forEach(function (c) { body += choiceSection(c, pl, draft); });
    pl.picks.forEach(function (lp, i) { body += pickSection(lp, i, base, draft); });
    if (pl.masteries) body += masterySection(pl, base, draft);
    if (pl.cantrips) body += cantripSection(pl, base, draft);
    if (pl.prepared) body += preparedSection(pl, draft);

    return CF.ui.topbar('<span class="grow muted2" style="font-size:14px">Level up · nothing is saved until you confirm</span>') +
      '<div class="b-wrap"><main class="b-main" style="flex-basis:640px">' + CF.ui.notice() + confirmBox + body + '</main>' +
      '<aside class="b-side" aria-label="Changes at this level">' + changes(before, after, pl, miss) +
        '<section class="help"><h2>Your choices are safe</h2><p>Leveling up only changes your sheet when you press the button below. If you change your mind afterwards, open Level up again and use Undo.</p></section>' +
        '<div class="b-nav">' + back + '<button class="btn btn-teal" data-act="lu-finish"' + (miss.length ? ' disabled' : '') + '>Become level ' + pl.charL + '</button></div>' +
        (undo ? '<div>' + undo.replace('class="btn"', 'class="link-btn" style="font-size:13px;padding:0"') + '</div>' : '') +
      '</aside></div>';
  };

  function sec(title, why, inner, count) {
    return '<section class="b-sec"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px"><h2>' + h(title) + '</h2>' + (count || '') + '</div>' + (why ? '<p class="why">' + why + '</p>' : '') + inner + '</section>';
  }
  function counter(n, max) { return '<span class="count' + (n >= max ? ' ok' : '') + '">' + n + ' of ' + max + ' chosen</span>'; }
  function pill(action, arg, label, pressed, disabled, extra) {
    return '<button type="button" class="pill" data-act="' + action + '" data-arg="' + h(arg) + '" aria-pressed="' + !!pressed + '"' + (disabled ? ' disabled' : '') + '>' + label + (extra || '') + '</button>';
  }
  function optCard(action, arg, name, text, pressed, disabled, tag) {
    return '<button type="button" class="opt" data-act="' + action + '" data-arg="' + h(arg) + '" aria-pressed="' + !!pressed + '"' + (disabled ? ' disabled' : '') + '>' +
      '<span class="t"><span class="nm" style="font-size:17px">' + h(name) + '</span>' + (tag ? '<span class="tag">' + h(tag) + '</span>' : '') + '</span><span class="p">' + h(text) + '</span></button>';
  }

  /* ---------- sections ---------- */
  function classPickSection(base, pl, before) {
    var s = LU.sel, mine = base.classes.map(function (c) { return c.id; });
    var have = base.classes.map(function (c, i) {
      var d = get(base, 'classes', c.id); if (!d) return '';
      var lvN = c.level || 1, full = lvN >= (d.maxLevel || 1);
      var sub = c.subclass && (d.subclasses || []).find(function (x) { return x.id === c.subclass; });
      var next = (d.features || []).filter(function (f) { return f.level === lvN + 1; }).map(function (f) { return f.name; }).join(' · ');
      return optCard('lu-target', 'c:' + i, d.name + ' ' + lvN + ' → ' + (lvN + 1), full ? 'This class is at the highest level Character Forge has for it.' : (next ? 'Next: ' + next : 'Keep growing as a ' + d.name + '.'), s.target === 'c:' + i, full, sub ? sub.name : (i === 0 && base.classes.length > 1 ? 'First class' : ''));
    }).join('');
    var open = lview().mcOpen || pl.isNew;
    var others = C.all('classes', on(base)).filter(function (d) { return mine.indexOf(d.id) < 0; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    var mcCards = others.map(function (d) {
      var chk = R.mcCheck(base, d);
      var txt = 'Needs ' + R.mcReqText(d) + '. You gain ' + R.mcGainsText(d, on(base)) + ', d' + d.hitDie + ' hit dice' + (d.spellcasting ? ' and its spells' : '') + '.' + (chk.ok ? '' : ' Not yet: ' + chk.problems.join('; ') + '.');
      return optCard('lu-target', 'new:' + d.id, d.name, txt, s.target === 'new:' + d.id, !chk.ok, chk.ok ? (/System Reference/.test(d.sourceName || '') ? '' : d.sourceName || '') : 'Scores too low');
    }).join('');
    var inner = '<div class="opt-grid">' + have + '</div>' +
      '<div><button type="button" class="link-btn" data-act="lu-mcopen" aria-expanded="' + !!open + '">' + (open ? '▾' : '▸') + ' Take a level in a new class instead (multiclass)</button></div>' +
      (open ? '<p class="why">Multiclassing is an optional rule, so check with your DM first. You need a score of 13 in the main abilities of your new class <em>and</em> of the classes you already have. A new class gives its level-1 features but only part of its training, and no new saving throws or starting gear.</p><div class="opt-grid">' + mcCards + '</div>' : '');
    return sec('Which class gains this level?', base.classes.length > 1 ? 'Your character level is the total of all your classes. Each class keeps its own features, spells and level.' : '', inner);
  }

  function mcSection(pl, base) {
    var s = LU.sel, mc = pl.mc, d0 = R.derive(base), inner = '<p class="tx" style="margin:0">From ' + h(pl.def.name) + ' you gain: <strong>' + h(R.mcGainsText(pl.def, on(base))) + '</strong>. Saving throws stay the same as your first class.</p>';
    if (mc.skills) {
      var from = mc.skills.from === 'any' ? R.SKILLS.map(function (x) { return x.id; }) : mc.skills.from;
      inner += '<div><b style="font-size:14px">Choose ' + mc.skills.count + ' skill</b> ' + counter(s.mcSkills.length, mc.skills.count) + '</div><div class="pills">' + from.map(function (id) {
        var have = d0.skills.find(function (x) { return x.id === id; }).prof > 0, sel = s.mcSkills.indexOf(id) >= 0, sk = R.skill(id);
        return pill('lu-mcskill', id, h(sk.name) + ' <small>' + sk.ability.toUpperCase() + '</small>', have || sel, have || (!sel && s.mcSkills.length >= mc.skills.count), have ? ' <small>(have it)</small>' : '');
      }).join('') + '</div>';
    }
    if (mc.toolChoice) {
      var tools = C.all('items', on(base)).filter(function (i) { return i.kind === 'tool' && i.toolGroup === mc.toolChoice.group; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
      var known = (base.tools || []).concat(base.classes.reduce(function (a, c) { return a.concat(c.tools || []); }, []));
      inner += '<div><b style="font-size:14px">Choose a ' + h(mc.toolChoice.label.toLowerCase()) + '</b></div><div class="pills">' + tools.map(function (t) {
        var have = known.indexOf(t.id) >= 0;
        return pill('lu-mctool', t.id, h(t.name), have || s.mcTool === t.id, have, have ? ' <small>(have it)</small>' : '');
      }).join('') + '</div>';
    }
    return sec('Training from ' + pl.def.name, '', inner);
  }

  function hpSection(pl, before, after) {
    var s = LU.sel, hd = pl.def.hitDie, avg = hd / 2 + 1, con = after.mods.con;
    var die = s.hpMode === 'roll' ? s.hpRoll : avg;
    var gain = after.hpMax - before.hpMax;
    var why = 'Each level you gain your hit die (d' + hd + ') plus your CON modifier (' + sg(con) + '). Most groups take the average; ask your DM if you may roll.';
    var inner = '<div class="seg" role="group" aria-label="Hit points"><button type="button" data-act="lu-hp" data-arg="avg" aria-pressed="' + (s.hpMode === 'avg') + '">Take the average (' + avg + ')</button>' +
      '<button type="button" data-act="lu-hp" data-arg="roll" aria-pressed="' + (s.hpMode === 'roll') + '">' + (s.hpRoll != null ? 'Rolled ' + s.hpRoll + ' on the d' + hd : 'Roll the d' + hd) + '</button></div>';
    if (die != null) inner += '<div class="notice">You gain <strong>' + gain + ' HP</strong> (' + die + ' ' + sg(con).replace('+', '+ ').replace('−', '− ') + ' CON' + (gain - Math.max(1, die + con) > 0 ? ', plus ' + (gain - Math.max(1, die + con)) + ' from other bonuses' : '') + '). Maximum HP: ' + before.hpMax + ' → <strong>' + after.hpMax + '</strong>.</div>';
    if (s.hpMode === 'roll' && s.hpRoll != null) inner += '<span class="muted2" style="font-size:12px">The roll is final. You can still switch back to the average.</span>';
    return sec('Hit points', why, inner);
  }

  function subclassSection(pl) {
    var s = LU.sel;
    return sec('Choose your ' + (pl.def.subclassLabel || 'subclass'), 'At level ' + pl.L + ' every ' + h(pl.def.name) + ' picks a specialty. It adds features now and at later levels. The SRD includes one option per class; your own modules can add more.',
      '<div class="opt-grid">' + (pl.def.subclasses || []).map(function (sc) {
        return optCard('lu-sub', sc.id, sc.name, sc.pitch + ' ' + (sc.features || []).filter(function (f) { return f.level === pl.L; }).map(function (f) { return f.name; }).join(' · '), s.subclass === sc.id, false, (sc.sourceName || 'SRD 5.2'));
      }).join('') + '</div>');
  }

  function featuresSection(pl, draft) {
    var feats = R.classFeatures(pl.def, pl.sub, pl.L).filter(function (f) { return f.level === pl.L && f.name !== 'Ability Score Improvement' && f.name !== 'Epic Boon'; });
    var d = R.derive(draft);
    var extra = [];
    if (R.profBonus(pl.charL) > R.profBonus(pl.charL - 1)) extra.push(['Proficiency bonus', 'Your proficiency bonus rises to ' + sg(R.profBonus(pl.charL)) + '. Every proficient skill, save, attack and your spell DC go up by 1.']);
    if (pl.newSpellLevel) extra.push([ordinal(pl.newSpellLevel) + '-level spells', 'You can now prepare and cast ' + ordinal(pl.newSpellLevel) + '-level spells.']);
    var mainS = d.resources.filter(function (r) { return !r.spell; });
    if (!feats.length && !extra.length) return '';
    return sec('New at level ' + pl.L, pl.needSub && !LU.sel.subclass ? 'Your ' + h((pl.def.subclassLabel || 'subclass').toLowerCase()) + ' adds more features once you choose it.' : '',
      '<div style="display:flex;flex-direction:column;gap:10px">' + feats.map(function (f) {
        return '<div class="item"><div class="hd"><span class="nm">' + h(f.name) + '</span><span class="tag">' + h(f.from) + '</span></div><span class="tx">' + h(f.text) + '</span></div>';
      }).concat(extra.map(function (x) { return '<div class="item"><div class="hd"><span class="nm">' + h(x[0]) + '</span><span class="tag">Level ' + pl.L + '</span></div><span class="tx">' + h(x[1]) + '</span></div>'; })).join('') + '</div>' +
      (mainS.length ? '' : ''));
  }

  function asiSection(pl, draft, before) {
    var s = LU.sel;
    var taken = (draft.feats || []).concat(draft.classes.reduce(function (a, c, ci) { return a.concat(Object.keys(c.asi || {}).filter(function (L) { return ci !== pl.idx || +L !== pl.L; }).map(function (L) { return c.asi[L].feat; })); }, []));
    var list = C.all('feats', on(draft)).filter(function (f) {
      if (f.id === 'magic-initiate') return false;
      if (f.category === 'epic') { if (pl.L < 19) return false; }
      else if (f.category !== 'origin' && f.category !== 'general') return false;
      if (!f.repeatable && f.id !== 'skilled' && taken.indexOf(f.id) >= 0) return false;
      return true;
    });
    var meets = function (f) { if (!f.prereq || !f.prereq.any) return true; return Object.keys(f.prereq.any).some(function (k) { return before.scores[k] >= f.prereq.any[k]; }); };
    list.sort(function (a, b) { return (b.category === 'epic') - (a.category === 'epic'); });
    var inner = '<div class="opt-grid">' + list.map(function (f) {
      var ok = meets(f);
      return optCard('lu-feat', f.id, f.name, f.pitch + (ok ? '' : ' (Needs STR or DEX 13.)'), s.feat === f.id, !ok, f.category === 'origin' ? 'Origin feat' : f.category === 'epic' ? 'Epic Boon' : f.id === 'ability-score-improvement' ? 'Scores' : 'Feat');
    }).join('') + '</div>';
    var f = get(draft, 'feats', s.feat);
    if (f && f.asi === 'flex') {
      var scoreOf = function (k) { return before.scores[k]; };
      var p2 = Object.keys(s.asi).find(function (k) { return s.asi[k] === 2; });
      var ones = Object.keys(s.asi).filter(function (k) { return s.asi[k] === 1; });
      var sel = function (role, val, need) {
        return '<select data-act="lu-asi" data-arg="' + role + '" aria-label="' + (role === 'p2' ? 'Ability to increase by 2' : 'Ability to increase by 1') + '"><option value="">Choose…</option>' +
          R.ABILITIES.map(function (a) { var full = scoreOf(a.id) + need > 20; return '<option value="' + a.id + '"' + (val === a.id ? ' selected' : '') + (full ? ' disabled' : '') + '>' + a.name + ' (' + scoreOf(a.id) + (full ? ', too high' : ' → ' + (scoreOf(a.id) + need)) + ')</option>'; }).join('') + '</select>';
      };
      inner += '<div class="seg">' + [['two', '+2 to one score'], ['split', '+1 to two scores']].map(function (x) { return '<button type="button" data-act="lu-asimode" data-arg="' + x[0] + '" aria-pressed="' + (s.asiMode === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        (s.asiMode === 'two' ? '<label class="b-field">+2 to' + sel('p2', p2, 2) + '</label>'
          : '<div style="display:flex;flex-wrap:wrap;gap:12px"><label class="b-field">+1 to' + sel('a', ones[0], 1) + '</label><label class="b-field">+1 to' + sel('b', ones[1], 1) + '</label></div>');
      inner += '<p class="why">Tip: an odd score (like 15 or 17) gains a full modifier point from a single +1.</p>';
    } else if (f && Array.isArray(f.asi)) {
      inner += '<div class="b-field">' + h(f.name) + ' also increases<div class="seg">' + f.asi.map(function (k) { var full = before.scores[k] >= (f.asiCap || 20); return '<button type="button" data-act="lu-featasi" data-arg="' + k + '" aria-pressed="' + (s.asi[k] === 1) + '"' + (full ? ' disabled' : '') + '>' + abName(k) + ' +1</button>'; }).join('') + '</div></div>';
    }
    if (f) inner += '<div class="feat-box">' + CF.util.rich(f.text, '<strong>' + h(f.name) + ':</strong> ') + '</div>';
    if (f && (f.options || f.spells)) { var dk = R.derive(LU.base); inner += CF.ui.featPicks.render(f, s.featPicks, 'lu-fp', 'lvl', CF.content.on(LU.base), dk.spell ? dk.spell.spells.map(function (x) { return x.id; }) : []); }
    if (s.feat === 'skilled') {
      var d0 = R.derive(LU.base), picks = s.featSkills, full = picks.length >= 3;
      var haveTools = (LU.base.tools || []).concat(LU.base.skilled || [], LU.base.skilledBg || []);
      var one = function (id, label, have) { var sel2 = picks.indexOf(id) >= 0; return pill('lu-featskill', id, h(label), sel2 || have, have || (!sel2 && full), have ? ' <small>(have it)</small>' : ''); };
      inner += '<div><b style="font-size:14px">Skilled: choose 3 skills or tools</b> ' + counter(picks.length, 3) + '</div>' +
        '<div class="skilled-group"><b>Skills</b><div class="pills">' + R.SKILLS.map(function (sk) { return one(sk.id, sk.name, d0.skills.find(function (x) { return x.id === sk.id; }).prof > 0); }).join('') + '</div></div>' +
        R.skilledTools(CF.content.on(LU.base)).map(function (g) { return '<div class="skilled-group"><b>' + h(g[0]) + '</b><div class="pills">' + g[1].map(function (t) { return one(t.id, t.name, haveTools.indexOf(t.id) >= 0); }).join('') + '</div></div>'; }).join('');
    }
    return pl.L === 19 ? sec('Epic Boon', 'At level 19 you gain an Epic Boon (each raises one score by 1, up to 30), or another feat or Ability Score Improvement.', inner)
      : sec('Ability Score Improvement or feat', 'At level ' + pl.L + ' you can raise your ability scores, or take a feat instead. Scores can’t go above 20.', inner);
  }

  function choiceSection(c, pl, draft) {
    var s = LU.sel, q = c.q, chosen = s.choices[q.id] || [];
    var cantrips = allCantrips(draft);
    var allNow = asList((draft.classes[pl.idx].choices || {})[q.id]);
    var opts = q.options.filter(function (o) { return (o.minLevel || 1) <= pl.L; });
    var why = h(q.help || '') + (c.had.length ? ' You already know ' + c.had.map(function (id) { var o = q.options.find(function (x) { return x.id === id; }); return o ? o.name : id; }).join(', ') + '.' : '');
    var cards = opts.map(function (o) {
      var known = c.had.indexOf(o.id) >= 0, sel = chosen.indexOf(o.id) >= 0;
      var blocked = o.requires && ((o.requires.cantrip && cantrips.indexOf(o.requires.cantrip) < 0) || (o.requires.choice && allNow.indexOf(o.requires.choice) < 0));
      var note = known ? 'Known' : blocked ? (o.requires.cantrip ? 'Needs ' + ((get(draft, 'spells', o.requires.cantrip) || {}).name || o.requires.cantrip) : 'Needs ' + ((q.options.find(function (x) { return x.id === o.requires.choice; }) || {}).name || '')) : (o.minLevel > 1 ? 'Level ' + o.minLevel + '+' : '');
      return optCard('lu-choice', q.id + ':' + o.id, o.name, o.text, known || sel, known || blocked || (!sel && chosen.length >= c.need), note);
    }).join('');
    return sec(q.name, why, '<div class="opt-grid">' + cards + '</div>', c.need > 1 || c.had.length ? counter(chosen.length, c.need) : '');
  }

  function pickSection(lp, i, base, draft) {
    var s = LU.sel, key = lp.kind + i, chosen = s.picks[key] || [];
    var d0 = R.derive(base), d1 = R.derive(draft);
    var inner;
    if (lp.kind === 'arcanum') {
      inner = spellPicker(draft, spellsFor(draft, pl0().sc.list, lp.spellLevel), chosen, 1, 'lu-pick-sp', null, key) + spellDetail(draft, 'lu-pick-sp');
    } else if (lp.kind === 'languages') {
      var known = (base.languages || []);
      inner = '<div class="pills">' + R.STANDARD_LANGUAGES.concat(['abyssal', 'celestial', 'deep-speech', 'infernal', 'primordial', 'sylvan', 'undercommon']).filter(function (l, j, a) { return R.LANGUAGES[l] && a.indexOf(l) === j; }).map(function (l) {
        var have = known.indexOf(l) >= 0, sel = chosen.indexOf(l) >= 0;
        return pill('lu-pick', key + ':' + l, h(R.LANGUAGES[l]), have || sel, have || (!sel && chosen.length >= lp.count), have ? ' <small>(known)</small>' : '');
      }).join('') + '</div>';
    } else if (lp.kind === 'skill') {
      var from = lp.from === 'any' ? R.SKILLS.map(function (x) { return x.id; }) : lp.from;
      inner = '<div class="pills">' + from.map(function (id) {
        var have = d0.skills.find(function (x) { return x.id === id; }).prof > 0, sel = chosen.indexOf(id) >= 0, sk = R.skill(id);
        return pill('lu-pick', key + ':' + id, h(sk.name) + ' <small>' + sk.ability.toUpperCase() + '</small>', have || sel, have || (!sel && chosen.length >= lp.count), have ? ' <small>(have it)</small>' : '');
      }).join('') + '</div>';
    } else {
      var pool = (lp.from || R.SKILLS.map(function (x) { return x.id; })).filter(function (id) { var sk = d1.skills.find(function (x) { return x.id === id; }); return sk && sk.prof > 0; });
      var already = d0.skills.filter(function (x) { return x.prof === 2; }).map(function (x) { return x.id; });
      inner = pool.length ? '<div class="pills">' + pool.map(function (id) {
        var has = already.indexOf(id) >= 0, sel = chosen.indexOf(id) >= 0;
        return pill('lu-pick', key + ':' + id, h(R.skill(id).name), has || sel, has || (!sel && chosen.length >= lp.count), has ? ' <small>(expertise)</small>' : '');
      }).join('') + '</div>' : '<span class="muted2">You aren’t proficient in any of these skills yet' + (lp.from ? ' (' + lp.from.map(function (id) { return R.skill(id).name; }).join(', ') + ')' : '') + ', so there’s nothing to choose here. You can level up without it.</span>';
    }
    return sec(lp.label, h(lp.help || ''), inner, counter(chosen.length, lp.count));
  }

  function masterySection(pl, base, draft) {
    var s = LU.sel, d = R.derive(draft), had = base.classes.reduce(function (a, c) { return a.concat(c.masteries || []); }, []);
    var ws = C.all('items', on(draft)).filter(function (i) { return i.kind === 'weapon' && i.mastery && R.weaponAllowed(d.weaponProf, i) && (pl.def.id !== 'barbarian' || i.attack === 'melee'); });
    return sec('Weapon masteries', 'You can use the mastery trick of ' + pl.masteries + ' more kind of weapon. Your current ones are marked.',
      '<div class="pills">' + ws.map(function (w) {
        var known = had.indexOf(w.id) >= 0, sel = s.masteries.indexOf(w.id) >= 0;
        return pill('lu-mastery', w.id, h(w.name) + ' <small>· ' + h(R.MASTERY[w.mastery] ? R.MASTERY[w.mastery].name : w.mastery) + '</small>', known || sel, known || (!sel && s.masteries.length >= pl.masteries));
      }).join('') + '</div>', counter(s.masteries.length, pl.masteries));
  }

  function spellsFor(ch, list, level) {
    var lists = Array.isArray(list) ? list : [list];
    return C.all('spells', on(ch)).filter(function (s) { return s.level === level && (s.classes || []).some(function (c) { return lists.indexOf(c) >= 0; }); }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }
  /** The class spell list plus any lists opened up by level (Bard Magical Secrets). */
  function listsAt(pl) {
    var sc = pl.sc, L = pl.L, out = [sc.list];
    Object.keys(sc.extraLists || {}).forEach(function (k) { if (L >= +k) out = out.concat(sc.extraLists[k]); });
    return out;
  }
  /** Spells from Magic Initiate or species: already known, so class pickers show them as taken. */
  function otherSpellIds(ch) {
    var d = R.derive(ch);
    return d.spell ? d.spell.spells.filter(function (s) { return /Magic Initiate|species/.test(s.origin); }).map(function (s) { return s.id; }) : [];
  }
  function alwaysIds(draft, pl) {
    var d = R.derive(draft);
    return d.spell ? d.spell.spells.filter(function (s) { return /^Always prepared/.test(s.origin); }).map(function (s) { return s.id; }) : [];
  }
  function validPrepared(base, pl) {
    var L = listsAt(pl);
    var ok = [];
    for (var l = 1; l <= pl.maxSpell; l++) ok = ok.concat(spellsFor(base, L, l).map(function (s) { return s.id; }));
    return (pl.isNew ? [] : R.preparedOf(base, pl.idx)).filter(function (id) { return ok.indexOf(id) >= 0; });
  }

  function pl0() { return plan(); }
  function spellPicker(ch, list, chosen, max, action, lockedIds, argPrefix) {
    var v = lview();
    return '<div class="spell-pick">' + list.map(function (s) {
      var sel = chosen.indexOf(s.id) >= 0, locked = (lockedIds || []).indexOf(s.id) >= 0;
      var eff = s.effect ? (s.effect.dice ? s.effect.dice + ' ' + (s.effect.type || '') : s.effect.text || '') : '';
      return '<button type="button" data-act="' + action + '" data-arg="' + h((argPrefix ? argPrefix + ':' : '') + s.id) + '" data-hover="lu-spell" data-ctx="' + action + '" aria-pressed="' + (sel || locked) + '"' + (locked || (!sel && chosen.length >= max) ? ' disabled' : '') + '>' +
        '<b style="font-size:14px;display:inline-flex;align-items:center;gap:6px">' + h(s.name) + (s.concentration ? '<span class="conc" title="Concentration"><i role="img" aria-label="Concentration"></i></span>' : '') + '</b>' +
        '<small>' + h((locked ? 'Known · ' : '') + s.school + ' · ' + s.time) + '</small><small style="color:var(--body2)">' + h(eff) + '</small></button>';
    }).join('') + '</div>';
  }
  function spellDetail(ch, ctx) {
    if (lview().hoverCtx !== ctx) return '<div class="detail"><span class="muted2" style="font-size:13px">Hover or tap a spell to read what it does.</span></div>';
    var hov = lview().hover && get(ch, 'spells', lview().hover);
    return hov ? '<div class="detail"><b>' + h(hov.name) + '</b><span class="muted2" style="font-size:12px">' + h([hov.level ? ordinal(hov.level) + ' level' : 'Cantrip', hov.school, hov.time, hov.range, hov.components, hov.duration].join(' · ')) + '</span><span style="font-size:13px;line-height:1.5;color:var(--body2);white-space:pre-line">' + h(hov.text) + '</span></div>'
      : '<div class="detail"><span class="muted2" style="font-size:13px">Hover or tap a spell to read what it does.</span></div>';
  }

  function cantripSection(pl, base, draft) {
    var s = LU.sel, L = pl.sc.list, known = allCantrips(base).concat(alwaysIds(base, pl), otherSpellIds(base));
    return sec('New cantrip' + (pl.cantrips > 1 ? 's' : ''), 'You learn ' + pl.cantrips + ' more cantrip' + (pl.cantrips > 1 ? 's' : '') + '. Cantrips you already know are marked.',
      spellPicker(draft, spellsFor(draft, L, 0), s.cantrips, pl.cantrips, 'lu-cantrip', known) + spellDetail(draft, 'lu-cantrip'), counter(s.cantrips.length, pl.cantrips));
  }

  /** How many spells to prepare: the class table, or every available spell if this app's list is shorter. */
  function preparedTarget(pl, draft) {
    var L = listsAt(pl), always = alwaysIds(draft, pl), n = 0;
    for (var l = 1; l <= pl.maxSpell; l++) n += spellsFor(draft, L, l).filter(function (s) { return always.indexOf(s.id) < 0; }).length;
    return Math.min(pl.prepared, n);
  }
  function preparedSection(pl, draft) {
    var L = listsAt(pl), chosen = R.preparedOf(draft, pl.idx), always = alwaysIds(draft, pl), target = preparedTarget(pl, draft), locked = otherSpellIds(draft).concat(otherClassSpells(draft, pl.idx));
    var groups = '';
    for (var l = 1; l <= pl.maxSpell; l++) {
      var list = spellsFor(draft, L, l).filter(function (s) { return always.indexOf(s.id) < 0; });
      groups += '<div style="display:flex;flex-direction:column;gap:6px"><b style="font-size:14px">' + ordinal(l) + '-level spells' + (l === pl.newSpellLevel ? ' <span class="badge" style="font-size:12px">New</span>' : '') + '</b>' + spellPicker(draft, list, chosen, target, 'lu-prep', locked) + '</div>';
    }
    var why = (pl.multi ? 'These are your ' + h(pl.def.name) + ' spells, prepared by your ' + h(pl.def.name) + ' level (' + pl.L + '). Spells from your other classes are marked as known. ' : '') + (target < pl.prepared ? 'You can prepare ' + pl.prepared + ' spells, but Character Forge has only ' + target + ' for you so far (more come with the full SRD), so pick them all for now. ' : 'You can prepare ' + pl.prepared + ' spells at level ' + pl.L) + (target < pl.prepared ? '' : '') + (pl.sc.pact ? ' (your Pact slots cast them at ' + ordinal(pl.maxSpell) + ' level)' : '') + '. You can also swap any spell you had for another.' +
      (L.length > 1 ? ' Magical Secrets: you can pick from the Bard, Cleric, Druid and Wizard lists.' : '') + (always.length ? ' Always prepared, not counted: ' + always.map(function (id) { var s = get(draft, 'spells', id); return s ? s.name : id; }).join(', ') + '.' : '');
    return sec('Prepared spells', why, groups + spellDetail(draft, 'lu-prep'), counter(chosen.length, target));
  }

  function changes(before, after, pl, miss) {
    var rows = [
      ['Level', before.level, after.level]].concat(pl.multi ? [['Classes', before.classText, after.classText]] : []).concat([
      ['Hit points', before.hpMax, after.hpMax],
      ['Proficiency', sg(before.pb), sg(after.pb)],
      ['Armor Class', before.ac, after.ac],
      ['Speed', before.speed + ' ft', after.speed + ' ft'],
      ['Attacks per action', before.attacksPerAction, after.attacksPerAction]
    ]);
    if (after.hitDice !== before.hitDice) rows.splice(2, 0, ['Hit dice', before.hitDice, after.hitDice]);
    R.ABILITIES.forEach(function (a) { if (before.scores[a.id] !== after.scores[a.id]) rows.push([a.name, before.scores[a.id], after.scores[a.id]]); });
    if (after.spell) {
      var slotTxt = function (d) { return d.spell ? d.spell.slots.map(function (s) { return s.max + '×' + ordinal(s.level) + (s.pact && d.spell.hasPact && !d.spell.pact ? ' pact' : ''); }).join(', ') || '—' : '—'; };
      rows.push(['Spell slots', slotTxt(before), slotTxt(after)]);
      if (before.spell && before.spell.dc !== after.spell.dc) rows.push(['Spell save DC', before.spell.dc, after.spell.dc]);
    }
    after.resources.forEach(function (r) {
      var b = before.resources.find(function (x) { return x.id === r.id; });
      if (!b || b.max !== r.max) rows.push([r.name, b ? b.max : '—', r.max]);
    });
    return '<section class="card so-far"><h2 class="h-sec">What changes</h2>' +
      '<dl class="lu-diff">' + rows.map(function (r) {
        var up = String(r[1]) !== String(r[2]);
        return '<dt>' + h(r[0]) + '</dt><dd' + (up ? ' class="up"' : '') + '>' + (up ? '<span class="muted2">' + h(r[1]) + ' → </span><b>' + h(r[2]) + '</b>' : h(r[2])) + '</dd>';
      }).join('') + '</dl>' +
      (miss.length ? '<div style="border-top:1px solid var(--soft);padding-top:10px"><span class="muted2" style="font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase">Still to choose (' + miss.length + ')</span><ul class="check-list" style="margin-top:6px">' +
        miss.map(function (m) { return '<li><span class="no">•</span>' + h(m) + '</li>'; }).join('') + '</ul></div>'
        : '<div class="notice">All set. Press “Become level ' + pl.charL + '” to save.</div>') + '</section>';
  }

  /* ---------- handlers ---------- */
  var H = app.handlers, HV = app.hoverHandlers;
  function toggleIn(list, id, max) { list = (list || []).slice(); var i = list.indexOf(id); if (i >= 0) list.splice(i, 1); else if (list.length < max) list.push(id); return list; }
  function lmut(fn) { if (!LU) return; fn(LU.sel, plan()); app.render(); }

  HV['lu-spell'] = function (arg, el) {
    var id = String(arg).split(':').pop(), ctx = (el && el.getAttribute('data-ctx')) || '';   // arcanum buttons carry "arcanum0:spell"
    if (lview().hover !== id || lview().hoverCtx !== ctx) { lview().hover = id; lview().hoverCtx = ctx; app.render(); }
  };
  H['lu-target'] = function (t) { if (!LU || LU.sel.target === t) return; LU.sel = freshSel(LU.base); LU.sel.target = t; lview().hover = null; app.render(); };
  H['lu-mcopen'] = function () { lview().mcOpen = !lview().mcOpen; app.render(); };
  H['lu-mcskill'] = function (id) { lmut(function (s, pl) { s.mcSkills = toggleIn(s.mcSkills, id, pl.mc.skills.count); }); };
  H['lu-mctool'] = function (id) { lmut(function (s) { s.mcTool = s.mcTool === id ? null : id; }); };
  H['lu-hp'] = function (mode) {
    lmut(function (s, pl) {
      s.hpMode = mode;
      if (mode === 'roll' && s.hpRoll == null) {
        var r = app.roll('Level ' + pl.L + ' hit points (d' + pl.def.hitDie + ')', 1, pl.def.hitDie, 0);
        s.hpRoll = r.rolls[0];
      }
    });
  };
  H['lu-sub'] = function (id) { lmut(function (s) { if (s.subclass !== id) { s.subclass = id; Object.keys(s.choices).forEach(function (k) { delete s.choices[k]; }); s.picks = {}; } }); };
  H['lu-feat'] = function (id) { lmut(function (s) { if (s.feat !== id) { s.feat = id; s.asi = {}; s.featSkills = []; s.featPicks = {}; s.asiMode = 'two'; } }); };
  ['opt', 'sp', 'ab'].forEach(function (kind) {
    H['lu-fp-' + kind] = function (arg) {
      var parts = String(arg).split('|'); parts.shift();
      lmut(function (s) { var f = s.feat && CF.content.get('feats', s.feat, CF.content.on(LU.base)); if (f) s.featPicks = CF.ui.featPicks.apply(f, s.featPicks || {}, kind, parts); });
    };
  });
  H['lu-asimode'] = function (m) { lmut(function (s) { s.asiMode = m; s.asi = {}; }); };
  H['lu-asi'] = function (role, el) {
    var v = el.value;
    lmut(function (s) {
      if (role === 'p2') { s.asi = {}; if (v) s.asi[v] = 2; return; }
      var ones = Object.keys(s.asi).filter(function (k) { return s.asi[k] === 1; });
      var a = role === 'a' ? v : ones[0], b = role === 'b' ? v : ones[1];
      if (role === 'a' && v && v === ones[1]) b = ones[0];
      if (role === 'b' && v && v === ones[0]) a = ones[1];
      s.asi = {}; if (a) s.asi[a] = 1; if (b && b !== a) s.asi[b] = 1;
    });
  };
  H['lu-featasi'] = function (k) { lmut(function (s) { s.asi = {}; s.asi[k] = 1; }); };
  H['lu-featskill'] = function (id) { lmut(function (s) { s.featSkills = toggleIn(s.featSkills, id, 3); }); };
  H['lu-choice'] = function (arg) {
    var p = arg.split(':');
    lmut(function (s, pl) {
      var c = pl.choices.find(function (x) { return x.q.id === p[0]; }); if (!c) return;
      s.choices[p[0]] = c.need === 1 && !c.q.count ? [p[1]] : toggleIn(s.choices[p[0]], p[1], c.need);
    });
  };
  H['lu-pick'] = function (arg) {
    var p = arg.split(':');
    lmut(function (s, pl) {
      var i = +p[0].replace(/^\D+/, ''), lp = pl.picks[i]; if (!lp) return;
      s.picks[p[0]] = toggleIn(s.picks[p[0]], p[1], lp.count);
    });
  };
  H['lu-pick-sp'] = function (arg) { H['lu-pick'](arg); };
  H['lu-mastery'] = function (id) { lmut(function (s, pl) { s.masteries = toggleIn(s.masteries, id, pl.masteries); }); };
  H['lu-cantrip'] = function (id) { lmut(function (s, pl) { s.cantrips = toggleIn(s.cantrips, id, pl.cantrips); }); };
  H['lu-prep'] = function (id) { lmut(function (s, pl) { s.prepared = toggleIn(s.prepared, id, preparedTarget(pl, build())); }); };

  H['lu-finish'] = function () {
    if (!LU) return;
    var pl = plan(), draft = build();
    if (status(pl, draft).length) { app.flash('A few choices are still missing. See the list on the right.', true); app.render(); return; }
    var snap = { level: R.totalLevel(LU.base), classes: U.clone(LU.base.classes), spells: U.clone(LU.base.spells), languages: (LU.base.languages || []).slice() };
    draft.levelHistory = (LU.base.levelHistory || []).concat([snap]);
    if (!CF.store.put(draft)) { app.flash('Couldn’t save: this browser’s storage is full or blocked.', true); app.render(); return; }
    var d = R.derive(draft), name = draft.name || 'Your hero';
    LU = null; app.view.lu = null;
    if (draft.quickChain && draft.quickChain > pl.charL) {
      CF.store.put(draft);
      app.flash('Level ' + pl.charL + ' done. Now level ' + (pl.charL + 1) + '.');
      app.view = {}; app.go('#/levelup/' + encodeURIComponent(draft.id)); app.render();
      try { root.scrollTo(0, 0); } catch (e) { /* ignore */ }
      return;
    }
    if (draft.quickChain) { delete draft.quickChain; CF.store.put(draft); }
    app.flash(name + ' is now level ' + pl.charL + (pl.multi ? ' (' + d.classText + ')' : '') + '! Maximum HP is ' + d.hpMax + '. Changed your mind? Open Level up again to undo it.');
    app.go('#/c/' + encodeURIComponent(draft.id));
  };
  H['lu-stop'] = function () {
    if (!LU) return;
    var ch = CF.store.get(LU.id); delete ch.quickChain; CF.store.put(ch); LU = null;
    app.flash(ch.name + ' stays at level ' + R.totalLevel(ch) + '. Use Level up on the sheet whenever you’re ready.');
    app.go('#/c/' + encodeURIComponent(ch.id));
  };
  H['lu-undo'] = function () { lview().confirmUndo = true; app.render(); try { root.scrollTo(0, 0); } catch (e) { /* ignore */ } };
  H['lu-undo-no'] = function () { lview().confirmUndo = false; app.render(); };
  H['lu-undo-yes'] = function () {
    if (!LU) return;
    var ch = CF.store.get(LU.id), hist = (ch && ch.levelHistory) || [];
    if (!hist.length) return;
    lview().confirmUndo = false;
    (function () {
      var snap = hist.pop();
      ch.classes = snap.classes; ch.spells = snap.spells; ch.languages = snap.languages; ch.levelHistory = hist;
      var d = R.derive(ch);
      ch.play.hpLost = Math.min(ch.play.hpLost || 0, d.hpMax);
      if (typeof ch.play.hdUsed !== 'object') ch.play.hdUsed = Math.min(ch.play.hdUsed || 0, ch.classes[0].level || 1);
      CF.store.put(ch);
      LU = null;
      app.flash(ch.name + ' is back to level ' + R.totalLevel(ch) + '.');
      app.go('#/c/' + encodeURIComponent(ch.id));
    })();
  };
})(window);
