import { useEffect, useMemo, useState } from 'react'
import type { AbilityScores, EditionId } from '../../domain/types'
import type {
  CharacterClassSelection,
  ClassChoiceValue,
  ClassDefinition,
} from '../../domain/class/types'
import {
  collectAsiFeatIds,
  isAbilityScoreImprovementChoiceId,
} from '../../domain/class/abilityScoreImprovement'
import { isEpicBoonChoiceId } from '../../domain/class/epicBoon'
import { isFightingStyleFeatGrantChoice } from '../../domain/class/fightingStyle'
import {
  createFeatGrantChoiceStorageKey,
  readFeatGrantChoices,
} from '../../domain/feat/featGrantChoiceStorage'
import { collectClassFeatGrantIds } from '../../rules/character/resolveCharacterFeatGrants'
import {
  characterHasFightingStyle,
  characterHasSpellcasting,
} from '../../rules/character/buildFeatEligibilityContext'
import type { FeatEligibilityContext } from '../../domain/feat/eligibility'
import { validateClassSelection } from '../../rules/class/classRules'
import { resolveDeferredRequirementsForInstances } from '../../rules/class/resolveCharacterDeferredRequirements'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import { SingleSelectChoiceOptions } from '../choices/SingleSelectChoiceOptions'
import { AsiChoiceField } from './AsiChoiceField'
import { FeatGrantChoiceField } from './FeatGrantChoiceField'
import { buildClassFeatureAccordionItems } from './buildClassFeatureAccordionItems'
import { ClassFeatureAccordion } from './ClassFeatureAccordion'
import { ClassDeferredRequirementsPanel } from './ClassSelectionSummary'
import { ClassMultiSelectChoiceField } from './ClassMultiSelectChoiceField'
import { getOverviewSetupChoices } from './classOverviewSetupChoices'
import { formatClassValidationIssue } from './formatClassValidation'
import type { HitPointIncrease } from '../../domain/class/hitPointIncreases'
import type { ClassSelectionDraft } from './classSelectionDraft'
import { HitPointIncreasePanel } from './HitPointIncreasePanel'
import {
  choiceGrantsSkillExpertise,
  choiceGrantsSkillProficiency,
  collectSkillProficiencySelections,
  getExcludedExpertiseOptionIds,
} from '../../domain/class/skillProficiencySelections'
import {
  collectWeaponMasterySelections,
  isWeaponMasteryChoiceId,
} from '../../domain/class/weaponMastery'
import { classInstanceToSelection } from '../../domain/character/characterClassSelection'
import { resolveClassEffects } from '../../rules/class/resolveClassEffects'
import { isSkillId } from '../../domain/skills/types'

function getExcludedMultiSelectOptionIds(
  definition: ClassDefinition,
  choiceId: string,
  choices: Record<string, ClassChoiceValue>,
  ownedProficientSkillIds?: ReadonlySet<string> | readonly string[],
): string[] {
  if (isWeaponMasteryChoiceId(choiceId)) {
    return collectWeaponMasterySelections(choices, choiceId)
  }

  const choice = definition.choices.find((entry) => entry.id === choiceId)
  if (choice === undefined) {
    return []
  }

  if (choiceGrantsSkillExpertise(choice)) {
    return getExcludedExpertiseOptionIds(
      definition,
      choiceId,
      choices,
      ownedProficientSkillIds,
    )
  }

  if (choiceGrantsSkillProficiency(choice)) {
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
  isStartingClass: boolean
  hitPointIncreases?: readonly HitPointIncrease[]
  featCatalog: FeatCatalog
  characterFeatId?: string | null
  abilityScores: AbilityScores
  characterLevel: number
  /** Effective class instances for eligibility (committed + draft overlay). */
  eligibilityClasses: readonly CharacterClassSelection[]
  classDefinitionsById: ReadonlyMap<string, ClassDefinition>
  ownedProficientSkillIds?: ReadonlySet<string> | readonly string[]
  onChoiceChange: (choiceId: string, value: ClassChoiceValue | undefined) => void
  onHitPointIncreaseChange: (
    classLevel: number,
    patch: Partial<Pick<HitPointIncrease, 'method' | 'rolledValue'>>,
  ) => void
}

export function ClassProgressionSection({
  editionId,
  activeInstanceId,
  activeDefinition,
  activeClassId,
  activeLevel,
  activeChoices,
  draft,
  isStartingClass,
  hitPointIncreases,
  featCatalog,
  characterFeatId = null,
  abilityScores,
  characterLevel,
  eligibilityClasses,
  classDefinitionsById,
  ownedProficientSkillIds,
  onChoiceChange,
  onHitPointIncreaseChange,
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

  const eligibilityContext: FeatEligibilityContext = useMemo(
    () => ({
      characterLevel,
      abilityScores,
      hasSpellcasting: characterHasSpellcasting(
        eligibilityClasses,
        classDefinitionsById,
      ),
      hasFightingStyle: characterHasFightingStyle(
        eligibilityClasses,
        classDefinitionsById,
      ),
      takenFeatIds: [],
    }),
    [
      abilityScores,
      characterLevel,
      classDefinitionsById,
      eligibilityClasses,
    ],
  )

  const crossInstanceTakenFeatIds = useMemo(() => {
    const ids: string[] = []
    for (const instance of eligibilityClasses) {
      if (instance.instanceId === activeInstanceId) {
        continue
      }
      ids.push(...collectClassFeatGrantIds(instance.choices))
    }
    if (characterFeatId !== null) {
      ids.push(characterFeatId)
    }
    return ids
  }, [activeInstanceId, characterFeatId, eligibilityClasses])

  const ownedSkillIds = useMemo(() => {
    const skills = new Set<string>()
    for (const instance of eligibilityClasses) {
      const definition = classDefinitionsById.get(instance.classId)
      if (definition === undefined) {
        continue
      }
      for (const effect of resolveClassEffects(
        definition,
        classInstanceToSelection(instance),
      )) {
        if (effect.kind === 'skill-proficiency' && isSkillId(effect.skillId)) {
          skills.add(effect.skillId)
        }
      }
    }
    return skills
  }, [classDefinitionsById, eligibilityClasses])

  const ownedToolIds = useMemo(() => new Set<string>(), [])

  function handleFeatSubChoiceChange(
    grantSlotId: string,
    featChoiceId: string,
    value: string | string[] | undefined,
  ) {
    onChoiceChange(
      createFeatGrantChoiceStorageKey(grantSlotId, featChoiceId),
      value,
    )
  }
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
            takenFeatIds: crossInstanceTakenFeatIds,
            eligibilityContext,
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
        <HitPointIncreasePanel
          hitDie={activeDefinition.hitDie}
          level={activeLevel}
          isStartingClass={isStartingClass}
          increases={hitPointIncreases ?? draft?.hitPointIncreases}
          onChange={onHitPointIncreaseChange}
        />

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
              const isEpicBoonChoice =
                item.singleSelectChoice !== null &&
                isEpicBoonChoiceId(item.singleSelectChoice.id)
              const isFightingStyleChoice =
                item.singleSelectChoice !== null &&
                isFightingStyleFeatGrantChoice(item.singleSelectChoice)

              return (
                <ClassFeatureAccordion
                  key={item.id}
                  title={item.title}
                  metaParts={metaParts}
                  completion={item.completion}
                  completionLabel={item.completionLabel}
                  defaultExpanded={false}
                >
                  {item.description.trim().length > 0 &&
                  !isAsiChoice &&
                  !isEpicBoonChoice &&
                  !isFightingStyleChoice ? (
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
                          ...collectClassFeatGrantIds(
                            activeChoices,
                            item.singleSelectChoice.id,
                          ),
                          ...crossInstanceTakenFeatIds,
                        ]}
                        featChoices={readFeatGrantChoices(
                          activeChoices,
                          item.singleSelectChoice.id,
                        )}
                        ownedSkillIds={ownedSkillIds}
                        ownedToolIds={ownedToolIds}
                        errorId={errorId}
                        onChange={onChoiceChange}
                        onFeatChoiceChange={(featChoiceId, value) => {
                          handleFeatSubChoiceChange(
                            item.singleSelectChoice!.id,
                            featChoiceId,
                            value,
                          )
                        }}
                      />
                    </div>
                  ) : null}

                  {isEpicBoonChoice && item.singleSelectChoice !== null ? (
                    <div className="class-picker__feature-accordion-choices">
                      {item.description.trim().length > 0 ? (
                        <p className="class-picker__feature-accordion-description">
                          {item.description}
                        </p>
                      ) : null}
                      <FeatGrantChoiceField
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
                          ...collectClassFeatGrantIds(
                            activeChoices,
                            item.singleSelectChoice.id,
                          ),
                          ...crossInstanceTakenFeatIds,
                        ]}
                        eligibilityContext={eligibilityContext}
                        recommendedFeatId={
                          item.singleSelectChoice.recommendedFeatId ?? null
                        }
                        featChoices={readFeatGrantChoices(
                          activeChoices,
                          item.singleSelectChoice.id,
                        )}
                        ownedSkillIds={ownedSkillIds}
                        ownedToolIds={ownedToolIds}
                        errorId={errorId}
                        onChange={onChoiceChange}
                        onFeatChoiceChange={(featChoiceId, value) => {
                          handleFeatSubChoiceChange(
                            item.singleSelectChoice!.id,
                            featChoiceId,
                            value,
                          )
                        }}
                      />
                    </div>
                  ) : null}

                  {isFightingStyleChoice && item.singleSelectChoice !== null ? (
                    <div className="class-picker__feature-accordion-choices">
                      {item.description.trim().length > 0 ? (
                        <p className="class-picker__feature-accordion-description">
                          {item.description}
                        </p>
                      ) : null}
                      <FeatGrantChoiceField
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
                          ...collectClassFeatGrantIds(
                            activeChoices,
                            item.singleSelectChoice.id,
                          ),
                          ...crossInstanceTakenFeatIds,
                        ]}
                        eligibilityContext={eligibilityContext}
                        recommendedFeatId={
                          item.singleSelectChoice.recommendedFeatId ?? null
                        }
                        categoryFilter="fighting-style"
                        alternateOptions={item.singleSelectChoice.options}
                        featChoices={readFeatGrantChoices(
                          activeChoices,
                          item.singleSelectChoice.id,
                        )}
                        ownedSkillIds={ownedSkillIds}
                        ownedToolIds={ownedToolIds}
                        errorId={errorId}
                        onChange={onChoiceChange}
                        onFeatChoiceChange={(featChoiceId, value) => {
                          handleFeatSubChoiceChange(
                            item.singleSelectChoice!.id,
                            featChoiceId,
                            value,
                          )
                        }}
                      />
                    </div>
                  ) : null}

                  {item.singleSelectChoice !== null &&
                  !isAsiChoice &&
                  !isEpicBoonChoice &&
                  !isFightingStyleChoice ? (
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
                          ownedProficientSkillIds,
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
