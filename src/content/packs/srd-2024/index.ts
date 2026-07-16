import type { ContentPack } from '../../types/contentPack'
import { barbarianSrd2024 } from './classes/barbarian'
import { fighterSrd2024 } from './classes/fighter'
import { srd2024Manifest } from './manifest'
import { berserkerSrd2024 } from './subclasses/berserker'
import { championSrd2024 } from './subclasses/champion'

/** Bundled SRD 2024 content pack — definitions only. */
export const srd2024ContentPack: ContentPack = {
  manifest: srd2024Manifest,
  classes: [fighterSrd2024, barbarianSrd2024],
  subclasses: [championSrd2024, berserkerSrd2024],
}
