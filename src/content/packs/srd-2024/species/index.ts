export { dwarfSrd2024 } from './dwarf'
export { dragonbornSrd2024, DRACONIC_ANCESTRIES } from './dragonborn'
export { elfSrd2024 } from './elf'
export { gnomeSrd2024 } from './gnome'
export { goliathSrd2024 } from './goliath'
export { halflingSrd2024 } from './halfling'
export { humanSrd2024 } from './human'
export { orcSrd2024 } from './orc'
export { tieflingSrd2024 } from './tiefling'

import { dwarfSrd2024 } from './dwarf'
import { dragonbornSrd2024 } from './dragonborn'
import { elfSrd2024 } from './elf'
import { gnomeSrd2024 } from './gnome'
import { goliathSrd2024 } from './goliath'
import { halflingSrd2024 } from './halfling'
import { humanSrd2024 } from './human'
import { orcSrd2024 } from './orc'
import { tieflingSrd2024 } from './tiefling'

/** Ordered SRD 2024 species definitions for the content pack (alphabetical). */
export const SRD_2024_SPECIES = [
  dragonbornSrd2024,
  dwarfSrd2024,
  elfSrd2024,
  gnomeSrd2024,
  goliathSrd2024,
  halflingSrd2024,
  humanSrd2024,
  orcSrd2024,
  tieflingSrd2024,
] as const
