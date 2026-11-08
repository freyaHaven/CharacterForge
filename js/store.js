/* Character Forge — storage. Everything lives in this browser (localStorage); files move it between devices.
 * All storage goes through this one object, so a sync server can be added later without touching the screens. */
(function (root) {
  'use strict';
  var CF = root.CF, U = CF.util;
  var KEY_CHARS = 'cf.characters.v1', KEY_SETTINGS = 'cf.settings.v1', KEY_MODULES = 'cf.modules.v1';

  function read(key, fallback) {
    try { var raw = root.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function write(key, value) {
    try { root.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { CF.store.lastError = e; return false; }
  }

  var saveTimers = {}, pending = {};
  CF.store = {
    lastError: null,
    /* ----- settings ----- */
    settings: function () { return Object.assign({ theme: 'system', unit: 'lb', crit: 'dice', rules: '2024' }, read(KEY_SETTINGS, {})); },
    setSetting: function (k, v) { var s = CF.store.settings(); s[k] = v; write(KEY_SETTINGS, s); return s; },

    /* ----- characters ----- */
    list: function () {
      var all = read(KEY_CHARS, {});
      return Object.keys(all).map(function (id) { return all[id]; })
        .sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); });
    },
    get: function (id) { if (pending[id]) return pending[id]; var all = read(KEY_CHARS, {}); return all[id] ? all[id] : null; },
    put: function (ch) {
      clearTimeout(saveTimers[ch.id]); delete pending[ch.id];
      var all = read(KEY_CHARS, {});
      ch.updatedAt = new Date().toISOString();
      all[ch.id] = ch;
      return write(KEY_CHARS, all);
    },
    /** Save shortly after the last change, so typing notes doesn't write on every key. */
    putSoon: function (ch, done) {
      // until it is written, get() returns this newest copy, so other changes made meanwhile build on it
      clearTimeout(saveTimers[ch.id]);
      pending[ch.id] = ch;
      saveTimers[ch.id] = setTimeout(function () { if (pending[ch.id] !== ch) return; var ok = CF.store.put(ch); if (done) done(ok); }, 300);
    },
    remove: function (id) { var all = read(KEY_CHARS, {}); delete all[id]; write(KEY_CHARS, all); },

    /* ----- files ----- */
    exportCharacter: function (ch) {
      var name = (ch.name || 'character').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'character';
      CF.store.download(name + '.character.json', JSON.stringify(ch, null, 2));
    },
    download: function (filename, text) {
      var blob = new Blob([text], { type: 'application/json' });
      var a = root.document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = filename;
      root.document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    },
    /** Parse an imported file. Returns { kind: 'character'|'pack', data } or throws a readable error. */
    parseImport: function (text) {
      var data;
      try { data = JSON.parse(text); } catch (e) { throw new Error('This file isn’t valid JSON.'); }
      if (data && data.schema === 'character-forge/character@1') {
        if (!data.name || !data.abilities) throw new Error('This character file is missing required parts.');
        return { kind: 'character', data: data };
      }
      if (data && data.format === 'character-forge/pack@1') {
        var problems = CF.content.validate(data);
        if (problems.length) throw new Error('This module has problems:\n• ' + problems.join('\n• '));
        return { kind: 'pack', data: data };
      }
      if (data && data.format === 'character-forge/bundle@1' && Array.isArray(data.packs)) {
        var bad = [];
        data.packs.forEach(function (p) { var pr = CF.content.validate(p); if (pr.length) bad.push((p && p.name || '?') + ': ' + pr[0]); });
        if (bad.length) throw new Error('Some modules in this bundle have problems:\n• ' + bad.join('\n• '));
        return { kind: 'bundle', data: data };
      }
      throw new Error('This isn’t a Character Forge character or module file.');
    },
    importCharacter: function (ch) {
      ch = U.clone(ch);
      if (CF.store.get(ch.id)) { ch.id = U.uid(); ch.name = ch.name + ' (copy)'; }
      ch.play = ch.play || CF.rules.freshPlayState();
      CF.store.put(ch);
      return ch;
    },

    /* ----- modules (content packs the user imported) ----- */
    modules: function () { return read(KEY_MODULES, []); },
    saveModule: function (pack) {
      var mods = CF.store.modules().filter(function (m) { return m.id !== pack.id; });
      mods.push(pack);
      if (!write(KEY_MODULES, mods)) throw new Error('This device ran out of storage space for modules. Remove a module you don’t use and try again.');
      CF.content.registerPack(pack);
    },
    removeModule: function (id) {
      write(KEY_MODULES, CF.store.modules().filter(function (m) { return m.id !== id; }));
      CF.content.removePack(id);
    },
    loadModules: function () {
      CF.store.modules().forEach(function (p) { try { CF.content.registerPack(p); } catch (e) { /* skip a broken module */ } });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
