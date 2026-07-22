import type { UserEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/react'

/** Completes the SRD 5.2.1 origin language choice (Common + 2 Standard). */
export async function selectStandardLanguages(
  user: UserEvent,
  labels: readonly [RegExp, RegExp] = [/dwarvish/i, /elvish/i],
) {
  const languagesTrigger = screen.getByRole('button', { name: /^languages/i })
  if (languagesTrigger.getAttribute('aria-expanded') !== 'true') {
    await user.click(languagesTrigger)
  }

  for (const label of labels) {
    await user.click(screen.getByRole('checkbox', { name: label }))
  }
}

export const COMPLETE_DWARF_SELECTION = {
  speciesId: 'srd-2024:dwarf',
  choices: {
    'standard-languages': ['dwarvish', 'elvish'],
  },
} as const

export const COMPLETE_DRAGONBORN_RED_SELECTION = {
  speciesId: 'srd-2024:dragonborn',
  choices: {
    'draconic-ancestry': 'red',
    'standard-languages': ['draconic', 'common-sign'],
  },
} as const

/** Pre-Phase-1 Human: size + languages only (missing Skillful / Versatile). */
export const PRE_PHASE1_HUMAN_SELECTION = {
  speciesId: 'srd-2024:human',
  choices: {
    size: 'medium',
    'standard-languages': ['dwarvish', 'elvish'],
  },
} as const

export const COMPLETE_HUMAN_SELECTION = {
  speciesId: 'srd-2024:human',
  choices: {
    size: 'medium',
    skillful: 'perception',
    versatile: 'srd-2024:skilled',
    'feat-choices:versatile:skill-or-tool-proficiencies': [
      'skill:athletics',
      'skill:insight',
      'tool:thieves-tools',
    ],
    'standard-languages': ['dwarvish', 'elvish'],
  },
} as const

export const COMPLETE_WOOD_ELF_SELECTION = {
  speciesId: 'srd-2024:elf',
  choices: {
    'elven-lineage': 'wood-elf',
    'keen-senses': 'perception',
    'spellcasting-ability': 'wisdom',
    'standard-languages': ['elvish', 'dwarvish'],
  },
} as const
