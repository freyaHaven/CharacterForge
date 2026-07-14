import type { AbilityId } from '../abilities/types'
import type { ContentSource } from '../content/types'
import type { EditionId } from '../edition'
import type { SkillId } from '../skills/types'

export type ClassLevel = number

export type HitDie = {
  sides: 6 | 8 | 10 | 12
}

export type ArmorProficiency =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'shield'

export type WeaponProficiency = 'simple' | 'martial'

export type ToolProficiency = never

export type ClassProficiencies = {
  armor: ArmorProficiency[]
  weapons: WeaponProficiency[]
  tools: ToolProficiency[]
  skillOptions: SkillId[]
}

export type ClassFeature = {
  id: string
  name: string
  description: string
}

export type ClassLevelFeatures = {
  level: ClassLevel
  features: ClassFeature[]
}

/** Effects attached to class choices — not duplicated from structural fields. */
export type ClassChoiceEffect =
  | { kind: 'fighting-style'; styleId: string }
  | { kind: 'skill-proficiency'; skillId: SkillId }

export type ClassChoiceOption = {
  id: string
  label: string
  description?: string
  effects?: ClassChoiceEffect[]
}

export type ClassChoice =
  | {
      id: string
      prompt: string
      type: 'single-select'
      required: boolean
      options: ClassChoiceOption[]
    }
  | {
      id: string
      prompt: string
      type: 'multi-select'
      required: boolean
      min: number
      max: number
      options: ClassChoiceOption[]
    }

export type ClassDefinition = {
  id: string
  editionId: EditionId
  name: string
  description: string
  source: ContentSource
  hitDie: HitDie
  primaryAbilities: AbilityId[]
  savingThrows: AbilityId[]
  proficiencies: ClassProficiencies
  featureProgression: ClassLevelFeatures[]
  choices: ClassChoice[]
}

export type ClassChoiceValue = string | string[]

export type ClassSelection = {
  classId: string
  level: ClassLevel
  choices: Record<string, ClassChoiceValue>
}

/** Normalized mechanics derived from a definition and selection. */
export type ResolvedClassEffect =
  | { kind: 'hit-die'; sides: HitDie['sides'] }
  | { kind: 'saving-throw-proficiency'; ability: AbilityId }
  | { kind: 'armor-proficiency'; category: ArmorProficiency }
  | { kind: 'weapon-proficiency'; category: WeaponProficiency }
  | ClassChoiceEffect

export const MIN_CLASS_LEVEL = 1
export const MAX_CLASS_LEVEL = 20
