import type { SpeciesDefinition } from '../../../domain/species/types'
import { SRD_2024_SOURCE } from './source'

export { SRD_2024_SOURCE } from './source'

export const dwarfSrd2024: SpeciesDefinition = {
  id: 'srd-2024:dwarf',
  editionId: 'srd-2024',
  name: 'Dwarf',
  description:
    'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal.',
  source: SRD_2024_SOURCE,
  size: 'medium',
  speed: { walk: 30 },
  traits: [
    {
      id: 'dwarven-resilience',
      name: 'Dwarven Resilience',
      description:
        'You have Advantage on saving throws to avoid or end the Poisoned condition. You also have Resistance to Poison damage.',
    },
    {
      id: 'dwarven-toughness',
      name: 'Dwarven Toughness',
      description:
        'Your Hit Point maximum increases by 1, and it increases by 1 again whenever you gain a level.',
    },
    {
      id: 'stonecunning',
      name: 'Stonecunning',
      description:
        'As a Bonus Action, you can gain Tremorsense with a range of 60 feet for 10 minutes. You must be on a stone surface or touching a stone surface to use this Benefit. You can use it a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.',
    },
  ],
  effects: [
    { kind: 'darkvision', rangeFeet: 120 },
    { kind: 'damage-resistance', damageType: 'poison' },
    { kind: 'save-advantage', condition: 'poisoned' },
    { kind: 'hit-point-maximum-per-level', amount: 1 },
  ],
  choices: [],
}
