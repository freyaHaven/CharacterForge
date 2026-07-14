import type { EditionId } from '../types'
import type { SpeciesDefinition } from '../species/types'

export interface SpeciesCatalog {
  listSpecies(editionId: EditionId): Promise<SpeciesDefinition[]>

  getSpecies(speciesId: string): Promise<SpeciesDefinition | null>
}
