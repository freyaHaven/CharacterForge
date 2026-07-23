import type {
  CharacterSpellcastingSummary,
  ResolvedSpellEntitlement,
  ResolvedSpellSourceGroup,
} from '../character/resolveCharacterSpellcasting'
import type {
  CapabilityToken,
  CharacterCapabilityInventory,
} from '../../domain/capability/types'
import { emptyCapabilityInventory } from '../../domain/capability/types'
import type { FeatEffect } from '../../domain/feat/types'

function addToken(
  tokens: CapabilityToken[],
  token: CapabilityToken,
): void {
  const duplicate = tokens.some(
    (existing) =>
      existing.kind === token.kind &&
      existing.id === token.id &&
      existing.source.label === token.source.label &&
      existing.how === token.how,
  )
  if (!duplicate) {
    tokens.push(token)
  }
}

function tokensFromFeatEffect(
  effect: FeatEffect,
  sourceLabel: string,
): CapabilityToken[] {
  switch (effect.kind) {
    case 'initiative-proficiency':
      return [
        {
          kind: 'initiative-proficiency',
          id: 'initiative',
          source: { label: sourceLabel, kind: 'feat-effect' },
          how: 'fixed',
        },
      ]
    case 'armor-class-bonus':
      return [
        {
          kind: 'armor-class-bonus',
          id: `ac-bonus:${effect.amount}:${effect.when ?? 'always'}`,
          source: { label: sourceLabel, kind: 'feat-effect' },
          how: 'fixed',
        },
      ]
    case 'sense':
      return [
        {
          kind: 'sense',
          id: `${effect.sense}:${effect.rangeFeet}`,
          source: { label: sourceLabel, kind: 'feat-effect' },
          how: 'fixed',
        },
      ]
    case 'damage-resistance': {
      if (effect.damageType !== undefined) {
        return [
          {
            kind: 'damage-resistance',
            id: effect.damageType,
            source: { label: sourceLabel, kind: 'feat-effect' },
            how: 'fixed',
          },
        ]
      }
      if (effect.except !== undefined) {
        return [
          {
            kind: 'damage-resistance',
            id: `except:${[...effect.except].sort().join(',')}`,
            source: { label: sourceLabel, kind: 'feat-effect' },
            how: 'fixed',
          },
        ]
      }
      return []
    }
  }
}

function addConcreteSpellToken(
  tokens: CapabilityToken[],
  input: {
    spellId: string
    group: ResolvedSpellSourceGroup
    entitlementLabel: string
    entitlementId: string
    how: 'selected' | 'granted'
    sourceKind: string
  },
): void {
  addToken(tokens, {
    kind: 'spell',
    id: input.spellId,
    source: {
      label: `${input.group.label} — ${input.entitlementLabel}`,
      kind: input.sourceKind,
      id: input.group.groupId,
    },
    how: input.how,
  })
}

/**
 * Index concrete spells and (separately) spell-list access from one group.
 *
 * Distinctions:
 * - `spell` + how `selected` — known / prepared / chosen
 * - `spell` + how `granted` — always-prepared or innate grants
 * - `spell-list-access` — may prepare/learn from a list; does NOT mean every
 *   spell on that list is already known
 *
 * Standalone `granted` entitlements (species lineage, some subclass features)
 * are included even when no select pool exists on the same group.
 */
function addSpellcastingGroupTokens(
  tokens: CapabilityToken[],
  group: ResolvedSpellSourceGroup,
): void {
  const listAccessSource = {
    label: group.label,
    kind: 'spell-source',
    id: group.groupId,
  }

  for (const entitlement of group.entitlements) {
    if (entitlement.kind === 'granted') {
      addGrantedEntitlementTokens(tokens, group, entitlement)
      continue
    }

    if (entitlement.kind !== 'select') {
      continue
    }

    if (entitlement.selectionKind === 'spellbook') {
      continue
    }

    if (entitlement.listId !== undefined) {
      addToken(tokens, {
        kind: 'spell-list-access',
        id: entitlement.listId,
        source: listAccessSource,
        how: 'fixed',
      })
    }

    for (const spellId of entitlement.selectedSpellIds) {
      addConcreteSpellToken(tokens, {
        spellId,
        group,
        entitlementLabel: entitlement.label,
        entitlementId: entitlement.entitlementId,
        how: 'selected',
        sourceKind: 'spell-selection',
      })
    }

    for (const grant of entitlement.grantedSpells) {
      addConcreteSpellToken(tokens, {
        spellId: grant.spellId,
        group,
        entitlementLabel: grant.label,
        entitlementId: grant.entitlementId,
        how: 'granted',
        sourceKind: 'spell-grant',
      })
    }
  }
}

function addGrantedEntitlementTokens(
  tokens: CapabilityToken[],
  group: ResolvedSpellSourceGroup,
  entitlement: ResolvedSpellEntitlement,
): void {
  for (const grant of entitlement.grantedSpells) {
    addConcreteSpellToken(tokens, {
      spellId: grant.spellId,
      group,
      entitlementLabel: grant.label,
      entitlementId: grant.entitlementId,
      how: 'granted',
      sourceKind: 'spell-grant',
    })
  }
}

/**
 * Build a capability inventory from resolved character state.
 *
 * Spell capabilities come from {@link CharacterSpellcastingSummary}, which
 * already aggregates class, subclass, species, background, and feat sources.
 * Item / homebrew grants should either appear in that summary or be passed via
 * {@link extraTokens} until a dedicated equipment-spell resolver exists.
 */
export function buildCharacterCapabilityInventory(input: {
  spellcasting?: CharacterSpellcastingSummary | null
  featEffects?: readonly { effect: FeatEffect; sourceLabel: string }[]
  extraTokens?: readonly CapabilityToken[]
}): CharacterCapabilityInventory {
  const tokens: CapabilityToken[] = []

  if (input.spellcasting !== undefined && input.spellcasting !== null) {
    for (const group of input.spellcasting.groups) {
      addSpellcastingGroupTokens(tokens, group)
    }
  }

  for (const entry of input.featEffects ?? []) {
    for (const token of tokensFromFeatEffect(entry.effect, entry.sourceLabel)) {
      addToken(tokens, token)
    }
  }

  for (const token of input.extraTokens ?? []) {
    addToken(tokens, token)
  }

  if (tokens.length === 0) {
    return emptyCapabilityInventory()
  }

  return { tokens }
}

/**
 * Lightweight inventory from class definitions alone (spell-list access).
 * Useful for ASI / feat-grant pickers that do not have a full spellcasting summary.
 *
 * Does not imply any concrete spell is known — only that the class list is available.
 */
export function buildSpellListAccessTokensFromClasses(
  classes: readonly {
    instanceId: string
    classId: string
  }[],
  classDefinitionsById: ReadonlyMap<
    string,
    { name: string; spellcasting?: { spellListId: string } }
  >,
): CapabilityToken[] {
  const tokens: CapabilityToken[] = []
  for (const instance of classes) {
    const definition = classDefinitionsById.get(instance.classId)
    const listId = definition?.spellcasting?.spellListId
    if (definition === undefined || listId === undefined) {
      continue
    }
    addToken(tokens, {
      kind: 'spell-list-access',
      id: listId,
      source: {
        label: definition.name,
        kind: 'class',
        id: instance.instanceId,
      },
      how: 'fixed',
    })
  }
  return tokens
}
