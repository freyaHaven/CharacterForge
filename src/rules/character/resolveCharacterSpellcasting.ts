import type { AbilityId } from '../../domain/abilities/types'
import { getAbilityModifier } from '../../domain/abilities'
import { getChoicesAvailableAtLevel } from '../../domain/class/choiceAvailability'
import { getClassFeaturesUpToLevel } from '../../domain/class/featureProgression'
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
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { SpellCatalog } from '../../domain/ports/spellCatalog'
import { spellSourceKey } from '../../domain/spell/sourceKey'
import {
  compareSpellSourceGroupSortKeys,
  compareSpellSourceSortKeys,
  isSubclassClassChoice,
  spellSourceGroupBand,
  type SpellSourceOriginKind,
  type SpellSourceSortKey,
} from '../../domain/spell/sourceOrigin'
import type {
  CrossSourceDuplicatePolicy,
  FeatSpellcasting,
  SpellDefinition,
  SpellEntitlement,
  SpellPrepareFrom,
  SpellSelectionKind,
  SpellSourceRef,
  SpellSourceState,
} from '../../domain/spell/types'
import type { Character } from '../../domain/types'
import { resolveFeatSpellcastingAbility } from '../../domain/feat/resolveFeatSpellcastingAbility'
import {
  collectSpeciesSpellcastingBlocks,
  getSpeciesSpellcastingAbility,
} from '../../domain/species/resolveSpeciesDerived'
import { resolveSpellCount } from '../spell/resolveSpellCount'
import {
  highestSlotLevel,
  slotsAtLevel,
} from '../../domain/spell/progressions'
import {
  collectSlotContributors,
  resolvePactMagicSlots,
  resolveSharedSpellSlots,
  type PactMagicSlots,
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
  /** Optional helper copy (e.g. Magical Secrets active hint). */
  description?: string
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
  /** Prepared entitlements: where picks may be chosen from. */
  prepareFrom?: SpellPrepareFrom
  /** Linked spellbook entitlement id when prepareFrom is spellbook. */
  spellbookEntitlementId?: string
  /** Resolved spellbook contents for UI filtering (same class instance). */
  spellbookSpellIds?: string[]
  /**
   * When false, selections do not consume a shared prepared budget
   * (Spell Mastery / Signature Spells). Defaults to true for selects.
   */
  countsAgainstLimit?: boolean
  /** School filter from content (case-insensitive match). */
  schools?: string[]
  /** Casting-time filter from content (exact match). */
  castingTime?: string
  /** When true, only ritual-tagged spells are eligible. */
  ritual?: boolean
  /** Spell ids on the resolved list (when catalogue was available). */
  listSpellIds?: readonly string[]
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
  /** Stable ordering metadata (set by resolver; not for display parsing). */
  sortKey: SpellSourceSortKey
}

export type CharacterSpellcastingSummary = {
  hasSpellcastingCapability: boolean
  hasSpellContent: boolean
  spellLines: string[]
  groups: ResolvedSpellSourceGroup[]
  sharedSlots: SharedSpellSlots | null
  /** Pact Magic pools (never merged into sharedSlots). */
  pactSlots: PactMagicSlots | null
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
  /** Class spell-slot progression for class-instance sources (own slots, not shared). */
  classSlotsByLevel?: number[][]
  sortKey: SpellSourceSortKey
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

/** First class level where a by-source-level count becomes positive. */
export function countUnlockLevel(
  count: Extract<SpellEntitlement, { kind: 'select' }>['count'],
): number | null {
  if (count.kind !== 'by-source-level') {
    return null
  }
  const index = count.table.findIndex((value) => value > 0)
  return index === -1 ? null : index + 1
}

/**
 * Resolve the class-own (or fallback shared) spell-slot ceiling for an entitlement.
 * Multiclass shared slots never unlock higher spell levels for another class.
 */
export function resolveEntitlementSlotCeiling(input: {
  entitlement: Extract<SpellEntitlement, { kind: 'select' }>
  sourceLevel: number
  classSlotsByLevel?: number[][]
  sharedSlotCeiling: number
}): number {
  if (input.entitlement.levelRange.max !== 'slot-ceiling') {
    return input.sharedSlotCeiling
  }

  let levelForCeiling = input.sourceLevel
  if (input.entitlement.levelRange.slotCeilingAt === 'count-unlock-level') {
    const unlock = countUnlockLevel(input.entitlement.count)
    if (unlock !== null) {
      levelForCeiling = unlock
    }
  }

  if (
    input.classSlotsByLevel !== undefined &&
    input.classSlotsByLevel.length > 0
  ) {
    return highestSlotLevel(
      slotsAtLevel(input.classSlotsByLevel, levelForCeiling),
    )
  }

  return input.sharedSlotCeiling
}

function resolveAccessibleLevels(
  entitlement: Extract<SpellEntitlement, { kind: 'select' }>,
  slotCeiling: number,
  pactSlotLevel: number | null,
): number[] {
  const min = entitlement.levelRange.min
  let max: number
  if (entitlement.levelRange.max === 'slot-ceiling') {
    max = slotCeiling
  } else if (entitlement.levelRange.max === 'pact-slot-level') {
    max = pactSlotLevel ?? 0
  } else {
    max = entitlement.levelRange.max
  }

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
  classInstanceIndex: number,
  progressionCounter: { value: number },
): ActiveEntitlement[] {
  const spellcasting = definition.spellcasting
  if (spellcasting === undefined) {
    return []
  }

  const active: ActiveEntitlement[] = []
  const groupId = `class:${instanceId}`
  const groupLabel = definition.name
  const ability = spellcasting.ability

  const nextSortKey = (
    originKind: SpellSourceOriginKind,
    grantingLevel: number,
    displayName: string,
  ): SpellSourceSortKey => {
    const progressionOrder = progressionCounter.value
    progressionCounter.value += 1
    return {
      originKind,
      classInstanceIndex,
      grantingLevel,
      progressionOrder,
      displayName,
    }
  }

  for (const entitlement of spellcasting.entitlements) {
    const label = entitlementLabel(entitlement, definition.name)
    active.push({
      source: {
        kind: 'class-instance',
        instanceId,
        entitlementId: entitlement.id,
      },
      entitlement,
      label,
      ability,
      sourceLevel: level,
      groupId,
      groupLabel,
      classSlotsByLevel: spellcasting.slotsByLevel,
      sortKey: nextSortKey('class-core', 1, label),
    })
  }

  for (const choice of getChoicesAvailableAtLevel(
    definition,
    level,
    choices,
  )) {
    const selected = choices[choice.id]
    if (selected === undefined) {
      continue
    }

    const selectedIds = Array.isArray(selected) ? selected : [selected]
    const subclassChoice = isSubclassClassChoice(choice)

    for (const option of choice.options) {
      if (!selectedIds.includes(option.id)) {
        continue
      }

      for (const entitlement of option.spellEntitlements ?? []) {
        const label = `${option.label}: ${entitlementLabel(entitlement, option.label)}`
        active.push({
          source: {
            kind: 'class-instance',
            instanceId,
            entitlementId: entitlement.id,
          },
          entitlement,
          label,
          ability,
          sourceLevel: level,
          groupId,
          groupLabel,
          classSlotsByLevel: spellcasting.slotsByLevel,
          sortKey: nextSortKey(
            subclassChoice ? 'subclass-feature' : 'class-choice-option',
            choice.level,
            label,
          ),
        })
      }

      for (const feature of option.features ?? []) {
        if (feature.level > level) {
          continue
        }

        for (const entitlement of feature.spellEntitlements ?? []) {
          const label = entitlementLabel(entitlement, feature.name)
          active.push({
            source: {
              kind: 'class-instance',
              instanceId,
              entitlementId: entitlement.id,
            },
            entitlement,
            label,
            ability,
            sourceLevel: level,
            groupId,
            groupLabel,
            classSlotsByLevel: spellcasting.slotsByLevel,
            sortKey: nextSortKey(
              subclassChoice ? 'subclass-feature' : 'class-feature',
              feature.level,
              label,
            ),
          })
        }
      }
    }
  }

  for (const feature of getClassFeaturesUpToLevel(definition, level)) {
    for (const entitlement of feature.spellEntitlements ?? []) {
      const label = entitlementLabel(entitlement, feature.name)
      active.push({
        source: {
          kind: 'class-instance',
          instanceId,
          entitlementId: entitlement.id,
        },
        entitlement,
        label,
        ability,
        sourceLevel: level,
        groupId,
        groupLabel,
        classSlotsByLevel: spellcasting.slotsByLevel,
        sortKey: nextSortKey('class-feature', feature.level, label),
      })
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

  if (entitlement.label !== undefined && entitlement.label.length > 0) {
    return entitlement.label
  }

  switch (entitlement.selectionKind) {
    case 'cantrip':
      return 'Cantrips'
    case 'prepared':
      return 'Prepared Spells'
    case 'known':
      return 'Known Spells'
    case 'spellbook':
      return 'Spellbook'
  }
}

/** Effective list for a select entitlement at a given source class level. */
export function resolveSpellEntitlementListId(
  entitlement: Extract<SpellEntitlement, { kind: 'select' }>,
  sourceLevel: number,
): string {
  if (
    entitlement.expandedListId !== undefined &&
    entitlement.expandedFromLevel !== undefined &&
    sourceLevel >= entitlement.expandedFromLevel
  ) {
    return entitlement.expandedListId
  }
  return entitlement.listId
}

function isExpandedSpellListActive(
  entitlement: Extract<SpellEntitlement, { kind: 'select' }>,
  sourceLevel: number,
): boolean {
  return (
    entitlement.expandedListId !== undefined &&
    entitlement.expandedFromLevel !== undefined &&
    sourceLevel >= entitlement.expandedFromLevel
  )
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
  choices: Record<string, string | string[]>,
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
  originKind: Extract<
    SpellSourceOriginKind,
    | 'background-origin'
    | 'character-feat'
    | 'species-feat-grant'
    | 'class-feat-grant'
  >,
  classInstanceIndex: number,
  progressionCounter: { value: number },
): ActiveEntitlement[] {
  const ability =
    resolveFeatSpellcastingAbility(spellcasting, choices) ??
    spellcasting.ability ??
    'intelligence'

  return spellcasting.entitlements.map((entitlement) => {
    const label = entitlementLabel(entitlement, groupLabel)
    const progressionOrder = progressionCounter.value
    progressionCounter.value += 1
    return {
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
      label,
      ability,
      sourceLevel: 1,
      groupId,
      groupLabel,
      sortKey: {
        originKind,
        classInstanceIndex,
        grantingLevel: 1,
        progressionOrder,
        displayName: groupLabel,
      },
    }
  })
}

function findSpellbookSpellIds(
  active: ActiveEntitlement,
  entitlement: Extract<SpellEntitlement, { kind: 'select' }>,
  states: SpellSourceState[],
  activeEntitlements: ActiveEntitlement[],
): string[] | undefined {
  if (
    entitlement.selectionKind !== 'prepared' ||
    entitlement.prepareFrom !== 'spellbook'
  ) {
    return undefined
  }

  if (active.source.kind !== 'class-instance') {
    return []
  }

  const instanceId = active.source.instanceId
  const bookEntitlementId = entitlement.spellbookEntitlementId

  const bookActives = activeEntitlements.filter((candidate) => {
    if (
      candidate.source.kind !== 'class-instance' ||
      candidate.source.instanceId !== instanceId ||
      candidate.entitlement.kind !== 'select' ||
      candidate.entitlement.selectionKind !== 'spellbook'
    ) {
      return false
    }
    if (bookEntitlementId === undefined) {
      return true
    }
    return candidate.entitlement.id === bookEntitlementId
  })

  const spellIds: string[] = []
  const seen = new Set<string>()
  for (const bookActive of bookActives) {
    const bookState = findSourceState(states, bookActive.source)
    for (const selection of bookState?.selections ?? []) {
      if (seen.has(selection.spellId)) {
        continue
      }
      seen.add(selection.spellId)
      spellIds.push(selection.spellId)
    }
  }

  return spellIds
}

function buildResolvedEntitlement(
  active: ActiveEntitlement,
  state: SpellSourceState | undefined,
  spellsById: Map<string, SpellDefinition>,
  slotCeiling: number,
  pactSlotLevel: number | null,
  abilityScores: Character['abilityScores'],
  characterLevel: number,
  allStates: SpellSourceState[],
  allActive: ActiveEntitlement[],
  listSpellIdsByListId?: ReadonlyMap<string, readonly string[]>,
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
  const entitlementSlotCeiling = resolveEntitlementSlotCeiling({
    entitlement,
    sourceLevel: active.sourceLevel,
    classSlotsByLevel: active.classSlotsByLevel,
    sharedSlotCeiling: slotCeiling,
  })
  const accessibleLevels = resolveAccessibleLevels(
    entitlement,
    entitlementSlotCeiling,
    pactSlotLevel,
  )
  const grantedCounting = 0
  const selectedSpellIds = (state?.selections ?? []).map(
    (selection) => selection.spellId,
  )
  const remainingPicks = Math.max(
    0,
    limit - selectedSpellIds.length - grantedCounting,
  )
  const spellbookSpellIds = findSpellbookSpellIds(
    active,
    entitlement,
    allStates,
    allActive,
  )
  const listId = resolveSpellEntitlementListId(entitlement, active.sourceLevel)
  const expandedActive = isExpandedSpellListActive(
    entitlement,
    active.sourceLevel,
  )
  const description =
    entitlement.description ??
    (expandedActive
      ? 'Magical Secrets: you may prepare spells from the Bard, Cleric, Druid, and Wizard lists.'
      : undefined)
  const listSpellIds = listSpellIdsByListId?.get(listId)

  return {
    entitlementId: entitlement.id,
    kind: 'select',
    selectionKind: entitlement.selectionKind,
    listId,
    label: active.label,
    description,
    limit,
    accessibleLevels,
    selectedSpellIds,
    grantedSpells: [],
    remainingPicks,
    ability: active.ability,
    crossSourceDuplicatePolicy: entitlement.crossSourceDuplicatePolicy,
    prepareFrom: entitlement.prepareFrom,
    spellbookEntitlementId: entitlement.spellbookEntitlementId,
    spellbookSpellIds,
    countsAgainstLimit: entitlement.countsAgainstLimit ?? true,
    schools: entitlement.schools,
    castingTime: entitlement.castingTime,
    ritual: entitlement.ritual,
    listSpellIds,
    ...stats,
  }
}

function collectSpeciesActiveEntitlements(
  speciesId: string,
  speciesName: string,
  traitId: string,
  traitLabel: string,
  ability: AbilityId,
  characterLevel: number,
  spellcasting: {
    entitlements: SpellEntitlement[]
  },
  progressionCounter: { value: number },
): ActiveEntitlement[] {
  const groupId = `species-trait:${speciesId}:${traitId}`
  const groupLabel = `${speciesName}: ${traitLabel}`

  return spellcasting.entitlements.map((entitlement) => {
    const label = entitlementLabel(entitlement, groupLabel)
    const progressionOrder = progressionCounter.value
    progressionCounter.value += 1
    return {
      source: {
        kind: 'species-trait' as const,
        speciesId,
        traitId,
        entitlementId: entitlement.id,
      },
      entitlement,
      label,
      ability,
      sourceLevel: characterLevel,
      groupId,
      groupLabel,
      sortKey: {
        originKind: 'species-trait' as const,
        classInstanceIndex: -1,
        grantingLevel: 1,
        progressionOrder,
        displayName: groupLabel,
      },
    }
  })
}

export async function resolveCharacterSpellcasting(
  classCatalog: ClassCatalog,
  character: Character,
  options?: {
    featCatalog?: FeatCatalog
    backgroundCatalog?: BackgroundCatalog
    spellCatalog?: SpellCatalog
    speciesCatalog?: SpeciesCatalog
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
  const listSpellIdsByListId = new Map<string, readonly string[]>()
  if (options?.spellCatalog !== undefined) {
    const spells = await options.spellCatalog.listSpells(character.editionId)
    for (const spell of spells) {
      spellsById.set(spell.id, spell)
    }
  }

  const activeEntitlements: ActiveEntitlement[] = []
  const progressionCounter = { value: 0 }
  const classInstanceIndexById = new Map<string, number>()

  character.classes.forEach((instance, index) => {
    classInstanceIndexById.set(instance.instanceId, index)
  })

  for (const [classInstanceIndex, instance] of character.classes.entries()) {
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
        classInstanceIndex,
        progressionCounter,
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
        speciesCatalog: options.speciesCatalog,
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
              grant.choices,
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
              'background-origin',
              -1,
              progressionCounter,
            ),
          )
        } else if (grant.source.kind === 'character-feat') {
          activeEntitlements.push(
            ...collectFeatActiveEntitlements(
              feat.spellcasting,
              grant.choices,
              {
                kind: 'feat',
                slot: 'character-feat',
                featId: feat.id,
              },
              `feat:character-feat:${feat.id}`,
              formatGrantedFeatSpellcastingLabel(feat.name, 'Feat'),
              'character-feat',
              -1,
              progressionCounter,
            ),
          )
        } else if (grant.source.kind === 'species-feat-grant') {
          activeEntitlements.push(
            ...collectFeatActiveEntitlements(
              feat.spellcasting,
              grant.choices,
              {
                kind: 'feat',
                slot: 'class-choice',
                featId: feat.id,
                instanceId: grant.source.speciesId,
                choiceId: grant.source.choiceId,
              },
              `feat:class-choice:${grant.source.speciesId}:${grant.source.choiceId}:${feat.id}`,
              formatGrantedFeatSpellcastingLabel(
                feat.name,
                grant.source.grantLabel,
                grant.source.speciesDisplayName,
              ),
              'species-feat-grant',
              -1,
              progressionCounter,
            ),
          )
        } else {
          activeEntitlements.push(
            ...collectFeatActiveEntitlements(
              feat.spellcasting,
              grant.choices,
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
              'class-feat-grant',
              classInstanceIndexById.get(grant.source.instanceId) ?? -1,
              progressionCounter,
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
            character.feat.choices,
            {
              kind: 'feat',
              slot: 'character-feat',
              featId: feat.id,
            },
            `feat:character-feat:${feat.id}`,
            formatGrantedFeatSpellcastingLabel(feat.name, 'Feat'),
            'character-feat',
            -1,
            progressionCounter,
          ),
        )
      }
    }
  }

  if (
    character.species !== null &&
    options?.speciesCatalog !== undefined
  ) {
    const speciesDefinition = await options.speciesCatalog.getSpecies(
      character.species.speciesId,
    )
    if (speciesDefinition !== null) {
      const ability = getSpeciesSpellcastingAbility(character.species)
      const blocks = collectSpeciesSpellcastingBlocks(
        speciesDefinition,
        character.species,
      )

      for (const block of blocks) {
        activeEntitlements.push(
          ...collectSpeciesActiveEntitlements(
            speciesDefinition.id,
            speciesDefinition.name,
            block.traitId,
            block.label,
            ability,
            character.targetLevel,
            block.spellcasting,
            progressionCounter,
          ),
        )
      }
    }
  }

  // Sort by deliberate origin priority — never rely on collector insertion order.
  activeEntitlements.sort((left, right) =>
    compareSpellSourceSortKeys(left.sortKey, right.sortKey),
  )

  const normalizedActive = activeEntitlements

  if (options?.spellCatalog !== undefined) {
    const neededListIds = new Set<string>()
    for (const active of normalizedActive) {
      if (active.entitlement.kind !== 'select') {
        continue
      }
      neededListIds.add(
        resolveSpellEntitlementListId(active.entitlement, active.sourceLevel),
      )
      neededListIds.add(active.entitlement.listId)
      if (active.entitlement.expandedListId !== undefined) {
        neededListIds.add(active.entitlement.expandedListId)
      }
    }
    for (const listId of neededListIds) {
      const list = await options.spellCatalog.getSpellList(listId)
      if (list !== null) {
        listSpellIdsByListId.set(listId, list.spellIds)
      }
    }
  }

  const contributors = collectSlotContributors(
    character.classes,
    definitionsById,
  )
  const sharedSlots = resolveSharedSpellSlots(contributors)
  const pactSlots = resolvePactMagicSlots(character.classes, definitionsById)
  const slotCeiling = sharedSlots?.highestSlotLevel ?? 0
  const pactSlotLevelByInstanceId = new Map<string, number>()
  if (pactSlots !== null) {
    for (const source of pactSlots.sources) {
      pactSlotLevelByInstanceId.set(source.instanceId, source.slotLevel)
    }
  }

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
        sortKey: active.sortKey,
      }
      groupsById.set(active.groupId, group)
    } else if (
      compareSpellSourceSortKeys(active.sortKey, group.sortKey) < 0
    ) {
      // Keep the earliest entitlement sort key as the group key (e.g. class-core).
      group.sortKey = active.sortKey
    }

    const state = findSourceState(character.spellSourceStates, active.source)
    const pactSlotLevel =
      active.source.kind === 'class-instance'
        ? (pactSlotLevelByInstanceId.get(active.source.instanceId) ?? null)
        : null
    const resolved = buildResolvedEntitlement(
      active,
      state,
      spellsById,
      slotCeiling,
      pactSlotLevel,
      character.abilityScores,
      character.targetLevel,
      character.spellSourceStates,
      normalizedActive,
      listSpellIdsByListId,
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
      // Bonus prepared pools (Spell Mastery / Signature) keep their own picks
      // and must not absorb always-prepared grants from the main pool.
      if (entitlement.countsAgainstLimit === false) {
        entitlement.remainingPicks = Math.max(
          0,
          entitlement.limit - entitlement.selectedSpellIds.length,
        )
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

  const groups = [...groupsById.values()].sort((left, right) =>
    compareSpellSourceGroupSortKeys(
      {
        band: spellSourceGroupBand(left.sortKey.originKind),
        classInstanceIndex: left.sortKey.classInstanceIndex,
        grantingLevel: left.sortKey.grantingLevel,
        progressionOrder: left.sortKey.progressionOrder,
        displayName: left.label,
      },
      {
        band: spellSourceGroupBand(right.sortKey.originKind),
        classInstanceIndex: right.sortKey.classInstanceIndex,
        grantingLevel: right.sortKey.grantingLevel,
        progressionOrder: right.sortKey.progressionOrder,
        displayName: right.label,
      },
    ),
  )
  const activeSources = normalizedActive.map((entry) => entry.source)
  const hasSpellbookContent = groups.some((group) =>
    group.entitlements.some(
      (entitlement) =>
        entitlement.selectionKind === 'spellbook' &&
        (entitlement.selectedSpellIds.length > 0 || entitlement.limit > 0),
    ),
  )
  const hasSpellContent =
    groups.some((group) => group.entitlements.length > 0) ||
    pactSlots !== null
  const hasSpellcastingCapability =
    contributors.length > 0 || hasSpellContent || pactSlots !== null

  const spellLines: string[] = []
  if (pactSlots !== null) {
    for (const source of pactSlots.sources) {
      const recoveryLabel =
        source.recovery === 'short-rest' ? 'short rest' : 'long rest'
      spellLines.push(
        `${source.className} — Pact Magic: ${source.slotCount}× level ${source.slotLevel} (${recoveryLabel})`,
      )
    }
  }
  if (hasSpellbookContent) {
    for (const group of groups) {
      for (const entitlement of group.entitlements) {
        if (
          entitlement.selectionKind === 'spellbook' &&
          entitlement.selectedSpellIds.length > 0
        ) {
          const names = entitlement.selectedSpellIds.map(
            (spellId) => spellsById.get(spellId)?.name ?? spellId,
          )
          spellLines.push(
            `${group.label} — Spellbook: ${names.join(', ')}`,
          )
        }
      }
    }
  }
  for (const group of groups) {
    for (const entitlement of group.entitlements) {
      for (const granted of entitlement.grantedSpells) {
        if (entitlement.kind === 'granted') {
          spellLines.push(`${group.label}: ${granted.name} (always prepared)`)
        }
      }
      if (
        entitlement.kind === 'select' &&
        entitlement.selectionKind !== 'spellbook' &&
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
    pactSlots,
    activeSources,
  }
}
