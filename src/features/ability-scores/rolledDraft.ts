import type { AbilityScores } from '../../domain/types'
import type {
  AbilityScoreResult,
  GeneratedAbilityScoreResult,
  RolledAssignments,
  RolledAssignmentValidationResult,
  RolledPoolEntry,
  RollingFormulaId,
} from '../../rules/rolled'
import {
  createEmptyRolledAssignments,
  DEFAULT_ROLLING_FORMULA_ID,
  isValidRolledTotal,
  ROLLED_ABILITY_SCORE_COUNT,
  validateRolledAssignment,
} from '../../rules/rolled'

const ABILITY_KEYS: (keyof AbilityScores)[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]

export type RolledResult = RolledPoolEntry & {
  readonly result: AbilityScoreResult
}

export type RolledDraft = {
  readonly pool: readonly RolledResult[]
  readonly assignments: RolledAssignments
  readonly formulaId: RollingFormulaId
}

export type ManualTotalsError = 'invalid-count' | 'out-of-range'

type CreateId = (index: number) => string

const defaultCreateId: CreateId = (index) => `rolled-${index}`

function createRolledResult(
  result: AbilityScoreResult,
  index: number,
  createId: CreateId,
): RolledResult {
  return {
    id: createId(index),
    total: result.total,
    result,
  }
}

export function createRolledDraftFromGeneratedResults(
  results: readonly GeneratedAbilityScoreResult[],
  formulaId: RollingFormulaId = DEFAULT_ROLLING_FORMULA_ID,
  createId: CreateId = defaultCreateId,
): RolledDraft {
  return {
    formulaId,
    pool: results.map((result, index) => createRolledResult(result, index, createId)),
    assignments: createEmptyRolledAssignments(),
  }
}

export function createRolledDraftFromManualTotals(
  totals: readonly number[],
  createId: CreateId = defaultCreateId,
): RolledDraft | { error: ManualTotalsError } {
  if (totals.length !== ROLLED_ABILITY_SCORE_COUNT) {
    return { error: 'invalid-count' }
  }

  if (!totals.every(isValidRolledTotal)) {
    return { error: 'out-of-range' }
  }

  return {
    formulaId: DEFAULT_ROLLING_FORMULA_ID,
    pool: totals.map((total, index) =>
      createRolledResult({ kind: 'manual', total }, index, createId),
    ),
    assignments: createEmptyRolledAssignments(),
  }
}

export function initializeRolledDraftFromAbilityScores(
  scores: AbilityScores,
  createId: CreateId = defaultCreateId,
): RolledDraft {
  const pool: RolledResult[] = ABILITY_KEYS.map((ability, index) =>
    createRolledResult(
      { kind: 'manual', total: scores[ability] },
      index,
      createId,
    ),
  )

  const assignments = createEmptyRolledAssignments()
  const availableIds = [...pool.map((entry) => entry.id)]

  for (const ability of ABILITY_KEYS) {
    const targetTotal = scores[ability]
    const matchIndex = availableIds.findIndex((id) => {
      const entry = pool.find((item) => item.id === id)
      return entry?.total === targetTotal
    })

    if (matchIndex !== -1) {
      assignments[ability] = availableIds[matchIndex]!
      availableIds.splice(matchIndex, 1)
    }
  }

  return {
    formulaId: DEFAULT_ROLLING_FORMULA_ID,
    pool,
    assignments,
  }
}

export function assignRolledResult(
  draft: RolledDraft,
  ability: keyof AbilityScores,
  rollId: string | null,
): RolledDraft {
  return {
    ...draft,
    assignments: {
      ...draft.assignments,
      [ability]: rollId,
    },
  }
}

export function shouldConfirmReroll(assignments: RolledAssignments): boolean {
  return ABILITY_KEYS.some((ability) => assignments[ability] !== null)
}

export function clearRolledAssignments(draft: RolledDraft): RolledDraft {
  return {
    ...draft,
    assignments: createEmptyRolledAssignments(),
  }
}

export function validateRolledDraft(
  draft: RolledDraft,
): RolledAssignmentValidationResult {
  return validateRolledAssignment(draft.pool, draft.assignments)
}

export function rolledDraftToAbilityScores(draft: RolledDraft): AbilityScores {
  const totalsById = new Map(draft.pool.map((entry) => [entry.id, entry.total]))

  return {
    strength: totalsById.get(draft.assignments.strength!)!,
    dexterity: totalsById.get(draft.assignments.dexterity!)!,
    constitution: totalsById.get(draft.assignments.constitution!)!,
    intelligence: totalsById.get(draft.assignments.intelligence!)!,
    wisdom: totalsById.get(draft.assignments.wisdom!)!,
    charisma: totalsById.get(draft.assignments.charisma!)!,
  }
}
