import type {
  SpeciesChoiceOption,
  SpeciesDefinition,
} from '../../../../domain/species/types'
import { SPELL_LIST_IDS } from '../spell-lists'
import { SRD_2024_SOURCE } from '../source'
import { SRD_2024_ORIGIN_LANGUAGES } from './originLanguages'
import { SRD_2024_SPELLCASTING_ABILITY_CHOICE } from './sharedChoices'

const DARKVISION_DESCRIPTION =
  'You have Darkvision with a range of 60 feet.'

const ELVEN_LINEAGE_OPTIONS: SpeciesChoiceOption[] = [
  {
    id: 'drow',
    label: 'Drow',
    description:
      'Level 1: Darkvision range increases to 120 feet; you know the Dancing Lights cantrip. Level 3: Faerie Fire. Level 5: Darkness.',
    effects: [{ kind: 'darkvision', rangeFeet: 120 }],
    spellcasting: {
      entitlements: [
        {
          id: 'drow-cantrip',
          kind: 'granted',
          spells: [{ spellId: 'srd-2024:dancing-lights', minLevel: 1 }],
          countsAgainstLimit: false,
        },
        {
          id: 'drow-spells',
          kind: 'granted',
          spells: [
            { spellId: 'srd-2024:faerie-fire', minLevel: 3 },
            { spellId: 'srd-2024:darkness', minLevel: 5 },
          ],
          countsAgainstLimit: false,
        },
      ],
    },
  },
  {
    id: 'high-elf',
    label: 'High Elf',
    description:
      'Level 1: You know Prestidigitation (replaceable with another Wizard cantrip when you finish a Long Rest). Level 3: Detect Magic. Level 5: Misty Step.',
    spellcasting: {
      spellListId: SPELL_LIST_IDS.wizard,
      entitlements: [
        {
          id: 'high-elf-cantrip',
          kind: 'select',
          listId: SPELL_LIST_IDS.wizard,
          selectionKind: 'cantrip',
          count: { kind: 'fixed', value: 1 },
          levelRange: { min: 0, max: 0 },
        },
        {
          id: 'high-elf-spells',
          kind: 'granted',
          spells: [
            { spellId: 'srd-2024:detect-magic', minLevel: 3 },
            { spellId: 'srd-2024:misty-step', minLevel: 5 },
          ],
          countsAgainstLimit: false,
        },
      ],
    },
  },
  {
    id: 'wood-elf',
    label: 'Wood Elf',
    description:
      'Level 1: Your Speed increases to 35 feet; you know the Druidcraft cantrip. Level 3: Longstrider. Level 5: Pass without Trace.',
    effects: [{ kind: 'speed-walk', feet: 35 }],
    spellcasting: {
      entitlements: [
        {
          id: 'wood-elf-cantrip',
          kind: 'granted',
          spells: [{ spellId: 'srd-2024:druidcraft', minLevel: 1 }],
          countsAgainstLimit: false,
        },
        {
          id: 'wood-elf-spells',
          kind: 'granted',
          spells: [
            { spellId: 'srd-2024:longstrider', minLevel: 3 },
            { spellId: 'srd-2024:pass-without-trace', minLevel: 5 },
          ],
          countsAgainstLimit: false,
        },
      ],
    },
  },
]

export const elfSrd2024: SpeciesDefinition = {
  id: 'srd-2024:elf',
  editionId: 'srd-2024',
  name: 'Elf',
  description:
    'Elves are a magical people of otherworldly grace, known for their keen senses and long lives.',
  source: SRD_2024_SOURCE,
  creatureType: 'humanoid',
  size: 'medium',
  speed: { walk: 30 },
  languages: SRD_2024_ORIGIN_LANGUAGES,
  traits: [
    {
      id: 'darkvision',
      name: 'Darkvision',
      description: DARKVISION_DESCRIPTION,
      effects: [{ kind: 'darkvision', rangeFeet: 60 }],
    },
    {
      id: 'elven-lineage',
      name: 'Elven Lineage',
      description:
        'You are part of a lineage that grants you supernatural abilities. Choose a lineage from the Elven Lineages table. You gain the level 1 benefit of that lineage. When you reach character levels 3 and 5, you learn a higher-level spell, as shown on the table. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).',
    },
    {
      id: 'fey-ancestry',
      name: 'Fey Ancestry',
      description:
        'You have Advantage on saving throws you make to avoid or end the Charmed condition.',
      effects: [{ kind: 'save-advantage', condition: 'charmed' }],
    },
    {
      id: 'keen-senses',
      name: 'Keen Senses',
      description:
        'You have proficiency in the Insight, Perception, or Survival skill.',
    },
    {
      id: 'trance',
      name: 'Trance',
      description:
        "You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.",
    },
  ],
  effects: [],
  choices: [
    {
      id: 'elven-lineage',
      prompt: 'Choose your elven lineage',
      type: 'single-select',
      required: true,
      helperText:
        'Your lineage determines cantrips, Darkvision range or Speed, and spells gained at levels 3 and 5.',
      options: ELVEN_LINEAGE_OPTIONS,
    },
    {
      id: 'keen-senses',
      prompt: 'Choose your Keen Senses skill',
      type: 'single-select',
      required: true,
      options: [
        {
          id: 'insight',
          label: 'Insight',
          effects: [{ kind: 'skill-proficiency', skillId: 'insight' }],
        },
        {
          id: 'perception',
          label: 'Perception',
          effects: [{ kind: 'skill-proficiency', skillId: 'perception' }],
        },
        {
          id: 'survival',
          label: 'Survival',
          effects: [{ kind: 'skill-proficiency', skillId: 'survival' }],
        },
      ],
    },
    SRD_2024_SPELLCASTING_ABILITY_CHOICE,
  ],
  guidance: {
    age: 'Elves can live to be over 700 years old.',
    height: 'Typical height: 150–180 cm',
  },
}
