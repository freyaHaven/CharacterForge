import type { ClassChoice, ClassDefinition } from '../../domain/class/types'
import { getChoicesAvailableAtLevel } from '../../domain/class/choiceAvailability'
import { getClassFeatureProgressionUpToLevel } from '../../domain/class/featureProgression'
import { withLevelAdjustedChoiceLimits } from '../../domain/class/weaponMastery'
import { getChoicesNotLinkedToFeatures } from '../choices/linkFeatureToChoice'

export function getOverviewSetupChoices(
  definition: ClassDefinition,
  level: number,
  selectedChoices: Record<string, string | string[]> = {},
): Extract<ClassChoice, { type: 'multi-select' }>[] {
  const availableChoices = getChoicesAvailableAtLevel(
    definition,
    level,
    selectedChoices,
  ).map((choice) => withLevelAdjustedChoiceLimits(choice, level))
  const featureIds = getClassFeatureProgressionUpToLevel(definition, level).flatMap(
    (entry) => entry.features.map((feature) => feature.id),
  )

  return getChoicesNotLinkedToFeatures(availableChoices, featureIds).filter(
    (choice): choice is Extract<ClassChoice, { type: 'multi-select' }> =>
      choice.type === 'multi-select',
  )
}

export function isSkillProficiencyChoice(
  choice: Extract<ClassChoice, { type: 'multi-select' }>,
): boolean {
  return choice.options.some((option) =>
    option.effects?.some(
      (effect) =>
        effect.kind === 'skill-proficiency' ||
        effect.kind === 'skill-expertise',
    ),
  )
}

export function formatOverviewSetupChoicePrompt(
  choice: Extract<ClassChoice, { type: 'multi-select' }>,
): string {
  return `Choose ${choice.max} from:`
}

export function getOverviewSetupChoiceHeading(
  choice: Extract<ClassChoice, { type: 'multi-select' }>,
): string {
  if (isSkillProficiencyChoice(choice)) {
    return 'Skill Proficiencies'
  }

  return choice.prompt
}
