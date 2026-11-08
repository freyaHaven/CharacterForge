/*
 * Personality traits, ideals, bonds and flaws: pick from the background's lists, roll, or write your own.
 * Shared by the builder (Details step) and the sheet (Background tab, Play mode).
 */
(function (root) {
  'use strict';
  var CF = root.CF, app = CF.app, h = CF.util.esc;
  var CATS = [
    ['traits', 'Personality Traits', 2, 'How does your hero act? Little habits, quirks, the way they talk.'],
    ['ideals', 'Ideal', 1, 'What does your hero believe in above all?'],
    ['bonds', 'Bond', 1, 'Who or what does your hero care about most?'],
    ['flaws', 'Flaw', 1, 'What weakness or vice could get your hero in trouble?']
  ];
  function data(ch) {
    ch.details = ch.details || {};
    var p = ch.details.personality = ch.details.personality || {};
    CATS.forEach(function (c) { var x = p[c[0]] = p[c[0]] || { picked: [], own: '' }; if (x.other === undefined) x.other = !!(x.own && x.own.trim()); });
    return p;
  }
  /** The chosen lines of one category (picked + written), for showing on the sheet. */
  function chosen(ch, cat) {
    var p = ((ch.details || {}).personality || {})[cat] || {};
    var useOwn = p.other === undefined ? !!(p.own && p.own.trim()) : p.other;
    return (p.picked || []).concat(useOwn && p.own && p.own.trim() ? [p.own.trim()] : []);
  }

  /** Editor. bg may have no lists: then it's just the write-your-own boxes. */
  function editor(ch, bg) {
    var p = data(ch), lists = (bg && bg.personality) || {};
    return '<div class="pers">' + CATS.map(function (c) {
      var key = c[0], list = lists[key] || [], cur = p[key], n = c[2];
      var used = cur.picked.length + (list.length && cur.other ? 1 : 0), full = used >= n;
      var box = '<label class="b-field" style="margin:0"><span class="sr-only">' + (list.length ? 'Your own ' : 'Write your own ') + c[1].toLowerCase() + '</span><textarea rows="2" data-act="pers-own" data-arg="' + h(ch.id + '|' + key) + '" data-key="pers-' + key + '" placeholder="Write your own…">' + h(cur.own || '') + '</textarea></label>';
      var picks = '';
      if (list.length) {
        picks = '<div class="pers-list">' + list.map(function (line, i) {
          var sel = cur.picked.indexOf(line) >= 0;
          return '<button type="button" class="pers-opt" data-act="pers-pick" data-arg="' + h(ch.id + '|' + key + '|' + i) + '" aria-pressed="' + sel + '"' + (!sel && full ? ' disabled' : '') + '>' + h(line) + '</button>';
        }).join('') +
        '<button type="button" class="pers-opt pers-other" data-act="pers-other" data-arg="' + h(ch.id + '|' + key) + '" aria-pressed="' + !!cur.other + '"' + (!cur.other && full ? ' disabled' : '') + '>Other: write your own</button>' +
        (cur.other ? box : '') + '</div>';
      }
      return '<div class="pers-cat"><div class="pers-head"><b>' + c[1] + '</b>' +
        (list.length ? '<span class="muted2" style="font-size:13px">Pick ' + n + ' · ' + used + '/' + n + '</span><button type="button" class="link-btn" data-act="pers-roll" data-arg="' + h(ch.id + '|' + key) + '">Roll</button>' + (used ? '<button type="button" class="link-btn" data-act="pers-clear" data-arg="' + h(ch.id + '|' + key) + '">Clear</button>' : '') : '') +
        '</div><span class="muted" style="font-size:13px">' + c[3] + (list.length ? ' Pick from your ' + h(bg.name) + ' background, or choose Other to write your own.' : '') + '</span>' + (list.length ? picks : box) + '</div>';
    }).join('') + '</div>';
  }
  /** Read-only view for the sheet. */
  function view(ch) {
    var any = false;
    var out = CATS.map(function (c) {
      var lines = chosen(ch, c[0]); if (lines.length) any = true;
      return '<div class="pers-view"><b>' + c[1] + '</b>' + (lines.length ? lines.map(function (l) { return '<span>' + h(l) + '</span>'; }).join('') : '<span class="muted2">Not written yet.</span>') + '</div>';
    }).join('');
    return any ? '<div class="pers-grid">' + out + '</div>' : '<p class="muted2" style="margin:0;font-size:14px">No traits, ideals, bonds or flaws yet. Switch to Play mode to pick or write them.</p>';
  }

  function bgOf(ch) { var id = ch.background && ch.background.id; return id ? CF.content.get('backgrounds', id, CF.content.on(ch)) : null; }
  function change(arg, fn, rerender) {
    var a = String(arg).split('|'), ch = CF.store.get(a[0]); if (!ch) return;
    fn(ch, data(ch)[a[1]], a, bgOf(ch));
    if (rerender) { CF.store.put(ch); app.render(); } else CF.store.putSoon(ch);
  }
  var N = {}; CATS.forEach(function (c) { N[c[0]] = c[2]; });
  var H = app.handlers;
  H['pers-pick'] = function (arg) {
    change(arg, function (ch, cur, a, bg) {
      var line = ((bg && bg.personality && bg.personality[a[1]]) || [])[+a[2]]; if (!line) return;
      var i = cur.picked.indexOf(line);
      if (i >= 0) cur.picked.splice(i, 1); else if (cur.picked.length + (cur.other ? 1 : 0) < N[a[1]]) cur.picked.push(line);
    }, true);
  };
  H['pers-roll'] = function (arg) {
    change(arg, function (ch, cur, a, bg) {
      var pool = ((bg && bg.personality && bg.personality[a[1]]) || []).slice(), out = [];
      cur.other = false;
      while (pool.length && out.length < N[a[1]]) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      cur.picked = out;
    }, true);
  };
  H['pers-clear'] = function (arg) { change(arg, function (ch, cur) { cur.picked = []; cur.other = false; }, true); };
  H['pers-other'] = function (arg) {
    change(arg, function (ch, cur, a) {
      if (cur.other) cur.other = false;
      else if (cur.picked.length < N[a[1]]) cur.other = true;
    }, true);
  };
  H['pers-own'] = function (arg, el) { change(arg, function (ch, cur) { cur.own = el.value; }, false); };

  CF.ui = CF.ui || {};
  CF.ui.personality = { editor: editor, view: view, chosen: chosen };
})(window);
