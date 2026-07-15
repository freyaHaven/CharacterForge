import type { BackgroundDefinition } from '../background/types'
import type { EditionId } from '../types'

export interface BackgroundCatalog {
  listBackgrounds(editionId: EditionId): Promise<BackgroundDefinition[]>

  getBackground(backgroundId: string): Promise<BackgroundDefinition | null>
}
