import type { ContentSource } from '../content/types'
import type { EditionId } from '../edition'
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

export type FeatChoice = {
  id: string
  prompt: string
  type: 'single-select'
  required: boolean
  options: FeatChoiceOption[]
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
  /** Present when the feat grants spell selections or known spells. */
  spellcasting?: FeatSpellcasting
}

export type FeatSelection = {
  featId: string
  choices: Record<string, string>
}
