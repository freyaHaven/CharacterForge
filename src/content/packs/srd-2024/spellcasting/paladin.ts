import type { ClassSpellcasting } from '../../../../domain/class/types'
import {
  HALF_CASTER_PREPARED_BY_LEVEL,
  HALF_CASTER_SLOTS_BY_LEVEL,
  ZERO_CANTRIPS_BY_LEVEL,
} from '../../../../domain/spell/progressions'
import { SPELL_LIST_IDS } from '../spell-lists'

export const paladinSpellcastingSrd2024: ClassSpellcasting = {
  ability: 'charisma',
  spellListId: SPELL_LIST_IDS.paladin,
  slotContributor: 'half',
  slotsByLevel: HALF_CASTER_SLOTS_BY_LEVEL,
  cantripsKnownByLevel: ZERO_CANTRIPS_BY_LEVEL,
  preparedSpellsByLevel: HALF_CASTER_PREPARED_BY_LEVEL,
  entitlements: [
    {
      id: 'prepared',
      kind: 'select',
      listId: SPELL_LIST_IDS.paladin,
      selectionKind: 'prepared',
      count: { kind: 'by-source-level', table: HALF_CASTER_PREPARED_BY_LEVEL },
      levelRange: { min: 1, max: 'slot-ceiling' },
    },
    {
      id: 'paladins-smite',
      kind: 'granted',
      spells: [{ spellId: 'srd-2024:divine-smite', minLevel: 2 }],
      countsAgainstLimit: false,
      appliesTo: 'prepared',
    },
    {
      id: 'faithful-steed',
      kind: 'granted',
      spells: [{ spellId: 'srd-2024:find-steed', minLevel: 5 }],
      countsAgainstLimit: false,
      appliesTo: 'prepared',
    },
  ],
}

export const blessedWarriorCantripsEntitlement = {
  id: 'blessed-warrior-cantrips',
  kind: 'select' as const,
  listId: SPELL_LIST_IDS.cleric,
  selectionKind: 'cantrip' as const,
  count: { kind: 'fixed' as const, value: 2 },
  levelRange: { min: 0, max: 0 },
}
