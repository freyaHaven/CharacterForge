import type { CharacterDetails } from './character/details'
import type { EditionId } from './edition'
import type { BackgroundSelection } from './background/types'
import type { CharacterClassSelection, CharacterLevel } from './class/types'
import type { FeatSelection } from './feat/types'
import type { SpeciesSelection } from './species/types'

export type { AlignmentId } from './character/alignment'
export {
  ALIGNMENT_IDS,
  ALIGNMENT_LABELS,
  getAlignmentLabel,
  isAlignmentId,
} from './character/alignment'
export type { GenderId } from './character/gender'
export { GENDER_IDS, GENDER_LABELS, getGenderLabel, isGenderId } from './character/gender'
export type { PronounId } from './character/pronouns'
export {
  PRONOUN_IDS,
  PRONOUN_LABELS,
  getPronounLabel,
  isPronounId,
} from './character/pronouns'
export type { CharacterDetails } from './character/details'
export {
  createDefaultCharacterDetails,
  hasCharacterDetailsContent,
  isCharacterDetails,
} from './character/details'
export type { CharacterLifecycle } from './character/lifecycle'
export type { EditionId } from './edition'
export { DEFAULT_EDITION_ID } from './edition'
export type { AbilityId } from './abilities/types'
export { ABILITY_IDS, isAbilityId } from './abilities/types'
export type { ContentSource, LicenceId } from './content/types'
export type {
  ArmorProficiency,
  ClassChoice,
  ClassChoiceEffect,
  ClassChoiceOption,
  ClassChoiceValue,
  ClassDefinition,
  ClassFeature,
  ClassOptionFeature,
  ClassLevelFeatures,
  ClassLevel,
  CharacterClassSelection,
  CharacterLevel,
  ClassSelection,
  DeferredCharacterRequirement,
  DeferredDestinationStep,
  ResolvedDeferredCharacterRequirement,
  HitDie,
  ResolvedClassEffect,
  ToolProficiency,
  WeaponProficiency,
} from './class/types'
export {
  getClassFeatureProgressionUpToLevel,
  getClassFeaturesForLevel,
  getClassFeaturesUpToLevel,
} from './class/featureProgression'
export {
  MAX_CLASS_LEVEL,
  MIN_CLASS_LEVEL,
} from './class/types'
export type {
  SkillId,
} from './skills/types'
export {
  isSkillId,
  SKILL_IDS,
  SKILL_LABELS,
} from './skills/types'
export type {
  AbilityScoreIncreaseMode,
  AbilityScoreIncreaseSelection,
  BackgroundAbilityScoreBonuses,
  BackgroundChoice,
  BackgroundChoiceOption,
  BackgroundDefinition,
  BackgroundEquipmentDefinition,
  BackgroundEquipmentPackage,
  BackgroundOriginFeat,
  BackgroundSelection,
  BackgroundToolProficiency,
} from './background/types'
export type {
  FeatBenefit,
  FeatCategory,
  FeatChoice,
  FeatChoiceOption,
  FeatDefinition,
  FeatPrerequisite,
  FeatSelection,
} from './feat/types'
export type {
  ConditionId,
  CreatureSize,
  DamageTypeId,
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
  targetLevel: CharacterLevel
  classes: CharacterClassSelection[]
  startingClassInstanceId: string | null
  background: BackgroundSelection | null
  feat: FeatSelection | null
  details: CharacterDetails
}
