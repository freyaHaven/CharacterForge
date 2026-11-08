/* Character Forge — core: namespace, content registry, shared rules data, helpers. */
(function (root) {
  'use strict';
  var CF = root.CF = root.CF || {};

  /* ---------- helpers ---------- */
  CF.util = {
    /**
     * Rules text → HTML. Lines like "Hypervigilance. Whenever you…" become bullets with a bold name;
     * a plain line after a bullet continues that bullet; lines before the first bullet are paragraphs.
     * lead (HTML) goes in front of the first paragraph, e.g. '<b>Survivor:</b> '.
     */
    rich: function (text, lead) {
      var esc = CF.util.esc, out = [], items = null;
      var named = /^([A-Z0-9][^.:!?]{0,48}?)([.:])\s+(\S[\s\S]*)$/;
      var lines = String(text || '').split(/\n+/).filter(function (l) { return l.trim(); });
      var titleish = function (name) {
        if (lines.length < 2 || /,/.test(name) || /^(Choose|You|Your|When|If|As|Once|Each|While|At|In|On|The|This|Whenever|After|Before|Until)\b/.test(name)) return false;
        var w = name.split(/\s+/); if (w.length > 7) return false;
        return w.every(function (x) { return x.length < 4 || /^[A-Z0-9(“"']/.test(x) || /^(with|from|into|than|over|upon)$/.test(x); });
      };
      String(text || '').split(/\n+/).forEach(function (line) {
        line = line.trim(); if (!line) return;
        var m = named.exec(line);
        if (m && titleish(m[1])) { items = items || []; items.push('<li><b>' + esc(m[1]) + m[2] + '</b> ' + esc(m[3]) + '</li>'); return; }
        if (items && items.length) { items[items.length - 1] = items[items.length - 1].replace(/<\/li>$/, ' ' + esc(line) + '</li>'); return; }
        out.push('<p>' + (out.length || !lead ? '' : lead) + esc(line) + '</p>');
      });
      if (!out.length && lead) out.push('<p>' + lead.replace(/\s+$/, '') + '</p>');
      return '<div class="rich">' + out.join('') + (items ? '<ul>' + items.join('') + '</ul>' : '') + '</div>';
    },
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    signed: function (n) { return n >= 0 ? '+' + n : '−' + Math.abs(n); },
    mod: function (score) { return Math.floor((score - 10) / 2); },
    uid: function () { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); },
    clone: function (o) { return JSON.parse(JSON.stringify(o)); },
    round: function (n, d) { var p = Math.pow(10, d || 0); return Math.round(n * p) / p; }
  };

  CF.version = '2026-11-08g';   // keep in step with the ?v= tags in index.html

  /* ---------- content registry (packs = SRD + modules) ---------- */
  var packs = [];
  /** A module can add a subclass to any class (its "subclasses" list, each with a "class" id). Merge them in. */
  function withSubclasses(section, cls, enabled) {
    if (section === 'spells') return withLists(cls, enabled);
    if (section === 'species') return withLineages(cls, enabled);
    if (section !== 'classes') return cls;
    cls = withStyles(cls, enabled);
    var extra = [];
    packs.forEach(function (p) {
      if (enabled && enabled.indexOf(p.id) < 0) return;
      (p.subclasses || []).forEach(function (sc) { if (sc.class === cls.id) extra.push(Object.assign({ source: p.id, sourceName: p.name }, sc)); });
    });
    var own = (cls.subclasses || []).filter(function (sc) { return !extra.some(function (x) { return x.id === sc.id; }); });
    var subs = own.concat(extra);
    var styled = subs.map(function (sc) { return withStyles(sc, enabled); });
    if (!extra.length && styled.every(function (x, i) { return x === subs[i]; })) return cls;
    return Object.assign({}, cls, { subclasses: styled });
  }
  /** Fighting Style choices also offer the Fighting Style feats from enabled modules (Dueling, Interception, Thrown Weapon Fighting…). */
  function withStyles(def, enabled) {
    if (!def || !(def.choices || []).some(function (q) { return /style$/.test(q.id); })) return def;
    var feats = [];
    packs.forEach(function (p) {
      if (enabled && enabled.indexOf(p.id) < 0) return;
      (p.feats || []).forEach(function (f) { if (f.category === 'fighting-style') feats.push(Object.assign({ sourceName: p.name }, f)); });
    });
    if (!feats.length) return def;
    var norm = function (n) { return String(n).toLowerCase().replace(/ fighting$/, ''); };
    return Object.assign({}, def, { choices: def.choices.map(function (q) {
      if (!/style$/.test(q.id)) return q;
      var opts = q.options.slice();
      feats.forEach(function (f) {
        if (opts.some(function (o) { return o.id === f.id || norm(o.name) === norm(f.name); })) return;
        var o = { id: f.id, name: f.name, text: f.text, source: f.sourceName };
        if (f.grants) o.grants = f.grants;
        opts.push(o);
      });
      return Object.assign({}, q, { options: opts });
    }) });
  }
  /** A module can add lineages to a species from another pack (its "lineages" list, each with a "species" id), e.g. Eladrin for the Elf. */
  function withLineages(sp, enabled) {
    var extra = [];
    packs.forEach(function (p) {
      if (enabled && enabled.indexOf(p.id) < 0) return;
      (p.lineages || []).forEach(function (l) { if (l.species === sp.id) extra.push(Object.assign({ source: p.id, sourceName: p.name }, l)); });
    });
    if (!extra.length) return sp;
    extra.sort(function (a, b) { return a.name.localeCompare(b.name); });
    var own = (sp.lineages || []).filter(function (l) { return !extra.some(function (x) { return x.id === l.id; }); });
    var out = Object.assign({}, sp, { lineages: own.concat(extra) });
    if (!own.length) { out.lineageOptional = true; out.lineageLabel = 'Variant (optional)'; }   // a species with no lineages of its own: keep the standard version too
    return out;
  }
  /** A module can put existing spells on a class list (its "spellLists": { listName: [spell ids] }), e.g. the Artificer list. */
  function withLists(sp, enabled) {
    var add = [];
    packs.forEach(function (p) {
      if (!p.spellLists || (enabled && enabled.indexOf(p.id) < 0)) return;
      Object.keys(p.spellLists).forEach(function (L) { if (p.spellLists[L].indexOf(sp.id) >= 0 && (sp.classes || []).indexOf(L) < 0 && add.indexOf(L) < 0) add.push(L); });
    });
    return add.length ? Object.assign({}, sp, { classes: (sp.classes || []).concat(add) }) : sp;
  }
  CF.content = {
    registerPack: function (pack) {
      if (!pack || pack.format !== 'character-forge/pack@1' || !pack.id) throw new Error('Not a Character Forge content pack');
      packs = packs.filter(function (p) { return p.id !== pack.id; });
      packs.push(pack);
    },
    /** Add or replace entries in an already registered pack (lets one pack be split over several files). */
    extendPack: function (id, sections) {
      var pack = packs.find(function (p) { return p.id === id; });
      if (!pack) throw new Error('Unknown pack ' + id);
      Object.keys(sections).forEach(function (k) {
        var list = pack[k] = pack[k] || [];
        sections[k].forEach(function (e) {
          var i = list.findIndex(function (x) { return x.id === e.id; });
          if (i >= 0) list[i] = e; else list.push(e);
        });
      });
    },
    removePack: function (id) { packs = packs.filter(function (p) { return p.id !== id || p.builtIn; }); },
    packs: function () { return packs.slice(); },
    pack: function (id) { return packs.find(function (p) { return p.id === id; }) || null; },
    /** Find an entry of a section (classes, spells, items…) across the enabled packs. Later packs win. */
    get: function (section, id, enabled) {
      for (var i = packs.length - 1; i >= 0; i--) {
        var p = packs[i];
        if (enabled && enabled.indexOf(p.id) < 0) continue;
        var list = p[section] || [];
        for (var j = 0; j < list.length; j++) if (list[j].id === id) return withSubclasses(section, Object.assign({ source: p.id, sourceName: p.name }, list[j]), enabled);
      }
      return null;
    },
    /** The packs a character can use: the SRD, every installed module that's switched on, and any the character lists. */
    on: function (ch) {
      var off = (CF.store && CF.store.settings().modulesOff) || [];
      var ids = ['srd-5.2'];
      packs.forEach(function (p) { if (!p.builtIn && off.indexOf(p.id) < 0) ids.push(p.id); });
      ((ch && ch.modules) || []).forEach(function (id) { if (ids.indexOf(id) < 0 && packs.some(function (p) { return p.id === id; })) ids.push(id); });
      return ids;
    },
    all: function (section, enabled) {
      var out = [];
      packs.forEach(function (p) {
        if (enabled && enabled.indexOf(p.id) < 0) return;
        (p[section] || []).forEach(function (e) { out.push(withSubclasses(section, Object.assign({ source: p.id, sourceName: p.name }, e), enabled)); });
      });
      return out;
    },
    /** Light validation for imported module files. Returns a list of problems (empty = ok). */
    validate: function (pack) {
      var problems = [];
      if (!pack || typeof pack !== 'object') return ['The file is not a content pack.'];
      if (pack.format !== 'character-forge/pack@1') problems.push('Missing or unknown "format" (expected character-forge/pack@1).');
      if (!pack.id || !/^[a-z0-9][a-z0-9-]*$/.test(pack.id)) problems.push('"id" must be lower-case letters, numbers and dashes.');
      if (!pack.name) problems.push('"name" is missing.');
      ['classes', 'subclasses', 'species', 'lineages', 'backgrounds', 'backgroundFeatures', 'feats', 'spells', 'items'].forEach(function (k) {
        if (pack[k] !== undefined && !Array.isArray(pack[k])) problems.push('"' + k + '" must be a list.');
        (pack[k] || []).forEach(function (e, i) { if (!e || !e.id || !e.name) problems.push(k + ' #' + (i + 1) + ' needs an id and a name.'); });
      });
      return problems;
    }
  };

  /* ---------- shared rules data (2024 rules) ---------- */
  CF.rules = CF.rules || {};
  CF.rules.ABILITIES = [
    { id: 'str', abbr: 'STR', name: 'Strength' }, { id: 'dex', abbr: 'DEX', name: 'Dexterity' },
    { id: 'con', abbr: 'CON', name: 'Constitution' }, { id: 'int', abbr: 'INT', name: 'Intelligence' },
    { id: 'wis', abbr: 'WIS', name: 'Wisdom' }, { id: 'cha', abbr: 'CHA', name: 'Charisma' }
  ];
  CF.rules.SKILLS = [
    ['acrobatics', 'Acrobatics', 'dex'], ['animal-handling', 'Animal Handling', 'wis'], ['arcana', 'Arcana', 'int'],
    ['athletics', 'Athletics', 'str'], ['deception', 'Deception', 'cha'], ['history', 'History', 'int'],
    ['insight', 'Insight', 'wis'], ['intimidation', 'Intimidation', 'cha'], ['investigation', 'Investigation', 'int'],
    ['medicine', 'Medicine', 'wis'], ['nature', 'Nature', 'int'], ['perception', 'Perception', 'wis'],
    ['performance', 'Performance', 'cha'], ['persuasion', 'Persuasion', 'cha'], ['religion', 'Religion', 'int'],
    ['sleight-of-hand', 'Sleight of Hand', 'dex'], ['stealth', 'Stealth', 'dex'], ['survival', 'Survival', 'wis']
  ].map(function (s) { return { id: s[0], name: s[1], ability: s[2] }; });
  CF.rules.CONDITIONS = ['Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'];
  CF.rules.LANGUAGES = { common: 'Common', elvish: 'Elvish', dwarvish: 'Dwarvish', giant: 'Giant', gnomish: 'Gnomish', goblin: 'Goblin', halfling: 'Halfling', orc: 'Orc', draconic: 'Draconic', 'common-sign': 'Common Sign Language',
    abyssal: 'Abyssal', celestial: 'Celestial', 'deep-speech': 'Deep Speech', infernal: 'Infernal', primordial: 'Primordial', sylvan: 'Sylvan', undercommon: 'Undercommon' };
  CF.rules.PROPERTY_NAMES = { finesse: 'Finesse', light: 'Light', heavy: 'Heavy', 'two-handed': 'Two-Handed', ammunition: 'Ammunition', thrown: 'Thrown', versatile: 'Versatile', reach: 'Reach', loading: 'Loading' };
  CF.rules.STANDARD_LANGUAGES = ['common-sign', 'draconic', 'dwarvish', 'elvish', 'giant', 'gnomish', 'goblin', 'halfling', 'orc'];
  CF.rules.MASTERY = {
    nick: { name: 'Nick', text: 'When you make the extra attack of the Light property with this weapon, it can be part of the Attack action instead of a Bonus Action. Only once per turn.' },
    slow: { name: 'Slow', text: 'When you hit a creature and deal damage, you can reduce its Speed by 10 ft until the start of your next turn. Hitting it again doesn’t slow it further.' },
    vex: { name: 'Vex', text: 'When you hit a creature and deal damage, you have Advantage on your next attack roll against it before the end of your next turn.' },
    sap: { name: 'Sap', text: 'When you hit a creature, it has Disadvantage on its next attack roll before the start of your next turn.' },
    cleave: { name: 'Cleave', text: 'When you hit a creature with a melee attack, you can make a second attack against another creature within 5 ft of the first (also within your reach). On a hit it takes the weapon’s damage, without your ability modifier unless it’s negative. Once per turn.' },
    graze: { name: 'Graze', text: 'When your attack roll misses, the creature still takes damage equal to your ability modifier for that attack (same type as the weapon).' },
    push: { name: 'Push', text: 'When you hit a Large or smaller creature, you can push it up to 10 ft straight away from you.' },
    topple: { name: 'Topple', text: 'When you hit a creature, you can force it to make a CON save (DC 8 + the attack’s ability modifier + your proficiency bonus). On a failure it has the Prone condition.' }
  };
  /** Actions anyone can take in combat. `rolls` lists skills offered as quick rolls. */
  CF.rules.COMBAT_ACTIONS = [
    { name: 'Attack', text: 'Make one attack with a weapon or an Unarmed Strike (see the table above).' },
    { name: 'Dash', text: 'Gain extra movement equal to your Speed for this turn.' },
    { name: 'Disengage', text: 'Your movement doesn’t provoke Opportunity Attacks for the rest of this turn.' },
    { name: 'Dodge', text: 'Until the start of your next turn, attacks against you have Disadvantage and you have Advantage on DEX saves. You lose this if you are Incapacitated or your Speed is 0.' },
    { name: 'Help', text: 'Give an ally Advantage on their next ability check, or on their next attack against an enemy within 5 ft of you.' },
    { name: 'Hide', text: 'While out of sight and heavily obscured or behind cover, make a DC 15 DEX (Stealth) check. On a success you have the Invisible condition until you make noise, attack or are found.', rolls: ['stealth'] },
    { name: 'Influence', text: 'Try to change a creature’s attitude with CHA (Deception, Intimidation, Performance, Persuasion) or WIS (Animal Handling).', rolls: ['persuasion', 'intimidation', 'animal-handling'] },
    { name: 'Magic', text: 'Cast a spell with a casting time of one action (see the Spells tab), or use a magic item.' },
    { name: 'Ready', text: 'Pick a trigger and an action. When the trigger happens before your next turn, you can use your Reaction to take that action.' },
    { name: 'Search', text: 'Look for something hidden with a WIS check (Insight, Medicine, Perception or Survival).', rolls: ['perception', 'survival'] },
    { name: 'Study', text: 'Recall or work something out with an INT check (Arcana, History, Investigation, Nature or Religion).', rolls: ['investigation'] },
    { name: 'Utilize', text: 'Use a nonmagical object that takes real effort, such as pulling a lever or lighting a torch.' }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
