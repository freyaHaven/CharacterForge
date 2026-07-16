import { describe, expect, it } from 'vitest'
import { subclassToChoiceOption } from '../../../../domain/class/subclassDefinition'
import { berserkerSrd2024 } from './berserker'

describe('berserkerSrd2024', () => {
  it('uses a stable registry id and choice option id', () => {
    expect(berserkerSrd2024.id).toBe('srd-2024:path-of-the-berserker')
    expect(berserkerSrd2024.choiceOptionId).toBe('path-of-the-berserker')
    expect(berserkerSrd2024.classId).toBe('srd-2024:barbarian')
  })

  it('maps to a ClassChoiceOption without changing the stored option id', () => {
    expect(subclassToChoiceOption(berserkerSrd2024)).toMatchObject({
      id: 'path-of-the-berserker',
      label: 'Path of the Berserker',
    })
    expect(subclassToChoiceOption(berserkerSrd2024).features).toHaveLength(4)
  })
})
