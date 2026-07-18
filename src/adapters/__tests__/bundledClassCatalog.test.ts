import { describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../bundledClassCatalog'

describe('createBundledClassCatalog', () => {
  it('lists the bundled 2024 fighter for the srd-2024 edition', async () => {
    const catalog = createBundledClassCatalog()
    const classes = await catalog.listClasses('srd-2024')

    expect(classes.map((entry) => entry.id)).toEqual([
      'srd-2024:fighter',
      'srd-2024:barbarian',
      'srd-2024:rogue',
      'srd-2024:monk',
      'srd-2024:ranger',
      'srd-2024:paladin',
      'srd-2024:cleric',
    ])
  })

  it('resolves a class by stable id', async () => {
    const catalog = createBundledClassCatalog()

    expect(await catalog.getClass('srd-2024:fighter')).toMatchObject({
      name: 'Fighter',
      editionId: 'srd-2024',
    })
    expect(await catalog.getClass('srd-2014:fighter')).toBeNull()
    expect(await catalog.getClass('missing')).toBeNull()
  })

  it('lists an empty 2014 catalogue until edition data is bundled', async () => {
    const catalog = createBundledClassCatalog()

    expect(await catalog.listClasses('srd-2014')).toEqual([])
    expect(await catalog.getClass('srd-2014:fighter')).toBeNull()
  })
})
