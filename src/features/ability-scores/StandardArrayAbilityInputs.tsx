import { getAbilityModifier } from '../../domain/abilities'
import { STANDARD_ARRAY } from '../../rules/standard-array/standardArray'
import type { StandardArrayDraftScores } from './standardArrayDraft'

const ABILITY_LABELS: { key: keyof StandardArrayDraftScores; label: string }[] =
  [
    { key: 'strength', label: 'Strength' },
    { key: 'dexterity', label: 'Dexterity' },
    { key: 'constitution', label: 'Constitution' },
    { key: 'intelligence', label: 'Intelligence' },
    { key: 'wisdom', label: 'Wisdom' },
    { key: 'charisma', label: 'Charisma' },
  ]

const UNASSIGNED_VALUE = ''
export const STANDARD_ARRAY_UNASSIGNED_LABEL = '—'

type StandardArrayAbilityInputsProps = {
  draft: StandardArrayDraftScores
  onDraftChange: (
    ability: keyof StandardArrayDraftScores,
    value: number | null,
  ) => void
}

function formatModifier(score: number | null): string {
  if (score === null) {
    return '—'
  }

  const modifier = getAbilityModifier(score)
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function getValuesUsedByOtherAbilities(
  draft: StandardArrayDraftScores,
  currentAbility: keyof StandardArrayDraftScores,
): Set<number> {
  const usedValues = new Set<number>()

  for (const { key } of ABILITY_LABELS) {
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
    <div className="ability-grid">
      {ABILITY_LABELS.map(({ key, label }) => {
        const usedByOthers = getValuesUsedByOtherAbilities(draft, key)
        const selectedValue = draft[key]
        const selectValue =
          selectedValue === null ? UNASSIGNED_VALUE : String(selectedValue)

        return (
          <label key={key} className="ability-field">
            <span>{label}</span>
            <div className="ability-inputs">
              <select
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
              <span className="modifier">{formatModifier(selectedValue)}</span>
            </div>
          </label>
        )
      })}
    </div>
  )
}
