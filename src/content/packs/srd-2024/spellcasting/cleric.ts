import type { ClassSpellcasting } from '../../../../domain/class/types'
import {
  CLERIC_CANTRIPS_KNOWN_BY_LEVEL,
  CLERIC_PREPARED_BY_LEVEL,
  FULL_CASTER_SLOTS_BY_LEVEL,
} from '../../../../domain/spell/progressions'
import { SPELL_LIST_IDS } from '../spell-lists'

export const clericSpellcastingSrd2024: ClassSpellcasting = {
  ability: 'wisdom',
  spellListId: SPELL_LIST_IDS.cleric,
  slotContributor: 'full',
  slotsByLevel: FULL_CASTER_SLOTS_BY_LEVEL,
  cantripsKnownByLevel: CLERIC_CANTRIPS_KNOWN_BY_LEVEL,
  preparedSpellsByLevel: CLERIC_PREPARED_BY_LEVEL,
  entitlements: [
    {
      id: 'cantrips',
      kind: 'select',
      listId: SPELL_LIST_IDS.cleric,
      selectionKind: 'cantrip',
      count: { kind: 'by-source-level', table: CLERIC_CANTRIPS_KNOWN_BY_LEVEL },
      levelRange: { min: 0, max: 0 },
    },
    {
      id: 'prepared',
      kind: 'select',
      listId: SPELL_LIST_IDS.cleric,
      selectionKind: 'prepared',
      count: { kind: 'by-source-level', table: CLERIC_PREPARED_BY_LEVEL },
      levelRange: { min: 1, max: 'slot-ceiling' },
    },
  ],
}

export const thaumaturgeCantripEntitlement = {
  id: 'thaumaturge-cantrip',
  kind: 'select' as const,
  listId: SPELL_LIST_IDS.cleric,
  selectionKind: 'cantrip' as const,
  count: { kind: 'fixed' as const, value: 1 },
  levelRange: { min: 0, max: 0 },
}
