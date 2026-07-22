import type { SpellCatalog } from '../../domain/ports/spellCatalog'
import { spellSourceKey } from '../../domain/spell/sourceKey'
import type { SpellSourceState } from '../../domain/spell/types'
import type {
  CharacterSpellcastingSummary,
  ResolvedSpellEntitlement,
  ResolvedSpellSourceGroup,
} from '../character/resolveCharacterSpellcasting'
import {
  collectSpellAvailability,
  evaluateSpellSelectionEligibility,
} from './spellSelectionEligibility'

export type SpellValidationIssueCode =
  | 'inactive-source-state'
  | 'over-limit'
  | 'under-limit'
  | 'spell-not-found'
  | 'spell-not-on-list'
  | 'spell-level-ineligible'
  | 'spell-school-ineligible'
  | 'spell-casting-time-ineligible'
  | 'spell-ritual-ineligible'
  | 'duplicate-selection'
  | 'granted-spell-selected'
  | 'cross-source-duplicate'
  | 'not-in-spellbook'
  | 'invalid-prepare-from'

export type SpellValidationIssue = {
  code: SpellValidationIssueCode
  sourceKey: string
  groupLabel?: string
  entitlementId?: string
  spellId?: string
  message: string
}

export type SpellValidationResult =
  | { ok: true }
  | { ok: false; issues: SpellValidationIssue[] }

function findSelectEntitlement(
  groups: ResolvedSpellSourceGroup[],
  sourceKey: string,
): {
  group: ResolvedSpellSourceGroup
  entitlement: ResolvedSpellEntitlement
} | null {
  for (const group of groups) {
    for (const entitlement of group.entitlements) {
      if (entitlement.kind !== 'select') {
        continue
      }
      // Match by reconstructing from group + entitlement is awkward; callers
      // pass issues keyed by source. Look up by entitlement id within group
      // when the source key ends with the entitlement id.
      if (sourceKey.endsWith(`:${entitlement.entitlementId}`)) {
        return { group, entitlement }
      }
    }
  }
  return null
}

function validatePrepareFromConfig(
  group: ResolvedSpellSourceGroup,
  entitlement: ResolvedSpellEntitlement,
  sourceKey: string,
  issues: SpellValidationIssue[],
): boolean {
  if (entitlement.prepareFrom !== 'spellbook') {
    return true
  }

  // Union mode: all spellbook-kind sources on the same class group.
  if (
    entitlement.spellbookEntitlementId === undefined ||
    entitlement.spellbookEntitlementId.length === 0
  ) {
    const hasAnySpellbook = group.entitlements.some(
      (candidate) =>
        candidate.kind === 'select' &&
        candidate.selectionKind === 'spellbook',
    )
    if (!hasAnySpellbook) {
      issues.push({
        code: 'invalid-prepare-from',
        sourceKey,
        groupLabel: group.label,
        entitlementId: entitlement.entitlementId,
        message: `${group.label} — ${entitlement.label}: prepareFrom spellbook requires at least one spellbook entitlement on this source.`,
      })
      return false
    }
    return true
  }

  const book = group.entitlements.find(
    (candidate) =>
      candidate.kind === 'select' &&
      candidate.selectionKind === 'spellbook' &&
      candidate.entitlementId === entitlement.spellbookEntitlementId,
  )

  if (book === undefined) {
    issues.push({
      code: 'invalid-prepare-from',
      sourceKey,
      groupLabel: group.label,
      entitlementId: entitlement.entitlementId,
      message: `${group.label} — ${entitlement.label}: linked spellbook entitlement was not found.`,
    })
    return false
  }

  return true
}

function schoolsMatch(
  spellSchool: string,
  allowed: readonly string[] | undefined,
): boolean {
  if (allowed === undefined || allowed.length === 0) {
    return true
  }
  const normalized = spellSchool.toLowerCase()
  return allowed.some((entry) => entry.toLowerCase() === normalized)
}

/**
 * Soft-invalid validation: preserve selections, surface errors, require correction.
 * Does not mutate source states.
 */
export async function validateSpellSourceStates(
  summary: CharacterSpellcastingSummary,
  spellSourceStates: SpellSourceState[],
  spellCatalog: SpellCatalog,
): Promise<SpellValidationResult> {
  const issues: SpellValidationIssue[] = []
  const activeKeys = new Set(
    summary.activeSources.map((source) => spellSourceKey(source)),
  )
  const availability = collectSpellAvailability(summary)

  // Spell ids already recorded on other spellbook entitlements in the same group.
  const spellbookIdsByGroup = new Map<string, Map<string, Set<string>>>()
  for (const group of summary.groups) {
    const byEntitlement = new Map<string, Set<string>>()
    for (const entitlement of group.entitlements) {
      if (entitlement.selectionKind !== 'spellbook') {
        continue
      }
      byEntitlement.set(
        entitlement.entitlementId,
        new Set(entitlement.selectedSpellIds),
      )
    }
    spellbookIdsByGroup.set(group.groupId, byEntitlement)
  }

  for (const state of spellSourceStates) {
    const key = spellSourceKey(state.source)
    if (!activeKeys.has(key)) {
      issues.push({
        code: 'inactive-source-state',
        sourceKey: key,
        message: 'Spell source state is no longer active and should be removed.',
      })
      continue
    }

    const match = findSelectEntitlement(summary.groups, key)
    if (match === null) {
      // Granted-only source with leftover selections
      if (state.selections.length > 0) {
        issues.push({
          code: 'inactive-source-state',
          sourceKey: key,
          message: 'Selections exist for a non-selectable spell source.',
        })
      }
      continue
    }

    const { group, entitlement } = match
    validatePrepareFromConfig(group, entitlement, key, issues)

    const grantedIds = new Set(
      entitlement.grantedSpells.map((grant) => grant.spellId),
    )
    const spellbookEligible =
      entitlement.prepareFrom === 'spellbook'
        ? new Set([
            ...(entitlement.spellbookSpellIds ?? []),
            ...grantedIds,
          ])
        : null
    const seen = new Set<string>()

    for (const selection of state.selections) {
      if (seen.has(selection.spellId)) {
        issues.push({
          code: 'duplicate-selection',
          sourceKey: key,
          groupLabel: group.label,
          entitlementId: entitlement.entitlementId,
          spellId: selection.spellId,
          message: `Duplicate selection of ${selection.spellId}.`,
        })
        continue
      }
      seen.add(selection.spellId)

      if (grantedIds.has(selection.spellId)) {
        issues.push({
          code: 'granted-spell-selected',
          sourceKey: key,
          groupLabel: group.label,
          entitlementId: entitlement.entitlementId,
          spellId: selection.spellId,
          message: `${selection.spellId} is already granted and should not be selected.`,
        })
      }

      if (
        spellbookEligible !== null &&
        !spellbookEligible.has(selection.spellId)
      ) {
        issues.push({
          code: 'not-in-spellbook',
          sourceKey: key,
          groupLabel: group.label,
          entitlementId: entitlement.entitlementId,
          spellId: selection.spellId,
          message: `${selection.spellId} is not in the linked spellbook.`,
        })
      }

      const eligibility = evaluateSpellSelectionEligibility({
        spellId: selection.spellId,
        summary,
        group,
        entitlement,
        availability,
      })
      if (
        eligibility.recommendation === 'blocked' &&
        (eligibility.alreadyAvailableFromOtherSource ||
          eligibility.duplicateWithinCurrentSource)
      ) {
        issues.push({
          code: 'cross-source-duplicate',
          sourceKey: key,
          groupLabel: group.label,
          entitlementId: entitlement.entitlementId,
          spellId: selection.spellId,
          message:
            eligibility.duplicateReason ??
            'This spell is already available from another source.',
        })
      }

      const spell = await spellCatalog.getSpell(selection.spellId)
      if (spell === null) {
        issues.push({
          code: 'spell-not-found',
          sourceKey: key,
          groupLabel: group.label,
          entitlementId: entitlement.entitlementId,
          spellId: selection.spellId,
          message: `Unknown spell ${selection.spellId}.`,
        })
        continue
      }

      if (!entitlement.accessibleLevels.includes(spell.level)) {
        issues.push({
          code: 'spell-level-ineligible',
          sourceKey: key,
          groupLabel: group.label,
          entitlementId: entitlement.entitlementId,
          spellId: selection.spellId,
          message: `${spell.name} is not an eligible spell level for this source.`,
        })
      }

      if (!schoolsMatch(spell.school, entitlement.schools)) {
        issues.push({
          code: 'spell-school-ineligible',
          sourceKey: key,
          groupLabel: group.label,
          entitlementId: entitlement.entitlementId,
          spellId: selection.spellId,
          message: `${spell.name} is not an eligible school for this source.`,
        })
      }

      if (
        entitlement.castingTime !== undefined &&
        spell.castingTime !== entitlement.castingTime
      ) {
        issues.push({
          code: 'spell-casting-time-ineligible',
          sourceKey: key,
          groupLabel: group.label,
          entitlementId: entitlement.entitlementId,
          spellId: selection.spellId,
          message: `${spell.name} does not match the required casting time (${entitlement.castingTime}).`,
        })
      }

      if (entitlement.ritual === true && spell.ritual !== true) {
        issues.push({
          code: 'spell-ritual-ineligible',
          sourceKey: key,
          groupLabel: group.label,
          entitlementId: entitlement.entitlementId,
          spellId: selection.spellId,
          message: `${spell.name} is not a ritual spell.`,
        })
      }

      if (entitlement.selectionKind === 'spellbook') {
        const booksInGroup = spellbookIdsByGroup.get(group.groupId)
        if (booksInGroup !== undefined) {
          for (const [otherId, otherSpells] of booksInGroup) {
            if (otherId === entitlement.entitlementId) {
              continue
            }
            if (otherSpells.has(selection.spellId)) {
              issues.push({
                code: 'cross-source-duplicate',
                sourceKey: key,
                groupLabel: group.label,
                entitlementId: entitlement.entitlementId,
                spellId: selection.spellId,
                message: `${spell.name} is already recorded in another spellbook acquisition source.`,
              })
              break
            }
          }
        }
      }

      if (entitlement.listId !== undefined) {
        const list = await spellCatalog.getSpellList(entitlement.listId)
        if (list !== null && !list.spellIds.includes(selection.spellId)) {
          issues.push({
            code: 'spell-not-on-list',
            sourceKey: key,
            groupLabel: group.label,
            entitlementId: entitlement.entitlementId,
            spellId: selection.spellId,
            message: `${spell.name} is not on this source's spell list.`,
          })
        }
      }
    }

    const countingGrants = entitlement.grantedSpells.filter(
      (grant) => grant.countsAgainstLimit,
    ).length
    const used = state.selections.length + countingGrants

    if (used > entitlement.limit) {
      issues.push({
        code: 'over-limit',
        sourceKey: key,
        groupLabel: group.label,
        entitlementId: entitlement.entitlementId,
        message: `${group.label} — ${entitlement.label}: ${used}/${entitlement.limit} selections (over limit).`,
      })
    } else if (used < entitlement.limit) {
      issues.push({
        code: 'under-limit',
        sourceKey: key,
        groupLabel: group.label,
        entitlementId: entitlement.entitlementId,
        message: `${group.label} — ${entitlement.label}: ${used}/${entitlement.limit} selections.`,
      })
    }
  }

  // Missing source states for required select entitlements
  for (const group of summary.groups) {
    for (const entitlement of group.entitlements) {
      if (entitlement.kind !== 'select' || entitlement.limit <= 0) {
        continue
      }

      const source = summary.activeSources.find((candidate) => {
        if (candidate.entitlementId !== entitlement.entitlementId) {
          return false
        }
        if (candidate.kind === 'class-instance') {
          return group.groupId === `class:${candidate.instanceId}`
        }
        if (candidate.kind === 'feat') {
          if (candidate.slot === 'class-choice') {
            return (
              group.groupId ===
              `feat:class-choice:${candidate.instanceId}:${candidate.choiceId}:${candidate.featId}`
            )
          }
          return group.groupId === `feat:${candidate.slot}:${candidate.featId}`
        }
        if (candidate.kind === 'background-origin') {
          return group.groupId === `background-origin:${candidate.backgroundId}`
        }
        if (candidate.kind === 'species-trait') {
          return (
            group.groupId ===
            `species-trait:${candidate.speciesId}:${candidate.traitId}`
          )
        }
        return false
      })

      if (source === undefined) {
        continue
      }

      const key = spellSourceKey(source)
      const hasState = spellSourceStates.some(
        (state) => spellSourceKey(state.source) === key,
      )
      if (!hasState) {
        issues.push({
          code: 'under-limit',
          sourceKey: key,
          groupLabel: group.label,
          entitlementId: entitlement.entitlementId,
          message: `${group.label} — ${entitlement.label}: 0/${entitlement.limit} selections.`,
        })
      }
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues }
  }

  return { ok: true }
}
