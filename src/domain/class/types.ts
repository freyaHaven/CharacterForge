import type { AbilityId } from '../abilities/types'
import type { ContentSource } from '../content/types'
import type { EditionId } from '../edition'
import type { SkillId } from '../skills/types'
import type {
  ClassSpellcasting,
  SpellEntitlement,
} from '../spell/types'
import type { HitPointIncrease } from './hitPointIncreases'

export type { ClassSpellcasting, SpellEntitlement } from '../spell/types'

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
  /** Spell entitlements unlocked with this feature at its progression level. */
  spellEntitlements?: SpellEntitlement[]
}

export type ClassLevelFeatures = {
  level: ClassLevel
  features: ClassFeature[]
}

export type DeferredDestinationStep = 'ability-scores' | 'equipment' | 'class'

/** Mechanical choices deferred to a future wizard step; not validated on the Class step. */
export type DeferredCharacterRequirement = {
  id: string
  level: ClassLevel
  destinationStep: DeferredDestinationStep
  label: string
  description: string
}

/** Deferred requirement resolved for a specific class instance on a character. */
export type ResolvedDeferredCharacterRequirement = {
  requirementId: string
  sourceInstanceId: string
  sourceClassId: string
  sourceClassLevel: ClassLevel
  destinationStep: DeferredDestinationStep
  label: string
  description: string
}

/** Effects attached to class choices — not duplicated from structural fields. */
export type ClassChoiceEffect =
  | { kind: 'fighting-style'; styleId: string }
  | { kind: 'skill-proficiency'; skillId: SkillId }
  | { kind: 'skill-expertise'; skillId: SkillId }

/** Feature granted by selecting a subclass (or similar) choice option. */
export type ClassOptionFeature = {
  id: string
  name: string
  description: string
  level: ClassLevel
  /** Spell entitlements unlocked with this feature (e.g. domain spells). */
  spellEntitlements?: SpellEntitlement[]
}

export type ClassChoiceOption = {
  id: string
  label: string
  description?: string
  effects?: ClassChoiceEffect[]
  /** Features granted by this option (e.g. Champion subclass features). */
  features?: ClassOptionFeature[]
  /** Spell entitlements unlocked when this option is selected. */
  spellEntitlements?: SpellEntitlement[]
}

export type ClassChoice =
  | {
      id: string
      level: ClassLevel
      prompt: string
      type: 'single-select'
      required: boolean
      options: ClassChoiceOption[]
    }
  | {
      id: string
      level: ClassLevel
      prompt: string
      type: 'multi-select'
      required: boolean
      min: number
      max: number
      options: ClassChoiceOption[]
    }

export type ClassCatalogStatus = 'available' | 'preview'

/**
 * First-class subclass definition for content packs.
 * Assembled into a {@link ClassChoiceOption} on the parent class's subclass choice.
 * `choiceOptionId` is the value stored in character selections (must stay stable).
 */
export type SubclassDefinition = {
  id: string
  classId: string
  editionId: EditionId
  name: string
  description: string
  source: ContentSource
  /** Option id written into ClassSelection.choices (e.g. `'champion'`). */
  choiceOptionId: string
  features: ClassOptionFeature[]
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
  deferredRequirements: DeferredCharacterRequirement[]
  /** When preview, the class is shown only in multiclass setup and labelled accordingly. */
  catalogStatus?: ClassCatalogStatus
  /**
   * Optional catalogue sort key (lower first). When omitted, sort falls back to name.
   * Owned by content definitions — UI must not hardcode class ids for ordering.
   */
  catalogOrder?: number
  /** Present when the class grants spellcasting at or before the selected level. */
  spellcasting?: ClassSpellcasting
}

export type ClassChoiceValue = string | string[]

export type { HitPointIncrease, HitPointIncreaseMethod } from './hitPointIncreases'

export type ClassSelection = {
  classId: string
  level: ClassLevel
  choices: Record<string, ClassChoiceValue>
  hitPointIncreases?: HitPointIncrease[]
}

/** Levels allocated to one class on a character. */
export type CharacterClassSelection = {
  instanceId: string
  classId: string
  level: ClassLevel
  choices: Record<string, ClassChoiceValue>
  hitPointIncreases?: HitPointIncrease[]
}

/** Campaign / character target level (1–20). */
export type CharacterLevel = ClassLevel

/** Normalized mechanics derived from a definition and selection. */
export type ResolvedClassEffect =
  | { kind: 'hit-die'; sides: HitDie['sides'] }
  | { kind: 'saving-throw-proficiency'; ability: AbilityId }
  | { kind: 'armor-proficiency'; category: ArmorProficiency }
  | { kind: 'weapon-proficiency'; category: WeaponProficiency }
  | { kind: 'spellcasting'; ability: AbilityId }
  | ClassChoiceEffect

export const MIN_CLASS_LEVEL = 1
export const MAX_CLASS_LEVEL = 20
