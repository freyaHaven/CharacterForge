/* Character Forge — Extras: companions, familiars, mounts, summons and Wild Shape forms. */
(function (root) {
  'use strict';
  var CF = root.CF, U = CF.util, R = CF.rules, C = CF.content, app = CF.app, h = U.esc, sg = U.signed;

  var ROLES = [['companion', 'Companion'], ['familiar', 'Familiar'], ['mount', 'Mount'], ['summon', 'Summon'], ['wildshape', 'Wild Shape form'], ['other', 'Other']];
  var ROLE_NAME = {}; ROLES.forEach(function (r) { ROLE_NAME[r[0]] = r[1]; });
  var ABBR = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
  var FAMILIAR_FORMS = ['bat', 'cat', 'frog', 'hawk', 'lizard', 'octopus', 'owl', 'rat', 'raven', 'spider', 'weasel'];
  var CHAIN_FORMS = ['imp', 'pseudodragon', 'quasit', 'skeleton', 'slaad-tadpole', 'sphinx-of-wonder', 'sprite', 'venomous-snake'];

  function crNum(cr) { if (cr == null || cr === '' || cr === 'None') return 0; var p = String(cr).split('/'); return p.length === 2 ? +p[0] / +p[1] : +cr || 0; }
  function mod(n) { return Math.floor((n - 10) / 2); }
  function cur() { var r = app.route(); return r.screen === 'sheet' && r.id ? CF.store.get(r.id) : null; }
  function xview() { var v = app.view; v.ex = v.ex || { open: {}, add: null, q: '', group: 'all', cr: '' }; return v.ex; }
  function play() { return !!app.route().play; }

  /* ---------- rules helpers ---------- */
  /** Druid Wild Shape limits for the character (2024 table), or null. */
  R.wildShapeInfo = function (d) {
    var dc = (d.classes || []).find(function (c) { return c.id === 'druid'; });
    if (!dc || dc.level < 2) return null;
    var L = dc.level;
    return { level: L, known: L >= 8 ? 8 : L >= 4 ? 6 : 4, maxCr: L >= 8 ? 1 : L >= 4 ? 0.5 : 0.25, maxCrText: L >= 8 ? '1' : L >= 4 ? '1/2' : '1/4', fly: L >= 8, temp: L, hours: Math.floor(L / 2) };
  };
  /** Why a creature can't be a Wild Shape form right now ('' if it can). */
  R.wildShapeBlock = function (cr, ws) {
    if (!/^Beast/.test(cr.type || '')) return 'not a Beast';
    if (crNum(cr.cr) > ws.maxCr) return 'CR ' + cr.cr + ' is above ' + ws.maxCrText;
    if (!ws.fly && cr.speed && cr.speed.fly) return 'has a Fly Speed (level 8+)';
    return '';
  };
  /** The Otherworldly Steed (Find Steed), built for a spell level and steed type. */
  R.otherworldlySteed = function (d, opts) {
    var L = Math.max(2, +(opts && opts.level) || 2), t = (opts && opts.ctype) || 'Celestial', sp = d.spell || { attack: d.pb, dc: 8 + d.pb };
    var dmgType = { Celestial: 'radiant', Fey: 'psychic', Fiend: 'necrotic' }[t];
    var c = { id: 'otherworldly-steed', name: 'Otherworldly Steed', size: 'Large', type: t, align: 'Neutral', ac: 10 + L, init: 1, hp: 5 + 10 * L, hd: L + 'd10',
      speed: L >= 4 ? { walk: 60, fly: 60 } : { walk: 60 }, speedText: '60 ft.' + (L >= 4 ? ', Fly 60 ft.' : ''), scores: { str: 18, dex: 12, con: 14, int: 6, wis: 12, cha: 8 },
      senses: 'Passive Perception 11', languages: 'Telepathy 1 mile (works only with you)', cr: 'None', pb: d.pb, special: true,
      traits: [{ name: 'Life Bond', text: 'When you regain Hit Points from a level 1+ spell, the steed regains the same number of Hit Points if you’re within 5 ft of it.' }],
      actions: [{ name: 'Otherworldly Slam', text: 'Melee Attack Roll: ' + sg(sp.attack) + ' (your spell attack), reach 5 ft. Hit: 1d8 + ' + L + ' ' + dmgType[0].toUpperCase() + dmgType.slice(1) + ' damage.', atk: { kind: 'melee', hit: sp.attack, dice: '1d8', mod: L, type: dmgType, reach: 5 } }],
      bonus: [t === 'Fiend' ? { name: 'Fell Glare (Recharges after a Long Rest)', text: 'Wisdom Saving Throw: DC ' + sp.dc + ', one creature within 60 ft the steed can see. Failure: The target has the Frightened condition until the end of your next turn.', save: { ability: 'wis', dc: sp.dc } }
        : t === 'Fey' ? { name: 'Fey Step (Recharges after a Long Rest)', text: 'The steed teleports, along with its rider, to an unoccupied space of your choice up to 60 ft away from itself.' }
        : { name: 'Healing Touch (Recharges after a Long Rest)', text: 'One creature within 5 ft of the steed regains 2d8 + ' + L + ' Hit Points.', heal: { dice: '2d8', mod: L } }] };
    return c;
  };
  /** "13+oWis", "Str+oWis", "14+Prof": creature mods (Str…), the master's mods (oStr…) and the proficiency bonus. */
  R.creatureFormula = function (f, cScores, d) {
    if (f == null || f === '') return 0;
    var cm = function (k) { return mod((cScores || {})[k] || 10); };
    var expr = String(f).replace(/\b(o?)(Str|Dex|Con|Int|Wis|Cha)\b/g, function (m, o, k) { k = k.toLowerCase(); return '(' + (o ? d.mods[k] : cm(k)) + ')'; })
      .replace(/\bo?Prof\b/g, '(' + d.pb + ')');
    if (!/^[0-9+\-*() ]+$/.test(expr)) return 0;
    try { return Function('return (' + expr + ')')() | 0; } catch (e) { return 0; }
  };
  /** Work out a companion that scales with its master (Beast Master beasts, Steel Defender…). */
  R.scaleCreature = function (c, d) {
    var o = c.owner || {}, cls = (c.hpF && c.hpF.cls) || o.cls;
    var dc = cls ? (d.classes || []).find(function (x) { return x.id === cls; }) : null, L = dc ? dc.level : d.level;
    if (c.pbLinked) c.pb = d.pb;
    if (c.hdLinked) { var hl = (d.classes || []).find(function (x) { return x.id === c.hdLinked; }); if (hl) c.hd = hl.level + 'd' + c.hdDie; }
    if (c.acF) c.ac = R.creatureFormula(c.acF, c.scores, d);
    if (c.hpF) c.hp = Math.max(1, c.hpF.base + c.hpF.per * L + (c.hpF.mod ? (c.hpF.modCoef || 1) * Math.max(0, d.mods[c.hpF.mod]) : 0));
    var caster = function (name) { var cs = d.spell && d.spell.casters ? d.spell.casters.find(function (x) { return x.name.toLowerCase() === String(name).toLowerCase(); }) : null; return cs || (d.spell ? { attack: d.spell.attack, mod: d.spell.mod, dc: d.spell.dc } : { attack: d.pb, mod: 0, dc: 8 + d.pb }); };
    (c.actions || []).forEach(function (a) {
      if (a.raw) {
        var r = a.raw, am = mod((c.scores || {})[r.ability] || 10), sp = r.spell ? caster(r.spell) : null;
        var hit = (sp ? sp.attack : am + (c.pb || d.pb)) + R.creatureFormula(r.hitF, c.scores, d);
        var dm = (r.noMod ? 0 : sp ? sp.mod : am) + R.creatureFormula(r.dmgF, c.scores, d);
        a.atk = { kind: r.kind, hit: hit, dice: r.dice, mod: dm, flat: r.flat, type: r.type || 'damage' };
        a.text = 'Attack: ' + sg(hit) + ' to hit' + (r.dice ? ', ' + r.dice + (dm ? ' ' + sg(dm) : '') + ' ' + (r.type || '') + ' damage' : '') + '. ' + a.text;
      }
      if (a.heal && a.heal.modF !== undefined) a.heal = { dice: a.heal.dice, mod: R.creatureFormula(a.heal.modF, c.scores, d) };
    });
    ['traits', 'actions'].forEach(function (k) { if (c[k]) c[k] = c[k].filter(function (e) { return !e.minLevel || L >= e.minLevel; }); });
    return c;
  };
  /** The stat block an extra uses: a library creature, a special one, or a custom one, with role tweaks. */
  R.extraCreature = function (ch, d, x) {
    var on = C.on(ch), base;
    if (x.ref === 'special:otherworldly-steed') base = R.otherworldlySteed(d, x.opts);
    else if (x.custom) base = x.custom;
    else base = C.get('creatures', x.ref, on);
    if (!base) return null;
    var c = U.clone(base);
    if (c.scaled) R.scaleCreature(c, d);
    if (x.role === 'familiar' && x.opts && x.opts.ctype && /^Beast/.test(c.type)) c.type = x.opts.ctype + ' (familiar)';
    return c;
  };

  /* ---------- view ---------- */
  CF.ui.extras = { tab: tab };

  function tab(ch, d, v) {
    var V = xview(), list = ch.extras || [], ws = R.wildShapeInfo(d), P = play();
    var knows = function (id) { return !!(d.spell && d.spell.spells.some(function (s) { return s.id === id; })); };
    var out = '';
    var active = ws && ch.play && ch.play.wildShape && list.find(function (x) { return x.id === ch.play.wildShape; });
    if (active) {
      var ac0 = R.extraCreature(ch, d, active);
      out += '<div class="notice ex-ws-on"><span>You are in <strong>Wild Shape: ' + h(active.nick || (ac0 && ac0.name)) + '</strong>. You keep your HP (with ' + ws.temp + ' temporary HP), your INT/WIS/CHA, and use the form’s other stats and attacks. It lasts up to ' + ws.hours + ' hour' + (ws.hours === 1 ? '' : 's') + '.</span><button type="button" class="btn btn-sm" data-act="ex-revert">Return to normal form</button></div>';
    }
    // quick starts for spells and features you have
    var starts = [];
    if (knows('find-familiar') && !list.some(function (x) { return x.role === 'familiar'; })) starts.push(['familiar', 'Find Familiar', 'Choose your familiar’s form']);
    if (knows('find-steed') && !list.some(function (x) { return x.ref === 'special:otherworldly-steed'; })) starts.push(['steed', 'Find Steed', 'Add your Otherworldly Steed']);
    featureCreatures(ch, d).forEach(function (g) {
      if (!list.some(function (x) { return g.items.some(function (c) { return c.id === x.ref; }); })) starts.push(['feat:' + g.key, g.label, 'Choose ' + (g.items.length > 1 ? 'one of ' + g.items.length + ' creatures' : g.items[0].name)]);
    });
    if (ws) starts.push(['wildshape', 'Wild Shape', 'Learn a Beast form (' + list.filter(function (x) { return x.role === 'wildshape'; }).length + ' of ' + ws.known + ' known)']);
    out += '<div class="ex-bar">' + starts.map(function (s) { return '<button type="button" class="btn btn-sm' + (V.add === s[0] ? ' btn-teal' : '') + '" data-act="ex-start" data-arg="' + s[0] + '">' + h(s[1]) + ' <small>· ' + h(s[2]) + '</small></button>'; }).join('') +
      '<button type="button" class="btn btn-sm' + (V.add === 'any' ? ' btn-teal' : '') + '" data-act="ex-start" data-arg="any">+ Add a creature</button>' +
      '<button type="button" class="btn btn-sm" data-act="ex-custom">+ Custom creature</button></div>';
    if (V.add) out += picker(ch, d, V, ws);
    if (ws) out += '<p class="muted2" style="margin:0;font-size:12px">Wild Shape (Druid ' + ws.level + '): up to ' + ws.known + ' known forms, max CR ' + ws.maxCrText + (ws.fly ? '' : ', no Fly Speed') + '. Each use gives ' + ws.temp + ' temporary HP and lasts ' + ws.hours + ' hour' + (ws.hours === 1 ? '' : 's') + '.</p>';
    if (!list.length) return out + '<div class="empty"><b style="color:var(--ink)">No extras yet</b><span>Add a companion, familiar, mount, summon or Wild Shape form. You can track its hit points and roll its attacks here.</span></div>';
    ROLES.forEach(function (r) {
      var group = list.filter(function (x) { return (x.role || 'other') === r[0]; });
      if (!group.length) return;
      out += '<span class="h-sec">' + h(r[0] === 'wildshape' ? 'Wild Shape forms' : r[1] + (group.length > 1 ? 's' : '')) + '</span>' + group.map(function (x) { return card(ch, d, x, V, ws, active); }).join('');
    });
    return out;
  }

  /** Creatures your class features, feats and spells give you (from your modules), grouped by what grants them. */
  function featureCreatures(ch, d) {
    var on = C.on(ch), groups = {};
    var norm = function (n) { return String(n || '').toLowerCase().replace(/^the /, ''); };
    var subs = (d.classes || []).filter(function (c) { return c.sub; }).map(function (c) { return { cls: c.id, name: norm(c.sub.name), level: c.level }; });
    var featNames = (d.feats || []).map(function (f) { return f.name.toLowerCase(); });
    var spellIds = d.spell ? d.spell.spells.map(function (s) { return s.id; }) : [];
    C.all('creatures', on).forEach(function (c) {
      var o = c.owner; if (!o) return;
      var ok = false, key = '', label = '';
      if (o.subName) {
        var want = norm(o.subName);
        var sb = subs.find(function (x) { return x.cls === o.cls && (x.name === want || x.name.indexOf(want) >= 0 || want.indexOf(x.name) >= 0); });
        ok = !!sb && sb.level >= (o.level || 1); key = 'f-' + slugish(o.feature || o.subName); label = o.feature || o.subName;
      } else if (o.cls) { var cl = (d.classes || []).find(function (x) { return x.id === o.cls; }); ok = !!cl && cl.level >= (o.level || 1); key = 'f-' + slugish(o.feature || o.cls); label = o.feature || o.cls; }
      else if (o.feat) { ok = featNames.indexOf(String(o.feat).toLowerCase()) >= 0; key = 'feat-' + slugish(o.feat); label = o.feat; }
      else if (o.spell) { ok = spellIds.indexOf(o.spell) >= 0; key = 'sp-' + o.spell; var sd = C.get('spells', o.spell, on); label = sd ? sd.name : o.spell; }
      if (!ok) return;
      groups[key] = groups[key] || { key: key, label: label, spell: !!o.spell, items: [] };
      groups[key].items.push(c);
    });
    return Object.keys(groups).map(function (k) { return groups[k]; });
  }
  function slugish(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

  function picker(ch, d, V, ws) {
    var on = C.on(ch), all = C.all('creatures', on), q = (V.q || '').toLowerCase();
    var head = '', role = V.add;
    var list = all;
    if (role === 'familiar') {
      var chain = (d.features || []).some(function (f) { return /Pact of the Chain/i.test(f.name); });
      list = all.filter(function (c) { return FAMILIAR_FORMS.indexOf(c.id) >= 0 || (/^Beast/.test(c.type) && crNum(c.cr) === 0) || (chain && CHAIN_FORMS.indexOf(c.id) >= 0); });
      head = '<p class="why">Find Familiar: a spirit in the form of a Bat, Cat, Frog, Hawk, Lizard, Octopus, Owl, Rat, Raven, Spider, Weasel or another CR 0 Beast' + (chain ? ', or a special Pact of the Chain form' : '') + '. It is a Celestial, Fey or Fiend instead of a Beast.</p>' +
        '<div class="seg">' + ['Celestial', 'Fey', 'Fiend'].map(function (t) { return '<button type="button" data-act="ex-ctype" data-arg="' + t + '" aria-pressed="' + ((V.ctype || 'Fey') === t) + '">' + t + '</button>'; }).join('') + '</div>';
    } else if (role === 'steed') {
      var maxSlot = d.spell ? Math.max.apply(null, [2].concat(d.spell.slots.map(function (s) { return s.level; }))) : 2;
      var lv = Math.min(Math.max(2, +V.slevel || 2), Math.max(2, maxSlot));
      return '<section class="ex-pick"><p class="why">Find Steed summons an Otherworldly Steed. Its AC, HP and attack grow with the spell level; at level 4+ it can fly.</p>' +
        '<div class="seg">' + ['Celestial', 'Fey', 'Fiend'].map(function (t) { return '<button type="button" data-act="ex-ctype" data-arg="' + t + '" aria-pressed="' + ((V.ctype || 'Celestial') === t) + '">' + t + '</button>'; }).join('') + '</div>' +
        '<label class="b-field" style="max-width:220px">Spell level<select data-act="ex-slevel" aria-label="Spell level">' + [2, 3, 4, 5, 6, 7, 8, 9].filter(function (n) { return n <= Math.max(2, maxSlot); }).map(function (n) { return '<option' + (n === lv ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' +
        '<div style="display:flex;gap:8px"><button type="button" class="btn btn-teal" data-act="ex-add-steed">Add Otherworldly Steed</button><button type="button" class="btn" data-act="ex-start" data-arg="">Cancel</button></div></section>';
    } else if (role.indexOf('feat:') === 0) {
      var g = featureCreatures(ch, d).find(function (x) { return 'feat:' + x.key === role; });
      list = g ? g.items.map(function (c) { var cc = U.clone(c); if (cc.scaled) R.scaleCreature(cc, d); return cc; }) : [];
      head = '<p class="why">' + h(g ? g.label : '') + ': choose the creature. Its numbers grow with your level and use your modifiers, so they stay up to date on their own.</p>';
    } else if (role === 'wildshape') {
      list = all.filter(function (c) { return /^Beast/.test(c.type); });
      head = '<p class="why">Pick Beasts you have seen. Forms above your limit are shown greyed out with the reason.</p>';
    }
    if (q) list = list.filter(function (c) { return c.name.toLowerCase().indexOf(q) >= 0 || (c.type || '').toLowerCase().indexOf(q) >= 0; });
    if (V.group !== 'all' && role !== 'familiar' && role !== 'wildshape' && role.indexOf('feat:') !== 0) list = list.filter(function (c) { return V.group === 'books' ? c.source !== 'srd-5.2' : c.source === 'srd-5.2' && c.group === (V.group === 'animals' ? 'Animals' : 'Monsters'); });
    if (V.cr !== '' && V.cr != null) list = list.filter(function (c) { return crNum(c.cr) <= +V.cr; });
    list = list.slice().sort(function (a, b) { return crNum(a.cr) - crNum(b.cr) || a.name.localeCompare(b.name); });
    var shown = list.slice(0, 60);
    var rows = shown.map(function (c) {
      var block = role === 'wildshape' && ws ? R.wildShapeBlock(c, ws) : '';
      var spd = Object.keys(c.speed || {}).filter(function (k) { return k !== 'walk' && k !== 'hover'; }).map(function (k) { return k + ' ' + c.speed[k]; }).join(', ');
      return '<button type="button" class="ex-row" data-act="ex-add" data-arg="' + h(c.id) + '"' + (block ? ' disabled title="' + h(block) + '"' : '') + '><b>' + h(c.name) + '</b><span>' + h(c.size + ' ' + c.type) + '</span><span>CR ' + h(c.cr) + '</span><span>AC ' + c.ac + ' · HP ' + c.hp + '</span><span class="muted2">' + h((c.speed && c.speed.walk != null ? c.speed.walk + ' ft' : '') + (spd ? ' · ' + spd : '')) + (block ? ' · ' + h(block) : '') + '</span>' + (c.source && c.source !== 'srd-5.2' ? '<span class="tag">' + h(c.sourceName) + '</span>' : '') + '</button>';
    }).join('');
    var roleSel = role === 'any' ? '<label class="b-field" style="max-width:200px">Add as<select data-act="ex-role-new" aria-label="Add as">' + ROLES.filter(function (r) { return r[0] !== 'wildshape' && r[0] !== 'familiar'; }).map(function (r) { return '<option value="' + r[0] + '"' + ((V.newRole || 'companion') === r[0] ? ' selected' : '') + '>' + r[1] + '</option>'; }).join('') + '</select></label>' : '';
    return '<section class="ex-pick">' + head +
      '<div class="ex-filters"><input type="search" data-act="ex-q" data-key="ex-q" value="' + h(V.q || '') + '" placeholder="Search by name or type (wolf, fiend…)" aria-label="Search creatures">' +
      (role !== 'familiar' && role !== 'wildshape' && role.indexOf('feat:') !== 0 ? '<select data-act="ex-group" aria-label="Group"><option value="all"' + (V.group === 'all' ? ' selected' : '') + '>All creatures</option><option value="animals"' + (V.group === 'animals' ? ' selected' : '') + '>Animals (SRD)</option><option value="monsters"' + (V.group === 'monsters' ? ' selected' : '') + '>Monsters (SRD)</option><option value="books"' + (V.group === 'books' ? ' selected' : '') + '>From your books</option></select>' : '') +
      '<select data-act="ex-cr" aria-label="Maximum CR"><option value="">Any CR</option>' + [0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 8, 10].map(function (n) { return '<option value="' + n + '"' + (String(V.cr) === String(n) ? ' selected' : '') + '>CR ' + ({ 0.125: '1/8', 0.25: '1/4', 0.5: '1/2' }[n] || n) + ' or lower</option>'; }).join('') + '</select>' + roleSel + '</div>' +
      '<div class="ex-list">' + (rows || '<span class="muted2">No creatures match.</span>') + '</div>' +
      (list.length > shown.length ? '<span class="muted2" style="font-size:12px">Showing 60 of ' + list.length + '. Search to narrow it down.</span>' : '') +
      '<div><button type="button" class="link-btn" data-act="ex-start" data-arg="">Close</button></div></section>';
  }

  function card(ch, d, x, V, ws, active) {
    var c = R.extraCreature(ch, d, x), P = play();
    if (!c) return '<div class="ex-card"><b>' + h(x.nick || x.ref) + '</b><span class="muted2">This creature’s module is turned off or missing.</span><button type="button" class="small-out" data-act="ex-del" data-arg="' + h(x.id) + '">Remove</button></div>';
    var open = !!(V.open[x.id] || x.editing), maxHp = c.hp, hp = Math.max(0, maxHp - (x.hpLost || 0));
    var isWs = x.role === 'wildshape', isActive = active && active.id === x.id;
    var wsRes = d.resources.find(function (r) { return r.id === 'wild-shape'; });
    var head = '<div class="ex-head"><button type="button" class="ex-toggle" data-act="ex-open" data-arg="' + h(x.id) + '" aria-expanded="' + open + '"><b>' + h(x.nick || c.name) + '</b>' + (x.nick ? ' <span class="muted2">(' + h(c.name) + ')</span>' : '') +
      '<span class="muted2" style="font-size:12px">' + h(c.size + ' ' + c.type + (c.cr && c.cr !== 'None' ? ' · CR ' + c.cr : '')) + '</span></button>' +
      '<span class="ex-quick"><span title="Armor Class"><small>AC</small> ' + c.ac + '</span>' + (isWs ? '' : '<span title="Hit points"><small>HP</small> ' + hp + '/' + maxHp + (x.temp ? ' +' + x.temp : '') + '</span>') + '<span title="Speed"><small>Speed</small> ' + h(speedText(c)) + '</span></span></div>';
    var ctrl = '';
    if (isWs) {
      ctrl = '<div class="ex-ctrl">' + (isActive ? '<span class="badge">Active form</span><button type="button" class="btn btn-sm" data-act="ex-revert">Return to normal form</button>'
        : '<button type="button" class="btn btn-sm btn-teal" data-act="ex-ws" data-arg="' + h(x.id) + '"' + (wsRes && wsRes.used >= wsRes.max ? ' disabled' : '') + '>Wild Shape into this form</button>' + (wsRes ? '<span class="muted2" style="font-size:12px">' + (wsRes.max - wsRes.used) + ' of ' + wsRes.max + ' uses left</span>' : '')) + '</div>';
    } else if (P) {
      ctrl = '<div class="ex-ctrl"><input type="number" min="0" class="ex-amt" data-act="ex-amt" data-arg="' + h(x.id) + '" data-key="ex-amt-' + h(x.id) + '" value="' + h(V['amt' + x.id] || 1) + '" aria-label="Amount">' +
        '<button type="button" class="small-out" data-act="ex-hp" data-arg="' + h(x.id) + ':dmg">Damage</button><button type="button" class="small-out" data-act="ex-hp" data-arg="' + h(x.id) + ':heal">Heal</button><button type="button" class="small-out" data-act="ex-hp" data-arg="' + h(x.id) + ':temp">Temp HP</button>' +
        (x.hpLost || x.temp ? '<button type="button" class="small-out" data-act="ex-hp" data-arg="' + h(x.id) + ':full">Full HP</button>' : '') + '</div>';
    }
    var acts = rollables(x, c);
    var body = open ? statBlock(x, c) : (acts ? '<div class="ex-acts">' + acts + '</div>' : '');
    var foot = open ? '<div class="ex-foot"><label class="b-field" style="flex:1 1 180px">Name<input type="text" data-act="ex-nick" data-arg="' + h(x.id) + '" data-key="ex-nick-' + h(x.id) + '" value="' + h(x.nick || '') + '" placeholder="' + h(c.name) + '"></label>' +
      (isWs || x.ref === 'special:otherworldly-steed' ? '' : '<label class="b-field" style="flex:0 1 180px">Role<select data-act="ex-role" data-arg="' + h(x.id) + '">' + ROLES.map(function (r) { return '<option value="' + r[0] + '"' + (x.role === r[0] ? ' selected' : '') + '>' + r[1] + '</option>'; }).join('') + '</select></label>') +
      '<label class="b-field" style="flex:1 1 100%">Notes<textarea rows="2" class="note-area" data-act="ex-notes" data-arg="' + h(x.id) + '" data-key="ex-notes-' + h(x.id) + '" placeholder="Tricks it knows, where it is, its personality…">' + h(x.notes || '') + '</textarea></label>' +
      '<button type="button" class="small-out" data-act="ex-del" data-arg="' + h(x.id) + '">Remove</button></div>' : '';
    if (x.editing) body = editor(x, c);
    return '<div class="ex-card' + (isActive ? ' on' : '') + '">' + head + ctrl + body + foot + '</div>';
  }

  function speedText(c) {
    var s = c.speed || {}, parts = [];
    if (s.walk != null) parts.push(s.walk + ' ft');
    ['fly', 'swim', 'climb', 'burrow'].forEach(function (k) { if (s[k]) parts.push(k + ' ' + s[k]); });
    return parts.join(', ') || c.speedText || '—';
  }
  function rollables(x, c) {
    return ['actions', 'bonus', 'reactions'].reduce(function (a, k) { return a.concat(c[k] || []); }, []).map(function (a, i) {
      var out = '';
      if (a.atk) {
        out += '<button type="button" class="mini-roll rollable" data-act="ex-roll" data-arg="' + h(x.id + '|hit|' + i) + '" aria-label="Roll ' + h(a.name) + ' attack">' + h(a.name) + ' ' + sg(a.atk.hit) + '</button>';
        out += '<button type="button" class="mini-roll rollable" data-act="ex-roll" data-arg="' + h(x.id + '|dmg|' + i) + '" aria-label="Roll ' + h(a.name) + ' damage">' + h(a.atk.dice ? a.atk.dice + (a.atk.mod ? ' ' + sg(a.atk.mod).replace('−', '− ').replace('+', '+ ') : '') : a.atk.flat) + ' ' + h(a.atk.type) + (a.atk.plus ? ' + ' + h(a.atk.plus.dice + ' ' + a.atk.plus.type) : '') + '</button>';
      } else if (a.save && a.save.dice) {
        out += '<button type="button" class="mini-roll rollable" data-act="ex-roll" data-arg="' + h(x.id + '|save|' + i) + '" aria-label="Roll ' + h(a.name) + ' damage">' + h(a.name.replace(/ \(.*\)$/, '')) + ' DC ' + a.save.dc + ' ' + ABBR[a.save.ability] + ' · ' + h(a.save.dice + (a.save.mod ? sg(a.save.mod) : '') + ' ' + a.save.type) + '</button>';
      } else if (a.heal) {
        out += '<button type="button" class="mini-roll rollable" data-act="ex-roll" data-arg="' + h(x.id + '|heal|' + i) + '">' + h(a.name.replace(/ \(.*\)$/, '')) + ' · ' + h(a.heal.dice + ' + ' + a.heal.mod) + '</button>';
      }
      return out;
    }).join('');
  }
  function statBlock(x, c) {
    var sec = function (title, list) {
      if (!list || !list.length) return '';
      return '<div class="ex-sec"><b class="ex-sec-h">' + h(title) + '</b>' + list.map(function (e) { return '<p><strong>' + h(e.name) + (e.name ? '.' : '') + '</strong> ' + h(e.text) + '</p>'; }).join('') + '</div>';
    };
    var abil = '<div class="ex-abil">' + Object.keys(ABBR).map(function (k) {
      var sc = (c.scores || {})[k] || 10, m = mod(sc), sv = c.saves && c.saves[k] != null ? c.saves[k] : m;
      return '<button type="button" class="rollable" data-act="ex-roll" data-arg="' + h(x.id + '|abil|' + k) + '" aria-label="' + ABBR[k] + ' ' + sc + ', roll check"><span class="k">' + ABBR[k] + '</span><span class="v">' + sc + '</span><span class="m">' + sg(m) + (sv !== m ? ' <small>save ' + sg(sv) + '</small>' : '') + '</span></button>';
    }).join('') + '</div>';
    var line = function (k, v) { return v ? '<span><strong>' + k + '</strong> ' + h(v) + '</span>' : ''; };
    return '<div class="ex-block">' +
      '<div class="ex-stats"><span><strong>AC</strong> ' + c.ac + (c.acNote ? ' (' + h(c.acNote) + ')' : '') + '</span><span><strong>HP</strong> ' + c.hp + (c.hd ? ' (' + h(c.hd) + ')' : '') + '</span><span><strong>Speed</strong> ' + h(speedText(c)) + '</span>' +
      '<button type="button" class="mini-roll rollable" data-act="ex-roll" data-arg="' + h(x.id + '|init|0') + '">Initiative ' + sg(c.init != null ? c.init : mod((c.scores || {}).dex || 10)) + '</button></div>' + abil +
      '<div class="ex-lines">' + line('Skills', c.skills) + line('Vulnerabilities', c.vuln) + line('Resistances', c.res) + line('Immunities', c.imm) + line('Senses', c.senses) + line('Languages', c.languages) + line('CR', c.cr && c.cr !== 'None' ? c.cr + (c.xp ? ' (XP ' + c.xp + ')' : '') : '') + '</div>' +
      (x.role === 'familiar' ? '<p class="muted2" style="margin:0;font-size:12px">A familiar can’t attack unless a feature says so (like Pact of the Chain).</p>' : '') +
      (x.role === 'wildshape' ? '<p class="muted2" style="margin:0;font-size:12px">In this form you use its STR, DEX, CON, speeds and attacks, but keep your own HP, INT, WIS, CHA, features and proficiencies (use the higher bonus).</p>' : '') +
      '<div class="ex-acts">' + rollables(x, c) + '</div>' +
      sec('Traits', c.traits) + sec('Actions', c.actions) + sec('Bonus Actions', c.bonus) + sec('Reactions', c.reactions) + sec('Legendary Actions', c.legendary) +
      (x.custom ? '<div><button type="button" class="small-out" data-act="ex-edit" data-arg="' + h(x.id) + '">Edit stat block</button></div>' : '') +
      (c.source === 'srd-5.2' || !c.source && !x.custom ? '<span class="muted2" style="font-size:11px">From the SRD 5.2.1 (CC-BY-4.0).</span>' : c.sourceName ? '<span class="muted2" style="font-size:11px">From ' + h(c.sourceName) + '.</span>' : '') + '</div>';
  }

  /* custom creature editor */
  function editor(x, c) {
    var f = function (k, label, val, type, w) { return '<label class="b-field" style="flex:' + (w || '1 1 120px') + '">' + label + '<input type="' + (type || 'text') + '" data-act="ex-cf" data-arg="' + h(x.id + '|' + k) + '" data-key="ex-cf-' + h(x.id + k) + '" value="' + h(val == null ? '' : val) + '"></label>'; };
    var atks = (c.actions || []).map(function (a, i) {
      var t = a.atk || {};
      return '<div class="ex-atk-row">' + f('atk.' + i + '.name', 'Attack', a.name, 'text', '2 1 140px') + f('atk.' + i + '.hit', 'To hit', t.hit, 'number', '0 1 80px') + f('atk.' + i + '.dice', 'Damage dice', t.dice || '', 'text', '0 1 100px') + f('atk.' + i + '.mod', '+ bonus', t.mod || 0, 'number', '0 1 80px') + f('atk.' + i + '.type', 'Type', t.type || '', 'text', '1 1 110px') +
        '<button type="button" class="small-out" data-act="ex-cf-del" data-arg="' + h(x.id + '|' + i) + '" aria-label="Remove attack">×</button></div>';
    }).join('');
    return '<div class="ex-block ex-edit"><div class="ex-grid">' + f('name', 'Creature name', c.name, 'text', '2 1 200px') + f('size', 'Size', c.size) + f('type', 'Type', c.type) + f('cr', 'CR', c.cr, 'text', '0 1 80px') +
      f('ac', 'AC', c.ac, 'number', '0 1 80px') + f('hp', 'Max HP', c.hp, 'number', '0 1 90px') + f('speed.walk', 'Speed', (c.speed || {}).walk, 'number', '0 1 90px') + f('speed.fly', 'Fly', (c.speed || {}).fly, 'number', '0 1 80px') + f('speed.swim', 'Swim', (c.speed || {}).swim, 'number', '0 1 80px') + f('speed.climb', 'Climb', (c.speed || {}).climb, 'number', '0 1 80px') + '</div>' +
      '<div class="ex-grid">' + Object.keys(ABBR).map(function (k) { return f('scores.' + k, ABBR[k], (c.scores || {})[k], 'number', '0 1 80px'); }).join('') + '</div>' +
      '<b class="ex-sec-h">Attacks</b>' + atks + '<div><button type="button" class="small-out" data-act="ex-cf-add" data-arg="' + h(x.id) + '">+ Add attack</button></div>' +
      '<label class="b-field">Traits and other actions<textarea rows="3" class="note-area" data-act="ex-cf" data-arg="' + h(x.id + '|traitsText') + '" data-key="ex-cf-' + h(x.id) + 'tt" placeholder="Keen Smell. Advantage on Perception checks that rely on smell.">' + h(c.traitsText || '') + '</textarea></label>' +
      '<div><button type="button" class="btn btn-sm btn-teal" data-act="ex-edit" data-arg="' + h(x.id) + '">Done</button></div></div>';
  }

  /* ---------- handlers ---------- */
  var H = app.handlers;
  function save(ch, rerender) { if (!CF.store.put(ch)) app.flash('Couldn’t save: storage is full or blocked.', true); if (rerender !== false) app.render(); }
  function find(ch, id) { return (ch.extras || []).find(function (x) { return x.id === id; }); }
  function mutate(id, fn, rerender) { var ch = cur(); if (!ch) return; var x = id ? find(ch, id) : null; if (id && !x) return; fn(ch, x); save(ch, rerender); }
  function addExtra(ch, x) { ch.extras = ch.extras || []; x.id = U.uid(); x.hpLost = 0; x.temp = 0; ch.extras.push(x); return x; }

  H['ex-start'] = function (k) { var V = xview(); V.add = V.add === k || !k ? null : k; V.q = ''; app.render(); };
  H['ex-q'] = function (a, el) { xview().q = el.value; app.render(); };
  H['ex-group'] = function (a, el) { xview().group = el.value; app.render(); };
  H['ex-cr'] = function (a, el) { xview().cr = el.value; app.render(); };
  H['ex-role-new'] = function (a, el) { xview().newRole = el.value; };
  H['ex-ctype'] = function (t) { xview().ctype = t; app.render(); };
  H['ex-slevel'] = function (a, el) { xview().slevel = +el.value; app.render(); };
  H['ex-open'] = function (id) { var V = xview(); V.open[id] = !V.open[id]; app.render(); };
  H['ex-add'] = function (ref) {
    var V = xview(), role = V.add === 'any' ? (V.newRole || 'companion') : V.add;
    if (role && role.indexOf('feat:') === 0) role = /^feat:sp-/.test(role) ? 'summon' : 'companion';
    mutate(null, function (ch) {
      if (role === 'familiar') ch.extras = (ch.extras || []).filter(function (x) { return x.role !== 'familiar'; });   // one familiar at a time
      var x = addExtra(ch, { ref: ref, role: role, opts: role === 'familiar' ? { ctype: V.ctype || 'Fey' } : {} });
      V.open[x.id] = false;
      var c = R.extraCreature(ch, R.derive(ch), x);
      app.flash((c ? c.name : 'Creature') + ' added' + (role === 'wildshape' ? ' as a Wild Shape form.' : role === 'familiar' ? ' as your familiar.' : '.'));
    });
    if (V.add !== 'wildshape') V.add = null;
    app.render();
  };
  H['ex-add-steed'] = function () {
    var V = xview();
    mutate(null, function (ch) {
      ch.extras = (ch.extras || []).filter(function (x) { return x.ref !== 'special:otherworldly-steed'; });
      addExtra(ch, { ref: 'special:otherworldly-steed', role: 'mount', opts: { ctype: V.ctype || 'Celestial', level: V.slevel || 2 } });
    });
    V.add = null; app.render();
  };
  H['ex-custom'] = function () {
    mutate(null, function (ch) {
      var x = addExtra(ch, { ref: null, role: 'companion', custom: { name: 'New creature', size: 'Medium', type: 'Beast', ac: 12, hp: 10, cr: '', speed: { walk: 30 }, scores: { str: 10, dex: 10, con: 10, int: 3, wis: 10, cha: 5 }, actions: [] } });
      x.editing = true; xview().open[x.id] = true;
    });
  };
  H['ex-edit'] = function (id) { mutate(id, function (ch, x) { x.editing = !x.editing; if (!x.editing) delete x.editing; }); };
  H['ex-cf'] = function (arg, el) {
    var p = arg.split('|'), path = p[1].split('.');
    mutate(p[0], function (ch, x) {
      var c = x.custom; if (!c) return;
      var v = el.type === 'number' ? (el.value === '' ? null : +el.value) : el.value;
      if (path[0] === 'atk') {
        var a = c.actions[+path[1]]; if (!a) return;
        if (path[2] === 'name') a.name = v; else { a.atk = a.atk || { kind: 'melee', hit: 0, dice: '', mod: 0, type: '' }; a.atk[path[2]] = v; }
        a.text = (a.atk && a.atk.hit != null ? 'Attack Roll: ' + sg(a.atk.hit || 0) + '. Hit: ' + (a.atk.dice || '') + (a.atk.mod ? ' ' + sg(a.atk.mod) : '') + ' ' + (a.atk.type || '') + ' damage.' : '');
      } else if (path.length === 2) { c[path[0]] = c[path[0]] || {}; c[path[0]][path[1]] = v; }
      else if (path[0] === 'traitsText') { c.traitsText = v; c.traits = String(v || '').split('\n').filter(Boolean).map(function (l) { var m = /^([^.]{1,40})\.\s*(.*)$/.exec(l); return m ? { name: m[1], text: m[2] } : { name: '', text: l }; }); }
      else c[path[0]] = v;
    }, false);
  };
  H['ex-cf-add'] = function (id) { mutate(id, function (ch, x) { x.custom.actions = x.custom.actions || []; x.custom.actions.push({ name: 'Attack', text: '', atk: { kind: 'melee', hit: 3, dice: '1d6', mod: 1, type: 'piercing' } }); }); };
  H['ex-cf-del'] = function (arg) { var p = arg.split('|'); mutate(p[0], function (ch, x) { x.custom.actions.splice(+p[1], 1); }); };
  H['ex-del'] = function (id) {
    mutate(id, function (ch, x) {
      ch.extras = ch.extras.filter(function (e) { return e.id !== id; });
      if (ch.play && ch.play.wildShape === id) delete ch.play.wildShape;
    });
  };
  H['ex-nick'] = function (id, el) { mutate(id, function (ch, x) { x.nick = el.value.slice(0, 40); }, false); };
  H['ex-notes'] = function (id, el) { mutate(id, function (ch, x) { x.notes = el.value; }, false); };
  H['ex-role'] = function (id, el) { mutate(id, function (ch, x) { x.role = el.value; }); };
  H['ex-amt'] = function (id, el) { xview()['amt' + id] = el.value; };
  H['ex-hp'] = function (arg) {
    var p = arg.split(':'), n = Math.max(0, parseInt(xview()['amt' + p[0]] || 1, 10) || 0);
    mutate(p[0], function (ch, x) {
      var c = R.extraCreature(ch, R.derive(ch), x), max = c ? c.hp : 0;
      if (p[1] === 'dmg') { var t = Math.min(x.temp || 0, n); x.temp = (x.temp || 0) - t; x.hpLost = Math.min(max, (x.hpLost || 0) + n - t); }
      else if (p[1] === 'heal') x.hpLost = Math.max(0, (x.hpLost || 0) - n);
      else if (p[1] === 'temp') x.temp = Math.max(x.temp || 0, n);
      else { x.hpLost = 0; x.temp = 0; }
      if (c && x.hpLost >= max && p[1] === 'dmg') app.flash((x.nick || c.name) + ' drops to 0 HP.' + (x.role === 'familiar' ? ' The familiar disappears until you cast Find Familiar again.' : x.ref === 'special:otherworldly-steed' ? ' The steed disappears.' : ''));
    });
  };
  H['ex-ws'] = function (id) {
    mutate(id, function (ch, x) {
      var d = R.derive(ch), ws = R.wildShapeInfo(d), res = d.resources.find(function (r) { return r.id === 'wild-shape'; });
      if (!ws) return;
      if (res && res.used >= res.max) { app.flash('No Wild Shape uses left. They come back on a rest.', true); return; }
      ch.play = ch.play || R.freshPlayState();
      ch.play.resourcesUsed = ch.play.resourcesUsed || {}; ch.play.resourcesUsed['wild-shape'] = (ch.play.resourcesUsed['wild-shape'] || 0) + 1;
      ch.play.wildShape = id; ch.play.temp = Math.max(ch.play.temp || 0, ws.temp);
      var c = R.extraCreature(ch, d, x);
      app.flash('Wild Shape: you become a ' + (c ? c.name.toLowerCase() : 'beast') + ' and gain ' + ws.temp + ' temporary HP.');
    });
  };
  H['ex-revert'] = function () { mutate(null, function (ch) { if (ch.play) delete ch.play.wildShape; app.flash('You return to your normal form.'); }); };
  H['ex-roll'] = function (arg) {
    var p = arg.split('|'), ch = cur(); if (!ch) return;
    var x = find(ch, p[0]); if (!x) return;
    var d = R.derive(ch), c = R.extraCreature(ch, d, x); if (!c) return;
    var who = x.nick || c.name;
    if (p[1] === 'abil') { var sc = (c.scores || {})[p[2]] || 10; app.roll(who + ' · ' + ABBR[p[2]] + ' check', 1, 20, mod(sc)); }
    else if (p[1] === 'init') app.roll(who + ' · Initiative', 1, 20, c.init != null ? c.init : mod((c.scores || {}).dex || 10));
    else {
      var all = ['actions', 'bonus', 'reactions'].reduce(function (a, k) { return a.concat(c[k] || []); }, []), a = all[+p[2]]; if (!a) return;
      if (p[1] === 'hit') {
        var r = app.roll(who + ' · ' + a.name + ' attack', 1, 20, a.atk.hit);
        if (r.rolls[0] === 20) { app.critActive = { label: who + ' ' + a.name }; app.lastRoll.detail += ' · Critical hit'; } else app.critActive = null;
      } else if (p[1] === 'dmg') {
        var crit = !!app.critActive;
        if (a.atk.dice) {
          var m = /^(\d+)d(\d+)$/.exec(a.atk.dice);
          var r1 = crit ? app.rollCrit(who + ' · ' + a.name + ' (' + a.atk.type + ')', +m[1], +m[2], a.atk.mod || 0) : app.roll(who + ' · ' + a.name + ' (' + a.atk.type + ')', +m[1], +m[2], a.atk.mod || 0);
          if (a.atk.plus) {
            var m2 = /^(\d+)d(\d+)$/.exec(a.atk.plus.dice), r2 = app.roll('x', +m2[1], +m2[2] * 1, a.atk.plus.mod || 0);
            app.lastRoll = { label: who + ' · ' + a.name, total: r1.total + r2.total, nat: 0, detail: r1.total + ' ' + a.atk.type + ' + ' + r2.total + ' ' + a.atk.plus.type + ' (' + a.atk.plus.dice + ' [' + r2.rolls.join(', ') + '])' };
            if (CF.dice) CF.dice.show(Object.assign({ sides: +m2[2], rolls: r2.rolls }, app.lastRoll));
          }
        } else app.lastRoll = { label: who + ' · ' + a.name, total: a.atk.flat || 1, nat: 0, detail: 'Fixed damage: ' + (a.atk.flat || 1) + ' ' + a.atk.type };
        app.critActive = null;
      } else if (p[1] === 'save' && a.save && a.save.dice) app.rollDice(who + ' · ' + a.name.replace(/ \(.*\)$/, '') + ' (' + a.save.type + ', DC ' + a.save.dc + ' ' + ABBR[a.save.ability] + ')', a.save.dice, a.save.mod || 0);
      else if (p[1] === 'heal' && a.heal) app.rollDice(who + ' · ' + a.name.replace(/ \(.*\)$/, '') + ' (healing)', a.heal.dice, a.heal.mod || 0);
    }
    app.render();
  };
})(window);
