/* Character Forge — modules: the list of content packs, and an editor for making your own. */
(function (root) {
  'use strict';
  var CF = root.CF, U = CF.util, R = CF.rules, C = CF.content, app = CF.app, h = U.esc;

  var TYPES = [
    ['subclasses', 'Subclasses', 'subclass'], ['species', 'Species', 'species'], ['backgrounds', 'Backgrounds', 'background'],
    ['feats', 'Feats', 'feat'], ['spells', 'Spells', 'spell'], ['items', 'Items', 'item']
  ];
  var ABIL = R.ABILITIES.map(function (a) { return [a.id, a.abbr]; });
  var DAMAGE = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
  var SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];
  var CASTERS = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'];
  var PROPS = ['ammunition', 'finesse', 'heavy', 'light', 'loading', 'reach', 'thrown', 'two-handed', 'versatile'];
  var TIMES = [['', 'Not an action'], ['Action', 'Action'], ['Bonus Action', 'Bonus Action'], ['Reaction', 'Reaction'], ['Other', 'Other / free']];

  function slug(s) { return String(s || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function mv() { var v = app.view; v.me = v.me || { tab: 'subclasses', edit: null }; return v.me; }
  function mine(id) { return CF.store.modules().find(function (m) { return m.id === id; }) || null; }
  function isMine(id) { var m = mine(id); return !!(m && m.madeHere); }   // only modules made in the editor can be edited
  function offList() { return CF.store.settings().modulesOff || []; }

  /* ---------- turning editor fields into what the rules engine reads ---------- */
  function T20(from, value) { var out = []; for (var l = 1; l <= 20; l++) out.push(l >= from ? value : 0); return out; }
  function compile(type, e) {
    if (type === 'subclasses') {
      e.resources = [];
      (e.features || []).forEach(function (f) {
        var rid = null;
        if (f.uses || f.usesMod) {
          rid = e.id + '-' + slug(f.name || 'feature');
          var r = { id: rid, name: f.name || 'Feature', recharge: f.recharge || 'long' };
          if (f.usesMod) { r.usesMod = f.usesMod; r.fromLevel = +f.level || 1; } else r.uses = T20(+f.level || 1, +f.uses);
          e.resources.push(r);
        }
        var m = /^(\d+)d(\d+)$/.exec((f.dice || '').trim());
        if (f.time || m) f.action = { time: f.time || 'Other', resource: rid, rolls: m ? [[m[0] + ' ' + (f.name || ''), +m[1], +m[2], 0]] : [] };
        else delete f.action;
        f.level = +f.level || 3;
      });
      e.alwaysPrepared = (e.spells || []).filter(function (x) { return x.spell; }).map(function (x) { return { level: +x.level || 3, spell: x.spell }; });
    } else if (type === 'species') {
      e.speed = +e.speed || 30;
      e.senses = +e.darkvision ? { darkvision: +e.darkvision } : undefined;
      e.sizeChoice = e.sizeMode === 'choice';
      e.size = e.sizeMode === 'Small' ? 'Small' : 'Medium';
      e.defenses = (e.resist || []).map(function (t) { return { kind: 'resist', text: cap(t) }; });
      e.traits = (e.traits || []).filter(function (t) { return t.name || t.text; });
    } else if (type === 'backgrounds') {
      e.tool = e.toolMode === 'choose' ? { choose: e.toolGroup || 'gaming-set' } : e.toolItem ? { fixed: e.toolItem } : undefined;
      var items = (e.equipA || []).filter(function (x) { return x.item; }).map(function (x) { return [x.item, +x.qty || 1]; });
      var names = items.map(function (it) { var d = C.get('items', it[0]); return (it[1] > 1 ? it[1] + ' ' : '') + (d ? d.name : it[0]); });
      e.equipment = { A: { items: items, gp: +e.equipGp || 0, text: names.concat(+e.equipGp ? [e.equipGp + ' GP'] : []).join(', ') || 'Nothing' }, B: { items: [], gp: 50, text: '50 GP' } };
    } else if (type === 'feats') {
      e.asi = e.asiMode === 'flex' ? 'flex' : e.asiMode === 'pick' && (e.asiList || []).length ? e.asiList.slice() : undefined;
      if (e.category === 'epic') e.asiCap = 30;
      e.prereq = +e.prereqLevel > 1 ? { level: +e.prereqLevel } : undefined;
    } else if (type === 'spells') {
      e.level = +e.level || 0;
      e.components = ['V', 'S', 'M'].filter(function (k) { return (e.comp || []).indexOf(k) >= 0; }).join(', ') + ((e.comp || []).indexOf('M') >= 0 && e.material ? ' (' + e.material + ')' : '');
      e.componentsShort = e.components.replace(/\s*\(.*\)$/, '');
      var cd = /(\d+)\s*(minute|hour)/i.exec(e.duration || '');
      e.concDuration = e.concentration && cd ? cd[1] + ' ' + (/min/i.test(cd[2]) ? 'min' : cd[1] === '1' ? 'hour' : 'hours') : undefined;
      if (e.attackMode && e.attackMode !== 'none') e.attack = e.attackMode; else delete e.attack;
      if (!e.save) delete e.save;
      var dm = /^(\d+)d(\d+)$/.exec((e.dice || '').trim());
      e.effect = dm ? { dice: dm[0], type: e.dmgType || '', addMod: !!e.addMod } : { text: e.summary || '' };
      if (dm && e.summary) e.effect.text = e.summary;
      e.upcast = /^\d+d\d+$/.test((e.upcastDice || '').trim()) ? { dice: e.upcastDice.trim() } : undefined;
      e.higher = e.higherText || undefined;
      e.text = (e.body || '') + (e.higherText ? '\nUsing a Higher-Level Spell Slot. ' + e.higherText : '');
    } else if (type === 'items') {
      e.w = +e.w || 0; e.c = +e.c || 0;
      if (e.kind === 'weapon') { e.range = +e.rangeN ? [+e.rangeN, +e.rangeL || +e.rangeN * 4] : undefined; e.props = e.props || []; }
      if (e.kind === 'armor') { e.ac = +e.ac || 0; e.strength = +e.strength || undefined; }
    }
    return e;
  }
  function saveMod(m) { m.updatedAt = new Date().toISOString(); CF.store.saveModule(m); }

  /* ---------- the Modules page ---------- */
  CF.ui.modules = function (route) {
    if (route && route.id) return editor(route.id);
    var off = offList(), v = mv();
    var cards = C.packs().map(function (p) {
      var counts = TYPES.concat([['classes', 'Classes', 'class']]).map(function (t) { var n = (p[t[0]] || []).length; return n ? n + ' ' + (n === 1 ? t[2] : t[1].toLowerCase()) : ''; }).filter(Boolean);
      var own = isMine(p.id), on = p.builtIn || off.indexOf(p.id) < 0;
      var actions = p.builtIn ? '<span class="muted2" style="font-size:13px">Always on</span>'
        : v.confirm === p.id
          ? '<span style="display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center"><span style="font-size:13px">Remove this module? Characters using it will show missing options.</span><button class="btn btn-sm btn-primary" data-act="mod-remove-yes" data-arg="' + h(p.id) + '">Remove</button><button class="btn btn-sm" data-act="mod-remove-no">Keep</button></span>'
          : '<span style="display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center">' +
            '<button type="button" class="switch" role="switch" aria-checked="' + on + '" data-act="mod-toggle" data-arg="' + h(p.id) + '" aria-label="Use ' + h(p.name) + '"></button><span style="font-size:13px;margin-right:6px">' + (on ? 'On' : 'Off') + '</span>' +
            (own ? '<a class="btn btn-sm btn-teal" href="#/modules/' + encodeURIComponent(p.id) + '">Edit</a>' : '') +
            '<button class="btn btn-sm" data-act="mod-export" data-arg="' + h(p.id) + '">Export</button>' +
            '<button class="btn btn-sm" data-act="mod-remove" data-arg="' + h(p.id) + '">Remove</button></span>';
      return '<article class="card mod-card"><div style="flex:1 1 320px;display:flex;flex-direction:column;gap:8px">' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><h2 style="margin:0;font-size:18px">' + h(p.name) + '</h2>' +
        '<span class="badge">' + (p.builtIn ? 'Built in' : own && p.madeHere ? 'Made here' : 'Imported') + '</span>' + (p.private ? '<span class="badge">Private</span>' : '') + '</div>' +
        (p.description ? '<p style="margin:0;font-size:14px" class="muted">' + h(p.description) + '</p>' : '') +
        (p.sourceBook ? '<span class="muted" style="font-size:13px">From: ' + h(p.sourceBook) + '</span>' : '') +
        '<div style="display:flex;flex-wrap:wrap;gap:6px">' + (counts.length ? counts.map(function (c) { return '<span class="tag">' + h(c) + '</span>'; }).join('') : '<span class="muted2" style="font-size:13px">Empty so far</span>') + '</div>' +
        '<span class="muted2" style="font-size:12px">Version ' + h(p.version || '1') + (p.license ? ' · ' + h(p.license) : '') + '</span></div>' + actions + '</article>';
    }).join('');
    return CF.ui.topbar() +
      '<main class="page" style="max-width:1180px;gap:20px">' +
      '<section class="home-hero"><h1>Modules</h1><p>A module is a pack of extra content: subclasses, species, backgrounds, feats, spells and items. Turn a module on and its options appear in the builders, Level up and the sheet.</p></section>' +
      CF.ui.notice() +
      '<div style="display:flex;flex-wrap:wrap;gap:10px"><button class="btn btn-teal" data-act="mod-new">New module</button>' +
      '<label class="btn">Import module files<input type="file" accept=".json,application/json" multiple class="sr-only" data-act="import"></label></div>' +
      cards +
      '<div class="notice">Books you bought elsewhere (like D&D Beyond) can’t be imported automatically. Make a module and type in the options you own: it stays on this device. Content from a book you own is for your own table, so only share the exported file with your group.</div>' +
      exportDialog() + '</main>';
  };

  function exportDialog() {
    var id = mv().exporting; if (!id) return '';
    var p = C.pack(id); if (!p) return '';
    var json = JSON.stringify(stripEditor(p), null, 2);
    return '<div role="dialog" aria-modal="true" aria-labelledby="mx-t" class="overlay"><div class="card settings">' +
      '<div style="display:flex;align-items:center;gap:8px"><h2 id="mx-t" style="margin:0;font-size:20px;flex:1">Export ' + h(p.name) + '</h2><button class="btn btn-ghost btn-sm" data-act="mod-export-close">Close</button></div>' +
      '<p class="muted" style="margin:0;font-size:13px">Save this as a <b>.json</b> file. Others can add it with “Import a module file”.' + (p.private ? ' This module is marked private: share it only with your own group.' : '') + '</p>' +
      '<div style="display:flex;gap:8px"><button class="btn btn-teal" data-act="mod-download" data-arg="' + h(id) + '">Download file</button><button class="btn" data-act="mod-copy" data-arg="' + h(id) + '">Copy</button></div>' +
      (mv().exportNote ? '<div class="notice">' + h(mv().exportNote) + '</div>' : '') +
      '<textarea readonly rows="10" style="width:100%;font-family:monospace;font-size:12px;border-radius:10px;border:1.5px solid var(--line2);background:var(--bg);color:var(--ink);padding:10px" aria-label="Module file contents">' + h(json) + '</textarea></div></div>';
  }
  function stripEditor(p) { return JSON.parse(JSON.stringify(p)); }

  /* ---------- the editor ---------- */
  function editor(id) {
    var m = mine(id), v = mv();
    if (!m || !m.madeHere) return CF.ui.topbar() + '<main class="page"><div class="empty"><b>Module not found</b><span>Only modules made or imported on this device can be edited.</span><a class="btn" href="#/modules">Back to modules</a></div></main>';
    if (v.modId !== id) { v.modId = id; v.edit = null; v.tab = v.tab || 'subclasses'; }
    var tabs = '<div class="pills" role="tablist" aria-label="Content type">' + TYPES.map(function (t) {
      return '<button type="button" class="pill" role="tab" data-act="me-tab" data-arg="' + t[0] + '" aria-pressed="' + (v.tab === t[0]) + '">' + t[1] + ' <small>' + (m[t[0]] || []).length + '</small></button>';
    }).join('') + '</div>';
    var body;
    var entry = v.edit && (m[v.tab] || []).find(function (e) { return e.id === v.edit; });
    if (entry) body = entryForm(m, v.tab, entry);
    else body = entryList(m, v.tab);
    var info = '<section class="q-sec"><div class="q-head"><h2>Module</h2><span style="display:inline-flex;gap:8px"><button class="btn btn-sm" data-act="mod-export" data-arg="' + h(m.id) + '">Export</button><a class="btn btn-sm btn-teal" href="#/modules">Done</a></span></div>' +
      '<div class="q-grid">' + field('@name', 'Module name', m.name, 'My homebrew') + field('@sourceBook', 'Book or source', m.sourceBook, 'e.g. Xanathar’s Guide') + field('@version', 'Version', m.version, '1') + '</div>' +
      area('@description', 'Description', m.description, 'What’s in this module, for your players') +
      toggleRow('@private', 'Private (from a book you own: only for your table)', !!m.private) + '</section>';
    return CF.ui.topbar('<span class="grow muted2" style="font-size:14px">Module editor · saved as you type</span>') +
      '<main class="page" style="max-width:1080px;gap:16px">' + CF.ui.notice() + '<h1 class="b-title" style="font-size:30px">' + h(m.name || 'Untitled module') + '</h1>' + info + tabs + body + exportDialog() + '</main>';
  }

  /* form helpers: data-arg is a path in the entry ("name", "features.2.text") or "@field" on the module */
  function field(path, label, val, ph, type) {
    return '<label class="b-field">' + h(label) + '<input type="' + (type || 'text') + '" value="' + h(val == null ? '' : val) + '" data-act="me-set" data-arg="' + h(path) + '" data-key="me-' + h(path) + '"' + (ph ? ' placeholder="' + h(ph) + '"' : '') + ' autocomplete="off"></label>';
  }
  function area(path, label, val, ph, rows) {
    return '<label class="b-field">' + h(label) + '<textarea rows="' + (rows || 3) + '" data-act="me-set" data-arg="' + h(path) + '" data-key="me-' + h(path) + '"' + (ph ? ' placeholder="' + h(ph) + '"' : '') + ' style="border-radius:10px;border:1.5px solid var(--line2);background:var(--surface);color:var(--ink);padding:10px;font:inherit;font-size:14px;resize:vertical">' + h(val || '') + '</textarea></label>';
  }
  function select(path, label, val, opts, placeholder) {
    return '<label class="b-field">' + h(label) + '<select data-act="me-sel" data-arg="' + h(path) + '">' + (placeholder != null ? '<option value="">' + h(placeholder) + '</option>' : '') +
      opts.map(function (o) { return '<option value="' + h(o[0]) + '"' + (String(val == null ? '' : val) === String(o[0]) ? ' selected' : '') + '>' + h(o[1]) + '</option>'; }).join('') + '</select></label>';
  }
  function seg(path, label, val, opts) {
    return '<div class="b-field">' + h(label) + '<div class="seg">' + opts.map(function (o) { return '<button type="button" data-act="me-one" data-arg="' + h(path + '|' + o[0]) + '" aria-pressed="' + (String(val) === String(o[0])) + '">' + h(o[1]) + '</button>'; }).join('') + '</div></div>';
  }
  function multi(path, label, vals, opts, max) {
    vals = vals || [];
    return '<div class="b-field">' + h(label) + (max ? ' <span class="count' + (vals.length >= max ? ' ok' : '') + '">' + vals.length + '/' + max + '</span>' : '') + '<div class="pills">' + opts.map(function (o) {
      var on = vals.indexOf(o[0]) >= 0;
      return '<button type="button" class="pill" data-act="me-many" data-arg="' + h(path + '|' + o[0] + '|' + (max || 0)) + '" aria-pressed="' + on + '"' + (!on && max && vals.length >= max ? ' disabled' : '') + '>' + h(o[1]) + '</button>';
    }).join('') + '</div></div>';
  }
  function toggleRow(path, label, on) {
    return '<div style="display:flex;align-items:center;gap:10px"><button type="button" class="switch" role="switch" aria-checked="' + on + '" data-act="me-bool" data-arg="' + h(path) + '" aria-label="' + h(label) + '"></button><span style="font-size:14px">' + h(label) + '</span></div>';
  }
  function listBlock(path, title, rows, addLabel) {
    return '<div class="me-list"><div class="q-head"><h3 style="margin:0;font-size:15px">' + h(title) + '</h3><button type="button" class="btn btn-sm" data-act="me-add-row" data-arg="' + h(path) + '">+ ' + h(addLabel) + '</button></div>' + rows + '</div>';
  }
  function rowBox(path, i, inner) {
    return '<div class="me-row">' + inner + '<button type="button" class="link-btn" style="font-size:13px;padding:0;align-self:flex-start" data-act="me-del-row" data-arg="' + h(path + '|' + i) + '">Remove</button></div>';
  }
  function opts(section, filter) { return C.all(section).filter(filter || function () { return true; }).sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (x) { return [x.id, x.name]; }); }
  var LEVELS = Array.apply(null, Array(20)).map(function (x, i) { return [String(i + 1), 'Level ' + (i + 1)]; });

  function entryList(m, tab) {
    var t = TYPES.find(function (x) { return x[0] === tab; }), list = m[tab] || [];
    var help = {
      subclasses: 'A subclass adds features to an existing class at the levels you choose (most come at 3, 6, 10 and 14).',
      species: 'A species with its size, speed, darkvision, resistances and traits.',
      backgrounds: 'A 2024-style background: three abilities for the +2/+1 bonus, two skills, a tool, an origin feat and starting gear.',
      feats: 'Origin feats can be taken at level 1; general feats from level 4; Epic Boons at 19.',
      spells: 'A spell with its full text. Add dice to make it rollable on the sheet.',
      items: 'Weapons and armor work in the attack table and AC; gear just sits in the inventory.'
    }[tab];
    return '<section class="q-sec"><div class="q-head"><h2>' + t[1] + '</h2><button class="btn btn-sm btn-teal" data-act="me-new" data-arg="' + tab + '">+ New ' + t[2] + '</button></div><p class="why" style="margin:0;font-size:13px;color:var(--muted)">' + help + '</p>' +
      (list.length ? '<div class="me-entries">' + list.map(function (e) {
        var warn = !e.name ? 'Needs a name' : tab === 'subclasses' && !e.class ? 'Pick a class' : '';
        return '<div class="me-entry"><div style="flex:1;min-width:0"><b>' + h(e.name || 'Untitled') + '</b><span class="muted" style="font-size:13px;display:block">' + h(summary(tab, e)) + '</span>' + (warn ? '<span style="font-size:12px;color:var(--danger)">' + warn + '</span>' : '') + '</div>' +
          '<button class="btn btn-sm" data-act="me-edit" data-arg="' + h(e.id) + '">Edit</button>' +
          (mv().confirmEntry === e.id ? '<button class="btn btn-sm btn-primary" data-act="me-del-yes" data-arg="' + h(e.id) + '">Delete</button><button class="btn btn-sm" data-act="me-del-no">Keep</button>' : '<button class="btn btn-sm btn-ghost" data-act="me-del" data-arg="' + h(e.id) + '">Delete</button>') + '</div>';
      }).join('') + '</div>' : '<div class="empty" style="padding:18px"><span>No ' + t[1].toLowerCase() + ' yet.</span></div>') + '</section>';
  }
  function summary(tab, e) {
    if (tab === 'subclasses') { var c = e.class && C.get('classes', e.class); return (c ? c.name + ' subclass' : 'Subclass') + ' · ' + (e.features || []).length + ' feature' + ((e.features || []).length === 1 ? '' : 's'); }
    if (tab === 'species') return (e.sizeMode === 'choice' ? 'Medium or Small' : e.size || 'Medium') + ' · speed ' + (e.speed || 30) + ' ft' + (+e.darkvision ? ' · darkvision ' + e.darkvision + ' ft' : '');
    if (tab === 'backgrounds') return (e.abilityOptions || []).map(function (a) { return a.toUpperCase(); }).join(', ') + ((e.skills || []).length ? ' · ' + e.skills.map(function (s) { var k = R.SKILLS.find(function (x) { return x.id === s; }); return k ? k.name : s; }).join(', ') : '');
    if (tab === 'feats') return cap(e.category || 'origin') + ' feat' + (e.pitch ? ' · ' + e.pitch : '');
    if (tab === 'spells') return (e.level ? 'Level ' + e.level : 'Cantrip') + ' ' + (e.school || '') + ' · ' + (e.classes || []).map(cap).join(', ');
    if (tab === 'items') return cap(e.kind || 'gear') + (e.kind === 'weapon' ? ' · ' + (e.damage || '') + ' ' + (e.type || '') : e.kind === 'armor' ? ' · AC ' + (e.ac || '') : '');
    return '';
  }

  function entryForm(m, tab, e) {
    var f = '<section class="q-sec"><div class="q-head"><h2>' + h(e.name || 'New ' + TYPES.find(function (x) { return x[0] === tab; })[2]) + '</h2><button class="btn btn-sm btn-teal" data-act="me-back">Done</button></div>';
    if (tab === 'subclasses') {
      f += '<div class="q-grid">' + select('class', 'Class', e.class, opts('classes'), 'Choose a class…') + field('name', 'Subclass name', e.name, 'e.g. Path of the Zealot') + '</div>' +
        field('pitch', 'One-line pitch', e.pitch, 'What makes it fun, in a sentence') +
        listBlock('features', 'Features', (e.features || []).map(function (x, i) {
          var p = 'features.' + i + '.';
          return rowBox('features', i, '<div class="q-grid">' + select(p + 'level', 'Level', x.level || 3, LEVELS) + field(p + 'name', 'Name', x.name) + select(p + 'time', 'Used as', x.time || '', TIMES) + field(p + 'dice', 'Dice to roll (optional)', x.dice, 'e.g. 2d6') + '</div>' +
            area(p + 'text', 'What it does', x.text, '', 3) +
            '<div class="q-grid">' + field(p + 'uses', 'Uses (number, optional)', x.uses, 'e.g. 1', 'number') + select(p + 'usesMod', 'Or uses = modifier of', x.usesMod || '', ABIL, '—') + select(p + 'recharge', 'Uses come back on', x.recharge || 'long', [['long', 'Long Rest'], ['short', 'Short or Long Rest']]) + '</div>');
        }).join(''), 'Add feature') +
        listBlock('spells', 'Always-prepared spells (optional)', (e.spells || []).map(function (x, i) {
          return rowBox('spells', i, '<div class="q-grid">' + select('spells.' + i + '.level', 'From level', x.level || 3, LEVELS) + select('spells.' + i + '.spell', 'Spell', x.spell, opts('spells'), 'Choose a spell…') + '</div>');
        }).join(''), 'Add spell');
    } else if (tab === 'species') {
      f += '<div class="q-grid">' + field('name', 'Species name', e.name) + field('speed', 'Speed (ft)', e.speed || 30, '', 'number') + field('darkvision', 'Darkvision (ft, 0 for none)', e.darkvision || 0, '', 'number') + '</div>' +
        field('pitch', 'One-line pitch', e.pitch) + seg('sizeMode', 'Size', e.sizeMode || 'Medium', [['Medium', 'Medium'], ['Small', 'Small'], ['choice', 'Player chooses']]) +
        multi('resist', 'Damage resistances', e.resist, DAMAGE.map(function (d) { return [d, cap(d)]; })) +
        listBlock('traits', 'Traits', (e.traits || []).map(function (x, i) {
          return rowBox('traits', i, field('traits.' + i + '.name', 'Trait name', x.name) + area('traits.' + i + '.text', 'What it does', x.text, '', 3));
        }).join(''), 'Add trait');
    } else if (tab === 'backgrounds') {
      f += field('name', 'Background name', e.name) + field('pitch', 'One-line pitch', e.pitch) + area('description', 'Description', e.description, '', 3) +
        multi('abilityOptions', 'Ability scores (pick 3)', e.abilityOptions, ABIL, 3) +
        multi('skills', 'Skill proficiencies (pick 2)', e.skills, R.SKILLS.map(function (s) { return [s.id, s.name]; }), 2) +
        '<div class="q-grid">' + seg('toolMode', 'Tool proficiency', e.toolMode || 'fixed', [['fixed', 'A specific tool'], ['choose', 'Player chooses']]) +
        (e.toolMode === 'choose' ? select('toolGroup', 'From', e.toolGroup || 'gaming-set', [['gaming-set', 'Gaming sets'], ['musical-instrument', 'Musical instruments'], ['artisan', 'Artisan’s tools']])
          : select('toolItem', 'Tool', e.toolItem, opts('items', function (i) { return i.kind === 'tool'; }), 'None')) +
        select('feat', 'Origin feat', e.feat, opts('feats', function (x) { return x.category === 'origin'; }), 'Choose a feat…') + '</div>' +
        listBlock('equipA', 'Starting equipment (option A; option B is always 50 GP)', (e.equipA || []).map(function (x, i) {
          return rowBox('equipA', i, '<div class="q-grid">' + select('equipA.' + i + '.item', 'Item', x.item, opts('items'), 'Choose an item…') + field('equipA.' + i + '.qty', 'How many', x.qty || 1, '', 'number') + '</div>');
        }).join(''), 'Add item') + field('equipGp', 'Plus gold pieces', e.equipGp || 0, '', 'number');
    } else if (tab === 'feats') {
      f += '<div class="q-grid">' + field('name', 'Feat name', e.name) + select('category', 'Kind', e.category || 'origin', [['origin', 'Origin feat (level 1)'], ['general', 'General feat (level 4+)'], ['epic', 'Epic Boon (level 19)']]) + '</div>' +
        field('pitch', 'One-line pitch', e.pitch) + area('text', 'What it does', e.text, '', 5) +
        seg('asiMode', 'Ability score increase', e.asiMode || 'none', [['none', 'None'], ['pick', '+1 to one of…'], ['flex', '+2 or +1/+1 (like ASI)']]) +
        (e.asiMode === 'pick' ? multi('asiList', 'Which abilities', e.asiList, ABIL) : '') +
        toggleRow('repeatable', 'Can be taken more than once', !!e.repeatable);
    } else if (tab === 'spells') {
      f += '<div class="q-grid">' + field('name', 'Spell name', e.name) + select('level', 'Level', e.level || 0, [['0', 'Cantrip']].concat([1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (l) { return [String(l), 'Level ' + l]; }))) + select('school', 'School', e.school || 'Evocation', SCHOOLS.map(function (s) { return [s, s]; })) + '</div>' +
        multi('classes', 'Spell lists', e.classes, CASTERS.map(function (c) { return [c, cap(c)]; })) +
        '<div class="q-grid">' + field('time', 'Casting time', e.time || 'Action', 'Action, Bonus Action, 1 minute…') + field('range', 'Range', e.range, 'e.g. 60 ft, Self, Touch') + field('duration', 'Duration', e.duration || 'Instantaneous') + '</div>' +
        multi('comp', 'Components', e.comp || ['V', 'S'], [['V', 'Verbal'], ['S', 'Somatic'], ['M', 'Material']]) + ((e.comp || []).indexOf('M') >= 0 ? field('material', 'Material', e.material, 'e.g. a pinch of sulfur') : '') +
        '<div style="display:flex;flex-wrap:wrap;gap:16px">' + toggleRow('concentration', 'Concentration', !!e.concentration) + toggleRow('ritual', 'Ritual', !!e.ritual) + '</div>' +
        '<div class="q-grid">' + select('attackMode', 'Spell attack', e.attackMode || 'none', [['none', 'None'], ['ranged', 'Ranged spell attack'], ['melee', 'Melee spell attack']]) + select('save', 'Saving throw', e.save || '', ABIL, 'None') +
        field('dice', 'Damage or healing dice', e.dice, 'e.g. 3d6') + select('dmgType', 'Type', e.dmgType || '', DAMAGE.map(function (d) { return [d, cap(d)]; }).concat([['healing', 'Healing']]), '—') + '</div>' +
        toggleRow('addMod', 'Add the spellcasting modifier to the dice', !!e.addMod) +
        field('summary', 'Short effect label (for the sheet)', e.summary, 'e.g. Restrained (STR save ends)') +
        area('body', 'Full description', e.body, '', 6) +
        '<div class="q-grid">' + field('upcastDice', 'Extra dice per higher slot level', e.upcastDice, 'e.g. 1d6') + '</div>' + area('higherText', 'Using a higher-level spell slot (text)', e.higherText, '', 2);
    } else if (tab === 'items') {
      f += '<div class="q-grid">' + field('name', 'Item name', e.name) + seg('kind', 'Kind', e.kind || 'gear', [['weapon', 'Weapon'], ['armor', 'Armor'], ['gear', 'Gear']]) + '</div>';
      if (e.kind === 'weapon') f += '<div class="q-grid">' + seg('category', 'Category', e.category || 'simple', [['simple', 'Simple'], ['martial', 'Martial']]) + seg('attack', 'Attack', e.attack || 'melee', [['melee', 'Melee'], ['ranged', 'Ranged']]) +
        field('damage', 'Damage dice', e.damage || '1d6', 'e.g. 1d8') + select('type', 'Damage type', e.type || 'slashing', ['bludgeoning', 'piercing', 'slashing'].concat(DAMAGE.filter(function (d) { return ['bludgeoning', 'piercing', 'slashing'].indexOf(d) < 0; })).map(function (d) { return [d, cap(d)]; })) + '</div>' +
        multi('props', 'Properties', e.props, PROPS.map(function (p) { return [p, cap(p)]; })) +
        '<div class="q-grid">' + select('mastery', 'Mastery', e.mastery || '', Object.keys(R.MASTERY).map(function (k) { return [k, R.MASTERY[k].name]; }), 'None') + field('rangeN', 'Range (normal, ft)', e.rangeN, 'for thrown/ranged', 'number') + field('rangeL', 'Range (long, ft)', e.rangeL, '', 'number') + '</div>';
      if (e.kind === 'armor') f += '<div class="q-grid">' + seg('armor', 'Type', e.armor || 'light', [['light', 'Light'], ['medium', 'Medium'], ['heavy', 'Heavy'], ['shield', 'Shield']]) + field('ac', e.armor === 'shield' ? 'AC bonus' : 'Base AC', e.ac || (e.armor === 'shield' ? 2 : 11), '', 'number') + field('strength', 'STR needed (heavy)', e.strength, '', 'number') + '</div>' + toggleRow('stealthDisadvantage', 'Disadvantage on Stealth', !!e.stealthDisadvantage);
      f += '<div class="q-grid">' + field('w', 'Weight (lb)', e.w || 0, '', 'number') + field('c', 'Cost (GP)', e.c || 0, '', 'number') + '</div>' + field('notes', 'Notes', e.notes) + (e.kind === 'gear' || !e.kind ? toggleRow('stack', 'Stacks (like arrows or rations)', !!e.stack) : '');
    }
    return f + '<p class="muted2" style="font-size:12px;margin:0">Changes save as you type and show up in the builders, Level up and the sheet straight away.</p></section>';
  }

  /* ---------- editing ---------- */
  var H = app.handlers;
  function editing() { var v = mv(), m = mine(v.modId); return { v: v, m: m, list: m && (m[v.tab] = m[v.tab] || []), e: m && v.edit && (m[v.tab] || []).find(function (x) { return x.id === v.edit; }) }; }
  function setPath(obj, path, val) {
    var parts = path.split('.'), o = obj;
    for (var i = 0; i < parts.length - 1; i++) { var k = parts[i]; if (o[k] == null) o[k] = /^\d+$/.test(parts[i + 1]) ? [] : {}; o = o[k]; }
    o[parts[parts.length - 1]] = val;
  }
  function getPath(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj); }
  function change(path, val, rerender) {
    var x = editing(); if (!x.m) return;
    if (path.charAt(0) === '@') x.m[path.slice(1)] = val;
    else if (x.e) { setPath(x.e, path, val); compile(x.v.tab, x.e); }
    saveMod(x.m);
    if (rerender) app.render();
  }

  H['me-set'] = function (path, el) { change(path, el.value, /^@name$|\.name$|^name$/.test(path) && false); };
  H['me-sel'] = function (path, el) { change(path, el.value, true); };
  H['me-one'] = function (arg) { var p = arg.split('|'); change(p[0], p[1], true); };
  H['me-bool'] = function (path) { var x = editing(); if (!x.m) return; var cur = path.charAt(0) === '@' ? x.m[path.slice(1)] : x.e && getPath(x.e, path); change(path, !cur, true); };
  H['me-many'] = function (arg) {
    var p = arg.split('|'), x = editing(); if (!x.e) return;
    var list = (getPath(x.e, p[0]) || []).slice(), i = list.indexOf(p[1]);
    if (i >= 0) list.splice(i, 1); else if (!+p[2] || list.length < +p[2]) list.push(p[1]);
    change(p[0], list, true);
  };
  H['me-add-row'] = function (path) { var x = editing(); if (!x.e) return; var list = (getPath(x.e, path) || []).slice(); list.push(path === 'features' ? { level: 3, recharge: 'long' } : path === 'spells' ? { level: 3 } : path === 'equipA' ? { qty: 1 } : {}); change(path, list, true); };
  H['me-del-row'] = function (arg) { var p = arg.split('|'), x = editing(); if (!x.e) return; var list = (getPath(x.e, p[0]) || []).slice(); list.splice(+p[1], 1); change(p[0], list, true); };
  H['me-tab'] = function (t) { var v = mv(); v.tab = t; v.edit = null; app.render(); };
  H['me-edit'] = function (id) { mv().edit = id; app.render(); try { root.scrollTo(0, 0); } catch (e) { /* ignore */ } };
  H['me-back'] = function () { mv().edit = null; app.render(); };
  H['me-new'] = function (tab) {
    var x = editing(); if (!x.m) return;
    var base = { subclasses: { features: [{ level: 3, recharge: 'long' }] }, species: { speed: 30, sizeMode: 'Medium', traits: [{}] }, backgrounds: { toolMode: 'fixed', equipA: [], equipGp: 0 },
      feats: { category: 'origin', asiMode: 'none' }, spells: { level: 1, school: 'Evocation', time: 'Action', duration: 'Instantaneous', comp: ['V', 'S'], classes: [] }, items: { kind: 'gear' } }[tab];
    var e = Object.assign({ id: (x.m.idPrefix || slug(x.m.name).slice(0, 12) || 'mod') + '-' + U.uid().slice(-6), name: '' }, JSON.parse(JSON.stringify(base)));
    compile(tab, e);
    (x.m[tab] = x.m[tab] || []).push(e);
    saveMod(x.m);
    mv().edit = e.id; app.render();
  };
  H['me-del'] = function (id) { mv().confirmEntry = id; app.render(); };
  H['me-del-no'] = function () { mv().confirmEntry = null; app.render(); };
  H['me-del-yes'] = function (id) { var x = editing(); if (!x.m) return; x.m[x.v.tab] = (x.m[x.v.tab] || []).filter(function (e) { return e.id !== id; }); mv().confirmEntry = null; saveMod(x.m); app.render(); };

  /* ---------- module list actions ---------- */
  H['mod-new'] = function () {
    var id = 'my-' + U.uid().slice(-8);
    var m = { format: 'character-forge/pack@1', id: id, idPrefix: id.slice(3), name: 'My module', version: '1', description: '', private: true, madeHere: true, createdAt: new Date().toISOString(),
      subclasses: [], species: [], backgrounds: [], feats: [], spells: [], items: [] };
    saveMod(m);
    app.view.me = { tab: 'subclasses', edit: null, modId: id };
    app.go('#/modules/' + encodeURIComponent(id));
  };
  H['mod-toggle'] = function (id) {
    var off = offList().slice(), i = off.indexOf(id);
    if (i >= 0) off.splice(i, 1); else off.push(id);
    CF.store.setSetting('modulesOff', off); app.render();
  };
  H['mod-remove'] = function (id) { mv().confirm = id; app.render(); };
  H['mod-remove-no'] = function () { mv().confirm = null; app.render(); };
  H['mod-remove-yes'] = function (id) { CF.store.removeModule(id); mv().confirm = null; app.flash('Module removed.'); app.render(); };
  H['mod-export'] = function (id) { mv().exporting = id; mv().exportNote = ''; app.render(); };
  H['mod-export-close'] = function () { mv().exporting = null; app.render(); };
  H['mod-download'] = function (id) {
    var p = C.pack(id); if (!p) return;
    try {
      var blob = new Blob([JSON.stringify(stripEditor(p), null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = slug(p.name || 'module') + '.module.json';
      document.body.appendChild(a); a.click(); a.remove();
      mv().exportNote = 'If no file appeared, your browser blocked the download here. Use Copy instead and paste it into a text file.';
    } catch (e) { mv().exportNote = 'Downloads are blocked here. Use Copy instead.'; }
    app.render();
  };
  H['mod-copy'] = function (id) {
    var p = C.pack(id); if (!p) return;
    var text = JSON.stringify(stripEditor(p), null, 2);
    var done = function (ok) { mv().exportNote = ok ? 'Copied. Paste it into a file named something like ' + slug(p.name) + '.module.json.' : 'Couldn’t copy automatically: select the text below and copy it.'; app.render(); };
    try { navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); }); } catch (e) { done(false); }
  };
  CF.ui.compileModuleEntry = compile;
})(window);
