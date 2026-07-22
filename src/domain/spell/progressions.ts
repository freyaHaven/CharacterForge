/**
 * Spell progression helpers and reusable SRD-style presets.
 *
 * Named-class progressions (Wizard, Warlock, …) live in content packs.
 * Resolvers consume tables from definitions — they do not import class data.
 */

/** Full-caster conventional spell slots (levels 1–20 → counts for spell levels 1–9). */
export const FULL_CASTER_SLOTS_BY_LEVEL: number[][] = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
]

/** Half-caster conventional spell slots by class level. */
export const HALF_CASTER_SLOTS_BY_LEVEL: number[][] = [
  [2],
  [2],
  [3],
  [3],
  [4, 2],
  [4, 2],
  [4, 3],
  [4, 3],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2],
]

/** Half-caster prepared L1+ spell limits by class level (shared Paladin/Ranger cadence). */
export const HALF_CASTER_PREPARED_BY_LEVEL = [
  2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15,
]

/** Classes with no base cantrips from Spellcasting. */
export const ZERO_CANTRIPS_BY_LEVEL = Array.from({ length: 20 }, () => 0)

export type PactMagicSlotRow = {
  slotCount: number
  slotLevel: number
}

export function tableValueAtLevel(table: number[], level: number): number {
  if (level < 1 || table.length === 0) {
    return 0
  }

  return table[Math.min(level, table.length) - 1]!
}

export function slotsAtLevel(
  slotsByLevel: number[][],
  level: number,
): number[] {
  if (level < 1 || slotsByLevel.length === 0) {
    return []
  }

  return slotsByLevel[Math.min(level, slotsByLevel.length) - 1] ?? []
}

export function highestSlotLevel(slots: number[]): number {
  let highest = 0
  for (let index = 0; index < slots.length; index += 1) {
    if ((slots[index] ?? 0) > 0) {
      highest = index + 1
    }
  }
  return highest
}

export function pactMagicAtLevel(
  pactSlotsByLevel: readonly PactMagicSlotRow[],
  level: number,
): PactMagicSlotRow | null {
  if (level < 1 || pactSlotsByLevel.length === 0) {
    return null
  }
  return pactSlotsByLevel[Math.min(level, pactSlotsByLevel.length) - 1] ?? null
}

/**
 * Cumulative spellbook size for a level-gated acquisition curve
 * (initial at level 1, then `perLevel` each later level).
 */
export function spellbookSizeAtLevel(
  level: number,
  initialCount: number,
  perLevel: number,
): number {
  if (level < 1) {
    return 0
  }
  return initialCount + perLevel * Math.max(0, level - 1)
}
