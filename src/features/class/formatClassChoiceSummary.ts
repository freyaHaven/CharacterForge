import type { ClassChoice, ClassChoiceValue } from '../../domain/class/types'
import {
  formatAsiChoiceSummary,
  isAbilityScoreImprovementChoiceId,
  isCompleteAsiChoiceValue,
  parseAsiChoice,
} from '../../domain/class/abilityScoreImprovement'
import {
  formatEpicBoonChoiceSummary,
  isCompleteEpicBoonChoiceValue,
  isEpicBoonChoiceId,
} from '../../domain/class/epicBoon'
import {
  formatFightingStyleChoiceSummary,
  isCompleteFightingStyleChoiceValue,
  isFightingStyleFeatGrantChoice,
} from '../../domain/class/fightingStyle'
import {
  ABILITY_ABBREVIATIONS,
  SKILL_ABILITY_MAP,
} from '../../domain/character/sheetMechanics'
import { isSkillId, SKILL_LABELS } from '../../domain/skills/types'
import { isWeaponId, WEAPON_LABELS } from '../../domain/weapons/types'
import { isWeaponMasteryChoiceId } from '../../domain/class/weaponMastery'
import { isSkillProficiencyChoice } from './classOverviewSetupChoices'

function formatSkillSummary(optionIds: readonly string[]): string {
  return optionIds
    .filter(isSkillId)
    .map((skillId) => {
      const ability = SKILL_ABILITY_MAP[skillId]
      return `${SKILL_LABELS[skillId]} (${ABILITY_ABBREVIATIONS[ability]})`
    })
    .join(', ')
}

function formatWeaponSummary(optionIds: readonly string[]): string {
  return optionIds
    .filter(isWeaponId)
    .map((weaponId) => WEAPON_LABELS[weaponId])
    .join(', ')
}

export function formatClassChoiceSummary(
  choice: ClassChoice,
  value: ClassChoiceValue | undefined,
  featNameById?: ReadonlyMap<string, string>,
): string | null {
  if (isAbilityScoreImprovementChoiceId(choice.id)) {
    if (typeof value !== 'string' || !isCompleteAsiChoiceValue(value)) {
      return null
    }

    return formatAsiChoiceSummary(value, featNameById)
  }

  if (isEpicBoonChoiceId(choice.id)) {
    if (typeof value !== 'string' || !isCompleteEpicBoonChoiceValue(value)) {
      return null
    }

    return formatEpicBoonChoiceSummary(value, featNameById)
  }

  if (isFightingStyleFeatGrantChoice(choice)) {
    if (
      typeof value !== 'string' ||
      !isCompleteFightingStyleChoiceValue(choice, value)
    ) {
      return null
    }

    const alternateLabelById = new Map(
      choice.options.map((option) => [option.id, option.label]),
    )
    return formatFightingStyleChoiceSummary(
      value,
      featNameById,
      alternateLabelById,
    )
  }

  if (choice.type === 'single-select') {
    if (typeof value !== 'string' || value.length === 0) {
      return null
    }

    return (
      choice.options.find((option) => option.id === value)?.label ?? value
    )
  }

  if (!Array.isArray(value) || value.length < choice.min) {
    return null
  }

  if (isSkillProficiencyChoice(choice)) {
    const summary = formatSkillSummary(value)
    return summary.length > 0 ? summary : null
  }

  if (isWeaponMasteryChoiceId(choice.id)) {
    const summary = formatWeaponSummary(value)
    return summary.length > 0 ? summary : null
  }

  const labels = value
    .map(
      (optionId) =>
        choice.options.find((option) => option.id === optionId)?.label,
    )
    .filter((label): label is string => label !== undefined)

  return labels.length > 0 ? labels.join(', ') : null
}

export function getAsiFeatIdFromChoiceValue(
  value: ClassChoiceValue | undefined,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const parsed = parseAsiChoice(value)
  return parsed?.kind === 'feat' ? parsed.featId : null
}
