import type { AbilityId } from '../../domain/abilities/types'
import { computeAbilityScoreBonuses } from '../../domain/background/computeAbilityScoreBonuses'
import type {
  BackgroundDefinition,
  BackgroundSelection,
} from '../../domain/background/types'
import { SKILL_LABELS } from '../../domain/skills/types'
import { formatAbilityLabel } from '../class/formatClassDetails'
import { getBackgroundChoiceDefinition } from '../../rules/background/backgroundRules'

export function formatSkillProficiencyList(
  skillIds: BackgroundDefinition['skillProficiencies'],
): string {
  return skillIds.map((skillId) => SKILL_LABELS[skillId]).join(', ')
}

export function formatAbilityScoreOptions(
  abilityIds: AbilityId[],
): string {
  return abilityIds.map(formatAbilityLabel).join(', ')
}

export function formatAbilityScoreBonusSummary(
  definition: BackgroundDefinition,
  selection: BackgroundSelection,
): string {
  const entries = Object.entries(
    computeAbilityScoreBonuses(definition, selection.abilityScoreIncrease),
  )
    .filter(([, bonus]) => typeof bonus === 'number' && bonus > 0)
    .map(
      ([abilityId, bonus]) =>
        `${formatAbilityLabel(abilityId as AbilityId)} +${bonus}`,
    )

  return entries.length > 0 ? entries.join(', ') : 'Not configured'
}

export function formatToolProficiencySummary(
  definition: BackgroundDefinition,
  selection: BackgroundSelection | null,
): string {
  const tool = definition.toolProficiency

  if (tool.kind === 'fixed') {
    return tool.label
  }

  const selectedId = selection?.choices[tool.choiceId]

  if (selectedId === undefined) {
    return `${tool.prompt} (not chosen yet)`
  }

  const option = tool.options.find((entry) => entry.id === selectedId)

  return option?.label ?? selectedId
}

export function formatEquipmentSummary(
  definition: BackgroundDefinition,
  selection: BackgroundSelection | null,
): string {
  const selectedId = selection?.choices[definition.equipment.choiceId]

  if (selectedId === undefined) {
    return 'Not chosen yet'
  }

  if (selectedId === 'gold-alternative') {
    return definition.equipment.goldAlternative.label
  }

  const equipmentPackage = definition.equipment.packages.find(
    (entry) => entry.id === selectedId,
  )

  return equipmentPackage?.summary ?? equipmentPackage?.label ?? selectedId
}

export function formatBackgroundChoiceSummary(
  definition: BackgroundDefinition,
  selection: BackgroundSelection,
  choiceId: string,
): string | null {
  const choice = getBackgroundChoiceDefinition(definition, choiceId)

  if (choice === null) {
    return null
  }

  const selectedId = selection.choices[choiceId]

  if (selectedId === undefined) {
    return null
  }

  const option = choice.options.find((entry) => entry.id === selectedId)

  return option?.label ?? selectedId
}
