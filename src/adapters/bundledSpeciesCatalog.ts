import type { SpeciesCatalog } from '../domain/ports/speciesCatalog'
import type { EditionId } from '../domain/types'
import type { SpeciesDefinition } from '../domain/species/types'
import { dragonbornSrd2024 } from '../data/species/srd-2024/dragonborn'
import { dwarfSrd2024 } from '../data/species/srd-2024/dwarf'

const SPECIES_BY_ID = new Map<string, SpeciesDefinition>(
  [dwarfSrd2024, dragonbornSrd2024].map((species) => [species.id, species]),
)

const SPECIES_BY_EDITION = new Map<EditionId, SpeciesDefinition[]>([
  ['srd-2024', [dwarfSrd2024, dragonbornSrd2024]],
  ['srd-2014', []],
])

export function createBundledSpeciesCatalog(): SpeciesCatalog {
  return {
    async listSpecies(editionId) {
      return SPECIES_BY_EDITION.get(editionId) ?? []
    },

    async getSpecies(speciesId) {
      return SPECIES_BY_ID.get(speciesId) ?? null
    },
  }
}
