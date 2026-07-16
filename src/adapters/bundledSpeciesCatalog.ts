import type { SpeciesCatalog } from '../domain/ports/speciesCatalog'
import type { ContentRegistry } from '../content/registry/ContentRegistry'
import { getBundledContentRegistry } from '../content/registry/bundledContent'

/**
 * SpeciesCatalog adapter over the Content Registry.
 * Application code that already depends on SpeciesCatalog keeps working unchanged.
 */
export function createBundledSpeciesCatalog(
  registry: ContentRegistry = getBundledContentRegistry(),
): SpeciesCatalog {
  return {
    async listSpecies(editionId) {
      return registry.listSpecies(editionId)
    },

    async getSpecies(speciesId) {
      return registry.getSpecies(speciesId)
    },
  }
}
