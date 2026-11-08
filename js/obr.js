/*
 * Owlbear Rodeo connection. Does nothing unless the app is running inside an Owlbear Rodeo room.
 * Inside a room it:
 *  - shares every roll with the other players (they get a notification and see it in their roll history),
 *  - remembers which character you have open, so the token menu can link a token to it (see background.html).
 * The SDK (MIT, by Owlbear Rodeo) is loaded from a CDN only when needed.
 */
(function (root) {
  'use strict';
  var CF = root.CF;
  var CHANNEL = 'com.characterforge/roll';
  var CURRENT = 'cf.obr.current';

  function insideOwlbear() {
    try {
      if (/[?&]obrref=/.test(root.location.search)) return true;
      return root.self !== root.top && /owlbear\.rodeo/.test(document.referrer || '');
    } catch (e) { return true; }   // a cross-origin parent throws: we are framed somewhere
  }
  /** Load the SDK: a test double if one is provided, otherwise from a CDN (two mirrors). */
  function loadSDK() {
    if (root.__OBR_TEST) return Promise.resolve(root.__OBR_TEST);
    var urls = ['https://esm.sh/@owlbear-rodeo/sdk', 'https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk/+esm'];
    var tryAt = function (i) { return import(urls[i]).then(function (m) { return m.default || m.OBR || m; }).catch(function (e) { if (i + 1 < urls.length) return tryAt(i + 1); throw e; }); };
    return tryAt(0);
  }
  CF.obr = { inside: insideOwlbear, loadSDK: loadSDK, CHANNEL: CHANNEL, CURRENT: CURRENT, ready: false };
  if (!insideOwlbear()) return;

  loadSDK().then(function (OBR) {
    OBR.onReady(function () {
      CF.obr.ready = true; CF.obr.sdk = OBR;
      document.documentElement.classList.add('in-owlbear');

      // remember the character on screen, for "Link token to …" in the token menu
      var remember = function () {
        try {
          var r = CF.app.route(), c = r.id && (r.screen === 'sheet' || r.screen === 'levelup') ? CF.store.get(r.id) : null;
          if (c && !c.draft) root.localStorage.setItem(CURRENT, JSON.stringify({ id: c.id, name: c.name }));
        } catch (e) {}
      };
      remember(); root.addEventListener('hashchange', remember);

      // share my rolls
      var show = CF.dice.show;
      CF.dice.show = function (r) {
        show(r);
        if (r.remote) return;
        var h = CF.dice.history()[0] || {};
        OBR.broadcast.sendMessage(CHANNEL, { who: h.who || '', label: r.label, detail: r.detail, total: r.total, kind: h.kind || '' }, { destination: 'REMOTE' }).catch(function () {});
      };
      // other players' rolls go into my history (the background page shows the notification)
      OBR.broadcast.onMessage(CHANNEL, function (ev) {
        var d = ev.data || {};
        if (CF.dice.addRemote) CF.dice.addRemote(d);
      });
    });
  }).catch(function () { /* offline or blocked: the app still works on its own */ });
})(window);
