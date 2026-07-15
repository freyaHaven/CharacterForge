import { useEffect, useState } from 'react'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { Character } from '../../domain/types'
import type { WizardStepId } from '../../app/wizard/types'
import type { ClassSelectionDrafts } from '../class/classSelectionDraft'
import type { SpeciesSelectionDraft } from '../species/speciesSelectionDraft'
import type { CharacterContextDisplay } from './characterContextDisplay'
import {
  buildCharacterContextDisplay,
  type CharacterContextDisplayInput,
} from './characterContextDisplay'
import { resolveCharacterContextDisplay } from './resolveCharacterContextDisplay'

export type UseCharacterContextDisplayInput = {
  character: Character
  activeStepId: WizardStepId
  speciesDraft: SpeciesSelectionDraft | null
  classDrafts: ClassSelectionDrafts
  speciesCatalog: SpeciesCatalog
  classCatalog: ClassCatalog
}

function createFallbackDisplay(
  input: UseCharacterContextDisplayInput,
): CharacterContextDisplay {
  const fallbackInput: CharacterContextDisplayInput = {
    characterName: input.character.name,
    speciesName: null,
    targetLevel: input.character.targetLevel,
    classEntries: [],
    primaryAbilities: [],
    activeStepId: input.activeStepId,
  }

  return buildCharacterContextDisplay(fallbackInput)
}

export function useCharacterContextDisplay(
  input: UseCharacterContextDisplayInput,
): CharacterContextDisplay {
  const [display, setDisplay] = useState<CharacterContextDisplay>(() =>
    createFallbackDisplay(input),
  )

  useEffect(() => {
    let isActive = true

    setDisplay(createFallbackDisplay(input))

    void resolveCharacterContextDisplay(input).then((resolved) => {
      if (isActive) {
        setDisplay(resolved)
      }
    })

    return () => {
      isActive = false
    }
  }, [
    input.activeStepId,
    input.character,
    input.classCatalog,
    input.classDrafts,
    input.speciesCatalog,
    input.speciesDraft,
  ])

  return display
}
