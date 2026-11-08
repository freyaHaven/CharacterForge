/* Character Forge — character sheet (Overview is read-only, Play mode is interactive; same layout). */
(function (root) {
  'use strict';
  var CF = root.CF, U = CF.util, R = CF.rules, app = CF.app, h = U.esc, sg = U.signed;
  var P = false;           // play mode for the current render
  var CUR_ID = null;

  /* ---------- small builders ---------- */
  function attr(o) { return Object.keys(o).filter(function (k) { return o[k] != null && o[k] !== false; }).map(function (k) { return ' ' + k + '="' + h(o[k] === true ? k : o[k]) + '"'; }).join(''); }
  /** Interactive in Play mode, plain in Overview. */
  function act(cls, action, arg, label, inner, extra) {
    extra = extra || {};
    if (!P) return '<div class="' + cls + '"' + attr({ style: extra.style }) + '>' + inner + '</div>';
    return '<button type="button" class="' + cls + '"' + attr({ 'data-act': action, 'data-arg': arg, 'aria-label': label, 'aria-pressed': extra.pressed, style: extra.style, disabled: extra.disabled }) + '>' + inner + '</button>';
  }
  function settings() { return CF.store.settings(); }
  function fmtW(lb) {
    if (!lb) return '--';
    if (settings().unit === 'kg') { var kg = lb * 0.45359237; return U.round(kg, kg < 10 ? 1 : 0) + ' kg'; }
    return U.round(lb, 2) + ' lb';
  }
  function fmtC(gp) { return gp >= 1 ? U.round(gp, 2) + ' gp' : gp >= 0.1 ? U.round(gp * 10, 1) + ' sp' : U.round(gp * 100, 0) + ' cp'; }
  function concBadge(s) { return s && s.concentration ? '<span class="conc" title="Concentration"><i role="img" aria-label="Concentration"></i><small>(' + h(s.concDuration || '') + ')</small></span>' : ''; }
  function dmgIcon(type) { return ['slashing', 'piercing', 'bludgeoning', 'force'].indexOf(type) >= 0 ? '<span class="ic ic-' + type + '" role="img" aria-label="' + h(type) + ' damage" style="width:20px;height:20px"></span>' : type && type !== 'healing' && type.length < 14 ? '<small class="dmg-word">' + h(type) + '</small>' : ''; }
  function paras(text) {
    return (text || '').split('\n').map(function (line) {
      var w = '(?:[A-Z][\\w’\'\\-]*|a|an|and|of|the|to|in|on|or|with|for)';
      var m = new RegExp('^([A-Z][\\w’\'\\-]*(?: ' + w + '){0,6}[.:])\\s').exec(line);
      return '<p>' + (m ? '<strong>' + h(m[1]) + '</strong>' + h(line.slice(m[1].length)) : h(line)) + '</p>';
    }).join('');
  }
  var STAR = '<svg class="star" role="img" aria-label="Weapon mastery" viewBox="0 0 24 24"><path d="m12 2 3 6.3 6.9 1-5 4.8 1.2 6.9L12 17.8 5.9 21l1.2-6.9-5-4.8 6.9-1z"/></svg>';

  /* ---------- d20 rolls, with Exhaustion applied ---------- */
  var EX = null;
  /** kind: 'check' | 'save' | 'attack'. 2024: −2 per level. 2014: disadvantage from the step table. */
  /** A d20 roll. opt: { adv: [reasons], dis: [reasons] } from traits, armor or conditions; the "Next roll" switch adds to it. */
  function d20(label, bonus, kind, opt) {
    opt = { adv: ((opt && opt.adv) || []).slice(), dis: ((opt && opt.dis) || []).slice() };
    if (app.nextMode === 1) opt.adv.push('chosen'); else if (app.nextMode === -1) opt.dis.push('chosen');
    if (app.nextMode && !RR.quiet) app.nextMode = 0;   // the switch is for one roll (a reroll keeps it)
    var res = d20raw(label, bonus, kind === 'init' ? 'check' : kind, opt);
    offerD20(kind, res.rolls[0]);
    return res;
  }
  function d20raw(label, bonus, kind, opt) {
    var ex = EX || { level: 0 }, adv = opt.adv, dis = opt.dis, notes = [];
    if (ex.level && !ex.old) { bonus = bonus - ex.d20; notes.push('Exhaustion ' + ex.level + ' (−' + ex.d20 + ')'); }
    if (ex.level && ex.old && ((kind === 'check' && ex.disCheck) || ((kind === 'save' || kind === 'attack') && ex.disAttackSave))) dis = dis.concat(['Exhaustion ' + ex.level]);
    var mode = adv.length && !dis.length ? 1 : dis.length && !adv.length ? -1 : 0;
    var why = function (l) { return l.filter(function (x) { return x !== 'chosen'; }).join(', '); };
    if (adv.length && dis.length) notes.push('Advantage and Disadvantage cancel out');
    if (!mode) {
      var r = app.roll(label, 1, 20, bonus);
      if (notes.length) app.lastRoll.detail += ' · ' + notes.join(' · ');
      return r;
    }
    var a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20), face = mode > 0 ? Math.max(a, b) : Math.min(a, b);
    var total = face + (bonus || 0), reasons = why(mode > 0 ? adv : dis);
    app.lastRoll = { label: label + (mode > 0 ? ' · advantage' : ' · disadvantage'), total: total, nat: face === 20 || face === 1 ? face : 0,
      detail: '[' + a + ', ' + b + '] keep ' + face + (bonus ? (bonus > 0 ? ' + ' + bonus : ' − ' + Math.abs(bonus)) : '') + (reasons ? ' · ' + reasons : '') + (notes.length ? ' · ' + notes.join(' · ') : '') + (face === 20 ? ' · Natural 20!' : face === 1 ? ' · Natural 1' : ''),
      adv: mode };
    if (CF.dice) CF.dice.show(Object.assign({ sides: 20, rolls: [a, b], keep: face }, app.lastRoll));
    return { rolls: [face], total: total, nat: app.lastRoll.nat };
  }

  /* ---------- reroll offers (Halfling Luck, Survivor, Tavern Brawler…) ---------- */
  var RR = { snap: null, replay: null, quiet: false };
  /** Remember how to redo the current action, and the play state before it, in case a reroll is taken. */
  function beginAction(replay) {
    if (RR.quiet) return;
    var ch = cur(); RR.snap = ch ? JSON.stringify(ch.play || {}) : null; RR.replay = replay; app.rerollOffer = null;
  }
  function ruleFor(scope) { var ch = cur(); if (!ch) return null; return (R.derive(ch).rerolls || []).find(function (r) { return r.scope === scope; }) || null; }
  /** After a d20 roll: offer the reroll when the face qualifies. */
  function offerD20(kind, face) {
    if (RR.quiet || !RR.replay) return;
    var rule = (kind === 'init' && ruleFor('init')) || ruleFor('d20');
    if (!rule || face > rule.max) return;
    app.rerollOffer = { mode: 'replay', snap: RR.snap, replay: RR.replay,
      text: 'You rolled a ' + face + '. ' + rule.name + ': you can reroll' + (rule.must ? ', and you must use the new roll' : '') + '.' };
  }
  /** After a damage or Hit Die roll: offer to reroll the dice at or under the rule's number. */
  function offerDice(scope, res, label, sides, mod) {
    if (RR.quiet || !res || !res.rolls) return;
    var rule = ruleFor(scope); if (!rule) return;
    var low = res.rolls.filter(function (x) { return x <= rule.max; });
    if (!low.length) return;
    app.rerollOffer = { mode: 'dice', label: label, rolls: res.rolls.slice(), sides: sides, mod: mod || 0, max: rule.max,
      text: 'You rolled ' + (low.length === 1 ? 'a ' + low[0] : low.length + ' dice of ' + rule.max + ' or lower') + '. ' + rule.name + ': you can reroll ' + (low.length === 1 ? 'it' : 'them') + (rule.must ? ', and you must use the new roll' : '') + '.' };
  }
  function dmgRoll(label, dice, mod, crit, scope) {
    var res = app.rollDice(label, dice, mod, crit), m = /^(\d+)d(\d+)$/.exec(dice || '');
    if (scope && m) offerDice(scope, res, label, +m[2], mod);
    return res;
  }
  function rerollPrompt() {
    var o = app.rerollOffer; if (!o) return '';
    return '<div class="reroll-offer" role="alertdialog" aria-label="Reroll?"><span>' + h(o.text) + '</span><span style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button type="button" class="btn btn-sm" data-act="reroll-no">Keep</button><button type="button" class="btn btn-sm btn-teal" data-act="reroll-yes">Reroll</button></span></div>';
  }

  function view() {
    var v = app.view;
    if (!v.init) Object.assign(v, { init: true, tab: 'actions', sub: 'all', spellSub: 'all', spellOpen: null, actHover: null, invFilter: 'all', invQuery: '', collapsed: {}, picker: false, amt: 1 });
    return v;
  }

  /* ---------- screen ---------- */
  CF.ui.sheet = function (route) {
    var ch = CF.store.get(route.id);
    CUR_ID = route.id;
    if (!ch) return CF.ui.topbar() + '<main class="page"><div class="empty"><b>Character not found</b><a class="btn" href="#/">Back to characters</a></div></main>';
    P = !!route.play;
    var d = R.derive(ch), v = view();
    EX = d.exhaustion;

    return CF.ui.topbar('<a class="btn btn-sm btn-ghost" href="#/" style="border:none">← Characters</a><span class="grow muted2" style="font-size:13px">' + (P ? 'Play mode · saved on this device' : 'Overview') + '</span>') +
      '<main class="page ' + (P ? 'play' : 'static') + '">' +
      CF.ui.notice() +
      identity(ch, d) + rerollPrompt() +
      (P ? rollbar() : '') +
      '<section class="core" aria-label="Core stats">' + abilities(d) +
        '<div class="stat-col"><div class="stat-grid">' + box('Proficiency', sg(d.pb), 'Bonus') + box('Walking', d.speed + ' ft', 'Speed') + inspiration(d) + hpBox(d, v) + '</div></div>' +
      '</section>' +
      '<div class="row-wrap">' +
        '<div class="left-col"><div style="flex:1 1 240px;display:flex;flex-direction:column;gap:14px">' + savesPanel(d) + sensesPanel(d) + trainingPanel(d) + '</div>' + skillsPanel(d) + '</div>' +
        '<div class="stat-col"><div class="stat-grid">' +
          act('box rollable mark', 'roll', 'init', 'Roll initiative, ' + sg(d.initiative), '<span class="k">Initiative' + advMarks(d, 'init') + '</span><span class="v">' + sg(d.initiative) + '</span>', { style: 'position:relative' }) +
          '<div class="box"><span class="k">Armor</span><span class="v">' + d.ac + '</span><span class="k">Class</span>' + (d.acNote ? '<span style="font-size:10px;font-weight:600;color:var(--accent)">' + h(d.acNote) + '</span>' : '') + '</div>' +
          defenses(d) + conditions(ch, v) +
        '</div>' + tabsPanel(ch, d, v) + '</div>' +
      '</div>' + CF.ui.dialog() + castAsk(d) +
      '</main>';
  };

  function wsChip(ch, d) {
    var x = (ch.extras || []).find(function (e) { return e.id === ch.play.wildShape; }); if (!x) return '';
    var c = R.extraCreature(ch, d, x);
    return '<span class="badge" style="align-self:flex-start;margin-top:4px">Wild Shape: ' + h(x.nick || (c ? c.name : 'beast')) + ' · see Extras</span>';
  }
  function box(k, val, k2) { return '<div class="box"><span class="k">' + h(k) + '</span><span class="v">' + h(val) + '</span><span class="k">' + h(k2) + '</span></div>'; }

  function identity(ch, d) {
    return '<section class="ident"><span class="avatar" style="width:60px;height:60px;font-size:26px">' + h(ch.name.charAt(0)) + '</span>' +
      '<div style="display:flex;flex-direction:column;gap:2px;flex:1 1 260px"><h1>' + h(ch.name) + '</h1><span class="sum">' + h(d.summary) + '</span>' + (ch.play && ch.play.wildShape ? wsChip(ch, d) : '') + '</div>' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end">' +
          '<div class="mode-switch" role="group" aria-label="Sheet mode"><button type="button" aria-pressed="' + !P + '" data-act="mode" data-arg="overview">Overview</button><button type="button" aria-pressed="' + P + '" data-act="mode" data-arg="play">Play</button></div>' +
          (P ? '<button class="btn" data-act="short-rest">Short rest</button><button class="btn" data-act="long-rest">Long rest</button>' : '') +
          (d.level < 20 ? '<a class="btn btn-teal" href="#/levelup/' + encodeURIComponent(ch.id) + '">Level up</a>' : '<a class="btn" href="#/levelup/' + encodeURIComponent(ch.id) + '" title="Level 20 is the highest level">Level ' + d.level + '</a>') +
          '<button class="btn btn-icon" data-act="export" data-arg="' + h(ch.id) + '" aria-label="Export character file">' + CF.ui.icons.down + '</button>' +
        '</div>' +
        (P && app.view.restNote ? '<span role="status" class="muted2" style="font-size:12px">' + h(app.view.restNote) + '</span>' : '') +
      '</div></section>';
  }

  /** After a natural 20 attack: a reminder that the next damage roll is a critical. (Rolls themselves show in the dice corner.) */
  function rollbar() {
    if (!app.critActive) return '';
    return '<div class="rollbar crit-only" role="status"><span class="crit-chip">Critical hit! Damage: ' + h(app.CRIT_RULES[CF.store.settings().crit || 'dice'].short) + '<button type="button" data-act="crit-done" aria-label="End critical hit">Done</button></span><span class="lbl">Roll the damage of ' + h(app.critActive.label || 'the attack') + ' and it counts as a critical.</span></div>';
  }

  function abilities(d) {
    return '<div class="abil-grid">' + R.ABILITIES.map(function (a) {
      return act('abil rollable mark', 'roll', 'abil:' + a.id, a.name + ' ' + d.scores[a.id] + ', modifier ' + sg(d.mods[a.id]) + '. Roll check',
        '<span class="n">' + a.name + '</span><span class="m">' + sg(d.mods[a.id]) + '</span><span class="s">' + d.scores[a.id] + '</span>');
    }).join('') + '</div>';
  }

  function inspiration(d) {
    var on = !!d.play.inspiration;
    return act('box rollable', 'inspiration', null, 'Heroic Inspiration' + (on ? ', on' : ', off'),
      '<span class="insp' + (on ? ' on' : '') + '" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + (on ? '#15141B' : 'var(--line3)') + '" stroke-width="2" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg></span><span class="k" style="line-height:1.2">Heroic<br>Inspiration</span>',
      { pressed: String(on), style: 'gap:6px' });
  }

  function hpBox(d, v) {
    var ds = d.play.deathSaves || { s: 0, f: 0 };
    var ctrl = P ? '<div class="hp-ctrl"><button style="background:var(--teal-bg)" data-act="heal">Heal</button>' +
      '<input type="number" min="0" value="' + h(v.amt) + '" aria-label="Amount to heal or damage" data-act="amt" data-key="amt">' +
      '<button style="background:var(--accent-bg)" data-act="damage">Damage</button></div>' : '';
    var inner;
    if (d.hp > 0) {
      var pct = d.hp / d.hpMax;
      inner = '<div class="hp-nums' + (d.hpMax >= 100 ? ' wide-hp' : '') + '"><span class="k">Current</span><span></span><span class="k">Max</span><span class="k">Temp</span>' +
        '<span class="big" style="color:' + (pct > 0.5 ? 'inherit' : pct > 0.25 ? 'var(--warn)' : 'var(--danger)') + '">' + d.hp + '</span><span aria-hidden="true" style="font-size:24px;color:var(--muted2)">/</span>' +
        '<span class="big">' + d.hpMax + '</span>' + (P ? '<input type="number" min="0" class="temp-in" value="' + (d.temp || '') + '" placeholder="—" data-act="temp-set" data-key="temp-set" aria-label="Temporary hit points" title="Temporary HP: type a number (0 to clear)">'
          : '<span style="font-size:22px;font-weight:500;color:var(--muted)">' + (d.temp || '—') + '</span>') +
        '<span class="k" style="grid-column:1 / span 3">Hit points</span>' + (P ? '<span class="k" style="font-size:10px">type to set</span>' : '') + '</div>';
    } else {
      var dead = ds.f >= 3, stable = ds.s >= 3;
      var pips = function (kind, n) { var out = ''; for (var i = 0; i < 3; i++) out += P ? '<button type="button" class="pip' + (i < n ? ' on' : '') + '" data-act="ds" data-arg="' + kind + ':' + i + '" aria-label="Death save ' + (kind === 'f' ? 'failure' : 'success') + ' ' + (i + 1) + '" aria-pressed="' + (i < n) + '"></button>' : '<span class="pip' + (i < n ? ' on' : '') + '"></span>'; return out; };
      inner = '<div class="deaths"><div style="display:flex;flex-direction:column;gap:3px;min-width:0;width:100%">' +
        '<div class="ds-row fail"><span class="t">Failure</span><span style="display:flex;gap:5px">' + pips('f', ds.f) + '</span></div>' +
        '<div class="ds-row ok"><span class="t">Success</span><span style="display:flex;gap:5px">' + pips('s', ds.s) + '</span></div>' +
        '<div class="ds-foot" style="color:' + (dead ? 'var(--danger)' : stable ? 'var(--teal)' : 'var(--muted)') + '"><span class="ic ic-skull" aria-hidden="true"></span>' + (dead ? 'Dead' : stable ? 'Stable' : 'Death saves') + '</div>' +
        (P ? (stable ? '<button class="small-out ds-roll" data-act="wake" title="A Stable character regains 1 HP after 1d4 hours">Wake up (1 HP)</button>'
          : '<button class="small-out ds-roll" data-act="death-roll"' + (dead ? ' disabled' : '') + '>Roll save</button>') : '') + '</div></div>';
    }
    return '<div class="hp-box wide' + (d.hp > 0 ? '' : ' dying') + '">' + ctrl + inner + '</div>';
  }

  function defenses(d) {
    return '<div class="defs"><span class="t">Defenses</span>' + (d.defenses.length ? d.defenses.map(function (x) {
      return '<span><strong>' + (x.kind === 'immune' ? 'Immune' : x.kind === 'resist' ? 'Resistant' : 'Advantage') + ':</strong> ' + h(x.text) + '</span>';
    }).join('') : '<span class="muted2">None</span>') + '</div>';
  }

  function exhaustionRow(ch, d) {
    var ex = d.exhaustion, n = ex.level;
    if (!P && !n) return '';
    var pips = '';
    for (var i = 1; i <= 6; i++) pips += P ? '<button type="button" class="exh-pip' + (i <= n ? ' on' : '') + '" data-act="exh" data-arg="' + (i === n ? i - 1 : i) + '" aria-label="Exhaustion level ' + i + '" aria-pressed="' + (i <= n) + '">' + i + '</button>' : '<span class="exh-pip' + (i <= n ? ' on' : '') + '" aria-hidden="true">' + i + '</span>';
    return '<div class="exh"><span style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="font-size:13px">Exhaustion' + (n ? ' ' + n : '') + '</b>' +
      (P ? '<span style="display:flex;gap:4px"><button class="small-out" data-act="exh" data-arg="' + Math.max(0, n - 1) + '"' + (n ? '' : ' disabled') + ' aria-label="Remove a level of Exhaustion">−</button><button class="small-out" data-act="exh" data-arg="' + Math.min(6, n + 1) + '"' + (n < 6 ? '' : ' disabled') + ' aria-label="Add a level of Exhaustion">+</button></span>' : '') + '</span>' +
      '<div class="exh-pips" role="group" aria-label="Exhaustion level">' + pips + '</div>' +
      (n ? '<span class="exh-fx' + (ex.dead ? ' dead' : '') + '">' + (ex.dead ? 'Level 6: your character dies.' : h(ex.lines.join(' · ')) + '. Applied to your rolls' + (ex.old ? ' and stats' : ' and speed') + ' automatically.') + '</span>'
        : '<span class="muted2" style="font-size:12px">' + (ex.old ? 'Each level adds a worse effect; level 6 is death.' : 'Each level: −2 to d20 rolls and −5 ft speed. Level 6 is death.') + ' A long rest removes one level.</span>') + '</div>';
  }

  function conditions(ch, v) {
    var list = ((ch.play && ch.play.conditions) || []).filter(function (c) { return c !== 'Exhaustion'; });
    var dd = R.derive(ch);
    return '<div class="defs wide"><span style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="t">Conditions</span>' +
      (P ? '<button class="small-out" data-act="picker" aria-expanded="' + v.picker + '">' + (v.picker ? 'Done' : '+ Add') + '</button>' : '') + '</span>' +
      (list.length ? '<div style="display:flex;flex-wrap:wrap;gap:6px">' + list.map(function (c) {
        return P ? '<button class="cond-chip" data-act="cond" data-arg="' + h(c) + '" aria-label="Remove ' + h(c) + '">' + h(c) + ' <span aria-hidden="true">×</span></button>' : '<span class="cond-chip">' + h(c) + '</span>';
      }).join('') + '</div>' : '<span class="muted2">None active</span>') +
      (P && v.picker ? '<div class="picker">' + R.CONDITIONS.filter(function (c) { return c !== 'Exhaustion' && list.indexOf(c) < 0; }).map(function (c) {
        return '<button data-act="cond" data-arg="' + h(c) + '">' + h(c) + '</button>';
      }).join('') + '</div>' : '') + exhaustionRow(ch, dd) + '</div>';
  }

  function dot(p) { return '<span class="dot" aria-hidden="true">' + (p === 2 ? '<b></b>' : '<i class="' + (p ? 'on' : '') + '"></i>') + '</span>'; }

  function savesPanel(d) {
    return '<section class="panel" aria-labelledby="h-saves"><h2 class="h-sec" id="h-saves">Saving throws</h2><div class="saves">' +
      [0, 2, 4, 1, 3, 5].map(function (i) {
        var s = d.saves[i];
        return act('save rollable', 'roll', 'save:' + s.id, s.name + ' saving throw ' + sg(s.bonus) + (s.prof ? ', proficient' : '') + '. Roll',
          dot(s.prof ? 1 : 0) + '<span class="a">' + s.abbr + '</span><span class="b">' + sg(s.bonus) + '</span>');
      }).join('') + '</div></section>';
  }

  function sensesPanel(d) {
    return '<section class="panel" aria-labelledby="h-senses" style="gap:6px"><h2 class="h-sec" id="h-senses">Senses</h2>' +
      d.senses.map(function (s) { return '<div class="sense"><span class="v">' + h(s.value) + '</span><span>' + h(s.label) + '</span></div>'; }).join('') + '</section>';
  }

  function trainingPanel(d) {
    var t = d.training;
    return '<section class="panel" aria-labelledby="h-train"><h2 class="h-sec" id="h-train">Proficiencies &amp; training</h2>' +
      [['Armor', t.armor], ['Weapons', t.weapons], ['Tools', t.tools], ['Languages', t.languages]].map(function (r) {
        return '<div class="train"><span class="k">' + r[0] + '</span><span class="v">' + h(r[1]) + '</span></div>';
      }).join('') + '</section>';
  }

  /** A small hexagon: green A (advantage) or red D (disadvantage); outlined when it only applies sometimes. */
  function hexMark(kind, soft, title) {
    return '<span class="hexm ' + (kind > 0 ? 'adv' : 'dis') + (soft ? ' soft' : '') + '" title="' + h(title) + '" aria-label="' + h(title) + '"><svg viewBox="0 0 20 22" aria-hidden="true"><path d="M10 1 19 6v10l-9 5-9-5V6z"/></svg><b>' + (kind > 0 ? 'A' : 'D') + '</b></span>';
  }
  function advMarks(d, id) {
    var st = R.checkState(d, id), ex = d.exhaustion && d.exhaustion.disCheck ? ['Exhaustion ' + d.exhaustion.level] : [];
    var dis = st.dis.concat(ex), out = '';
    if (st.adv.length && !dis.length) out += hexMark(1, false, 'Advantage: ' + st.adv.join(', '));
    else if (dis.length && !st.adv.length) out += hexMark(-1, false, 'Disadvantage: ' + dis.join(', '));
    else if (st.adv.length && dis.length) out += '<span class="hexm both" title="' + h('Advantage (' + st.adv.join(', ') + ') and Disadvantage (' + dis.join(', ') + ') cancel out') + '">A/D</span>';
    var sitA = st.sit.filter(function (x) { return /^Advantage/.test(x); }), sitD = st.sit.filter(function (x) { return /^Disadvantage/.test(x); });
    if (sitA.length && !out) out += hexMark(1, true, 'Sometimes: ' + sitA.map(function (x) { return x.replace(/^Advantage · /, ''); }).join(' | '));
    if (sitD.length && !out) out += hexMark(-1, true, 'Sometimes: ' + sitD.map(function (x) { return x.replace(/^Disadvantage · /, ''); }).join(' | '));
    return out;
  }
  function nextRollSwitch() {
    var m = app.nextMode || 0;
    return '<div class="next-roll" role="group" aria-label="Next roll"><span>Next roll</span>' + [[0, 'Normal'], [1, 'Advantage'], [-1, 'Disadvantage']].map(function (o) {
      return '<button type="button" data-act="next-roll" data-arg="' + o[0] + '" aria-pressed="' + (m === o[0]) + '" class="' + (o[0] > 0 ? 'a' : o[0] < 0 ? 'd' : '') + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }
  function skillsPanel(d) {
    return '<section class="panel" aria-labelledby="h-skills" style="flex:1.3 1 280px;gap:4px"><h2 class="h-sec" id="h-skills" style="margin-bottom:6px">Skills</h2>' +
      (P ? nextRollSwitch() : '') +
      d.skills.map(function (s) {
        var marks = advMarks(d, s.id);
        return act('skill rollable', 'roll', 'skill:' + s.id, s.name + ' ' + sg(s.bonus) + (s.prof === 2 ? ', expertise' : s.prof ? ', proficient' : '') + '. Roll',
          dot(s.prof) + '<span class="n">' + h(s.name) + ' <small>' + s.abbr + '</small>' + marks + '</span><span class="b">' + sg(s.bonus) + '</span>');
      }).join('') +
      '<div class="legend"><span>' + dot(0) + 'Not proficient</span><span>' + dot(1) + 'Proficient</span><span>' + dot(2) + 'Expertise</span><span>' + hexMark(1, false, 'Advantage') + 'Advantage</span><span>' + hexMark(-1, false, 'Disadvantage') + 'Disadvantage</span><span>' + hexMark(1, true, 'Sometimes') + 'Sometimes (hover)</span></div></section>';
  }

  /* ---------- tabs ---------- */
  var TABS = [['actions', 'Actions'], ['spells', 'Spells'], ['inventory', 'Inventory'], ['features', 'Features & Traits'], ['background', 'Background'], ['notes', 'Notes'], ['extras', 'Extras']];
  function tabsPanel(ch, d, v) {
    var body = v.tab === 'actions' ? actionsTab(d, v) : v.tab === 'spells' ? spellsTab(d, v) : v.tab === 'inventory' ? inventoryTab(ch, d, v)
      : v.tab === 'features' ? featuresTab(d, v) : v.tab === 'background' ? backgroundTab(d) : v.tab === 'notes' ? notesTab(ch, v) : CF.ui.extras.tab(ch, d, v);
    return '<section class="card" aria-label="Character details" style="display:flex;flex-direction:column;min-width:0">' +
      '<div class="tabs" role="tablist" aria-label="Sheet sections">' + TABS.map(function (t) {
        return '<button type="button" role="tab" aria-selected="' + (v.tab === t[0]) + '" data-act="tab" data-arg="' + t[0] + '">' + h(t[1]) + '</button>';
      }).join('') + '</div>' +
      '<div class="tabpanel" role="tabpanel" tabindex="0" aria-label="' + h((TABS.find(function (t) { return t[0] === v.tab; }) || TABS[0])[1]) + '">' + body + '</div></section>';
  }

  function pills(list, cur, action, label) {
    return '<div class="pills" role="tablist" aria-label="' + h(label) + '">' + list.map(function (p) {
      return '<button type="button" class="pill" role="tab" aria-selected="' + (cur === p[0]) + '" data-act="' + action + '" data-arg="' + p[0] + '"' + (p[2] ? ' aria-label="' + h(p[2]) + '"' : '') + '>' + p[1] + '</button>';
    }).join('') + '</div>';
  }

  /* attack table */
  function atkRow(a, key) {
    var range = a.range || { main: '—', label: '' };
    var hit = a.hit != null ? act('hitbox rollable', 'roll', 'hit:' + key, 'Roll ' + a.name + ' attack, ' + sg(a.hit), '<span class="sg">' + (a.hit >= 0 ? '+' : '−') + '</span><span class="nn">' + Math.abs(a.hit) + '</span>') + (a.dc ? '<small class="also-dc">DC ' + a.dc + ' ' + h(a.dcAbility) + '</small>' : '')
      : a.dc ? '<span class="dcbox"><small>DC</small><span>' + a.dc + '</span><small>' + h(a.dcAbility) + '</small></span>' : '<span class="muted2" style="padding-left:14px">--</span>';
    var dmgText = a.flat != null ? String(a.flat) : a.dice + (a.mod ? (a.mod > 0 ? '+' + a.mod : '−' + Math.abs(a.mod)) : '');
    var dmg = a.flat != null ? '<span class="dmgbox" style="min-width:44px"><span>' + h(dmgText) + '</span>' + dmgIcon(a.type) + '</span>'
      : act('dmgbox rollable', 'roll', 'dmg:' + key, 'Roll ' + a.name + ' damage, ' + dmgText + ' ' + a.type, '<span>' + h(dmgText) + '</span>' + dmgIcon(a.type)) +
        (a.second ? act('dmgbox rollable dmg2', 'roll', 'dmg2:' + key, 'Roll ' + a.name + ' ' + a.second.type + ' damage, ' + a.second.dice, '<span>' + h(a.second.dice) + '</span>' + dmgIcon(a.second.type)) : '');
    return '<div class="atk-row"><span style="display:flex;flex-direction:column;align-items:center;gap:2px">' + (a.mastery ? STAR : '') +
      '<span class="ic ic-' + h(a.icon || 'shortsword') + '" aria-hidden="true" style="width:24px;height:24px"></span></span>' +
      '<span style="display:flex;flex-direction:column;gap:1px;min-width:0"><span style="display:inline-flex;flex-wrap:wrap;align-items:center;gap:2px 8px"><span class="nm">' + h(a.name) + '</span>' + concBadge(a.spellDef) + '</span><span class="sub">' + h(a.sub) + '</span></span>' +
      '<span class="rng" style="display:flex;flex-direction:column;line-height:1.15"><span style="white-space:nowrap"><span class="a">' + h(range.main) + '</span>' +
        (typeof range.main === 'number' ? ' <span class="b" style="color:var(--ink)">ft.</span>' : '') + '</span><span class="c">' + (range.long ? '(' + range.long + ') ' : '') + h(range.label || '') + '</span></span>' +
      '<span>' + hit + '</span><span>' + dmg + '</span><span class="notes">' + h(a.notes || '') + '</span></div>';
  }
  function atkTable(sections) {
    return sections.filter(function (s) { return s.rows.length; }).map(function (s) {
      return '<div style="display:flex;flex-direction:column"><div class="sec-head"><span class="h-red">' + h(s.title) + '</span>' + (s.hint ? '<span class="hint">' + h(s.hint) + '</span>' : '') + '</div>' +
        '<div class="atk-head"><span></span><span>Attack</span><span>Range</span><span>Hit / DC</span><span>Damage</span><span>Notes</span></div>' +
        s.rows.map(function (r) { return atkRow(r.a, r.key); }).join('') + '</div>';
    }).join('<div style="height:12px"></div>');
  }

  /** Everything the Actions tab needs, keyed so roll handlers can find it again. */
  function actionData(d) {
    var keyed = {};
    var add = function (key, a) { keyed[key] = a; return { a: a, key: key }; };
    var weaponRows = d.attacks.map(function (a, i) { return add('w' + i, a); });
    var spells = d.spell ? d.spell.spells : [];
    var spellAtk = function (s) {
      var res = d.resources.find(function (r) { return r.spell === s.id; });
      var slot = d.spell.slots.find(function (x) { return x.level === s.level; });
      var bits = [];
      if (s.beams > 1) bits.push(s.beams + ' beams, roll each');
      if (res) bits.push('Free casts (' + (res.max - res.used) + '/' + res.max + ')');
      if (s.effect && s.effect.second) bits.push('Hit or miss: DC ' + s.dc + ' ' + s.effect.second.save.toUpperCase() + ' save or ' + s.effect.second.dice + ' ' + s.effect.second.type + ' (5-ft burst)');
      else if (s.save && s.id === 'ensnaring-strike') bits.push('Restrained on a failed save (DC ' + s.dc + ' ' + s.save.toUpperCase() + ')');
      else if (s.save) bits.push((s.effect.type === 'healing' ? '' : 'Half damage on a success'));
      if (s.level === 0) bits.push('Cantrip · at will');
      else if (slot) bits.push(ordinal(s.level) + '-level slots (' + (slot.max - slot.used) + '/' + slot.max + ')');
      var m = /^(\d+)d(\d+)$/.exec((s.effect && s.effect.dice) || '');
      return {
        name: s.name, sub: (s.level === 0 ? 'Cantrip' : ordinal(s.level) + '-level spell') + (s.trigger ? ' · ' + s.trigger : ''), icon: s.id === 'ensnaring-strike' ? 'trap' : 'target',
        spellDef: s, range: rangeOf(s.range), hit: s.attack ? s.spellAttack : null,
        dc: s.save ? s.dc : null, dcAbility: s.save ? s.save.toUpperCase() : '',
        dice: m ? s.effect.dice : null, mod: s.effect && s.effect.addMod ? s.castMod : 0, flat: m ? null : '—', type: (s.effect && s.effect.type) || '', notes: bits.filter(Boolean).join(' · '),
        second: s.effect && s.effect.second ? { dice: s.effect.second.dice, type: s.effect.second.type } : null
      };
    };
    var actionSpells = spells.filter(function (s) { return s.time === 'Action' && s.effect && s.effect.dice && s.effect.type !== 'healing'; }).map(function (s, i) { return add('as' + i, spellAtk(s)); });
    var bonusSpells = spells.filter(function (s) { return s.time === 'Bonus Action' && s.effect && s.effect.dice && s.effect.type !== 'healing'; }).map(function (s, i) { return add('bs' + i, spellAtk(s)); });
    var reactSpells = spells.filter(function (s) { return s.time === 'Reaction' && s.effect && s.effect.dice; }).map(function (s, i) { return add('rs' + i, spellAtk(s)); });
    var opp = Object.assign({}, d.opportunity, { name: 'Opportunity Attack', sub: d.opportunity.name + (d.opportunity.mastery ? ' · Mastery' : ''), notes: 'When a creature you can see leaves your reach' });
    var sections = [
      { title: 'Actions', hint: '• Attacks per Action: ' + d.attacksPerAction, rows: weaponRows.concat(d.extraAttack ? [add('nick', d.extraAttack)] : [], d.breath ? [add('breath', d.breath)] : [], actionSpells) },
      { title: 'Bonus actions', hint: '', rows: bonusSpells.concat(d.mainClass && d.mainClass.def.martialArts ? [add('ma', Object.assign({}, d.attacks[d.attacks.length - 1], { sub: 'Martial Arts · after the Attack action' }))] : []) },
      { title: 'Reactions', hint: '', rows: [add('oa', opp)].concat(reactSpells) }
    ];
    return { keyed: keyed, sections: sections, weaponRows: weaponRows };
  }
  function ordinal(n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); }
  function rangeOf(txt) {
    var m = /^(\d+) ft/.exec(txt || '');
    return m ? { main: +m[1], label: 'Range' } : { main: txt || '—', label: '' };
  }

  function actionsTab(d, v) {
    var A = actionData(d);
    var subs = [['all', 'All'], ['attack', 'Attack'], ['action', 'Action'], ['bonus', 'Bonus Action'], ['reaction', 'Reaction'], ['other', 'Other']];
    var out = pills(subs, v.sub, 'sub', 'Action types');
    var show = function (id) { return v.sub === 'all' || v.sub === id; };
    var ALL = v.sub === 'all';
    // in "All", anything already in the Attack table isn't repeated further down
    var inTable = {};
    A.sections.forEach(function (sct) { sct.rows.forEach(function (r) { inTable[r.a.name] = true; }); });
    if (d.mainClass && d.mainClass.def.martialArts) inTable['Martial Arts'] = true;
    var notListed = function (name) { return !ALL || !inTable[name]; };
    var group = function (title, hint, inner) { return '<div style="display:flex;flex-direction:column;gap:4px"><div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;padding-bottom:4px"><h3 class="grp-title">' + h(title) + '</h3><span class="muted2" style="font-size:12px">' + h(hint) + '</span></div>' + inner + '</div>'; };

    if (show('attack')) out += group('Attack', 'Every attack, grouped by what it costs', atkTable(A.sections));
    if (show('action')) {
      var chips = '<div style="display:flex;flex-direction:column;gap:8px;padding-top:12px"><span class="h-sec" style="font-size:12px">Actions in combat</span><div class="pills">' +
        R.COMBAT_ACTIONS.map(function (c) {
          return '<button type="button" class="pill" aria-pressed="' + (v.actHover === c.name) + '" data-hover="act" data-act="act-show" data-arg="' + h(c.name) + '" aria-controls="act-detail">' + h(c.name) + '</button>';
        }).join('') + '</div>';
      var sel = R.COMBAT_ACTIONS.find(function (c) { return c.name === v.actHover; });
      chips += '<div class="detail" id="act-detail" aria-live="polite">' + (sel ?
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px"><b>' + h(sel.name) + '</b><span class="grow"></span>' +
        (sel.rolls || []).map(function (sk) { var s = R.skill(sk), b = d.skillBonus(sk); return act('mini-roll rollable', 'roll', 'skill:' + sk, 'Roll ' + s.name + ' ' + sg(b), h(s.name) + ' ' + sg(b)); }).join('') +
        '</div><span style="font-size:13px;color:var(--body2);line-height:1.5">' + h(sel.name === 'Dash' ? 'Gain extra movement equal to your Speed (' + d.speed + ' ft) for this turn.' : sel.text) + '</span>'
        : '<span class="muted2" style="font-size:13px">Hover or tap an action to see what it does.</span>') + '</div></div>';
      var terms = [];
      var seen = {};
      d.attacks.forEach(function (a) {
        if (a.mastery && R.MASTERY[a.masteryId] && !seen[a.masteryId]) { seen[a.masteryId] = 1; terms.push([R.MASTERY[a.masteryId].name + ' (' + a.name + ' mastery)', R.MASTERY[a.masteryId].text + (a.masteryId === 'nick' && d.extraAttack ? '\nFor ' + d.name.split(' ')[0] + ': ' + d.extraAttack.notes.split(' · ')[0].replace('After attacking', 'attack') + ', then make the extra attack with the ' + a.name + '.' : '')]); }
      });
      var dc = 8 + d.mods.str + d.pb;
      terms.push(['Unarmed Strike', 'Choose one option each time:\nDamage: 1 + STR modifier bludgeoning (' + Math.max(1, 1 + d.mods.str) + ').\nGrapple: a creature no more than one size larger, within reach, makes a DC ' + dc + ' STR or DEX save or is Grappled. You need a free hand.\nShove: same save (DC ' + dc + ' STR or DEX), or you push it 5 ft away or knock it Prone.']);
      out += group('Action', 'Takes your action on your turn',
        (ALL ? '' : atkTable([{ title: 'Attack action', hint: '• Attacks per Action: ' + d.attacksPerAction, rows: A.weaponRows }])) + chips.replace('padding-top:12px', ALL ? 'padding-top:0' : 'padding-top:12px') +
        '<div class="explain"><span class="h-sec" style="font-size:12px">Rules explained</span>' + terms.map(function (t) { return '<div><div class="k">' + h(t[0]) + '</div><div class="v">' + h(t[1]) + '</div></div>'; }).join('') + '</div>');
    }
    if (show('bonus')) {
      var items = (d.spell ? d.spell.spells : []).filter(function (s) { return s.time === 'Bonus Action' && notListed(s.name); }).map(function (s) { return spellItem(d, s); });
      if (d.twoWeapon) {
        var tw = d.twoWeapon.attack;
        items.push(itemCard('Two-Weapon Fighting', 'Actions in combat', 'When you take the Attack action and attack with a Light weapon, you can make one extra attack with a different Light weapon as a Bonus Action. Don’t add your ability modifier to its damage unless it’s negative.\nIf you make the extra attack with a weapon that has the Nick mastery, it is part of the Attack action instead, so your Bonus Action stays free.',
          act('mini-roll rollable', 'roll', 'raw:' + tw.name + ' extra attack|1|20|' + tw.hit, 'Roll ' + tw.name + ' extra attack', h(tw.name) + ' ' + sg(tw.hit)) +
          act('mini-roll rollable', 'roll', 'raw:' + tw.name + ' extra damage|' + tw.dice.replace('d', '|') + '|' + tw.mod, 'Roll ' + tw.name + ' extra damage', h(tw.dice) + ' ' + h(tw.type)), ''));
      }
      items = featureItems(d, 'Bonus Action', notListed).concat(items);
      out += group('Bonus Action', 'One per turn', items.join('') || '<span class="muted2">No bonus actions.</span>');
    }
    if (show('reaction')) {
      var o = d.opportunity;
      var oaRolls = act('mini-roll rollable', 'roll', 'hit:oa', 'Roll Opportunity Attack', h(o.name) + ' ' + sg(o.hit)) + (o.dice ? act('mini-roll rollable', 'roll', 'dmg:oa', 'Roll Opportunity Attack damage', h(o.dice + (o.mod ? ' ' + sg(o.mod).replace('+', '+ ') : '')) + ' ' + h(o.type)) : '');
      out += group('Reaction', 'One per round, when its trigger happens',
        (ALL ? '' : itemCard('Opportunity Attack', 'Actions in combat', 'When a creature you can see leaves your reach, make one melee attack against it with a weapon or an Unarmed Strike. Creatures that took the Disengage action, or that move without using their own movement (teleported or pushed), don’t provoke it.', oaRolls, '')) +
        featureItems(d, 'Reaction', notListed).join('') +
        (d.spell ? d.spell.spells.filter(function (s) { return s.time === 'Reaction' && notListed(s.name); }).map(function (s) { return spellItem(d, s); }).join('') : '') +
        itemCard('Readied action', 'From the Ready action', 'If you took the Ready action, use your Reaction when the trigger happens to take the action you prepared. A readied spell uses its slot when you cast it and needs Concentration until you release it.', '', ''));
    }
    if (show('other')) {
      out += group('Other', 'Free or passive',
        d.features.filter(function (f) { return /origin feat/.test(f.from); }).map(function (f) { return itemCard(f.name, f.from, f.text, '', ''); }).join('') +
        featureItems(d, 'Other').join('') +
        itemCard('Interact with an object', 'Free, once per turn', 'During your move or action you can handle one object for free: draw or stow a weapon, open a door, pick up a dropped item.', '', ''));
    }
    return out;
  }

  function featureItems(d, time, keep) {
    var out = [];
    d.featureActions.forEach(function (f, i) {
      if (f.time !== time || (keep && !keep(f.name))) return;
      var res = f.resource && d.resources.find(function (r) { return r.id === f.resource; });
      var pips = res ? (res.max > 10 ? '<div class="pipset"><span class="k">' + h(res.name) + '</span><span style="font-size:14px;font-weight:600">' + (res.max - res.used) + ' / ' + res.max + '</span>' +
          (P ? '<button class="small-out" data-act="pool" data-arg="' + h(res.id) + ':1" aria-label="Spend 1">−1</button><button class="small-out" data-act="pool" data-arg="' + h(res.id) + ':5" aria-label="Spend 5">−5</button><button class="small-out" data-act="pool" data-arg="' + h(res.id) + ':-99" aria-label="Refill">Refill</button>' : '') + '</div>'
        : pipRow(res.name + (res.shortRest ? ' (1 back on a short rest)' : ''), 'res', res.id, res.max, res.used)) : '';
      var rolls = (f.rolls || []).map(function (r, j) {
        var label = r[1] === 'unarmed' ? 'Unarmed Strike ' + sg(d.attacks[d.attacks.length - 1].hit)
          : r[0].replace(/ \+ level/, ' +' + (f.classLevel || d.classLevel)).replace(/ \+ (STR|DEX|CON|INT|WIS|CHA)/, function (m, a) { return ' ' + sg(d.mods[a.toLowerCase()]); });
        return act('mini-roll rollable', 'roll', 'feat:' + i + '|' + j, 'Roll ' + label, h(label));
      }).join('');
      out.push(itemCard(f.name, f.from, f.text, rolls, pips));
    });
    return out;
  }

  function itemCard(name, tag, text, rolls, pipsHtml, conc) {
    return '<div class="item"><div class="hd"><span style="display:inline-flex;align-items:center;gap:8px"><span class="nm">' + h(name) + '</span>' + (conc || '') + '</span><span class="tag">' + h(tag) + '</span><span class="grow"></span>' + (rolls || '') + '</div>' +
      (pipsHtml || '') + '<span class="tx">' + h(text) + '</span></div>';
  }

  function pipRow(label, kind, id, max, used) {
    var out = '<div class="pipset"><span class="k">' + h(label) + '</span><span style="display:flex;gap:6px">';
    for (var i = 0; i < max; i++) {
      var on = i < max - used;
      out += P ? '<button type="button" class="pip teal' + (on ? ' on' : '') + '" data-act="pip" data-arg="' + kind + ':' + id + ':' + i + '" aria-label="' + h(label) + ' ' + (i + 1) + (on ? ', available' : ', spent') + '" aria-pressed="' + on + '"></button>'
        : '<span class="pip teal' + (on ? ' on' : '') + '"></span>';
    }
    return out + '</span></div>';
  }

  function slotName(x, sp) { return ordinal(x.level) + '-level ' + (x.pact && sp && !sp.pact ? 'Pact slots' : 'slots'); }
  function spellItem(d, s) {
    var res = d.resources.find(function (r) { return r.spell === s.id; });
    var slot = d.spell.slots.find(function (x) { return x.level === s.level; });
    var pipsHtml = (res ? pipRow('Free casts (long rest)', 'res', res.id, res.max, res.used) : '') + (slot && s.level > 0 ? pipRow(slotName(slot, d.spell), 'slot', slot.key, slot.max, slot.used) : '');
    var m = /^(\d+)d(\d+)$/.exec((s.effect && s.effect.dice) || '');
    var rolls = (m && s.effect.second ? act('mini-roll rollable', 'roll', 'spell2:' + s.id, 'Roll ' + s.name + ' ' + s.effect.second.type, h(s.effect.second.dice + ' ' + s.effect.second.type)) : '') + (m ? act('mini-roll rollable', 'roll', 'spell:' + s.id, 'Roll ' + s.name, (s.effect.addMod ? h(s.effect.dice) + ' ' + sg(s.castMod) : (s.id === 'hunters-mark' ? '+' : '') + h(s.effect.dice)) + ' ' + h(s.effect.type || '')) : '');
    var text = s.text.replace(/against your spell save DC/g, '(DC ' + s.dc + ')').replace('DC (DC', '(DC');
    if (s.save) text = text.replace(/makes? an? ([A-Z]{3}) save/, function (all, ab) { return all.replace(ab + ' save', 'DC ' + s.dc + ' ' + ab + ' save'); });
    return itemCard(s.name, (s.level ? ordinal(s.level) + '-level spell' : 'Cantrip') + ' · ' + s.origin, text, rolls, pipsHtml + castControls(d, s), concBadge(s));
  }

  /** Dice for a spell cast with a higher-level slot, e.g. Cure Wounds (2d8, +2d8 per level) at 3rd → 6d8. */
  function upcastDice(s, slotLevel, part) {
    var eff = part === 'second' ? s.effect && s.effect.second : s.effect;
    var base = /^(\d+)d(\d+)$/.exec((eff && eff.dice) || ''), up = s.upcast && /^(\d+)d(\d+)$/.exec(s.upcast.dice);
    if (!base) return null;
    var extra = Math.max(0, (slotLevel || s.level) - s.level);
    if (!up || !extra || up[2] !== base[2] || (s.upcast.part || 'main') !== (part || 'main')) return base[0];
    return (+base[1] + extra * +up[1]) + 'd' + base[2];
  }
  /** The window that asks which slot level to cast a spell with, before rolling from the Actions tab. */
  function castAsk(d) {
    var ask = app.view.castAsk; if (!ask || !d.spell) return '';
    var s = d.spell.spells.find(function (x) { return x.id === ask.id; }); if (!s) return '';
    var res = d.resources.find(function (r) { return r.spell === s.id; });
    var upPart = (s.upcast && s.upcast.part) || 'main';
    var base = upPart === 'second' ? s.effect && s.effect.second && s.effect.second.dice : s.effect && s.effect.dice;
    var opts = d.spell.slots.filter(function (x) { return x.level >= s.level; }).map(function (x) {
      var left = x.max - x.used, dice = upcastDice(s, x.level, upPart);
      return '<button type="button" class="opt" data-act="cast-pick" data-arg="' + x.level + '"' + (left ? '' : ' disabled') + '><span class="t"><span class="nm" style="font-size:16px">' + ordinal(x.level) + ' level</span><span class="tag">' + left + ' of ' + x.max + ' left</span></span>' +
        '<span class="p">' + (dice ? h(dice + (upPart === 'second' ? ' ' + s.effect.second.type : ' ' + (s.effect.type || ''))) + (dice !== base ? ' (upcast)' : '') : 'Same effect') + '</span></button>';
    });
    if (res) opts.unshift('<button type="button" class="opt" data-act="cast-pick" data-arg="free"' + (res.max - res.used ? '' : ' disabled') + '><span class="t"><span class="nm" style="font-size:16px">Free cast</span><span class="tag">' + (res.max - res.used) + ' left</span></span><span class="p">No spell slot needed</span></button>');
    return '<div role="dialog" aria-modal="true" aria-labelledby="ca-t" class="overlay"><div class="card settings" style="width:min(520px,100%)">' +
      '<div style="display:flex;align-items:center;gap:8px"><h2 id="ca-t" style="margin:0;font-size:20px;flex:1">Cast ' + h(s.name) + '</h2><button class="btn btn-ghost btn-sm" data-act="cast-cancel">Cancel</button></div>' +
      '<p class="muted" style="margin:0;font-size:13px">Which spell slot do you use? ' + (s.higher ? h(s.higher) : 'Casting it with a higher slot has no extra effect.') + '</p>' +
      (opts.length ? '<div class="crit-opts">' + opts.join('') + '</div>' : '<div class="notice">You have no spell slots that can cast this spell.</div>') +
      '<button type="button" class="link-btn" style="align-self:flex-start;font-size:13px;padding:0" data-act="cast-pick" data-arg="none">Just roll, without spending a slot</button></div></div>';
  }
  /** Play mode: buttons to cast a leveled spell with any slot it can use, or with a free cast. */
  function castControls(d, s) {
    if (!P || !s.level || !d.spell) return '';
    var res = d.resources.find(function (r) { return r.spell === s.id; });
    var btns = d.spell.slots.filter(function (x) { return x.level >= s.level; }).map(function (x) {
      var upPart = (s.upcast && s.upcast.part) || 'main', left = x.max - x.used, dice = upcastDice(s, x.level, upPart);
      return '<button type="button" class="small-out" data-act="cast" data-arg="' + h(s.id + '|' + x.key) + '"' + (left ? '' : ' disabled') + ' title="' + h(left + ' of ' + x.max + ' ' + (x.pact && !d.spell.pact ? 'Pact slots ' : '') + 'left' + (dice ? ' · ' + dice : '')) + '">' + ordinal(x.level) + (x.pact && !d.spell.pact ? ' Pact' : '') + (dice && x.level > s.level && dice !== (upPart === 'second' ? s.effect.second.dice : s.effect.dice) ? ' <small>' + h(dice) + '</small>' : '') + '</button>';
    });
    if (res) btns.unshift('<button type="button" class="small-out" data-act="cast" data-arg="' + h(s.id + '|free') + '"' + (res.max - res.used ? '' : ' disabled') + '>Free cast (' + (res.max - res.used) + ')</button>');
    if (!btns.length) return '';
    return '<div class="cast-row"><span class="k">Cast</span>' + btns.join('') + '</div>';
  }

  /* ---------- spells tab ---------- */
  function spellsTab(d, v) {
    if (!d.spell || !d.spell.spells.length) return '<div class="empty">This character doesn’t cast spells.</div>';
    var sp = d.spell;
    var levels = [];
    sp.spells.forEach(function (s) { if (levels.indexOf(s.level) < 0) levels.push(s.level); });
    var subs = [['all', 'All']].concat(levels.map(function (l) { return [String(l), l === 0 ? 'Cantrips' : ordinal(l), l === 0 ? 'Cantrips' : ordinal(l) + '-level spells']; }));
    if (sp.spells.some(function (s) { return s.concentration; })) subs.push(['conc', '<span class="conc"><i aria-hidden="true"></i></span>', 'Concentration spells']);
    var groups;
    if (v.spellSub === 'conc') groups = [{ title: 'Concentration', hint: 'Only one at a time', list: sp.spells.filter(function (s) { return s.concentration; }) }];
    else groups = levels.filter(function (l) { return v.spellSub === 'all' || String(l) === v.spellSub; }).map(function (l) {
      var slot = sp.slots.find(function (x) { return x.level === l; });
      return { title: l === 0 ? 'Cantrips' : ordinal(l) + ' level', hint: l === 0 ? 'At will, no slot needed' : slot ? slot.max + ' slots' : '', list: sp.spells.filter(function (s) { return s.level === l; }) };
    });

    var out = sp.casters && sp.casters.length > 1 ? '<div class="spell-stats">' + sp.casters.map(function (c, ci) {
      return '<div><span class="v">' + h(c.abbr) + '</span><span class="k">' + h(c.name) + '</span></div>' +
        act('rollable mark', 'roll', 'spellatk:' + ci, 'Roll ' + c.name + ' spell attack, ' + sg(c.attack), '<span class="v">' + sg(c.attack) + '</span><span class="k">' + h(c.name) + ' attack</span>') +
        '<div><span class="v">' + c.dc + '</span><span class="k">' + h(c.name) + ' save DC</span></div>';
    }).join('') + '</div>' : '<div class="spell-stats">' +
      '<div><span class="v">' + sp.abbr + '</span><span class="k">Spellcasting ability</span></div>' +
      '<div><span class="v">' + sg(sp.mod) + '</span><span class="k">Modifier</span></div>' +
      act('rollable mark', 'roll', 'spellatk', 'Roll spell attack, ' + sg(sp.attack), '<span class="v">' + sg(sp.attack) + '</span><span class="k">Spell attack</span>') +
      '<div><span class="v">' + sp.dc + '</span><span class="k">Save DC</span></div></div>';
    if (sp.slots.length || d.resources.some(function (r) { return r.spell; })) out += '<div class="res-strip">' + sp.slots.map(function (s) { return '<div class="r"><span><b>' + slotName(s, sp) + '</b><small>' + (s.max - s.used) + ' of ' + s.max + ' left' + (s.pact && !sp.pact ? ' · back on a Short Rest' : '') + '</small></span>' + pipRow('', 'slot', s.key, s.max, s.used).replace('<span class="k"></span>', '') + '</div>'; }).join('') +
      d.resources.filter(function (r) { return r.spell; }).map(function (r) { return '<div class="r"><span><b>' + h(r.name) + '</b><small>Recharges on a ' + (r.recharge === 'long' ? 'long' : 'short') + ' rest</small></span>' + pipRow('', 'res', r.id, r.max, r.used).replace('<span class="k"></span>', '') + '</div>'; }).join('') + '</div>';
    if (sp.pact) out += '<span class="muted2" style="font-size:12px;margin-top:-6px">Pact Magic: your spell slots come back on a Short or Long Rest.</span>';
    else if (sp.hasPact) out += '<span class="muted2" style="font-size:12px;margin-top:-6px">Multiclass: your Pact Magic slots come back on a Short Rest, the others on a Long Rest. Any of your spells can use either kind.</span>';
    out += '<div style="display:flex;align-items:center;gap:8px;font-size:12px" class="muted"><span class="conc"><i aria-hidden="true"></i></span>Needs concentration: only one at a time, and taking damage can break it (DC 10 CON save, or half the damage if higher)</div>';
    out += '<span class="muted2" style="font-size:12px;margin-top:-6px">Hover or tap a spell to read its full description.</span>';
    out += pills(subs, v.spellSub, 'spell-sub', 'Spell levels');
    out += groups.map(function (g) {
      return '<div style="display:flex;flex-direction:column"><div style="display:flex;align-items:baseline;gap:10px;padding-bottom:4px"><h3 class="grp-title">' + h(g.title) + '</h3><span class="muted2" style="font-size:12px">' + h(g.hint) + '</span></div>' +
        '<div class="sp-grid" style="font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted2);padding:4px"><span>Name</span><span>Range</span><span>Hit / DC</span><span>Effect</span></div>' +
        g.list.map(function (s) { return spellRow(d, s, v); }).join('') + '</div>';
    }).join('');
    return out;
  }

  function spellRow(d, s, v) {
    var open = v.spellOpen === s.id;
    var m = /^(\d+)d(\d+)$/.exec((s.effect && s.effect.dice) || '');
    var effectTxt = s.effect ? (s.effect.text || (s.effect.dice + (s.effect.addMod ? ' + ' + s.castMod : '') + ' ' + (s.effect.type || ''))) : '';
    var effect = m ? act('dmgbox rollable', 'roll', 'spell:' + s.id, 'Roll ' + s.name, '<span style="font-size:13px;white-space:normal">' + h(s.effect.addMod ? s.effect.dice + ' + ' + s.castMod + ' ' + s.effect.type : effectTxt) + '</span>', { style: 'height:auto;min-height:34px;padding:4px 10px' })
      : '<span style="font-size:13px">' + h(effectTxt) + '</span>';
    if (m && s.effect.second) effect = '<span style="display:flex;flex-direction:column;gap:4px;align-items:flex-start">' + effect + act('dmgbox rollable', 'roll', 'spell2:' + s.id, 'Roll ' + s.name + ' ' + s.effect.second.type, '<span style="font-size:13px">' + h(s.effect.second.dice + ' ' + s.effect.second.type + ' (save)') + '</span>', { style: 'height:auto;min-height:30px;padding:4px 10px' }) + '</span>';
    return '<div class="sp-row' + (open ? ' open' : '') + '" data-hover="spell" data-arg="' + h(s.id) + '">' +
      '<div class="sp-grid"><span style="display:flex;flex-direction:column;gap:1px">' +
        '<button type="button" class="sp-name" data-act="spell-open" data-arg="' + h(s.id) + '" aria-expanded="' + open + '">' + h(s.name) + concBadge(s) + '</button>' +
        '<span style="font-size:12px;color:var(--muted2)">' + h(s.school + ' · ' + s.time + (s.ritual ? ' or Ritual' : '') + ' · ' + (s.componentsShort || s.components)) + '</span>' +
        '<span style="font-size:12px;color:var(--muted)">' + h(s.origin) + '</span></span>' +
      '<span style="font-size:13px">' + h(s.range) + '</span>' +
      '<span style="font-size:13px;color:var(--muted)">' + [s.attack ? sg(s.spellAttack) + ' to hit' : '', s.save ? 'DC ' + s.dc + ' ' + s.save.toUpperCase() : ''].filter(Boolean).join('<br>') + (s.attack || s.save ? '' : '—') + '</span>' +
      '<span>' + effect + '</span></div>' +
      (open ? '<div class="sp-desc">' + castControls(d, s) + '<p class="muted2" style="font-size:12px">' + h([s.level ? ordinal(s.level) + ' level' : 'Cantrip', s.range, s.components, s.duration].join(' · ')) + '</p>' + paras(s.text.replace(/against your spell save DC/g, '(DC ' + s.dc + ')').replace(/your spellcasting ability modifier/, 'your spellcasting ability modifier (' + sg(s.castMod) + ')')) + '</div>' : '') + '</div>';
  }

  /* ---------- inventory ---------- */
  /** Search every item the character can use (SRD and switched-on modules) and add one. */
  function addItemPicker(ch, v) {
    var q = (v.addQuery || '').trim().toLowerCase();
    var all = CF.content.all('items', CF.content.on(ch)).filter(function (i) { return !q || (i.name + ' ' + (i.kind || '') + ' ' + (i.sub || '') + ' ' + (i.category || '') + ' ' + (i.armor || '')).toLowerCase().indexOf(q) >= 0; })
      .sort(function (a, b) { return (a.source === 'srd-5.2') - (b.source === 'srd-5.2') || a.name.localeCompare(b.name); });
    var shown = all.slice(0, 40);
    return '<div class="add-pick" role="region" aria-label="Add an item"><div style="display:flex;gap:8px;align-items:center">' +
      '<label class="search" style="flex:1"><input type="search" value="' + h(v.addQuery || '') + '" placeholder="Find an item to add (e.g. rope, longsword)" aria-label="Find an item to add" data-act="add-q" data-key="add-q"></label>' +
      '<button class="btn btn-sm" data-act="add-close">Close</button></div>' +
      '<div class="add-list">' + shown.map(function (i) {
        var kind = i.kind === 'weapon' ? cap1(i.category || '') + ' weapon · ' + (i.damage || '') + ' ' + (i.type || '') : i.kind === 'armor' ? (i.armor === 'shield' ? 'Shield +' + i.ac : cap1(i.armor) + ' armor · AC ' + i.ac) : cap1(i.sub || i.kind || 'gear');
        return '<button type="button" data-act="add-item" data-arg="' + h(i.id) + '"><b>' + h(i.name) + '</b><small>' + h(kind) + ' · ' + fmtW(i.w || 0) + ' · ' + fmtC(i.c || 0) + (i.source !== 'srd-5.2' ? ' · ' + h(i.sourceName) : '') + '</small></button>';
      }).join('') + '</div>' + (all.length > shown.length ? '<span class="muted2" style="font-size:12px">' + (all.length - shown.length) + ' more: type to narrow it down.</span>' : !all.length ? '<span class="muted2" style="font-size:13px">Nothing matches. Items from your own modules show up here too.</span>' : '') + '</div>';
  }
  function cap1(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function inventoryTab(ch, d, v) {
    var unit = settings().unit;
    var over = d.totalLb > d.capacity;
    var cur = d.currency;
    var q = (v.invQuery || '').trim().toLowerCase();
    var GROUPS = [['equipment', 'Equipment'], ['quiver', 'Quiver'], ['backpack', 'Backpack'], ['attunement', 'Attunement'], ['other', 'Other possessions']];
    var out = '<div class="inv-head"><div style="display:flex;flex-direction:column;gap:2px">' +
      '<span style="font-size:15px;font-weight:700;text-transform:uppercase">Weight carried: ' + fmtW(d.totalLb) + '</span>' +
      '<span style="font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:' + (over ? 'var(--danger)' : 'var(--muted2)') + '">' + (over ? 'Over capacity · speed 5 ft' : 'Unencumbered') + '</span>' +
      '<span class="muted2" style="font-size:12px">Capacity ' + fmtW(d.capacity) + ' · push, drag or lift ' + fmtW(d.capacity * 2) + '</span></div>' +
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px"><div class="unit-switch" role="group" aria-label="Weight unit">' +
        ['lb', 'kg'].map(function (u) { return '<button type="button" aria-pressed="' + (unit === u) + '" data-act="unit" data-arg="' + u + '">' + u + '</button>'; }).join('') + '</div>' +
      '<span style="display:flex;align-items:center;gap:6px;font-size:20px;font-weight:700">' + (cur.gp || 0) + '<svg role="img" aria-label="gold pieces" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="1.8"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/></svg></span></div></div>';
    out += '<div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px" class="muted">' + ['pp', 'gp', 'ep', 'sp', 'cp'].map(function (k) {
      return P ? '<label style="display:inline-flex;align-items:center;gap:4px"><input type="number" min="0" value="' + (cur[k] || 0) + '" data-act="coin" data-arg="' + k + '" data-key="coin-' + k + '" style="width:64px;min-height:28px;border-radius:6px;border:1px solid var(--line2);background:var(--surface);padding:0 6px"> ' + k.toUpperCase() + '</label>'
        : '<span><b style="color:var(--ink)">' + (cur[k] || 0) + '</b> ' + k.toUpperCase() + '</span>';
    }).join('') + '</div>';
    out += '<div style="display:flex;gap:8px;align-items:center"><label class="search"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<input type="search" value="' + h(v.invQuery) + '" placeholder="Search items, types or tags" aria-label="Search inventory" data-act="inv-q" data-key="inv-q"></label>' +
      (P ? '<button class="btn btn-sm btn-teal" data-act="add-open" style="white-space:nowrap">+ Add item</button>' : '') + '</div>' + (P && v.adding ? addItemPicker(ch, v) : '');
    out += '<div class="pills inv-tabs" role="tablist" aria-label="Inventory sections">' + [['all', 'All']].concat(GROUPS).map(function (g) {
      return '<button type="button" role="tab" aria-selected="' + (v.invFilter === g[0]) + '" data-act="inv-filter" data-arg="' + g[0] + '">' + h(g[1]) + '</button>';
    }).join('') + '</div>';
    out += '<div class="inv-th"><span>Active</span><span>Name</span><span>Weight</span><span>Qty</span><span>Cost</span><span>Notes</span></div>';
    GROUPS.filter(function (g) { return v.invFilter === 'all' ? g[0] !== 'attunement' : v.invFilter === g[0]; }).forEach(function (g) {
      var all = d.inventory.filter(function (e) { return (e.container || 'equipment') === g[0]; });
      var rows = all.filter(function (e) { return !q || (e.def.name + ' ' + (e.def.sub || '') + ' ' + (e.def.kind || '')).toLowerCase().indexOf(q) >= 0; });
      if (q && !rows.length && v.invFilter === 'all') return;
      var open = !v.collapsed[g[0]];
      out += '<div><div class="inv-grp"><span></span><span>' + h(g[1].toUpperCase()) + ' <span class="muted2" style="font-weight:500">(' + all.length + ')</span></span><span>' + fmtW(all.reduce(function (a, e) { return a + (e.def.w || 0) * (e.qty || 1); }, 0)) + '</span><span></span><span></span>' +
        '<span style="text-align:right"><button class="link-btn" data-act="inv-collapse" data-arg="' + g[0] + '" aria-expanded="' + open + '">' + (open ? 'Hide contents' : 'Show contents') + '</button></span></div>';
      if (open) {
        out += rows.map(function (e) { return invRow(e); }).join('');
        if (!rows.length) out += '<div class="muted2" style="padding:12px 0;font-size:13px">' + (g[0] === 'attunement' ? 'No attuned magic items (0/3 slots used).' : q ? 'No items match your search.' : 'Nothing here yet.') + '</div>';
      }
      out += '</div>';
    });
    return out;
  }
  function invRow(e) {
    var dd = e.def, equippable = dd.kind === 'weapon' || dd.kind === 'armor';
    var sub = dd.kind === 'weapon' ? (dd.category === 'martial' ? 'Martial' : 'Simple') + ' weapon' : dd.kind === 'armor' ? (dd.armor === 'shield' ? 'Shield' : dd.armor.charAt(0).toUpperCase() + dd.armor.slice(1) + ' armor') : dd.kind === 'container' ? 'Container' : 'Gear' + (dd.sub ? ' · ' + dd.sub : '');
    var notes = dd.kind === 'weapon' ? (dd.props || []).map(function (p) { return R.PROPERTY_NAMES[p] || p; }).concat(dd.mastery ? [R.MASTERY[dd.mastery] ? R.MASTERY[dd.mastery].name : dd.mastery] : []).concat(dd.range ? ['Range (' + dd.range.join('/') + ')'] : []).join(', ')
      : dd.kind === 'armor' ? (dd.armor === 'shield' ? '+2 AC' : 'AC ' + dd.ac + (dd.armor === 'light' ? ' + DEX modifier' : dd.armor === 'medium' ? ' + DEX (max 2)' : ''))
      : dd.holds || dd.notes || '';
    var removeLink = P ? ' <button class="link-btn" style="font-size:12px;padding:0 0 0 6px" data-act="inv-remove" data-arg="' + h(e.uid) + '">Remove</button>' : '';
    var unpack = dd.contents ? ' <button class="small-out" data-act="unpack" data-arg="' + h(e.uid) + '">Unpack</button>' : '';
    if (dd.heal && P) unpack += ' <button class="small-out" data-act="inv-drink" data-arg="' + h(e.uid) + '" title="Bonus Action: drink it and regain ' + h(dd.heal) + ' HP">Drink (' + h(dd.heal.replace('+', ' + ')) + ')</button>';
    var eq = !equippable ? '<span class="muted2">--</span>' : P
      ? '<button type="button" class="eq' + (e.equipped ? ' on' : '') + '" data-act="equip" data-arg="' + h(e.uid) + '" aria-pressed="' + !!e.equipped + '" aria-label="' + (e.equipped ? 'Unequip ' : 'Equip ') + h(dd.name) + '"></button>'
      : '<span class="eq' + (e.equipped ? ' on' : '') + '" role="img" aria-label="' + (e.equipped ? 'Equipped' : 'Not equipped') + '"></span>';
    var qty = (dd.stack && P ? '<button type="button" data-act="qty" data-arg="' + h(e.uid) + ':-1" aria-label="One less ' + h(dd.name) + '">−</button>' : '') +
      '<span style="min-width:20px;text-align:center">' + (dd.stack || e.qty > 1 ? e.qty : '--') + '</span>' +
      (dd.stack && P ? '<button type="button" data-act="qty" data-arg="' + h(e.uid) + ':1" aria-label="One more ' + h(dd.name) + '">+</button>' : '');
    return '<div class="inv-row"><span style="display:flex;justify-content:center">' + eq + '</span>' +
      '<span style="display:flex;flex-direction:column;min-width:0"><span style="font-size:15px;line-height:1.25">' + h(dd.name) + '</span><span class="muted2" style="font-size:12px">' + h(sub) + '</span></span>' +
      '<span style="white-space:nowrap">' + fmtW((dd.w || 0) * (e.qty || 1)) + '</span><span class="qty">' + qty + '</span>' +
      '<span style="font-size:13px;white-space:nowrap">' + fmtC((dd.c || 0) * (e.qty || 1)) + '</span><span class="muted" style="font-size:12px;line-height:1.4">' + h(notes) + unpack + removeLink + '</span></div>';
  }

  /* ---------- other tabs ---------- */
  var FEAT_SUBS = [['all', 'All'], ['class', 'Class Features'], ['species', 'Species Traits'], ['feat', 'Feats']];
  function featuresTab(d, v) {
    var sub = v.featSub || 'all';
    var count = function (k) { return d.features.filter(function (f) { return k === 'all' || f.kind === k; }).length; };
    var list = d.features.filter(function (f) { return sub === 'all' || f.kind === sub; });
    var empty = { 'class': 'No class features yet.', species: 'No species chosen yet.', feat: 'No feats yet. You gain feats from your background, some species, and at certain class levels.' }[sub];
    return pills(FEAT_SUBS.map(function (p) { return [p[0], p[1] + ' <small>' + count(p[0]) + '</small>', p[1] + ', ' + count(p[0])]; }), sub, 'feat-sub', 'Feature types') +
      (list.length ? '' : '<div class="empty">' + h(empty || 'Nothing here yet.') + '</div>') +
      list.map(function (f) {
      return '<div style="display:flex;flex-direction:column;gap:3px;padding-bottom:10px;border-bottom:1px solid var(--soft)"><span style="display:flex;flex-wrap:wrap;align-items:center;gap:8px"><b style="font-size:15px">' + h(f.name) + '</b><span class="tag">' + h(f.from) + (f.source ? ' · ' + h(f.source.replace('System Reference Document ', 'SRD ')) : '') + '</span></span><div style="font-size:14px;color:var(--body2);line-height:1.45">' + CF.util.rich(f.text) + '</div></div>';
    }).join('');
  }

  /** Alignment, gender, eyes… a grid like a printed sheet. Size comes from the species; the rest is written by the player. */
  function characteristics(ch, d) {
    var det = ch.details || {}, edit = !!app.view.charEdit;
    var cells = R.CHAR_FIELDS.map(function (f) {
      var k = f[0], val = k === 'size' ? d.size : det[k];
      var input = k === 'size' ? '<span class="cv">' + h(d.size) + '</span>'
        : k === 'alignment' ? '<select data-act="char-detail" data-arg="alignment" aria-label="Alignment"><option value="">—</option>' + R.ALIGNMENTS.map(function (x) { return '<option' + (det.alignment === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>'
        : '<input type="text" data-act="char-detail" data-arg="' + k + '" data-key="char-' + k + '" value="' + h(det[k] || '') + '" placeholder="' + h(f[2] || '') + '" aria-label="' + h(f[1]) + '" autocomplete="off">';
      return '<div class="char-cell"><span class="ck">' + h(f[1]) + '</span>' + (edit ? input : '<span class="cv">' + (val ? h(val) : '<span class="muted2">—</span>') + '</span>') + '</div>';
    }).join('');
    return '<div style="display:flex;flex-direction:column;gap:10px"><span style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>Characteristics</b>' +
      '<button type="button" class="small-out" data-act="char-edit" aria-pressed="' + edit + '">' + (edit ? 'Done' : 'Edit') + '</button></span>' +
      '<div class="char-grid">' + cells + '</div></div>';
  }

  function backgroundTab(d) {
    var bg = d.background, pick = d.backgroundPick || {};
    if (!bg) return '<div class="empty">No background chosen yet.</div>';
    var name = function (a) { var x = R.ABILITIES.find(function (y) { return y.id === a; }); return x ? x.name : a; };
    var asi = Object.keys(pick.asi || {}).sort(function (a, b) { return pick.asi[b] - pick.asi[a]; });
    var two = asi.length === 2;
    var old = R.isOld(cur()), feature = R.backgroundFeature(cur(), bg, CF.content.on(cur()));
    var feat = !old && (bg.feat || (cur().background && cur().background.feat)) ? CF.content.get('feats', bg.feat || cur().background.feat) : null;
    var tool = pick.tool ? CF.content.get('items', pick.tool) : null;
    return '<div class="sec-head"><span class="h-red">Background</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><h3 class="serif" style="margin:0;font-size:26px;font-weight:600">' + h(bg.name) + '</h3><p style="margin:0;font-size:14px;line-height:1.6;color:var(--body2)">' + h(bg.description) + '</p></div>' +
      '<p style="margin:0;font-size:14px"><strong>Skill Proficiencies:</strong> ' + R.bgSkills(cur(), bg).map(function (s) { return R.skill(s).name; }).join(' and ') + '</p>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><b>' + (old ? 'Ability Score Increases <span class="muted2" style="font-weight:400;font-size:13px">(from your species, 5e rules)</span>' : 'Ability Score Improvements') + '</b><div class="bar-block"><span style="font-size:14px">' + (two ? 'Increase two scores (+2 / +1)' : 'Increase three scores (+1 / +1 / +1)') + (old || bg.abilityOptions.length >= 6 ? '' : ' <span class="muted2" style="font-size:12px">· options: ' + bg.abilityOptions.map(function (a) { return a.toUpperCase(); }).join(', ') + '</span>') + '</span>' +
        '<div class="bar-block" style="border-left-color:var(--line)">' + asi.map(function (a) { return '<span style="display:flex;align-items:center;gap:10px;font-size:14px"><span class="badge">+' + pick.asi[a] + '</span>' + name(a) + ' Score</span>'; }).join('') + '</div></div></div>' +
      (feature ? '<div style="display:flex;flex-direction:column;gap:8px"><b>Background Feature</b><div class="bar-block" style="gap:4px"><span style="font-weight:600">' + h(feature.name) + '</span><div style="font-size:13px;line-height:1.5;color:var(--body2)">' + CF.util.rich(feature.text) + '</div></div></div>' : '') +
      (feat ? '<div style="display:flex;flex-direction:column;gap:8px"><b>Origin Feat</b><div class="bar-block" style="gap:4px"><span style="font-weight:600">' + h(feat.name) + '</span><div style="font-size:13px;line-height:1.5;color:var(--body2)">' + CF.util.rich(feat.text) + '</div></div></div>' : '') +
      (bg.tool ? '<p style="margin:0;font-size:14px"><strong>Tool Proficiency:</strong> ' + (bg.tool.fixed ? h((CF.content.get('items', bg.tool.fixed) || { name: bg.tool.fixed }).name) : ({ artisan: 'Artisan’s tools', 'musical-instrument': 'Musical instrument' }[bg.tool.choose] || 'Gaming set') + (tool ? ' (chosen: ' + h(tool.name) + ')' : '')) + '</p>' : '') +
      (bg.equipment ? '<div style="display:flex;flex-direction:column;gap:8px"><b>Equipment</b><div class="bar-block" style="gap:6px">' + Object.keys(bg.equipment).map(function (k) {
        var chosen = pick.equipment === k;
        var txt = typeof bg.equipment[k] === 'string' ? bg.equipment[k] : bg.equipment[k].text;
        return '<span style="font-size:13px;line-height:1.5;' + (chosen ? '' : 'color:var(--muted2)') + '">' + (chosen ? '<span class="badge" style="font-size:11px;margin-right:6px">Chosen</span>' : '') + '<strong>' + k + ':</strong> ' + h(txt) + '</span>';
      }).join('') + '</div></div>' : '') +
      characteristics(cur(), d) +
      '<div style="display:flex;flex-direction:column;gap:10px"><b>Personality</b>' + (P ? CF.ui.personality.editor(cur(), bg) : CF.ui.personality.view(cur())) + '</div>' +
      '<span class="muted2" style="font-size:12px">Source: ' + h(bg.sourceName) + '</span>';
  }

  /* ---------- notes: session notes plus lists of organisations and allies ---------- */
  var JOURNAL = [['orgs', 'Organisations', 'organisation', 'e.g. The Harpers', 'Who they are, your rank, contacts, what they want from you…'],
    ['allies', 'Allies', 'ally', 'e.g. Captain Vey', 'How you met, where to find them, what they owe you…'],
    ['enemies', 'Enemies', 'enemy', 'e.g. The Black Hand', 'What they did, what they want, where they were last seen…']];
  function notesTab(ch, v) {
    var sub = v.noteSub || 'all', J = ch.journal || {};
    var count = function (k) { return (J[k] || []).length; };
    var tabs = [['all', 'All']].concat(JOURNAL.map(function (j) { return [j[0], j[1] + ' <small>' + count(j[0]) + '</small>', j[1] + ', ' + count(j[0])]; }), [['backstory', 'Backstory'], ['others', 'Others']]);
    var out = pills(tabs, sub, 'note-sub', 'Note types');
    JOURNAL.forEach(function (j) { if (sub === 'all' || sub === j[0]) out += journalList(J[j[0]] || [], j, sub === 'all'); });
    if (sub === 'all' || sub === 'backstory') {
      var story = (ch.details && ch.details.backstory) || '';
      out += '<label for="backstory" class="h-sec">Backstory</label><textarea id="backstory" rows="' + (sub === 'all' ? 5 : 14) + '" data-act="bs-text" data-key="backstory" placeholder="Where do they come from? What do they want? What are they running from?" class="note-area">' + h(story) + '</textarea>';
    }
    if (sub === 'all' || sub === 'others') {
      var notes = (ch.play && ch.play.notes) || '';
      out += '<label for="notes" class="h-sec">Other notes</label><textarea id="notes" rows="' + (sub === 'all' ? 6 : 14) + '" data-act="notes" data-key="notes" placeholder="Clues, loot, rumours, session recaps…" class="note-area">' + h(notes) + '</textarea>';
    }
    return out;
  }
  function journalList(list, j, inAll) {
    var head = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="h-sec">' + h(j[1]) + '</span>' +
      '<button type="button" class="small-out" data-act="jn-add" data-arg="' + j[0] + '">+ Add ' + h(j[2]) + '</button></div>';
    if (!list.length) return head + '<p class="muted2" style="margin:0;font-size:13px">No ' + h(j[1].toLowerCase()) + ' yet.' + (inAll ? '' : ' Use “Add ' + h(j[2]) + '” to start one.') + '</p>';
    return head + '<div class="jn-list">' + list.map(function (e) {
      var key = j[0] + ':' + e.id;
      return '<div class="jn-entry"><div style="display:flex;gap:8px;align-items:center">' +
        '<input type="text" class="jn-name" data-act="jn-field" data-arg="' + h(key) + ':name" data-key="jn-' + h(key) + '-name" value="' + h(e.name || '') + '" placeholder="' + h(j[3]) + '" aria-label="' + h(j[2]) + ' name" autocomplete="off">' +
        '<button type="button" class="small-out" data-act="jn-del" data-arg="' + h(key) + '" aria-label="Remove ' + h(e.name || j[2]) + '">Remove</button></div>' +
        '<textarea rows="3" class="note-area" data-act="jn-field" data-arg="' + h(key) + ':text" data-key="jn-' + h(key) + '-text" placeholder="' + h(j[4]) + '" aria-label="Notes about ' + h(e.name || j[2]) + '">' + h(e.text || '') + '</textarea></div>';
    }).join('') + '</div>';
  }

  function extrasTab() { return '<div class="empty"><b style="color:var(--ink)">Extras</b><span>Companions, mounts and other extras will live here.</span></div>'; }

  /* ---------- handlers ---------- */
  var H = app.handlers, HV = app.hoverHandlers;
  function cur() { return CF.store.get(CUR_ID); }
  function mutate(fn) {
    var ch = cur(); if (!ch) return;
    ch.play = ch.play || R.freshPlayState();
    fn(ch, R.derive(ch));
    if (!CF.store.put(ch)) app.flash('Couldn’t save: this browser’s storage is full or blocked. Export the character to keep it safe.', true);
    app.render();
  }
  function amt() { return Math.max(0, parseInt(app.view.amt, 10) || 0); }

  H.mode = function (m) { app.go('#/c/' + encodeURIComponent(CUR_ID) + (m === 'play' ? '/play' : '')); };
  H.tab = function (t) { app.view.tab = t; app.view.resetScroll = true; app.render(); };
  H.sub = function (s) { app.view.sub = s; app.view.resetScroll = true; app.render(); };
  H['char-edit'] = function () { app.view.charEdit = !app.view.charEdit; app.render(); };
  H['char-detail'] = function (k, el) {
    var ch = cur(); if (!ch) return;
    ch.details = ch.details || {}; ch.details[k] = String(el.value).slice(0, 60);
    CF.store.putSoon(ch, function (ok) { if (!ok) { app.flash('Couldn’t save: storage is full or blocked.', true); app.render(); } });
  };
  H['feat-sub'] = function (s) { app.view.featSub = s; app.view.resetScroll = true; app.render(); };
  H['spell-sub'] = function (s) { app.view.spellSub = s; app.view.resetScroll = true; app.render(); };
  H['spell-open'] = function (id) { app.view.spellOpen = id; app.render(); };
  H['act-show'] = function (n) { app.view.actHover = n; app.render(); };
  HV.spell = function (id) { if (app.view.spellOpen !== id) { app.view.spellOpen = id; app.render(); } };
  HV.act = function (n) { if (app.view.actHover !== n) { app.view.actHover = n; app.render(); } };
  H.unit = function (u) { CF.store.setSetting('unit', u); app.render(); };
  H['inv-filter'] = function (f) { app.view.invFilter = f; app.view.resetScroll = true; app.render(); };
  H['inv-q'] = function (a, el) { app.view.invQuery = el.value; app.render(); };
  H['inv-collapse'] = function (g) { app.view.collapsed[g] = !app.view.collapsed[g]; app.render(); };
  H.exh = function (n) {
    mutate(function (ch, d) {
      var before = d.exhaustion.level;
      ch.play.exhaustion = Math.max(0, Math.min(6, +n || 0));
      ch.play.conditions = (ch.play.conditions || []).filter(function (c) { return c !== 'Exhaustion'; });
      var after = R.derive(ch);
      app.flash(ch.play.exhaustion > before ? 'Exhaustion ' + ch.play.exhaustion + (after.exhaustion.dead ? ': your character dies.' : ': ' + after.exhaustion.lines.join(' · ') + '.') : ch.play.exhaustion ? 'Exhaustion down to ' + ch.play.exhaustion + '.' : 'No more Exhaustion.');
    });
  };
  H.picker = function () { app.view.picker = !app.view.picker; app.render(); };
  H.amt = function (a, el) { app.view.amt = el.value; };

  H.roll = function (arg) {
    var ch = cur(); if (!ch) return;
    var d = R.derive(ch), p = arg.split(':'), kind = p[0], key = p.slice(1).join(':');
    EX = d.exhaustion;
    beginAction(function () { H.roll(arg); });
    if (kind === 'init') d20('Initiative', d.initiative, 'init', R.checkState(d, 'init'));
    else if (kind === 'abil') { var a = R.ABILITIES.find(function (x) { return x.id === key; }); d20(a.name + ' check', d.mods[key], 'check', R.checkState(d, null)); }
    else if (kind === 'save') { var s = d.saves.find(function (x) { return x.id === key; }); d20(s.name + ' saving throw', s.bonus, 'save'); }
    else if (kind === 'skill') { var sk = d.skills.find(function (x) { return x.id === key; }); d20(sk.name + ' check', sk.bonus, 'check', R.checkState(d, key)); }
    else if (kind === 'spellatk') { var cst = key !== undefined && key !== '' && d.spell.casters ? d.spell.casters[+key] : null; attackRoll(cst ? cst.name + ' spell attack' : 'Spell attack', cst ? cst.attack : d.spell.attack, 20); }
    else if (kind === 'feat') {
      var fp = key.split('|'), fa = d.featureActions[+fp[0]], rr = fa && fa.rolls[+fp[1]];
      if (!rr) return;
      if (rr[1] === 'unarmed') { var ua = d.attacks[d.attacks.length - 1]; attackRoll('Unarmed Strike', ua.hit, d.critRange); }
      else {
        var mm = typeof rr[3] === 'string' ? rr[3].split('+').reduce(function (t, part) { return t + (part === 'level' ? (fa.classLevel || d.classLevel) : d.mods[part] || 0); }, 0) : rr[3];
        var critOk = app.critActive && /sneak|frenzy|brutal|radiant|necrotic|psychic|palm|strike/i.test(fa.name + ' ' + rr[0]) && !/heal|temp|luck|check|deflect/i.test(fa.name + ' ' + rr[0]);
        if (critOk) app.rollCrit(fa.name + ' · ' + rr[0], rr[1], rr[2], mm); else app.roll(fa.name + ' · ' + rr[0], rr[1], rr[2], mm);
      }
    }
    else if (kind === 'spell2') {
      var sp2 = d.spell.spells.find(function (x) { return x.id === key; });
      var lc2 = app.lastCast && app.lastCast.id === sp2.id && app.lastCast.level > sp2.level ? app.lastCast.level : 0;
      dmgRoll(sp2.name + (lc2 ? ' at ' + ordinal(lc2) + ' level' : '') + ' (' + sp2.effect.second.type + ', ' + sp2.effect.second.save.toUpperCase() + ' save)', lc2 ? upcastDice(sp2, lc2, 'second') : sp2.effect.second.dice, 0, false, sp2.effect.second.type === 'fire' ? 'spell-fire' : null);
    }
    else if (kind === 'spell') {
      var spl = d.spell.spells.find(function (x) { return x.id === key; });
      var lc = app.lastCast && app.lastCast.id === spl.id && app.lastCast.level > spl.level ? app.lastCast.level : 0;
      dmgRoll(spl.name + (lc ? ' at ' + ordinal(lc) + ' level' : '') + (spl.effect.type ? ' (' + spl.effect.type + ')' : ''), lc ? upcastDice(spl, lc) : spl.effect.dice, spl.effect.addMod ? spl.castMod : 0, app.critActive && spl.effect.type !== 'healing' && !!(spl.attack || spl.trigger || /on hits/.test(spl.effect.text || '')), spl.effect.type === 'fire' ? 'spell-fire' : null);
    } else if (kind === 'dmg2') {
      var A2 = actionData(d).keyed[key]; if (!A2 || !A2.second) return;
      var l2 = A2.spellDef && app.lastCast && app.lastCast.id === A2.spellDef.id ? app.lastCast.level : 0;
      dmgRoll(A2.name + (l2 > A2.spellDef.level ? ' at ' + ordinal(l2) + ' level' : '') + ' (' + A2.second.type + ', on a failed save)', l2 ? upcastDice(A2.spellDef, l2, 'second') : A2.second.dice, 0, false, A2.second.type === 'fire' ? 'spell-fire' : null);
    } else if (kind === 'hit' || kind === 'dmg') {
      var A = actionData(d).keyed[key]; if (!A) return;
      var sd = A.spellDef;
      if (P && sd && sd.level > 0 && (kind === 'hit' || !(app.lastCast && app.lastCast.id === sd.id))) {
        app.view.castAsk = { id: sd.id, kind: kind, key: key }; app.render(); return;
      }
      if (sd && kind === 'dmg' && app.lastCast && app.lastCast.id === sd.id && app.lastCast.level > sd.level) {
        dmgRoll(A.name + ' at ' + ordinal(app.lastCast.level) + ' level (' + A.type + ')', upcastDice(sd, app.lastCast.level), A.mod, !!app.critActive && A.hit != null, A.type === 'fire' ? 'spell-fire' : null);
        app.render(); return;
      }
      if (kind === 'hit') attackRoll(A.name + ' attack', A.hit, A.kind === 'weapon' || A.kind === 'unarmed' || key === 'oa' || key === 'nick' || key === 'ma' ? d.critRange : 20);
      else dmgRoll(A.name + ' damage (' + A.type + ')', A.dice, A.mod, !!app.critActive && A.hit != null, A.kind === 'unarmed' || key === 'ma' ? 'unarmed-dmg' : sd && A.type === 'fire' ? 'spell-fire' : null);
    } else if (kind === 'raw') {
      var r = key.split('|');
      if (+r[2] === 20) attackRoll(r[0], +r[3], d.critRange);
      else if (app.critActive && /damage/i.test(r[0])) app.rollCrit(r[0], +r[1], +r[2], +r[3]);
      else app.roll(r[0], +r[1], +r[2], +r[3]);
    }
    RR.replay = null;
    app.render();
  };

  /** An attack roll: a natural 20 (or the Champion's lower range) turns on critical damage until the next attack. */
  function attackRoll(label, bonus, range) {
    var r = d20(label, bonus, 'attack'), face = r.rolls[0];
    if (face >= (range || 20)) {
      app.critActive = { label: label };
      var exTxt = EX && EX.level ? ' · Exhaustion ' + EX.level + (EX.d20 ? ' (−' + EX.d20 + ')' : '') : '';
      app.lastRoll.detail = '[' + face + ']' + (bonus ? (bonus > 0 ? ' + ' + bonus : ' − ' + Math.abs(bonus)) : '') + exTxt + (face === 20 ? ' · Natural 20! Critical hit' : ' · Critical hit (' + range + '–20)');
      app.lastRoll.nat = 20;
    } else {
      app.critActive = null;
      if (face === 1) app.lastRoll.detail += ' · always misses';
    }
    return r;
  }
  H['cast-cancel'] = function () { app.view.castAsk = null; app.render(); };
  H['cast-pick'] = function (how) {
    var ask = app.view.castAsk; if (!ask) return;
    app.view.castAsk = null;
    var ch = cur(); if (!ch) return;
    var d = R.derive(ch), s = d.spell && d.spell.spells.find(function (x) { return x.id === ask.id; }); if (!s) return;
    var spent = spendCast(ch, d, s, how); if (!spent) { app.render(); return; }
    CF.store.put(ch);
    app.view.restNote = spent.note;
    var d2 = R.derive(ch), A = actionData(d2).keyed[ask.key];
    var atkLabel = A && A.name + ' attack' + (spent.lvl > s.level ? ' (' + ordinal(spent.lvl) + ' level)' : '');
    if (A && ask.kind === 'hit') { beginAction(function () { attackRoll(atkLabel, A.hit, 20); }); RR.snap = null; attackRoll(atkLabel, A.hit, 20); }   // a reroll only redoes the attack, the slot stays spent
    else if (A) dmgRoll(A.name + (spent.lvl > s.level ? ' at ' + ordinal(spent.lvl) + ' level' : '') + ' (' + A.type + ')', upcastDice(s, spent.lvl) || A.dice, A.mod, !!app.critActive && A.hit != null, A.type === 'fire' ? 'spell-fire' : null);
    RR.replay = null;
    app.render();
  };
  H['crit-done'] = function () { app.critActive = null; app.render(); };
  /** Spend a slot (or a free cast) for a spell. how: slot level, 'free' or 'none'. Returns {lvl, note} or null. */
  function spendCast(ch, d, s, how) {
    var lvl = s.level, note;
    if (how === 'none') note = s.name + ' rolled without spending a slot.';
    else if (how === 'free') {
      var res = d.resources.find(function (r) { return r.spell === s.id; }); if (!res || res.used >= res.max) return null;
      ch.play.resourcesUsed = ch.play.resourcesUsed || {}; ch.play.resourcesUsed[res.id] = (ch.play.resourcesUsed[res.id] || 0) + 1;
      note = s.name + ' cast without a slot (' + (res.max - res.used - 1) + ' free cast' + (res.max - res.used - 1 === 1 ? '' : 's') + ' left).';
    } else {
      var slot = d.spell.slots.find(function (x) { return x.key === String(how); }); if (!slot || slot.used >= slot.max) return null;
      lvl = slot.level;
      ch.play.slotsUsed = ch.play.slotsUsed || {}; ch.play.slotsUsed[slot.key] = (ch.play.slotsUsed[slot.key] || 0) + 1;
      note = s.name + ' cast with a ' + ordinal(lvl) + '-level ' + (slot.pact && !d.spell.pact ? 'Pact ' : '') + 'slot (' + (slot.max - slot.used - 1) + ' left).';
    }
    if (s.concentration && how !== 'none') note += ' Concentrating' + (s.concDuration ? ' for up to ' + s.concDuration : '') + '.';
    app.lastCast = { id: s.id, level: lvl };
    return { lvl: lvl, note: note };
  }
  H.cast = function (arg) {
    var p = arg.split('|');
    app.rerollOffer = null;
    mutate(function (ch, d) {
      var s = d.spell && d.spell.spells.find(function (x) { return x.id === p[0]; }); if (!s) return;
      var spent = spendCast(ch, d, s, p[1]); if (!spent) return;
      var lvl = spent.lvl, note = spent.note;
      var dice = upcastDice(s, lvl), dice2 = s.effect && s.effect.second ? upcastDice(s, lvl, 'second') : null;
      if (dice && dice2) {
        var r1 = app.rollDice(s.name, dice, s.effect.addMod ? s.castMod : 0), r2 = app.rollDice(s.name, dice2, 0);
        app.lastRoll = { label: s.name + (lvl > s.level ? ' at ' + ordinal(lvl) + ' level' : '') + ' · ' + s.effect.type + ' on a hit', total: r1.total, nat: 0,
          detail: dice + ' [' + r1.rolls.join(', ') + '] · then ' + dice2 + ' ' + s.effect.second.type + ' [' + r2.rolls.join(', ') + '] = ' + r2.total + ' on a failed ' + s.effect.second.save.toUpperCase() + ' save' };
      } else if (dice) dmgRoll(s.name + (lvl > s.level ? ' at ' + ordinal(lvl) + ' level' : '') + (s.effect.type ? ' (' + s.effect.type + ')' : ''), dice, s.effect.addMod ? s.castMod : 0, app.critActive && s.effect.type !== 'healing' && !!(s.attack || s.trigger), s.effect.type === 'fire' ? 'spell-fire' : null);
      app.view.restNote = note;
    });
  };
  H.inspiration = function () { mutate(function (ch) { ch.play.inspiration = !ch.play.inspiration; }); };
  H.heal = function () {
    var n = amt(); if (!n) return;
    mutate(function (ch, d) {
      if (d.hp === 0 && (ch.play.deathSaves || {}).f >= 3) { app.view.restNote = 'A dead character can’t be healed back. Reset the death save circles if this was a mistake, or use a spell like Revivify.'; return; }
      ch.play.hpLost = Math.max(0, (ch.play.hpLost || 0) - n); ch.play.deathSaves = { s: 0, f: 0 };
      app.view.restNote = d.hp === 0 ? 'Healed: back up with ' + Math.min(n, d.hpMax) + ' HP and conscious again.' : '';
    });
  };
  H.damage = function () {
    var n = amt(); if (!n) return;
    mutate(function (ch, d) {
      var ds = ch.play.deathSaves = ch.play.deathSaves || { s: 0, f: 0 };
      var fromTemp = Math.min(ch.play.temp || 0, n); ch.play.temp = (ch.play.temp || 0) - fromTemp;
      var rest = n - fromTemp;
      if (!rest) { app.view.restNote = 'Temporary HP absorbed all ' + n + ' damage.'; return; }
      if (d.hp === 0) {
        if (rest >= d.hpMax) { ds.f = 3; app.view.restNote = 'Massive damage: ' + rest + ' damage at 0 HP is at least your HP maximum (' + d.hpMax + '). Instant death.'; }
        else {
          var wasStable = ds.s >= 3;
          if (wasStable) { ds.s = 0; ds.f = 0; }
          ds.f = Math.min(3, (ds.f || 0) + 1);
          app.view.restNote = (wasStable ? 'No longer Stable. ' : '') + 'Damage at 0 HP counts as one death save failure (tap a circle to add a second for a critical hit).';
        }
        return;
      }
      var over = rest - d.hp;   // damage left over after dropping to 0
      ch.play.hpLost = Math.min(d.hpMax, (ch.play.hpLost || 0) + rest);
      if (over >= 0) {
        ch.play.deathSaves = { s: 0, f: over >= d.hpMax ? 3 : 0 };
        app.view.restNote = over >= d.hpMax ? 'Massive damage: ' + over + ' damage left over after dropping to 0 HP is at least your HP maximum (' + d.hpMax + '). Instant death.'
          : 'Down to 0 HP: you fall Unconscious and start making death saves.';
      } else app.view.restNote = '';
    });
  };
  H.temp = function () { var n = amt(); mutate(function (ch) { ch.play.temp = n; }); };
  H['temp-set'] = function (a, el) {
    var ch = cur(); if (!ch) return;
    ch.play = ch.play || R.freshPlayState();
    ch.play.temp = Math.max(0, Math.min(999, parseInt(el.value, 10) || 0));
    CF.store.putSoon(ch, function (ok) { if (!ok) { app.flash('Couldn’t save: storage is full or blocked.', true); app.render(); } });
  };
  H.ds = function (arg) {
    var p = arg.split(':'), i = +p[1];
    mutate(function (ch) { var ds = ch.play.deathSaves; ds[p[0]] = ds[p[0]] === i + 1 ? i : i + 1; });
  };
  H['death-roll'] = function () {
    beginAction(function () { H['death-roll'](); });
    mutate(function (ch, d) {
      EX = d.exhaustion;
      var rr = d20('Death saving throw', 0, 'save'), r = rr.rolls[0], ds = ch.play.deathSaves, tot = rr.total;
      var exNote = d.exhaustion.level ? ' · Exhaustion ' + d.exhaustion.level + (d.exhaustion.d20 ? ' (−' + d.exhaustion.d20 + ', total ' + tot + ')' : '') : '';
      if (r === 20) { ch.play.hpLost = d.hpMax - 1; ch.play.deathSaves = { s: 0, f: 0 }; app.lastRoll.detail = '[20] · Natural 20! Back up with 1 HP'; }
      else if (r === 1) { ds.f = Math.min(3, ds.f + 2); app.lastRoll.detail = '[1] · Natural 1 · two failures' + (ds.f >= 3 ? ' · Dead' : ''); }
      else if (tot >= 10) { ds.s = Math.min(3, ds.s + 1); app.lastRoll.detail = '[' + r + ']' + exNote + ' · Success (10 or higher)' + (ds.s >= 3 ? ' · Stable!' : '');
        if (ds.s >= 3) { ds.f = 0; app.view.restNote = 'Stable: still at 0 HP and Unconscious, but no more death saves. You regain 1 HP after 1d4 hours (use Wake up), or sooner if healed.'; } }
      else { ds.f = Math.min(3, ds.f + 1); app.lastRoll.detail = '[' + r + ']' + exNote + ' · Failure (under 10)' + (ds.f >= 3 ? ' · Dead' : ''); }
    });
    RR.replay = null;
  };
  H.wake = function () {
    mutate(function (ch, d) {
      if (d.hp > 0) return;
      var r = app.roll('Stable: hours until you wake', 1, 4, 0).rolls[0];
      ch.play.hpLost = d.hpMax - 1; ch.play.deathSaves = { s: 0, f: 0 };
      app.lastRoll.detail = '[' + r + '] · wakes with 1 HP after ' + r + ' hour' + (r > 1 ? 's' : '');
      app.view.restNote = 'Woke up with 1 HP after ' + r + ' hour' + (r > 1 ? 's' : '') + ' of rest.';
    });
  };
  H.cond = function (c) {
    mutate(function (ch) { var l = ch.play.conditions || []; var i = l.indexOf(c); if (i >= 0) l.splice(i, 1); else l.push(c); ch.play.conditions = l; });
  };
  H.pip = function (arg) {
    var p = arg.split(':'), kind = p[0], id = p[1], i = +p[2];
    mutate(function (ch, d) {
      var max = kind === 'slot' ? d.spell.slots.find(function (s) { return s.key === id; }).max : d.resources.find(function (r) { return r.id === id; }).max;
      var bag = kind === 'slot' ? (ch.play.slotsUsed = ch.play.slotsUsed || {}) : (ch.play.resourcesUsed = ch.play.resourcesUsed || {});
      var used = bag[id] || 0, available = max - used;
      bag[id] = i < available ? max - i : max - (i + 1);   // tap a filled pip to spend down to it, an empty one to restore up to it
    });
  };
  H['short-rest'] = function () {
    beginAction(function () { H['short-rest'](); });
    mutate(function (ch, d) {
      var extra = [];
      if (d.spell && d.spell.pact && Object.keys(ch.play.slotsUsed || {}).length) { ch.play.slotsUsed = {}; extra.push('Pact slots restored.'); }
      else if (d.spell && d.spell.hasPact) { var pk = Object.keys(ch.play.slotsUsed || {}).filter(function (k) { return k.charAt(0) === 'p' && ch.play.slotsUsed[k]; }); if (pk.length) { pk.forEach(function (k) { delete ch.play.slotsUsed[k]; }); extra.push('Pact slots restored.'); } }
      d.resources.forEach(function (r) {
        var used = (ch.play.resourcesUsed || {})[r.id] || 0;
        if (r.recharge === 'short' && used) { ch.play.resourcesUsed[r.id] = 0; extra.push(r.name + ' restored.'); }
        else if (r.shortRest && used) { ch.play.resourcesUsed[r.id] = Math.max(0, used - r.shortRest); extra.push(r.shortRest + ' ' + r.name + (r.shortRest > 1 ? ' back.' : ' use back.')); }
      });
      app.view.restExtra = extra.join(' ');
      var pools = d.hdPools || [], left = pools.reduce(function (t, p) { return t + p.max - p.used; }, 0);
      var pool = pools.find(function (p) { return p.used < p.max; });   // biggest die first
      if (!pool || d.hp >= d.hpMax) { app.view.restNote = (d.hp >= d.hpMax ? 'Short rest taken. Already at full HP.' : 'Short rest taken. No Hit Dice left to spend.') + ' ' + app.view.restExtra; return; }
      var r = app.roll('Short rest · Hit Die (d' + pool.die + ')', 1, pool.die, d.mods.con);
      if (!RR.quiet && d.rerolls.some(function (x) { return x.scope === 'hd' && r.rolls[0] <= x.max; })) {
        var hr = d.rerolls.find(function (x) { return x.scope === 'hd'; });
        app.rerollOffer = { mode: 'replay', snap: RR.snap, replay: RR.replay, text: 'You rolled a ' + r.rolls[0] + ' on your Hit Die. ' + hr.name + ': you can reroll' + (hr.must ? ', and you must use the new roll' : '') + '.' };
      }
      var healed = Math.min(Math.max(0, r.total), ch.play.hpLost || 0);
      ch.play.hpLost = Math.max(0, (ch.play.hpLost || 0) - healed);
      if (pools.length > 1 || typeof ch.play.hdUsed === 'object') {
        var map = {}; pools.forEach(function (p) { if (p.used) map['d' + p.die] = p.used; }); map['d' + pool.die] = pool.used + 1; ch.play.hdUsed = map;
      } else ch.play.hdUsed = pool.used + 1;
      app.view.restNote = 'Short rest: spent 1 Hit Die (d' + pool.die + '), healed ' + healed + ' HP (' + (left - 1) + ' left). ' + app.view.restExtra;
    });
    RR.replay = null;
  };
  H['long-rest'] = function () {
    mutate(function (ch) {
      var exB = R.exhaustionLevel(ch.play);
      app.view.restNote = ''; ch.play.hpLost = 0; ch.play.temp = 0; ch.play.slotsUsed = {}; ch.play.resourcesUsed = {}; ch.play.hdUsed = 0; ch.play.deathSaves = { s: 0, f: 0 };
      if (exB && exB < 6) { ch.play.exhaustion = exB - 1; ch.play.conditions = (ch.play.conditions || []).filter(function (c) { return c !== 'Exhaustion'; }); }
      app.view.restNote = 'Long rest taken. HP, spell slots, Hit Dice and limited uses restored.' + (exB && exB < 6 ? ' Exhaustion ' + exB + ' → ' + (exB - 1) + (R.isOld(ch) ? ' (if you ate and drank).' : '.') : '');
    });
  };
  H.pool = function (arg) {
    var p = arg.split(':');
    mutate(function (ch, d) {
      var r = d.resources.find(function (x) { return x.id === p[0]; }); if (!r) return;
      ch.play.resourcesUsed = ch.play.resourcesUsed || {};
      ch.play.resourcesUsed[r.id] = Math.max(0, Math.min(r.max, (ch.play.resourcesUsed[r.id] || 0) + (+p[1])));
    });
  };
  H.equip = function (uid) { mutate(function (ch) { var e = ch.inventory.find(function (x) { return x.uid === uid; }); if (e) e.equipped = !e.equipped; }); };
  H.unpack = function (uid) {
    var name = '';
    mutate(function (ch) { var e = ch.inventory.find(function (x) { return x.uid === uid; }); name = e ? (CF.content.get('items', e.item, CF.content.on(ch)) || {}).name : ''; R.unpack(ch, uid); });
    if (name) { app.view.restNote = name + ' unpacked into your backpack.'; app.render(); }
  };
  H['add-open'] = function () { app.view.adding = true; app.view.addQuery = ''; app.render(); };
  H['add-close'] = function () { app.view.adding = false; app.render(); };
  H['add-q'] = function (a, el) { app.view.addQuery = el.value; app.render(); };
  H['add-item'] = function (id) {
    var name = '';
    mutate(function (ch) {
      var on = CF.content.on(ch), def = CF.content.get('items', id, on); if (!def) return;
      var hasBag = ch.inventory.some(function (e) { return e.item === 'backpack'; });
      var where = def.kind === 'weapon' || def.kind === 'armor' || def.kind === 'container' || !hasBag ? 'equipment' : 'backpack';
      R.addItem(ch.inventory, id, 1, on, where, false);
      name = def.name;
      app.view.restNote = def.name + ' added to your ' + (where === 'backpack' ? 'backpack' : 'equipment') + (def.kind === 'weapon' || def.kind === 'armor' ? '. Tick “Active” to equip it.' : '.');
    });
  };
  H['inv-drink'] = function (uid) {
    mutate(function (ch, d) {
      var i = ch.inventory.findIndex(function (x) { return x.uid === uid; }); if (i < 0) return;
      var def = CF.content.get('items', ch.inventory[i].item, CF.content.on(ch)); if (!def || !def.heal) return;
      var m = /^(\d+)d(\d+)(?:\+(\d+))?$/.exec(def.heal.replace(/\s+/g, '')); if (!m) return;
      var r = app.roll(def.name, +m[1], +m[2], +(m[3] || 0));
      var healed = Math.min(Math.max(0, r.total), ch.play.hpLost || 0);
      ch.play.hpLost = Math.max(0, (ch.play.hpLost || 0) - r.total);
      if (healed > 0 && ch.play.deathSaves) ch.play.deathSaves = { s: 0, f: 0 };
      var e = ch.inventory[i]; e.qty = (e.qty || 1) - 1; if (e.qty <= 0) ch.inventory.splice(i, 1);
      app.view.restNote = 'You drink the ' + def.name + ' and regain ' + r.total + ' HP' + (healed < r.total ? ' (' + healed + ' needed to reach full)' : '') + '.';
    });
  };
  H['inv-remove'] = function (uid) {
    mutate(function (ch) {
      var i = ch.inventory.findIndex(function (x) { return x.uid === uid; }); if (i < 0) return;
      var def = CF.content.get('items', ch.inventory[i].item, CF.content.on(ch));
      ch.inventory.splice(i, 1);
      app.view.restNote = (def ? def.name : 'Item') + ' removed.';
    });
  };
  H.qty = function (arg) {
    var p = arg.split(':');
    mutate(function (ch) { var e = ch.inventory.find(function (x) { return x.uid === p[0]; }); if (e) e.qty = Math.max(0, (e.qty || 0) + (+p[1])); });
  };
  H.coin = function (k, el) {
    var ch = cur(); if (!ch) return;
    ch.currency[k] = Math.max(0, parseInt(el.value, 10) || 0); CF.store.putSoon(ch);
  };
  H['bs-text'] = function (a, el) {
    var ch = cur(); if (!ch) return;
    ch.details = ch.details || {}; ch.details.backstory = el.value;
    CF.store.putSoon(ch, function (ok) { if (!ok) { app.flash('Couldn’t save: storage is full or blocked.', true); app.render(); } });
  };
  H['next-roll'] = function (m) { app.nextMode = +m || 0; app.render(); };
  H['reroll-no'] = function () { app.rerollOffer = null; app.render(); };
  H['reroll-yes'] = function () {
    var o = app.rerollOffer; app.rerollOffer = null; if (!o) return;
    if (o.mode === 'dice') {
      var rolls = o.rolls.map(function (x) { return x <= o.max ? 1 + Math.floor(Math.random() * o.sides) : x; });
      var total = rolls.reduce(function (a, b) { return a + b; }, 0) + o.mod;
      app.lastRoll = { label: o.label + ' · rerolled', total: total, nat: 0, detail: '[' + o.rolls.join(', ') + '] → [' + rolls.join(', ') + ']' + (o.mod ? (o.mod > 0 ? ' + ' + o.mod : ' − ' + Math.abs(o.mod)) : '') };
      if (CF.dice) CF.dice.show(Object.assign({ sides: o.sides, rolls: rolls }, app.lastRoll));
      app.render(); return;
    }
    var ch = cur();
    if (ch && o.snap != null) { ch.play = JSON.parse(o.snap); CF.store.put(ch); }
    RR.quiet = true;
    try { o.replay(); } finally { RR.quiet = false; }
    if (app.lastRoll) app.lastRoll.label += ' · rerolled';
    app.render();
  };
  H['note-sub'] = function (s) { app.view.noteSub = s; app.view.resetScroll = true; app.render(); };
  H['jn-add'] = function (k) {
    var ch = cur(); if (!ch) return;
    ch.journal = ch.journal || {}; ch.journal[k] = ch.journal[k] || [];
    ch.journal[k].push({ id: U.uid(), name: '', text: '' });
    if (!CF.store.put(ch)) app.flash('Couldn’t save: storage is full or blocked.', true);
    app.render();
  };
  H['jn-del'] = function (arg) {
    var p = arg.split(':'), ch = cur(); if (!ch || !ch.journal || !ch.journal[p[0]]) return;
    ch.journal[p[0]] = ch.journal[p[0]].filter(function (e) { return e.id !== p[1]; });
    CF.store.put(ch); app.render();
  };
  H['jn-field'] = function (arg, el) {
    var p = arg.split(':'), ch = cur(); if (!ch || !ch.journal || !ch.journal[p[0]]) return;
    var e = ch.journal[p[0]].find(function (x) { return x.id === p[1]; }); if (!e) return;
    e[p[2]] = el.value;
    CF.store.putSoon(ch, function (ok) { if (!ok) { app.flash('Couldn’t save notes: storage is full or blocked.', true); app.render(); } });
  };
  H.notes = function (a, el) {
    var ch = cur(); if (!ch) return;
    ch.play = ch.play || R.freshPlayState(); ch.play.notes = el.value;
    CF.store.putSoon(ch, function (ok) { if (!ok) { app.flash('Couldn’t save notes: storage is full or blocked.', true); app.render(); } });
  };
})(window);
