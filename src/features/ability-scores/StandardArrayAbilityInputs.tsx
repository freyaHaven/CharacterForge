import { STANDARD_ARRAY } from '../../rules/standard-array/standardArray'
import { ABILITY_SCORE_ENTRIES } from './abilityScoreDisplay'
import { AbilityScoreCard } from './AbilityScoreCard'
import { AbilityScoreCardGrid } from './AbilityScoreCardGrid'
import type { StandardArrayDraftScores } from './standardArrayDraft'

export const STANDARD_ARRAY_UNASSIGNED_LABEL = '—'

const UNASSIGNED_VALUE = ''

type StandardArrayAbilityInputsProps = {
  draft: StandardArrayDraftScores
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
  onDraftChange,
}: StandardArrayAbilityInputsProps) {
  return (
    <AbilityScoreCardGrid>
      {ABILITY_SCORE_ENTRIES.map(({ key, abbreviation, label }) => {
        const usedByOthers = getValuesUsedByOtherAbilities(draft, key)
        const selectedValue = draft[key]
        const selectValue =
          selectedValue === null ? UNASSIGNED_VALUE : String(selectedValue)

        return (
          <AbilityScoreCard
            key={key}
            abilityKey={key}
            abbreviation={abbreviation}
            scoreLabel={label}
            score={selectedValue}
            variant="interactive"
            controls={
              <select
                aria-label={`${label} score`}
                value={selectValue}
                onChange={(event) => {
                  if (event.target.value === UNASSIGNED_VALUE) {
                    onDraftChange(key, null)
                    return
                  }

                  const value = Number.parseInt(event.target.value, 10)
                  onDraftChange(key, value)
                }}
              >
                <option value={UNASSIGNED_VALUE}>
                  {STANDARD_ARRAY_UNASSIGNED_LABEL}
                </option>
                {STANDARD_ARRAY.map((value) => (
                  <option
                    key={value}
                    value={value}
                    disabled={usedByOthers.has(value)}
                  >
                    {value}
                  </option>
                ))}
              </select>
            }
          />
        )
      })}
    </AbilityScoreCardGrid>
  )
}
