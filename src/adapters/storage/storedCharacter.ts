import type { Character } from '../../domain/types'
import type { ClassSelection } from '../../domain/class/types'
import type {
  AbilityScores,
  CharacterCreationMethod,
  EditionId,
} from '../../domain/types'
import type { SpeciesSelection } from '../../domain/species/types'
import type { BackgroundSelection } from '../../domain/background/types'
import type { CharacterDetails } from '../../domain/character/details'

export const CURRENT_SCHEMA_VERSION = 12

type CharacterIdentity = {
  id: string
  name: string
  editionId: EditionId
  creationMethod: CharacterCreationMethod
  abilityScores: AbilityScores
}

export type StoredCharacterV1 = {
  schemaVersion: 1
  character: CharacterIdentity
}

export type StoredCharacterV2 = {
  schemaVersion: 2
  character: CharacterIdentity & {
    species: SpeciesSelection | null
  }
}

/** Schema v3: legacy single `class` selection. */
export type StoredCharacterV3Character = CharacterIdentity & {
  species: SpeciesSelection | null
  class: ClassSelection | null
}

export type StoredCharacterV3 = {
  schemaVersion: 3
  character: StoredCharacterV3Character
}

/** Schema v4–v6: background added; still uses legacy `class`. */
export type StoredCharacterV4Character = StoredCharacterV3Character & {
  background: BackgroundSelection | null
}

export type StoredCharacterV4 = {
  schemaVersion: 4
  character: StoredCharacterV4Character
}

export type StoredCharacterV5 = {
  schemaVersion: 5
  character: StoredCharacterV4Character
}

export type StoredCharacterV6 = {
  schemaVersion: 6
  character: StoredCharacterV4Character
}

/** Schema v7–v8: details added; still uses legacy `class`. */
export type StoredCharacterV7Character = StoredCharacterV4Character & {
  details: CharacterDetails
}

export type StoredCharacterV7 = {
  schemaVersion: 7
  character: StoredCharacterV7Character
}

export type StoredCharacterV8 = {
  schemaVersion: 8
  character: StoredCharacterV7Character
}

/** Schema v9: multiclass fields replace legacy `class`. */
export type StoredCharacterV9Character = CharacterIdentity & {
  species: SpeciesSelection | null
  targetLevel: Character['targetLevel']
  classes: Character['classes']
  startingClassInstanceId: string | null
  background: BackgroundSelection | null
  details: CharacterDetails
}

export type StoredCharacterV9 = {
  schemaVersion: 9
  character: StoredCharacterV9Character
}

/** Schema v10: optional committed feat selection. */
export type StoredCharacterV10 = {
  schemaVersion: 10
  character: Character
}

/** Schema v11: class instances include hit point increase choices. */
export type StoredCharacterV11 = {
  schemaVersion: 11
  character: Omit<Character, 'spellSourceStates'> & {
    spellSourceStates?: Character['spellSourceStates']
  }
}

/** Schema v12: persisted spell source states. */
export type StoredCharacterV12 = {
  schemaVersion: 12
  character: Character
}

export type StoredCharacter = StoredCharacterV12

export type ParseStoredCharacterResult =
  | { ok: true; character: Character }
  | {
      ok: false
      reason: 'malformed' | 'unsupported-version' | 'invalid-character'
    }

export function isStoredCharacterEnvelope(
  value: unknown,
  schemaVersion: number,
): value is
  | StoredCharacterV1
  | StoredCharacterV2
  | StoredCharacterV3
  | StoredCharacterV4
  | StoredCharacterV5
  | StoredCharacterV6
  | StoredCharacterV7
  | StoredCharacterV8
  | StoredCharacterV9
  | StoredCharacterV10
  | StoredCharacterV11
  | StoredCharacterV12 {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    candidate.schemaVersion === schemaVersion &&
    typeof candidate.character === 'object' &&
    candidate.character !== null
  )
}
