import type { ClassSpellcasting } from '../../../../domain/class/types'
import type { SpellEntitlement } from '../../../../domain/spell/types'
import { FULL_CASTER_SLOTS_BY_LEVEL } from '../../../../domain/spell/progressions'
import {
  WIZARD_CANTRIPS_KNOWN_BY_LEVEL,
  WIZARD_PREPARED_BY_LEVEL,
  WIZARD_SPELLBOOK_INITIAL_COUNT,
  WIZARD_SPELLBOOK_PER_LEVEL,
} from '../progressions'
import { SPELL_LIST_IDS } from '../spell-lists'

/** Zero until `unlockLevel`, then `value` for the rest of levels 1–20. */
function unlockTable(unlockLevel: number, value: number): number[] {
  return Array.from({ length: 20 }, (_, index) =>
    index + 1 >= unlockLevel ? value : 0,
  )
}

/**
 * Distinct Wizard spellbook acquisition entitlements for attribution:
 * level 1 → 6 first-level spells; each later level → 2 spells up to slot ceiling.
 */
export function createWizardSpellbookEntitlements(): SpellEntitlement[] {
  const entitlements: SpellEntitlement[] = [
    {
      id: 'spellbook-1',
      kind: 'select',
      listId: SPELL_LIST_IDS.wizard,
      selectionKind: 'spellbook',
      count: { kind: 'fixed', value: WIZARD_SPELLBOOK_INITIAL_COUNT },
      levelRange: { min: 1, max: 1 },
      label: 'Wizard level 1 spellbook',
      // Cross-spellbook dups are validated separately; prepared ⊆ book is expected.
      crossSourceDuplicatePolicy: 'allow',
    },
  ]

  for (let level = 2; level <= 20; level += 1) {
    entitlements.push({
      id: `spellbook-${level}`,
      kind: 'select',
      listId: SPELL_LIST_IDS.wizard,
      selectionKind: 'spellbook',
      count: {
        kind: 'by-source-level',
        table: unlockTable(level, WIZARD_SPELLBOOK_PER_LEVEL),
      },
      levelRange: {
        min: 1,
        max: 'slot-ceiling',
        slotCeilingAt: 'count-unlock-level',
      },
      label: `Wizard level ${level} spellbook addition`,
      crossSourceDuplicatePolicy: 'allow',
    })
  }

  return entitlements
}

export const wizardSpellcastingSrd2024: ClassSpellcasting = {
  ability: 'intelligence',
  spellListId: SPELL_LIST_IDS.wizard,
  slotContributor: 'full',
  slotsByLevel: FULL_CASTER_SLOTS_BY_LEVEL,
  cantripsKnownByLevel: WIZARD_CANTRIPS_KNOWN_BY_LEVEL,
  preparedSpellsByLevel: WIZARD_PREPARED_BY_LEVEL,
  slotRecovery: 'long-rest',
  entitlements: [
    {
      id: 'cantrips',
      kind: 'select',
      listId: SPELL_LIST_IDS.wizard,
      selectionKind: 'cantrip',
      count: {
        kind: 'by-source-level',
        table: WIZARD_CANTRIPS_KNOWN_BY_LEVEL,
      },
      levelRange: { min: 0, max: 0 },
    },
    ...createWizardSpellbookEntitlements(),
    {
      id: 'prepared',
      kind: 'select',
      listId: SPELL_LIST_IDS.wizard,
      selectionKind: 'prepared',
      count: {
        kind: 'by-source-level',
        table: WIZARD_PREPARED_BY_LEVEL,
      },
      levelRange: { min: 1, max: 'slot-ceiling' },
      prepareFrom: 'spellbook',
      label: 'Prepared Spells',
    },
    {
      id: 'spell-mastery-1',
      kind: 'select',
      listId: SPELL_LIST_IDS.wizard,
      selectionKind: 'prepared',
      count: { kind: 'by-source-level', table: unlockTable(18, 1) },
      levelRange: { min: 1, max: 1 },
      prepareFrom: 'spellbook',
      countsAgainstLimit: false,
      castingTime: 'Action',
      label: 'Spell Mastery (1st-level)',
    },
    {
      id: 'spell-mastery-2',
      kind: 'select',
      listId: SPELL_LIST_IDS.wizard,
      selectionKind: 'prepared',
      count: { kind: 'by-source-level', table: unlockTable(18, 1) },
      levelRange: { min: 2, max: 2 },
      prepareFrom: 'spellbook',
      countsAgainstLimit: false,
      castingTime: 'Action',
      label: 'Spell Mastery (2nd-level)',
    },
    {
      id: 'signature-spells',
      kind: 'select',
      listId: SPELL_LIST_IDS.wizard,
      selectionKind: 'prepared',
      count: { kind: 'by-source-level', table: unlockTable(20, 2) },
      levelRange: { min: 3, max: 3 },
      prepareFrom: 'spellbook',
      countsAgainstLimit: false,
      label: 'Signature Spells',
    },
  ],
}

/** Evocation Savant: two Evocation Wizard spells of level 2 or lower. */
export const evocationSavantInitialEntitlement: SpellEntitlement = {
  id: 'evocation-savant-initial',
  kind: 'select',
  listId: SPELL_LIST_IDS.wizard,
  selectionKind: 'spellbook',
  count: { kind: 'fixed', value: 2 },
  levelRange: { min: 1, max: 2 },
  schools: ['Evocation'],
  label: 'Evocation Savant (initial)',
  crossSourceDuplicatePolicy: 'allow',
}

/**
 * Free Evocation spellbook picks when the Wizard gains a new slot level
 * (class levels 3 / 5 / 7 / 9 / 11 / 13 / 15 / 17).
 */
export function createEvocationSavantSlotEntitlements(): SpellEntitlement[] {
  const unlockLevels = [3, 5, 7, 9, 11, 13, 15, 17] as const
  return unlockLevels.map((level) => ({
    id: `evocation-savant-slot-${level}`,
    kind: 'select' as const,
    listId: SPELL_LIST_IDS.wizard,
    selectionKind: 'spellbook' as const,
    count: {
      kind: 'by-source-level' as const,
      table: unlockTable(level, 1),
    },
    levelRange: {
      min: 1,
      max: 'slot-ceiling' as const,
      slotCeilingAt: 'count-unlock-level' as const,
    },
    schools: ['Evocation'],
    label: `Evocation Savant (level ${level} slot)`,
    crossSourceDuplicatePolicy: 'allow' as const,
  }))
}
