/*
 * Choices a feat asks for when you take it: one option (Elemental Adept's damage type…),
 * spells to learn (Fey-Touched's 1st-level spell…), and the ability those spells use.
 * Used by the builder (background feat, Human's Versatile feat) and by Level up.
 */
(function (root) {
  'use strict';
  var CF = root.CF, R = CF.rules, h = CF.util.esc;

  function needsAbility(feat) {
    if (!feat.spells) return false;
    var mental = ['int', 'wis', 'cha'];
    return !(Array.isArray(feat.asi) && feat.asi.length && feat.asi.every(function (a) { return mental.indexOf(a) >= 0; }));
  }
  function pill(act, arg, label, pressed, disabled) {
    return '<button type="button" class="pill" data-act="' + act + '" data-arg="' + h(arg) + '" aria-pressed="' + !!pressed + '"' + (disabled ? ' disabled' : '') + '>' + label + '</button>';
  }

  /**
   * feat: the feat; picks: { option, spells: {blockIndex: [ids]}, ability }; act: handler prefix (e.g. 'fp' or 'lu-fp');
   * key: which feat (sent back to the handler); on: enabled packs; taken: spell ids the hero already has.
   */
  function render(feat, picks, act, key, on, taken) {
    picks = picks || {}; taken = taken || [];
    if (!feat || (!feat.options && !feat.spells)) return '';
    var out = '<div class="fp">';
    if (feat.options) {
      var cur = feat.options.find(function (o) { return o.id === picks.option; });
      out += '<div class="fp-block"><b>' + h(feat.optionLabel || 'Choose an option') + '</b><div class="pills">' + feat.options.map(function (o) {
        return pill(act + '-opt', key + '|' + o.id, h(o.name), picks.option === o.id);
      }).join('') + '</div>' + (cur && cur.text ? '<div class="feat-box" style="margin:0">' + CF.util.rich(cur.text, '<b>' + h(cur.name) + ':</b> ') + '</div>' : '') + '</div>';
    }
    (feat.spells || []).forEach(function (b, bi) {
      if (b.fixed) {
        var names = b.fixed.map(function (id) { var s = CF.content.get('spells', id, on); return s ? s.name : id; });
        out += '<div class="fp-block"><b>You learn ' + h(names.join(' and ')) + '</b>' + (b.once ? '<span class="muted" style="font-size:13px">Cast it once per Long Rest without a spell slot, or with your spell slots.</span>' : '') + '</div>';
        return;
      }
      var chosen = (picks.spells || {})[bi] || [], n = b.count || 1;
      var list = R.featSpellChoices(b, on);
      out += '<div class="fp-block"><div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 10px"><b>Choose ' + h(b.label) + '</b><span class="count' + (chosen.length >= n ? ' ok' : '') + '">' + chosen.length + ' of ' + n + ' chosen</span></div>' +
        (b.once ? '<span class="muted" style="font-size:13px">Cast it once per Long Rest without a spell slot, or with your spell slots.</span>' : '') +
        '<div class="pills">' + list.map(function (s) {
          var sel = chosen.indexOf(s.id) >= 0, have = !sel && taken.indexOf(s.id) >= 0;
          return pill(act + '-sp', key + '|' + bi + '|' + s.id, h(s.name) + (b.minLevel !== b.maxLevel ? ' <small>' + (s.level ? 'L' + s.level : 'cantrip') + '</small>' : '') + (have ? ' <small>(have it)</small>' : ''), sel, have || (!sel && chosen.length >= n));
        }).join('') + (list.length ? '' : '<span class="muted2" style="font-size:13px">No matching spells are available with your current modules.</span>') + '</div></div>';
    });
    if (needsAbility(feat)) {
      out += '<div class="fp-block"><b>Spellcasting ability for these spells</b><div class="seg">' + [['int', 'Intelligence'], ['wis', 'Wisdom'], ['cha', 'Charisma']].map(function (a) {
        return '<button type="button" data-act="' + act + '-ab" data-arg="' + h(key + '|' + a[0]) + '" aria-pressed="' + (picks.ability === a[0]) + '">' + a[1] + '</button>';
      }).join('') + '</div></div>';
    }
    return out + '</div>';
  }
  /** Apply one click to a picks object. Returns the updated picks. */
  function apply(feat, picks, kind, parts) {
    picks = picks || {};
    if (kind === 'opt') picks.option = picks.option === parts[0] ? null : parts[0];
    else if (kind === 'ab') picks.ability = parts[0];
    else if (kind === 'sp') {
      var bi = +parts[0], id = parts[1], b = (feat.spells || [])[bi]; if (!b) return picks;
      picks.spells = picks.spells || {};
      var cur = (picks.spells[bi] || []).slice(), i = cur.indexOf(id);
      if (i >= 0) cur.splice(i, 1); else if (cur.length < (b.count || 1)) cur.push(id);
      picks.spells[bi] = cur;
    }
    return picks;
  }
  function missing(feat, picks) {
    var m = R.featPicksMissing(feat, picks);
    if (feat && needsAbility(feat) && !(picks && picks.ability)) m.push(feat.name + ': choose a spellcasting ability');
    return m;
  }
  CF.ui = CF.ui || {};
  CF.ui.featPicks = { render: render, apply: apply, missing: missing, needsAbility: needsAbility };
})(window);
