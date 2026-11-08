/* Character Forge — home screen and module library. */
(function (root) {
  'use strict';
  var CF = root.CF, U = CF.util, app = CF.app, h = U.esc;

  var ICON_MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';
  var ICON_SUN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var ICON_UP = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>';
  var ICON_DOWN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>';
  CF.ui.icons = { moon: ICON_MOON, sun: ICON_SUN, up: ICON_UP, down: ICON_DOWN };

  CF.ui.topbar = function (inner) {
    var dark = app.theme() === 'dark';
    return '<header class="topbar"><div class="topbar-in">' +
      '<a class="brand" href="#/"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M12 2v20M3 7l9 5 9-5"/></svg>Character Forge</a>' +
      (inner || '<nav class="grow" aria-label="Main" style="display:flex;gap:4px"><a class="btn btn-ghost btn-sm" href="#/" style="border:none">Characters</a><a class="btn btn-ghost btn-sm" href="#/modules" style="border:none">Modules</a></nav>') +
      '<button class="btn btn-icon" data-act="settings" aria-label="Settings" title="Settings">' + ICON_GEAR + '</button>' +
      '<button class="btn btn-icon" data-act="theme" aria-label="Switch to ' + (dark ? 'light' : 'dark') + ' theme">' + (dark ? ICON_SUN : ICON_MOON) + '</button>' +
      '</div></header>' + settingsDialog();
  };
  var ICON_GEAR = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

  /** Table rules and preferences, saved on this device. */
  function settingsDialog() {
    if (!app.view.settingsOpen) return '';
    var st = CF.store.settings(), rules = app.CRIT_RULES;
    var seg = function (act, cur, opts) { return '<div class="seg">' + opts.map(function (o) { return '<button type="button" data-act="' + act + '" data-arg="' + o[0] + '" aria-pressed="' + (cur === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>'; };
    return '<div role="dialog" aria-modal="true" aria-labelledby="set-t" class="overlay"><div class="card settings">' +
      '<div style="display:flex;align-items:center;gap:8px"><h2 id="set-t" style="margin:0;font-size:20px;flex:1">Settings</h2><button class="btn btn-ghost btn-sm" data-act="settings-close">Close</button></div>' +
      '<p class="muted" style="margin:0;font-size:13px">Saved on this device and used for every character. Ask your DM which rules your table uses.</p>' +
      '<section class="set-sec"><h3>Rules edition</h3><p class="why">Which rules new heroes use. 5e (2014) options: ability bonuses come from species, backgrounds give a background feature instead of an origin feat. Classes and spells stay the same. Each hero keeps its own choice, and you can switch one hero in the builder.</p>' + seg('set-rules', st.rules, [['2024', '5.5e (2024)'], ['2014', '5e (2014)']]) + '</section>' +
      '<section class="set-sec"><h3>Critical hits</h3><p class="why">What happens to damage when an attack rolls a natural 20. Example: a Longsword hit for 1d8 + 3.</p>' +
        '<div class="crit-opts">' + Object.keys(rules).map(function (k) {
          var r = rules[k];
          return '<button type="button" class="opt" data-act="set-crit" data-arg="' + k + '" aria-pressed="' + (st.crit === k) + '"><span class="t"><span class="nm" style="font-size:16px">' + h(r.name) + '</span>' + (k === 'dice' ? '<span class="tag">Official rule</span>' : '') + '</span><span class="p">' + h(r.help) + '</span><span class="meta">Longsword crit: ' + h(r.ex) + '</span></button>';
        }).join('') + '</div></section>' +
      '<section class="set-sec"><h3>Weight</h3>' + seg('set-unit', st.unit, [['lb', 'Pounds (lb)'], ['kg', 'Kilograms (kg)']]) + '</section>' +
      '<section class="set-sec"><h3>Theme</h3>' + seg('set-theme', st.theme, [['system', 'Match my device'], ['light', 'Light'], ['dark', 'Dark']]) + '</section>' +
      '<p class="muted2" style="font-size:12px;margin:0">Character Forge version ' + h(CF.version || '?') + '</p>' +
      '</div></div>';
  }

  function notice() {
    var m = app.takeMessage();
    return m ? '<div class="notice' + (m.error ? ' error' : '') + '" role="status">' + h(m.text) + '</div>' : '';
  }
  CF.ui.notice = notice;

  /** In-page dialog (export). Pop-ups and some downloads are blocked in embedded previews, so everything stays in the page. */
  CF.ui.dialog = function () {
    var dlg = app.view.dialog; if (!dlg) return '';
    var ch = CF.store.get(dlg.id); if (!ch) return '';
    return '<div role="dialog" aria-modal="true" aria-labelledby="dlg-t" style="position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px;z-index:50">' +
      '<div class="card" style="width:min(560px,100%);padding:20px;display:flex;flex-direction:column;gap:12px;max-height:90vh">' +
      '<h2 id="dlg-t" style="margin:0;font-size:20px">Export ' + h(ch.name) + '</h2>' +
      '<p class="muted" style="margin:0;font-size:14px">Save this file to back the character up or open it on another computer with “Import a file”.</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px"><button class="btn btn-primary" data-act="export-download" data-arg="' + h(ch.id) + '">' + ICON_DOWN + ' Download file</button><button class="btn" data-act="export-copy" data-arg="' + h(ch.id) + '">Copy</button><span class="grow"></span><button class="btn btn-ghost" data-act="dialog-close" data-key="dlg-close">Close</button></div>' +
      (app.view.dialogNote ? '<div class="notice" role="status">' + h(app.view.dialogNote) + '</div>' : '') +
      '<textarea readonly aria-label="Character file contents" style="min-height:160px;flex-grow:1;border-radius:8px;border:1.5px solid var(--line2);background:var(--bg);padding:10px;font:12px/1.4 ui-monospace,Consolas,monospace">' + h(JSON.stringify(ch, null, 2)) + '</textarea>' +
      '</div></div>';
  };

  CF.ui.home = function () {
    var all = CF.store.list();
    var list = all.filter(function (c) { return !c.draft; }), drafts = all.filter(function (c) { return c.draft; });
    var draftCards = drafts.map(function (ch) {
      var c = ch.classes[0] && CF.content.get('classes', ch.classes[0].id);
      var miss = CF.ui.builderStatus(ch), left = Object.keys(miss).reduce(function (a, k) { return a + miss[k].length; }, 0);
      return '<article class="card char-card"><a class="top" href="' + (ch.builder && ch.builder.mode === 'quick' ? '#/quick/' : '#/build/') + encodeURIComponent(ch.id) + '"><span class="avatar">' + h((ch.name || (c ? c.name : '?')).charAt(0)) + '</span>' +
        '<span style="display:flex;flex-direction:column;gap:3px;min-width:0"><b style="font-size:17px">' + h(ch.name || 'Unnamed hero') + '</b><span class="muted" style="font-size:14px">' + h(c ? c.name + ' · in progress' : 'Just started') + '</span>' +
        '<span style="font-size:13px;font-weight:500;color:var(--warn)">' + left + ' choice' + (left === 1 ? '' : 's') + ' left</span></span></a>' +
        '<div class="actions"><a class="btn btn-sm btn-teal" href="' + (ch.builder && ch.builder.mode === 'quick' ? '#/quick/' : '#/build/') + encodeURIComponent(ch.id) + '">Continue</a>' +
        (app.view.confirmDelete === ch.id
          ? '<span style="display:inline-flex;gap:6px;align-items:center"><span style="font-size:13px">Delete this draft?</span><button class="btn btn-sm btn-primary" data-act="delete-yes" data-arg="' + h(ch.id) + '">Delete</button><button class="btn btn-sm" data-act="delete-no">Keep</button></span>'
          : '<button class="btn btn-sm btn-ghost" data-act="delete" data-arg="' + h(ch.id) + '">Delete</button>') + '</div></article>';
    }).join('');
    var cards = list.map(function (ch) {
      var d; try { d = CF.rules.derive(ch); } catch (e) { d = { summary: 'Could not read this character', level: 1 }; }
      return '<article class="card char-card">' +
        '<a class="top" href="#/c/' + encodeURIComponent(ch.id) + '"><span class="avatar">' + h((ch.name || '?').charAt(0)) + '</span>' +
        '<span style="display:flex;flex-direction:column;gap:3px;min-width:0"><b style="font-size:17px">' + h(ch.name) + '</b><span class="muted" style="font-size:14px">' + h(d.summary) + '</span></span></a>' +
        '<div class="actions">' +
        '<a class="btn btn-sm" href="#/c/' + encodeURIComponent(ch.id) + '">Overview</a>' +
        '<a class="btn btn-sm btn-primary" href="#/c/' + encodeURIComponent(ch.id) + '/play">Play</a>' +
        '<button class="btn btn-sm" data-act="export" data-arg="' + h(ch.id) + '">' + ICON_DOWN + ' Export</button>' +
        (app.view.confirmDelete === ch.id
          ? '<span style="display:inline-flex;gap:6px;align-items:center"><span style="font-size:13px">Delete for good?</span><button class="btn btn-sm btn-primary" data-act="delete-yes" data-arg="' + h(ch.id) + '">Delete</button><button class="btn btn-sm" data-act="delete-no">Keep</button></span>'
          : '<button class="btn btn-sm btn-ghost" data-act="delete" data-arg="' + h(ch.id) + '" aria-label="Delete ' + h(ch.name) + '">Delete</button>') +
        '</div></article>';
    }).join('');

    return CF.ui.topbar() +
      '<main class="page" style="max-width:1180px;gap:28px">' +
      '<section class="home-hero"><h1>Your characters</h1><p>Saved in this browser on this computer. Export a file to back a character up or move it to another device.</p></section>' +
      notice() +
      '<div style="display:flex;flex-wrap:wrap;gap:10px">' +
      '<button class="btn btn-teal" data-act="new-char">New character (guided)</button>' +
      '<button class="btn" data-act="new-quick" title="Everything on one page, levels 1–5">Quick build</button>' +
      '<button class="btn" data-act="new-sample">Try the sample character (Ilsa)</button>' +
      '<label class="btn">' + ICON_UP + ' Import a file<input type="file" accept=".json,application/json" class="sr-only" data-act="import"></label>' +
      '</div>' +
      (drafts.length ? '<section style="display:flex;flex-direction:column;gap:12px" aria-labelledby="h-drafts"><h2 id="h-drafts" class="h-sec">Unfinished</h2><div class="char-grid">' + draftCards + '</div></section>' : '') +
      (list.length ? '<section class="char-grid" aria-label="Characters">' + cards + '</section>' :
        (drafts.length ? '' : '<div class="empty"><b style="font-size:17px;color:var(--ink)">No characters yet</b><span>Start a new character with the guided builder, try the sample character, or import a file you exported earlier.</span></div>')) +
      CF.ui.dialog() +
      '<p class="muted2" style="font-size:12px;margin:0">This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener">dndbeyond.com/srd</a>. The SRD 5.2.1 is licensed under the <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noopener">Creative Commons Attribution 4.0 International License</a>. Character Forge is a fan project and isn’t affiliated with Wizards of the Coast.</p>' +
      '</main>';
  };

  /* ----- handlers ----- */
  var H = app.handlers;
  H.theme = function () { app.toggleTheme(); };
  H.settings = function () { app.view.settingsOpen = true; app.render(); };
  H['settings-close'] = function () { app.view.settingsOpen = false; app.render(); };
  H['set-crit'] = function (k) { CF.store.setSetting('crit', k); app.render(); };
  H['set-rules'] = function (r) { CF.store.setSetting('rules', r === '2014' ? '2014' : '2024'); app.render(); };
  H['set-unit'] = function (u) { CF.store.setSetting('unit', u); app.render(); };
  H['set-theme'] = function (t) { CF.store.setSetting('theme', t); app.applyTheme(); app.render(); };
  H['new-char'] = function () { CF.ui.newDraft(); };
  H['new-quick'] = function () { CF.ui.newDraft('quick'); };
  H['new-sample'] = function () {
    var ch = CF.rules.sampleIlsa();
    if (!CF.store.put(ch)) { app.flash('Couldn’t save: this browser’s storage is full or blocked.', true); app.render(); return; }
    app.go('#/c/' + encodeURIComponent(ch.id));
  };
  H.export = function (id) { app.view.dialog = { kind: 'export', id: id }; app.render(); };
  H['export-download'] = function (id) {
    var ch = CF.store.get(id); if (!ch) return;
    try { CF.store.exportCharacter(ch); app.view.dialogNote = 'If no file appeared, your browser blocked the download here. Use Copy instead and paste it into a text file.'; }
    catch (e) { app.view.dialogNote = 'Downloads are blocked here. Use Copy instead.'; }
    app.render();
  };
  H['export-copy'] = function (id) {
    var ch = CF.store.get(id); if (!ch) return;
    var text = JSON.stringify(ch, null, 2);
    var done = function (ok) { app.view.dialogNote = ok ? 'Copied. Paste it into a file named something like ilsa.character.json.' : 'Couldn’t copy automatically: select the text below and copy it.'; app.render(); };
    try { navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); }); } catch (e) { done(false); }
  };
  H['dialog-close'] = function () { app.view.dialog = null; app.view.dialogNote = null; app.render(); };
  H.delete = function (id) { app.view.confirmDelete = id; app.render(); };
  H['delete-no'] = function () { app.view.confirmDelete = null; app.render(); };
  H['delete-yes'] = function (id) {
    var ch = CF.store.get(id); if (!ch) return;
    CF.store.remove(id); app.view.confirmDelete = null; app.flash(ch.name + ' was deleted.'); app.render();
  };
  H.import = function (arg, input) {
    var files = Array.prototype.slice.call((input && input.files) || []); if (!files.length) return;
    var done = [], errors = [], left = files.length, nMod = 0, nChar = 0;
    files.forEach(function (f) {
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var res = CF.store.parseImport(String(reader.result));
          if (res.kind === 'character') { done.push(CF.store.importCharacter(res.data).name); nChar++; }
          else if (res.kind === 'bundle') res.data.packs.forEach(function (p) { CF.store.saveModule(p); done.push('“' + p.name + '”'); nMod++; });
          else { CF.store.saveModule(res.data); done.push('“' + res.data.name + '”'); nMod++; }
        } catch (e) { errors.push(f.name + ': ' + e.message); }
        if (--left) return;
        if (errors.length) app.flash(errors.join('\n'), true);
        else app.flash(done.length === 1 ? done[0] + ' was added.' : [nMod ? nMod + ' modules' : '', nChar ? nChar + ' characters' : ''].filter(Boolean).join(' and ') + ' were added.');
        if (input) try { input.value = ''; } catch (e) {}
        app.render();
      };
      reader.readAsText(f);
    });
  };
  H['remove-module'] = function (id) { app.view.confirmModule = id; app.render(); };
  H['remove-module-yes'] = function (id) { CF.store.removeModule(id); app.view.confirmModule = null; app.flash('Module removed.'); app.render(); };
  H['remove-module-no'] = function () { app.view.confirmModule = null; app.render(); };
})(window);
