import type { BackgroundCatalog } from '../domain/ports/backgroundCatalog'
import type { EditionId } from '../domain/types'
import type { BackgroundDefinition } from '../domain/background/types'
import { SRD_2024_BACKGROUNDS } from '../data/backgrounds/srd-2024/source'

const BACKGROUNDS_BY_ID = new Map<string, BackgroundDefinition>(
  SRD_2024_BACKGROUNDS.map((background) => [background.id, background]),
)

const BACKGROUNDS_BY_EDITION = new Map<EditionId, BackgroundDefinition[]>([
  ['srd-2024', [...SRD_2024_BACKGROUNDS]],
  ['srd-2014', []],
])

export function createBundledBackgroundCatalog(): BackgroundCatalog {
  return {
    async listBackgrounds(editionId) {
      return BACKGROUNDS_BY_EDITION.get(editionId) ?? []
    },

    async getBackground(backgroundId) {
      return BACKGROUNDS_BY_ID.get(backgroundId) ?? null
    },
  }
}
