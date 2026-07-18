import { useEffect, useState } from 'react'
import type { BackgroundCatalog } from '../domain/ports/backgroundCatalog'
import type { ClassCatalog } from '../domain/ports/classCatalog'
import type { FeatCatalog } from '../domain/ports/featCatalog'
import type { SpellCatalog } from '../domain/ports/spellCatalog'
import type { Character } from '../domain/types'
import {
  resolveCharacterSpellcasting,
  type CharacterSpellcastingSummary,
} from '../rules/character/resolveCharacterSpellcasting'

const EMPTY_SPELLCASTING: CharacterSpellcastingSummary = {
  hasSpellcastingCapability: false,
  hasSpellContent: false,
  spellLines: [],
  groups: [],
  sharedSlots: null,
  activeSources: [],
}

export function useReviewSpellcasting(
  classCatalog: ClassCatalog,
  character: Character,
  options?: {
    featCatalog?: FeatCatalog
    backgroundCatalog?: BackgroundCatalog
    spellCatalog?: SpellCatalog
  },
): CharacterSpellcastingSummary {
  const [summary, setSummary] = useState<CharacterSpellcastingSummary>(
    EMPTY_SPELLCASTING,
  )

  useEffect(() => {
    let isActive = true

    void resolveCharacterSpellcasting(classCatalog, character, options).then(
      (resolved) => {
        if (isActive) {
          setSummary(resolved)
        }
      },
    )

    return () => {
      isActive = false
    }
  }, [
    classCatalog,
    character,
    options?.featCatalog,
    options?.backgroundCatalog,
    options?.spellCatalog,
  ])

  return summary
}
