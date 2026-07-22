import type { AbilityId } from '../abilities/types'
import type { ContentSource } from '../content/types'
import type { EditionId } from '../edition'
import type { SkillId } from '../skills/types'
import type { SpellEntitlement } from '../spell/types'

export type { ContentSource, LicenceId } from '../content/types'

/**
 * Phase 1 creator-time species effects only.
 *
 * Active-use / rest / triggered features (Luck, Breath Weapon, Relentless
 * Endurance, Large Form activation, Heroic Inspiration, etc.) stay as
 * descriptive trait text until CharacterForge has a play-sheet action system.
 */
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

/** SRD damage types (Fiendish Resilience uses all except Force). */
export type DamageTypeId =
  | 'acid'
  | 'bludgeoning'
  | 'cold'
  | 'fire'
  | 'force'
  | 'lightning'
  | 'necrotic'
  | 'piercing'
  | 'poison'
  | 'psychic'
  | 'radiant'
  | 'slashing'
  | 'thunder'

export const DAMAGE_TYPE_IDS: readonly DamageTypeId[] = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
] as const

export type ConditionId = 'poisoned' | 'charmed' | 'frightened'

export type SpeciesEffect =
  | { kind: 'darkvision'; rangeFeet: number }
  | { kind: 'damage-resistance'; damageType: DamageTypeId }
  | { kind: 'save-advantage'; condition: ConditionId }
  | { kind: 'save-advantage-ability'; abilities: AbilityId[] }
  | { kind: 'hit-point-maximum-per-level'; amount: number }
  | { kind: 'skill-proficiency'; skillId: SkillId }
  | { kind: 'speed-walk'; feet: number }
  | { kind: 'size'; size: CreatureSize }

/**
 * Spell entitlements granted by a species trait or lineage/legacy option.
 * Spellcasting ability is chosen separately (`spellcasting-ability` choice)
 * and applied at resolve time — not stored on this block.
 */
export type SpeciesSpellcasting = {
  /** Required when any entitlement is `kind: 'select'`. */
  spellListId?: string
  entitlements: SpellEntitlement[]
}

export type SpeciesTrait = {
  id: string
  name: string
  description: string
  /** Mechanical effects granted by this trait (single source of truth for Highlights + rules). */
  effects?: SpeciesEffect[]
  spellcasting?: SpeciesSpellcasting
}

export type SpeciesChoiceOption = {
  id: string
  label: string
  description?: string
  effects?: SpeciesEffect[]
  spellcasting?: SpeciesSpellcasting
}

export type SpeciesChoice = {
  id: string
  prompt: string
  /**
   * `single-select` — options listed on the choice.
   * `feat-grant` — options loaded from the feat catalogue (origin feats).
   */
  type: 'single-select' | 'feat-grant'
  options: SpeciesChoiceOption[]
  required: boolean
  /** Optional helper copy shown under the choice UI. */
  helperText?: string
  /** When `type` is `feat-grant`, which feat category to offer. */
  featCategory?: 'origin'
  /** Optional recommended feat id (e.g. Skilled for Human Versatile). */
  recommendedFeatId?: string
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

/** Choice id used by Human Versatile (and any future species origin-feat grants). */
export const SPECIES_VERSATILE_CHOICE_ID = 'versatile' as const

export const SPECIES_SPELLCASTING_ABILITY_CHOICE_ID =
  'spellcasting-ability' as const
