import type { CharacterCreationMethod } from '../../domain/types'

export type CreationMethodOption = {
  readonly id: CharacterCreationMethod
  readonly label: string
}

export const CREATION_METHOD_OPTIONS: readonly CreationMethodOption[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'standard-array', label: 'Standard Array' },
  { id: 'point-buy', label: 'Point Buy' },
  { id: 'rolled', label: 'Rolled' },
]
