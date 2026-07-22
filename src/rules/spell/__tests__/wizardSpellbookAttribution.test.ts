import { describe, expect, it } from 'vitest'
import { createBundledSpellCatalog } from '../../../adapters/bundledSpellCatalog'
import { wizardSrd2024 } from '../../../content/packs/srd-2024/classes/wizard'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import {
  WIZARD_ASI_FEATURE_LEVELS,
  createAsiChoicesUpToLevel,
} from '../../../domain/class/abilityScoreImprovement'
import { WIZARD_PREPARED_BY_LEVEL } from '../../../domain/spell/progressions'
import { resolveCharacterSpellcasting } from '../../character/resolveCharacterSpellcasting'
import { validateSpellSourceStates } from '../validateSpellSourceStates'

const spellCatalog = createBundledSpellCatalog()

function createCatalog() {
  return {
    listClasses: async () => [wizardSrd2024],
    getClass: async (classId: string) =>
      classId === wizardSrd2024.id ? wizardSrd2024 : null,
  }
}

const L1_BOOK = [
  'srd-2024:magic-missile',
  'srd-2024:shield',
  'srd-2024:mage-armor',
  'srd-2024:burning-hands',
  'srd-2024:detect-magic',
  'srd-2024:sleep',
] as const

describe('Wizard spellbook attribution', () => {
  it('unions distinct spellbook entitlements for prepareFrom without spellbookEntitlementId', async () => {
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'wiz-1',
          classId: wizardSrd2024.id,
          level: 2,
          choices: {
            'skill-proficiencies': ['arcana', 'history'],
            scholar: ['arcana'],
          },
        },
      ],
      spellSourceStates: [
        {
          source: {
            kind: 'class-instance',
            instanceId: 'wiz-1',
            entitlementId: 'cantrips',
          },
          selections: [
            { spellId: 'srd-2024:mage-hand' },
            { spellId: 'srd-2024:prestidigitation' },
            { spellId: 'srd-2024:light' },
          ],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'wiz-1',
            entitlementId: 'spellbook-1',
          },
          selections: L1_BOOK.map((spellId) => ({ spellId })),
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'wiz-1',
            entitlementId: 'spellbook-2',
          },
          selections: [
            { spellId: 'srd-2024:thunderwave' },
            { spellId: 'srd-2024:charm-person' },
          ],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'wiz-1',
            entitlementId: 'prepared',
          },
          selections: [
            { spellId: 'srd-2024:magic-missile' },
            { spellId: 'srd-2024:shield' },
            { spellId: 'srd-2024:mage-armor' },
            { spellId: 'srd-2024:thunderwave' },
            { spellId: 'srd-2024:charm-person' },
          ],
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog(),
      character,
      { spellCatalog },
    )

    const prepared = summary.groups[0]?.entitlements.find(
      (entry) => entry.entitlementId === 'prepared',
    )
    expect(prepared?.prepareFrom).toBe('spellbook')
    expect(prepared?.spellbookEntitlementId).toBeUndefined()
    expect(prepared?.spellbookSpellIds).toEqual(
      expect.arrayContaining([
        ...L1_BOOK,
        'srd-2024:thunderwave',
        'srd-2024:charm-person',
      ]),
    )
    expect(prepared?.limit).toBe(WIZARD_PREPARED_BY_LEVEL[1])

    const validation = await validateSpellSourceStates(
      summary,
      character.spellSourceStates,
      spellCatalog,
    )
    expect(validation.ok).toBe(true)
  })

  it('forbids the same spell in two spellbook acquisition entitlements', async () => {
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'wiz-1',
          classId: wizardSrd2024.id,
          level: 2,
          choices: {
            'skill-proficiencies': ['arcana', 'history'],
            scholar: ['arcana'],
          },
        },
      ],
      spellSourceStates: [
        {
          source: {
            kind: 'class-instance',
            instanceId: 'wiz-1',
            entitlementId: 'cantrips',
          },
          selections: [
            { spellId: 'srd-2024:mage-hand' },
            { spellId: 'srd-2024:prestidigitation' },
            { spellId: 'srd-2024:light' },
          ],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'wiz-1',
            entitlementId: 'spellbook-1',
          },
          selections: L1_BOOK.map((spellId) => ({ spellId })),
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'wiz-1',
            entitlementId: 'spellbook-2',
          },
          selections: [
            { spellId: 'srd-2024:magic-missile' },
            { spellId: 'srd-2024:thunderwave' },
          ],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'wiz-1',
            entitlementId: 'prepared',
          },
          selections: [
            { spellId: 'srd-2024:magic-missile' },
            { spellId: 'srd-2024:shield' },
            { spellId: 'srd-2024:mage-armor' },
            { spellId: 'srd-2024:sleep' },
            { spellId: 'srd-2024:thunderwave' },
          ],
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog(),
      character,
      { spellCatalog },
    )
    const validation = await validateSpellSourceStates(
      summary,
      character.spellSourceStates,
      spellCatalog,
    )

    expect(validation.ok).toBe(false)
    if (validation.ok) {
      return
    }
    expect(
      validation.issues.some(
        (issue) =>
          issue.code === 'cross-source-duplicate' &&
          issue.spellId === 'srd-2024:magic-missile' &&
          issue.entitlementId === 'spellbook-2',
      ),
    ).toBe(true)
  })

  it('does not reduce main prepared remainingPicks for Spell Mastery selections', async () => {
    const character = createDefaultCharacter({
      classes: [
        {
          instanceId: 'wiz-1',
          classId: wizardSrd2024.id,
          level: 18,
          choices: {
            'skill-proficiencies': ['arcana', 'history'],
            scholar: ['arcana'],
            'wizard-subclass': 'evoker',
            ...createAsiChoicesUpToLevel(18, WIZARD_ASI_FEATURE_LEVELS),
          },
        },
      ],
      spellSourceStates: [
        {
          source: {
            kind: 'class-instance',
            instanceId: 'wiz-1',
            entitlementId: 'spellbook-1',
          },
          selections: L1_BOOK.map((spellId) => ({ spellId })),
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'wiz-1',
            entitlementId: 'spell-mastery-1',
          },
          selections: [{ spellId: 'srd-2024:magic-missile' }],
        },
        {
          source: {
            kind: 'class-instance',
            instanceId: 'wiz-1',
            entitlementId: 'prepared',
          },
          selections: [
            { spellId: 'srd-2024:shield' },
            { spellId: 'srd-2024:mage-armor' },
            { spellId: 'srd-2024:burning-hands' },
            { spellId: 'srd-2024:sleep' },
          ],
        },
      ],
    })

    const summary = await resolveCharacterSpellcasting(
      createCatalog(),
      character,
      { spellCatalog },
    )

    const prepared = summary.groups[0]?.entitlements.find(
      (entry) => entry.entitlementId === 'prepared',
    )
    const mastery = summary.groups[0]?.entitlements.find(
      (entry) => entry.entitlementId === 'spell-mastery-1',
    )

    expect(prepared?.limit).toBe(WIZARD_PREPARED_BY_LEVEL[17])
    expect(prepared?.remainingPicks).toBe(
      WIZARD_PREPARED_BY_LEVEL[17]! - 4,
    )
    expect(mastery?.countsAgainstLimit).toBe(false)
    expect(mastery?.remainingPicks).toBe(0)
    expect(mastery?.label).toBe('Spell Mastery (1st-level)')
  })
})
