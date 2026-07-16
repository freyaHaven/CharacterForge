import { STANDARD_ARRAY } from '../../rules/standard-array/standardArray'
import type { AbilityScoreBonusMap } from './resolveAbilityScoreBreakdown'
import { buildAbilityScoreBreakdown } from './resolveAbilityScoreBreakdown'
import type { AbilityScoreKey } from './abilityScoreDisplay'
import { ABILITY_SCORE_ENTRIES } from './abilityScoreDisplay'
import type { AbilityScoreOverviewValue } from './AbilityScoreOverviewGrid'
import { AbilityScoreOverviewGrid } from './AbilityScoreOverviewGrid'
import type { StandardArrayDraftScores } from './standardArrayDraft'

export const STANDARD_ARRAY_UNASSIGNED_LABEL = '—'

const UNASSIGNED_VALUE = ''

type StandardArrayAbilityInputsProps = {
  draft: StandardArrayDraftScores
  bonuses?: AbilityScoreBonusMap
  onDraftChange: (
    ability: keyof StandardArrayDraftScores,
    value: number | null,
  ) => void
}

function getValuesUsedByOtherAbilities(
  draft: StandardArrayDraftScores,
  currentAbility: keyof StandardArrayDraftScores,
): Set<number> {
  const usedValues = new Set<number>()

  for (const { key } of ABILITY_SCORE_ENTRIES) {
    if (key !== currentAbility && draft[key] !== null) {
      usedValues.add(draft[key])
    }
  }

  return usedValues
}

export function StandardArrayAbilityInputs({
  draft,
  bonuses,
  onDraftChange,
}: StandardArrayAbilityInputsProps) {
  const breakdown = buildAbilityScoreBreakdown({
    baseScores: draft,
    bonuses,
  })

  const scores = Object.fromEntries(
    breakdown.map((entry) => {
      const usedByOthers = getValuesUsedByOtherAbilities(draft, entry.abilityKey)
      const selectedValue = draft[entry.abilityKey]
      const selectValue =
        selectedValue === null ? UNASSIGNED_VALUE : String(selectedValue)

      const value: AbilityScoreOverviewValue = {
        base: entry.baseScore,
        total: entry.totalScore,
        controls: (
          <select
            aria-label={`${entry.label} score`}
            value={selectValue}
            onChange={(event) => {
              if (event.target.value === UNASSIGNED_VALUE) {
                onDraftChange(entry.abilityKey, null)
                return
              }

              const nextValue = Number.parseInt(event.target.value, 10)
              onDraftChange(entry.abilityKey, nextValue)
            }}
          >
            <option value={UNASSIGNED_VALUE}>
              {STANDARD_ARRAY_UNASSIGNED_LABEL}
            </option>
            {STANDARD_ARRAY.map((arrayValue) => (
              <option
                key={arrayValue}
                value={arrayValue}
                disabled={usedByOthers.has(arrayValue)}
              >
                {arrayValue}
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
