import { spellSourceKey } from '../../domain/spell/sourceKey'
import type { SpellSourceState } from '../../domain/spell/types'
import type { CharacterSpellcastingSummary } from '../character/resolveCharacterSpellcasting'

function groupIdForSource(
  summary: CharacterSpellcastingSummary,
  source: CharacterSpellcastingSummary['activeSources'][number],
): string | null {
  for (const group of summary.groups) {
    const hasEntitlement = group.entitlements.some(
      (entry) => entry.entitlementId === source.entitlementId,
    )
    if (!hasEntitlement) {
      continue
    }

    if (source.kind === 'class-instance') {
      if (group.groupId === `class:${source.instanceId}`) {
        return group.groupId
      }
      continue
    }

    return group.groupId
  }

  return null
}

/**
 * Remove selections that are no longer on the entitlement's resolved spell list
 * (e.g. Magical Secrets picks after dropping below the expansion level).
 */
export function pruneSpellsNotOnEntitlementList(
  states: SpellSourceState[],
  summary: CharacterSpellcastingSummary,
): SpellSourceState[] {
  const allowedBySourceKey = new Map<string, ReadonlySet<string>>()

  for (const source of summary.activeSources) {
    const groupId = groupIdForSource(summary, source)
    if (groupId === null) {
      continue
    }

    const group = summary.groups.find((entry) => entry.groupId === groupId)
    const entitlement = group?.entitlements.find(
      (entry) =>
        entry.entitlementId === source.entitlementId &&
        entry.kind === 'select',
    )

    if (entitlement?.listSpellIds === undefined) {
      continue
    }

    allowedBySourceKey.set(
      spellSourceKey(source),
      new Set(entitlement.listSpellIds),
    )
  }

  if (allowedBySourceKey.size === 0) {
    return states
  }

  return states.map((state) => {
    const allowed = allowedBySourceKey.get(spellSourceKey(state.source))
    if (allowed === undefined) {
      return state
    }

    const nextSelections = state.selections.filter((selection) =>
      allowed.has(selection.spellId),
    )

    if (nextSelections.length === state.selections.length) {
      return state
    }

    return {
      ...state,
      selections: nextSelections,
    }
  })
}
