import { describe, expect, it } from 'vitest'
import { createBundledFeatCatalog } from '../bundledFeatCatalog'

describe('createBundledFeatCatalog', () => {
  const catalog = createBundledFeatCatalog()

  it('lists bundled feats for srd-2024', async () => {
    const feats = await catalog.listFeats('srd-2024')

    expect(feats.map((entry) => entry.id)).toEqual([
      'srd-2024:ability-score-improvement',
      'srd-2024:alert',
      'srd-2024:archery',
      'srd-2024:boon-of-combat-prowess',
      'srd-2024:boon-of-dimensional-travel',
      'srd-2024:boon-of-fate',
      'srd-2024:boon-of-irresistible-offense',
      'srd-2024:boon-of-spell-recall',
      'srd-2024:boon-of-the-night-spirit',
      'srd-2024:boon-of-truesight',
      'srd-2024:defense',
      'srd-2024:grappler',
      'srd-2024:great-weapon-fighting',
      'srd-2024:magic-initiate-cleric',
      'srd-2024:magic-initiate-wizard',
      'srd-2024:savage-attacker',
      'srd-2024:skilled',
      'srd-2024:two-weapon-fighting',
    ])
  })

  it('returns an empty list for srd-2014', async () => {
    await expect(catalog.listFeats('srd-2014')).resolves.toEqual([])
  })

  it('gets Alert by stable id', async () => {
    const alert = await catalog.getFeat('srd-2024:alert')

    expect(alert).not.toBeNull()
    expect(alert?.name).toBe('Alert')
    expect(alert?.category).toBe('origin')
    expect(alert?.summary).toBe('Always on the lookout for danger.')
    expect(alert?.prerequisite).toEqual({ kind: 'none' })
    expect(alert?.benefits.map((benefit) => benefit.name)).toEqual([
      'Initiative Proficiency',
      'Initiative Swap',
    ])
    expect(alert?.choices).toEqual([])
  })

  it('returns null for an unknown feat id', async () => {
    await expect(catalog.getFeat('srd-2024:unknown')).resolves.toBeNull()
    await expect(catalog.getFeat('srd-2014:alert')).resolves.toBeNull()
  })
})
