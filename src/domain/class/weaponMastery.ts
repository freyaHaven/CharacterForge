import type { ClassChoice, ClassChoiceValue } from './types'

/** Fighter Weapon Mastery slot unlocks (SRD 2024). */
export const WEAPON_MASTERY_SLOT_THRESHOLDS = [
  { level: 1, total: 3, choiceId: 'weapon-mastery' },
  { level: 4, total: 4, choiceId: 'weapon-mastery-weapons-4' },
  { level: 10, total: 5, choiceId: 'weapon-mastery-weapons-5' },
  { level: 16, total: 6, choiceId: 'weapon-mastery-weapons-6' },
] as const

export type WeaponMasterySlotGain = {
  level: number
  slots: number
  choiceId: string
}

/** Fighter Weapon Mastery slot counts by class level (SRD 2024 table). */
export function getWeaponMasterySlotCount(level: number): number {
  let count = WEAPON_MASTERY_SLOT_THRESHOLDS[0]!.total

  for (const threshold of WEAPON_MASTERY_SLOT_THRESHOLDS) {
    if (level < threshold.level) {
      break
    }

    count = threshold.total
  }

  return count
}

/** Slot gains unlocked at or below the given class level. */
export function getWeaponMasterySlotGains(
  level: number,
): WeaponMasterySlotGain[] {
  const gains: WeaponMasterySlotGain[] = []
  let previousTotal = 0

  for (const threshold of WEAPON_MASTERY_SLOT_THRESHOLDS) {
    if (level < threshold.level) {
      break
    }

    gains.push({
      level: threshold.level,
      slots: threshold.total - previousTotal,
      choiceId: threshold.choiceId,
    })
    previousTotal = threshold.total
  }

  return gains
}

export function isWeaponMasteryChoiceId(choiceId: string): boolean {
  return WEAPON_MASTERY_SLOT_THRESHOLDS.some(
    (threshold) => threshold.choiceId === choiceId,
  )
}

export function collectWeaponMasterySelections(
  choices: Record<string, ClassChoiceValue>,
  exceptChoiceId?: string,
): string[] {
  const selected: string[] = []

  for (const threshold of WEAPON_MASTERY_SLOT_THRESHOLDS) {
    if (threshold.choiceId === exceptChoiceId) {
      continue
    }

    const value = choices[threshold.choiceId]
    if (!Array.isArray(value)) {
      continue
    }

    selected.push(...value)
  }

  return selected
}

const DEFAULT_WEAPON_MASTERY_POOL = [
  'longsword',
  'shortbow',
  'battleaxe',
  'greatsword',
  'rapier',
  'warhammer',
] as const

/** Deterministic Weapon Mastery picks for tests and fixtures. */
export function createWeaponMasteryChoices(
  level: number,
): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  let offset = 0

  for (const gain of getWeaponMasterySlotGains(level)) {
    result[gain.choiceId] = DEFAULT_WEAPON_MASTERY_POOL.slice(
      offset,
      offset + gain.slots,
    )
    offset += gain.slots
  }

  return result
}

/** @deprecated Limits are fixed per choice; kept for call-site compatibility. */
export function withLevelAdjustedChoiceLimits(
  choice: ClassChoice,
  _level: number,
): ClassChoice {
  return choice
}
