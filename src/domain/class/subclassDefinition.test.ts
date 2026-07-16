import { describe, expect, it } from 'vitest'
import { subclassToChoiceOption } from './subclassDefinition'
import type { SubclassDefinition } from './types'
import { SRD_2024_SOURCE } from '../../content/packs/srd-2024/source'

const sampleSubclass: SubclassDefinition = {
  id: 'srd-2024:sample',
  classId: 'srd-2024:fighter',
  editionId: 'srd-2024',
  name: 'Sample',
  description: 'A sample subclass.',
  source: SRD_2024_SOURCE,
  choiceOptionId: 'sample',
  features: [
    {
      id: 'sample-feature',
      name: 'Sample Feature',
      level: 3,
      description: 'Does something.',
    },
  ],
}

describe('subclassToChoiceOption', () => {
  it('uses choiceOptionId as the selectable option id', () => {
    expect(subclassToChoiceOption(sampleSubclass)).toEqual({
      id: 'sample',
      label: 'Sample',
      description: 'A sample subclass.',
      features: sampleSubclass.features,
    })
  })
})
