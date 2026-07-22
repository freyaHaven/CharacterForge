import { describe, expect, it } from 'vitest'
import { fiendPatronSrd2024 } from '../fiend-patron'
import { warlockSrd2024 } from '../../classes/warlock'
import { subclassToChoiceOption } from '../../../../../domain/class/subclassDefinition'

describe('fiendPatronSrd2024', () => {
  it('uses stable ids and links to Warlock', () => {
    expect(fiendPatronSrd2024.id).toBe('srd-2024:fiend-patron')
    expect(fiendPatronSrd2024.classId).toBe('srd-2024:warlock')
    expect(fiendPatronSrd2024.choiceOptionId).toBe('fiend')
  })

  it('is the Warlock subclass option', () => {
    const subclass = warlockSrd2024.choices.find(
      (choice) => choice.id === 'warlock-subclass',
    )
    expect(subclass?.type === 'single-select' ? subclass.options : []).toEqual([
      subclassToChoiceOption(fiendPatronSrd2024),
    ])
  })

  it('grants Fiend features at 3/6/10/14', () => {
    expect(
      fiendPatronSrd2024.features.map((feature) => ({
        id: feature.id,
        level: feature.level,
      })),
    ).toEqual([
      { id: 'dark-ones-blessing', level: 3 },
      { id: 'fiend-spells', level: 3 },
      { id: 'dark-ones-own-luck', level: 6 },
      { id: 'fiendish-resilience', level: 10 },
      { id: 'hurl-through-hell', level: 14 },
    ])
  })

  it('always-prepares Fiend Spells at the SRD levels', () => {
    const entitlement = fiendPatronSrd2024.features.find(
      (feature) => feature.id === 'fiend-spells',
    )?.spellEntitlements?.[0]

    expect(entitlement).toMatchObject({
      kind: 'granted',
      countsAgainstLimit: false,
      appliesTo: 'prepared',
    })
    expect(entitlement?.kind === 'granted' ? entitlement.spells : []).toEqual([
      { spellId: 'srd-2024:burning-hands', minLevel: 3 },
      { spellId: 'srd-2024:command', minLevel: 3 },
      { spellId: 'srd-2024:scorching-ray', minLevel: 3 },
      { spellId: 'srd-2024:suggestion', minLevel: 3 },
      { spellId: 'srd-2024:fireball', minLevel: 5 },
      { spellId: 'srd-2024:stinking-cloud', minLevel: 5 },
      { spellId: 'srd-2024:fire-shield', minLevel: 7 },
      { spellId: 'srd-2024:wall-of-fire', minLevel: 7 },
      { spellId: 'srd-2024:geas', minLevel: 9 },
      { spellId: 'srd-2024:insect-plague', minLevel: 9 },
    ])
  })
})
