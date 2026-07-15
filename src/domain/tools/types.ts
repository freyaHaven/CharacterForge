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
