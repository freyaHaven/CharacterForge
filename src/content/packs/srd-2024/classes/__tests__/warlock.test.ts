import { describe, expect, it } from 'vitest'
import { warlockSrd2024 } from '../warlock'
import {
  WARLOCK_CANTRIPS_KNOWN_BY_LEVEL,
  WARLOCK_INVOCATIONS_BY_LEVEL,
  WARLOCK_PACT_SLOTS_BY_LEVEL,
  WARLOCK_PREPARED_BY_LEVEL,
} from '../../progressions'
import { SPELL_LIST_IDS } from '../../spell-lists'
import { withLevelAdjustedChoiceLimits } from '../../../../../domain/class/weaponMastery'
import { SRD_ELDRITCH_INVOCATION_BASE_IDS } from '../../invocations/eldritchInvocations'
import { WARLOCK_PACKAGE_A } from '../../equipment/packages'

describe('warlockSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(warlockSrd2024.id).toBe('srd-2024:warlock')
    expect(warlockSrd2024.editionId).toBe('srd-2024')
  })

  it('is available in the single-class catalogue', () => {
    expect(warlockSrd2024.catalogStatus).toBeUndefined()
    expect(warlockSrd2024.catalogOrder).toBe(22)
  })

  it('uses Charisma Pact Magic as a prepared pact caster', () => {
    expect(warlockSrd2024.spellcasting?.ability).toBe('charisma')
    expect(warlockSrd2024.spellcasting?.slotContributor).toBe('pact')
    expect(warlockSrd2024.spellcasting?.spellListId).toBe(SPELL_LIST_IDS.warlock)
    expect(warlockSrd2024.spellcasting?.slotRecovery).toBe('short-rest')
    expect(warlockSrd2024.multiclassPrerequisite).toMatchObject({
      kind: 'all-of',
      abilities: ['charisma'],
      minimum: 13,
    })
  })

  it('matches SRD core traits', () => {
    expect(warlockSrd2024.hitDie).toEqual({ sides: 8 })
    expect(warlockSrd2024.primaryAbilities).toEqual(['charisma'])
    expect(warlockSrd2024.savingThrows).toEqual(['wisdom', 'charisma'])
    expect(warlockSrd2024.proficiencies.armor).toEqual(['light'])
    expect(warlockSrd2024.proficiencies.weapons).toEqual(['simple'])
  })

  it('matches Pact Magic tables', () => {
    expect(WARLOCK_CANTRIPS_KNOWN_BY_LEVEL).toEqual([
      2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    ])
    expect(WARLOCK_PREPARED_BY_LEVEL).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15,
    ])
    expect(warlockSrd2024.spellcasting?.cantripsKnownByLevel).toEqual(
      WARLOCK_CANTRIPS_KNOWN_BY_LEVEL,
    )
    expect(warlockSrd2024.spellcasting?.preparedSpellsByLevel).toEqual(
      WARLOCK_PREPARED_BY_LEVEL,
    )
    expect(warlockSrd2024.spellcasting?.pactSlotsByLevel).toEqual(
      WARLOCK_PACT_SLOTS_BY_LEVEL,
    )
  })

  it('uses prepared (not known) entitlements with pact-slot-level ceiling', () => {
    const prepared = warlockSrd2024.spellcasting?.entitlements.find(
      (entry) => entry.kind === 'select' && entry.id === 'prepared',
    )
    expect(prepared).toMatchObject({
      kind: 'select',
      selectionKind: 'prepared',
      levelRange: { min: 1, max: 'pact-slot-level' },
    })
  })

  it('requires two skills from the Warlock list', () => {
    const skills = warlockSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )
    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(2)
    expect(
      skills?.type === 'multi-select'
        ? skills.options.map((option) => option.id)
        : [],
    ).toEqual([
      'arcana',
      'deception',
      'history',
      'intimidation',
      'investigation',
      'nature',
      'religion',
    ])
  })

  it('scales Eldritch Invocations via limitsByLevel', () => {
    expect(WARLOCK_INVOCATIONS_BY_LEVEL).toEqual([
      1, 3, 3, 3, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10,
    ])
    const choice = warlockSrd2024.choices.find(
      (entry) => entry.id === 'eldritch-invocations',
    )
    expect(choice?.type).toBe('multi-select')
    if (choice?.type !== 'multi-select') {
      return
    }
    expect(choice.limitsByLevel).toEqual(WARLOCK_INVOCATIONS_BY_LEVEL)
    const at5 = withLevelAdjustedChoiceLimits(choice, 5)
    expect(at5.type === 'multi-select' ? at5.min : undefined).toBe(5)
    expect(at5.type === 'multi-select' ? at5.max : undefined).toBe(5)
  })

  it('includes all SRD Eldritch Invocation base options', () => {
    const choice = warlockSrd2024.choices.find(
      (entry) => entry.id === 'eldritch-invocations',
    )
    const optionIds =
      choice?.type === 'multi-select'
        ? choice.options.map((option) => option.id)
        : []
    for (const baseId of SRD_ELDRITCH_INVOCATION_BASE_IDS) {
      expect(optionIds).toContain(baseId)
    }
    expect(SRD_ELDRITCH_INVOCATION_BASE_IDS).toHaveLength(27)
  })

  it('recommends Boon of Fate for the Epic Boon', () => {
    const epicBoon = warlockSrd2024.choices.find(
      (choice) => choice.id === 'epic-boon',
    )
    expect(
      epicBoon?.type === 'single-select' ? epicBoon.recommendedFeatId : undefined,
    ).toBe('srd-2024:boon-of-fate')
  })

  it('declares Warlock Package A and 100 GP alternative', () => {
    expect(WARLOCK_PACKAGE_A.map((grant) => grant.itemId)).toEqual(
      expect.arrayContaining([
        'srd-2024:leather-armor',
        'srd-2024:sickle',
        'srd-2024:dagger',
        'srd-2024:arcane-focus-orb',
        'srd-2024:book-occult-lore',
        'srd-2024:scholars-pack',
      ]),
    )
    expect(warlockSrd2024.startingEquipment.completeness).toBe('complete')
    const root = warlockSrd2024.startingEquipment.entitlements[0]
    expect(root?.type).toBe('choose-option')
    if (root?.type !== 'choose-option') {
      return
    }
    expect(
      root.options.some(
        (option) => option.kind === 'gold' && option.goldPieces === 100,
      ),
    ).toBe(true)
  })

  it('includes Mystic Arcanum entitlements at L11/13/15/17', () => {
    const ids =
      warlockSrd2024.spellcasting?.entitlements.map((entry) => entry.id) ?? []
    expect(ids).toEqual(
      expect.arrayContaining([
        'mystic-arcanum-6',
        'mystic-arcanum-7',
        'mystic-arcanum-8',
        'mystic-arcanum-9',
      ]),
    )
  })
})
