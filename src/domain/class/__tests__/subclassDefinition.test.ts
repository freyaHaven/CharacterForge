import { describe, expect, it } from 'vitest'
import { subclassToChoiceOption } from '../subclassDefinition'
import type { SubclassDefinition } from '../types'

const sampleSubclass: SubclassDefinition = {
  id: 'test:sample-subclass',
  classId: 'test:sample-class',
  editionId: 'srd-2024',
  name: 'Sample',
  description: 'A sample subclass.',
  source: {
    id: 'test-source',
    name: 'Synthetic Test Source',
    version: '1',
    licence: 'test',
    attribution: 'test',
    documentUrl: 'https://example.test',
  },
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
