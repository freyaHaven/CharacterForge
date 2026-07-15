import type { FeatDefinition } from '../feat/types'
import type { EditionId } from '../types'

export interface FeatCatalog {
  listFeats(editionId: EditionId): Promise<FeatDefinition[]>

  getFeat(featId: string): Promise<FeatDefinition | null>
}
