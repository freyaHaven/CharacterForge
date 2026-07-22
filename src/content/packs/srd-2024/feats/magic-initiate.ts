import type { AbilityId } from '../../../../domain/abilities/types'
import type { FeatDefinition } from '../../../../domain/feat/types'
import { SPELL_LIST_IDS } from '../spell-lists'
import { SRD_2024_SOURCE } from '../source'

export const MAGIC_INITIATE_SPELLCASTING_ABILITY_CHOICE_ID =
  'spellcasting-ability' as const

const SPELLCASTING_ABILITY_OPTIONS: {
  id: AbilityId
  label: string
}[] = [
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'wisdom', label: 'Wisdom' },
  { id: 'charisma', label: 'Charisma' },
]

export type MagicInitiateListKey = 'cleric' | 'druid' | 'wizard'

const LIST_CONFIG: Record<
  MagicInitiateListKey,
  { spellListId: string; listLabel: string }
> = {
  cleric: {
    spellListId: SPELL_LIST_IDS.cleric,
    listLabel: 'Cleric',
  },
  druid: {
    spellListId: SPELL_LIST_IDS.druid,
    listLabel: 'Druid',
  },
  wizard: {
    spellListId: SPELL_LIST_IDS.wizard,
    listLabel: 'Wizard',
  },
}

/**
 * Shared Magic Initiate definition factory (SRD 5.2.1).
 * One catalogue entry per spell list so “different list each time” is
 * enforced via non-repeatable distinct feat ids.
 */
export function createMagicInitiateFeat(
  listKey: MagicInitiateListKey,
): FeatDefinition {
  const config = LIST_CONFIG[listKey]
  const listLabel = config.listLabel

  return {
    id: `srd-2024:magic-initiate-${listKey}`,
    editionId: 'srd-2024',
    name: `Magic Initiate (${listLabel})`,
    summary: `Learn two cantrips and one 1st-level ${listLabel} spell.`,
    description:
      `You learn two cantrips of your choice from the ${listLabel} spell list. ` +
      'Intelligence, Wisdom, or Charisma is your spellcasting ability for this feat’s spells (choose when you select this feat). ' +
      `Choose a level 1 spell from the same list. You always have that spell prepared. ` +
      'You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. ' +
      'You can also cast the spell using any spell slots you have. ' +
      'Whenever you gain a new level, you can replace one of the spells you chose for this feat with a different spell of the same level from the chosen spell list. ' +
      'You can take Magic Initiate more than once, but you must choose a different spell list each time.',
    source: SRD_2024_SOURCE,
    category: 'origin',
    prerequisite: { kind: 'none' },
    benefits: [
      {
        id: 'two-cantrips',
        name: 'Two Cantrips',
        description: `Learn two cantrips from the ${listLabel} spell list. Intelligence, Wisdom, or Charisma is your spellcasting ability for this feat’s spells (choose when you select this feat).`,
      },
      {
        id: 'level-1-spell',
        name: 'Level 1 Spell',
        description:
          `Choose a level 1 spell from the ${listLabel} spell list. You always have that spell prepared. ` +
          'You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have.',
      },
      {
        id: 'spell-change',
        name: 'Spell Change',
        description:
          'Whenever you gain a new level, you can replace one of the spells you chose for this feat with a different spell of the same level from the chosen spell list.',
      },
    ],
    // Distinct ids per list — each variant is not repeatable; take other lists separately.
    repeatable: false,
    choices: [
      {
        id: MAGIC_INITIATE_SPELLCASTING_ABILITY_CHOICE_ID,
        prompt: 'Spellcasting Ability',
        type: 'single-select',
        required: true,
        options: SPELLCASTING_ABILITY_OPTIONS.map((option) => ({
          id: option.id,
          label: option.label,
        })),
      },
    ],
    spellcasting: {
      abilityFromChoiceId: MAGIC_INITIATE_SPELLCASTING_ABILITY_CHOICE_ID,
      spellListId: config.spellListId,
      entitlements: [
        {
          id: 'mi-cantrips',
          kind: 'select',
          listId: config.spellListId,
          selectionKind: 'cantrip',
          count: { kind: 'fixed', value: 2 },
          levelRange: { min: 0, max: 0 },
        },
        {
          id: 'mi-1st-level',
          kind: 'select',
          listId: config.spellListId,
          selectionKind: 'known',
          count: { kind: 'fixed', value: 1 },
          levelRange: { min: 1, max: 1 },
        },
      ],
    },
  }
}

export const magicInitiateClericSrd2024 = createMagicInitiateFeat('cleric')
export const magicInitiateDruidSrd2024 = createMagicInitiateFeat('druid')
export const magicInitiateWizardSrd2024 = createMagicInitiateFeat('wizard')
