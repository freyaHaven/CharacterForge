import type { ClassSpellcasting, SpellEntitlement } from '../../../../domain/class/types'
import {
  PACT_MAGIC_CANTRIPS_KNOWN_BY_LEVEL,
  PACT_MAGIC_SLOTS_BY_LEVEL,
  WARLOCK_PREPARED_BY_LEVEL,
} from '../../../../domain/spell/progressions'
import { SPELL_LIST_IDS } from '../spell-lists'

/** Zero until `unlockLevel`, then `value` for the rest of levels 1–20. */
function unlockTable(unlockLevel: number, value: number): number[] {
  return Array.from({ length: 20 }, (_, index) =>
    index + 1 >= unlockLevel ? value : 0,
  )
}

/** Contact Other Plane granted by Contact Patron (Warlock L9). */
export const contactPatronSpellEntitlement: SpellEntitlement = {
  id: 'contact-patron',
  kind: 'granted',
  countsAgainstLimit: false,
  appliesTo: 'prepared',
  spells: [{ spellId: 'srd-2024:contact-other-plane', minLevel: 9 }],
}

function mysticArcanumEntitlement(
  id: string,
  unlockLevel: number,
  spellLevel: number,
  label: string,
): SpellEntitlement {
  return {
    id,
    kind: 'select',
    listId: SPELL_LIST_IDS.warlock,
    selectionKind: 'prepared',
    label,
    count: {
      kind: 'by-source-level',
      table: unlockTable(unlockLevel, 1),
    },
    levelRange: { min: spellLevel, max: spellLevel },
    countsAgainstLimit: false,
    description:
      'You can cast this arcanum spell once without expending a spell slot, and you regain the ability to do so when you finish a Long Rest. Character Forge records the choice only — rest recovery is not tracked during play.',
  }
}

export const mysticArcanum6Entitlement = mysticArcanumEntitlement(
  'mystic-arcanum-6',
  11,
  6,
  'Mystic Arcanum (6th-level)',
)

export const mysticArcanum7Entitlement = mysticArcanumEntitlement(
  'mystic-arcanum-7',
  13,
  7,
  'Mystic Arcanum (7th-level)',
)

export const mysticArcanum8Entitlement = mysticArcanumEntitlement(
  'mystic-arcanum-8',
  15,
  8,
  'Mystic Arcanum (8th-level)',
)

export const mysticArcanum9Entitlement = mysticArcanumEntitlement(
  'mystic-arcanum-9',
  17,
  9,
  'Mystic Arcanum (9th-level)',
)

/** Pact of the Tome Book of Shadows cantrips (any class list). */
export const pactOfTheTomeCantripsEntitlement: SpellEntitlement = {
  id: 'pact-of-the-tome-cantrips',
  kind: 'select',
  listId: SPELL_LIST_IDS.allCantrips,
  selectionKind: 'cantrip',
  label: 'Book of Shadows Cantrips',
  count: { kind: 'fixed', value: 3 },
  levelRange: { min: 0, max: 0 },
  countsAgainstLimit: false,
  crossSourceDuplicatePolicy: 'forbid',
}

/** Pact of the Tome Book of Shadows level-1 rituals (any class list). */
export const pactOfTheTomeRitualsEntitlement: SpellEntitlement = {
  id: 'pact-of-the-tome-rituals',
  kind: 'select',
  listId: SPELL_LIST_IDS.level1Rituals,
  selectionKind: 'prepared',
  label: 'Book of Shadows Rituals',
  count: { kind: 'fixed', value: 2 },
  levelRange: { min: 1, max: 1 },
  countsAgainstLimit: false,
  ritual: true,
  crossSourceDuplicatePolicy: 'forbid',
}

export const warlockSpellcastingSrd2024: ClassSpellcasting = {
  ability: 'charisma',
  spellListId: SPELL_LIST_IDS.warlock,
  slotContributor: 'pact',
  slotsByLevel: [],
  cantripsKnownByLevel: PACT_MAGIC_CANTRIPS_KNOWN_BY_LEVEL,
  preparedSpellsByLevel: WARLOCK_PREPARED_BY_LEVEL,
  spellsKnownByLevel: WARLOCK_PREPARED_BY_LEVEL,
  pactSlotsByLevel: PACT_MAGIC_SLOTS_BY_LEVEL,
  slotRecovery: 'short-rest',
  entitlements: [
    {
      id: 'cantrips',
      kind: 'select',
      listId: SPELL_LIST_IDS.warlock,
      selectionKind: 'cantrip',
      label: 'Pact Magic Cantrips',
      count: {
        kind: 'by-source-level',
        table: PACT_MAGIC_CANTRIPS_KNOWN_BY_LEVEL,
      },
      levelRange: { min: 0, max: 0 },
    },
    {
      id: 'prepared',
      kind: 'select',
      listId: SPELL_LIST_IDS.warlock,
      selectionKind: 'prepared',
      label: 'Pact Magic Prepared Spells',
      count: {
        kind: 'by-source-level',
        table: WARLOCK_PREPARED_BY_LEVEL,
      },
      levelRange: { min: 1, max: 'pact-slot-level' },
    },
    mysticArcanum6Entitlement,
    mysticArcanum7Entitlement,
    mysticArcanum8Entitlement,
    mysticArcanum9Entitlement,
  ],
}
