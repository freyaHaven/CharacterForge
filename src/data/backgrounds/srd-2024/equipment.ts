import type { BackgroundEquipmentDefinition } from '../../../domain/background/types'

export function createStandardEquipmentChoice(
  packageSummary: string,
): BackgroundEquipmentDefinition {
  return {
    choiceId: 'starting-equipment',
    prompt: 'Choose starting equipment',
    packages: [
      {
        id: 'equipment-package',
        label: 'Equipment Package (A)',
        summary: packageSummary,
      },
    ],
    goldAlternative: {
      goldPieces: 50,
      label: '50 GP',
    },
  }
}
