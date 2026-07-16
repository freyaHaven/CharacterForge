import type { FeatCatalog } from '../domain/ports/featCatalog'
import type { ContentRegistry } from '../content/registry/ContentRegistry'
import { getBundledContentRegistry } from '../content/registry/bundledContent'

/**
 * FeatCatalog adapter over the Content Registry.
 * Application code that already depends on FeatCatalog keeps working unchanged.
 */
export function createBundledFeatCatalog(
  registry: ContentRegistry = getBundledContentRegistry(),
): FeatCatalog {
  return {
    async listFeats(editionId) {
      return registry.listFeats(editionId)
    },

    async getFeat(featId) {
      return registry.getFeat(featId)
    },
  }
}
