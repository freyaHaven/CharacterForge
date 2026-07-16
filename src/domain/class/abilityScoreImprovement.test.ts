import { describe, expect, it } from 'vitest'
import { SRD_2024_SOURCE } from '../../data/content/srd-2024/source'
import {
  createAsiChoicesUpToLevel,
  formatAsiChoiceSummary,
  isCompleteAsiChoiceValue,
  parseAsiChoice,
  selectAsiFeat,
  selectAsiMode,
  selectAsiPlus1Plus1,
  selectAsiPlus2,
  serializeAsiChoice,
  validateAsiEncodedValue,
} from './abilityScoreImprovement'

describe('abilityScoreImprovement encoding', () => {
  it('serializes and parses plus-2', () => {
    const value = selectAsiPlus2('strength')
    expect(value).toBe('plus-2:strength')
    expect(parseAsiChoice(value)).toEqual({
      kind: 'plus-2',
      abilityId: 'strength',
    })
    expect(isCompleteAsiChoiceValue(value)).toBe(true)
  })

  it('serializes and parses plus-1-1', () => {
    const value = selectAsiPlus1Plus1('dexterity', 'constitution')
    expect(value).toBe('plus-1-1:dexterity,constitution')
    expect(parseAsiChoice(value)).toEqual({
      kind: 'plus-1-1',
      abilityIds: ['dexterity', 'constitution'],
    })
    expect(isCompleteAsiChoiceValue(value)).toBe(true)
  })

  it('parses feat encoding', () => {
    expect(parseAsiChoice(selectAsiFeat('savage-attacker'))).toEqual({
      kind: 'feat',
      featId: 'savage-attacker',
    })
    expect(isCompleteAsiChoiceValue('feat:savage-attacker')).toBe(true)
  })

  it('treats bare mode tokens as incomplete', () => {
    expect(isCompleteAsiChoiceValue('plus-2')).toBe(false)
    expect(isCompleteAsiChoiceValue('plus-1-1')).toBe(false)
    expect(isCompleteAsiChoiceValue('feat')).toBe(false)
    expect(parseAsiChoice('plus-2')).toEqual({ kind: 'mode', mode: 'plus-2' })
    expect(validateAsiEncodedValue('plus-2')).toEqual({
      ok: false,
      reason: 'incomplete',
    })
  })

  it('rejects malformed values', () => {
    expect(parseAsiChoice('plus-2:')).toBeNull()
    expect(parseAsiChoice('plus-2:str')).toBeNull()
    expect(parseAsiChoice('plus-1-1:strength')).toBeNull()
    expect(parseAsiChoice('plus-1-1:strength,strength')).toBeNull()
    expect(parseAsiChoice('feat:')).toBeNull()
    expect(parseAsiChoice('nope')).toBeNull()
    expect(isCompleteAsiChoiceValue(undefined)).toBe(false)
    expect(validateAsiEncodedValue('plus-2:')).toEqual({
      ok: false,
      reason: 'invalid',
    })
  })

  it('clears detail when switching modes', () => {
    expect(selectAsiMode('plus-1-1')).toBe('plus-1-1')
    expect(serializeAsiChoice({ kind: 'mode', mode: 'feat' })).toBe('feat')
    expect(selectAsiMode('plus-2')).toBe('plus-2')
  })

  it('formats summaries', () => {
    expect(formatAsiChoiceSummary('plus-2:strength')).toBe('STR +2')
    expect(formatAsiChoiceSummary('plus-1-1:dexterity,constitution')).toBe(
      'DEX +1, CON +1',
    )
    expect(
      formatAsiChoiceSummary(
        'feat:savage-attacker',
        new Map([['savage-attacker', 'Savage Attacker']]),
      ),
    ).toBe('Feat: Savage Attacker')
    expect(formatAsiChoiceSummary('plus-2')).toBeNull()
  })

  it('creates isolated complete choices per ASI level', () => {
    const choices = createAsiChoicesUpToLevel(8)
    expect(Object.keys(choices)).toEqual([
      'ability-score-improvement-4',
      'ability-score-improvement-6',
      'ability-score-improvement-8',
    ])
    expect(choices['ability-score-improvement-4']).toBe('plus-2:strength')
    expect(choices['ability-score-improvement-6']).toBe('plus-2:strength')
  })

  it('isolates feat picks across ASI slots in validation', () => {
    const featById = new Map([
      [
        'alert',
        {
          id: 'alert',
          editionId: 'srd-2024' as const,
          name: 'Alert',
          summary: 'Always ready',
          description: 'Always ready',
          source: SRD_2024_SOURCE,
          category: 'general' as const,
          prerequisite: { kind: 'none' as const },
          benefits: [],
          repeatable: false,
          choices: [],
        },
      ],
    ])

    expect(
      validateAsiEncodedValue('feat:alert', {
        featById,
        takenFeatIds: ['alert'],
      }),
    ).toEqual({ ok: false, reason: 'invalid' })

    expect(
      validateAsiEncodedValue('feat:alert', {
        featById,
        takenFeatIds: [],
      }),
    ).toEqual({ ok: true, complete: true })
  })
})
