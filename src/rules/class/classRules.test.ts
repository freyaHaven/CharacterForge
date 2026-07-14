import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../data/classes/srd-2024/fighter'
import type { ClassSelection } from '../../domain/class/types'
import { validateClassSelection } from './classRules'

function createValidFighterSelection(
  overrides: Partial<ClassSelection> = {},
): ClassSelection {
  return {
    classId: 'srd-2024:fighter',
    level: 1,
    choices: {
      'fighting-style': 'defense',
      'skill-proficiencies': ['athletics', 'perception'],
    },
    ...overrides,
  }
}

describe('validateClassSelection', () => {
  it('accepts a complete fighter selection', () => {
    expect(
      validateClassSelection(
        createValidFighterSelection(),
        'srd-2024',
        fighterSrd2024,
      ),
    ).toEqual({ ok: true })
  })

  it('rejects a missing class definition', () => {
    expect(
      validateClassSelection(createValidFighterSelection(), 'srd-2024', null),
    ).toEqual({ ok: false, issues: [{ code: 'class-not-found' }] })
  })

  it('rejects a class from the wrong edition', () => {
    expect(
      validateClassSelection(
        createValidFighterSelection(),
        'srd-2014',
        fighterSrd2024,
      ),
    ).toEqual({ ok: false, issues: [{ code: 'wrong-edition' }] })
  })

  it('requires a fighting style choice', () => {
    const result = validateClassSelection(
      createValidFighterSelection({
        choices: {
          'skill-proficiencies': ['athletics', 'perception'],
        },
      }),
      'srd-2024',
      fighterSrd2024,
    )

    expect(result).toEqual({
      ok: false,
      issues: [{ code: 'missing-required-choice', choiceId: 'fighting-style' }],
    })
  })

  it('requires exactly two skill proficiencies', () => {
    const tooFew = validateClassSelection(
      createValidFighterSelection({
        choices: {
          'fighting-style': 'archery',
          'skill-proficiencies': ['athletics'],
        },
      }),
      'srd-2024',
      fighterSrd2024,
    )

    expect(tooFew).toEqual({
      ok: false,
      issues: [
        { code: 'invalid-multi-select-count', choiceId: 'skill-proficiencies' },
      ],
    })
  })

  it('rejects unknown choice ids', () => {
    const result = validateClassSelection(
      createValidFighterSelection({
        choices: {
          'fighting-style': 'defense',
          'skill-proficiencies': ['athletics', 'perception'],
          'weapon-mastery': 'longsword',
        },
      }),
      'srd-2024',
      fighterSrd2024,
    )

    expect(result).toEqual({
      ok: false,
      issues: [{ code: 'unknown-choice', choiceId: 'weapon-mastery' }],
    })
  })
})
