import type {
  ClassChoice,
  ClassChoiceValue,
  ClassDefinition,
  ClassFeature,
  ClassOptionFeature,
  DeferredCharacterRequirement,
} from '../../domain/class/types'
import {
  isAbilityScoreImprovementChoiceId,
  isCompleteAsiChoiceValue,
} from '../../domain/class/abilityScoreImprovement'
import {
  isCompleteEpicBoonChoiceValue,
  isEpicBoonChoiceId,
} from '../../domain/class/epicBoon'
import {
  isCompleteFightingStyleChoiceValue,
  isFightingStyleFeatGrantChoice,
} from '../../domain/class/fightingStyle'
import { getChoicesAvailableAtLevel } from '../../domain/class/choiceAvailability'
import { getClassFeatureProgressionUpToLevel } from '../../domain/class/featureProgression'
import { withLevelAdjustedChoiceLimits } from '../../domain/class/weaponMastery'
import {
  findMultiSelectChoiceForFeature,
  findSingleSelectChoiceForFeature,
  getChoicesNotLinkedToFeatures,
} from '../choices/linkFeatureToChoice'
import {
  getOverviewSetupChoices,
  isSkillProficiencyChoice,
} from './classOverviewSetupChoices'
import { formatClassChoiceSummary } from './formatClassChoiceSummary'
import {
  formatChoiceCountLabel,
  formatOrdinalLevel,
} from './formatClassFeatureMeta'
import {
  getSelectedSubclassOption,
  getSubclassFeaturesAtLevel,
  isSubclassPlaceholderFeature,
} from './subclassFeatures'

export type ClassFeatureCompletionState =
  | 'complete'
  | 'incomplete'
  | 'granted'
  | 'deferred'

export type ClassFeatureAccordionGrantedFeature = {
  name: string
  description: string
}

export type ClassFeatureAccordionItem = {
  id: string
  title: string
  description: string
  level: number
  levelLabel: string
  choiceCount: number | null
  choiceCountLabel: string | null
  /** When set, replaces choiceCountLabel in the accordion meta. */
  summaryLabel: string | null
  completion: ClassFeatureCompletionState
  completionLabel: string
  kind: 'setup-choice' | 'feature'
  singleSelectChoice: Extract<ClassChoice, { type: 'single-select' }> | null
  multiSelectChoice: Extract<ClassChoice, { type: 'multi-select' }> | null
  deferredRequirement: DeferredCharacterRequirement | null
  /** Subclass (or similar) features shown after a selection is made. */
  grantedFeatures: ClassFeatureAccordionGrantedFeature[]
}

function formatCompletionLabel(
  state: ClassFeatureCompletionState,
): string {
  switch (state) {
    case 'complete':
      return 'Complete'
    case 'incomplete':
      return 'Incomplete'
    case 'granted':
      return 'Granted'
    case 'deferred':
      return 'Later step'
  }
}

function isChoiceComplete(
  choice: ClassChoice,
  value: ClassChoiceValue | undefined,
): boolean {
  if (isAbilityScoreImprovementChoiceId(choice.id)) {
    return typeof value === 'string' && isCompleteAsiChoiceValue(value)
  }

  if (isEpicBoonChoiceId(choice.id)) {
    return typeof value === 'string' && isCompleteEpicBoonChoiceValue(value)
  }

  if (isFightingStyleFeatGrantChoice(choice)) {
    return isCompleteFightingStyleChoiceValue(choice, typeof value === 'string' ? value : undefined)
  }

  if (choice.type === 'single-select') {
    return typeof value === 'string' && value.length > 0
  }

  return (
    Array.isArray(value) &&
    value.length >= choice.min &&
    value.length <= choice.max
  )
}

function parseDeferredChoiceCount(
  requirement: DeferredCharacterRequirement,
): number | null {
  const match = requirement.description.match(/choose\s+(\d+)/i)

  if (match === null) {
    return null
  }

  const count = Number.parseInt(match[1]!, 10)
  return Number.isNaN(count) ? null : count
}

function findDeferredForFeature(
  definition: ClassDefinition,
  feature: ClassFeature,
  level: number,
): DeferredCharacterRequirement | null {
  const byId = definition.deferredRequirements.find(
    (requirement) => requirement.id === feature.id,
  )

  if (byId !== undefined) {
    return byId
  }

  const byLabel = definition.deferredRequirements.find(
    (requirement) =>
      requirement.level === level &&
      requirement.label.toLowerCase() === feature.name.toLowerCase(),
  )

  return byLabel ?? null
}

function getSetupChoiceTitle(
  definition: ClassDefinition,
  choice: Extract<ClassChoice, { type: 'multi-select' }>,
): string {
  if (isSkillProficiencyChoice(choice)) {
    return `Core ${definition.name} Traits`
  }

  return choice.prompt
}

function toGrantedFeatures(
  features: readonly ClassOptionFeature[],
): ClassFeatureAccordionGrantedFeature[] {
  return features.map((feature) => ({
    name: feature.name,
    description: feature.description,
  }))
}

function getFeatureTitle(
  feature: ClassFeature,
  resolvedSubclassFeatures: readonly ClassOptionFeature[],
  isSubclassChoiceFeature: boolean,
): string {
  // Keep subclass accordion titled as the feature name; selection goes in summary.
  if (isSubclassChoiceFeature) {
    return feature.name
  }

  if (resolvedSubclassFeatures.length === 1) {
    return resolvedSubclassFeatures[0]!.name
  }

  if (resolvedSubclassFeatures.length > 1) {
    return resolvedSubclassFeatures.map((entry) => entry.name).join(', ')
  }

  return feature.name
}

function getFeatureDescription(
  feature: ClassFeature,
  resolvedSubclassFeatures: readonly ClassOptionFeature[],
  grantedFeatures: readonly ClassFeatureAccordionGrantedFeature[],
  isSubclassChoiceFeature: boolean,
): string {
  if (grantedFeatures.length > 0) {
    return ''
  }

  if (!isSubclassChoiceFeature && resolvedSubclassFeatures.length === 1) {
    return resolvedSubclassFeatures[0]!.description
  }

  return feature.description
}

export function buildClassFeatureAccordionItems(
  definition: ClassDefinition,
  level: number,
  choices: Record<string, ClassChoiceValue>,
  featNameById?: ReadonlyMap<string, string>,
): ClassFeatureAccordionItem[] {
  const availableChoices = getChoicesAvailableAtLevel(
    definition,
    level,
    choices,
  ).map((choice) => withLevelAdjustedChoiceLimits(choice, level))
  const featureProgression = getClassFeatureProgressionUpToLevel(
    definition,
    level,
  )
  const featureIds = featureProgression.flatMap((entry) =>
    entry.features.map((feature) => feature.id),
  )
  const setupChoices = getOverviewSetupChoices(definition, level, choices).map(
    (choice) => withLevelAdjustedChoiceLimits(choice, level),
  ) as Extract<ClassChoice, { type: 'multi-select' }>[]
  const items: ClassFeatureAccordionItem[] = []

  const selectedSubclass = getSelectedSubclassOption(definition, choices)

  for (const choice of setupChoices) {
    const choiceValue = choices[choice.id]
    const complete = isChoiceComplete(choice, choiceValue)
    const completion: ClassFeatureCompletionState = complete
      ? 'complete'
      : 'incomplete'

    items.push({
      id: `setup-${choice.id}`,
      title: getSetupChoiceTitle(definition, choice),
      description: '',
      level: choice.level,
      levelLabel: formatOrdinalLevel(choice.level),
      choiceCount: choice.max,
      choiceCountLabel: formatChoiceCountLabel(choice.max),
      summaryLabel: formatClassChoiceSummary(choice, choiceValue, featNameById),
      completion,
      completionLabel: formatCompletionLabel(completion),
      kind: 'setup-choice',
      singleSelectChoice: null,
      multiSelectChoice: choice,
      deferredRequirement: null,
      grantedFeatures: [],
    })
  }

  for (const levelEntry of featureProgression) {
    for (const feature of levelEntry.features) {
      const subclassFeaturesAtLevel = isSubclassPlaceholderFeature(feature.id)
        ? getSubclassFeaturesAtLevel(selectedSubclass, levelEntry.level)
        : []

      let linkedSingleSelect = findSingleSelectChoiceForFeature(
        feature.id,
        availableChoices,
      )
      if (linkedSingleSelect === null) {
        for (const subclassFeature of subclassFeaturesAtLevel) {
          const match = availableChoices.find(
            (
              candidate,
            ): candidate is Extract<ClassChoice, { type: 'single-select' }> =>
              candidate.type === 'single-select' &&
              candidate.id === subclassFeature.id,
          )
          if (match !== undefined) {
            linkedSingleSelect = match
            break
          }
        }
      }

      const linkedMultiSelect = findMultiSelectChoiceForFeature(
        feature.id,
        availableChoices,
      )
      const deferredRequirement =
        linkedSingleSelect === null && linkedMultiSelect === null
          ? findDeferredForFeature(definition, feature, levelEntry.level)
          : null
      const linkedChoice = linkedSingleSelect ?? linkedMultiSelect
      const choiceValue =
        linkedChoice === null ? undefined : choices[linkedChoice.id]

      let choiceCount: number | null = null
      let completion: ClassFeatureCompletionState = 'granted'
      let summaryLabel: string | null = null

      if (linkedChoice !== null) {
        choiceCount =
          linkedChoice.type === 'multi-select' ? linkedChoice.max : 1
        completion = isChoiceComplete(linkedChoice, choiceValue)
          ? 'complete'
          : 'incomplete'
        summaryLabel = formatClassChoiceSummary(
          linkedChoice,
          choiceValue,
          featNameById,
        )
      } else if (deferredRequirement !== null) {
        choiceCount = parseDeferredChoiceCount(deferredRequirement)
        completion = 'deferred'
      }

      const isSubclassChoiceFeature =
        linkedSingleSelect !== null &&
        linkedSingleSelect.id.includes('subclass')

      const resolvedSubclassFeatures =
        isSubclassPlaceholderFeature(feature.id) ||
        (isSubclassChoiceFeature &&
          typeof choiceValue === 'string' &&
          choiceValue.length > 0)
          ? getSubclassFeaturesAtLevel(selectedSubclass, levelEntry.level)
          : []

      const grantedFeatures =
        (isSubclassChoiceFeature &&
          typeof choiceValue === 'string' &&
          choiceValue.length > 0) ||
        resolvedSubclassFeatures.length > 1
          ? toGrantedFeatures(resolvedSubclassFeatures)
          : []

      items.push({
        id: feature.id,
        title: getFeatureTitle(
          feature,
          resolvedSubclassFeatures,
          isSubclassChoiceFeature,
        ),
        description: getFeatureDescription(
          feature,
          resolvedSubclassFeatures,
          grantedFeatures,
          isSubclassChoiceFeature,
        ),
        level: levelEntry.level,
        levelLabel: formatOrdinalLevel(levelEntry.level),
        choiceCount,
        choiceCountLabel:
          choiceCount === null ? null : formatChoiceCountLabel(choiceCount),
        summaryLabel,
        completion,
        completionLabel: formatCompletionLabel(completion),
        kind: 'feature',
        singleSelectChoice: linkedSingleSelect,
        multiSelectChoice: linkedMultiSelect,
        deferredRequirement,
        grantedFeatures,
      })
    }
  }

  const remainingUnlinked = getChoicesNotLinkedToFeatures(
    availableChoices,
    featureIds,
  ).filter(
    (choice) =>
      choice.type === 'multi-select' &&
      !setupChoices.some((setup) => setup.id === choice.id),
  )

  for (const choice of remainingUnlinked) {
    if (choice.type !== 'multi-select') {
      continue
    }

    const choiceValue = choices[choice.id]
    const complete = isChoiceComplete(choice, choiceValue)
    const completion: ClassFeatureCompletionState = complete
      ? 'complete'
      : 'incomplete'

    items.push({
      id: `choice-${choice.id}`,
      title: choice.prompt,
      description: choice.prompt,
      level: choice.level,
      levelLabel: formatOrdinalLevel(choice.level),
      choiceCount: choice.max,
      choiceCountLabel: formatChoiceCountLabel(choice.max),
      summaryLabel: formatClassChoiceSummary(choice, choiceValue, featNameById),
      completion,
      completionLabel: formatCompletionLabel(completion),
      kind: 'setup-choice',
      singleSelectChoice: null,
      multiSelectChoice: choice,
      deferredRequirement: null,
      grantedFeatures: [],
    })
  }

  return items
}
