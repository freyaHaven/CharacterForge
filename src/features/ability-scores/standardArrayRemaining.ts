import {
  STANDARD_ARRAY,
  type StandardArrayValue,
} from '../../rules/standard-array/standardArray'
import type { StandardArrayDraftScores } from './standardArrayDraft'

const ABILITY_KEYS: (keyof StandardArrayDraftScores)[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]

function isStandardArrayValue(value: number): value is StandardArrayValue {
  return (STANDARD_ARRAY as readonly number[]).includes(value)
}

/**
 * Returns standard-array values still available to assign in the draft.
 * Duplicate assignments consume a value from the pool at most once.
 */
export function getRemainingStandardArrayValues(
  draft: StandardArrayDraftScores,
): StandardArrayValue[] {
  const assignedCounts = new Map<StandardArrayValue, number>()

  for (const value of STANDARD_ARRAY) {
    assignedCounts.set(value, 0)
  }

  for (const ability of ABILITY_KEYS) {
    const value = draft[ability]
    if (value !== null && isStandardArrayValue(value)) {
      assignedCounts.set(value, (assignedCounts.get(value) ?? 0) + 1)
    }
  }

  const remaining: StandardArrayValue[] = []

  for (const value of STANDARD_ARRAY) {
    const assigned = assignedCounts.get(value) ?? 0
    const slotsLeft = Math.max(0, 1 - assigned)

    for (let index = 0; index < slotsLeft; index += 1) {
      remaining.push(value)
    }
  }

  return remaining
}

export function formatRemainingStandardArrayValues(
  remaining: StandardArrayValue[],
): string {
  return remaining.length > 0 ? remaining.join(', ') : 'None'
}
