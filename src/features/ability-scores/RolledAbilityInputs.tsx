import type { AbilityScores } from '../../domain/types'
import type { RolledAssignments } from '../../rules/rolled'
import { ABILITY_SCORE_ENTRIES } from './abilityScoreDisplay'
import { AbilityScoreCard } from './AbilityScoreCard'
import { AbilityScoreCardGrid } from './AbilityScoreCardGrid'
import { formatRolledResultOptionLabel } from './formatRollResult'
import type { RolledResult } from './rolledDraft'
import { getRemainingRolledResults } from './rolledRemaining'

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
  onAssignmentChange,
}: RolledAbilityInputsProps) {
  const remaining = getRemainingRolledPoolResults(pool, assignments)
  const isPoolReady = pool.length > 0

  return (
    <AbilityScoreCardGrid>
      {ABILITY_SCORE_ENTRIES.map(({ key, abbreviation, label }) => {
        const assignedRollId = assignments[key]
        const assignedEntry =
          assignedRollId === null
            ? null
            : pool.find((entry) => entry.id === assignedRollId) ?? null
        const assignedScore = assignedEntry?.total ?? null
        const usedIds = getRollIdsUsedByOtherAbilities(assignments, key)
        const availableOptions = [
          ...remaining,
          ...(assignedEntry === null ? [] : [assignedEntry]),
        ]

        return (
          <AbilityScoreCard
            key={key}
            abilityKey={key}
            abbreviation={abbreviation}
            scoreLabel={label}
            score={assignedScore}
            variant="interactive"
            controls={
              <select
                aria-label={`${label} rolled result`}
                value={assignedRollId ?? UNASSIGNED_VALUE}
                disabled={!isPoolReady}
                onChange={(event) => {
                  const value = event.target.value
                  onAssignmentChange(
                    key,
                    value === UNASSIGNED_VALUE ? null : value,
                  )
                }}
              >
                <option value={UNASSIGNED_VALUE}>{ROLLED_UNASSIGNED_LABEL}</option>
                {availableOptions.map((entry) => (
                  <option
                    key={entry.id}
                    value={entry.id}
                    disabled={
                      entry.id !== assignedRollId && usedIds.has(entry.id)
                    }
                  >
                    {getOptionLabel(entry, availableOptions)}
                  </option>
                ))}
              </select>
            }
            detail={
              assignedEntry !== null
                ? formatRolledResultOptionLabel(assignedEntry.result, 1)
                : undefined
            }
          />
        )
      })}
    </AbilityScoreCardGrid>
  )
}
