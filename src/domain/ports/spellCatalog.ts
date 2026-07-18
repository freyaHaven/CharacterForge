import type { EditionId } from '../types'
import type {
  SpellDefinition,
  SpellListDefinition,
} from '../spell/types'

export interface SpellCatalog {
  getSpell(spellId: string): Promise<SpellDefinition | null>
  listSpells(editionId: EditionId): Promise<SpellDefinition[]>
  getSpellList(spellListId: string): Promise<SpellListDefinition | null>
  listSpellLists(): Promise<SpellListDefinition[]>
}
