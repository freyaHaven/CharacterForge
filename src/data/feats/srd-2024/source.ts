export { alertSrd2024 } from './alert'
export { magicInitiateClericSrd2024 } from './magic-initiate-cleric'
export { magicInitiateWizardSrd2024 } from './magic-initiate-wizard'
export { savageAttackerSrd2024 } from './savage-attacker'

import { alertSrd2024 } from './alert'
import { magicInitiateClericSrd2024 } from './magic-initiate-cleric'
import { magicInitiateWizardSrd2024 } from './magic-initiate-wizard'
import { savageAttackerSrd2024 } from './savage-attacker'

export const SRD_2024_FEATS = [
  alertSrd2024,
  magicInitiateClericSrd2024,
  magicInitiateWizardSrd2024,
  savageAttackerSrd2024,
] as const
