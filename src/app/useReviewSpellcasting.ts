import { useEffect, useState } from 'react'
import type { ClassCatalog } from '../domain/ports/classCatalog'
import type { Character } from '../domain/types'
import {
  resolveCharacterSpellcasting,
  type CharacterSpellcastingSummary,
} from '../rules/character/resolveCharacterSpellcasting'

const EMPTY_SPELLCASTING: CharacterSpellcastingSummary = {
  hasSpellcastingCapability: false,
  spellLines: [],
}

export function useReviewSpellcasting(
  catalog: ClassCatalog,
  character: Character,
): CharacterSpellcastingSummary {
  const [summary, setSummary] = useState<CharacterSpellcastingSummary>(
    EMPTY_SPELLCASTING,
  )

  useEffect(() => {
    let isActive = true

    void resolveCharacterSpellcasting(catalog, character).then((resolved) => {
      if (isActive) {
        setSummary(resolved)
      }
    })

    return () => {
      isActive = false
    }
  }, [catalog, character])

  return summary
}
