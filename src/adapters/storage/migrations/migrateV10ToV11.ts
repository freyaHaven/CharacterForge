import type {
  StoredCharacterV10,
  StoredCharacterV11,
} from '../storedCharacter'
import { syncHitPointIncreases } from '../../../domain/class/hitPointIncreases'

/**
 * Adds `hitPointIncreases` to every class instance (defaulting to max/fixed).
 */
export function migrateV10ToV11(envelope: unknown): StoredCharacterV11 {
  const v10 = envelope as StoredCharacterV10
  const startingClassInstanceId = v10.character.startingClassInstanceId

  return {
    schemaVersion: 11,
    character: {
      ...v10.character,
      classes: v10.character.classes.map((instance) => ({
        ...instance,
        hitPointIncreases: syncHitPointIncreases(
          instance.hitPointIncreases,
          instance.level,
          {
            isStartingClass:
              startingClassInstanceId !== null &&
              instance.instanceId === startingClassInstanceId,
          },
        ),
      })),
    },
  }
}
