import type { ClassSpellcasting } from '../../../../domain/class/types'
import {
  BARD_CANTRIPS_KNOWN_BY_LEVEL,
  BARD_PREPARED_BY_LEVEL,
  FULL_CASTER_SLOTS_BY_LEVEL,
} from '../../../../domain/spell/progressions'
import { SPELL_LIST_IDS } from '../spell-lists'

export const bardSpellcastingSrd2024: ClassSpellcasting = {
  ability: 'charisma',
  spellListId: SPELL_LIST_IDS.bard,
  slotContributor: 'full',
  slotsByLevel: FULL_CASTER_SLOTS_BY_LEVEL,
  cantripsKnownByLevel: BARD_CANTRIPS_KNOWN_BY_LEVEL,
  preparedSpellsByLevel: BARD_PREPARED_BY_LEVEL,
  entitlements: [
    {
      id: 'cantrips',
      kind: 'select',
      listId: SPELL_LIST_IDS.bard,
      selectionKind: 'cantrip',
      count: { kind: 'by-source-level', table: BARD_CANTRIPS_KNOWN_BY_LEVEL },
      levelRange: { min: 0, max: 0 },
    },
    {
      id: 'prepared',
      kind: 'select',
      listId: SPELL_LIST_IDS.bard,
      selectionKind: 'prepared',
      label: 'Prepared Spells',
      count: { kind: 'by-source-level', table: BARD_PREPARED_BY_LEVEL },
      levelRange: { min: 1, max: 'slot-ceiling' },
      expandedListId: SPELL_LIST_IDS.magicalSecrets,
      expandedFromLevel: 10,
    },
  ],
}

export const magicalDiscoveriesEntitlement = {
  id: 'magical-discoveries',
  kind: 'select' as const,
  listId: SPELL_LIST_IDS.magicalDiscoveries,
  selectionKind: 'prepared' as const,
  label: 'Magical Discoveries',
  count: { kind: 'fixed' as const, value: 2 },
  levelRange: { min: 0, max: 'slot-ceiling' as const },
  countsAgainstLimit: false as const,
}

export const wordsOfCreationEntitlement = {
  id: 'words-of-creation',
  kind: 'granted' as const,
  countsAgainstLimit: false as const,
  appliesTo: 'prepared' as const,
  spells: [
    { spellId: 'srd-2024:power-word-heal', minLevel: 20 },
    { spellId: 'srd-2024:power-word-kill', minLevel: 20 },
  ],
}
