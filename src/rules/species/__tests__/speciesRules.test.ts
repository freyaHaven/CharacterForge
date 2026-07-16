import { beforeAll, describe, expect, it } from 'vitest'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import type { SpeciesDefinition } from '../../../domain/species/types'
import {
  needsEditionChangeSpeciesConfirmation,
  resolveSpecies,
  validateSpeciesSelection,
} from '../speciesRules'

describe('validateSpeciesSelection', () => {
  let dwarf: SpeciesDefinition
  let dragonborn: SpeciesDefinition

  beforeAll(async () => {
    const catalog = createBundledSpeciesCatalog()
    const resolvedDwarf = await catalog.getSpecies('srd-2024:dwarf')
    const resolvedDragonborn = await catalog.getSpecies('srd-2024:dragonborn')
    expect(resolvedDwarf).not.toBeNull()
    expect(resolvedDragonborn).not.toBeNull()
    dwarf = resolvedDwarf!
    dragonborn = resolvedDragonborn!
  })

  it('accepts dwarf with no choices for srd-2024', () => {
    expect(
      validateSpeciesSelection(
        { speciesId: 'srd-2024:dwarf', choices: {} },
        'srd-2024',
        dwarf,
      ),
    ).toEqual({ ok: true })
  })

  it('requires a draconic ancestry for Dragonborn', () => {
    expect(
      validateSpeciesSelection(
        { speciesId: 'srd-2024:dragonborn', choices: {} },
        'srd-2024',
        dragonborn,
      ),
    ).toEqual({
      ok: false,
      issues: [
        { code: 'missing-required-choice', choiceId: 'draconic-ancestry' },
      ],
    })
  })

  it('returns species-not-found when the definition is missing', () => {
    expect(
      validateSpeciesSelection(
        { speciesId: 'srd-2024:dwarf', choices: {} },
        'srd-2024',
        null,
      ),
    ).toEqual({ ok: false, issues: [{ code: 'species-not-found' }] })
  })

  it('returns wrong-edition when the species belongs to another edition', () => {
    expect(
      validateSpeciesSelection(
        { speciesId: 'srd-2024:dwarf', choices: {} },
        'srd-2014',
        dwarf,
      ),
    ).toEqual({ ok: false, issues: [{ code: 'wrong-edition' }] })
  })

  it('returns missing-required-choice for an unfilled required choice', () => {
    const definition: SpeciesDefinition = {
      ...dwarf,
      choices: [
        {
          id: 'language',
          prompt: 'Choose a language',
          type: 'single-select',
          required: true,
          options: [{ id: 'elvish', label: 'Elvish' }],
        },
      ],
    }

    expect(
      validateSpeciesSelection(
        { speciesId: 'srd-2024:dwarf', choices: {} },
        'srd-2024',
        definition,
      ),
    ).toEqual({
      ok: false,
      issues: [{ code: 'missing-required-choice', choiceId: 'language' }],
    })
  })
})

describe('resolveSpecies', () => {
  let dwarf: SpeciesDefinition
  let dragonborn: SpeciesDefinition

  beforeAll(async () => {
    const catalog = createBundledSpeciesCatalog()
    const resolvedDwarf = await catalog.getSpecies('srd-2024:dwarf')
    const resolvedDragonborn = await catalog.getSpecies('srd-2024:dragonborn')
    expect(resolvedDwarf).not.toBeNull()
    expect(resolvedDragonborn).not.toBeNull()
    dwarf = resolvedDwarf!
    dragonborn = resolvedDragonborn!
  })

  it('returns the definition and effects for a known species id', async () => {
    await expect(
      resolveSpecies(
        { speciesId: 'srd-2024:dwarf', choices: {} },
        async (speciesId) => (speciesId === 'srd-2024:dwarf' ? dwarf : null),
      ),
    ).resolves.toEqual({
      definition: dwarf,
      selection: { speciesId: 'srd-2024:dwarf', choices: {} },
      effects: dwarf.effects,
    })
  })

  it('resolves Red Dragonborn with Fire resistance', async () => {
    await expect(
      resolveSpecies(
        {
          speciesId: 'srd-2024:dragonborn',
          choices: { 'draconic-ancestry': 'red' },
        },
        async (speciesId) =>
          speciesId === 'srd-2024:dragonborn' ? dragonborn : null,
      ),
    ).resolves.toEqual({
      definition: dragonborn,
      selection: {
        speciesId: 'srd-2024:dragonborn',
        choices: { 'draconic-ancestry': 'red' },
      },
      effects: [
        { kind: 'darkvision', rangeFeet: 60 },
        { kind: 'damage-resistance', damageType: 'fire' },
      ],
    })
  })

  it('resolves Silver Dragonborn with Cold resistance after changing ancestry', async () => {
    await expect(
      resolveSpecies(
        {
          speciesId: 'srd-2024:dragonborn',
          choices: { 'draconic-ancestry': 'silver' },
        },
        async (speciesId) =>
          speciesId === 'srd-2024:dragonborn' ? dragonborn : null,
      ),
    ).resolves.toEqual({
      definition: dragonborn,
      selection: {
        speciesId: 'srd-2024:dragonborn',
        choices: { 'draconic-ancestry': 'silver' },
      },
      effects: [
        { kind: 'darkvision', rangeFeet: 60 },
        { kind: 'damage-resistance', damageType: 'cold' },
      ],
    })
  })

  it('returns null when the species id is unknown', async () => {
    await expect(
      resolveSpecies(
        { speciesId: 'srd-2024:missing', choices: {} },
        async () => null,
      ),
    ).resolves.toBeNull()
  })
})

describe('needsEditionChangeSpeciesConfirmation', () => {
  it('returns false when no species is selected', async () => {
    await expect(
      needsEditionChangeSpeciesConfirmation(null, 'srd-2014', async () => null),
    ).resolves.toBe(false)
  })

  it('returns true when the selected species belongs to another edition', async () => {
    const catalog = createBundledSpeciesCatalog()

    await expect(
      needsEditionChangeSpeciesConfirmation(
        { speciesId: 'srd-2024:dwarf', choices: {} },
        'srd-2014',
        (speciesId) => catalog.getSpecies(speciesId),
      ),
    ).resolves.toBe(true)
  })

  it('returns false when the selected species matches the next edition', async () => {
    const catalog = createBundledSpeciesCatalog()

    await expect(
      needsEditionChangeSpeciesConfirmation(
        { speciesId: 'srd-2024:dwarf', choices: {} },
        'srd-2024',
        (speciesId) => catalog.getSpecies(speciesId),
      ),
    ).resolves.toBe(false)
  })
})
