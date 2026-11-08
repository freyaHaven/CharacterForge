/* Character Forge — app shell: routing, theme, rendering, dice, toasts. */
(function (root) {
  'use strict';
  var CF = root.CF, doc = root.document;

  var app = CF.app = {
    el: null,
    view: {},        // per-screen UI state that isn't saved (open tab, filters…)
    lastRoll: null,
    message: null,   // { text, error }

    start: function () {
      app.el = doc.getElementById('app');
      CF.store.loadModules();
      app.applyTheme();
      try {
        root.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { app.applyTheme(); });
      } catch (e) { /* older browsers */ }
      root.addEventListener('hashchange', function () { var keep = app.view.settingsOpen; app.view = {}; app.lastRoll = null; app.critActive = null; app.lastCast = null; if (keep) app.view.settingsOpen = true; app.render(); });
      app.el.addEventListener('click', app.onEvent);
      app.el.addEventListener('input', app.onEvent);
      app.el.addEventListener('change', app.onEvent);
      app.el.addEventListener('mouseover', app.onHover);
      app.el.addEventListener('focusin', app.onHover);
      app.render();
    },

    /* ----- theme ----- */
    theme: function () {
      var t = CF.store.settings().theme;
      if (t === 'system') t = root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      return t;
    },
    applyTheme: function () { doc.documentElement.setAttribute('data-theme', app.theme()); },
    toggleTheme: function () { CF.store.setSetting('theme', app.theme() === 'dark' ? 'light' : 'dark'); app.applyTheme(); app.render(); },

    /* ----- routing ----- */
    route: function () {
      var h = (root.location.hash || '#/').replace(/^#/, '');
      var parts = h.split('/').filter(Boolean);
      if (parts[0] === 'c' && parts[1]) return { screen: 'sheet', id: decodeURIComponent(parts[1]), play: parts[2] === 'play' };
      if (parts[0] === 'modules') return { screen: 'modules', id: parts[1] ? decodeURIComponent(parts[1]) : null };
      if (parts[0] === 'build' && parts[1]) return { screen: 'builder', id: decodeURIComponent(parts[1]) };
      if (parts[0] === 'quick' && parts[1]) return { screen: 'quick', id: decodeURIComponent(parts[1]) };
      if (parts[0] === 'levelup' && parts[1]) return { screen: 'levelup', id: decodeURIComponent(parts[1]) };
      return { screen: 'home' };
    },
    go: function (hash) { root.location.hash = hash; },

    /* ----- rendering (keeps scroll position and focus) ----- */
    render: function () {
      var r = app.route();
      var panel = app.el.querySelector('.tabpanel');
      var scrollTop = panel ? panel.scrollTop : 0;
      var active = doc.activeElement, key = active && active.getAttribute && active.getAttribute('data-key');
      var caret = key && active.selectionStart != null ? [active.selectionStart, active.selectionEnd] : null;

      var html;
      if (r.screen === 'sheet') html = CF.ui.sheet(r);
      else if (r.screen === 'builder') html = CF.ui.builder(r);
      else if (r.screen === 'levelup') html = CF.ui.levelup(r);
      else if (r.screen === 'quick') html = CF.ui.quick(r);
      else if (r.screen === 'modules') html = CF.ui.modules(r);
      else html = CF.ui.home();
      app.el.innerHTML = html;

      var p2 = app.el.querySelector('.tabpanel');
      if (p2) p2.scrollTop = app.view.resetScroll ? 0 : scrollTop;
      app.view.resetScroll = false;
      if (key) {
        var again = app.el.querySelector('[data-key="' + key + '"]');
        if (again) { again.focus(); if (caret && again.setSelectionRange) try { again.setSelectionRange(caret[0], caret[1]); } catch (e) { /* not a text field */ } }
      }
    },

    /* ----- events: elements carry data-act="name" and optional data-arg ----- */
    handlers: {},
    hoverHandlers: {},
    onEvent: function (e) {
      var t = e.target.closest('[data-act]');
      if (!t || !app.el.contains(t)) return;
      var tag = t.tagName;
      var isField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.type === 'click' && isField && t.type !== 'checkbox') return;
      if (e.type === 'input' && !isField) return;
      if (e.type === 'change' && !(t.type === 'file' || tag === 'SELECT')) return;
      if (e.type === 'input' && (t.type === 'file' || tag === 'SELECT')) return;
      var fn = app.handlers[t.getAttribute('data-act')];
      if (fn) { if (tag === 'A' || tag === 'BUTTON') e.preventDefault(); fn(t.getAttribute('data-arg'), t, e); }
    },
    onHover: function (e) {
      var t = e.target.closest && e.target.closest('[data-hover]');
      if (!t || !app.el.contains(t)) return;
      var fn = app.hoverHandlers[t.getAttribute('data-hover')];
      if (fn) fn(t.getAttribute('data-arg'), t);
    },

    /* ----- dice ----- */
    roll: function (label, n, sides, mod) {
      var rolls = [];
      for (var i = 0; i < n; i++) rolls.push(1 + Math.floor(Math.random() * sides));
      var total = rolls.reduce(function (a, b) { return a + b; }, 0) + (mod || 0);
      var nat = sides === 20 && n === 1 ? rolls[0] : 0;
      app.lastRoll = {
        label: label, total: total, nat: nat,
        detail: '[' + rolls.join(', ') + ']' + (mod ? (mod > 0 ? ' + ' + mod : ' − ' + Math.abs(mod)) : '') + (nat === 20 ? ' · Natural 20!' : nat === 1 ? ' · Natural 1' : '')
      };
      if (CF.dice) CF.dice.show(Object.assign({ sides: sides, rolls: rolls }, app.lastRoll));
      return { rolls: rolls, total: total, nat: nat };
    },
    /** "1d8" + mod → roll. With crit, the table's critical-hit rule from Settings is applied. */
    rollDice: function (label, dice, mod, crit) {
      var m = /^(\d+)d(\d+)$/.exec(dice || '');
      if (!m) return null;
      return crit ? app.rollCrit(label, +m[1], +m[2], mod || 0) : app.roll(label, +m[1], +m[2], mod || 0);
    },
    CRIT_RULES: {
      dice: { name: 'Roll the damage dice twice', short: 'dice rolled twice', help: 'The official rule. Roll all of the attack’s damage dice twice, then add modifiers once.', ex: '2d8 + 3' },
      double: { name: 'Double the total', short: 'total doubled', help: 'Roll damage normally, then double the whole result, modifiers included.', ex: '(1d8 + 3) × 2' },
      max: { name: 'Maximum dice plus a roll', short: 'max dice + a roll', help: 'Take the highest possible result for the dice, then roll them once more and add modifiers.', ex: '8 + 1d8 + 3' },
      none: { name: 'No extra damage', short: 'normal damage', help: 'A natural 20 always hits, but damage is rolled as usual.', ex: '1d8 + 3' }
    },
    rollCrit: function (label, n, sides, mod) {
      var mode = CF.store.settings().crit || 'dice';
      var roll = function (k) { var r = []; for (var i = 0; i < k; i++) r.push(1 + Math.floor(Math.random() * sides)); return r; };
      var sum = function (a) { return a.reduce(function (x, y) { return x + y; }, 0); };
      var modTxt = mod ? (mod > 0 ? ' + ' + mod : ' − ' + Math.abs(mod)) : '';
      var rolls, total, detail;
      if (mode === 'double') { rolls = roll(n); total = (sum(rolls) + mod) * 2; detail = '([' + rolls.join(', ') + ']' + modTxt + ') × 2'; }
      else if (mode === 'max') { rolls = roll(n); total = n * sides + sum(rolls) + mod; detail = n * sides + ' max + [' + rolls.join(', ') + ']' + modTxt; }
      else if (mode === 'none') { rolls = roll(n); total = sum(rolls) + mod; detail = '[' + rolls.join(', ') + ']' + modTxt; }
      else { rolls = roll(n * 2); total = sum(rolls) + mod; detail = '[' + rolls.join(', ') + ']' + modTxt + ' · dice doubled'; }
      app.lastRoll = { label: label + ' · Critical!', total: Math.max(0, total), nat: 0, crit: true, detail: detail };
      if (CF.dice) CF.dice.show(Object.assign({ sides: sides, rolls: rolls }, app.lastRoll));
      return { rolls: rolls, total: total, nat: 0 };
    },

    flash: function (text, error) { app.message = { text: text, error: !!error }; },
    takeMessage: function () { var m = app.message; app.message = null; return m; }
  };

  CF.ui = CF.ui || {};
  doc.addEventListener('DOMContentLoaded', app.start);
})(window);
