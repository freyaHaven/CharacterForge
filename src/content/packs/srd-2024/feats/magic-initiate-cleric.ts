import type { FeatDefinition } from '../../../../domain/feat/types'
import { SPELL_LIST_IDS } from '../spell-lists'
import { SRD_2024_SOURCE } from '../source'

export const magicInitiateClericSrd2024: FeatDefinition = {
  id: 'srd-2024:magic-initiate-cleric',
  editionId: 'srd-2024',
  name: 'Magic Initiate (Cleric)',
  summary: 'Learn two cantrips and one 1st-level Cleric spell.',
  description:
    'You learn two cantrips and one 1st-level spell from the Cleric spell list. You can cast the 1st-level spell once per Long Rest without a spell slot, and you can also cast it using any spell slots you have. Wisdom is your spellcasting ability for these spells.',
  source: SRD_2024_SOURCE,
  category: 'origin',
  prerequisite: { kind: 'none' },
  benefits: [
    {
      id: 'cleric-cantrips',
      name: 'Cleric Cantrips',
      description: 'Learn two cantrips from the Cleric spell list.',
    },
    {
      id: 'cleric-1st-level-spell',
      name: '1st-Level Cleric Spell',
      description:
        'Learn one 1st-level spell from the Cleric spell list. You can cast it once per Long Rest without a spell slot, and you can also cast it using any spell slots you have.',
    },
  ],
  repeatable: false,
  choices: [],
  spellcasting: {
    ability: 'wisdom',
    spellListId: SPELL_LIST_IDS.cleric,
    entitlements: [
      {
        id: 'mi-cantrips',
        kind: 'select',
        listId: SPELL_LIST_IDS.cleric,
        selectionKind: 'cantrip',
        count: { kind: 'fixed', value: 2 },
        levelRange: { min: 0, max: 0 },
      },
      {
        id: 'mi-1st-level',
        kind: 'select',
        listId: SPELL_LIST_IDS.cleric,
        selectionKind: 'known',
        count: { kind: 'fixed', value: 1 },
        levelRange: { min: 1, max: 1 },
      },
    ],
  },
}
