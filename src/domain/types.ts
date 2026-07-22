import type { CharacterDetails } from './character/details'
import type { EditionId } from './edition'
import type { BackgroundSelection } from './background/types'
import type { CharacterClassSelection, CharacterLevel } from './class/types'
import type { FeatSelection } from './feat/types'
import type { SpeciesSelection } from './species/types'
import type { CharacterEquipment } from './equipment/types'
import type { SpellSourceState } from './spell/types'

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
  HitPointIncrease,
  HitPointIncreaseMethod,
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
  BackgroundOriginFeat,
  BackgroundSelection,
  BackgroundToolProficiency,
} from './background/types'
export {
  EMPTY_CHARACTER_EQUIPMENT,
  EMPTY_EQUIPMENT_LOADOUT,
  GOLD_PIECES_ITEM_ID,
  SELECTED_GAMING_SET_ITEM_ID,
} from './equipment/types'
export type {
  CharacterEquipment,
  EquipmentEntitlement,
  EquipmentGrant,
  EquipmentHandUsage,
  EquipmentItemDefinition,
  EquipmentItemSelection,
  EquipmentLoadout,
  EquipmentSelection,
  EquipmentSourceRef,
  StartingEquipmentDefinition,
} from './equipment/types'
export type {
  FeatBenefit,
  FeatCategory,
  FeatChoice,
  FeatChoiceOption,
  FeatDefinition,
  FeatPrerequisite,
  FeatSelection,
  FeatSpellcasting,
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
export type {
  ClassSpellcasting,
  CrossSourceDuplicatePolicy,
  PactMagicSlotProgression,
  SpellCountSpec,
  SpellDefinition,
  SpellEntitlement,
  SpellLevelRange,
  SpellListDefinition,
  SpellPrepareFrom,
  SpellSelection,
  SpellSelectionKind,
  SpellSlotContributor,
  SpellSlotRecovery,
  SpellSourceRef,
  SpellSourceState,
} from './spell/types'

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
  /** Persisted player-owned spell state, keyed by spellcasting source. */
  spellSourceStates: SpellSourceState[]
  /** Persisted player-owned equipment selections, keyed by source + entitlement. */
  equipment: CharacterEquipment
}
