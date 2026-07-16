import type {
  ClassReviewDisplay,
  ReviewableStepId,
  SpeciesReviewDisplay,
} from '../../../reviewSummary'
import type { ResolvedDeferredCharacterRequirement } from '../../../../domain/types'
import type { ReviewSheetModels } from '../../../buildReviewSheetModels'
import type { StepStatus } from '../../types'

export type ReviewStatItem = {
  label: string
  value: string
}

export type ReviewFeatureEntry = {
  label: string
  description: string
}

export type ReviewFeatureItem = {
  label: string
  value: string
  description?: string
  entries?: ReviewFeatureEntry[]
}

export type ReviewSectionVisibility = {
  skills: boolean
  equipment: boolean
  features: boolean
  spells: boolean
  background: boolean
}

export type ReviewSheetContent = {
  headerStats: ReviewStatItem[]
  coreStats: ReviewStatItem[]
  skillsAndSaves: ReviewFeatureItem[]
  equipmentLines: string[]
  features: ReviewFeatureItem[]
  spellLines: string[]
  backgroundLines: string[]
  deferredRequirements: ResolvedDeferredCharacterRequirement[]
  incompleteSteps: ReviewableStepId[]
  sectionVisibility: ReviewSectionVisibility
}

const SKILL_PROMPT_PATTERN = /\bskill\b|\bsaving throw\b/i
const SUBCLASS_PROMPT_PATTERN = /\bsubclass\b/i

function parseLabeledLine(line: string): ReviewFeatureItem | null {
  const separatorIndex = line.indexOf(': ')
  if (separatorIndex === -1) {
    return null
  }

  return {
    label: line.slice(0, separatorIndex),
    value: line.slice(separatorIndex + 2),
  }
}

function isSubclassChoiceLine(choiceLine: {
  prompt: string
  entries?: ReviewFeatureEntry[]
}): boolean {
  return (
    SUBCLASS_PROMPT_PATTERN.test(choiceLine.prompt) &&
    (choiceLine.entries === undefined || choiceLine.entries.length === 0)
  )
}

function isMetaClassLine(line: string): boolean {
  return (
    line.startsWith('Class: ') ||
    line.startsWith('Level: ') ||
    line === 'Class selection complete' ||
    line === 'Not selected' ||
    line === 'Choice incomplete' ||
    line === 'Confirm your selection' ||
    line.startsWith('Remaining character decisions:')
  )
}

function isMetaSpeciesLine(line: string): boolean {
  return (
    line.startsWith('Species: ') ||
    line === 'Not selected' ||
    line === 'Choice incomplete' ||
    line === 'Confirm your selection'
  )
}

function isPlaceholderLine(line: string): boolean {
  return line.toLowerCase() === 'coming soon'
}

function hasMeaningfulLines(lines: string[]): boolean {
  return lines.some((line) => !isPlaceholderLine(line))
}

function buildSkillsAndFeatures(
  classDisplay: ClassReviewDisplay,
  classSummaryLines: string[],
): { skills: ReviewFeatureItem[]; features: ReviewFeatureItem[] } {
  const skills: ReviewFeatureItem[] = []
  const features: ReviewFeatureItem[] = []

  const choiceLines =
    classDisplay.choiceLines.length > 0
      ? classDisplay.choiceLines
      : classSummaryLines
          .filter((line) => !isMetaClassLine(line) && !line.startsWith('- '))
          .map((line) => parseLabeledLine(line))
          .filter((item): item is ReviewFeatureItem => item !== null)
          .map((item) => ({ prompt: item.label, summary: item.value }))

  for (const choiceLine of choiceLines) {
    if (isSubclassChoiceLine(choiceLine)) {
      continue
    }

    const item: ReviewFeatureItem = {
      label: choiceLine.heading ?? choiceLine.prompt,
      value: choiceLine.summary,
      description: choiceLine.description,
      entries: choiceLine.entries,
    }

    if (SKILL_PROMPT_PATTERN.test(choiceLine.prompt)) {
      skills.push(item)
    } else {
      features.push(item)
    }
  }

  return { skills, features }
}

function buildBackgroundLines(
  speciesDisplay: SpeciesReviewDisplay,
  speciesSummaryLines: string[],
  backgroundSummaryLines: string[],
): string[] {
  const lines: string[] = []

  if (speciesDisplay.ancestryLabel !== null) {
    lines.push(`Ancestry: ${speciesDisplay.ancestryLabel}`)
  }

  for (const line of speciesSummaryLines) {
    if (isMetaSpeciesLine(line)) {
      continue
    }

    if (line.startsWith('Ancestry: ')) {
      continue
    }

    lines.push(line)
  }

  lines.push(
    ...backgroundSummaryLines.filter(
      (line) => !isPlaceholderLine(line) && line !== 'Not selected',
    ),
  )

  return lines
}

export function organizeReviewSheet(input: {
  summaries: Record<ReviewableStepId, string[]>
  stepStatuses: Record<ReviewableStepId, StepStatus>
  speciesDisplay: SpeciesReviewDisplay
  classDisplay: ClassReviewDisplay
  sheetModels: Pick<
    ReviewSheetModels,
    | 'hitPointMaximumLabel'
    | 'initiativeLabel'
    | 'speedLabel'
    | 'proficiencyBonusLabel'
  >
  unresolvedDeferredRequirements: ResolvedDeferredCharacterRequirement[]
  hasSpellcastingCapability: boolean
  spellLines: string[]
}): ReviewSheetContent {
  const { skills, features } = buildSkillsAndFeatures(
    input.classDisplay,
    input.summaries.class,
  )

  const equipmentLines = input.summaries.equipment.filter(
    (line) => !isPlaceholderLine(line),
  )
  const backgroundLines = buildBackgroundLines(
    input.speciesDisplay,
    input.summaries.species,
    input.summaries.background,
  )
  const spellLines = input.spellLines.filter((line) => !isPlaceholderLine(line))

  const incompleteSteps = (Object.keys(input.stepStatuses) as ReviewableStepId[]).filter(
    (stepId) =>
      stepId !== 'basics' &&
      (input.stepStatuses[stepId].completion !== 'complete' ||
        input.stepStatuses[stepId].hasValidationErrors),
  )

  const sectionVisibility: ReviewSectionVisibility = {
    skills: skills.length > 0,
    equipment: equipmentLines.length > 0,
    features: features.length > 0,
    spells: input.hasSpellcastingCapability || spellLines.length > 0,
    background: hasMeaningfulLines(backgroundLines),
  }

  return {
    headerStats: [
      { label: 'Hit Points', value: input.sheetModels.hitPointMaximumLabel },
      { label: 'Armor Class', value: '—' },
      { label: 'Initiative', value: input.sheetModels.initiativeLabel },
    ],
    coreStats: [
      { label: 'Speed', value: input.sheetModels.speedLabel ?? '—' },
      { label: 'Proficiency', value: input.sheetModels.proficiencyBonusLabel },
    ],
    skillsAndSaves: skills,
    equipmentLines,
    features,
    spellLines,
    backgroundLines,
    deferredRequirements: input.unresolvedDeferredRequirements,
    incompleteSteps,
    sectionVisibility,
  }
}
