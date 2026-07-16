import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../bundledBackgroundCatalog'

describe('createBundledBackgroundCatalog', () => {
  const catalog = createBundledBackgroundCatalog()

  it('lists SRD 2024 backgrounds with stable ids', async () => {
    const backgrounds = await catalog.listBackgrounds('srd-2024')

    expect(backgrounds.map((entry) => entry.id)).toEqual([
      'srd-2024:acolyte',
      'srd-2024:criminal',
      'srd-2024:sage',
      'srd-2024:soldier',
    ])
  })

  it('returns an empty list for srd-2014', async () => {
    await expect(catalog.listBackgrounds('srd-2014')).resolves.toEqual([])
  })

  it('resolves Soldier with canonical origin feat and equipment ids', async () => {
    const soldier = await catalog.getBackground('srd-2024:soldier')

    expect(soldier).not.toBeNull()
    expect(soldier?.name).toBe('Soldier')
    expect(soldier?.originFeat).toMatchObject({
      id: 'savage-attacker',
      featId: 'srd-2024:savage-attacker',
    })
    expect(soldier?.equipment.choiceId).toBe('starting-equipment')
    expect(soldier?.equipment.packages[0]?.id).toBe('equipment-package')
    expect(soldier?.equipment.goldAlternative.goldPieces).toBe(50)
  })

  it('returns null for an unknown background id', async () => {
    await expect(catalog.getBackground('srd-2024:unknown')).resolves.toBeNull()
    await expect(catalog.getBackground('srd-2014:soldier')).resolves.toBeNull()
  })
})
