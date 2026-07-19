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

export type CreatureTypeId = 'humanoid'

export type MovementSpeed = {
  walk: number
  fly?: number
  swim?: number
  climb?: number
  burrow?: number
}

export type DamageTypeId =
  | 'poison'
  | 'acid'
  | 'cold'
  | 'fire'
  | 'lightning'
  | 'necrotic'

export type ConditionId = 'poisoned' | 'charmed' | 'frightened'

export type SpeciesEffect =
  | { kind: 'darkvision'; rangeFeet: number }
  | { kind: 'damage-resistance'; damageType: DamageTypeId }
  | { kind: 'save-advantage'; condition: ConditionId }
  | { kind: 'hit-point-maximum-per-level'; amount: number }

export type SpeciesTrait = {
  id: string
  name: string
  description: string
  /** Mechanical effects granted by this trait (single source of truth for Highlights + rules). */
  effects?: SpeciesEffect[]
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
  /** Optional helper copy shown under the choice UI. */
  helperText?: string
}

export type SpeciesLanguageGrant = {
  id: string
  label: string
}

export type SpeciesLanguageChoicePool =
  | 'standard'
  | SpeciesLanguageGrant[]

export type SpeciesLanguageChoice = {
  id: string
  prompt: string
  count: number
  pool: SpeciesLanguageChoicePool
  required: boolean
}

export type SpeciesLanguages = {
  grants: SpeciesLanguageGrant[]
  choices: SpeciesLanguageChoice[]
}

export type SpeciesGuidance = {
  age?: string
  height?: string
}

export type SpeciesDefinition = {
  id: string
  editionId: EditionId
  name: string
  description: string
  source: ContentSource
  creatureType: CreatureTypeId
  size: CreatureSize
  speed: MovementSpeed
  languages: SpeciesLanguages
  traits: SpeciesTrait[]
  /** Orphan mechanical effects not owned by a trait. Prefer trait.effects. */
  effects: SpeciesEffect[]
  choices: SpeciesChoice[]
  guidance?: SpeciesGuidance
}

export type SpeciesSelectionChoiceValue = string | string[]

export type SpeciesSelection = {
  speciesId: string
  choices: Record<string, SpeciesSelectionChoiceValue>
}
