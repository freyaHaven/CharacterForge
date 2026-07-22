import { tableValueAtLevel } from '../spell/progressions'
import type { ClassChoice, ClassChoiceValue } from './types'
import { withWildShapeFormsChoiceLimits } from './beastForms'

export type WeaponMasterySlotThreshold = {
  level: number
  total: number
  choiceId: string
}

export type WeaponMasterySlotGain = {
  level: number
  slots: number
  choiceId: string
}

/** Weapon Mastery choice ids follow `weapon-mastery` / `weapon-mastery-weapons-*`. */
export function isWeaponMasteryChoiceId(choiceId: string): boolean {
  return (
    choiceId === 'weapon-mastery' ||
    choiceId.startsWith('weapon-mastery-weapons-')
  )
}

/** Slot counts by class level for the given schedule. */
export function getWeaponMasterySlotCount(
  level: number,
  thresholds: readonly WeaponMasterySlotThreshold[],
): number {
  if (thresholds.length === 0) {
    return 0
  }

  let count = thresholds[0]!.total

  for (const threshold of thresholds) {
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
  thresholds: readonly WeaponMasterySlotThreshold[],
): WeaponMasterySlotGain[] {
  const gains: WeaponMasterySlotGain[] = []
  let previousTotal = 0

  for (const threshold of thresholds) {
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

export function collectWeaponMasterySelections(
  choices: Record<string, ClassChoiceValue>,
  exceptChoiceId?: string,
): string[] {
  const selected: string[] = []

  for (const [choiceId, value] of Object.entries(choices)) {
    if (!isWeaponMasteryChoiceId(choiceId) || choiceId === exceptChoiceId) {
      continue
    }

    if (!Array.isArray(value)) {
      continue
    }

    selected.push(...value)
  }

  return selected
}

/** Deterministic Weapon Mastery picks for tests and fixtures. */
export function createWeaponMasteryChoices(
  level: number,
  thresholds: readonly WeaponMasterySlotThreshold[],
  pool: readonly string[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  let offset = 0

  for (const gain of getWeaponMasterySlotGains(level, thresholds)) {
    result[gain.choiceId] = [...pool.slice(offset, offset + gain.slots)]
    offset += gain.slots
  }

  return result
}

/**
 * Adjust choice limits that scale with class level
 * (Wild Shape forms, data-driven `limitsByLevel` multi-selects).
 */
export function withLevelAdjustedChoiceLimits(
  choice: ClassChoice,
  level: number,
): ClassChoice {
  const withWildShape = withWildShapeFormsChoiceLimits(choice, level)

  if (
    withWildShape.type !== 'multi-select' ||
    withWildShape.limitsByLevel === undefined ||
    withWildShape.limitsByLevel.length === 0
  ) {
    return withWildShape
  }

  const limit = tableValueAtLevel(withWildShape.limitsByLevel, level)
  return {
    ...withWildShape,
    min: limit,
    max: limit,
  }
}
