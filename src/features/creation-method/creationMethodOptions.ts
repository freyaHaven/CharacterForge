import type { CharacterCreationMethod } from '../../domain/types'

export type CreationMethodOption = {
  readonly id: CharacterCreationMethod
  readonly label: string
  readonly description: string
}

export const CREATION_METHOD_OPTIONS: readonly CreationMethodOption[] = [
  {
    id: 'manual',
    label: 'Manual',
    description: 'Enter each ability score yourself.',
  },
  {
    id: 'standard-array',
    label: 'Standard Array',
    description: 'Assign the fixed scores 15, 14, 13, 12, 10, and 8 once each.',
  },
  {
    id: 'point-buy',
    label: 'Point Buy',
    description: 'Spend a shared budget to raise scores between 8 and 15.',
  },
  {
    id: 'rolled',
    label: 'Rolled',
    description: 'Generate or enter six rolls, then assign each result once.',
  },
]
