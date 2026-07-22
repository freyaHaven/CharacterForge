import type { SpellCatalog } from '../domain/ports/spellCatalog'
import { spellSourceKey } from '../domain/spell/sourceKey'
import type { SpellSourceState } from '../domain/spell/types'
import type {
  CharacterSpellcastingSummary,
  ResolvedSpellEntitlement,
} from '../rules/character/resolveCharacterSpellcasting'

/**
 * Test-only helper: fill every select entitlement up to its remaining picks
 * using eligible spells from the resolved list.
 *
 * Callers should run a second resolve+autofill pass for prepare-from-spellbook
 * after the spellbook entitlement is filled.
 */
export async function autofillSpellSourceStates(
  summary: CharacterSpellcastingSummary,
  spellCatalog: SpellCatalog,
  existing: SpellSourceState[] = [],
): Promise<SpellSourceState[]> {
  if (!summary.hasSpellContent) {
    return existing
  }

  const spells = await spellCatalog.listSpells('srd-2024')
  const spellById = new Map(spells.map((spell) => [spell.id, spell]))
  const statesByKey = new Map<string, SpellSourceState>()

  for (const state of existing) {
    statesByKey.set(spellSourceKey(state.source), {
      source: state.source,
      selections: [...state.selections],
    })
  }

  const spellbookSources = summary.activeSources.filter((source) => {
    const entitlement = findEntitlement(summary, source.entitlementId, source)
    return entitlement?.selectionKind === 'spellbook'
  })
  const otherSources = summary.activeSources.filter(
    (source) => !spellbookSources.includes(source),
  )

  /** Spell IDs already claimed by any spellbook acquisition source in this fill. */
  const claimedSpellbookIds = new Set<string>()
  for (const source of spellbookSources) {
    const key = spellSourceKey(source)
    const current = statesByKey.get(key)
    for (const selection of current?.selections ?? []) {
      claimedSpellbookIds.add(selection.spellId)
    }
  }

  for (const source of [...spellbookSources, ...otherSources]) {
    const entitlement = findEntitlement(summary, source.entitlementId, source)
    if (
      entitlement === undefined ||
      entitlement.kind !== 'select' ||
      entitlement.limit <= 0
    ) {
      continue
    }

    const key = spellSourceKey(source)
    const current = statesByKey.get(key)
    const selected = new Set(
      current?.selections.map((entry) => entry.spellId) ??
        entitlement.selectedSpellIds,
    )
    const grantedIds = new Set(
      entitlement.grantedSpells.map((grant) => grant.spellId),
    )
    const countingGrants = entitlement.grantedSpells.filter(
      (grant) => grant.countsAgainstLimit,
    ).length
    const targetCount =
      entitlement.countsAgainstLimit === false
        ? entitlement.limit
        : Math.max(0, entitlement.limit - countingGrants)

    const candidates = (entitlement.listSpellIds ?? []).filter((spellId) => {
      if (selected.has(spellId) || grantedIds.has(spellId)) {
        return false
      }
      if (
        entitlement.selectionKind === 'spellbook' &&
        claimedSpellbookIds.has(spellId)
      ) {
        return false
      }
      const spell = spellById.get(spellId)
      if (spell === undefined) {
        return false
      }
      if (!entitlement.accessibleLevels.includes(spell.level)) {
        return false
      }
      if (
        entitlement.schools !== undefined &&
        entitlement.schools.length > 0 &&
        !entitlement.schools.some(
          (school) => school.toLowerCase() === spell.school.toLowerCase(),
        )
      ) {
        return false
      }
      if (
        entitlement.castingTime !== undefined &&
        spell.castingTime !== entitlement.castingTime
      ) {
        return false
      }
      if (entitlement.ritual === true && spell.ritual !== true) {
        return false
      }
      if (
        entitlement.prepareFrom === 'spellbook' &&
        entitlement.spellbookSpellIds !== undefined &&
        !entitlement.spellbookSpellIds.includes(spellId) &&
        !grantedIds.has(spellId)
      ) {
        return false
      }
      return true
    })

    while (selected.size < targetCount && candidates.length > 0) {
      const next = candidates.shift()
      if (next === undefined) {
        break
      }
      selected.add(next)
      if (entitlement.selectionKind === 'spellbook') {
        claimedSpellbookIds.add(next)
      }
    }

    statesByKey.set(key, {
      source,
      selections: [...selected].map((spellId) => ({ spellId })),
    })
  }

  return [...statesByKey.values()]
}

function findEntitlement(
  summary: CharacterSpellcastingSummary,
  entitlementId: string,
  source: { kind: string; instanceId?: string },
): ResolvedSpellEntitlement | undefined {
  for (const group of summary.groups) {
    if (
      source.kind === 'class-instance' &&
      source.instanceId !== undefined &&
      group.groupId !== `class:${source.instanceId}`
    ) {
      continue
    }
    const match = group.entitlements.find(
      (entry) => entry.entitlementId === entitlementId,
    )
    if (match !== undefined) {
      return match
    }
  }
  return undefined
}
