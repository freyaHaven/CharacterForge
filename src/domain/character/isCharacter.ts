import type {
  Character,
  CharacterCreationMethod,
  EditionId,
} from '../types'
import { isCharacterDetails } from './details'
import { isBackgroundSelection } from '../background/isBackgroundSelection'
import { isCharacterClassSelection } from '../class/isCharacterClassSelection'
import { isFeatSelection } from '../feat/isFeatSelection'
import { isSpellSourceStateArray } from '../spell/isSpellSourceState'
import { isSpeciesSelection } from '../species/isSpeciesSelection'
import {
  getAllocatedLevel,
  hasUniqueClassIds,
  isValidCharacterLevel,
} from './classLevels'
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

function isFeat(value: unknown): boolean {
  return value === null || isFeatSelection(value)
}

function isStartingClassReferenceValid(
  classes: Character['classes'],
  startingClassInstanceId: unknown,
): boolean {
  if (classes.length === 0) {
    return startingClassInstanceId === null
  }

  if (typeof startingClassInstanceId !== 'string') {
    return false
  }

  return classes.some((entry) => entry.instanceId === startingClassInstanceId)
}

function isClasses(value: unknown): value is Character['classes'] {
  if (!Array.isArray(value)) {
    return false
  }

  if (!value.every(isCharacterClassSelection)) {
    return false
  }

  return hasUniqueClassIds(value)
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
    isValidCharacterLevel(candidate.targetLevel) &&
    isClasses(candidate.classes) &&
    isStartingClassReferenceValid(
      candidate.classes as Character['classes'],
      candidate.startingClassInstanceId,
    ) &&
    getAllocatedLevel(candidate.classes as Character['classes']) <=
      (candidate.targetLevel as number) &&
    isBackground(candidate.background) &&
    isFeat(candidate.feat) &&
    isCharacterDetails(candidate.details) &&
    isSpellSourceStateArray(candidate.spellSourceStates)
  )
}
