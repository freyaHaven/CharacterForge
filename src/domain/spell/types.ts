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
  /** When true, the spell has the Ritual tag. */
  ritual?: boolean
  /** When true, the spell requires Concentration. */
  concentration?: boolean
}

export type SpellListDefinition = {
  id: string
  editionId: EditionId
  name: string
  spellIds: string[]
  source: ContentSource
}

/** How a class contributes to spell-slot pools. */
export type SpellSlotContributor = 'full' | 'half' | 'pact' | 'none'

/**
 * Player-facing selection mode for a select entitlement.
 * - cantrip / prepared / known — castable picks
 * - spellbook — spells recorded in the class instance spellbook (not prepared yet)
 */
export type SpellSelectionKind =
  | 'cantrip'
  | 'prepared'
  | 'known'
  | 'spellbook'

/**
 * Where prepared spells may be chosen from.
 * - class-list (default) — any spell on the entitlement list (Cleric-style)
 * - spellbook — only spells recorded in the linked spellbook entitlement
 */
export type SpellPrepareFrom = 'class-list' | 'spellbook'

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
  /**
   * Highest pickable spell level.
   * - `slot-ceiling` — conventional shared slots
   * - `pact-slot-level` — Pact Magic slot level for this class instance
   * - number — fixed max
   */
  max: 'slot-ceiling' | 'pact-slot-level' | number
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
       * When omitted, cantrips forbid duplicates; known/prepared/spellbook discourage them.
       */
      crossSourceDuplicatePolicy?: CrossSourceDuplicatePolicy
      /**
       * Prepared entitlements only. Defaults to `class-list`.
       * When `spellbook`, picks must be ⊆ all spellbook-kind selections on the
       * same class instance (plus always-prepared grants), unless
       * `spellbookEntitlementId` narrows to one book entitlement.
       */
      prepareFrom?: SpellPrepareFrom
      /**
       * Optional single spellbook entitlement id. When omitted with
       * `prepareFrom: 'spellbook'`, all `selectionKind: 'spellbook'` sources on
       * the same class instance are unioned.
       */
      spellbookEntitlementId?: string
      /**
       * When false, picks do not consume the main prepared-spell budget
       * (Spell Mastery / Signature Spells). Defaults to true.
       */
      countsAgainstLimit?: boolean
      /** Restrict picks to spells whose school matches (case-insensitive). */
      schools?: string[]
      /**
       * Restrict picks to spells whose castingTime equals this value
       * (e.g. `'Action'` for Spell Mastery).
       */
      castingTime?: string
      /**
       * When true, only spells with `ritual: true` are eligible
       * (e.g. Pact of the Tome level-1 rituals).
       */
      ritual?: boolean
      /** Display label override for Spells step section headers. */
      label?: string
      /**
       * Optional expanded spell list (e.g. Magical Secrets).
       * When the owning source's class level is ≥ {@link expandedFromLevel},
       * candidates resolve from this list instead of {@link listId}.
       */
      expandedListId?: string
      /** Class level at which {@link expandedListId} replaces {@link listId}. */
      expandedFromLevel?: number
      /** Optional helper copy shown under the entitlement title. */
      description?: string
    }
  | {
      id: string
      kind: 'granted'
      spells: { spellId: string; minLevel: number }[]
      countsAgainstLimit: boolean
      /** Which selection pool this grant associates with for limit accounting. */
      appliesTo?: SpellSelectionKind
    }

/** Pact Magic slot row for one class level (index = level - 1). */
export type PactMagicSlotProgression = {
  /** Number of Pact Magic slots. */
  slotCount: number
  /** Level of each Pact Magic slot. */
  slotLevel: number
}

/**
 * Rest recovery metadata for slot pools (descriptive / future play-sheet).
 * Creation-time resolvers expose this; expenditure is out of scope.
 */
export type SpellSlotRecovery = 'long-rest' | 'short-rest'

/** Expanded class spellcasting block on {@link ClassDefinition}. */
export type ClassSpellcasting = {
  ability: AbilityId
  spellListId: string
  slotContributor: SpellSlotContributor
  /**
   * Conventional spell slots by class level for single-class casting.
   * Unused when `slotContributor` is `pact` or `none`.
   * Index 0 = level 1; each entry is slot counts for spell levels 1+.
   */
  slotsByLevel: number[][]
  /** Cantrips known by class level (index = level - 1). */
  cantripsKnownByLevel: number[]
  /**
   * Prepared L1+ count by class level (index = level - 1).
   * Also used as the known-spell table when content configures known entitlements
   * with `by-source-level` pointing at a dedicated table.
   */
  preparedSpellsByLevel: number[]
  /**
   * Pact Magic progression by class level (index = level - 1).
   * Required when `slotContributor` is `pact`.
   */
  pactSlotsByLevel?: PactMagicSlotProgression[]
  /** Known L1+ spells by class level for Pact Magic / known casters. */
  spellsKnownByLevel?: number[]
  /** Slot recovery metadata (default long-rest; pact → short-rest). */
  slotRecovery?: SpellSlotRecovery
  entitlements: SpellEntitlement[]
}

/** Feat-granted spellcasting (e.g. Magic Initiate). */
export type FeatSpellcasting = {
  /**
   * Fixed spellcasting ability. Prefer `abilityFromChoiceId` when the feat
   * lets the player choose Intelligence, Wisdom, or Charisma.
   */
  ability?: AbilityId
  /** Feat choice id whose selected option id is an AbilityId. */
  abilityFromChoiceId?: string
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
 * For `selectionKind: 'spellbook'`, `selections` are spellbook entries.
 * For `prepareFrom: 'spellbook'`, prepared picks live on the prepared source
 * and must reference spells recorded on the linked spellbook source.
 * UI-only state must not live here.
 */
export type SpellSourceState = {
  source: SpellSourceRef
  selections: SpellSelection[]
}
