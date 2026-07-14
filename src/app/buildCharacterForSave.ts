import type { Character } from '../domain/types'
import type { PointBuyDraftScores } from '../features/ability-scores/pointBuyDraft'
import type { RolledDraft } from '../features/ability-scores/rolledDraft'
import { rolledDraftToAbilityScores } from '../features/ability-scores/rolledDraft'
import {
  standardArrayDraftToAbilityScores,
  type StandardArrayDraftScores,
} from '../features/ability-scores/standardArrayDraft'

type BuildCharacterForSaveInput = {
  character: Character
  standardArrayDraft: StandardArrayDraftScores | null
  pointBuyDraft: PointBuyDraftScores | null
  rolledDraft: RolledDraft | null
}

export function buildCharacterForSave({
  character,
  standardArrayDraft,
  pointBuyDraft,
  rolledDraft,
}: BuildCharacterForSaveInput): Character {
  if (
    character.creationMethod === 'standard-array' &&
    standardArrayDraft !== null
  ) {
    return {
      ...character,
      abilityScores: standardArrayDraftToAbilityScores(standardArrayDraft),
    }
  }

  if (character.creationMethod === 'point-buy' && pointBuyDraft !== null) {
    return {
      ...character,
      abilityScores: { ...pointBuyDraft },
    }
  }

  if (character.creationMethod === 'rolled' && rolledDraft !== null) {
    return {
      ...character,
      abilityScores: rolledDraftToAbilityScores(rolledDraft),
    }
  }

  return character
}
