import type { ContentPack } from '../../types/contentPack'
import { SRD_2024_BACKGROUNDS } from './backgrounds'
import { barbarianSrd2024 } from './classes/barbarian'
import { fighterSrd2024 } from './classes/fighter'
import { monkSrd2024 } from './classes/monk'
import { paladinSrd2024 } from './classes/paladin'
import { rangerSrd2024 } from './classes/ranger'
import { rogueSrd2024 } from './classes/rogue'
import { SRD_2024_FEATS } from './feats'
import { srd2024Manifest } from './manifest'
import { SRD_2024_SPECIES } from './species'
import { berserkerSrd2024 } from './subclasses/berserker'
import { championSrd2024 } from './subclasses/champion'
import { devotionSrd2024 } from './subclasses/devotion'
import { hunterSrd2024 } from './subclasses/hunter'
import { openHandSrd2024 } from './subclasses/open-hand'
import { thiefSrd2024 } from './subclasses/thief'

/** Bundled SRD 2024 content pack — definitions only. */
export const srd2024ContentPack: ContentPack = {
  manifest: srd2024Manifest,
  classes: [
    fighterSrd2024,
    barbarianSrd2024,
    rogueSrd2024,
    monkSrd2024,
    rangerSrd2024,
    paladinSrd2024,
  ],
  subclasses: [
    championSrd2024,
    berserkerSrd2024,
    thiefSrd2024,
    openHandSrd2024,
    hunterSrd2024,
    devotionSrd2024,
  ],
  feats: [...SRD_2024_FEATS],
  backgrounds: [...SRD_2024_BACKGROUNDS],
  species: [...SRD_2024_SPECIES],
}
