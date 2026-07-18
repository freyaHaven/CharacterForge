import { createDefaultCharacterDetails } from './details'
import { DEFAULT_EDITION_ID } from '../edition'
import type { AbilityScores, Character } from '../types'
import { EMPTY_CLASS_STATE } from './characterClassSelection'

export const DEFAULT_CHARACTER_ID = 'char-1'

export const DEFAULT_ABILITY_SCORES: AbilityScores = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
}

export function createDefaultCharacter(
  overrides: Partial<Character> = {},
): Character {
  return {
    id: DEFAULT_CHARACTER_ID,
    name: '',
    editionId: DEFAULT_EDITION_ID,
    creationMethod: 'manual',
    abilityScores: DEFAULT_ABILITY_SCORES,
    species: null,
    ...EMPTY_CLASS_STATE,
    background: null,
    feat: null,
    details: createDefaultCharacterDetails(),
    spellSourceStates: [],
    ...overrides,
  }
}
