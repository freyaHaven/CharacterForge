import type { EditionId } from './edition'
import type { SpeciesSelection } from './species/types'

export type { EditionId } from './edition'
export type {
  ConditionId,
  ContentSource,
  CreatureSize,
  DamageTypeId,
  LicenceId,
  MovementSpeed,
  SpeciesChoice,
  SpeciesChoiceOption,
  SpeciesDefinition,
  SpeciesEffect,
  SpeciesSelection,
  SpeciesTrait,
} from './species/types'

export type CharacterCreationMethod =
  | 'manual'
  | 'standard-array'
  | 'point-buy'
  | 'rolled'

export type AbilityScores = {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export type Character = {
  id: string
  name: string
  editionId: EditionId
  creationMethod: CharacterCreationMethod
  abilityScores: AbilityScores
  species: SpeciesSelection | null
}
