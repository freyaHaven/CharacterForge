import type { EditionId } from '../../domain/types'

export type EditionOption = {
  readonly id: EditionId
  readonly label: string
}

export const EDITION_OPTIONS: readonly EditionOption[] = [
  { id: 'srd-2014', label: 'D&D 5e 2014' },
  { id: 'srd-2024', label: 'D&D 5e 2024' },
]
