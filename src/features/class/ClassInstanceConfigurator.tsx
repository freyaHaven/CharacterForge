import { useMemo, useState } from 'react'
import type { HitPointIncrease } from '../../domain/class/hitPointIncreases'
import type { AbilityScores, EditionId } from '../../domain/types'
import type {
  CharacterClassSelection,
  ClassChoiceValue,
  ClassDefinition,
  ClassSelection,
} from '../../domain/class/types'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import {
  collectAsiFeatIds,
  isAbilityScoreImprovementChoiceId,
} from '../../domain/class/abilityScoreImprovement'
import { isEpicBoonChoiceId } from '../../domain/class/epicBoon'
import { isFightingStyleFeatGrantChoice } from '../../domain/class/fightingStyle'
import { isCatalogueFeatGrantChoice } from '../../domain/class/catalogueFeatGrant'
import {
  createFeatGrantChoiceStorageKey,
  readFeatGrantChoices,
} from '../../domain/feat/featGrantChoiceStorage'
import { collectClassFeatGrantIds } from '../../rules/character/resolveCharacterFeatGrants'
import {
  characterHasFightingStyle,
  characterHasSpellcasting,
} from '../../rules/character/buildFeatEligibilityContext'
import {
  buildCharacterCapabilityInventory,
  buildSpellListAccessTokensFromClasses,
} from '../../rules/capability/buildCharacterCapabilityInventory'
import type { FeatEligibilityContext } from '../../domain/feat/eligibility'
import { getIneligibleClassChoiceOptionIds } from '../../domain/class/classOptionPrerequisites'
import { getChoicesAvailableAtLevel } from '../../domain/class/choiceAvailability'
import { getClassFeatureProgressionUpToLevel } from '../../domain/class/featureProgression'
import { validateClassSelection } from '../../rules/class/classRules'
import { classInstanceToSelection } from '../../domain/character/characterClassSelection'
import { resolveClassEffects } from '../../rules/class/resolveClassEffects'
import { isSkillId } from '../../domain/skills/types'
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
import { FeatGrantChoiceField } from './FeatGrantChoiceField'
import { ClassMultiSelectChoiceField } from './ClassMultiSelectChoiceField'
import { HitPointIncreasePanel } from './HitPointIncreasePanel'
import { LevelStepper } from './LevelStepper'
import { formatClassValidationIssue } from './formatClassValidation'
import type { ClassSelectionDraft } from './classSelectionDraft'
import {
  choiceGrantsSkillExpertise,
  choiceGrantsSkillProficiency,
  collectSkillProficiencySelections,
  getExcludedExpertiseOptionIds,
} from '../../domain/class/skillProficiencySelections'
import { getExcludedSharedPoolOptionIds } from '../../domain/class/sharedMultiSelectExclusions'
import {
  collectWeaponMasterySelections,
  isWeaponMasteryChoiceId,
} from '../../domain/class/weaponMastery'

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

  return getExcludedSharedPoolOptionIds(definition, choiceId, choices)
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
  isStartingClass: boolean
  hitPointIncreases?: readonly HitPointIncrease[]
  featCatalog: FeatCatalog
  characterFeatId?: string | null
  abilityScores?: AbilityScores
  characterLevel?: number
  eligibilityClasses?: readonly CharacterClassSelection[]
  classDefinitionsById?: ReadonlyMap<string, ClassDefinition>
  /**
   * Character-wide proficient skill ids (background, species, feats, all classes).
   * When set, Expertise options use this set for eligibility.
   */
  ownedProficientSkillIds?: ReadonlySet<string> | readonly string[]
  levelLabel?: string
  showRemoveButton?: boolean
  onLevelChange: (level: number) => void
  onChoiceChange: (choiceId: string, value: ClassChoiceValue | undefined) => void
  onHitPointIncreaseChange: (
    classLevel: number,
    patch: Partial<Pick<HitPointIncrease, 'method' | 'rolledValue'>>,
  ) => void
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
  isStartingClass,
  hitPointIncreases,
  featCatalog,
  characterFeatId = null,
  abilityScores = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  characterLevel = 20,
  eligibilityClasses,
  classDefinitionsById,
  ownedProficientSkillIds,
  levelLabel = 'Levels in this class',
  showRemoveButton = false,
  onLevelChange,
  onChoiceChange,
  onHitPointIncreaseChange,
  onRemove,
}: ClassInstanceConfiguratorProps) {
  const [choiceExpansionState, setChoiceExpansionState] =
    useState<FeatureChoiceExpansionState>({})

  const definitionsMap = useMemo(() => {
    if (classDefinitionsById !== undefined) {
      return classDefinitionsById
    }
    return new Map([[activeDefinition.id, activeDefinition]])
  }, [activeDefinition, classDefinitionsById])

  const classesForEligibility = useMemo(() => {
    if (eligibilityClasses !== undefined) {
      return eligibilityClasses
    }
    if (activeInstanceId === null) {
      return []
    }
    return [
      {
        instanceId: activeInstanceId,
        classId: activeClassId,
        level: activeLevel,
        choices: activeChoices,
      },
    ]
  }, [
    activeChoices,
    activeClassId,
    activeInstanceId,
    activeLevel,
    eligibilityClasses,
  ])

  const eligibilityContext: FeatEligibilityContext = useMemo(
    () => ({
      characterLevel,
      abilityScores,
      hasSpellcasting: characterHasSpellcasting(
        classesForEligibility,
        definitionsMap,
      ),
      hasFightingStyle: characterHasFightingStyle(
        classesForEligibility,
        definitionsMap,
      ),
      takenFeatIds: [],
    }),
    [abilityScores, characterLevel, classesForEligibility, definitionsMap],
  )

  const capabilityInventory = useMemo(
    () =>
      buildCharacterCapabilityInventory({
        extraTokens: buildSpellListAccessTokensFromClasses(
          classesForEligibility,
          definitionsMap,
        ),
      }),
    [classesForEligibility, definitionsMap],
  )

  const crossInstanceTakenFeatIds = useMemo(() => {
    const ids: string[] = []
    for (const instance of classesForEligibility) {
      if (instance.instanceId === activeInstanceId) {
        continue
      }
      ids.push(...collectClassFeatGrantIds(instance.choices))
    }
    if (characterFeatId !== null) {
      ids.push(characterFeatId)
    }
    return ids
  }, [activeInstanceId, characterFeatId, classesForEligibility])

  const ownedSkillIds = useMemo(() => {
    const skills = new Set<string>()
    for (const instance of classesForEligibility) {
      const definition = definitionsMap.get(instance.classId)
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
  }, [classesForEligibility, definitionsMap])

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
        )

  const choiceIssueById = useMemo(() => {
    const issues = draftValidation?.ok === false ? draftValidation.issues : []

    return new Map(
      issues
        .filter((issue) => issue.choiceId !== undefined)
        .map((issue) => [issue.choiceId as string, issue]),
    )
  }, [draftValidation])

  const availableChoices = getChoicesAvailableAtLevel(
    activeDefinition,
    activeLevel,
    activeChoices,
  )

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

          <HitPointIncreasePanel
            hitDie={activeDefinition.hitDie}
            level={activeLevel}
            isStartingClass={isStartingClass}
            increases={hitPointIncreases ?? draft?.hitPointIncreases}
            onChange={onHitPointIncreaseChange}
          />

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
                                  ...collectClassFeatGrantIds(
                                    activeChoices,
                                    linkedSingleSelect.id,
                                  ),
                                  ...crossInstanceTakenFeatIds,
                                ]}
                                eligibilityContext={eligibilityContext}
                                capabilityInventory={capabilityInventory}
                                featChoices={readFeatGrantChoices(
                                  activeChoices,
                                  linkedSingleSelect.id,
                                )}
                                ownedSkillIds={ownedSkillIds}
                                ownedToolIds={ownedToolIds}
                                errorId={errorId}
                                onChange={onChoiceChange}
                                onFeatChoiceChange={(featChoiceId, value) => {
                                  handleFeatSubChoiceChange(
                                    linkedSingleSelect.id,
                                    featChoiceId,
                                    value,
                                  )
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

                        if (isEpicBoonChoiceId(linkedSingleSelect.id)) {
                          return (
                            <div
                              key={feature.id}
                              className="class-picker__choice"
                            >
                              <h6>{feature.name}</h6>
                              <p className="class-picker__feature-accordion-description">
                                {feature.description}
                              </p>
                              <FeatGrantChoiceField
                                choiceId={linkedSingleSelect.id}
                                value={
                                  typeof choiceValue === 'string'
                                    ? choiceValue
                                    : undefined
                                }
                                editionId={editionId}
                                featCatalog={featCatalog}
                                takenFeatIds={[
                                  ...collectClassFeatGrantIds(
                                    activeChoices,
                                    linkedSingleSelect.id,
                                  ),
                                  ...crossInstanceTakenFeatIds,
                                ]}
                                eligibilityContext={eligibilityContext}
                                capabilityInventory={capabilityInventory}
                                recommendedFeatId={
                                  linkedSingleSelect.recommendedFeatId ?? null
                                }
                                featChoices={readFeatGrantChoices(
                                  activeChoices,
                                  linkedSingleSelect.id,
                                )}
                                ownedSkillIds={ownedSkillIds}
                                ownedToolIds={ownedToolIds}
                                errorId={errorId}
                                onChange={onChoiceChange}
                                onFeatChoiceChange={(featChoiceId, value) => {
                                  handleFeatSubChoiceChange(
                                    linkedSingleSelect.id,
                                    featChoiceId,
                                    value,
                                  )
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

                        if (isFightingStyleFeatGrantChoice(linkedSingleSelect)) {
                          return (
                            <div
                              key={feature.id}
                              className="class-picker__choice"
                            >
                              <h6>{feature.name}</h6>
                              <p className="class-picker__feature-accordion-description">
                                {feature.description}
                              </p>
                              <FeatGrantChoiceField
                                choiceId={linkedSingleSelect.id}
                                value={
                                  typeof choiceValue === 'string'
                                    ? choiceValue
                                    : undefined
                                }
                                editionId={editionId}
                                featCatalog={featCatalog}
                                takenFeatIds={[
                                  ...collectClassFeatGrantIds(
                                    activeChoices,
                                    linkedSingleSelect.id,
                                  ),
                                  ...crossInstanceTakenFeatIds,
                                ]}
                                eligibilityContext={eligibilityContext}
                                capabilityInventory={capabilityInventory}
                                recommendedFeatId={
                                  linkedSingleSelect.recommendedFeatId ?? null
                                }
                                categoryFilter="fighting-style"
                                alternateOptions={linkedSingleSelect.options}
                                featChoices={readFeatGrantChoices(
                                  activeChoices,
                                  linkedSingleSelect.id,
                                )}
                                ownedSkillIds={ownedSkillIds}
                                ownedToolIds={ownedToolIds}
                                errorId={errorId}
                                onChange={onChoiceChange}
                                onFeatChoiceChange={(featChoiceId, value) => {
                                  handleFeatSubChoiceChange(
                                    linkedSingleSelect.id,
                                    featChoiceId,
                                    value,
                                  )
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

                        if (isCatalogueFeatGrantChoice(linkedSingleSelect)) {
                          return (
                            <div
                              key={feature.id}
                              className="class-picker__choice"
                            >
                              <h6>{feature.name}</h6>
                              <p className="class-picker__feature-accordion-description">
                                {feature.description}
                              </p>
                              <FeatGrantChoiceField
                                choiceId={linkedSingleSelect.id}
                                value={
                                  typeof choiceValue === 'string'
                                    ? choiceValue
                                    : undefined
                                }
                                editionId={editionId}
                                featCatalog={featCatalog}
                                takenFeatIds={[
                                  ...collectClassFeatGrantIds(
                                    activeChoices,
                                    linkedSingleSelect.id,
                                  ),
                                  ...crossInstanceTakenFeatIds,
                                ]}
                                eligibilityContext={eligibilityContext}
                                capabilityInventory={capabilityInventory}
                                recommendedFeatId={
                                  linkedSingleSelect.recommendedFeatId ?? null
                                }
                                categoryFilter={
                                  linkedSingleSelect.featGrantCategory
                                }
                                featChoices={readFeatGrantChoices(
                                  activeChoices,
                                  linkedSingleSelect.id,
                                )}
                                ownedSkillIds={ownedSkillIds}
                                ownedToolIds={ownedToolIds}
                                errorId={errorId}
                                onChange={onChoiceChange}
                                onFeatChoiceChange={(featChoiceId, value) => {
                                  handleFeatSubChoiceChange(
                                    linkedSingleSelect.id,
                                    featChoiceId,
                                    value,
                                  )
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
                                ownedProficientSkillIds,
                              )}
                              ineligibleOptionIds={new Map(
                                getIneligibleClassChoiceOptionIds(
                                  linkedMultiSelect,
                                  {
                                    sourceLevel: activeLevel,
                                    selectedChoices: activeChoices,
                                  },
                                ).map((entry) => [
                                  entry.optionId,
                                  entry.reason,
                                ]),
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
                        ownedProficientSkillIds,
                      )}
                      ineligibleOptionIds={new Map(
                        getIneligibleClassChoiceOptionIds(choice, {
                          sourceLevel: activeLevel,
                          selectedChoices: activeChoices,
                        }).map((entry) => [entry.optionId, entry.reason]),
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
