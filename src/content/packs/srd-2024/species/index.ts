export { dwarfSrd2024 } from './dwarf'
export { dragonbornSrd2024, DRACONIC_ANCESTRIES } from './dragonborn'

import { dwarfSrd2024 } from './dwarf'
import { dragonbornSrd2024 } from './dragonborn'

/** Ordered SRD 2024 species definitions for the content pack. */
export const SRD_2024_SPECIES = [dwarfSrd2024, dragonbornSrd2024] as const
