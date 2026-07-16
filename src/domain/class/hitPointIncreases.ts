import type { HitDie } from './types'

/** How a single class level contributes its hit-die portion of HP. */
export type HitPointIncreaseMethod = 'max' | 'fixed' | 'roll'

export type HitPointIncrease = {
  /** Class level this increase applies to (1-based within the class instance). */
  classLevel: number
  method: HitPointIncreaseMethod
  /** Present when method is `roll`; must be 1..hitDie.sides. */
  rolledValue?: number
}

/** Fixed (average) hit-die contribution used when not rolling. */
export function getFixedHitDieValue(sides: HitDie['sides']): number {
  return Math.floor(sides / 2) + 1
}

export function getMaxHitDieValue(sides: HitDie['sides']): number {
  return sides
}

export function getHitDieContribution(
  increase: HitPointIncrease,
  sides: HitDie['sides'],
): number | null {
  if (increase.method === 'max') {
    return getMaxHitDieValue(sides)
  }

  if (increase.method === 'fixed') {
    return getFixedHitDieValue(sides)
  }

  if (
    increase.rolledValue === undefined ||
    !Number.isInteger(increase.rolledValue) ||
    increase.rolledValue < 1 ||
    increase.rolledValue > sides
  ) {
    return null
  }

  return increase.rolledValue
}

export function isHitPointIncreaseComplete(
  increase: HitPointIncrease,
  sides: HitDie['sides'],
): boolean {
  return getHitDieContribution(increase, sides) !== null
}

export function isHitPointIncrease(value: unknown): value is HitPointIncrease {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  if (
    typeof candidate.classLevel !== 'number' ||
    !Number.isInteger(candidate.classLevel) ||
    candidate.classLevel < 1 ||
    candidate.classLevel > 20
  ) {
    return false
  }

  if (
    candidate.method !== 'max' &&
    candidate.method !== 'fixed' &&
    candidate.method !== 'roll'
  ) {
    return false
  }

  if (candidate.rolledValue === undefined) {
    return true
  }

  return (
    typeof candidate.rolledValue === 'number' &&
    Number.isInteger(candidate.rolledValue) &&
    candidate.rolledValue >= 1 &&
    candidate.rolledValue <= 20
  )
}

/**
 * Ensures one increase entry per class level.
 * Level 1 uses `max` when this instance is the starting class; otherwise `fixed`.
 * New higher levels default to `fixed`. Entries above `level` are dropped.
 */
export function syncHitPointIncreases(
  current: readonly HitPointIncrease[] | undefined,
  level: number,
  options: { isStartingClass: boolean },
): HitPointIncrease[] {
  const byLevel = new Map(
    (current ?? []).map((entry) => [entry.classLevel, entry]),
  )
  const next: HitPointIncrease[] = []

  for (let classLevel = 1; classLevel <= level; classLevel += 1) {
    const existing = byLevel.get(classLevel)

    if (existing !== undefined) {
      if (classLevel === 1 && options.isStartingClass) {
        next.push({ classLevel: 1, method: 'max' })
      } else if (classLevel === 1 && existing.method === 'max') {
        next.push({ classLevel: 1, method: 'fixed' })
      } else {
        next.push(existing)
      }
      continue
    }

    if (classLevel === 1 && options.isStartingClass) {
      next.push({ classLevel: 1, method: 'max' })
    } else {
      next.push({ classLevel, method: 'fixed' })
    }
  }

  return next
}

export function updateHitPointIncrease(
  increases: readonly HitPointIncrease[],
  classLevel: number,
  patch: Partial<Pick<HitPointIncrease, 'method' | 'rolledValue'>>,
): HitPointIncrease[] {
  return increases.map((entry) => {
    if (entry.classLevel !== classLevel) {
      return entry
    }

    const method = patch.method ?? entry.method
    const next: HitPointIncrease = {
      classLevel: entry.classLevel,
      method,
    }

    if (method === 'roll') {
      const rolledValue =
        patch.rolledValue !== undefined ? patch.rolledValue : entry.rolledValue
      if (rolledValue !== undefined) {
        next.rolledValue = rolledValue
      }
    }

    return next
  })
}

/** Ensures `hitPointIncreases` matches the instance level and starting-class rules. */
export function withSyncedHitPointIncreases<
  T extends { level: number; hitPointIncreases?: HitPointIncrease[] },
>(instance: T, isStartingClass: boolean): T {
  return {
    ...instance,
    hitPointIncreases: syncHitPointIncreases(instance.hitPointIncreases, instance.level, {
      isStartingClass,
    }),
  }
}
