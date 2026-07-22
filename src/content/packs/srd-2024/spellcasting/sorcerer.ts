import type { ClassSpellcasting } from '../../../../domain/class/types'
import { FULL_CASTER_SLOTS_BY_LEVEL } from '../../../../domain/spell/progressions'
import {
  SORCERER_CANTRIPS_KNOWN_BY_LEVEL,
  SORCERER_PREPARED_BY_LEVEL,
} from '../progressions'
import { SPELL_LIST_IDS } from '../spell-lists'

export const sorcererSpellcastingSrd2024: ClassSpellcasting = {
  ability: 'charisma',
  spellListId: SPELL_LIST_IDS.sorcerer,
  slotContributor: 'full',
  slotsByLevel: FULL_CASTER_SLOTS_BY_LEVEL,
  cantripsKnownByLevel: SORCERER_CANTRIPS_KNOWN_BY_LEVEL,
  preparedSpellsByLevel: SORCERER_PREPARED_BY_LEVEL,
  entitlements: [
    {
      id: 'cantrips',
      kind: 'select',
      listId: SPELL_LIST_IDS.sorcerer,
      selectionKind: 'cantrip',
      count: {
        kind: 'by-source-level',
        table: SORCERER_CANTRIPS_KNOWN_BY_LEVEL,
      },
      levelRange: { min: 0, max: 0 },
    },
    {
      id: 'prepared',
      kind: 'select',
      listId: SPELL_LIST_IDS.sorcerer,
      selectionKind: 'prepared',
      label: 'Prepared Spells',
      count: {
        kind: 'by-source-level',
        table: SORCERER_PREPARED_BY_LEVEL,
      },
      levelRange: { min: 1, max: 'slot-ceiling' },
    },
  ],
}
