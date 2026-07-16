import { useMemo, useState } from 'react'
import type { EditionId } from '../../domain/types'
import type {
  ClassChoiceValue,
  ClassDefinition,
  ClassSelection,
} from '../../domain/class/types'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import {
  collectAsiFeatIds,
  isAbilityScoreImprovementChoiceId,
} from '../../domain/class/abilityScoreImprovement'
import { getChoicesAvailableAtLevel } from '../../domain/class/choiceAvailability'
import { getClassFeatureProgressionUpToLevel } from '../../domain/class/featureProgression'
import { validateClassSelection } from '../../rules/class/classRules'
import { createClassChoiceStateKey } from './classChoiceStateKeys'
import { resolveDeferredRequirementsForInstances } from '../../rules/class/resolveCharacterDeferredRequirements'
import { FeatureChoiceCard } from '../choices/FeatureChoiceCard'
import {
  getFeatureChoiceExpanded,
  setFeatureChoiceExpanded,
  type FeatureChoiceExpansionState,
} from '../choices/featureChoiceExpansionState'
import {
  findMultiSelectChoiceForFeature,
  findSingleSelectChoiceForFeature,
  getChoicesNotLinkedToFeatures,
} from '../choices/linkFeatureToChoice'
import {
  ClassDeferredRequirementsPanel,
  ClassSelectionSummary,
} from './ClassSelectionSummary'
import { AsiChoiceField } from './AsiChoiceField'
import { ClassMultiSelectChoiceField } from './ClassMultiSelectChoiceField'
import { LevelStepper } from './LevelStepper'
import { formatClassValidationIssue } from './formatClassValidation'
import type { ClassSelectionDraft } from './classSelectionDraft'
import {
  choiceGrantsSkillProficiency,
  collectSkillProficiencySelections,
} from '../../domain/class/skillProficiencySelections'
import {
  collectWeaponMasterySelections,
  isWeaponMasteryChoiceId,
} from '../../domain/class/weaponMastery'

function getExcludedMultiSelectOptionIds(
  definition: ClassDefinition,
  choiceId: string,
  choices: Record<string, ClassChoiceValue>,
): string[] {
  if (isWeaponMasteryChoiceId(choiceId)) {
    return collectWeaponMasterySelections(choices, choiceId)
  }

  const choice = definition.choices.find((entry) => entry.id === choiceId)
  if (choice !== undefined && choiceGrantsSkillProficiency(choice)) {
    return collectSkillProficiencySelections(definition, choices, choiceId)
  }

  return []
}

export type ClassInstanceConfiguratorProps = {
  editionId: EditionId
  activeInstanceId: string | null
  activeDefinition: ClassDefinition
  activeClassId: string
  activeLevel: number
  activeChoices: Record<string, ClassChoiceValue>
  maxInstanceLevel: number
  draft: ClassSelectionDraft | null
  committedSelection: ClassSelection | null
  featCatalog: FeatCatalog
  characterFeatId?: string | null
  levelLabel?: string
  showRemoveButton?: boolean
  onLevelChange: (level: number) => void
  onChoiceChange: (choiceId: string, value: ClassChoiceValue | undefined) => void
  onRemove?: () => void
}

export function ClassInstanceConfigurator({
  editionId,
  activeInstanceId,
  activeDefinition,
  activeClassId,
  activeLevel,
  activeChoices,
  maxInstanceLevel,
  draft,
  committedSelection,
  featCatalog,
  characterFeatId = null,
  levelLabel = 'Levels in this class',
  showRemoveButton = false,
  onLevelChange,
  onChoiceChange,
  onRemove,
}: ClassInstanceConfiguratorProps) {
  const [choiceExpansionState, setChoiceExpansionState] =
    useState<FeatureChoiceExpansionState>({})

  const draftValidation =
    draft === null
      ? null
      : validateClassSelection(
          {
            classId: draft.classId,
            level: draft.level,
            choices: draft.choices,
          },
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

  const availableChoices = getChoicesAvailableAtLevel(activeDefinition, activeLevel)

  const featureProgression = getClassFeatureProgressionUpToLevel(
    activeDefinition,
    activeLevel,
  )

  const unlinkedChoices = getChoicesNotLinkedToFeatures(
    availableChoices,
    featureProgression.flatMap((entry) =>
      entry.features.map((feature) => feature.id),
    ),
  )

  const deferredRequirements =
    activeInstanceId === null
      ? []
      : resolveDeferredRequirementsForInstances(
          [
            {
              instanceId: activeInstanceId,
              classId: activeClassId,
              level: activeLevel,
              choices: activeChoices,
            },
          ],
          () => activeDefinition,
        )

  return (
    <>
      <ClassSelectionSummary
        definition={activeDefinition}
        level={activeLevel}
        choices={activeChoices}
        committedSelection={committedSelection}
        draft={draft}
        draftValidation={draftValidation}
      />

      <section
        className="class-picker__configure"
        aria-labelledby="class-picker-configure-heading"
      >
        <h3
          id="class-picker-configure-heading"
          className="class-picker__section-title"
        >
          Configure class
        </h3>

        <article className="class-picker__detail">
          <div className="class-picker__level-row">
            <LevelStepper
              value={activeLevel}
              max={maxInstanceLevel}
              label={levelLabel}
              onChange={onLevelChange}
            />
          </div>

          {featureProgression.length > 0 ? (
            <div className="class-picker__features">
              <h4 className="class-picker__subsection-title">Class Features</h4>
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
                      const linkedSingleSelect = findSingleSelectChoiceForFeature(
                        feature.id,
                        availableChoices,
                      )
                      const linkedMultiSelect = findMultiSelectChoiceForFeature(
                        feature.id,
                        availableChoices,
                      )

                      if (linkedSingleSelect !== null) {
                        const issue = choiceIssueById.get(linkedSingleSelect.id)
                        const errorId =
                          issue === undefined
                            ? undefined
                            : `class-choice-error-${linkedSingleSelect.id}`
                        const choiceValue = activeChoices[linkedSingleSelect.id]

                        if (
                          isAbilityScoreImprovementChoiceId(linkedSingleSelect.id)
                        ) {
                          return (
                            <div
                              key={feature.id}
                              className="class-picker__choice"
                            >
                              <h6>{feature.name}</h6>
                              <AsiChoiceField
                                choiceId={linkedSingleSelect.id}
                                value={
                                  typeof choiceValue === 'string'
                                    ? choiceValue
                                    : undefined
                                }
                                editionId={editionId}
                                featCatalog={featCatalog}
                                takenFeatIds={[
                                  ...collectAsiFeatIds(
                                    activeChoices,
                                    linkedSingleSelect.id,
                                  ),
                                  ...(characterFeatId !== null
                                    ? [characterFeatId]
                                    : []),
                                ]}
                                errorId={errorId}
                                onChange={onChoiceChange}
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
                        }

                        const selectedOptionId =
                          typeof choiceValue === 'string' ? choiceValue : null
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
                              options={linkedSingleSelect.options}
                              selectedOptionId={selectedOptionId}
                              name={`class-choice-${linkedSingleSelect.id}`}
                              describedBy={errorId}
                              expanded={getFeatureChoiceExpanded(
                                choiceExpansionState,
                                activeInstanceId === null
                                  ? linkedSingleSelect.id
                                  : createClassChoiceStateKey(
                                      activeInstanceId,
                                      linkedSingleSelect.id,
                                    ),
                                hasSelection,
                              )}
                              onExpandedChange={(expanded) => {
                                setChoiceExpansionState((current) =>
                                  setFeatureChoiceExpanded(
                                    current,
                                    activeInstanceId === null
                                      ? linkedSingleSelect.id
                                      : createClassChoiceStateKey(
                                          activeInstanceId,
                                          linkedSingleSelect.id,
                                        ),
                                    expanded,
                                  ),
                                )
                              }}
                              onSelect={(optionId) => {
                                onChoiceChange(linkedSingleSelect.id, optionId)
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
                      }

                      if (linkedMultiSelect !== null) {
                        const issue = choiceIssueById.get(linkedMultiSelect.id)
                        const errorId =
                          issue === undefined
                            ? undefined
                            : `class-choice-error-${linkedMultiSelect.id}`

                        return (
                          <div
                            key={feature.id}
                            className="class-picker__choice"
                          >
                            <ClassMultiSelectChoiceField
                              choice={linkedMultiSelect}
                              value={activeChoices[linkedMultiSelect.id]}
                              errorId={errorId}
                              legend={feature.name}
                              excludedOptionIds={getExcludedMultiSelectOptionIds(
                                activeDefinition,
                                linkedMultiSelect.id,
                                activeChoices,
                              )}
                              onChange={onChoiceChange}
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
                if (choice.type !== 'multi-select') {
                  return null
                }

                const issue = choiceIssueById.get(choice.id)
                const errorId =
                  issue === undefined
                    ? undefined
                    : `class-choice-error-${choice.id}`

                return (
                  <div key={choice.id} className="class-picker__choice">
                    <ClassMultiSelectChoiceField
                      choice={choice}
                      value={activeChoices[choice.id]}
                      errorId={errorId}
                      legend={choice.prompt}
                      excludedOptionIds={getExcludedMultiSelectOptionIds(
                        activeDefinition,
                        choice.id,
                        activeChoices,
                      )}
                      onChange={onChoiceChange}
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

          <ClassDeferredRequirementsPanel requirements={deferredRequirements} />

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

          {showRemoveButton && onRemove !== undefined ? (
            <button
              type="button"
              className="class-picker__clear"
              onClick={onRemove}
            >
              Remove this class
            </button>
          ) : null}
        </article>
      </section>
    </>
  )
}
