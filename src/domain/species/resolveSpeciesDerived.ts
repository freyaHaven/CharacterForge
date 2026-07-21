import type { AbilityId } from '../abilities/types'
import { isAbilityId } from '../abilities/types'
import type {
  SpeciesDefinition,
  SpeciesSelection,
  SpeciesSpellcasting,
} from './types'
import {
  SPECIES_SPELLCASTING_ABILITY_CHOICE_ID,
  SPECIES_VERSATILE_CHOICE_ID,
} from './types'

export function getSpeciesVersatileFeatId(
  selection: SpeciesSelection | null | undefined,
): string | null {
  if (selection === null || selection === undefined) {
    return null
  }

  const value = selection.choices[SPECIES_VERSATILE_CHOICE_ID]
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function getSpeciesSpellcastingAbility(
  selection: SpeciesSelection,
): AbilityId {
  const value = selection.choices[SPECIES_SPELLCASTING_ABILITY_CHOICE_ID]
  if (typeof value === 'string' && isAbilityId(value)) {
    return value
  }

  return 'charisma'
}

export type SpeciesSpellcastingSourceBlock = {
  /** Used as SpellSourceRef.traitId (trait id or choice id). */
  traitId: string
  label: string
  spellcasting: SpeciesSpellcasting
}

/**
 * Collects spellcasting blocks from traits and the selected lineage/legacy options.
 */
export function collectSpeciesSpellcastingBlocks(
  definition: SpeciesDefinition,
  selection: SpeciesSelection,
): SpeciesSpellcastingSourceBlock[] {
  const blocks: SpeciesSpellcastingSourceBlock[] = []

  for (const trait of definition.traits) {
    if (trait.spellcasting === undefined) {
      continue
    }

    blocks.push({
      traitId: trait.id,
      label: trait.name,
      spellcasting: trait.spellcasting,
    })
  }

  for (const choice of definition.choices) {
    if (choice.type !== 'single-select') {
      continue
    }

    const selectedOptionId = selection.choices[choice.id]
    if (typeof selectedOptionId !== 'string') {
      continue
    }

    const option = choice.options.find(
      (candidate) => candidate.id === selectedOptionId,
    )
    if (option?.spellcasting === undefined) {
      continue
    }

    blocks.push({
      traitId: choice.id,
      label: option.label,
      spellcasting: option.spellcasting,
    })
  }

  return blocks
}
