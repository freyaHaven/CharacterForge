/*
 * 3D dice: a small card fixed to the bottom-right of the window. Every roll tumbles real polyhedra
 * (d4, d6, d8, d10, d12, d20) drawn on a canvas, and they land with the rolled number facing you.
 * No libraries: a few lines of quaternion maths and a painter's-algorithm renderer.
 */
(function (root) {
  'use strict';
  var CF = root.CF, doc = root.document;

  /* ---------- geometry ---------- */
  var PHI = (1 + Math.sqrt(5)) / 2;
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function centroid(vs, f) { var c = [0, 0, 0]; f.forEach(function (i) { c[0] += vs[i][0]; c[1] += vs[i][1]; c[2] += vs[i][2]; }); return [c[0] / f.length, c[1] / f.length, c[2] / f.length]; }
  /** Faces from a convex point set: every plane through 3 points with all other points on one side. */
  function hull(vs) {
    var faces = [], seen = {};
    for (var i = 0; i < vs.length; i++) for (var j = i + 1; j < vs.length; j++) for (var k = j + 1; k < vs.length; k++) {
      var n = cross(sub(vs[j], vs[i]), sub(vs[k], vs[i])); if (Math.hypot(n[0], n[1], n[2]) < 1e-6) continue; n = norm(n);
      var d = dot(n, vs[i]), pos = 0, neg = 0, on = [];
      for (var m = 0; m < vs.length; m++) { var s = dot(n, vs[m]) - d; if (s > 1e-6) pos++; else if (s < -1e-6) neg++; else on.push(m); }
      if (pos && neg) continue;
      if (pos) n = [-n[0], -n[1], -n[2]];
      var key = on.slice().sort(function (a, b) { return a - b; }).join(',');
      if (seen[key]) continue; seen[key] = 1;
      // order the face's points around its centre
      var c = centroid(vs, on), u = norm(sub(vs[on[0]], c)), w = cross(n, u);
      on.sort(function (a, b) { var pa = sub(vs[a], c), pb = sub(vs[b], c); return Math.atan2(dot(pa, w), dot(pa, u)) - Math.atan2(dot(pb, w), dot(pb, u)); });
      faces.push({ v: on, n: n });
    }
    return faces;
  }
  function solid(vs) { var m = Math.max.apply(null, vs.map(function (v) { return Math.hypot(v[0], v[1], v[2]); })); vs = vs.map(function (v) { return [v[0] / m, v[1] / m, v[2] / m]; }); return { vs: vs, faces: hull(vs) }; }
  var SHAPES = {};
  SHAPES[4] = solid([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]);
  SHAPES[6] = solid([[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]);
  SHAPES[8] = solid([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
  SHAPES[12] = (function () {
    var v = [], a = 1 / PHI;
    [-1, 1].forEach(function (x) { [-1, 1].forEach(function (y) { [-1, 1].forEach(function (z) { v.push([x, y, z]); }); }); });
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { v.push([0, s * a, t * PHI]); v.push([s * a, t * PHI, 0]); v.push([s * PHI, 0, t * a]); }); });
    return solid(v);
  })();
  SHAPES[20] = (function () {
    var v = [];
    [-1, 1].forEach(function (s) { [-1, 1].forEach(function (t) { v.push([0, s, t * PHI]); v.push([s, t * PHI, 0]); v.push([s * PHI, 0, t]); }); });
    return solid(v);
  })();
  SHAPES[10] = (function () {   // pentagonal trapezohedron: two apexes and two staggered rings
    var v = [[0, 0, 1], [0, 0, -1]], h = 0.105;
    for (var i = 0; i < 10; i++) { var a = i * Math.PI / 5; v.push([Math.cos(a) * 0.9, Math.sin(a) * 0.9, i % 2 ? -h : h]); }
    var faces = [];
    for (var j = 0; j < 10; j += 2) faces.push([0, 2 + j, 2 + (j + 1) % 10, 2 + (j + 2) % 10]);
    for (var k = 1; k < 10; k += 2) faces.push([1, 2 + k, 2 + (k + 1) % 10, 2 + (k + 2) % 10]);
    return { vs: v, faces: faces.map(function (f) { var c = centroid(v, f), n = norm(cross(sub(v[f[1]], v[f[0]]), sub(v[f[2]], v[f[0]]))); if (dot(n, c) < 0) { n = [-n[0], -n[1], -n[2]]; f = f.slice().reverse(); } return { v: f, n: n }; }) };
  })();
  function shapeFor(sides) { return SHAPES[sides] || SHAPES[20]; }

  /* ---------- rotations ---------- */
  function qmul(a, b) { return [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]]; }
  function qaxis(ax, ang) { ax = norm(ax); var s = Math.sin(ang / 2); return [Math.cos(ang / 2), ax[0] * s, ax[1] * s, ax[2] * s]; }
  function qrot(q, v) { var p = qmul(qmul(q, [0, v[0], v[1], v[2]]), [q[0], -q[1], -q[2], -q[3]]); return [p[1], p[2], p[3]]; }
  function qslerp(a, b, t) {
    var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (d < 0) { b = b.map(function (x) { return -x; }); d = -d; }
    if (d > 0.9995) { var r = a.map(function (x, i) { return x + (b[i] - x) * t; }); var l = Math.hypot.apply(null, r); return r.map(function (x) { return x / l; }); }
    var th = Math.acos(d), s = Math.sin(th);
    return a.map(function (x, i) { return (Math.sin((1 - t) * th) * x + Math.sin(t * th) * b[i]) / s; });
  }
  function qbetween(from, to) {
    from = norm(from); to = norm(to); var d = dot(from, to);
    if (d > 0.99999) return [1, 0, 0, 0];
    if (d < -0.99999) return qaxis(Math.abs(from[0]) < 0.9 ? cross(from, [1, 0, 0]) : cross(from, [0, 1, 0]), Math.PI);
    return qaxis(cross(from, to), Math.acos(d));
  }
  function qrand() { var u = Math.random(), v = Math.random(), w = Math.random(); return [Math.sqrt(1 - u) * Math.sin(2 * Math.PI * v), Math.sqrt(1 - u) * Math.cos(2 * Math.PI * v), Math.sqrt(u) * Math.sin(2 * Math.PI * w), Math.sqrt(u) * Math.cos(2 * Math.PI * w)]; }
  /** The orientation that shows face fi towards the viewer, upright. */
  function faceUp(shape, fi) {
    var f = shape.faces[fi], q1 = qbetween(f.n, [0, 0, 1]);
    var c = centroid(shape.vs, f.v), a = shape.vs[f.v[0]], b = shape.vs[f.v[1]];
    var up = norm(sub(f.v.length === 3 ? a : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], c)), u2 = qrot(q1, up);
    var ang = Math.atan2(u2[0], -u2[1]);
    var upright = qmul(qaxis([0, 0, 1], -ang), q1);
    // a slight tilt so the die reads as a solid, with the rolled face still the most frontal one
    return qmul(qmul(qaxis([1, 0, 0], -0.32), qaxis([0, 1, 0], 0.24)), upright);
  }

  /* ---------- drawing ---------- */
  function css(name, fallback) { try { var v = getComputedStyle(doc.documentElement).getPropertyValue(name).trim(); return v || fallback; } catch (e) { return fallback; } }
  function drawDie(ctx, shape, q, cx, cy, size, labels, tone, hi, settle) {
    var light = norm([-0.4, -0.6, 1]), f = 3.2;
    var faces = shape.faces.map(function (fc, i) {
      var pts = fc.v.map(function (k) { var p = qrot(q, shape.vs[k]); var s = f / (f - p[2]); return [cx + p[0] * size * s, cy + p[1] * size * s, p[2]]; });
      var n = qrot(q, fc.n);
      return { pts: pts, n: n, z: pts.reduce(function (a, p) { return a + p[2]; }, 0) / pts.length, label: labels[i], hi: i === hi };
    }).filter(function (x) { return x.n[2] > 0.02; }).sort(function (a, b) { return a.z - b.z; });
    faces.forEach(function (fc) {
      var lum = Math.max(0, dot(fc.n, light)), shade = 0.55 + 0.45 * lum;
      ctx.beginPath(); fc.pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath();
      var base = tone.face;
      ctx.fillStyle = 'rgb(' + Math.round(base[0] * shade) + ',' + Math.round(base[1] * shade) + ',' + Math.round(base[2] * shade) + ')';
      ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = tone.edge; ctx.stroke();
      if (fc.n[2] > 0.45 && fc.label != null) {
        var c = fc.pts.reduce(function (a, p) { return [a[0] + p[0] / fc.pts.length, a[1] + p[1] / fc.pts.length]; }, [0, 0]);
        var strong = fc.hi && settle > 0.6;
        ctx.globalAlpha = Math.min(1, (fc.n[2] - 0.45) * 3) * (strong ? 1 : settle > 0.6 ? 0.42 : 0.85);
        ctx.fillStyle = tone.ink; ctx.font = (strong ? '800 ' : '600 ') + Math.round(size * (String(fc.label).length > 1 ? 0.42 : 0.5) * (strong ? 1.1 : 0.78) * (0.6 + 0.4 * fc.n[2])) + 'px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(fc.label), c[0], c[1] + 1);
        ctx.globalAlpha = 1;
      }
    });
  }

  /* ---------- roll history (kept on this device) ---------- */
  var KEY = 'cf.rolls.v1', MAX = 100, history = [];
  try { history = JSON.parse(root.localStorage.getItem(KEY) || '[]') || []; } catch (e) { history = []; }
  function save() { try { root.localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX))); } catch (e) {} }
  function who() {
    try { var r = CF.app.route(); if (r.id && (r.screen === 'sheet' || r.screen === 'levelup')) { var c = CF.store.get(r.id); return c && c.name || ''; } } catch (e) {}
    return '';
  }
  function esc(s) { return CF.util.esc(String(s == null ? '' : s)); }
  function time(t) { var d = new Date(t); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  /* ---------- the corner card ---------- */
  var el = null, canvas = null, raf = 0, hidden = false, fab = null, panel = null;
  function renderHistory() {
    if (!panel) return;
    panel.querySelector('.dh-list').innerHTML = history.length ? history.map(function (r) {
      return '<li class="' + (r.kind || '') + '"><span class="dh-t">' + time(r.t) + '</span><span class="dh-main"><span class="dh-l">' + esc(r.label) + '</span><span class="dh-d">' + esc((r.who ? r.who + ' · ' : '') + (r.detail || '')) + '</span></span><span class="dh-v">' + esc(r.total) + '</span></li>';
    }).join('') : '<li class="dh-empty">No rolls yet. Roll something on a character sheet.</li>';
    if (fab) { fab.querySelector('.n').textContent = history.length > 99 ? '99+' : history.length; fab.classList.toggle('has', history.length > 0); var l = history[0]; fab.querySelector('.last').textContent = l ? 'Last: ' + l.total : ''; }
  }
  function openHistory(on) {
    if (!panel) return;
    panel.classList.toggle('show', on); fab.setAttribute('aria-expanded', on);
    if (on) { el && el.classList.remove('show'); renderHistory(); panel.querySelector('.dh-close').focus(); }
  }
  function ensure() {
    if (el || !doc || !doc.body || !doc.body.appendChild || !doc.createElement) return el;
    el = doc.createElement('div');
    if (!el || !el.setAttribute) { el = null; return null; }
    fab = doc.createElement('button'); fab.type = 'button'; fab.className = 'dice-fab'; fab.setAttribute('aria-label', 'Roll history'); fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M12 2v20M3 7l9 5 9-5"/></svg><span class="lbl">Roll history</span><span class="last"></span><span class="n">0</span>';
    panel = doc.createElement('div'); panel.className = 'dice-history'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Roll history');
    panel.innerHTML = '<div class="dh-head"><b>Roll history</b><button type="button" class="dh-clear">Clear</button><button type="button" class="dh-close" aria-label="Close roll history">×</button></div><ol class="dh-list"></ol>';
    doc.body.appendChild(panel); doc.body.appendChild(fab);
    fab.addEventListener('click', function () { openHistory(!panel.classList.contains('show')); });
    panel.querySelector('.dh-close').addEventListener('click', function () { openHistory(false); fab.focus(); });
    panel.querySelector('.dh-clear').addEventListener('click', function () { history = []; save(); renderHistory(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('show')) { openHistory(false); fab.focus(); } });
    el.className = 'dice-corner'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<button type="button" class="dc-close" aria-label="Hide dice">×</button><canvas width="240" height="150" aria-hidden="true"></canvas><div class="dc-info"><div class="dc-label"></div><div class="dc-detail"></div></div><div class="dc-total"></div>';
    doc.body.appendChild(el);
    canvas = el.querySelector('canvas');
    renderHistory();
    el.querySelector('.dc-close').addEventListener('click', function () { el.classList.remove('show'); hidden = true; });
    return el;
  }
  function tones(kind) {
    var accent = css('--teal-bg', '#1F5F6B');
    var hex = function (s) { var m = /^#?([0-9a-f]{6})$/i.exec(s.trim()); if (!m) return [31, 95, 107]; var n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    if (kind === 'nat20') return { face: [224, 172, 70], edge: 'rgba(80,50,0,.55)', ink: '#2b1a00' };
    if (kind === 'nat1') return { face: [176, 52, 52], edge: 'rgba(60,0,0,.6)', ink: '#fff' };
    if (kind === 'crit') return { face: [196, 64, 48], edge: 'rgba(60,0,0,.6)', ink: '#fff' };
    return { face: hex(accent), edge: 'rgba(0,0,0,.35)', ink: '#fff' };
  }

  /** Show a roll: { label, total, detail, sides, rolls:[…], nat, crit }. */
  function show(r) {
    var kind0 = r.crit ? 'crit' : r.nat === 20 ? 'nat20' : r.nat === 1 ? 'nat1' : '';
    history.unshift({ t: Date.now(), who: who(), label: r.label, detail: r.detail, total: r.total, kind: kind0 });
    history = history.slice(0, MAX); save();
    if (!ensure() || !canvas || !canvas.getContext) return;
    renderHistory(); if (panel.classList.contains('show')) openHistory(false);
    hidden = false;
    var ctx = canvas.getContext('2d'); if (!ctx) return;
    var kind = r.crit ? 'crit' : r.nat === 20 ? 'nat20' : r.nat === 1 ? 'nat1' : '';
    el.className = 'dice-corner show' + (kind ? ' ' + kind : '');
    el.querySelector('.dc-label').textContent = r.label || 'Roll';
    el.querySelector('.dc-detail').textContent = r.detail || '';
    var tot = el.querySelector('.dc-total'); tot.textContent = ''; tot.classList.remove('in');
    var sides = r.sides || 20, values = (r.rolls || [r.total]).slice(0, 4), extra = (r.rolls || []).length - values.length;
    var shape = shapeFor(sides), tone = tones(kind);
    var dpr = root.devicePixelRatio || 1, W = 240, H = 150;
    canvas.width = W * dpr; canvas.height = H * dpr;
    var n = values.length, size = n === 1 ? 46 : n === 2 ? 38 : 30;
    var dice = values.map(function (val, i) {
      var faceCount = shape.faces.length, exact = sides === faceCount;
      var face = exact ? Math.min(faceCount, Math.max(1, val)) - 1 : Math.floor(Math.random() * faceCount);
      var labels = shape.faces.map(function (x, k) { return exact ? k + 1 : 1 + Math.floor(Math.random() * sides); });
      labels[face] = val;
      return { face: face, q0: qrand(), qT: faceUp(shape, face), axis: [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5], spins: 2 + Math.random() * 1.5, delay: i * 70,
        x: W / 2 + (i - (n - 1) / 2) * (size * 2.1), labels: labels };
    });
    var reduce = false; try { reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var start = null, DUR = reduce ? 0 : 1100;
    cancelAnimationFrame(raf);
    var frame = function (ts) {
      if (start == null) start = ts;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var done = true;
      dice.forEach(function (d) {
        var t = DUR ? Math.min(1, Math.max(0, (ts - start - d.delay) / DUR)) : 1; if (t < 1) done = false;
        var e = 1 - Math.pow(1 - t, 3);
        var q = qmul(qaxis(d.axis, (1 - e) * d.spins * Math.PI * 2), qslerp(d.q0, d.qT, e));
        var bounce = Math.abs(Math.sin(t * Math.PI * 2.5)) * (1 - t) * 34;
        var slide = (1 - e) * 90;
        ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(d.x + slide, H - 18, size * 0.8, size * 0.18, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        drawDie(ctx, shape, q, d.x + slide, H / 2 + 6 - bounce, size, d.labels, tone, d.face, e);
      });
      if (!done) raf = requestAnimationFrame(frame);
      else { tot.textContent = r.total; tot.classList.add('in'); if (extra > 0) el.querySelector('.dc-detail').textContent = (r.detail || '') + ' (showing 4 of ' + (extra + 4) + ' dice)'; }
    };
    raf = requestAnimationFrame(frame);
  }

  // show the history card straight away if there are saved rolls
  if (history.length && doc && doc.addEventListener) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', ensure); else setTimeout(ensure, 0); }
  /** A roll made by another player (Owlbear Rodeo room): goes into the history without dice. */
  function addRemote(d) {
    history.unshift({ t: Date.now(), who: d.who || 'Another player', label: d.label, detail: d.detail, total: d.total, kind: d.kind || '', remote: true });
    history = history.slice(0, MAX); save();
    if (ensure()) renderHistory();
  }
  CF.dice = { show: show, addRemote: addRemote, history: function () { return history.slice(); }, shapes: SHAPES, _faceUp: faceUp, _qrot: qrot };
})(window);
