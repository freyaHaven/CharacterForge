import { describe, expect, it } from 'vitest'
import { createStandardEquipmentChoice } from '../standardEquipment'

describe('createStandardEquipmentChoice', () => {
  it('uses stable choice and package ids with a 50 GP alternative', () => {
    const equipment = createStandardEquipmentChoice('Spear and kit')

    expect(equipment.choiceId).toBe('starting-equipment')
    expect(equipment.packages).toEqual([
      {
        id: 'equipment-package',
        label: 'Equipment Package (A)',
        summary: 'Spear and kit',
      },
    ])
    expect(equipment.goldAlternative).toEqual({
      goldPieces: 50,
      label: '50 GP',
    })
  })
})
