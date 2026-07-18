/** Full-caster spell slot table (levels 1–20 → slots for spell levels 1–9). */
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

/** Half-caster (Paladin / Ranger) slots by class level. */
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

export const CLERIC_CANTRIPS_KNOWN_BY_LEVEL = [
  3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
]

export const CLERIC_PREPARED_BY_LEVEL = [
  4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
]

export const HALF_CASTER_PREPARED_BY_LEVEL = [
  2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15,
]

/** Rangers / Paladins have no base cantrips from Spellcasting. */
export const ZERO_CANTRIPS_BY_LEVEL = Array.from({ length: 20 }, () => 0)

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
