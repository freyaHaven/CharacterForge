import type { AbilityId } from '../abilities/types'
import type { ContentSource } from '../content/types'
import type { EditionId } from '../edition'
import type { SkillId } from '../skills/types'

export type BackgroundOriginFeat = {
  id: string
  name: string
  description: string
  /** Reserved for deferred Magic Initiate spell selection. */
  magicInitiateClass?: 'cleric' | 'wizard' | 'druid'
}

export type BackgroundToolOption = {
  id: string
  label: string
}

export type BackgroundToolProficiency =
  | { kind: 'fixed'; toolId: string; label: string }
  | {
      kind: 'choice'
      choiceId: string
      prompt: string
      options: BackgroundToolOption[]
    }

export type BackgroundEquipmentPackage = {
  id: string
  label: string
  summary: string
}

export type BackgroundEquipmentDefinition = {
  choiceId: string
  prompt: string
  packages: BackgroundEquipmentPackage[]
  goldAlternative: {
    goldPieces: number
    label: string
  }
}

export type BackgroundChoiceOption = {
  id: string
  label: string
  description?: string
}

export type BackgroundChoice = {
  id: string
  prompt: string
  type: 'single-select'
  required: boolean
  options: BackgroundChoiceOption[]
}

export type BackgroundDefinition = {
  id: string
  editionId: EditionId
  name: string
  description: string
  source: ContentSource
  eligibleAbilityScores: AbilityId[]
  originFeat: BackgroundOriginFeat
  skillProficiencies: SkillId[]
  toolProficiency: BackgroundToolProficiency
  equipment: BackgroundEquipmentDefinition
  choices: BackgroundChoice[]
}

export type AbilityScoreIncreaseMode = 'two-and-one' | 'three-one'

export type AbilityScoreIncreaseSelection =
  | { mode: 'two-and-one'; plusTwo: AbilityId; plusOne: AbilityId }
  | { mode: 'three-one' }

export type BackgroundAbilityScoreBonuses = Partial<Record<AbilityId, number>>

export type BackgroundSelection = {
  backgroundId: string
  abilityScoreIncrease: AbilityScoreIncreaseSelection
  choices: Record<string, string>
}
