import { useMemo, useState } from 'react'
import type { EditionId } from '../../domain/types'
import type {
  ClassChoiceValue,
  ClassDefinition,
} from '../../domain/class/types'
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
  findSingleSelectChoiceForFeature,
  getChoicesNotLinkedToFeatures,
} from '../choices/linkFeatureToChoice'
import { ClassDeferredRequirementsPanel } from './ClassSelectionSummary'
import { ClassLevelAccordion } from './ClassLevelAccordion'
import { ClassMultiSelectChoiceField } from './ClassMultiSelectChoiceField'
import { getOverviewSetupChoices } from './classOverviewSetupChoices'
import { formatClassValidationIssue } from './formatClassValidation'
import type { ClassSelectionDraft } from './classSelectionDraft'

export type ClassProgressionSectionProps = {
  editionId: EditionId
  activeInstanceId: string | null
  activeDefinition: ClassDefinition
  activeClassId: string
  activeLevel: number
  activeChoices: Record<string, ClassChoiceValue>
  draft: ClassSelectionDraft | null
  onChoiceChange: (choiceId: string, value: ClassChoiceValue | undefined) => void
}

export function ClassProgressionSection({
  editionId,
  activeInstanceId,
  activeDefinition,
  activeClassId,
  activeLevel,
  activeChoices,
  draft,
  onChoiceChange,
}: ClassProgressionSectionProps) {
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

  const overviewSetupChoiceIds = useMemo(
    () =>
      new Set(
        getOverviewSetupChoices(activeDefinition, activeLevel).map(
          (choice) => choice.id,
        ),
      ),
    [activeDefinition, activeLevel],
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
  ).filter((choice) => !overviewSetupChoiceIds.has(choice.id))

  const progressionValidationIssues =
    draftValidation?.ok === false
      ? draftValidation.issues.filter(
          (issue) =>
            issue.choiceId === undefined ||
            !overviewSetupChoiceIds.has(issue.choiceId),
        )
      : []

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
    <section
      className="class-picker__progression-column"
      aria-labelledby="class-progression-heading"
    >
      <h3 id="class-progression-heading" className="class-picker__section-title">
        Class Progression
      </h3>

      <div className="class-picker__progression-content">
        {featureProgression.length > 0 ? (
          <div className="class-picker__features">
            {featureProgression.map((levelEntry) => (
              <ClassLevelAccordion key={levelEntry.level} level={levelEntry.level}>
                <div className="class-picker__feature-cards">
                  {levelEntry.features.map((feature) => {
                    const linkedChoice = findSingleSelectChoiceForFeature(
                      feature.id,
                      availableChoices,
                    )

                    if (linkedChoice !== null) {
                      const issue = choiceIssueById.get(linkedChoice.id)
                      const errorId =
                        issue === undefined
                          ? undefined
                          : `class-choice-error-${linkedChoice.id}`
                      const choiceValue = activeChoices[linkedChoice.id]
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
                            options={linkedChoice.options}
                            selectedOptionId={selectedOptionId}
                            name={`class-choice-${linkedChoice.id}`}
                            describedBy={errorId}
                            expanded={getFeatureChoiceExpanded(
                              choiceExpansionState,
                              activeInstanceId === null
                                ? linkedChoice.id
                                : createClassChoiceStateKey(
                                    activeInstanceId,
                                    linkedChoice.id,
                                  ),
                              hasSelection,
                            )}
                            onExpandedChange={(expanded) => {
                              setChoiceExpansionState((current) =>
                                setFeatureChoiceExpanded(
                                  current,
                                  activeInstanceId === null
                                    ? linkedChoice.id
                                    : createClassChoiceStateKey(
                                        activeInstanceId,
                                        linkedChoice.id,
                                      ),
                                  expanded,
                                ),
                              )
                            }}
                            onSelect={(optionId) => {
                              onChoiceChange(linkedChoice.id, optionId)
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
              </ClassLevelAccordion>
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

        {progressionValidationIssues.length > 0 ? (
          <div className="validation-message" role="alert">
            <p>Complete the class selection:</p>
            <ul>
              {progressionValidationIssues.map((issue) => (
                <li key={`${issue.code}-${issue.choiceId ?? 'general'}`}>
                  {formatClassValidationIssue(issue)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
