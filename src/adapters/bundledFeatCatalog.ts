import type { FeatCatalog } from '../domain/ports/featCatalog'
import type { EditionId } from '../domain/types'
import type { FeatDefinition } from '../domain/feat/types'
import { SRD_2024_FEATS } from '../data/feats/srd-2024/source'

const FEATS_BY_ID = new Map<string, FeatDefinition>(
  SRD_2024_FEATS.map((feat) => [feat.id, feat]),
)

const FEATS_BY_EDITION = new Map<EditionId, FeatDefinition[]>([
  ['srd-2024', [...SRD_2024_FEATS]],
  ['srd-2014', []],
])

export function createBundledFeatCatalog(): FeatCatalog {
  return {
    async listFeats(editionId) {
      return FEATS_BY_EDITION.get(editionId) ?? []
    },

    async getFeat(featId) {
      return FEATS_BY_ID.get(featId) ?? null
    },
  }
}
