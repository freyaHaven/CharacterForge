import type { ClassCatalog } from '../domain/ports/classCatalog'
import type { ContentRegistry } from '../content/registry/ContentRegistry'
import { getBundledContentRegistry } from '../content/registry/bundledContent'

/**
 * ClassCatalog adapter over the Content Registry.
 * Application code that already depends on ClassCatalog keeps working unchanged.
 */
export function createBundledClassCatalog(
  registry: ContentRegistry = getBundledContentRegistry(),
): ClassCatalog {
  return {
    async listClasses(editionId) {
      return registry.listClasses(editionId)
    },

    async getClass(classId) {
      return registry.getClass(classId)
    },
  }
}
