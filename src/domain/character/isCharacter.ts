import type {
  Character,
  CharacterCreationMethod,
  EditionId,
} from '../types'
import { isBackgroundSelection } from '../background/isBackgroundSelection'
import { isClassSelection } from '../class/isClassSelection'
import { isSpeciesSelection } from '../species/isSpeciesSelection'
import type { AbilityScores } from '../types'

const ABILITY_KEYS: (keyof AbilityScores)[] = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]

function isEditionId(value: unknown): value is EditionId {
  return value === 'srd-2014' || value === 'srd-2024'
}

function isCharacterCreationMethod(
  value: unknown,
): value is CharacterCreationMethod {
  return (
    value === 'manual' ||
    value === 'standard-array' ||
    value === 'point-buy' ||
    value === 'rolled'
  )
}

function isAbilityScores(value: unknown): value is AbilityScores {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const scores = value as Record<string, unknown>

  return ABILITY_KEYS.every(
    (key) =>
      typeof scores[key] === 'number' && Number.isFinite(scores[key]),
  )
}

function isSpecies(value: unknown): boolean {
  return value === null || isSpeciesSelection(value)
}

function isBackground(value: unknown): boolean {
  return value === null || isBackgroundSelection(value)
}

function isClass(value: unknown): boolean {
  return value === null || isClassSelection(value)
}

export function isCharacter(value: unknown): value is Character {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.name === 'string' &&
    isEditionId(candidate.editionId) &&
    isCharacterCreationMethod(candidate.creationMethod) &&
    isAbilityScores(candidate.abilityScores) &&
    isSpecies(candidate.species) &&
    isClass(candidate.class) &&
    isBackground(candidate.background)
  )
}
