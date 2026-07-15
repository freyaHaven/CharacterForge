import type {
  DamageTypeId,
  SpeciesChoiceOption,
  SpeciesDefinition,
} from '../../../domain/species/types'
import { SRD_2024_SOURCE } from './source'

type DraconicAncestryDefinition = {
  id: string
  label: string
  damageType: DamageTypeId
}

export const DRACONIC_ANCESTRIES: DraconicAncestryDefinition[] = [
  { id: 'black', label: 'Black', damageType: 'acid' },
  { id: 'blue', label: 'Blue', damageType: 'lightning' },
  { id: 'brass', label: 'Brass', damageType: 'fire' },
  { id: 'bronze', label: 'Bronze', damageType: 'lightning' },
  { id: 'copper', label: 'Copper', damageType: 'acid' },
  { id: 'gold', label: 'Gold', damageType: 'fire' },
  { id: 'green', label: 'Green', damageType: 'poison' },
  { id: 'red', label: 'Red', damageType: 'fire' },
  { id: 'silver', label: 'Silver', damageType: 'cold' },
  { id: 'white', label: 'White', damageType: 'cold' },
]

function formatDamageTypeLabel(damageType: DamageTypeId): string {
  return damageType.charAt(0).toUpperCase() + damageType.slice(1)
}

function createDraconicAncestryOptions(): SpeciesChoiceOption[] {
  return DRACONIC_ANCESTRIES.map(({ id, label, damageType }) => {
    const damageLabel = formatDamageTypeLabel(damageType)

    return {
      id,
      label: `${label} (${damageLabel})`,
      description: `${label} dragon ancestry grants ${damageLabel} damage Resistance. Your Breath Weapon also deals ${damageLabel} damage.`,
      effects: [{ kind: 'damage-resistance', damageType }],
    }
  })
}

export const dragonbornSrd2024: SpeciesDefinition = {
  id: 'srd-2024:dragonborn',
  editionId: 'srd-2024',
  name: 'Dragonborn',
  description:
    'The ancestors of dragonborn hatched from the eggs of chromatic and metallic dragons. Dragonborn look like wingless, bipedal dragons.',
  source: SRD_2024_SOURCE,
  size: 'medium',
  speed: { walk: 30 },
  traits: [
    {
      id: 'breath-weapon',
      name: 'Breath Weapon',
      description:
        'When you take the Attack action, you can replace one attack with an exhalation of magical energy in a 15-foot Cone or 30-foot Line. The damage type matches your Draconic Ancestry.',
    },
    {
      id: 'draconic-flight',
      name: 'Draconic Flight',
      description:
        'At level 5, you can sprout spectral wings for 10 minutes, gaining a Fly Speed equal to your Speed. Once used, you cannot use it again until you finish a Long Rest.',
    },
  ],
  effects: [{ kind: 'darkvision', rangeFeet: 60 }],
  choices: [
    {
      id: 'draconic-ancestry',
      prompt: 'Choose your draconic ancestor',
      type: 'single-select',
      required: true,
      options: createDraconicAncestryOptions(),
    },
  ],
  guidance: {
    age: 'Dragonborn reach adulthood by age 15 and live around 80 years.',
    height: 'Typical height: 170–195 cm',
  },
}
