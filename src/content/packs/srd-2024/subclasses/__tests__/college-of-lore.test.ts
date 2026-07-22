import { describe, expect, it } from 'vitest'
import { collegeOfLoreSrd2024 } from '../college-of-lore'
import { SPELL_LIST_IDS } from '../../spell-lists'

describe('collegeOfLoreSrd2024', () => {
  it('uses stable ids linked to Bard', () => {
    expect(collegeOfLoreSrd2024.id).toBe('srd-2024:college-of-lore')
    expect(collegeOfLoreSrd2024.classId).toBe('srd-2024:bard')
    expect(collegeOfLoreSrd2024.choiceOptionId).toBe('college-of-lore')
  })

  it('grants features at College of Lore levels', () => {
    expect(
      collegeOfLoreSrd2024.features.map((feature) => ({
        id: feature.id,
        level: feature.level,
      })),
    ).toEqual([
      { id: 'bonus-proficiencies', level: 3 },
      { id: 'cutting-words', level: 3 },
      { id: 'magical-discoveries', level: 6 },
      { id: 'peerless-skill', level: 14 },
    ])
  })

  it('attaches Magical Discoveries as a fixed prepared entitlement', () => {
    const discoveries = collegeOfLoreSrd2024.features.find(
      (feature) => feature.id === 'magical-discoveries',
    )
    const entitlement = discoveries?.spellEntitlements?.[0]

    expect(entitlement).toMatchObject({
      id: 'magical-discoveries',
      kind: 'select',
      listId: SPELL_LIST_IDS.magicalDiscoveries,
      selectionKind: 'prepared',
      count: { kind: 'fixed', value: 2 },
      levelRange: { min: 0, max: 'slot-ceiling' },
      countsAgainstLimit: false,
    })
  })

  it('exposes Bonus Proficiencies, Cutting Words, and Peerless Skill', () => {
    const ids = collegeOfLoreSrd2024.features.map((feature) => feature.id)

    expect(ids).toContain('bonus-proficiencies')
    expect(ids).toContain('cutting-words')
    expect(ids).toContain('peerless-skill')
  })
})
