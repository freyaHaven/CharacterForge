import type { AbilityId } from '../../domain/abilities/types'
import {
  presentationCategoryForOrigin,
  type SpellPresentationCategory,
} from '../../domain/spell/sourceOrigin'
import type {
  CharacterSpellcastingSummary,
  ResolvedGrantedSpell,
  ResolvedSpellEntitlement,
  ResolvedSpellSourceGroup,
} from '../../rules/character/resolveCharacterSpellcasting'

export type { SpellPresentationCategory }

export type SpellPresentationPool = {
  /** Resolver group that owns this entitlement (eligibility / source lookup). */
  group: ResolvedSpellSourceGroup
  entitlement: ResolvedSpellEntitlement
  /** Short label under the source (e.g. Cantrips, Prepared Spells). */
  title: string
}

export type SpellPresentationSource = {
  id: string
  category: SpellPresentationCategory
  title: string
  ability: AbilityId
  saveDcLabel: string
  attackBonusLabel: string
  /** Always-prepared grants for this source (merged; not folded into a select). */
  alwaysPrepared: ResolvedGrantedSpell[]
  pools: SpellPresentationPool[]
  /** Resolver groups contributing to this source (validation scoping). */
  groups: ResolvedSpellSourceGroup[]
}

export type SpellPresentationCategorySection = {
  category: SpellPresentationCategory
  label: string
  sources: SpellPresentationSource[]
}

const CATEGORY_ORDER: readonly SpellPresentationCategory[] = [
  'species',
  'background',
  'class',
  'subclass',
  'feat',
  'item',
]

const CATEGORY_LABEL: Readonly<Record<SpellPresentationCategory, string>> = {
  species: 'Granted by Species',
  background: 'Granted by Background',
  class: 'Granted by Class',
  subclass: 'Granted by Subclass',
  feat: 'Granted by Feat',
  item: 'Granted by Item',
}

function poolTitle(entitlement: ResolvedSpellEntitlement): string {
  if (entitlement.selectionKind === 'cantrip') {
    return 'Cantrips'
  }
  if (
    entitlement.selectionKind === 'prepared' &&
    !/mastery|signature/i.test(entitlement.label)
  ) {
    return 'Prepared Spells'
  }
  if (
    entitlement.selectionKind === 'known' &&
    entitlement.accessibleLevels.length === 1 &&
    entitlement.accessibleLevels[0] === 1
  ) {
    return '1st-level Spells'
  }
  if (entitlement.label.trim().length > 0) {
    return entitlement.label
  }

  switch (entitlement.selectionKind) {
    case 'prepared':
      return 'Prepared Spells'
    case 'known':
      return 'Known Spells'
    case 'spellbook':
      return 'Spellbook'
    default:
      return 'Spells'
  }
}

function compareSources(
  left: SpellPresentationSource,
  right: SpellPresentationSource,
): number {
  const leftKey = left.groups[0]?.sortKey
  const rightKey = right.groups[0]?.sortKey
  if (leftKey === undefined || rightKey === undefined) {
    return left.title.localeCompare(right.title)
  }

  if (leftKey.classInstanceIndex !== rightKey.classInstanceIndex) {
    return leftKey.classInstanceIndex - rightKey.classInstanceIndex
  }
  if (leftKey.grantingLevel !== rightKey.grantingLevel) {
    return leftKey.grantingLevel - rightKey.grantingLevel
  }
  if (leftKey.progressionOrder !== rightKey.progressionOrder) {
    return leftKey.progressionOrder - rightKey.progressionOrder
  }
  return left.title.localeCompare(right.title)
}

/**
 * Build the Spells-page hierarchy: category → source → always-prepared + pools.
 * Pure presentation — does not alter resolver entitlements or selection state.
 */
export function buildSpellPresentationModel(
  summary: CharacterSpellcastingSummary,
): SpellPresentationCategorySection[] {
  type MutableSource = {
    id: string
    category: SpellPresentationCategory
    title: string
    ability: AbilityId
    saveDcLabel: string
    attackBonusLabel: string
    alwaysPrepared: ResolvedGrantedSpell[]
    pools: SpellPresentationPool[]
    groups: ResolvedSpellSourceGroup[]
    seenGrantIds: Set<string>
    sortGrantingLevel: number
    sortProgressionOrder: number
  }

  const sourcesById = new Map<string, MutableSource>()

  for (const group of summary.groups) {
    for (const entitlement of group.entitlements) {
      const category =
        entitlement.presentation?.category ??
        presentationCategoryForOrigin(
          entitlement.originKind ?? group.sortKey.originKind,
        )
      const sourceId =
        entitlement.presentation?.sourceId ?? `${category}:${group.groupId}`
      const sourceTitle =
        entitlement.presentation?.sourceTitle ?? group.label

      let source = sourcesById.get(sourceId)
      if (source === undefined) {
        source = {
          id: sourceId,
          category,
          title: sourceTitle,
          ability: entitlement.ability,
          saveDcLabel: entitlement.saveDcLabel,
          attackBonusLabel: entitlement.attackBonusLabel,
          alwaysPrepared: [],
          pools: [],
          groups: [],
          seenGrantIds: new Set(),
          sortGrantingLevel: group.sortKey.grantingLevel,
          sortProgressionOrder: group.sortKey.progressionOrder,
        }
        sourcesById.set(sourceId, source)
      }

      if (!source.groups.some((entry) => entry.groupId === group.groupId)) {
        source.groups.push(group)
      }

      if (group.sortKey.grantingLevel < source.sortGrantingLevel) {
        source.sortGrantingLevel = group.sortKey.grantingLevel
        source.sortProgressionOrder = group.sortKey.progressionOrder
      }

      if (entitlement.kind === 'granted') {
        for (const grant of entitlement.grantedSpells) {
          if (source.seenGrantIds.has(grant.spellId)) {
            continue
          }
          source.seenGrantIds.add(grant.spellId)
          source.alwaysPrepared.push(grant)
        }
        continue
      }

      // Select pools that absorbed grants still own those cards.
      source.pools.push({
        group,
        entitlement,
        title: poolTitle(entitlement),
      })
    }
  }

  const byCategory = new Map<SpellPresentationCategory, SpellPresentationSource[]>()

  for (const mutable of sourcesById.values()) {
    const source: SpellPresentationSource = {
      id: mutable.id,
      category: mutable.category,
      title: mutable.title,
      ability: mutable.ability,
      saveDcLabel: mutable.saveDcLabel,
      attackBonusLabel: mutable.attackBonusLabel,
      alwaysPrepared: mutable.alwaysPrepared,
      pools: mutable.pools,
      groups: mutable.groups,
    }
    const list = byCategory.get(mutable.category) ?? []
    list.push(source)
    byCategory.set(mutable.category, list)
  }

  const sections: SpellPresentationCategorySection[] = []
  for (const category of CATEGORY_ORDER) {
    const sources = byCategory.get(category)
    if (sources === undefined || sources.length === 0) {
      continue
    }
    sources.sort(compareSources)
    sections.push({
      category,
      label: CATEGORY_LABEL[category],
      sources,
    })
  }

  return sections
}
