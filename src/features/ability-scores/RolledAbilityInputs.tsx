import { getAbilityModifier } from '../../domain/abilities'
import type { AbilityScores } from '../../domain/types'
import type { RolledResult } from './rolledDraft'
import { formatRolledResultOptionLabel } from './formatRollResult'
import { getRemainingRolledResults } from './rolledRemaining'
import type { RolledAssignments } from '../../rules/rolled'

function getRemainingRolledPoolResults(
  pool: readonly RolledResult[],
  assignments: RolledAssignments,
): RolledResult[] {
  const remainingEntries = getRemainingRolledResults(pool, assignments)
  const remainingIds = new Set(remainingEntries.map((entry) => entry.id))

  return pool.filter((entry) => remainingIds.has(entry.id))
}

const ABILITY_LABELS: { key: keyof AbilityScores; label: string }[] = [
  { key: 'strength', label: 'Strength' },
  { key: 'dexterity', label: 'Dexterity' },
  { key: 'constitution', label: 'Constitution' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'wisdom', label: 'Wisdom' },
  { key: 'charisma', label: 'Charisma' },
]

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

function formatModifier(score: number | null): string {
  if (score === null) {
    return '—'
  }

  const modifier = getAbilityModifier(score)
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function getRollIdsUsedByOtherAbilities(
  assignments: RolledAssignments,
  currentAbility: keyof AbilityScores,
): Set<string> {
  const usedIds = new Set<string>()

  for (const { key } of ABILITY_LABELS) {
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

  return (
    <div className="ability-grid">
      {ABILITY_LABELS.map(({ key, label }) => {
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
          <label key={key} className="ability-field">
            <span>{label}</span>
            <div className="ability-inputs">
              <select
                value={assignedRollId ?? UNASSIGNED_VALUE}
                onChange={(event) => {
                  const value = event.target.value
                  onAssignmentChange(key, value === UNASSIGNED_VALUE ? null : value)
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
              <span className="modifier">{formatModifier(assignedScore)}</span>
            </div>
          </label>
        )
      })}
    </div>
  )
}
