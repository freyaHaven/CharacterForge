import { describe, expect, it } from 'vitest'
import {
  clearFeatGrantChoices,
  createFeatGrantChoiceStorageKey,
  isFeatGrantChoiceStorageKey,
  parseFeatGrantChoiceStorageKey,
  pruneOrphanFeatGrantChoiceKeys,
  readFeatGrantChoices,
  writeFeatGrantChoice,
} from '../featGrantChoiceStorage'

describe('featGrantChoiceStorage', () => {
  it('round-trips storage keys', () => {
    const key = createFeatGrantChoiceStorageKey(
      'ability-score-improvement-4',
      'skill-or-tool-proficiencies',
    )
    expect(key).toBe(
      'feat-choices:ability-score-improvement-4:skill-or-tool-proficiencies',
    )
    expect(parseFeatGrantChoiceStorageKey(key)).toEqual({
      grantSlotId: 'ability-score-improvement-4',
      featChoiceId: 'skill-or-tool-proficiencies',
    })
    expect(isFeatGrantChoiceStorageKey(key)).toBe(true)
    expect(isFeatGrantChoiceStorageKey('ability-score-improvement-4')).toBe(
      false,
    )
  })

  it('reads and writes nested choices on a host map', () => {
    let host: Record<string, string | string[]> = {
      'ability-score-improvement-4': 'feat:srd-2024:skilled',
    }

    host = writeFeatGrantChoice(
      host,
      'ability-score-improvement-4',
      'skill-or-tool-proficiencies',
      ['skill:athletics', 'skill:perception', 'tool:thieves-tools'],
    )

    expect(
      readFeatGrantChoices(host, 'ability-score-improvement-4'),
    ).toEqual({
      'skill-or-tool-proficiencies': [
        'skill:athletics',
        'skill:perception',
        'tool:thieves-tools',
      ],
    })

    host = clearFeatGrantChoices(host, 'ability-score-improvement-4')
    expect(host).toEqual({
      'ability-score-improvement-4': 'feat:srd-2024:skilled',
    })
  })

  it('prunes orphan companion keys for inactive grant slots', () => {
    const host = {
      'ability-score-improvement-4': 'feat:srd-2024:skilled',
      'feat-choices:ability-score-improvement-4:skill-or-tool-proficiencies': [
        'skill:athletics',
        'skill:perception',
        'tool:thieves-tools',
      ],
      'feat-choices:epic-boon:ability-score-increase': 'plus-2:strength',
    }

    expect(
      pruneOrphanFeatGrantChoiceKeys(
        host,
        new Set(['ability-score-improvement-4']),
      ),
    ).toEqual({
      'ability-score-improvement-4': 'feat:srd-2024:skilled',
      'feat-choices:ability-score-improvement-4:skill-or-tool-proficiencies': [
        'skill:athletics',
        'skill:perception',
        'tool:thieves-tools',
      ],
    })
  })
})
