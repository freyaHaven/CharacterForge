import type { AbilityId } from '../../domain/abilities/types'
import type {
  AbilityScoreIncreaseSelection,
  BackgroundDefinition,
} from '../../domain/background/types'
import { formatAbilityLabel } from '../class/formatClassDetails'

type AbilityScoreIncreaseChoiceProps = {
  definition: BackgroundDefinition
  value: AbilityScoreIncreaseSelection | null
  errorId?: string
  onChange: (value: AbilityScoreIncreaseSelection | null) => void
}

function createTwoAndOneSelection(
  plusTwo: AbilityId,
  plusOne: AbilityId,
): AbilityScoreIncreaseSelection {
  return { mode: 'two-and-one', plusTwo, plusOne }
}

export function AbilityScoreIncreaseChoice({
  definition,
  value,
  errorId,
  onChange,
}: AbilityScoreIncreaseChoiceProps) {
  const eligibleAbilities = definition.eligibleAbilityScores
  const mode = value?.mode ?? null
  const plusTwo =
    value?.mode === 'two-and-one' ? value.plusTwo : eligibleAbilities[0]
  const plusOne =
    value?.mode === 'two-and-one'
      ? value.plusOne
      : eligibleAbilities.find((abilityId) => abilityId !== plusTwo) ??
        eligibleAbilities[1]

  return (
    <fieldset
      className="background-picker__choice-fieldset"
      aria-describedby={errorId}
    >
      <legend>Ability Score Increases</legend>
      <p className="background-picker__choice-help">
        Increase one eligible score by 2 and another by 1, or increase all
        three by 1.
      </p>

      <div className="background-picker__choice-options">
        <div className="background-picker__choice-option">
          <input
            id="background-ability-mode-two-and-one"
            type="radio"
            name="background-ability-mode"
            checked={mode === 'two-and-one'}
            onChange={() => {
              onChange(createTwoAndOneSelection(plusTwo, plusOne))
            }}
          />
          <label htmlFor="background-ability-mode-two-and-one">
            <span className="background-picker__choice-label">+2 / +1</span>
          </label>
        </div>
        <div className="background-picker__choice-option">
          <input
            id="background-ability-mode-three-one"
            type="radio"
            name="background-ability-mode"
            checked={mode === 'three-one'}
            onChange={() => {
              onChange({ mode: 'three-one' })
            }}
          />
          <label htmlFor="background-ability-mode-three-one">
            <span className="background-picker__choice-label">+1 / +1 / +1</span>
          </label>
        </div>
      </div>

      {mode === 'two-and-one' ? (
        <div className="background-picker__ability-assignments">
          <label className="field">
            <span>+2 Ability</span>
            <select
              value={plusTwo}
              onChange={(event) => {
                const nextPlusTwo = event.target.value as AbilityId
                const nextPlusOne =
                  plusOne === nextPlusTwo
                    ? eligibleAbilities.find(
                        (abilityId) => abilityId !== nextPlusTwo,
                      ) ?? plusOne
                    : plusOne

                onChange(
                  createTwoAndOneSelection(nextPlusTwo, nextPlusOne),
                )
              }}
            >
              {eligibleAbilities.map((abilityId) => (
                <option key={abilityId} value={abilityId}>
                  {formatAbilityLabel(abilityId)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>+1 Ability</span>
            <select
              value={plusOne}
              onChange={(event) => {
                onChange(
                  createTwoAndOneSelection(
                    plusTwo,
                    event.target.value as AbilityId,
                  ),
                )
              }}
            >
              {eligibleAbilities
                .filter((abilityId) => abilityId !== plusTwo)
                .map((abilityId) => (
                  <option key={abilityId} value={abilityId}>
                    {formatAbilityLabel(abilityId)}
                  </option>
                ))}
            </select>
          </label>
        </div>
      ) : null}

      {mode === 'three-one' ? (
        <p className="background-picker__choice-summary" aria-live="polite">
          Each eligible ability increases by 1:{' '}
          {eligibleAbilities.map(formatAbilityLabel).join(', ')}.
        </p>
      ) : null}
    </fieldset>
  )
}
