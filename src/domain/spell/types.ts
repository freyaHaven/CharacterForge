import type { AbilityId } from '../abilities/types'
import type { ContentSource } from '../content/types'
import type { EditionId } from '../edition'

/** Catalog spell. Lists and grants reference these by id. */
export type SpellDefinition = {
  id: string
  editionId: EditionId
  name: string
  /** 0 = cantrip. */
  level: number
  school: string
  castingTime: string
  range: string
  components: string
  duration: string
  description: string
  source: ContentSource
}

export type SpellListDefinition = {
  id: string
  editionId: EditionId
  name: string
  spellIds: string[]
  source: ContentSource
}

/** How a class contributes to the shared multiclass spell-slot pool. */
export type SpellSlotContributor = 'full' | 'half'

export type SpellSelectionKind = 'cantrip' | 'prepared' | 'known'

/**
 * How a select entitlement treats spells already available elsewhere.
 * - `allow` — no special treatment
 * - `discourage` — still selectable, clearly labelled (default for known/prepared)
 * - `forbid` — not selectable when already available elsewhere (default for cantrips)
 */
export type CrossSourceDuplicatePolicy = 'allow' | 'discourage' | 'forbid'

export type SpellCountSpec =
  | { kind: 'fixed'; value: number }
  | { kind: 'by-source-level'; table: number[] }
  | { kind: 'extra-fixed'; value: number }

export type SpellLevelRange = {
  min: number
  /** Highest pickable spell level; `slot-ceiling` uses shared (or single-class) slots. */
  max: 'slot-ceiling' | number
}

/**
 * Machine-readable spell content granted by a definition.
 * Generic — UI must not hard-code class or feat names.
 */
export type SpellEntitlement =
  | {
      id: string
      kind: 'select'
      listId: string
      selectionKind: SpellSelectionKind
      count: SpellCountSpec
      levelRange: SpellLevelRange
      /**
       * Override default cross-source duplicate policy for this entitlement.
       * When omitted, cantrips forbid duplicates; known/prepared discourage them.
       */
      crossSourceDuplicatePolicy?: CrossSourceDuplicatePolicy
    }
  | {
      id: string
      kind: 'granted'
      spells: { spellId: string; minLevel: number }[]
      countsAgainstLimit: boolean
      /** Which selection pool this grant associates with for limit accounting. */
      appliesTo?: SpellSelectionKind
    }

/** Expanded class spellcasting block on {@link ClassDefinition}. */
export type ClassSpellcasting = {
  ability: AbilityId
  spellListId: string
  slotContributor: SpellSlotContributor
  /**
   * Spell slots by class level for single-class casting.
   * Index 0 = level 1; each entry is slot counts for spell levels 1+.
   */
  slotsByLevel: number[][]
  /** Cantrips known by class level (index = level - 1). */
  cantripsKnownByLevel: number[]
  /** Prepared L1+ count by class level (index = level - 1). */
  preparedSpellsByLevel: number[]
  entitlements: SpellEntitlement[]
}

/** Feat-granted spellcasting (e.g. Magic Initiate). */
export type FeatSpellcasting = {
  ability: AbilityId
  spellListId: string
  entitlements: SpellEntitlement[]
}

/**
 * Identifies one spellcasting source. Class sources always use instanceId.
 */
export type SpellSourceRef =
  | {
      kind: 'class-instance'
      instanceId: string
      entitlementId: string
    }
  | {
      kind: 'feat'
      slot: 'character-feat' | 'class-choice'
      featId: string
      entitlementId: string
      instanceId?: string
      choiceId?: string
    }
  | {
      kind: 'background-origin'
      backgroundId: string
      entitlementId: string
    }
  | {
      kind: 'species-trait'
      speciesId: string
      traitId: string
      entitlementId: string
    }

/**
 * One player-owned spell pick. Keep minimal — selectionKind lives on the entitlement.
 * Add fields only when metadata is truly specific to this selected spell.
 */
export type SpellSelection = {
  spellId: string
}

/**
 * All persisted player-owned state for one spellcasting source.
 * May later grow spellbook state, replacements, and other source-scoped data.
 * UI-only state must not live here.
 */
export type SpellSourceState = {
  source: SpellSourceRef
  selections: SpellSelection[]
}
