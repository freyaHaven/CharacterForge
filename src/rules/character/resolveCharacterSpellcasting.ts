import type { AbilityId } from '../../domain/abilities/types'
import { getAbilityModifier } from '../../domain/abilities'
import { getChoicesAvailableAtLevel } from '../../domain/class/choiceAvailability'
import type {
  ClassDefinition,
} from '../../domain/class/types'
import {
  getProficiencyBonus,
  formatSignedModifier,
} from '../../domain/character/sheetMechanics'
import type { BackgroundCatalog } from '../../domain/ports/backgroundCatalog'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { SpellCatalog } from '../../domain/ports/spellCatalog'
import { spellSourceKey } from '../../domain/spell/sourceKey'
import type {
  CrossSourceDuplicatePolicy,
  FeatSpellcasting,
  SpellDefinition,
  SpellEntitlement,
  SpellSelectionKind,
  SpellSourceRef,
  SpellSourceState,
} from '../../domain/spell/types'
import type { Character } from '../../domain/types'
import { resolveSpellCount } from '../spell/resolveSpellCount'
import {
  collectSlotContributors,
  resolveSharedSpellSlots,
  type SharedSpellSlots,
} from '../spell/resolveSharedSpellSlots'

export type ResolvedGrantedSpell = {
  spellId: string
  name: string
  level: number
  countsAgainstLimit: boolean
  entitlementId: string
  label: string
}

export type ResolvedSpellEntitlement = {
  entitlementId: string
  kind: 'select' | 'granted'
  selectionKind?: SpellSelectionKind
  listId?: string
  label: string
  limit: number
  accessibleLevels: number[]
  selectedSpellIds: string[]
  grantedSpells: ResolvedGrantedSpell[]
  remainingPicks: number
  ability: AbilityId
  saveDc: number
  attackBonus: number
  saveDcLabel: string
  attackBonusLabel: string
  /** Resolved from content or selectionKind defaults. */
  crossSourceDuplicatePolicy?: CrossSourceDuplicatePolicy
}

export type ResolvedSpellSourceGroup = {
  groupId: string
  label: string
  ability: AbilityId
  saveDc: number
  attackBonus: number
  saveDcLabel: string
  attackBonusLabel: string
  entitlements: ResolvedSpellEntitlement[]
}

export type CharacterSpellcastingSummary = {
  hasSpellcastingCapability: boolean
  hasSpellContent: boolean
  spellLines: string[]
  groups: ResolvedSpellSourceGroup[]
  sharedSlots: SharedSpellSlots | null
  activeSources: SpellSourceRef[]
}

type ActiveEntitlement = {
  source: SpellSourceRef
  entitlement: SpellEntitlement
  label: string
  ability: AbilityId
  sourceLevel: number
  groupId: string
  groupLabel: string
}

function castingStats(
  ability: AbilityId,
  abilityScores: Character['abilityScores'],
  characterLevel: number,
): { saveDc: number; attackBonus: number; saveDcLabel: string; attackBonusLabel: string } {
  const mod = getAbilityModifier(abilityScores[ability])
  const proficiency = getProficiencyBonus(characterLevel)
  const saveDc = 8 + mod + proficiency
  const attackBonus = mod + proficiency
  return {
    saveDc,
    attackBonus,
    saveDcLabel: String(saveDc),
    attackBonusLabel: formatSignedModifier(attackBonus),
  }
}

function resolveAccessibleLevels(
  entitlement: Extract<SpellEntitlement, { kind: 'select' }>,
  slotCeiling: number,
): number[] {
  const min = entitlement.levelRange.min
  const max =
    entitlement.levelRange.max === 'slot-ceiling'
      ? slotCeiling
      : entitlement.levelRange.max

  if (max < min) {
    return []
  }

  const levels: number[] = []
  for (let level = min; level <= max; level += 1) {
    levels.push(level)
  }
  return levels
}

function findSourceState(
  states: SpellSourceState[],
  source: SpellSourceRef,
): SpellSourceState | undefined {
  const key = spellSourceKey(source)
  return states.find((state) => spellSourceKey(state.source) === key)
}

function collectClassActiveEntitlements(
  definition: ClassDefinition,
  instanceId: string,
  level: number,
  choices: Record<string, string | string[]>,
): ActiveEntitlement[] {
  const spellcasting = definition.spellcasting
  if (spellcasting === undefined) {
    return []
  }

  const active: ActiveEntitlement[] = []
  const groupId = `class:${instanceId}`
  const groupLabel = definition.name
  const ability = spellcasting.ability

  for (const entitlement of spellcasting.entitlements) {
    active.push({
      source: {
        kind: 'class-instance',
        instanceId,
        entitlementId: entitlement.id,
      },
      entitlement,
      label: entitlementLabel(entitlement, definition.name),
      ability,
      sourceLevel: level,
      groupId,
      groupLabel,
    })
  }

  for (const choice of getChoicesAvailableAtLevel(definition, level)) {
    const selected = choices[choice.id]
    if (selected === undefined) {
      continue
    }

    const selectedIds = Array.isArray(selected) ? selected : [selected]

    for (const option of choice.options) {
      if (!selectedIds.includes(option.id)) {
        continue
      }

      for (const entitlement of option.spellEntitlements ?? []) {
        active.push({
          source: {
            kind: 'class-instance',
            instanceId,
            entitlementId: entitlement.id,
          },
          entitlement,
          label: `${option.label}: ${entitlementLabel(entitlement, option.label)}`,
          ability,
          sourceLevel: level,
          groupId,
          groupLabel,
        })
      }

      for (const feature of option.features ?? []) {
        if (feature.level > level) {
          continue
        }

        for (const entitlement of feature.spellEntitlements ?? []) {
          active.push({
            source: {
              kind: 'class-instance',
              instanceId,
              entitlementId: entitlement.id,
            },
            entitlement,
            label: feature.name,
            ability,
            sourceLevel: level,
            groupId,
            groupLabel,
          })
        }
      }
    }
  }

  return active
}

function entitlementLabel(
  entitlement: SpellEntitlement,
  fallback: string,
): string {
  if (entitlement.kind === 'granted') {
    return fallback
  }

  switch (entitlement.selectionKind) {
    case 'cantrip':
      return 'Cantrips'
    case 'prepared':
      return 'Prepared Spells'
    case 'known':
      return 'Known Spells'
  }
}

function formatGrantedFeatSpellcastingLabel(
  featName: string,
  grantedBy: string,
  contextName?: string,
): string {
  const baseName = featName.replace(/\s*\([^)]*\)\s*$/u, '').trim()
  const displayName = baseName.length > 0 ? baseName : featName
  const suffix = `(Granted by ${grantedBy})`
  if (contextName !== undefined && contextName.length > 0) {
    return `${contextName}: ${displayName} ${suffix}`
  }
  return `${displayName} ${suffix}`
}

function collectFeatActiveEntitlements(
  spellcasting: FeatSpellcasting,
  sourceBase:
    | { kind: 'feat'; slot: 'character-feat'; featId: string }
    | {
        kind: 'feat'
        slot: 'class-choice'
        featId: string
        instanceId: string
        choiceId: string
      }
    | { kind: 'background-origin'; backgroundId: string },
  groupId: string,
  groupLabel: string,
): ActiveEntitlement[] {
  return spellcasting.entitlements.map((entitlement) => ({
    source:
      sourceBase.kind === 'feat'
        ? sourceBase.slot === 'class-choice'
          ? {
              kind: 'feat' as const,
              slot: 'class-choice' as const,
              featId: sourceBase.featId,
              instanceId: sourceBase.instanceId,
              choiceId: sourceBase.choiceId,
              entitlementId: entitlement.id,
            }
          : {
              kind: 'feat' as const,
              slot: 'character-feat' as const,
              featId: sourceBase.featId,
              entitlementId: entitlement.id,
            }
        : {
            kind: 'background-origin' as const,
            backgroundId: sourceBase.backgroundId,
            entitlementId: entitlement.id,
          },
    entitlement,
    label: entitlementLabel(entitlement, groupLabel),
    ability: spellcasting.ability,
    sourceLevel: 1,
    groupId,
    groupLabel,
  }))
}

function buildResolvedEntitlement(
  active: ActiveEntitlement,
  state: SpellSourceState | undefined,
  spellsById: Map<string, SpellDefinition>,
  slotCeiling: number,
  abilityScores: Character['abilityScores'],
  characterLevel: number,
): ResolvedSpellEntitlement {
  const stats = castingStats(active.ability, abilityScores, characterLevel)
  const { entitlement } = active

  if (entitlement.kind === 'granted') {
    const grantedSpells: ResolvedGrantedSpell[] = entitlement.spells
      .filter((entry) => entry.minLevel <= active.sourceLevel)
      .map((entry) => {
        const spell = spellsById.get(entry.spellId)
        return {
          spellId: entry.spellId,
          name: spell?.name ?? entry.spellId,
          level: spell?.level ?? 0,
          countsAgainstLimit: entitlement.countsAgainstLimit,
          entitlementId: entitlement.id,
          label: active.label,
        }
      })

    return {
      entitlementId: entitlement.id,
      kind: 'granted',
      selectionKind: entitlement.appliesTo,
      label: active.label,
      limit: 0,
      accessibleLevels: [],
      selectedSpellIds: [],
      grantedSpells,
      remainingPicks: 0,
      ability: active.ability,
      ...stats,
    }
  }

  const limit = resolveSpellCount(entitlement.count, active.sourceLevel)
  const accessibleLevels = resolveAccessibleLevels(entitlement, slotCeiling)
  const grantedCounting = 0
  const selectedSpellIds = (state?.selections ?? []).map(
    (selection) => selection.spellId,
  )
  const remainingPicks = Math.max(
    0,
    limit - selectedSpellIds.length - grantedCounting,
  )

  return {
    entitlementId: entitlement.id,
    kind: 'select',
    selectionKind: entitlement.selectionKind,
    listId: entitlement.listId,
    label: active.label,
    limit,
    accessibleLevels,
    selectedSpellIds,
    grantedSpells: [],
    remainingPicks,
    ability: active.ability,
    crossSourceDuplicatePolicy: entitlement.crossSourceDuplicatePolicy,
    ...stats,
  }
}

export async function resolveCharacterSpellcasting(
  classCatalog: ClassCatalog,
  character: Character,
  options?: {
    featCatalog?: FeatCatalog
    backgroundCatalog?: BackgroundCatalog
    spellCatalog?: SpellCatalog
  },
): Promise<CharacterSpellcastingSummary> {
  const definitionsById = new Map<string, ClassDefinition>()
  for (const instance of character.classes) {
    const definition = await classCatalog.getClass(instance.classId)
    if (definition !== null) {
      definitionsById.set(instance.classId, definition)
    }
  }

  const spellsById = new Map<string, SpellDefinition>()
  if (options?.spellCatalog !== undefined) {
    const spells = await options.spellCatalog.listSpells(character.editionId)
    for (const spell of spells) {
      spellsById.set(spell.id, spell)
    }
  }

  const activeEntitlements: ActiveEntitlement[] = []

  for (const instance of character.classes) {
    const definition = definitionsById.get(instance.classId)
    if (definition === undefined) {
      continue
    }

    activeEntitlements.push(
      ...collectClassActiveEntitlements(
        definition,
        instance.instanceId,
        instance.level,
        instance.choices,
      ),
    )
  }

  if (options?.featCatalog !== undefined) {
    const { resolveCharacterFeatGrants } = await import(
      './resolveCharacterFeatGrants'
    )

    if (options.backgroundCatalog !== undefined) {
      const resolvedFeats = await resolveCharacterFeatGrants(character, {
        classCatalog,
        backgroundCatalog: options.backgroundCatalog,
        featCatalog: options.featCatalog,
      })

      for (const grant of resolvedFeats.grants) {
        const feat = await options.featCatalog.getFeat(grant.featId)
        if (feat?.spellcasting === undefined) {
          continue
        }

        if (grant.source.kind === 'background-origin') {
          activeEntitlements.push(
            ...collectFeatActiveEntitlements(
              feat.spellcasting,
              {
                kind: 'background-origin',
                backgroundId: grant.source.backgroundId,
              },
              `background-origin:${grant.source.backgroundId}`,
              formatGrantedFeatSpellcastingLabel(
                feat.name,
                'Background',
                grant.source.backgroundName,
              ),
            ),
          )
        } else if (grant.source.kind === 'character-feat') {
          activeEntitlements.push(
            ...collectFeatActiveEntitlements(
              feat.spellcasting,
              {
                kind: 'feat',
                slot: 'character-feat',
                featId: feat.id,
              },
              `feat:character-feat:${feat.id}`,
              formatGrantedFeatSpellcastingLabel(feat.name, 'Feat'),
            ),
          )
        } else {
          activeEntitlements.push(
            ...collectFeatActiveEntitlements(
              feat.spellcasting,
              {
                kind: 'feat',
                slot: 'class-choice',
                featId: feat.id,
                instanceId: grant.source.instanceId,
                choiceId: grant.source.choiceId,
              },
              `feat:class-choice:${grant.source.instanceId}:${grant.source.choiceId}:${feat.id}`,
              formatGrantedFeatSpellcastingLabel(
                feat.name,
                grant.source.grantLabel,
                grant.source.className,
              ),
            ),
          )
        }
      }
    } else if (character.feat !== null) {
      const feat = await options.featCatalog.getFeat(character.feat.featId)
      if (feat?.spellcasting !== undefined) {
        activeEntitlements.push(
          ...collectFeatActiveEntitlements(
            feat.spellcasting,
            {
              kind: 'feat',
              slot: 'character-feat',
              featId: feat.id,
            },
            `feat:character-feat:${feat.id}`,
            formatGrantedFeatSpellcastingLabel(feat.name, 'Feat'),
          ),
        )
      }
    }
  }

  const normalizedActive = activeEntitlements

  const contributors = collectSlotContributors(
    character.classes,
    definitionsById,
  )
  const sharedSlots = resolveSharedSpellSlots(contributors)
  const slotCeiling = sharedSlots?.highestSlotLevel ?? 0

  const groupsById = new Map<string, ResolvedSpellSourceGroup>()

  for (const active of normalizedActive) {
    const stats = castingStats(
      active.ability,
      character.abilityScores,
      character.targetLevel,
    )
    let group = groupsById.get(active.groupId)
    if (group === undefined) {
      group = {
        groupId: active.groupId,
        label: active.groupLabel,
        ability: active.ability,
        ...stats,
        entitlements: [],
      }
      groupsById.set(active.groupId, group)
    }

    const state = findSourceState(character.spellSourceStates, active.source)
    const resolved = buildResolvedEntitlement(
      active,
      state,
      spellsById,
      slotCeiling,
      character.abilityScores,
      character.targetLevel,
    )

    group.entitlements.push(resolved)
  }

  // Fold granted spells into matching select pools for remaining-pick accounting.
  for (const group of groupsById.values()) {
    const grantedByKind = new Map<SpellSelectionKind, ResolvedGrantedSpell[]>()
    for (const entitlement of group.entitlements) {
      if (entitlement.kind !== 'granted') {
        continue
      }
      const kind = entitlement.selectionKind
      if (kind === undefined) {
        continue
      }
      const existing = grantedByKind.get(kind) ?? []
      existing.push(...entitlement.grantedSpells)
      grantedByKind.set(kind, existing)
    }

    for (const entitlement of group.entitlements) {
      if (entitlement.kind !== 'select' || entitlement.selectionKind === undefined) {
        continue
      }
      const grants = grantedByKind.get(entitlement.selectionKind) ?? []
      const counting = grants.filter((grant) => grant.countsAgainstLimit).length
      entitlement.grantedSpells = grants
      entitlement.remainingPicks = Math.max(
        0,
        entitlement.limit - entitlement.selectedSpellIds.length - counting,
      )
    }
  }

  const groups = [...groupsById.values()]
  const activeSources = normalizedActive.map((entry) => entry.source)
  const hasSpellContent = groups.some(
    (group) => group.entitlements.length > 0,
  )
  const hasSpellcastingCapability = contributors.length > 0 || hasSpellContent

  const spellLines: string[] = []
  for (const group of groups) {
    for (const entitlement of group.entitlements) {
      for (const granted of entitlement.grantedSpells) {
        if (entitlement.kind === 'granted') {
          spellLines.push(`${group.label}: ${granted.name} (always prepared)`)
        }
      }
      if (
        entitlement.kind === 'select' &&
        entitlement.selectedSpellIds.length > 0
      ) {
        const names = entitlement.selectedSpellIds.map(
          (spellId) => spellsById.get(spellId)?.name ?? spellId,
        )
        spellLines.push(
          `${group.label} — ${entitlement.label}: ${names.join(', ')}`,
        )
      }
    }
  }

  return {
    hasSpellcastingCapability,
    hasSpellContent,
    spellLines: [...new Set(spellLines)],
    groups,
    sharedSlots,
    activeSources,
  }
}
