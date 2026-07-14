import { useEffect, useMemo, useState } from 'react'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { EditionId } from '../../domain/types'
import type {
  ClassChoice,
  ClassChoiceValue,
  ClassDefinition,
  ClassSelection,
} from '../../domain/class/types'
import { getChoicesAvailableAtLevel } from '../../domain/class/choiceAvailability'
import { getClassFeatureProgressionUpToLevel } from '../../domain/class/featureProgression'
import { SKILL_LABELS } from '../../domain/skills/types'
import { validateClassSelection } from '../../rules/class/classRules'
import { FeatureChoiceCard } from '../choices/FeatureChoiceCard'
import {
  getFeatureChoiceExpanded,
  pruneFeatureChoiceExpansionState,
  setFeatureChoiceExpanded,
  type FeatureChoiceExpansionState,
} from '../choices/featureChoiceExpansionState'
import {
  findSingleSelectChoiceForFeature,
  getChoicesNotLinkedToFeatures,
} from '../choices/linkFeatureToChoice'
import { ClassCatalogCard } from './ClassCatalogCard'
import { ClassIcon } from './ClassIcon'
import { LevelStepper } from './LevelStepper'
import {
  formatAbilityList,
  formatArmorProficiencies,
  formatHitDie,
  formatWeaponProficiencies,
} from './formatClassDetails'
import { filterClassesByName } from './filterClassesByName'
import { formatClassValidationIssue } from './formatClassValidation'
import {
  createClassSelectionDraft,
  draftToClassSelection,
  initializeClassSelectionDraft,
  tryCommitClassDraft,
  updateClassDraftChoice,
  updateClassDraftLevel,
  type ClassSelectionDraft,
} from './classSelectionDraft'

function getSelectedOptionIds(value: ClassChoiceValue | undefined): string[] {
  if (value === undefined) {
    return []
  }

  return typeof value === 'string' ? [value] : [...value]
}

function getFeatureLinkedChoiceIds(
  definition: ClassDefinition,
  level: number,
): string[] {
  const availableChoices = getChoicesAvailableAtLevel(definition, level)
  const featureIds = getClassFeatureProgressionUpToLevel(definition, level)
    .flatMap((entry) => entry.features)
    .map((feature) => feature.id)

  return availableChoices
    .filter(
      (choice) =>
        choice.type === 'single-select' && featureIds.includes(choice.id),
    )
    .map((choice) => choice.id)
}

function toggleMultiSelectOption(
  current: ClassChoiceValue | undefined,
  optionId: string,
  max: number,
): ClassChoiceValue {
  const selected = getSelectedOptionIds(current)

  if (selected.includes(optionId)) {
    return selected.filter((entry) => entry !== optionId)
  }

  if (selected.length >= max) {
    return selected
  }

  return [...selected, optionId]
}

type ClassChoiceFieldProps = {
  choice: ClassChoice
  value: ClassChoiceValue | undefined
  errorId: string | undefined
  onChange: (choiceId: string, value: ClassChoiceValue | undefined) => void
}

function ClassChoiceField({
  choice,
  value,
  errorId,
  onChange,
}: ClassChoiceFieldProps) {
  const selectedOptionIds = getSelectedOptionIds(value)

  return (
    <fieldset
      className="class-picker__choice-fieldset"
      aria-describedby={errorId}
    >
      <legend>{choice.prompt}</legend>
      <p className="class-picker__choice-count" aria-live="polite">
        Selected {selectedOptionIds.length} of {choice.max}
      </p>
      <div className="class-picker__choice-options class-picker__choice-options--multi">
        {choice.options.map((option) => {
          const inputId = `class-choice-${choice.id}-${option.id}`
          const isChecked = selectedOptionIds.includes(option.id)
          const isDisabled =
            !isChecked && selectedOptionIds.length >= choice.max

          return (
            <div key={option.id} className="class-picker__choice-option">
              <input
                id={inputId}
                type="checkbox"
                name={`class-choice-${choice.id}`}
                value={option.id}
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => {
                  onChange(
                    choice.id,
                    toggleMultiSelectOption(value, option.id, choice.max),
                  )
                }}
              />
              <label htmlFor={inputId}>
                <span className="class-picker__choice-label">
                  {option.label ||
                    (option.id in SKILL_LABELS
                      ? SKILL_LABELS[option.id as keyof typeof SKILL_LABELS]
                      : option.id)}
                </span>
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

type ClassPickerProps = {
  editionId: EditionId
  committedSelection: ClassSelection | null
  draft: ClassSelectionDraft | null
  catalog: ClassCatalog
  onDraftChange: (draft: ClassSelectionDraft | null) => void
  onCommittedSelectionChange: (selection: ClassSelection | null) => void
}

export function ClassPicker({
  editionId,
  committedSelection,
  draft,
  catalog,
  onDraftChange,
  onCommittedSelectionChange,
}: ClassPickerProps) {
  const [classList, setClassList] = useState<ClassDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [choiceExpansionState, setChoiceExpansionState] =
    useState<FeatureChoiceExpansionState>({})

  const activeClassId = draft?.classId ?? committedSelection?.classId ?? null
  const activeChoices = draft?.choices ?? committedSelection?.choices ?? {}
  const activeLevel = draft?.level ?? committedSelection?.level ?? 1

  const activeDefinition =
    activeClassId === null
      ? null
      : (classList.find((entry) => entry.id === activeClassId) ?? null)

  const filteredClasses = useMemo(
    () => filterClassesByName(classList, searchQuery),
    [classList, searchQuery],
  )

  const normalizedSearchQuery = searchQuery.trim()
  const isSelectedClassHidden =
    activeClassId !== null &&
    normalizedSearchQuery.length > 0 &&
    !filteredClasses.some((entry) => entry.id === activeClassId)

  const draftValidation =
    draft === null
      ? null
      : validateClassSelection(
          draftToClassSelection(draft),
          editionId,
          activeDefinition,
        )

  const choiceIssueById = useMemo(() => {
    const issues = draftValidation?.ok === false ? draftValidation.issues : []

    return new Map(
      issues
        .filter((issue) => issue.choiceId !== undefined)
        .map((issue) => [issue.choiceId as string, issue]),
    )
  }, [draftValidation])

  const availableChoices =
    activeDefinition === null
      ? []
      : getChoicesAvailableAtLevel(activeDefinition, activeLevel)

  const featureProgression =
    activeDefinition === null
      ? []
      : getClassFeatureProgressionUpToLevel(activeDefinition, activeLevel)

  const unlinkedChoices =
    activeDefinition === null
      ? []
      : getChoicesNotLinkedToFeatures(
          availableChoices,
          featureProgression.flatMap((entry) =>
            entry.features.map((feature) => feature.id),
          ),
        )

  useEffect(() => {
    setSearchQuery('')
  }, [editionId])

  useEffect(() => {
    let isActive = true
    setIsLoading(true)

    void catalog.listClasses(editionId).then((classes) => {
      if (!isActive) {
        return
      }

      setClassList(classes)
      setIsLoading(false)
    })

    return () => {
      isActive = false
    }
  }, [catalog, editionId])

  async function commitDraft(nextDraft: ClassSelectionDraft) {
    const definition = await catalog.getClass(nextDraft.classId)
    const { committed } = tryCommitClassDraft(
      nextDraft,
      editionId,
      definition,
    )

    if (committed !== null) {
      onDraftChange(null)
      onCommittedSelectionChange(committed)
      return
    }

    onDraftChange(nextDraft)
    onCommittedSelectionChange(null)
  }

  function ensureDraft(): ClassSelectionDraft | null {
    if (draft !== null) {
      return draft
    }

    if (activeClassId === null) {
      return null
    }

    return initializeClassSelectionDraft({
      classId: activeClassId,
      level: activeLevel,
      choices: activeChoices,
    })
  }

  function selectClass(classDefinition: ClassDefinition) {
    setChoiceExpansionState({})
    const nextDraft = createClassSelectionDraft(classDefinition.id)
    const { committed } = tryCommitClassDraft(
      nextDraft,
      editionId,
      classDefinition,
    )

    if (committed !== null) {
      onDraftChange(null)
      onCommittedSelectionChange(committed)
      return
    }

    onDraftChange(nextDraft)
    onCommittedSelectionChange(null)
  }

  async function handleChoiceChange(
    choiceId: string,
    value: ClassChoiceValue | undefined,
  ) {
    const currentDraft = ensureDraft()

    if (currentDraft === null) {
      return
    }

    const nextDraft = updateClassDraftChoice(currentDraft, choiceId, value)
    await commitDraft(nextDraft)
  }

  async function handleLevelChange(level: number) {
    if (activeDefinition === null) {
      return
    }

    const currentDraft = ensureDraft()

    if (currentDraft === null) {
      return
    }

    const nextDraft = updateClassDraftLevel(
      currentDraft,
      level,
      activeDefinition,
    )

    setChoiceExpansionState((current) =>
      pruneFeatureChoiceExpansionState(
        current,
        getFeatureLinkedChoiceIds(activeDefinition, level),
      ),
    )

    await commitDraft(nextDraft)
  }

  function clearSelection() {
    setChoiceExpansionState({})
    onDraftChange(null)
    onCommittedSelectionChange(null)
  }

  return (
    <section className="class-picker" aria-labelledby="class-picker-heading">
      <div className="class-picker__intro">
        <h2 id="class-picker-heading">Class</h2>
        <p className="helper-text">
          Choose a class for your character. Complete required choices to confirm
          your selection.
        </p>
      </div>

      {isLoading ? <p className="status">Loading classes...</p> : null}

      {!isLoading && classList.length === 0 ? (
        <p className="status">
          No bundled classes are available for this rules edition yet.
        </p>
      ) : null}

      {!isLoading && classList.length > 0 ? (
        <div className="class-picker__layout">
          <div className="class-picker__catalog-panel">
            <div className="class-picker__catalog-toolbar">
              <label className="class-picker__search field">
                <span>Search classes</span>
                <input
                  type="search"
                  value={searchQuery}
                  placeholder="Search by name…"
                  aria-controls="class-catalog-list"
                  onChange={(event) => {
                    setSearchQuery(event.target.value)
                  }}
                />
              </label>
            </div>

            {filteredClasses.length === 0 ? (
              <p className="class-picker__catalog-empty" role="status">
                No classes match &ldquo;{normalizedSearchQuery}&rdquo;.
              </p>
            ) : (
              <ul
                id="class-catalog-list"
                className="class-picker__catalog"
                role="list"
              >
                {filteredClasses.map((classDefinition) => (
                  <ClassCatalogCard
                    key={classDefinition.id}
                    classDefinition={classDefinition}
                    isSelected={activeClassId === classDefinition.id}
                    onSelect={selectClass}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="class-picker__detail-panel">
            {isSelectedClassHidden ? (
              <p className="class-picker__detail-hidden-note" role="status">
                The selected class is hidden by the current search.
              </p>
            ) : null}

            {activeDefinition !== null ? (
              <article className="class-picker__detail">
                <header className="class-picker__detail-header">
                  <div className="class-picker__detail-title-row">
                    <span className="class-picker__detail-icon">
                      <ClassIcon classId={activeDefinition.id} />
                    </span>
                    <div className="class-picker__detail-text">
                      <h3>{activeDefinition.name}</h3>
                      <p className="class-picker__detail-lead">
                        {activeDefinition.description}
                      </p>
                    </div>
                  </div>
                </header>

                <div className="class-picker__level-row">
                  <LevelStepper
                    value={activeLevel}
                    onChange={(level) => {
                      void handleLevelChange(level)
                    }}
                  />
                </div>

                <dl className="class-picker__metadata">
                  <div className="class-picker__metadata-item">
                    <dt>Hit Die</dt>
                    <dd>{formatHitDie(activeDefinition)}</dd>
                  </div>
                  <div className="class-picker__metadata-item">
                    <dt>Primary Abilities</dt>
                    <dd>
                      {formatAbilityList(activeDefinition.primaryAbilities)}
                    </dd>
                  </div>
                  <div className="class-picker__metadata-item">
                    <dt>Saving Throws</dt>
                    <dd>{formatAbilityList(activeDefinition.savingThrows)}</dd>
                  </div>
                  <div className="class-picker__metadata-item">
                    <dt>Armour</dt>
                    <dd>
                      {formatArmorProficiencies(
                        activeDefinition.proficiencies.armor,
                      )}
                    </dd>
                  </div>
                  <div className="class-picker__metadata-item">
                    <dt>Weapons</dt>
                    <dd>
                      {formatWeaponProficiencies(
                        activeDefinition.proficiencies.weapons,
                      )}
                    </dd>
                  </div>
                </dl>

                {featureProgression.length > 0 ? (
                  <div className="class-picker__features">
                    <h4 className="class-picker__section-title">
                      Class Features
                    </h4>
                    {featureProgression.map((levelEntry) => (
                      <div
                        key={levelEntry.level}
                        className="class-picker__feature-level"
                      >
                        <h5 className="class-picker__feature-level-title">
                          Level {levelEntry.level}
                        </h5>
                        <div className="class-picker__feature-cards">
                          {levelEntry.features.map((feature) => {
                            const linkedChoice = findSingleSelectChoiceForFeature(
                              feature.id,
                              availableChoices,
                            )
                            const issue =
                              linkedChoice === null
                                ? undefined
                                : choiceIssueById.get(linkedChoice.id)
                            const errorId =
                              issue === undefined
                                ? undefined
                                : `class-choice-error-${linkedChoice.id}`

                            if (linkedChoice !== null) {
                              const selectedOptionId =
                                typeof activeChoices[linkedChoice.id] ===
                                'string'
                                  ? activeChoices[linkedChoice.id]
                                  : null
                              const hasSelection =
                                selectedOptionId !== null &&
                                selectedOptionId.length > 0

                              return (
                                <div
                                  key={feature.id}
                                  className="class-picker__feature-choice"
                                >
                                  <FeatureChoiceCard
                                    id={`class-feature-${feature.id}`}
                                    title={feature.name}
                                    description={feature.description}
                                    options={linkedChoice.options}
                                    selectedOptionId={selectedOptionId}
                                    name={`class-choice-${linkedChoice.id}`}
                                    describedBy={errorId}
                                    expanded={getFeatureChoiceExpanded(
                                      choiceExpansionState,
                                      linkedChoice.id,
                                      hasSelection,
                                    )}
                                    onExpandedChange={(expanded) => {
                                      setChoiceExpansionState((current) =>
                                        setFeatureChoiceExpanded(
                                          current,
                                          linkedChoice.id,
                                          expanded,
                                        ),
                                      )
                                    }}
                                    onSelect={(optionId) => {
                                      void handleChoiceChange(
                                        linkedChoice.id,
                                        optionId,
                                      )
                                    }}
                                  />
                                  {issue !== undefined &&
                                  errorId !== undefined ? (
                                    <p
                                      id={errorId}
                                      className="class-picker__choice-error"
                                      role="alert"
                                    >
                                      {formatClassValidationIssue(issue)}
                                    </p>
                                  ) : null}
                                </div>
                              )
                            }

                            return (
                              <article
                                key={feature.id}
                                className="class-picker__feature-card"
                              >
                                <h6>{feature.name}</h6>
                                <p>{feature.description}</p>
                              </article>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {unlinkedChoices.length > 0 ? (
                  <div className="class-picker__choices">
                    {unlinkedChoices.map((choice) => {
                      const issue = choiceIssueById.get(choice.id)
                      const errorId =
                        issue === undefined
                          ? undefined
                          : `class-choice-error-${choice.id}`

                      return (
                        <div key={choice.id} className="class-picker__choice">
                          <ClassChoiceField
                            choice={choice}
                            value={activeChoices[choice.id]}
                            errorId={errorId}
                            onChange={(choiceId, nextValue) => {
                              void handleChoiceChange(choiceId, nextValue)
                            }}
                          />
                          {issue !== undefined && errorId !== undefined ? (
                            <p
                              id={errorId}
                              className="class-picker__choice-error"
                              role="alert"
                            >
                              {formatClassValidationIssue(issue)}
                            </p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </article>
            ) : (
              <div
                className="class-picker__detail class-picker__detail--placeholder"
                aria-hidden="true"
              >
                <p>Select a class to preview its features and choices.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeDefinition !== null && committedSelection !== null ? (
        <p className="class-picker__selection">
          Selected: <strong>{activeDefinition.name}</strong> (level{' '}
          {committedSelection.level})
        </p>
      ) : null}

      {draft !== null && committedSelection === null ? (
        <p className="class-picker__selection">
          Selecting: <strong>{activeDefinition?.name ?? 'Class'}</strong> (level{' '}
          {draft.level}) (complete required choices to confirm)
        </p>
      ) : null}

      {draftValidation !== null && !draftValidation.ok ? (
        <div className="validation-message" role="alert">
          <p>Complete the class selection:</p>
          <ul>
            {draftValidation.issues.map((issue) => (
              <li key={`${issue.code}-${issue.choiceId ?? 'general'}`}>
                {formatClassValidationIssue(issue)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {activeClassId !== null ? (
        <button
          type="button"
          className="class-picker__clear"
          onClick={clearSelection}
        >
          Clear class selection
        </button>
      ) : null}
    </section>
  )
}
