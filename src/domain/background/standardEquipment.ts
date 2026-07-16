import type { BackgroundEquipmentDefinition } from './types'

/**
 * Standard SRD-style starting equipment choice shape used by background definitions.
 * Choice/package ids are stable persistence keys shared across backgrounds.
 */
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
