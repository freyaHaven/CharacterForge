import type {
  AbilityScoreIncreaseSelection,
  BackgroundChoice,
  BackgroundDefinition,
} from '../../domain/background/types'
import { getBackgroundChoiceDefinition } from '../../rules/background/backgroundRules'
import type { BackgroundValidationIssue } from '../../rules/background/backgroundRules'
import { AbilityScoreIncreaseChoice } from './AbilityScoreIncreaseChoice'
import { formatBackgroundValidationIssue } from './formatBackgroundValidation'
import { SingleSelectChoiceOptions } from '../choices/SingleSelectChoiceOptions'

type BackgroundSingleSelectFieldProps = {
  choice: BackgroundChoice
  value: string | undefined
  errorId: string | undefined
  onChange: (choiceId: string, optionId: string | undefined) => void
}

function BackgroundSingleSelectField({
  choice,
  value,
  errorId,
  onChange,
}: BackgroundSingleSelectFieldProps) {
  return (
    <fieldset
      className="background-picker__choice-fieldset"
      aria-describedby={errorId}
    >
      <legend>{choice.prompt}</legend>
      <SingleSelectChoiceOptions
        id={`background-choice-${choice.id}`}
        name={`background-choice-${choice.id}`}
        options={choice.options.map((option) => ({
          id: option.id,
          label: option.label,
          description: option.description,
        }))}
        selectedOptionId={value ?? null}
        onSelect={(optionId) => {
          onChange(choice.id, optionId)
        }}
      />
    </fieldset>
  )
}

type BackgroundChoicesPanelProps = {
  definition: BackgroundDefinition
  abilityScoreIncrease: AbilityScoreIncreaseSelection | null
  choices: Record<string, string>
  choiceIssueById: Map<string, BackgroundValidationIssue>
  onAbilityScoreIncreaseChange: (
    value: AbilityScoreIncreaseSelection | null,
  ) => void
  onChoiceChange: (choiceId: string, optionId: string | undefined) => void
}

function getPlayerChoiceIds(definition: BackgroundDefinition): string[] {
  const choiceIds: string[] = []

  if (definition.toolProficiency.kind === 'choice') {
    choiceIds.push(definition.toolProficiency.choiceId)
  }

  choiceIds.push(definition.equipment.choiceId)

  for (const choice of definition.choices) {
    choiceIds.push(choice.id)
  }

  return choiceIds
}

export function BackgroundChoicesPanel({
  definition,
  abilityScoreIncrease,
  choices,
  choiceIssueById,
  onAbilityScoreIncreaseChange,
  onChoiceChange,
}: BackgroundChoicesPanelProps) {
  const abilityIssue = choiceIssueById.get('ability-score-increase')
  const abilityErrorId =
    abilityIssue === undefined
      ? undefined
      : 'background-choice-error-ability-score-increase'

  return (
    <section
      className="background-picker__choices-panel"
      aria-labelledby="background-choices-heading"
    >
      <h3 id="background-choices-heading">Your Choices</h3>

      <div className="background-picker__choices">
        <div className="background-picker__choice">
          <AbilityScoreIncreaseChoice
            definition={definition}
            value={abilityScoreIncrease}
            errorId={abilityErrorId}
            onChange={onAbilityScoreIncreaseChange}
          />
          {abilityIssue !== undefined && abilityErrorId !== undefined ? (
            <p
              id={abilityErrorId}
              className="background-picker__choice-error"
              role="alert"
            >
              {formatBackgroundValidationIssue(abilityIssue)}
            </p>
          ) : null}
        </div>

        {getPlayerChoiceIds(definition).map((choiceId) => {
          const choice = getBackgroundChoiceDefinition(definition, choiceId)

          if (choice === null) {
            return null
          }

          const issue = choiceIssueById.get(choiceId)
          const errorId =
            issue === undefined
              ? undefined
              : `background-choice-error-${choiceId}`

          return (
            <div key={choiceId} className="background-picker__choice">
              <BackgroundSingleSelectField
                choice={choice}
                value={choices[choiceId]}
                errorId={errorId}
                onChange={onChoiceChange}
              />
              {issue !== undefined && errorId !== undefined ? (
                <p
                  id={errorId}
                  className="background-picker__choice-error"
                  role="alert"
                >
                  {formatBackgroundValidationIssue(issue)}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
