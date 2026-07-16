import type { SpeciesLanguages } from '../../../../domain/species/types'

/**
 * SRD 5.2.1 origin languages (Character Creation § Choose Languages).
 * Species entries do not grant languages; every character knows Common plus
 * two languages chosen or rolled from the Standard Languages table.
 */
export const SRD_2024_ORIGIN_LANGUAGES: SpeciesLanguages = {
  grants: [{ id: 'common', label: 'Common' }],
  choices: [
    {
      id: 'standard-languages',
      prompt: 'Choose 2 Standard Languages',
      count: 2,
      pool: 'standard',
      required: true,
    },
  ],
}
