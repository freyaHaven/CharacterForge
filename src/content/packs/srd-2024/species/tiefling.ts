import type {
  SpeciesChoiceOption,
  SpeciesDefinition,
} from '../../../../domain/species/types'
import { SRD_2024_SOURCE } from '../source'
import { SRD_2024_ORIGIN_LANGUAGES } from './originLanguages'
import {
  SRD_2024_SIZE_CHOICE,
  SRD_2024_SPELLCASTING_ABILITY_CHOICE,
} from './sharedChoices'

const DARKVISION_DESCRIPTION =
  'You have Darkvision with a range of 60 feet.'

const FIENDISH_LEGACY_OPTIONS: SpeciesChoiceOption[] = [
  {
    id: 'abyssal',
    label: 'Abyssal',
    description:
      'Level 1: Resistance to Poison damage; you know the Poison Spray cantrip. Level 3: Ray of Sickness. Level 5: Hold Person.',
    effects: [{ kind: 'damage-resistance', damageType: 'poison' }],
    spellcasting: {
      entitlements: [
        {
          id: 'abyssal-cantrip',
          kind: 'granted',
          spells: [{ spellId: 'srd-2024:poison-spray', minLevel: 1 }],
          countsAgainstLimit: false,
        },
        {
          id: 'abyssal-spells',
          kind: 'granted',
          spells: [
            { spellId: 'srd-2024:ray-of-sickness', minLevel: 3 },
            { spellId: 'srd-2024:hold-person', minLevel: 5 },
          ],
          countsAgainstLimit: false,
        },
      ],
    },
  },
  {
    id: 'chthonic',
    label: 'Chthonic',
    description:
      'Level 1: Resistance to Necrotic damage; you know the Chill Touch cantrip. Level 3: False Life. Level 5: Ray of Enfeeblement.',
    effects: [{ kind: 'damage-resistance', damageType: 'necrotic' }],
    spellcasting: {
      entitlements: [
        {
          id: 'chthonic-cantrip',
          kind: 'granted',
          spells: [{ spellId: 'srd-2024:chill-touch', minLevel: 1 }],
          countsAgainstLimit: false,
        },
        {
          id: 'chthonic-spells',
          kind: 'granted',
          spells: [
            { spellId: 'srd-2024:false-life', minLevel: 3 },
            { spellId: 'srd-2024:ray-of-enfeeblement', minLevel: 5 },
          ],
          countsAgainstLimit: false,
        },
      ],
    },
  },
  {
    id: 'infernal',
    label: 'Infernal',
    description:
      'Level 1: Resistance to Fire damage; you know the Fire Bolt cantrip. Level 3: Hellish Rebuke. Level 5: Darkness.',
    effects: [{ kind: 'damage-resistance', damageType: 'fire' }],
    spellcasting: {
      entitlements: [
        {
          id: 'infernal-cantrip',
          kind: 'granted',
          spells: [{ spellId: 'srd-2024:fire-bolt', minLevel: 1 }],
          countsAgainstLimit: false,
        },
        {
          id: 'infernal-spells',
          kind: 'granted',
          spells: [
            { spellId: 'srd-2024:hellish-rebuke', minLevel: 3 },
            { spellId: 'srd-2024:darkness', minLevel: 5 },
          ],
          countsAgainstLimit: false,
        },
      ],
    },
  },
]

export const tieflingSrd2024: SpeciesDefinition = {
  id: 'srd-2024:tiefling',
  editionId: 'srd-2024',
  name: 'Tiefling',
  description:
    'Tieflings are either born in the Lower Planes or have fiendish ancestors who originated there.',
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
      id: 'fiendish-legacy',
      name: 'Fiendish Legacy',
      description:
        'You are the recipient of a legacy that grants you supernatural abilities. Choose a legacy from the Fiendish Legacies table. You gain the level 1 benefit of the chosen legacy. When you reach character levels 3 and 5, you learn a higher-level spell, as shown on the table. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the legacy).',
    },
    {
      id: 'otherworldly-presence',
      name: 'Otherworldly Presence',
      description:
        'You know the Thaumaturgy cantrip. When you cast it with this trait, the spell uses the same spellcasting ability you use for your Fiendish Legacy trait.',
      spellcasting: {
        entitlements: [
          {
            id: 'thaumaturgy',
            kind: 'granted',
            spells: [{ spellId: 'srd-2024:thaumaturgy', minLevel: 1 }],
            countsAgainstLimit: false,
          },
        ],
      },
    },
  ],
  effects: [],
  choices: [
    SRD_2024_SIZE_CHOICE,
    {
      id: 'fiendish-legacy',
      prompt: 'Choose your fiendish legacy',
      type: 'single-select',
      required: true,
      helperText:
        'Your legacy determines damage Resistance, cantrips, and spells gained at levels 3 and 5.',
      options: FIENDISH_LEGACY_OPTIONS,
    },
    SRD_2024_SPELLCASTING_ABILITY_CHOICE,
  ],
  guidance: {
    age: 'Tieflings mature at the same rate as humans but live a few years longer.',
    height: 'Typical height: 90–210 cm (Small or Medium)',
  },
}
