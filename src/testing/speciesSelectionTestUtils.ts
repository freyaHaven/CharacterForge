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
