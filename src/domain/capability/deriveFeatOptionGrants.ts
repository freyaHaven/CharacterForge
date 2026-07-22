import type { FeatDefinition, FeatEffect } from '../feat/types'
import type { OptionGrant } from './types'

function grantsFromFeatEffect(effect: FeatEffect): OptionGrant[] {
  switch (effect.kind) {
    case 'initiative-proficiency':
      return [
        {
          kind: 'fixed',
          capability: { kind: 'initiative-proficiency', id: 'initiative' },
        },
      ]
    case 'armor-class-bonus':
      return [
        {
          kind: 'fixed',
          capability: {
            kind: 'armor-class-bonus',
            id: `ac-bonus:${effect.amount}:${effect.when ?? 'always'}`,
          },
        },
      ]
    case 'sense':
      return [
        {
          kind: 'fixed',
          capability: {
            kind: 'sense',
            id: `${effect.sense}:${effect.rangeFeet}`,
          },
        },
      ]
    case 'damage-resistance': {
      if (effect.damageType !== undefined) {
        return [
          {
            kind: 'fixed',
            capability: {
              kind: 'damage-resistance',
              id: effect.damageType,
            },
          },
        ]
      }
      if (effect.except !== undefined) {
        return [
          {
            kind: 'fixed',
            capability: {
              kind: 'damage-resistance',
              id: `except:${[...effect.except].sort().join(',')}`,
            },
          },
        ]
      }
      return []
    }
  }
}

/**
 * Derive structured grants from a feat definition.
 * Uses effects + spellcasting entitlements — never benefit prose.
 */
export function deriveFeatOptionGrants(
  definition: FeatDefinition,
): OptionGrant[] {
  const grants: OptionGrant[] = []

  for (const effect of definition.effects ?? []) {
    grants.push(...grantsFromFeatEffect(effect))
  }

  const spellcasting = definition.spellcasting
  if (spellcasting === undefined) {
    return grants
  }

  grants.push({
    kind: 'spell-list-access',
    listId: spellcasting.spellListId,
  })

  for (const entitlement of spellcasting.entitlements) {
    if (entitlement.kind === 'select') {
      grants.push({
        kind: 'spell-list-picks',
        listId: entitlement.listId,
        selectionKind: entitlement.selectionKind,
      })
      continue
    }

    for (const entry of entitlement.spells) {
      grants.push({
        kind: 'fixed',
        capability: { kind: 'spell', id: entry.spellId },
      })
    }
  }

  return grants
}
