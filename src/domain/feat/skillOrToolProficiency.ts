import { SKILL_IDS, SKILL_LABELS, isSkillId, type SkillId } from '../skills/types'
import {
  ARTISAN_TOOL_IDS,
  ARTISAN_TOOL_LABELS,
  GAMING_SET_IDS,
  GAMING_SET_LABELS,
  MUSICAL_INSTRUMENT_IDS,
  MUSICAL_INSTRUMENT_LABELS,
} from '../tools/types'

export const SKILL_PROFICIENCY_OPTION_PREFIX = 'skill:' as const
export const TOOL_PROFICIENCY_OPTION_PREFIX = 'tool:' as const

/** Extra tools commonly granted as proficiencies (not artisan/instrument/gaming). */
export const OTHER_TOOL_PROFICIENCY_IDS = [
  'thieves-tools',
  'navigators-tools',
  'herbalism-kit',
  'disguise-kit',
  'forgery-kit',
  'poisoners-kit',
] as const

export type OtherToolProficiencyId = (typeof OTHER_TOOL_PROFICIENCY_IDS)[number]

export const OTHER_TOOL_PROFICIENCY_LABELS: Record<
  OtherToolProficiencyId,
  string
> = {
  'thieves-tools': "Thieves' Tools",
  'navigators-tools': "Navigator's Tools",
  'herbalism-kit': 'Herbalism Kit',
  'disguise-kit': 'Disguise Kit',
  'forgery-kit': 'Forgery Kit',
  'poisoners-kit': "Poisoner's Kit",
}

export type SkillOrToolProficiencyOption = {
  id: string
  label: string
  kind: 'skill' | 'tool'
  /** Bare skill id or tool id without prefix. */
  targetId: string
}

export function encodeSkillProficiencyOptionId(skillId: SkillId): string {
  return `${SKILL_PROFICIENCY_OPTION_PREFIX}${skillId}`
}

export function encodeToolProficiencyOptionId(toolId: string): string {
  return `${TOOL_PROFICIENCY_OPTION_PREFIX}${toolId}`
}

export function parseSkillOrToolProficiencyOptionId(
  optionId: string,
): { kind: 'skill'; skillId: SkillId } | { kind: 'tool'; toolId: string } | null {
  if (optionId.startsWith(SKILL_PROFICIENCY_OPTION_PREFIX)) {
    const skillId = optionId.slice(SKILL_PROFICIENCY_OPTION_PREFIX.length)
    if (!isSkillId(skillId)) {
      return null
    }
    return { kind: 'skill', skillId }
  }

  if (optionId.startsWith(TOOL_PROFICIENCY_OPTION_PREFIX)) {
    const toolId = optionId.slice(TOOL_PROFICIENCY_OPTION_PREFIX.length)
    if (toolId.length === 0) {
      return null
    }
    return { kind: 'tool', toolId }
  }

  return null
}

export function createSkillOrToolProficiencyOptions(): SkillOrToolProficiencyOption[] {
  const skills: SkillOrToolProficiencyOption[] = SKILL_IDS.map((skillId) => ({
    id: encodeSkillProficiencyOptionId(skillId),
    label: SKILL_LABELS[skillId],
    kind: 'skill',
    targetId: skillId,
  }))

  const tools: SkillOrToolProficiencyOption[] = [
    ...ARTISAN_TOOL_IDS.map((toolId) => ({
      id: encodeToolProficiencyOptionId(toolId),
      label: ARTISAN_TOOL_LABELS[toolId],
      kind: 'tool' as const,
      targetId: toolId,
    })),
    ...MUSICAL_INSTRUMENT_IDS.map((toolId) => ({
      id: encodeToolProficiencyOptionId(toolId),
      label: MUSICAL_INSTRUMENT_LABELS[toolId],
      kind: 'tool' as const,
      targetId: toolId,
    })),
    ...GAMING_SET_IDS.map((toolId) => ({
      id: encodeToolProficiencyOptionId(toolId),
      label: GAMING_SET_LABELS[toolId],
      kind: 'tool' as const,
      targetId: toolId,
    })),
    ...OTHER_TOOL_PROFICIENCY_IDS.map((toolId) => ({
      id: encodeToolProficiencyOptionId(toolId),
      label: OTHER_TOOL_PROFICIENCY_LABELS[toolId],
      kind: 'tool' as const,
      targetId: toolId,
    })),
  ]

  return [...skills, ...tools]
}

const OPTION_CATALOGUE = createSkillOrToolProficiencyOptions()
const OPTION_BY_ID = new Map(
  OPTION_CATALOGUE.map((option) => [option.id, option]),
)

export function getSkillOrToolProficiencyOption(
  optionId: string,
): SkillOrToolProficiencyOption | undefined {
  return OPTION_BY_ID.get(optionId)
}

export function listSkillOrToolProficiencyOptions(): readonly SkillOrToolProficiencyOption[] {
  return OPTION_CATALOGUE
}

export function formatSkillOrToolProficiencyOptionLabel(
  optionId: string,
): string {
  return OPTION_BY_ID.get(optionId)?.label ?? optionId
}
