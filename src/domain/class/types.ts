import type { AbilityId } from '../abilities/types'
import type { ContentSource } from '../content/types'
import type { EditionId } from '../edition'
import type { FeatCategory } from '../feat/types'
import type { SkillId } from '../skills/types'
import type { DamageTypeId } from '../species/types'
import type { StartingEquipmentDefinition } from '../equipment/types'
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
  /** Persistent creator-time effects (languages, tools, etc.). */
  effects?: ClassChoiceEffect[]
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
  | { kind: 'armor-proficiency'; category: ArmorProficiency }
  | { kind: 'weapon-proficiency'; category: WeaponProficiency }
  /** Proficiency with a specific weapon id (e.g. Pact of the Blade). */
  | { kind: 'weapon-proficiency-item'; weaponId: string }
  /**
   * Use listed abilities for weapon attack/damage rolls (e.g. CHA with pact weapon).
   * Sheet/summary metadata — attack resolution during play is out of scope.
   */
  | { kind: 'weapon-attack-ability'; abilities: AbilityId[] }
  | { kind: 'language'; languageId: string; label: string }
  | { kind: 'tool-proficiency'; toolId: string; label: string }
  /** Half proficiency (floor) on skill checks lacking proficiency. */
  | { kind: 'jack-of-all-trades' }
  /** While unarmored: AC = 10 + sum of listed ability modifiers. */
  | { kind: 'unarmored-defense'; abilities: AbilityId[] }
  /** Add `amount` to hit point maximum per level in this class instance. */
  | { kind: 'hit-point-maximum-per-class-level'; amount: number }
  | { kind: 'damage-resistance'; damageType: DamageTypeId }

/** Prerequisites for selecting a class choice option (e.g. Eldritch Invocations). */
export type ClassOptionPrerequisite =
  | { kind: 'min-source-level'; level: number }
  | {
      kind: 'requires-selected-option'
      choiceId: string
      /**
       * Required option id. May be a base id — numbered repeats like
       * `pact-of-the-blade-2` also satisfy `pact-of-the-blade`.
       */
      optionId: string
    }

/** Feature granted by selecting a subclass (or similar) choice option. */
export type ClassOptionFeature = {
  id: string
  name: string
  description: string
  level: ClassLevel
  /** Spell entitlements unlocked with this feature (e.g. domain spells). */
  spellEntitlements?: SpellEntitlement[]
  /** Persistent creator-time effects from this subclass feature. */
  effects?: ClassChoiceEffect[]
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
  /** Selection prerequisites (level / other options). */
  prerequisites?: ClassOptionPrerequisite[]
  /**
   * Documentation flag for repeatable options. Use numbered option ids
   * (`agonizing-blast`, `agonizing-blast-2`) for actual repeats.
   */
  repeatable?: boolean
}

export type ClassChoice =
  | {
      id: string
      level: ClassLevel
      prompt: string
      type: 'single-select'
      required: boolean
      options: ClassChoiceOption[]
      /**
       * Machine-readable role for spell-source ordering and similar rules.
       * Prefer this over parsing choice ids; `id` ending in `-subclass` remains
       * a fallback for legacy content packs.
       */
      role?: 'subclass'
      /**
       * Optional catalogue feat id recommended for this choice (e.g. Epic Boon).
       * Display-only — does not restrict selection.
       */
      recommendedFeatId?: string
      /**
       * When set, the UI loads feats from this category via the shared feat-grant
       * pipeline (`feat:{id}`). `options` may still list class-only alternates.
       */
      featGrantCategory?: FeatCategory
      /**
       * Choice is available only when another choice has the given option id
       * selected (e.g. Champion Additional Fighting Style).
       * Works for single-select equality or multi-select inclusion
       * (including numbered base-id matches via {@link matchesRequiredOptionId}).
       */
      availableWhen?: { choiceId: string; optionId: string }
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
      /**
       * When set, min and max both become `limitsByLevel[level - 1]` via
       * {@link withLevelAdjustedChoiceLimits} (data-driven level scaling).
       */
      limitsByLevel?: number[]
      /**
       * Choice is available only when another choice has the given option id
       * selected (e.g. College of Lore bonus proficiencies).
       * Works for single-select equality or multi-select inclusion.
       */
      availableWhen?: { choiceId: string; optionId: string }
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

/**
 * Ability score prerequisites checked when the character has levels in more
 * than one class (SRD 5.2.1 Multiclassing). Not applied to single-class builds.
 */
export type MulticlassPrerequisite =
  | {
      kind: 'all-of'
      abilities: AbilityId[]
      minimum: number
      /** Short label for UI (e.g. "Strength 13"). */
      summary: string
    }
  | {
      kind: 'any-of'
      abilities: AbilityId[]
      minimum: number
      /** Short label for UI (e.g. "Strength or Dexterity 13"). */
      summary: string
    }

export type ClassDefinition = {
  id: string
  editionId: EditionId
  name: string
  description: string
  source: ContentSource
  hitDie: HitDie
  primaryAbilities: AbilityId[]
  /**
   * Required when multiclassing into or retaining levels in this class.
   * Evaluated against resolved ability scores for every class on a multiclass character.
   */
  multiclassPrerequisite: MulticlassPrerequisite
  savingThrows: AbilityId[]
  proficiencies: ClassProficiencies
  featureProgression: ClassLevelFeatures[]
  choices: ClassChoice[]
  deferredRequirements: DeferredCharacterRequirement[]
  /** Starting equipment entitlements resolved on the Equipment wizard step. */
  startingEquipment: StartingEquipmentDefinition
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
