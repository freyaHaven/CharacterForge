import type { ContentPack } from '../../types/contentPack'
import { SRD_2024_BACKGROUNDS } from './backgrounds'
import { barbarianSrd2024 } from './classes/barbarian'
import { fighterSrd2024 } from './classes/fighter'
import { SRD_2024_FEATS } from './feats'
import { srd2024Manifest } from './manifest'
import { SRD_2024_SPECIES } from './species'
import { berserkerSrd2024 } from './subclasses/berserker'
import { championSrd2024 } from './subclasses/champion'

/** Bundled SRD 2024 content pack — definitions only. */
export const srd2024ContentPack: ContentPack = {
  manifest: srd2024Manifest,
  classes: [fighterSrd2024, barbarianSrd2024],
  subclasses: [championSrd2024, berserkerSrd2024],
  feats: [...SRD_2024_FEATS],
  backgrounds: [...SRD_2024_BACKGROUNDS],
  species: [...SRD_2024_SPECIES],
}
