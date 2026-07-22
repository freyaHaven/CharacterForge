import { createDefaultCharacterDetails } from './details'
import { DEFAULT_EDITION_ID } from '../edition'
import {
  EMPTY_CHARACTER_EQUIPMENT,
  EMPTY_CHARACTER_INVENTORY,
  EMPTY_EQUIPMENT_LOADOUT,
} from '../equipment/types'
import type { AbilityScores, Character, CharacterEquipment } from '../types'
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

export type CreateDefaultCharacterOverrides = Partial<
  Omit<Character, 'equipment'>
> & {
  equipment?: Partial<CharacterEquipment>
}

export function createDefaultCharacter(
  overrides: CreateDefaultCharacterOverrides = {},
): Character {
  const { equipment, ...rest } = overrides

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
    equipment: {
      selections: equipment?.selections ?? EMPTY_CHARACTER_EQUIPMENT.selections,
      loadout: equipment?.loadout ?? EMPTY_EQUIPMENT_LOADOUT,
      inventory: equipment?.inventory ?? EMPTY_CHARACTER_INVENTORY,
    },
    ...rest,
  }
}
