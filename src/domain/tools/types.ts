export const GAMING_SET_IDS = [
  'dice-set',
  'dragonchess-set',
  'playing-card-set',
  'three-dragon-ante-set',
] as const

export type GamingSetId = (typeof GAMING_SET_IDS)[number]

export const GAMING_SET_LABELS: Record<GamingSetId, string> = {
  'dice-set': 'Dice Set',
  'dragonchess-set': 'Dragonchess Set',
  'playing-card-set': 'Playing Card Set',
  'three-dragon-ante-set': 'Three-Dragon Ante Set',
}

export function createGamingSetOptions() {
  return GAMING_SET_IDS.map((id) => ({
    id,
    label: GAMING_SET_LABELS[id],
  }))
}

export const ARTISAN_TOOL_IDS = [
  'alchemists-supplies',
  'brewers-supplies',
  'calligraphers-supplies',
  'carpenters-tools',
  'cartographers-tools',
  'cobblers-tools',
  'cooks-utensils',
  'glassblowers-tools',
  'jewelers-tools',
  'leatherworkers-tools',
  'masons-tools',
  'painters-supplies',
  'potters-tools',
  'smiths-tools',
  'tinkers-tools',
  'weavers-tools',
  'woodcarvers-tools',
] as const

export type ArtisanToolId = (typeof ARTISAN_TOOL_IDS)[number]

export const ARTISAN_TOOL_LABELS: Record<ArtisanToolId, string> = {
  'alchemists-supplies': "Alchemist's Supplies",
  'brewers-supplies': "Brewer's Supplies",
  'calligraphers-supplies': "Calligrapher's Supplies",
  'carpenters-tools': "Carpenter's Tools",
  'cartographers-tools': "Cartographer's Tools",
  'cobblers-tools': "Cobbler's Tools",
  'cooks-utensils': "Cook's Utensils",
  'glassblowers-tools': "Glassblower's Tools",
  'jewelers-tools': "Jeweler's Tools",
  'leatherworkers-tools': "Leatherworker's Tools",
  'masons-tools': "Mason's Tools",
  'painters-supplies': "Painter's Supplies",
  'potters-tools': "Potter's Tools",
  'smiths-tools': "Smith's Tools",
  'tinkers-tools': "Tinker's Tools",
  'weavers-tools': "Weaver's Tools",
  'woodcarvers-tools': "Woodcarver's Tools",
}

export const MUSICAL_INSTRUMENT_IDS = [
  'bagpipes',
  'drum',
  'dulcimer',
  'flute',
  'horn',
  'lute',
  'lyre',
  'pan-flute',
  'shawm',
  'viol',
] as const

export type MusicalInstrumentId = (typeof MUSICAL_INSTRUMENT_IDS)[number]

export const MUSICAL_INSTRUMENT_LABELS: Record<MusicalInstrumentId, string> = {
  bagpipes: 'Bagpipes',
  drum: 'Drum',
  dulcimer: 'Dulcimer',
  flute: 'Flute',
  horn: 'Horn',
  lute: 'Lute',
  lyre: 'Lyre',
  'pan-flute': 'Pan Flute',
  shawm: 'Shawm',
  viol: 'Viol',
}

/** Artisan's Tools and Musical Instruments for Monk (and similar) tool choices. */
export function createArtisanOrInstrumentToolOptions() {
  return [
    ...ARTISAN_TOOL_IDS.map((id) => ({
      id,
      label: ARTISAN_TOOL_LABELS[id],
    })),
    ...MUSICAL_INSTRUMENT_IDS.map((id) => ({
      id,
      label: MUSICAL_INSTRUMENT_LABELS[id],
    })),
  ]
}
