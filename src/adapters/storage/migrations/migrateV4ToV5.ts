import type { Character } from '../../../domain/types'
import type { StoredCharacterV4, StoredCharacterV5 } from '../storedCharacter'

function stripBackgroundBonuses(
  background: Character['background'],
): Character['background'] {
  if (background === null) {
    return null
  }

  const { abilityScoreBonuses: _removed, ...selection } = background as Character['background'] & {
    abilityScoreBonuses?: unknown
  }

  return selection
}

/**
 * Removes persisted derived ability score bonuses from background selections.
 */
export function migrateV4ToV5(envelope: unknown): StoredCharacterV5 {
  const v4 = envelope as StoredCharacterV4
  const background = v4.character.background ?? null

  const character = {
    ...v4.character,
    background: stripBackgroundBonuses(background),
  }

  return {
    schemaVersion: 5,
    character,
  }
}
