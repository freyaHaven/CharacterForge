import type {
  SpeciesChoiceOption,
  SpeciesDefinition,
} from '../../../../domain/species/types'
import { SRD_2024_SOURCE } from '../source'
import { SRD_2024_ORIGIN_LANGUAGES } from './originLanguages'
import { SRD_2024_SPELLCASTING_ABILITY_CHOICE } from './sharedChoices'

const DARKVISION_DESCRIPTION =
  'You have Darkvision with a range of 60 feet.'

const GNOMISH_LINEAGE_OPTIONS: SpeciesChoiceOption[] = [
  {
    id: 'forest-gnome',
    label: 'Forest Gnome',
    description:
      'You know the Minor Illusion cantrip. You always have Speak with Animals prepared and can cast it without a spell slot a number of times equal to your Proficiency Bonus (regain all on a Long Rest), or using spell slots.',
    spellcasting: {
      entitlements: [
        {
          id: 'forest-gnome-cantrip',
          kind: 'granted',
          spells: [{ spellId: 'srd-2024:minor-illusion', minLevel: 1 }],
          countsAgainstLimit: false,
        },
        {
          id: 'forest-gnome-speak-with-animals',
          kind: 'granted',
          spells: [{ spellId: 'srd-2024:speak-with-animals', minLevel: 1 }],
          countsAgainstLimit: false,
        },
      ],
    },
  },
  {
    id: 'rock-gnome',
    label: 'Rock Gnome',
    description:
      'You know the Mending and Prestidigitation cantrips. You can spend 10 minutes casting Prestidigitation to create a Tiny clockwork device (AC 5, 1 HP) that produces one Prestidigitation effect; you can have three such devices at a time.',
    spellcasting: {
      entitlements: [
        {
          id: 'rock-gnome-cantrips',
          kind: 'granted',
          spells: [
            { spellId: 'srd-2024:mending', minLevel: 1 },
            { spellId: 'srd-2024:prestidigitation', minLevel: 1 },
          ],
          countsAgainstLimit: false,
        },
      ],
    },
  },
]

export const gnomeSrd2024: SpeciesDefinition = {
  id: 'srd-2024:gnome',
  editionId: 'srd-2024',
  name: 'Gnome',
  description:
    "A gnome's energy and enthusiasm for living shines through every inch of their tiny body.",
  source: SRD_2024_SOURCE,
  creatureType: 'humanoid',
  size: 'small',
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
      id: 'gnomish-cunning',
      name: 'Gnomish Cunning',
      description:
        'You have Advantage on Intelligence, Wisdom, and Charisma saving throws.',
      effects: [
        {
          kind: 'save-advantage-ability',
          abilities: ['intelligence', 'wisdom', 'charisma'],
        },
      ],
    },
    {
      id: 'gnomish-lineage',
      name: 'Gnomish Lineage',
      description:
        'You are part of a lineage that grants you supernatural abilities. Choose Forest Gnome or Rock Gnome; Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).',
    },
  ],
  effects: [],
  choices: [
    {
      id: 'gnomish-lineage',
      prompt: 'Choose your gnomish lineage',
      type: 'single-select',
      required: true,
      options: GNOMISH_LINEAGE_OPTIONS,
    },
    SRD_2024_SPELLCASTING_ABILITY_CHOICE,
  ],
  guidance: {
    age: 'Gnomes mature at the same rate as humans and can live 350 to nearly 500 years.',
    height: 'Typical height: 90–120 cm',
  },
}
