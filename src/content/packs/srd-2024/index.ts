import type { ContentPack } from '../../types/contentPack'
import { SRD_2024_BACKGROUNDS } from './backgrounds'
import { barbarianSrd2024 } from './classes/barbarian'
import { bardSrd2024 } from './classes/bard'
import { clericSrd2024 } from './classes/cleric'
import { druidSrd2024 } from './classes/druid'
import { fighterSrd2024 } from './classes/fighter'
import { monkSrd2024 } from './classes/monk'
import { paladinSrd2024 } from './classes/paladin'
import { rangerSrd2024 } from './classes/ranger'
import { rogueSrd2024 } from './classes/rogue'
import { sorcererSrd2024 } from './classes/sorcerer'
import { warlockSrd2024 } from './classes/warlock'
import { wizardSrd2024 } from './classes/wizard'
import { SRD_2024_EQUIPMENT } from './equipment'
import { SRD_2024_FEATS } from './feats'
import { srd2024Manifest } from './manifest'
import { SRD_2024_SPELL_LISTS } from './spell-lists'
import { SRD_2024_SPELLS } from './spells'
import { SRD_2024_SPECIES } from './species'
import { berserkerSrd2024 } from './subclasses/berserker'
import { championSrd2024 } from './subclasses/champion'
import { circleOfTheLandSrd2024 } from './subclasses/circle-of-the-land'
import { collegeOfLoreSrd2024 } from './subclasses/college-of-lore'
import { devotionSrd2024 } from './subclasses/devotion'
import { draconicSorcerySrd2024 } from './subclasses/draconic-sorcery'
import { evokerSrd2024 } from './subclasses/evoker'
import { fiendPatronSrd2024 } from './subclasses/fiend-patron'
import { hunterSrd2024 } from './subclasses/hunter'
import { lifeDomainSrd2024 } from './subclasses/life-domain'
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
    clericSrd2024,
    druidSrd2024,
    wizardSrd2024,
    bardSrd2024,
    sorcererSrd2024,
    warlockSrd2024,
  ],
  subclasses: [
    championSrd2024,
    berserkerSrd2024,
    thiefSrd2024,
    openHandSrd2024,
    hunterSrd2024,
    devotionSrd2024,
    lifeDomainSrd2024,
    circleOfTheLandSrd2024,
    evokerSrd2024,
    collegeOfLoreSrd2024,
    draconicSorcerySrd2024,
    fiendPatronSrd2024,
  ],
  feats: [...SRD_2024_FEATS],
  backgrounds: [...SRD_2024_BACKGROUNDS],
  species: [...SRD_2024_SPECIES],
  spells: [...SRD_2024_SPELLS],
  spellLists: [...SRD_2024_SPELL_LISTS],
  equipment: [...SRD_2024_EQUIPMENT],
}
