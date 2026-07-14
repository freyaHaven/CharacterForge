import type { EditionId } from '../edition'
import type { ContentSource } from '../content/types'

export type { ContentSource, LicenceId } from '../content/types'

export type CreatureSize =
  | 'tiny'
  | 'small'
  | 'medium'
  | 'large'
  | 'huge'
  | 'gargantuan'

export type MovementSpeed = {
  walk: number
}

export type DamageTypeId =
  | 'poison'
  | 'acid'
  | 'cold'
  | 'fire'
  | 'lightning'

export type ConditionId = 'poisoned'

export type SpeciesEffect =
  | { kind: 'darkvision'; rangeFeet: number }
  | { kind: 'damage-resistance'; damageType: DamageTypeId }
  | { kind: 'save-advantage'; condition: ConditionId }
  | { kind: 'hit-point-maximum-per-level'; amount: number }

export type SpeciesTrait = {
  id: string
  name: string
  description: string
}

export type SpeciesChoiceOption = {
  id: string
  label: string
  description?: string
  effects?: SpeciesEffect[]
}

export type SpeciesChoice = {
  id: string
  prompt: string
  type: 'single-select'
  options: SpeciesChoiceOption[]
  required: boolean
}

export type SpeciesDefinition = {
  id: string
  editionId: EditionId
  name: string
  description: string
  source: ContentSource
  size: CreatureSize
  speed: MovementSpeed
  traits: SpeciesTrait[]
  effects: SpeciesEffect[]
  choices: SpeciesChoice[]
}

export type SpeciesSelection = {
  speciesId: string
  choices: Record<string, string>
}
