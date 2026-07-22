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

/**
 * SRD 2024 Warlock-style Pact Magic progression (levels 1–20).
 * Slot count and slot level only — recovery is short rest (metadata).
 */
export const PACT_MAGIC_SLOTS_BY_LEVEL: {
  slotCount: number
  slotLevel: number
}[] = [
  { slotCount: 1, slotLevel: 1 },
  { slotCount: 2, slotLevel: 1 },
  { slotCount: 2, slotLevel: 2 },
  { slotCount: 2, slotLevel: 2 },
  { slotCount: 2, slotLevel: 3 },
  { slotCount: 2, slotLevel: 3 },
  { slotCount: 2, slotLevel: 4 },
  { slotCount: 2, slotLevel: 4 },
  { slotCount: 2, slotLevel: 5 },
  { slotCount: 2, slotLevel: 5 },
  { slotCount: 3, slotLevel: 5 },
  { slotCount: 3, slotLevel: 5 },
  { slotCount: 3, slotLevel: 5 },
  { slotCount: 3, slotLevel: 5 },
  { slotCount: 3, slotLevel: 5 },
  { slotCount: 3, slotLevel: 5 },
  { slotCount: 4, slotLevel: 5 },
  { slotCount: 4, slotLevel: 5 },
  { slotCount: 4, slotLevel: 5 },
  { slotCount: 4, slotLevel: 5 },
]

/** Typical Warlock cantrips known by level. */
export const PACT_MAGIC_CANTRIPS_KNOWN_BY_LEVEL = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
]

/** Typical Warlock spells known by level (L1+). */
export const PACT_MAGIC_SPELLS_KNOWN_BY_LEVEL = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15,
]

/** Wizard-style spellbook free spells at level 1 (SRD: 6). */
export const WIZARD_SPELLBOOK_INITIAL_COUNT = 6

/** Spells added to the spellbook per Wizard level after 1 (SRD: 2). */
export const WIZARD_SPELLBOOK_PER_LEVEL = 2

/** Wizard cantrips known by class level (index = level - 1). */
export const WIZARD_CANTRIPS_KNOWN_BY_LEVEL = [
  3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
]

/** Wizard prepared L1+ spells by class level (SRD 5.2.1 Features table). */
export const WIZARD_PREPARED_BY_LEVEL = [
  4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 26,
]

/** Druid cantrips known by class level (index = level - 1). */
export const DRUID_CANTRIPS_KNOWN_BY_LEVEL = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
]

/** Druid prepared L1+ spells by class level (SRD 5.2.1 Features table). */
export const DRUID_PREPARED_BY_LEVEL = [
  4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
]

/** Bard cantrips known by class level (index = level - 1). */
export const BARD_CANTRIPS_KNOWN_BY_LEVEL = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
]

/** Bard prepared L1+ spells by class level (SRD 5.2.1 Features table). */
export const BARD_PREPARED_BY_LEVEL = [
  4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
]

/**
 * Bardic Inspiration die faces by Bard level (index = level - 1).
 * d6 (1–4), d8 (5–9), d10 (10–14), d12 (15–20).
 */
export const BARDIC_INSPIRATION_DIE_BY_LEVEL = [
  6, 6, 6, 6, 8, 8, 8, 8, 8, 10, 10, 10, 10, 10, 12, 12, 12, 12, 12, 12,
]

/** Wild Shape uses by Druid level (index = level - 1; 0 before L2). */
export const DRUID_WILD_SHAPE_USES_BY_LEVEL = [
  0, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4,
]

/**
 * Build per-level spellbook acquisition counts for Wizard.
 * Level 1 → 6; each later level → 2 additional (distinct entitlements use
 * zero-until-unlock tables derived from this).
 */
export function wizardSpellbookAcquisitionAtLevel(level: number): number {
  if (level <= 1) {
    return WIZARD_SPELLBOOK_INITIAL_COUNT
  }
  return WIZARD_SPELLBOOK_PER_LEVEL
}

/** Cumulative spellbook size helper (tests / single-pool fixtures). */
export function wizardSpellbookSizeAtLevel(level: number): number {
  if (level < 1) {
    return 0
  }
  return (
    WIZARD_SPELLBOOK_INITIAL_COUNT +
    WIZARD_SPELLBOOK_PER_LEVEL * Math.max(0, level - 1)
  )
}

export function pactMagicAtLevel(
  pactSlotsByLevel: readonly { slotCount: number; slotLevel: number }[],
  level: number,
): { slotCount: number; slotLevel: number } | null {
  if (level < 1 || pactSlotsByLevel.length === 0) {
    return null
  }
  return pactSlotsByLevel[Math.min(level, pactSlotsByLevel.length) - 1] ?? null
}
