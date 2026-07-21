import type { SpeciesChoice } from '../../../../domain/species/types'

/** Spellcasting ability pick shared by lineage/legacy species traits. */
export const SRD_2024_SPELLCASTING_ABILITY_CHOICE: SpeciesChoice = {
  id: 'spellcasting-ability',
  prompt: 'Choose your spellcasting ability',
  type: 'single-select',
  required: true,
  helperText:
    'Intelligence, Wisdom, or Charisma is your spellcasting ability for spells you cast with this species trait.',
  options: [
    { id: 'intelligence', label: 'Intelligence' },
    { id: 'wisdom', label: 'Wisdom' },
    { id: 'charisma', label: 'Charisma' },
  ],
}

/** Size pick for species that allow Small or Medium. */
export const SRD_2024_SIZE_CHOICE: SpeciesChoice = {
  id: 'size',
  prompt: 'Choose your size',
  type: 'single-select',
  required: true,
  options: [
    {
      id: 'medium',
      label: 'Medium',
      effects: [{ kind: 'size', size: 'medium' }],
    },
    {
      id: 'small',
      label: 'Small',
      effects: [{ kind: 'size', size: 'small' }],
    },
  ],
}
