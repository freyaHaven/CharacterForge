import type { Character } from '../../../domain/types'
import type { StoredCharacterV5, StoredCharacterV6 } from '../storedCharacter'

const BACKGROUND_EQUIPMENT_CHOICE_ID = 'starting-equipment'

function stripBackgroundEquipmentChoice(
  background: Character['background'],
): Character['background'] {
  if (background === null) {
    return null
  }

  if (!(BACKGROUND_EQUIPMENT_CHOICE_ID in background.choices)) {
    return background
  }

  const { [BACKGROUND_EQUIPMENT_CHOICE_ID]: _removed, ...choices } =
    background.choices

  return {
    ...background,
    choices,
  }
}

/**
 * Removes persisted background equipment choices now handled by the Equipment step.
 */
export function migrateV5ToV6(envelope: unknown): StoredCharacterV6 {
  const v5 = envelope as StoredCharacterV5

  return {
    schemaVersion: 6,
    character: {
      ...v5.character,
      background: stripBackgroundEquipmentChoice(v5.character.background ?? null),
    },
  }
}
