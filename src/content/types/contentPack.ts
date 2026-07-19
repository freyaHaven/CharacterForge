import type { BackgroundDefinition } from '../../domain/background/types'
import type { ClassDefinition, SubclassDefinition } from '../../domain/class/types'
import type { ContentSource } from '../../domain/content/types'
import type { EditionId } from '../../domain/edition'
import type { EquipmentItemDefinition } from '../../domain/equipment/types'
import type { FeatDefinition } from '../../domain/feat/types'
import type {
  SpellDefinition,
  SpellListDefinition,
} from '../../domain/spell/types'
import type { SpeciesDefinition } from '../../domain/species/types'

export type ContentPackManifest = {
  id: string
  name: string
  version: string
  editionId: EditionId
  description?: string
  source: ContentSource
}

/**
 * Bundled game content. Packs contain definitions only — no UI or engine logic.
 * Optional collections may be omitted until that content family is authored.
 */
export type ContentPack = {
  manifest: ContentPackManifest
  classes?: ClassDefinition[]
  subclasses?: SubclassDefinition[]
  species?: SpeciesDefinition[]
  backgrounds?: BackgroundDefinition[]
  feats?: FeatDefinition[]
  spells?: SpellDefinition[]
  spellLists?: SpellListDefinition[]
  equipment?: EquipmentItemDefinition[]
}
