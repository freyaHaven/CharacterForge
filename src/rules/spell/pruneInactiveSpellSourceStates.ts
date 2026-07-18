import type { Character } from '../../domain/types'
import type { SpellSourceRef, SpellSourceState } from '../../domain/spell/types'
import { spellSourceKey } from '../../domain/spell/sourceKey'

/**
 * Remove persisted source states whose sources are no longer active.
 * Does not prune individual selections for soft-invalid eligibility changes.
 */
export function pruneInactiveSpellSourceStates(
  character: Character,
  activeSources: readonly SpellSourceRef[],
): SpellSourceState[] {
  const activeKeys = new Set(activeSources.map(spellSourceKey))

  return character.spellSourceStates.filter((state) =>
    activeKeys.has(spellSourceKey(state.source)),
  )
}
