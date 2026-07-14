import type { AbilityScores } from '../../domain/types'
import { ROLLED_ABILITY_SCORE_COUNT } from './rollingFormula'

const ABILITY_KEYS: (keyof AbilityScores)[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]

export type RolledPoolEntry = {
  readonly id: string
  readonly total: number
}

export type RolledAssignments = {
  strength: string | null
  dexterity: string | null
  constitution: string | null
  intelligence: string | null
  wisdom: string | null
  charisma: string | null
}

export type RolledAssignmentIssue =
  | { code: 'unassigned-ability'; ability: keyof AbilityScores }
  | { code: 'unknown-roll-id'; ability: keyof AbilityScores; rollId: string }
  | {
      code: 'duplicate-roll-id'
      rollId: string
      abilities: (keyof AbilityScores)[]
    }
  | {
      code: 'pool-size-mismatch'
      expected: number
      actual: number
    }

export type RolledAssignmentValidationResult =
  | { valid: true }
  | { valid: false; issues: RolledAssignmentIssue[] }

export function createEmptyRolledAssignments(): RolledAssignments {
  return {
    strength: null,
    dexterity: null,
    constitution: null,
    intelligence: null,
    wisdom: null,
    charisma: null,
  }
}

export function isRolledAssignmentComplete(
  assignments: RolledAssignments,
): boolean {
  return ABILITY_KEYS.every((ability) => assignments[ability] !== null)
}

export function validateRolledAssignment(
  pool: readonly RolledPoolEntry[],
  assignments: RolledAssignments,
): RolledAssignmentValidationResult {
  const issues: RolledAssignmentIssue[] = []

  if (pool.length !== ROLLED_ABILITY_SCORE_COUNT) {
    issues.push({
      code: 'pool-size-mismatch',
      expected: ROLLED_ABILITY_SCORE_COUNT,
      actual: pool.length,
    })
  }

  const poolIds = new Set(pool.map((entry) => entry.id))

  for (const ability of ABILITY_KEYS) {
    if (assignments[ability] === null) {
      issues.push({ code: 'unassigned-ability', ability })
    }
  }

  const rollIdToAbilities = new Map<string, (keyof AbilityScores)[]>()

  for (const ability of ABILITY_KEYS) {
    const rollId = assignments[ability]
    if (rollId === null) {
      continue
    }

    if (!poolIds.has(rollId)) {
      issues.push({ code: 'unknown-roll-id', ability, rollId })
    }

    const abilities = rollIdToAbilities.get(rollId) ?? []
    rollIdToAbilities.set(rollId, [...abilities, ability])
  }

  for (const [rollId, abilities] of rollIdToAbilities) {
    if (abilities.length > 1) {
      issues.push({ code: 'duplicate-roll-id', rollId, abilities })
    }
  }

  if (issues.length === 0) {
    return { valid: true }
  }

  return { valid: false, issues }
}

export function getRemainingRolledResults(
  pool: readonly RolledPoolEntry[],
  assignments: RolledAssignments,
): RolledPoolEntry[] {
  const assignedIds = new Set<string>()

  for (const ability of ABILITY_KEYS) {
    const rollId = assignments[ability]
    if (rollId !== null) {
      assignedIds.add(rollId)
    }
  }

  return pool.filter((entry) => !assignedIds.has(entry.id))
}

export function rolledAssignmentsToAbilityScores(
  pool: readonly RolledPoolEntry[],
  assignments: RolledAssignments,
): AbilityScores {
  const totalsById = new Map(pool.map((entry) => [entry.id, entry.total]))

  return {
    strength: totalsById.get(assignments.strength!)!,
    dexterity: totalsById.get(assignments.dexterity!)!,
    constitution: totalsById.get(assignments.constitution!)!,
    intelligence: totalsById.get(assignments.intelligence!)!,
    wisdom: totalsById.get(assignments.wisdom!)!,
    charisma: totalsById.get(assignments.charisma!)!,
  }
}
