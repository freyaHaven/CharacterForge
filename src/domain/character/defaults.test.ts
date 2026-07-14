import { describe, expect, it } from 'vitest'
import { DEFAULT_EDITION_ID } from '../edition'
import { createDefaultCharacter } from './defaults'

describe('createDefaultCharacter', () => {
  it('uses the default edition for a brand-new character', () => {
    expect(createDefaultCharacter().editionId).toBe(DEFAULT_EDITION_ID)
    expect(createDefaultCharacter().editionId).toBe('srd-2024')
  })

  it('allows overriding individual fields', () => {
    expect(
      createDefaultCharacter({ editionId: 'srd-2014', name: 'Test' }),
    ).toEqual(
      expect.objectContaining({
        editionId: 'srd-2014',
        name: 'Test',
      }),
    )
  })
})
