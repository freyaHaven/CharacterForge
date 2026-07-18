import { useEffect, useState } from 'react'
import type { SpellCatalog } from '../domain/ports/spellCatalog'
import type { Character } from '../domain/types'
import type { CharacterSpellcastingSummary } from '../rules/character/resolveCharacterSpellcasting'
import {
  validateSpellSourceStates,
  type SpellValidationResult,
} from '../rules/spell/validateSpellSourceStates'

export function useSpellsStepValidation(
  summary: CharacterSpellcastingSummary,
  character: Character,
  spellCatalog: SpellCatalog | undefined,
): {
  spellValidation: SpellValidationResult | null
  committedSpellsValid: boolean
} {
  const [spellValidation, setSpellValidation] =
    useState<SpellValidationResult | null>(null)

  useEffect(() => {
    if (spellCatalog === undefined || !summary.hasSpellContent) {
      setSpellValidation(null)
      return
    }

    let isActive = true

    void validateSpellSourceStates(
      summary,
      character.spellSourceStates,
      spellCatalog,
    ).then((result) => {
      if (isActive) {
        setSpellValidation(result)
      }
    })

    return () => {
      isActive = false
    }
  }, [summary, character.spellSourceStates, spellCatalog])

  const committedSpellsValid =
    !summary.hasSpellContent ||
    spellValidation === null ||
    spellValidation.ok

  return { spellValidation, committedSpellsValid }
}
