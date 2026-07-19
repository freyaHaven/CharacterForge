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
  _selection?: BackgroundSelection | null,
): string {
  const entitlement = definition.equipment.entitlements.find(
    (entry) => entry.type === 'choose-option',
  )

  if (entitlement === undefined || entitlement.type !== 'choose-option') {
    return 'Standard equipment package'
  }

  const packageOption = entitlement.options.find(
    (option) => option.kind === 'items',
  )

  if (packageOption === undefined || packageOption.kind !== 'items') {
    return entitlement.label
  }

  const itemCount = packageOption.items.filter(
    (grant) => grant.itemId !== 'srd-2024:gold-pieces',
  ).length
  const goldGrant = packageOption.items.find(
    (grant) => grant.itemId === 'srd-2024:gold-pieces',
  )

  const parts = [`${itemCount} item${itemCount === 1 ? '' : 's'}`]
  if (goldGrant !== undefined) {
    parts.push(`${goldGrant.quantity} GP`)
  }

  return `${packageOption.label}: ${parts.join(', ')}`
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
