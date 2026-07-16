import type { AbilityId } from '../../domain/abilities/types'
import { formatAbilityLabel } from '../class/formatClassDetails'
import type { WizardStepId } from '../../app/wizard/types'

const CONTEXT_SEPARATOR = ' • '

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
  guidanceLine: string | null
  classEntries: CharacterContextClassEntry[]
}

export type CharacterContextDisplayInput = {
  characterName: string
  speciesId: string | null
  speciesName: string | null
  classEntries: CharacterContextClassEntry[]
  primaryAbilities: AbilityId[]
  activeStepId: WizardStepId
}

function formatClassEntries(
  entries: CharacterContextClassEntry[],
): string | null {
  if (entries.length === 0) {
    return null
  }

  return entries
    .map((entry) => `${entry.className} ${entry.level}`)
    .join(CONTEXT_SEPARATOR)
}

function formatIdentityLine(
  characterName: string,
  speciesName: string | null,
  activeStepId: WizardStepId,
): string | null {
  const segments: string[] = []
  const trimmedName = characterName.trim()

  if (trimmedName.length > 0) {
    segments.push(trimmedName)
  }

  // Species step already surfaces the species choice; keep identity to name only.
  if (speciesName !== null && activeStepId !== 'species') {
    segments.push(speciesName)
  }

  if (segments.length === 0) {
    return null
  }

  return segments.join(CONTEXT_SEPARATOR)
}

function formatAbilityScoresGuidance(abilities: AbilityId[]): string | null {
  if (abilities.length === 0) {
    return null
  }

  return `Prioritise: ${abilities.map(formatAbilityLabel).join(CONTEXT_SEPARATOR)}`
}

export function buildCharacterContextDisplay(
  input: CharacterContextDisplayInput,
): CharacterContextDisplay {
  const identityLine = formatIdentityLine(
    input.characterName,
    input.speciesName,
    input.activeStepId,
  )
  // Class step already surfaces the class build; omit the duplicate build line.
  const buildLine =
    input.activeStepId === 'class'
      ? null
      : formatClassEntries(input.classEntries)
  const guidanceLine =
    input.activeStepId === 'ability-scores' && input.classEntries.length > 0
      ? formatAbilityScoresGuidance(input.primaryAbilities)
      : null

  return {
    speciesId: input.speciesId,
    identityLine,
    buildLine,
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
