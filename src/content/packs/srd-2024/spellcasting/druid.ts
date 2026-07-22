import type { ClassSpellcasting } from '../../../../domain/class/types'
import { FULL_CASTER_SLOTS_BY_LEVEL } from '../../../../domain/spell/progressions'
import {
  DRUID_CANTRIPS_KNOWN_BY_LEVEL,
  DRUID_PREPARED_BY_LEVEL,
} from '../progressions'
import { SPELL_LIST_IDS } from '../spell-lists'

export const druidSpellcastingSrd2024: ClassSpellcasting = {
  ability: 'wisdom',
  spellListId: SPELL_LIST_IDS.druid,
  slotContributor: 'full',
  slotsByLevel: FULL_CASTER_SLOTS_BY_LEVEL,
  cantripsKnownByLevel: DRUID_CANTRIPS_KNOWN_BY_LEVEL,
  preparedSpellsByLevel: DRUID_PREPARED_BY_LEVEL,
  entitlements: [
    {
      id: 'cantrips',
      kind: 'select',
      listId: SPELL_LIST_IDS.druid,
      selectionKind: 'cantrip',
      count: { kind: 'by-source-level', table: DRUID_CANTRIPS_KNOWN_BY_LEVEL },
      levelRange: { min: 0, max: 0 },
    },
    {
      id: 'prepared',
      kind: 'select',
      listId: SPELL_LIST_IDS.druid,
      selectionKind: 'prepared',
      count: { kind: 'by-source-level', table: DRUID_PREPARED_BY_LEVEL },
      levelRange: { min: 1, max: 'slot-ceiling' },
    },
  ],
}

export const magicianCantripEntitlement = {
  id: 'magician-cantrip',
  kind: 'select' as const,
  listId: SPELL_LIST_IDS.druid,
  selectionKind: 'cantrip' as const,
  count: { kind: 'fixed' as const, value: 1 },
  levelRange: { min: 0, max: 0 },
}

/** Speak with Animals always prepared via Druidic (does not count against limit). */
export const druidicSpeakWithAnimalsEntitlement = {
  id: 'druidic-speak-with-animals',
  kind: 'granted' as const,
  countsAgainstLimit: false as const,
  appliesTo: 'prepared' as const,
  spells: [{ spellId: 'srd-2024:speak-with-animals', minLevel: 1 }],
}
