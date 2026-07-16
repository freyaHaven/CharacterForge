import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../content/packs/srd-2024/classes/fighter'
import type { ClassDefinition } from '../../domain/class/types'
import { sortClassesForCatalog } from './sortClassesForCatalog'

function createStubClass(
  id: string,
  name: string,
  orderHint?: number,
): ClassDefinition {
  return {
    ...fighterSrd2024,
    id,
    name,
    ...(orderHint === undefined ? {} : {}),
  }
}

describe('sortClassesForCatalog', () => {
  it('orders known martial classes melee before ranged-leaning options', () => {
    const sorted = sortClassesForCatalog([
      createStubClass('srd-2024:rogue', 'Rogue'),
      createStubClass('srd-2024:artificer', 'Artificer'),
      createStubClass('srd-2024:fighter', 'Fighter'),
    ])

    expect(sorted.map((entry) => entry.name)).toEqual([
      'Fighter',
      'Rogue',
      'Artificer',
    ])
  })

  it('falls back to name order for unknown class ids', () => {
    const sorted = sortClassesForCatalog([
      createStubClass('srd-2024:zealot', 'Zealot'),
      createStubClass('srd-2024:warden', 'Warden'),
    ])

    expect(sorted.map((entry) => entry.name)).toEqual(['Warden', 'Zealot'])
  })
})
