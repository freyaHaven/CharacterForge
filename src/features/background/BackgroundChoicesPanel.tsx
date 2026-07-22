import type {
  AbilityScoreIncreaseSelection,
  BackgroundChoice,
  BackgroundDefinition,
} from '../../domain/background/types'
import type { FeatDefinition } from '../../domain/feat/types'
import {
  BACKGROUND_ORIGIN_FEAT_GRANT_SLOT_ID,
  createFeatGrantChoiceStorageKey,
  readFeatGrantChoices,
} from '../../domain/feat/featGrantChoiceStorage'
import { getBackgroundChoiceDefinition } from '../../rules/background/backgroundRules'
import type { BackgroundValidationIssue } from '../../rules/background/backgroundRules'
import { AbilityScoreIncreaseChoice } from './AbilityScoreIncreaseChoice'
import { formatBackgroundValidationIssue } from './formatBackgroundValidation'
import { SingleSelectCardGrid } from '../choices/SingleSelectCardGrid'
import { FeatSubChoicesFields } from '../feat/FeatSubChoicesFields'

function BackgroundSingleSelectField({
  choice,
  value,
  errorId,
  onChange,
}: BackgroundSingleSelectFieldProps) {
  const legendId = `background-choice-${choice.id}-legend`

  return (
    <fieldset
      className="background-picker__choice-fieldset"
      aria-describedby={errorId}
    >
      <legend id={legendId}>{choice.prompt}</legend>
      <SingleSelectCardGrid
        id={`background-choice-${choice.id}`}
        name={`background-choice-${choice.id}`}
        options={choice.options.map((option) => ({
          id: option.id,
          label: option.label,
          description: option.description,
        }))}
        selectedOptionId={value ?? null}
        ariaLabelledBy={legendId}
        ariaDescribedBy={errorId}
        onSelect={(optionId) => {
          onChange(choice.id, optionId)
        }}
      />
    </fieldset>
  )
}

type BackgroundSingleSelectFieldProps = {
  choice: BackgroundChoice
  value: string | undefined
  errorId: string | undefined
  onChange: (
    choiceId: string,
    optionId: string | string[] | undefined,
  ) => void
}

type BackgroundChoicesPanelProps = {
  definition: BackgroundDefinition
  abilityScoreIncrease: AbilityScoreIncreaseSelection | null
  choices: Record<string, string | string[]>
  choiceIssueById: Map<string, BackgroundValidationIssue>
  originFeatDefinition?: FeatDefinition | null
  onAbilityScoreIncreaseChange: (
    value: AbilityScoreIncreaseSelection | null,
  ) => void
  onChoiceChange: (
    choiceId: string,
    optionId: string | string[] | undefined,
  ) => void
  onOriginFeatChoiceChange?: (
    featChoiceId: string,
    value: string | string[] | undefined,
  ) => void
}

function getPlayerChoiceIds(definition: BackgroundDefinition): string[] {
  const choiceIds: string[] = []

  if (definition.toolProficiency.kind === 'choice') {
    choiceIds.push(definition.toolProficiency.choiceId)
  }

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
  originFeatDefinition = null,
  onAbilityScoreIncreaseChange,
  onChoiceChange,
  onOriginFeatChoiceChange,
}: BackgroundChoicesPanelProps) {
  const abilityIssue = choiceIssueById.get('ability-score-increase')
  const abilityErrorId =
    abilityIssue === undefined
      ? undefined
      : 'background-choice-error-ability-score-increase'

  const originFeatChoices =
    originFeatDefinition === null
      ? {}
      : readFeatGrantChoices(choices, BACKGROUND_ORIGIN_FEAT_GRANT_SLOT_ID)

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

        {originFeatDefinition !== null &&
        originFeatDefinition.choices.length > 0 &&
        onOriginFeatChoiceChange !== undefined ? (
          <div className="background-picker__choice">
            <h4 className="background-picker__origin-feat-heading">
              {originFeatDefinition.name}
            </h4>
            <FeatSubChoicesFields
              definition={originFeatDefinition}
              choices={originFeatChoices}
              ownedSkillIds={new Set()}
              ownedToolIds={new Set()}
              onChange={onOriginFeatChoiceChange}
            />
            {originFeatDefinition.choices.map((choice) => {
              const storageKey = createFeatGrantChoiceStorageKey(
                BACKGROUND_ORIGIN_FEAT_GRANT_SLOT_ID,
                choice.id,
              )
              const issue =
                choiceIssueById.get(choice.id) ??
                choiceIssueById.get(storageKey)
              if (issue === undefined) {
                return null
              }
              return (
                <p
                  key={choice.id}
                  className="background-picker__choice-error"
                  role="alert"
                >
                  {formatBackgroundValidationIssue(issue)}
                </p>
              )
            })}
          </div>
        ) : null}

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
          const rawValue = choices[choiceId]
          const value = typeof rawValue === 'string' ? rawValue : undefined

          return (
            <div key={choiceId} className="background-picker__choice">
              <BackgroundSingleSelectField
                choice={choice}
                value={value}
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
