import { useEffect, useMemo, useState } from 'react'
import type { EditionId } from '../../domain/types'
import type {
  ClassChoiceValue,
  ClassDefinition,
} from '../../domain/class/types'
import {
  collectAsiFeatIds,
  isAbilityScoreImprovementChoiceId,
} from '../../domain/class/abilityScoreImprovement'
import { validateClassSelection } from '../../rules/class/classRules'
import { resolveDeferredRequirementsForInstances } from '../../rules/class/resolveCharacterDeferredRequirements'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import { SingleSelectChoiceOptions } from '../choices/SingleSelectChoiceOptions'
import { AsiChoiceField } from './AsiChoiceField'
import { buildClassFeatureAccordionItems } from './buildClassFeatureAccordionItems'
import { ClassFeatureAccordion } from './ClassFeatureAccordion'
import { ClassDeferredRequirementsPanel } from './ClassSelectionSummary'
import { ClassMultiSelectChoiceField } from './ClassMultiSelectChoiceField'
import { getOverviewSetupChoices } from './classOverviewSetupChoices'
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

export type ClassProgressionSectionProps = {
  editionId: EditionId
  activeInstanceId: string | null
  activeDefinition: ClassDefinition
  activeClassId: string
  activeLevel: number
  activeChoices: Record<string, ClassChoiceValue>
  draft: ClassSelectionDraft | null
  featCatalog: FeatCatalog
  characterFeatId?: string | null
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
  featCatalog,
  characterFeatId = null,
  onChoiceChange,
}: ClassProgressionSectionProps) {
  const [featNameById, setFeatNameById] = useState<Map<string, string>>(
    () => new Map(),
  )
  const [featById, setFeatById] = useState<Map<string, import('../../domain/feat/types').FeatDefinition>>(
    () => new Map(),
  )

  useEffect(() => {
    let active = true

    void featCatalog.listFeats(editionId).then((feats) => {
      if (!active) {
        return
      }

      setFeatNameById(new Map(feats.map((feat) => [feat.id, feat.name])))
      setFeatById(new Map(feats.map((feat) => [feat.id, feat])))
    })

    return () => {
      active = false
    }
  }, [editionId, featCatalog])

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
          {
            featById,
            characterFeatId,
          },
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

  const featureItems = buildClassFeatureAccordionItems(
    activeDefinition,
    activeLevel,
    activeChoices,
    featNameById,
  )

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
        Class Features
      </h3>

      <div className="class-picker__progression-content">
        {featureItems.length > 0 ? (
          <div className="class-picker__feature-accordions">
            {featureItems.map((item) => {
              const choiceId =
                item.singleSelectChoice?.id ?? item.multiSelectChoice?.id
              const issue =
                choiceId === undefined
                  ? undefined
                  : choiceIssueById.get(choiceId)
              const errorId =
                issue === undefined || choiceId === undefined
                  ? undefined
                  : `class-choice-error-${choiceId}`
              const metaParts = [
                item.summaryLabel ?? item.choiceCountLabel,
                item.levelLabel,
              ].filter((part): part is string => part !== null)
              const isAsiChoice =
                item.singleSelectChoice !== null &&
                isAbilityScoreImprovementChoiceId(item.singleSelectChoice.id)

              return (
                <ClassFeatureAccordion
                  key={item.id}
                  title={item.title}
                  metaParts={metaParts}
                  completion={item.completion}
                  completionLabel={item.completionLabel}
                  defaultExpanded={false}
                >
                  {item.description.trim().length > 0 && !isAsiChoice ? (
                    <p className="class-picker__feature-accordion-description">
                      {item.description}
                    </p>
                  ) : null}

                  {item.deferredRequirement !== null ? (
                    <p className="class-picker__feature-accordion-deferred">
                      {item.deferredRequirement.description}
                    </p>
                  ) : null}

                  {isAsiChoice && item.singleSelectChoice !== null ? (
                    <div className="class-picker__feature-accordion-choices">
                      <AsiChoiceField
                        choiceId={item.singleSelectChoice.id}
                        value={
                          typeof activeChoices[item.singleSelectChoice.id] ===
                          'string'
                            ? (activeChoices[item.singleSelectChoice.id] as string)
                            : undefined
                        }
                        editionId={editionId}
                        featCatalog={featCatalog}
                        takenFeatIds={[
                          ...collectAsiFeatIds(
                            activeChoices,
                            item.singleSelectChoice.id,
                          ),
                          ...(characterFeatId !== null ? [characterFeatId] : []),
                        ]}
                        errorId={errorId}
                        onChange={onChoiceChange}
                      />
                    </div>
                  ) : null}

                  {item.singleSelectChoice !== null && !isAsiChoice ? (
                    <div
                      className="class-picker__feature-accordion-choices"
                      role="radiogroup"
                      aria-label={item.singleSelectChoice.prompt}
                      aria-describedby={errorId}
                    >
                      <SingleSelectChoiceOptions
                        id={`class-feature-${item.singleSelectChoice.id}`}
                        options={item.singleSelectChoice.options}
                        selectedOptionId={
                          typeof activeChoices[item.singleSelectChoice.id] ===
                          'string'
                            ? (activeChoices[item.singleSelectChoice.id] as string)
                            : null
                        }
                        name={`class-choice-${item.singleSelectChoice.id}`}
                        layout={
                          item.singleSelectChoice.id === 'fighting-style'
                            ? 'grid-2'
                            : 'stack'
                        }
                        onSelect={(optionId) => {
                          onChoiceChange(item.singleSelectChoice!.id, optionId)
                        }}
                      />
                    </div>
                  ) : null}

                  {item.multiSelectChoice !== null ? (
                    <div className="class-picker__feature-accordion-choices">
                      <ClassMultiSelectChoiceField
                        choice={item.multiSelectChoice}
                        value={activeChoices[item.multiSelectChoice.id]}
                        errorId={errorId}
                        ariaLabel={item.multiSelectChoice.prompt}
                        excludedOptionIds={getExcludedMultiSelectOptionIds(
                          activeDefinition,
                          item.multiSelectChoice.id,
                          activeChoices,
                        )}
                        onChange={onChoiceChange}
                      />
                    </div>
                  ) : null}

                  {item.grantedFeatures.length > 0 ? (
                    <ul className="class-picker__feature-accordion-grants">
                      {item.grantedFeatures.map((grant) => (
                        <li
                          key={grant.name}
                          className="class-picker__feature-accordion-grant"
                        >
                          <span className="class-picker__feature-accordion-grant-name">
                            {grant.name}
                          </span>
                          <p className="class-picker__feature-accordion-grant-description">
                            {grant.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {issue !== undefined &&
                  errorId !== undefined &&
                  issue.code !== 'missing-required-choice' &&
                  issue.code !== 'invalid-multi-select-count' ? (
                    <p
                      id={errorId}
                      className="class-picker__choice-error"
                      role="alert"
                    >
                      {formatClassValidationIssue(issue)}
                    </p>
                  ) : null}
                </ClassFeatureAccordion>
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
