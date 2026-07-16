import { describe, expect, it } from 'vitest'
import { subclassToChoiceOption } from '../../../../../domain/class/subclassDefinition'
import { championSrd2024 } from '../champion'

describe('championSrd2024', () => {
  it('uses a stable registry id and choice option id', () => {
    expect(championSrd2024.id).toBe('srd-2024:champion')
    expect(championSrd2024.choiceOptionId).toBe('champion')
    expect(championSrd2024.classId).toBe('srd-2024:fighter')
  })

  it('maps to a ClassChoiceOption without changing the stored option id', () => {
    expect(subclassToChoiceOption(championSrd2024)).toMatchObject({
      id: 'champion',
      label: 'Champion',
    })
    expect(subclassToChoiceOption(championSrd2024).features).toHaveLength(6)
  })
})
