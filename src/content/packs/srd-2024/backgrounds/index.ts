export { acolyteSrd2024 } from './acolyte'
export { criminalSrd2024 } from './criminal'
export { sageSrd2024 } from './sage'
export { soldierSrd2024 } from './soldier'

import { acolyteSrd2024 } from './acolyte'
import { criminalSrd2024 } from './criminal'
import { sageSrd2024 } from './sage'
import { soldierSrd2024 } from './soldier'

/** Ordered SRD 2024 background definitions for the content pack. */
export const SRD_2024_BACKGROUNDS = [
  acolyteSrd2024,
  criminalSrd2024,
  sageSrd2024,
  soldierSrd2024,
] as const
