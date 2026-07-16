import type { AbilityId } from '../../domain/abilities/types'
import type { CharacterLevel } from '../../domain/class/types'
import {
  formatAbilityLabel,
  formatAbilityList,
} from '../class/formatClassDetails'
import type { WizardStepId } from '../../app/wizard/types'

export type CharacterContextClassEntry = {
  classId: string
  className: string
  level: number
  subclassLabel: string | null
}

export type CharacterContextDisplay = {
  speciesId: string | null
  identityLine: string | null
  buildLine: string | null
  characterLevelLine: string | null
  guidanceLine: string | null
  classEntries: CharacterContextClassEntry[]
}

export type CharacterContextDisplayInput = {
  characterName: string
  speciesId: string | null
  speciesName: string | null
  targetLevel: CharacterLevel
  classEntries: CharacterContextClassEntry[]
  primaryAbilities: AbilityId[]
  activeStepId: WizardStepId
}

function formatSingleClassEntry(entry: CharacterContextClassEntry): string {
  if (entry.subclassLabel !== null) {
    return `${entry.className} ${entry.level} · ${entry.subclassLabel}`
  }

  return `${entry.className} ${entry.level}`
}

function formatClassEntries(
  entries: CharacterContextClassEntry[],
): string | null {
  if (entries.length === 0) {
    return null
  }

  if (entries.length === 1) {
    return formatSingleClassEntry(entries[0])
  }

  return entries
    .map((entry) => `${entry.className} ${entry.level}`)
    .join(' / ')
}

function formatIdentityLine(
  characterName: string,
  speciesName: string | null,
): string | null {
  const segments: string[] = []
  const trimmedName = characterName.trim()

  if (trimmedName.length > 0) {
    segments.push(trimmedName)
  }

  if (speciesName !== null) {
    segments.push(speciesName)
  }

  if (segments.length === 0) {
    return null
  }

  return segments.join(' · ')
}

function formatPrimaryAbilitiesGuidance(
  abilities: AbilityId[],
  activeStepId: WizardStepId,
): string | null {
  if (abilities.length === 0) {
    return null
  }

  if (activeStepId === 'ability-scores') {
    if (abilities.length === 1) {
      return `Prioritise: ${formatAbilityLabel(abilities[0])}`
    }

    if (abilities.length === 2) {
      return `Prioritise: ${formatAbilityLabel(abilities[0])} or ${formatAbilityLabel(abilities[1])}`
    }

    const leading = formatAbilityList(abilities.slice(0, -1))
    const last = formatAbilityLabel(abilities[abilities.length - 1])
    return `Prioritise: ${leading}, or ${last}`
  }

  return `Primary abilities: ${formatAbilityList(abilities)}`
}

export function buildCharacterContextDisplay(
  input: CharacterContextDisplayInput,
): CharacterContextDisplay {
  const identityLine = formatIdentityLine(
    input.characterName,
    input.speciesName,
  )
  const buildLine = formatClassEntries(input.classEntries)
  const characterLevelLine =
    input.classEntries.length > 1
      ? `Character level: ${input.targetLevel}`
      : null
  const guidanceLine =
    input.classEntries.length > 0
      ? formatPrimaryAbilitiesGuidance(
          input.primaryAbilities,
          input.activeStepId,
        )
      : null

  return {
    speciesId: input.speciesId,
    identityLine,
    buildLine,
    characterLevelLine,
    guidanceLine,
    classEntries: input.classEntries,
  }
}

export function hasCharacterContextContent(
  display: CharacterContextDisplay,
): boolean {
  return (
    display.identityLine !== null ||
    display.buildLine !== null ||
    display.characterLevelLine !== null ||
    display.guidanceLine !== null
  )
}

export function mergePrimaryAbilities(
  abilityLists: AbilityId[][],
): AbilityId[] {
  const merged: AbilityId[] = []

  for (const abilities of abilityLists) {
    for (const ability of abilities) {
      if (!merged.includes(ability)) {
        merged.push(ability)
      }
    }
  }

  return merged
}
