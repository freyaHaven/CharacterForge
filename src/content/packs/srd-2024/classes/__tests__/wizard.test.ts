import { describe, expect, it } from 'vitest'
import { wizardSrd2024 } from '../wizard'
import { createWizardSpellbookEntitlements } from '../../spellcasting/wizard'
import {
  WIZARD_PREPARED_BY_LEVEL,
  wizardSpellbookSizeAtLevel,
} from '../../../../../domain/spell/progressions'

describe('wizardSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(wizardSrd2024.id).toBe('srd-2024:wizard')
    expect(wizardSrd2024.editionId).toBe('srd-2024')
  })

  it('is available in the single-class catalogue', () => {
    expect(wizardSrd2024.catalogStatus).toBeUndefined()
    expect(wizardSrd2024.catalogOrder).toBe(24)
  })

  it('uses Intelligence spellcasting with distinct spellbook entitlements', () => {
    expect(wizardSrd2024.spellcasting?.ability).toBe('intelligence')
    expect(wizardSrd2024.spellcasting?.slotContributor).toBe('full')
    const books = wizardSrd2024.spellcasting?.entitlements.filter(
      (entry) => entry.kind === 'select' && entry.selectionKind === 'spellbook',
    )
    expect(books?.length).toBe(20)
    expect(books?.[0]?.id).toBe('spellbook-1')
  })

  it('prepares from the union of spellbook entitlements', () => {
    const prepared = wizardSrd2024.spellcasting?.entitlements.find(
      (entry) => entry.kind === 'select' && entry.id === 'prepared',
    )
    expect(prepared?.kind === 'select' ? prepared.prepareFrom : undefined).toBe(
      'spellbook',
    )
    expect(
      prepared?.kind === 'select' ? prepared.spellbookEntitlementId : 'set',
    ).toBeUndefined()
  })

  it('matches the SRD prepared-spells table ending at 26', () => {
    expect(WIZARD_PREPARED_BY_LEVEL).toEqual([
      4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 26,
    ])
    expect(wizardSrd2024.spellcasting?.preparedSpellsByLevel).toEqual(
      WIZARD_PREPARED_BY_LEVEL,
    )
  })

  it('requires two skill proficiencies and Scholar expertise', () => {
    const skills = wizardSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )
    const scholar = wizardSrd2024.choices.find(
      (choice) => choice.id === 'scholar',
    )

    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(2)
    expect(scholar?.level).toBe(2)
    expect(scholar?.type).toBe('multi-select')
    expect(scholar?.type === 'multi-select' ? scholar.min : undefined).toBe(1)
    expect(
      scholar?.type === 'multi-select'
        ? scholar.options.every((option) =>
            option.effects?.some((effect) => effect.kind === 'skill-expertise'),
          )
        : false,
    ).toBe(true)
  })

  it('declares the level at which each choice becomes available', () => {
    expect(
      wizardSrd2024.choices.map((choice) => ({
        id: choice.id,
        level: choice.level,
      })),
    ).toEqual([
      { id: 'skill-proficiencies', level: 1 },
      { id: 'scholar', level: 2 },
      { id: 'wizard-subclass', level: 3 },
      { id: 'ability-score-improvement-4', level: 4 },
      { id: 'ability-score-improvement-8', level: 8 },
      { id: 'ability-score-improvement-12', level: 12 },
      { id: 'ability-score-improvement-16', level: 16 },
      { id: 'epic-boon', level: 19 },
    ])
  })

  it('builds distinct spellbook acquisition entitlements that sum to the cumulative size', () => {
    const entitlements = createWizardSpellbookEntitlements()
    expect(entitlements).toHaveLength(20)

    for (let level = 1; level <= 20; level += 1) {
      let total = 0
      for (const entitlement of entitlements) {
        if (entitlement.kind !== 'select') {
          continue
        }
        if (entitlement.count.kind === 'fixed') {
          total += entitlement.count.value
        } else if (entitlement.count.kind === 'by-source-level') {
          total += entitlement.count.table[level - 1] ?? 0
        }
      }
      expect(total).toBe(wizardSpellbookSizeAtLevel(level))
    }
  })
})
