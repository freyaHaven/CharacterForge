import type { AbilityScores } from '../../domain/types'
import type { RolledAssignments } from '../../rules/rolled'
import type { AbilityScoreBonusMap } from './resolveAbilityScoreBreakdown'
import { buildAbilityScoreBreakdown } from './resolveAbilityScoreBreakdown'
import { ABILITY_SCORE_ENTRIES } from './abilityScoreDisplay'
import type { AbilityScoreOverviewValue } from './AbilityScoreOverviewGrid'
import { AbilityScoreOverviewGrid } from './AbilityScoreOverviewGrid'
import { formatRolledResultOptionLabel } from './formatRollResult'
import type { RolledResult } from './rolledDraft'
import { getRemainingRolledResults } from './rolledRemaining'
import type { AbilityScoreKey } from './abilityScoreDisplay'

function getRemainingRolledPoolResults(
  pool: readonly RolledResult[],
  assignments: RolledAssignments,
): RolledResult[] {
  const remainingEntries = getRemainingRolledResults(pool, assignments)
  const remainingIds = new Set(remainingEntries.map((entry) => entry.id))

  return pool.filter((entry) => remainingIds.has(entry.id))
}

export const ROLLED_UNASSIGNED_LABEL = '—'
const UNASSIGNED_VALUE = ''

type RolledAbilityInputsProps = {
  pool: readonly RolledResult[]
  assignments: RolledAssignments
  bonuses?: AbilityScoreBonusMap
  onAssignmentChange: (
    ability: keyof AbilityScores,
    rollId: string | null,
  ) => void
}

function getRollIdsUsedByOtherAbilities(
  assignments: RolledAssignments,
  currentAbility: keyof AbilityScores,
): Set<string> {
  const usedIds = new Set<string>()

  for (const { key } of ABILITY_SCORE_ENTRIES) {
    if (key === currentAbility) {
      continue
    }

    const rollId = assignments[key]
    if (rollId !== null) {
      usedIds.add(rollId)
    }
  }

  return usedIds
}

function getOptionLabel(
  entry: RolledResult,
  remaining: readonly RolledResult[],
): string {
  const duplicateIndex =
    remaining
      .filter((item) => item.total === entry.total)
      .findIndex((item) => item.id === entry.id) + 1

  return formatRolledResultOptionLabel(entry.result, duplicateIndex)
}

export function RolledAbilityInputs({
  pool,
  assignments,
  bonuses,
  onAssignmentChange,
}: RolledAbilityInputsProps) {
  const remaining = getRemainingRolledPoolResults(pool, assignments)
  const isPoolReady = pool.length > 0
  const baseScores = Object.fromEntries(
    ABILITY_SCORE_ENTRIES.map(({ key }) => {
      const assignedRollId = assignments[key]
      const assignedEntry =
        assignedRollId === null
          ? null
          : (pool.find((entry) => entry.id === assignedRollId) ?? null)
      return [key, assignedEntry?.total ?? null]
    }),
  ) as Partial<Record<AbilityScoreKey, number | null>>

  const breakdown = buildAbilityScoreBreakdown({
    baseScores,
    bonuses,
  })

  const scores = Object.fromEntries(
    breakdown.map((entry) => {
      const assignedRollId = assignments[entry.abilityKey]
      const assignedEntry =
        assignedRollId === null
          ? null
          : (pool.find((item) => item.id === assignedRollId) ?? null)
      const usedIds = getRollIdsUsedByOtherAbilities(assignments, entry.abilityKey)
      const availableOptions = [
        ...remaining,
        ...(assignedEntry === null ? [] : [assignedEntry]),
      ]

      const value: AbilityScoreOverviewValue = {
        base: entry.baseScore,
        total: entry.totalScore,
        controls: (
          <select
            aria-label={`${entry.label} rolled result`}
            value={assignedRollId ?? UNASSIGNED_VALUE}
            disabled={!isPoolReady}
            onChange={(event) => {
              const nextValue = event.target.value
              onAssignmentChange(
                entry.abilityKey,
                nextValue === UNASSIGNED_VALUE ? null : nextValue,
              )
            }}
          >
            <option value={UNASSIGNED_VALUE}>{ROLLED_UNASSIGNED_LABEL}</option>
            {availableOptions.map((option) => (
              <option
                key={option.id}
                value={option.id}
                disabled={
                  option.id !== assignedRollId && usedIds.has(option.id)
                }
              >
                {getOptionLabel(option, availableOptions)}
              </option>
            ))}
          </select>
        ),
      }

      return [entry.abilityKey, value]
    }),
  ) as Record<AbilityScoreKey, AbilityScoreOverviewValue>

  return <AbilityScoreOverviewGrid scores={scores} />
}
