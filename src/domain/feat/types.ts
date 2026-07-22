import type { AbilityId } from '../abilities/types'
import type { ContentSource } from '../content/types'
import type { EditionId } from '../edition'
import type { DamageTypeId } from '../species/types'
import type { FeatSpellcasting } from '../spell/types'

export type { FeatSpellcasting } from '../spell/types'

export type FeatCategory =
  | 'origin'
  | 'general'
  | 'fighting-style'
  | 'epic-boon'

export type FeatChoiceOption = {
  id: string
  label: string
  description?: string
}

export type AsiScoreIncreaseMode = 'plus-2' | 'plus-1-1' | 'plus-1'

/**
 * Feat-owned sub-choices.
 *
 * - `single-select` — explicit options on the definition
 * - `multi-select` + `optionSource: 'skill-or-tool-proficiency'` — Skilled-style picks
 * - `asi-score-increase` — nested ability increases (+2 / +1+1 / +1)
 *   (same encoding as class ASI ability modes; no nested feat branch)
 */
export type FeatChoice =
  | {
      id: string
      prompt: string
      type: 'single-select'
      required: boolean
      options: FeatChoiceOption[]
    }
  | {
      id: string
      prompt: string
      type: 'multi-select'
      required: boolean
      min: number
      max: number
      optionSource: 'skill-or-tool-proficiency'
    }
  | {
      id: string
      prompt: string
      type: 'asi-score-increase'
      required: boolean
      /**
       * Allowed increase patterns. Defaults to `plus-2` and `plus-1-1`
       * (Ability Score Improvement feat). Epic Boons / Grappler use `plus-1`.
       */
      modes?: AsiScoreIncreaseMode[]
      /** Eligible abilities. Defaults to all six. */
      abilities?: AbilityId[]
      /** Score ceiling after this increase (SRD: 20 or 30). Defaults to 20. */
      maximum?: number
    }

import type { FeatRequirement } from './requirements'

export type { FeatRequirement } from './requirements'

export type FeatPrerequisite =
  | { kind: 'none' }
  | {
      kind: 'text'
      /** Short label shown on cards and in the details panel. */
      summary: string
    }
  | {
      kind: 'requirements'
      /** Short label shown on cards and in the details panel. */
      summary: string
      requirements: FeatRequirement[]
    }

export type FeatBenefit = {
  id: string
  name: string
  description: string
}

export type FeatSenseKind =
  | 'darkvision'
  | 'blindsight'
  | 'tremorsense'
  | 'truesight'

/**
 * Phase 2 creator-time feat effects only.
 *
 * Active-use / combat / temporary features (e.g. Alert Initiative Swap,
 * Great Weapon Fighting damage treatment) stay as descriptive benefit text until
 * CharacterForge has a play-sheet action system.
 *
 * Proficiency grants from multi-select choices are resolved from choice
 * selections (see resolveFeatProficiencies), not duplicated as fixed effects.
 */
export type FeatEffect =
  | { kind: 'initiative-proficiency' }
  | {
      kind: 'armor-class-bonus'
      amount: number
      /** Defense: only while wearing Light, Medium, or Heavy armour. */
      when?: 'wearing-armor'
    }
  | {
      kind: 'sense'
      sense: FeatSenseKind
      rangeFeet: number
    }
  | {
      kind: 'damage-resistance'
      /** Single damage type. Omit when using `except` (all but listed). */
      damageType?: DamageTypeId
      /** Resist all damage except these types (Night Spirit). */
      except?: DamageTypeId[]
      /** Conditional resistance — sheet shows metadata; play evaluation deferred. */
      when?: 'dim-light-or-darkness'
    }

export type FeatDefinition = {
  id: string
  editionId: EditionId
  name: string
  /** Short catalogue-card blurb. */
  summary: string
  /** Full rules text for the details panel. */
  description: string
  source: ContentSource
  category: FeatCategory
  prerequisite: FeatPrerequisite
  benefits: FeatBenefit[]
  repeatable: boolean
  choices: FeatChoice[]
  /** Mechanical creator-time effects (sheet-derived stats). */
  effects?: FeatEffect[]
  /** Present when the feat grants spell selections or known spells. */
  spellcasting?: FeatSpellcasting
}

export type FeatSelection = {
  featId: string
  /** Choice id → option id, multi-select list, or ASI score encoding. */
  choices: Record<string, string | string[]>
}
