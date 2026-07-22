import { spellSourceKey } from '../../domain/spell/sourceKey'
import type { SpellSourceState } from '../../domain/spell/types'
import type { CharacterSpellcastingSummary } from '../character/resolveCharacterSpellcasting'

/**
 * Strip prepared selections that are no longer in the linked spellbook
 * (always-prepared grants are exempt — they are not player selections).
 * Call when updating spell source states after a spellbook edit.
 *
 * When `spellbookEntitlementId` is omitted, all spellbook-kind sources on the
 * same class instance are unioned (Wizard-style multi-acquisition books).
 */
export function prunePreparedSpellsNotInSpellbook(
  states: SpellSourceState[],
  summary: CharacterSpellcastingSummary,
): SpellSourceState[] {
  const preparedLinks: Array<{
    preparedSourceKey: string
    allowedSpellIds: Set<string>
  }> = []

  for (const group of summary.groups) {
    for (const entitlement of group.entitlements) {
      if (
        entitlement.kind !== 'select' ||
        entitlement.selectionKind !== 'prepared' ||
        entitlement.prepareFrom !== 'spellbook'
      ) {
        continue
      }

      const preparedSource = summary.activeSources.find((candidate) => {
        if (candidate.entitlementId !== entitlement.entitlementId) {
          return false
        }
        if (candidate.kind === 'class-instance') {
          return group.groupId === `class:${candidate.instanceId}`
        }
        return false
      })

      if (preparedSource === undefined || preparedSource.kind !== 'class-instance') {
        continue
      }

      const bookSources = summary.activeSources.filter((candidate) => {
        if (
          candidate.kind !== 'class-instance' ||
          candidate.instanceId !== preparedSource.instanceId
        ) {
          return false
        }

        const bookEntitlement = group.entitlements.find(
          (entry) =>
            entry.entitlementId === candidate.entitlementId &&
            entry.kind === 'select' &&
            entry.selectionKind === 'spellbook',
        )
        if (bookEntitlement === undefined) {
          return false
        }

        if (entitlement.spellbookEntitlementId !== undefined) {
          return candidate.entitlementId === entitlement.spellbookEntitlementId
        }

        return true
      })

      const bookIds = new Set<string>()
      for (const bookSource of bookSources) {
        const bookState = states.find(
          (state) =>
            spellSourceKey(state.source) === spellSourceKey(bookSource),
        )
        for (const selection of bookState?.selections ?? []) {
          bookIds.add(selection.spellId)
        }
      }

      for (const grant of entitlement.grantedSpells) {
        bookIds.add(grant.spellId)
      }

      preparedLinks.push({
        preparedSourceKey: spellSourceKey(preparedSource),
        allowedSpellIds: bookIds,
      })
    }
  }

  if (preparedLinks.length === 0) {
    return states
  }

  return states.map((state) => {
    const key = spellSourceKey(state.source)
    const link = preparedLinks.find((entry) => entry.preparedSourceKey === key)
    if (link === undefined) {
      return state
    }

    const nextSelections = state.selections.filter((selection) =>
      link.allowedSpellIds.has(selection.spellId),
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

/**
 * Convenience alias: prune prepared picks that depend on spellbook contents.
 */
export function pruneSpellSelectionsDependentOnSpellbook(
  states: SpellSourceState[],
  summary: CharacterSpellcastingSummary,
): SpellSourceState[] {
  return prunePreparedSpellsNotInSpellbook(states, summary)
}
