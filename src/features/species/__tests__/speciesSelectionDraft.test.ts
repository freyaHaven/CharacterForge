import { beforeAll, describe, expect, it } from 'vitest'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import type { SpeciesDefinition } from '../../../domain/species/types'
import {
  createSpeciesSelectionDraft,
  draftToSpeciesSelection,
  isSpeciesDraftIncomplete,
  tryCommitSpeciesDraft,
  updateSpeciesDraftChoice,
} from '../speciesSelectionDraft'

describe('speciesSelectionDraft', () => {
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

  it('keeps an incomplete Dragonborn draft from committing', () => {
    const draft = createSpeciesSelectionDraft('srd-2024:dragonborn')

    expect(tryCommitSpeciesDraft(draft, 'srd-2024', dragonborn)).toEqual({
      committed: null,
      validation: {
        ok: false,
        issues: [
          { code: 'missing-required-choice', choiceId: 'draconic-ancestry' },
          { code: 'missing-required-choice', choiceId: 'standard-languages' },
        ],
      },
    })
  })

  it('keeps Dwarf from committing until languages are chosen', () => {
    const draft = createSpeciesSelectionDraft('srd-2024:dwarf')

    expect(tryCommitSpeciesDraft(draft, 'srd-2024', dwarf)).toEqual({
      committed: null,
      validation: {
        ok: false,
        issues: [
          { code: 'missing-required-choice', choiceId: 'standard-languages' },
        ],
      },
    })
  })

  it('commits Dwarf once standard languages are chosen', () => {
    const draft = updateSpeciesDraftChoice(
      createSpeciesSelectionDraft('srd-2024:dwarf'),
      'standard-languages',
      ['dwarvish', 'elvish'],
    )

    expect(tryCommitSpeciesDraft(draft, 'srd-2024', dwarf)).toEqual({
      committed: {
        speciesId: 'srd-2024:dwarf',
        choices: { 'standard-languages': ['dwarvish', 'elvish'] },
      },
      validation: { ok: true },
    })
  })

  it('commits Dragonborn once ancestry and languages are chosen', () => {
    const draft = updateSpeciesDraftChoice(
      updateSpeciesDraftChoice(
        createSpeciesSelectionDraft('srd-2024:dragonborn'),
        'draconic-ancestry',
        'red',
      ),
      'standard-languages',
      ['draconic', 'common-sign'],
    )

    expect(tryCommitSpeciesDraft(draft, 'srd-2024', dragonborn)).toEqual({
      committed: {
        speciesId: 'srd-2024:dragonborn',
        choices: {
          'draconic-ancestry': 'red',
          'standard-languages': ['draconic', 'common-sign'],
        },
      },
      validation: { ok: true },
    })
  })

  it('clears committed selection when a required choice is removed', () => {
    const draft = updateSpeciesDraftChoice(
      updateSpeciesDraftChoice(
        updateSpeciesDraftChoice(
          createSpeciesSelectionDraft('srd-2024:dragonborn'),
          'draconic-ancestry',
          'red',
        ),
        'standard-languages',
        ['draconic', 'common-sign'],
      ),
      'draconic-ancestry',
      undefined,
    )

    expect(
      tryCommitSpeciesDraft(draft, 'srd-2024', dragonborn).committed,
    ).toBeNull()
  })

  it('marks incomplete drafts when nothing is committed', () => {
    const draft = createSpeciesSelectionDraft('srd-2024:dragonborn')

    expect(isSpeciesDraftIncomplete(draft, null)).toBe(true)
    expect(
      isSpeciesDraftIncomplete(
        null,
        draftToSpeciesSelection(
          updateSpeciesDraftChoice(draft, 'draconic-ancestry', 'silver'),
        ),
      ),
    ).toBe(false)
  })
})
