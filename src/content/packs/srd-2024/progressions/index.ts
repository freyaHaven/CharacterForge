/**
 * SRD 2024 named-class spell and feature progressions.
 * Owned by the content pack — generic resolvers must not import these.
 */

import type { PactMagicSlotRow } from '../../../../domain/spell/progressions'

export const CLERIC_CANTRIPS_KNOWN_BY_LEVEL = [
  3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
]

export const CLERIC_PREPARED_BY_LEVEL = [
  4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
]

export const WIZARD_SPELLBOOK_INITIAL_COUNT = 6
export const WIZARD_SPELLBOOK_PER_LEVEL = 2

export const WIZARD_CANTRIPS_KNOWN_BY_LEVEL = [
  3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
]

export const WIZARD_PREPARED_BY_LEVEL = [
  4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 26,
]

export const DRUID_CANTRIPS_KNOWN_BY_LEVEL = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
]

export const DRUID_PREPARED_BY_LEVEL = [
  4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
]

/** Wild Shape uses by Druid level (0 before L2). */
export const DRUID_WILD_SHAPE_USES_BY_LEVEL = [
  0, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4,
]

export const BARD_CANTRIPS_KNOWN_BY_LEVEL = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
]

export const BARD_PREPARED_BY_LEVEL = [
  4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
]

/** Bardic Inspiration die faces by Bard level. */
export const BARDIC_INSPIRATION_DIE_BY_LEVEL = [
  6, 6, 6, 6, 8, 8, 8, 8, 8, 10, 10, 10, 10, 10, 12, 12, 12, 12, 12, 12,
]

export const SORCERER_CANTRIPS_KNOWN_BY_LEVEL = [
  4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
]

export const SORCERER_PREPARED_BY_LEVEL = [
  2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
]

/** SRD 2024 Warlock Pact Magic slot progression. */
export const WARLOCK_PACT_SLOTS_BY_LEVEL: PactMagicSlotRow[] = [
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

export const WARLOCK_CANTRIPS_KNOWN_BY_LEVEL = [
  2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
]

/** Prepared L1+ spell limits (SRD 2024 Warlock — not “known”). */
export const WARLOCK_PREPARED_BY_LEVEL = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15,
]

export const WARLOCK_INVOCATIONS_BY_LEVEL = [
  1, 3, 3, 3, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10,
]

export * from './asiLevels'
