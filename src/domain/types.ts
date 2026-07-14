export type EditionId = 'srd-2014' | 'srd-2024'

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
}
