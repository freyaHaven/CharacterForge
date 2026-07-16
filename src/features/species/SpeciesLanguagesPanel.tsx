import type {
  SpeciesChoice,
  SpeciesLanguages,
  SpeciesSelectionChoiceValue,
} from '../../domain/species/types'
import { resolveLanguageChoicePool } from '../../domain/species/standardLanguages'
import { SingleSelectCardGrid } from '../choices/SingleSelectCardGrid'
import { SelectionCheckIcon } from './SpeciesUiIcons'
import {
  SpeciesSectionAccordion,
  type SpeciesSectionCompletion,
} from './SpeciesSectionAccordion'

function getSelectedIds(
  value: SpeciesSelectionChoiceValue | undefined,
): string[] {
  if (value === undefined) {
    return []
  }

  return typeof value === 'string' ? [value] : [...value]
}

function toggleLanguageOption(
  current: SpeciesSelectionChoiceValue | undefined,
  optionId: string,
  max: number,
): string[] {
  const selected = getSelectedIds(current)

  if (selected.includes(optionId)) {
    return selected.filter((entry) => entry !== optionId)
  }

  if (selected.length >= max) {
    return selected
  }

  return [...selected, optionId]
}

function languageChoiceCompletion(
  choice: SpeciesLanguages['choices'][number],
  selectedIds: readonly string[],
): SpeciesSectionCompletion {
  if (!choice.required) {
    return 'complete'
  }

  return selectedIds.length >= choice.count ? 'complete' : 'incomplete'
}

export type SpeciesLanguagesPanelProps = {
  languages: SpeciesLanguages
  selectedByChoiceId?: Record<string, SpeciesSelectionChoiceValue | undefined>
  onLanguageChoiceChange?: (
    choiceId: string,
    selectedIds: string[],
  ) => void
  defaultExpanded?: boolean
}

export function SpeciesLanguagesPanel({
  languages,
  selectedByChoiceId = {},
  onLanguageChoiceChange,
  defaultExpanded = false,
}: SpeciesLanguagesPanelProps) {
  const grantLabels = languages.grants.map((grant) => grant.label)
  const hasChoices = languages.choices.length > 0
  const unresolvedRequired = languages.choices.some((choice) => {
    const selected = getSelectedIds(selectedByChoiceId[choice.id])
    return languageChoiceCompletion(choice, selected) === 'incomplete'
  })

  const completion: SpeciesSectionCompletion = unresolvedRequired
    ? 'incomplete'
    : 'complete'
  const completionLabel = unresolvedRequired ? 'Incomplete' : 'Complete'

  const selectedLanguageLabels = languages.choices.flatMap((choice) => {
    const pool = resolveLanguageChoicePool(choice.pool)
    return getSelectedIds(selectedByChoiceId[choice.id]).map(
      (id) => pool.find((option) => option.id === id)?.label ?? id,
    )
  })

  const metaParts =
    selectedLanguageLabels.length > 0
      ? [...grantLabels, ...selectedLanguageLabels]
      : grantLabels.length > 0
        ? grantLabels
        : hasChoices
          ? ['Choose languages']
          : ['None']

  return (
    <SpeciesSectionAccordion
      title="Languages"
      metaParts={metaParts}
      completion={completion}
      completionLabel={completionLabel}
      defaultExpanded={defaultExpanded || unresolvedRequired}
    >
      {languages.grants.length > 0 ? (
        <ul className="species-picker__language-grants">
          {languages.grants.map((grant) => (
            <li key={grant.id}>{grant.label}</li>
          ))}
        </ul>
      ) : null}

      {languages.choices.map((choice) => {
        const selected = getSelectedIds(selectedByChoiceId[choice.id])
        const pool = resolveLanguageChoicePool(choice.pool)
        const choiceIncomplete =
          languageChoiceCompletion(choice, selected) === 'incomplete'

        return (
          <div key={choice.id} className="species-picker__language-choice">
            <p className="species-picker__language-choice-prompt">
              {choice.prompt}
              {choiceIncomplete ? (
                <span className="species-picker__language-choice-warning">
                  {' '}
                  ({selected.length}/{choice.count})
                </span>
              ) : null}
            </p>

            <div
              className="card-select-choice__grid card-select-choice__grid--compact card-select-choice__grid--cols-2"
              role="group"
              aria-label={choice.prompt}
            >
              {pool.map((option) => {
                const inputId = `species-language-${choice.id}-${option.id}`
                const isSelected = selected.includes(option.id)
                const isDisabled =
                  !isSelected && selected.length >= choice.count

                return (
                  <div key={option.id} className="card-select-choice__item">
                    <input
                      id={inputId}
                      className="sr-only card-select-choice__input"
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled || onLanguageChoiceChange === undefined}
                      onChange={() => {
                        if (onLanguageChoiceChange === undefined) {
                          return
                        }

                        onLanguageChoiceChange(
                          choice.id,
                          toggleLanguageOption(
                            selectedByChoiceId[choice.id],
                            option.id,
                            choice.count,
                          ),
                        )
                      }}
                    />
                    <label
                      htmlFor={inputId}
                      className={
                        isDisabled
                          ? 'card-select-choice__card card-select-choice__card--compact card-select-choice__card--disabled'
                          : isSelected
                            ? 'card-select-choice__card card-select-choice__card--compact card-select-choice__card--selected'
                            : 'card-select-choice__card card-select-choice__card--compact'
                      }
                    >
                      {isSelected ? (
                        <span
                          className="card-select-choice__badge"
                          aria-hidden="true"
                        >
                          <SelectionCheckIcon />
                        </span>
                      ) : null}
                      <span className="card-select-choice__text">
                        <span className="card-select-choice__title">
                          {option.label}
                        </span>
                      </span>
                    </label>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </SpeciesSectionAccordion>
  )
}

export type SpeciesChoiceAccordionProps = {
  choice: SpeciesChoice
  selectedOptionId: string | undefined
  onSelect: (optionId: string) => void
}

export function SpeciesChoiceAccordion({
  choice,
  selectedOptionId,
  onSelect,
}: SpeciesChoiceAccordionProps) {
  const isComplete = selectedOptionId !== undefined && selectedOptionId !== ''
  const selectedLabel = choice.options.find(
    (option) => option.id === selectedOptionId,
  )?.label
  const completion: SpeciesSectionCompletion =
    choice.required && !isComplete ? 'incomplete' : 'complete'

  return (
    <SpeciesSectionAccordion
      title={choice.prompt}
      metaParts={selectedLabel !== undefined ? [selectedLabel] : ['No selection']}
      completion={completion}
      completionLabel={isComplete ? 'Complete' : 'Incomplete'}
      defaultExpanded={!isComplete}
    >
      {choice.helperText !== undefined ? (
        <p className="helper-text">{choice.helperText}</p>
      ) : null}
      <SingleSelectCardGrid
        id={`species-choice-${choice.id}`}
        name={`species-choice-${choice.id}`}
        options={choice.options.map((option) => ({
          id: option.id,
          label: option.label,
          description: option.description,
        }))}
        selectedOptionId={selectedOptionId}
        onSelect={onSelect}
      />
    </SpeciesSectionAccordion>
  )
}
