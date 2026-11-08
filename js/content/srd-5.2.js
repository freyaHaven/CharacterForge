/*
 * Content pack: System Reference Document 5.2 (2024 rules).
 * Every module — this one, homebrew, or a private module — uses the same shape, so the rules
 * engine never needs to know where content came from:
 *   { format: 'character-forge/pack@1', id, name, version, license, builtIn,
 *     classes:[], species:[], backgrounds:[], feats:[], spells:[], items:[] }
 * This pack is split over several files (srd-classes.js, srd-origins.js, srd-gear.js, srd-spells-full.js, srd-levels*.js)
 * that add their sections with CF.content.extendPack.
 *
 * This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC,
 * available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0
 * International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.
 */
(function () {
  'use strict';
  CF.content.registerPack({
    format: 'character-forge/pack@1',
    id: 'srd-5.2',
    name: 'System Reference Document 5.2.1',
    version: '0.3.0',
    license: 'CC-BY-4.0',
    builtIn: true,
    description: 'The free 2024 rules content, released by Wizards of the Coast under Creative Commons: all 12 classes with one subclass each (levels 1–20), 9 species, 4 backgrounds and all 339 spells with their full text.',
    classes: [], species: [], backgrounds: [], feats: [], spells: [], items: []
  });
})();
