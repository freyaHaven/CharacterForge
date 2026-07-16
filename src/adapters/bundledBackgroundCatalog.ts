import type { BackgroundCatalog } from '../domain/ports/backgroundCatalog'
import type { ContentRegistry } from '../content/registry/ContentRegistry'
import { getBundledContentRegistry } from '../content/registry/bundledContent'

/**
 * BackgroundCatalog adapter over the Content Registry.
 * Application code that already depends on BackgroundCatalog keeps working unchanged.
 */
export function createBundledBackgroundCatalog(
  registry: ContentRegistry = getBundledContentRegistry(),
): BackgroundCatalog {
  return {
    async listBackgrounds(editionId) {
      return registry.listBackgrounds(editionId)
    },

    async getBackground(backgroundId) {
      return registry.getBackground(backgroundId)
    },
  }
}
