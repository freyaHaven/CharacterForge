import type { SpellCatalog } from '../domain/ports/spellCatalog'
import type { ContentRegistry } from '../content/registry/ContentRegistry'
import { getBundledContentRegistry } from '../content/registry/bundledContent'

/**
 * SpellCatalog adapter over the Content Registry.
 */
export function createBundledSpellCatalog(
  registry: ContentRegistry = getBundledContentRegistry(),
): SpellCatalog {
  return {
    async getSpell(spellId) {
      return registry.getSpell(spellId)
    },

    async listSpells(editionId) {
      return registry.listSpells(editionId)
    },

    async getSpellList(spellListId) {
      return registry.getSpellList(spellListId)
    },

    async listSpellLists() {
      return registry.listSpellLists()
    },
  }
}
