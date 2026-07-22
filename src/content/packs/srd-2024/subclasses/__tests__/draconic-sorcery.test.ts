import { describe, expect, it } from 'vitest'
import { draconicSorcerySrd2024 } from '../draconic-sorcery'

describe('draconicSorcerySrd2024', () => {
  it('uses stable ids linked to Sorcerer', () => {
    expect(draconicSorcerySrd2024.id).toBe('srd-2024:draconic-sorcery')
    expect(draconicSorcerySrd2024.classId).toBe('srd-2024:sorcerer')
    expect(draconicSorcerySrd2024.choiceOptionId).toBe('draconic-sorcery')
  })

  it('grants features at Draconic Sorcery levels', () => {
    expect(
      draconicSorcerySrd2024.features.map((feature) => ({
        id: feature.id,
        level: feature.level,
      })),
    ).toEqual([
      { id: 'draconic-resilience', level: 3 },
      { id: 'draconic-spells', level: 3 },
      { id: 'elemental-affinity', level: 6 },
      { id: 'dragon-wings', level: 14 },
      { id: 'dragon-companion', level: 18 },
    ])
  })

  it('attaches HP and unarmored-defense effects on Draconic Resilience', () => {
    const resilience = draconicSorcerySrd2024.features.find(
      (feature) => feature.id === 'draconic-resilience',
    )

    expect(resilience?.effects).toEqual([
      { kind: 'hit-point-maximum-per-class-level', amount: 1 },
      {
        kind: 'unarmored-defense',
        abilities: ['dexterity', 'charisma'],
      },
    ])
  })

  it('grants Draconic Spells as always-prepared entitlements', () => {
    const spells = draconicSorcerySrd2024.features.find(
      (feature) => feature.id === 'draconic-spells',
    )
    const entitlement = spells?.spellEntitlements?.[0]

    expect(entitlement).toMatchObject({
      id: 'draconic-spells',
      kind: 'granted',
      appliesTo: 'prepared',
      countsAgainstLimit: false,
    })
    expect(
      entitlement?.kind === 'granted'
        ? entitlement.spells.map((entry) => ({
            spellId: entry.spellId,
            minLevel: entry.minLevel,
          }))
        : [],
    ).toEqual([
      { spellId: 'srd-2024:alter-self', minLevel: 3 },
      { spellId: 'srd-2024:chromatic-orb', minLevel: 3 },
      { spellId: 'srd-2024:command', minLevel: 3 },
      { spellId: 'srd-2024:dragons-breath', minLevel: 3 },
      { spellId: 'srd-2024:fear', minLevel: 5 },
      { spellId: 'srd-2024:fly', minLevel: 5 },
      { spellId: 'srd-2024:arcane-eye', minLevel: 7 },
      { spellId: 'srd-2024:charm-monster', minLevel: 7 },
      { spellId: 'srd-2024:legend-lore', minLevel: 9 },
      { spellId: 'srd-2024:summon-dragon', minLevel: 9 },
    ])
  })
})
