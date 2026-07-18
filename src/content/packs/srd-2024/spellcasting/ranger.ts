import type { ClassSpellcasting } from '../../../../domain/class/types'
import {
  HALF_CASTER_PREPARED_BY_LEVEL,
  HALF_CASTER_SLOTS_BY_LEVEL,
  ZERO_CANTRIPS_BY_LEVEL,
} from '../../../../domain/spell/progressions'
import { SPELL_LIST_IDS } from '../spell-lists'

export const rangerSpellcastingSrd2024: ClassSpellcasting = {
  ability: 'wisdom',
  spellListId: SPELL_LIST_IDS.ranger,
  slotContributor: 'half',
  slotsByLevel: HALF_CASTER_SLOTS_BY_LEVEL,
  cantripsKnownByLevel: ZERO_CANTRIPS_BY_LEVEL,
  preparedSpellsByLevel: HALF_CASTER_PREPARED_BY_LEVEL,
  entitlements: [
    {
      id: 'prepared',
      kind: 'select',
      listId: SPELL_LIST_IDS.ranger,
      selectionKind: 'prepared',
      count: { kind: 'by-source-level', table: HALF_CASTER_PREPARED_BY_LEVEL },
      levelRange: { min: 1, max: 'slot-ceiling' },
    },
    {
      id: 'favored-enemy',
      kind: 'granted',
      spells: [{ spellId: 'srd-2024:hunters-mark', minLevel: 1 }],
      countsAgainstLimit: false,
      appliesTo: 'prepared',
    },
  ],
}

export const druidicWarriorCantripsEntitlement = {
  id: 'druidic-warrior-cantrips',
  kind: 'select' as const,
  listId: SPELL_LIST_IDS.druid,
  selectionKind: 'cantrip' as const,
  count: { kind: 'fixed' as const, value: 2 },
  levelRange: { min: 0, max: 0 },
}
