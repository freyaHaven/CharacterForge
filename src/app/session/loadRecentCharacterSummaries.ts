import type { CharacterRepository } from '../../domain/ports/characterRepository'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import { getSpeciesDisplayName } from '../../features/species/getSpeciesDisplayName'
import type { RecentCharactersStore } from './recentCharacters'
import type { RecentCharacterSummary } from './recentCharacterDisplay'

export type LoadRecentCharacterSummariesOptions = {
  recentStore: RecentCharactersStore
  repository: CharacterRepository
  speciesCatalog: SpeciesCatalog
  classCatalog: ClassCatalog
}

export async function loadRecentCharacterSummaries(
  options: LoadRecentCharacterSummariesOptions,
): Promise<RecentCharacterSummary[]> {
  const entries = options.recentStore.list()
  const summaries: RecentCharacterSummary[] = []

  for (const entry of entries) {
    const character = await options.repository.load(entry.id)

    if (character === null) {
      options.recentStore.remove(entry.id)
      continue
    }

    let speciesName: string | null = null
    if (character.species !== null) {
      const speciesDefinition = await options.speciesCatalog.getSpecies(
        character.species.speciesId,
      )
      speciesName =
        speciesDefinition === null
          ? null
          : getSpeciesDisplayName(speciesDefinition, character.species.choices)
    }

    const classes: RecentCharacterSummary['classes'] = []
    for (const instance of character.classes) {
      const classDefinition = await options.classCatalog.getClass(
        instance.classId,
      )
      if (classDefinition === null) {
        continue
      }
      classes.push({
        className: classDefinition.name,
        level: instance.level,
      })
    }

    summaries.push({
      id: character.id,
      name: character.name,
      speciesName,
      classes,
      updatedAt: entry.updatedAt,
    })
  }

  return summaries
}
