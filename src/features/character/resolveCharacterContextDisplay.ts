import type { AbilityId } from '../../domain/abilities/types'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { Character } from '../../domain/types'
import type { WizardStepId } from '../../app/wizard/types'
import type { ClassSelectionDrafts } from '../class/classSelectionDraft'
import type { SpeciesSelectionDraft } from '../species/speciesSelectionDraft'
import { getSpeciesDisplayName } from '../species/getSpeciesDisplayName'
import { getSubclassLabelFromDefinition } from './getSubclassLabel'
import {
  buildCharacterContextDisplay,
  mergePrimaryAbilities,
  type CharacterContextClassEntry,
  type CharacterContextDisplay,
} from './characterContextDisplay'

export type ResolveCharacterContextDisplayInput = {
  character: Character
  activeStepId: WizardStepId
  speciesDraft: SpeciesSelectionDraft | null
  /** Retained for API compatibility; class context uses committed classes only. */
  classDrafts: ClassSelectionDrafts
  speciesCatalog: SpeciesCatalog
  classCatalog: ClassCatalog
}

export async function resolveCharacterContextDisplay(
  input: ResolveCharacterContextDisplayInput,
): Promise<CharacterContextDisplay> {
  const activeSpeciesSelection =
    input.speciesDraft === null
      ? input.character.species
      : {
          speciesId: input.speciesDraft.speciesId,
          choices: { ...input.speciesDraft.choices },
        }

  let speciesId: string | null = null
  let speciesName: string | null = null

  if (activeSpeciesSelection !== null) {
    speciesId = activeSpeciesSelection.speciesId
    const speciesDefinition = await input.speciesCatalog.getSpecies(
      activeSpeciesSelection.speciesId,
    )
    speciesName =
      speciesDefinition === null
        ? null
        : getSpeciesDisplayName(
            speciesDefinition,
            activeSpeciesSelection.choices,
          )
  }

  // Global Character Context reflects committed classes only. Browsing a
  // replacement class draft must not imply the character has already changed.
  const classEntries: CharacterContextClassEntry[] = []
  const primaryAbilityLists: AbilityId[][] = []

  for (const instance of input.character.classes) {
    const definition = await input.classCatalog.getClass(instance.classId)

    if (definition === null) {
      continue
    }

    classEntries.push({
      classId: definition.id,
      className: definition.name,
      level: instance.level,
      subclassLabel: getSubclassLabelFromDefinition(
        definition,
        instance.choices,
      ),
    })
    primaryAbilityLists.push(definition.primaryAbilities)
  }

  return buildCharacterContextDisplay({
    characterName: input.character.name,
    speciesId,
    speciesName,
    classEntries,
    primaryAbilities: mergePrimaryAbilities(primaryAbilityLists),
    activeStepId: input.activeStepId,
  })
}
