import { getAbilityModifier } from '../domain/abilities'
import type { AbilityId } from '../domain/abilities/types'
import { ABILITY_IDS } from '../domain/abilities/types'
import type { AbilityScores, Character } from '../domain/types'
import type { BackgroundDefinition, BackgroundSelection } from '../domain/background/types'
import type { ClassDefinition } from '../domain/class/types'
import { classInstanceToSelection } from '../domain/character/characterClassSelection'
import type { FeatDefinition, FeatSelection } from '../domain/feat/types'
import type { SpeciesDefinition, SpeciesSelection } from '../domain/species/types'
import type { EquipmentItemDefinition } from '../domain/equipment/types'
import { SKILL_IDS, SKILL_LABELS, type SkillId } from '../domain/skills/types'
import { resolveClassEffects } from '../rules/class/resolveClassEffects'
import { resolveSpeciesEffects } from '../rules/species/resolveSpeciesEffects'
import {
  resolveSpeciesSize,
  resolveSpeciesWalkSpeed,
} from '../rules/species/resolveSpeciesDerivedStats'
import { calculateCharacterHitPoints } from '../rules/hit-points/calculateCharacterHitPoints'
import { calculateCharacterArmorClass } from '../rules/armor-class/calculateCharacterArmorClass'
import type { ResolvedEquipment } from '../rules/character/resolveCharacterEquipment'
import type { ResolvedFeatGrant } from '../rules/character/resolveCharacterFeatGrants'
import {
  hasInitiativeProficiency,
  resolveArmorClassBonusFromFeatEffects,
  resolveCharacterFeatEffects,
} from '../rules/feat/resolveFeatEffects'
import { selectEquippedArmorAndShield } from '../rules/armor-class/calculateCharacterArmorClass'
import {
  formatAbilityScoreBonusSummary,
  formatBackgroundChoiceSummary,
  formatToolProficiencySummary,
} from '../features/background/formatBackgroundDetails'
import {
  formatArmorProficiencyChipLabels,
  formatWeaponProficiencyChipLabels,
} from '../features/class/formatClassDetails'
import {
  formatFeatCategory,
  formatFeatCategoryBadge,
} from '../features/feat/formatFeatDetails'
import { formatAsiChoiceSummary } from '../domain/class/abilityScoreImprovement'
import {
  collectSkillIdsFromFeatChoices,
  collectToolIdsFromFeatChoices,
} from '../domain/feat/resolveFeatProficiencies'
import {
  formatSkillOrToolProficiencyOptionLabel,
  listSkillOrToolProficiencyOptions,
} from '../domain/feat/skillOrToolProficiency'
import { getBackgroundChoiceIds } from '../rules/background/backgroundRules'
import { resolveSpeciesKnownLanguageLabels } from '../domain/species/standardLanguages'
import {
  getSpeciesDisplayName,
  resolveSelectedLineageOption,
} from '../features/species/getSpeciesDisplayName'
import {
  ABILITY_ABBREVIATIONS,
  formatSignedModifier,
  getPassiveScore,
  getProficiencyBonus,
  getSavingThrowModifier,
  getSkillModifier,
  SKILL_ABILITY_MAP,
  type ProficiencyRank,
} from '../domain/character/sheetMechanics'

export type ReviewSpeciesCardModel = {
  speciesId: string
  name: string
  sizeLabel: string
  speedFeet: number
  traits: { id: string; name: string; description: string }[]
  ancestryLabel: string | null
}

export type ReviewBackgroundCardModel = {
  name: string
  description: string
  abilityScoreBenefits: string | null
  skillProficiencies: string[]
  toolProficiency: string | null
  otherBenefits: { label: string; value: string }[]
  originFeatName: string | null
}

export type ReviewFeatCardModel = {
  name: string
  description: string
  category: string
  categoryBadge: string
  summary: string
  benefits: { name: string; description: string }[]
  prerequisite: string | null
  choices: { prompt: string; summary: string }[]
  /** Where the feat came from — drives Overview edit navigation. */
  source: 'selection' | 'background-origin' | 'class-feat-grant' | 'species-feat-grant'
  /** Human-readable grant source, e.g. "Epic Boon · Fighter 19". */
  sourceLabel: string | null
}

export type ReviewSkillRowModel = {
  skillId: SkillId
  name: string
  abilityAbbreviation: string
  proficiency: ProficiencyRank
  modifier: number
  modifierLabel: string
}

export type ReviewSaveRowModel = {
  abilityId: AbilityId
  abbreviation: string
  proficient: boolean
  modifier: number
  modifierLabel: string
}

export type ReviewSensesModel = {
  passives: { label: string; value: number }[]
  special: { label: string; detail: string }[]
}

export type ReviewProficienciesModel = {
  armor: string[]
  weapons: string[]
  tools: string[]
  languages: string[]
}

export type ReviewSheetModels = {
  species: ReviewSpeciesCardModel | null
  background: ReviewBackgroundCardModel | null
  /** @deprecated Prefer `feats` — retained as the first grant for older callers. */
  feat: ReviewFeatCardModel | null
  /** All resolved feat grants (background, legacy, ASI, Epic Boon). */
  feats: ReviewFeatCardModel[]
  skills: ReviewSkillRowModel[]
  savingThrows: ReviewSaveRowModel[]
  savingThrowNotes: string[]
  senses: ReviewSensesModel
  proficiencies: ReviewProficienciesModel
  proficiencyBonus: number
  proficiencyBonusLabel: string
  speedFeet: number | null
  speedLabel: string | null
  initiativeModifier: number
  initiativeLabel: string
  hitPointMaximum: number | null
  hitPointMaximumLabel: string
  armorClass: number
  armorClassLabel: string
  armorClassBreakdown: {
    base: number
    dexterityBonus: number
    shieldBonus: number
    otherBonus: number
    armorItemId: string | null
    shieldItemId: string | null
  }
}

function formatSizeLabel(size: SpeciesDefinition['size']): string {
  return size.charAt(0).toUpperCase() + size.slice(1)
}

export function collectProficientSkills(
  character: Character,
  classDefinitions: Map<string, ClassDefinition>,
  backgroundDefinition: BackgroundDefinition | null,
  speciesDefinition: SpeciesDefinition | null,
  featGrants?: readonly ResolvedFeatGrant[],
  featDefinitionsById?: ReadonlyMap<string, FeatDefinition>,
): Set<SkillId> {
  const skills = new Set<SkillId>()

  for (const instance of character.classes) {
    const definition = classDefinitions.get(instance.classId)
    if (definition === undefined) {
      continue
    }

    for (const effect of resolveClassEffects(
      definition,
      classInstanceToSelection(instance),
    )) {
      if (effect.kind === 'skill-proficiency') {
        skills.add(effect.skillId)
      }
    }
  }

  if (backgroundDefinition !== null) {
    for (const skillId of backgroundDefinition.skillProficiencies) {
      skills.add(skillId)
    }
  }

  if (speciesDefinition !== null && character.species !== null) {
    for (const effect of resolveSpeciesEffects(
      speciesDefinition,
      character.species,
    )) {
      if (effect.kind === 'skill-proficiency') {
        skills.add(effect.skillId)
      }
    }
  }

  if (featGrants !== undefined && featDefinitionsById !== undefined) {
    for (const grant of featGrants) {
      const definition = featDefinitionsById.get(grant.featId)
      if (definition === undefined) {
        continue
      }
      for (const skillId of collectSkillIdsFromFeatChoices(
        definition,
        grant.choices,
      )) {
        skills.add(skillId)
      }
    }
  }

  return skills
}

function collectExpertiseSkills(
  character: Character,
  classDefinitions: Map<string, ClassDefinition>,
): Set<SkillId> {
  const skills = new Set<SkillId>()

  for (const instance of character.classes) {
    const definition = classDefinitions.get(instance.classId)
    if (definition === undefined) {
      continue
    }

    for (const effect of resolveClassEffects(
      definition,
      classInstanceToSelection(instance),
    )) {
      if (effect.kind === 'skill-expertise') {
        skills.add(effect.skillId)
      }
    }
  }

  return skills
}

function collectJackOfAllTrades(
  character: Character,
  classDefinitions: Map<string, ClassDefinition>,
): boolean {
  for (const instance of character.classes) {
    const definition = classDefinitions.get(instance.classId)
    if (definition === undefined) {
      continue
    }

    for (const effect of resolveClassEffects(
      definition,
      classInstanceToSelection(instance),
    )) {
      if (effect.kind === 'jack-of-all-trades') {
        return true
      }
    }
  }

  return false
}

function collectSavingThrowProficiencies(
  character: Character,
  classDefinitions: Map<string, ClassDefinition>,
): Set<AbilityId> {
  const saves = new Set<AbilityId>()

  for (const instance of character.classes) {
    const definition = classDefinitions.get(instance.classId)
    if (definition === undefined) {
      continue
    }

    for (const ability of definition.savingThrows) {
      saves.add(ability)
    }
  }

  return saves
}

function buildSpeciesCard(
  definition: SpeciesDefinition | null,
  selection: SpeciesSelection | null,
): ReviewSpeciesCardModel | null {
  if (definition === null || selection === null) {
    return null
  }

  return {
    speciesId: definition.id,
    name: getSpeciesDisplayName(definition, selection.choices),
    sizeLabel: formatSizeLabel(resolveSpeciesSize(definition, selection)),
    speedFeet: resolveSpeciesWalkSpeed(definition, selection),
    traits: definition.traits.map((trait) => ({
      id: trait.id,
      name: trait.name,
      description: trait.description,
    })),
    ancestryLabel:
      resolveSelectedLineageOption(definition, selection.choices)?.label ?? null,
  }
}

function buildBackgroundCard(
  definition: BackgroundDefinition | null,
  selection: BackgroundSelection | null,
): ReviewBackgroundCardModel | null {
  if (definition === null || selection === null) {
    return null
  }

  const abilityScoreBenefits = formatAbilityScoreBonusSummary(
    definition,
    selection,
  )
  const toolProficiency = formatToolProficiencySummary(definition, selection)
  const otherBenefits: { label: string; value: string }[] = []

  for (const choiceId of getBackgroundChoiceIds(definition)) {
    if (
      definition.toolProficiency.kind === 'choice' &&
      choiceId === definition.toolProficiency.choiceId
    ) {
      continue
    }

    const summary = formatBackgroundChoiceSummary(
      definition,
      selection,
      choiceId,
    )
    if (summary === null) {
      continue
    }

    otherBenefits.push({ label: choiceId, value: summary })
  }

  return {
    name: definition.name,
    description: definition.description,
    abilityScoreBenefits:
      abilityScoreBenefits === 'Not configured' ? null : abilityScoreBenefits,
    skillProficiencies: definition.skillProficiencies.map(
      (skillId) => SKILL_LABELS[skillId],
    ),
    toolProficiency,
    otherBenefits,
    originFeatName: definition.originFeat.name,
  }
}

function formatFeatChoiceSummary(
  choice: FeatDefinition['choices'][number],
  value: string | string[],
): string {
  if (choice.type === 'single-select') {
    if (typeof value !== 'string') {
      return value.join(', ')
    }
    return (
      choice.options.find((entry) => entry.id === value)?.label ?? value
    )
  }

  if (choice.type === 'multi-select') {
    const ids = typeof value === 'string' ? [value] : value
    return ids
      .map((optionId) => formatSkillOrToolProficiencyOptionLabel(optionId))
      .join(', ')
  }

  if (typeof value === 'string') {
    return formatAsiChoiceSummary(value) ?? value
  }

  return value.join(', ')
}

function buildFeatCard(
  definition: FeatDefinition | null,
  selection: FeatSelection | null,
  source: ReviewFeatCardModel['source'] = 'selection',
  sourceLabel: string | null = null,
): ReviewFeatCardModel | null {
  if (definition === null) {
    return null
  }

  if (source === 'selection' && selection === null) {
    return null
  }

  const choices: { prompt: string; summary: string }[] = []
  if (selection !== null) {
    for (const choice of definition.choices) {
      const selectedValue = selection.choices[choice.id]
      if (selectedValue === undefined) {
        continue
      }
      choices.push({
        prompt: choice.prompt,
        summary: formatFeatChoiceSummary(choice, selectedValue),
      })
    }
  }

  return {
    name: definition.name,
    description: definition.description,
    category: formatFeatCategory(definition.category),
    categoryBadge: formatFeatCategoryBadge(definition.category),
    summary: definition.summary,
    benefits: definition.benefits.map((benefit) => ({
      name: benefit.name,
      description: benefit.description,
    })),
    prerequisite:
      definition.prerequisite.kind === 'none'
        ? null
        : definition.prerequisite.summary,
    choices,
    source,
    sourceLabel,
  }
}

function buildOriginFeatCard(
  backgroundDefinition: BackgroundDefinition | null,
  featDefinition: FeatDefinition | null,
): ReviewFeatCardModel | null {
  if (backgroundDefinition === null) {
    return null
  }

  if (featDefinition !== null) {
    return buildFeatCard(
      featDefinition,
      null,
      'background-origin',
      backgroundDefinition.name,
    )
  }

  return {
    name: backgroundDefinition.originFeat.name,
    description: backgroundDefinition.originFeat.description,
    category: formatFeatCategory('origin'),
    categoryBadge: formatFeatCategoryBadge('origin'),
    summary: backgroundDefinition.originFeat.description,
    benefits: [],
    prerequisite: null,
    choices: [],
    source: 'background-origin',
    sourceLabel: backgroundDefinition.name,
  }
}

function mapFeatGrantSource(
  grantSource: ResolvedFeatGrant['source'],
): {
  source: ReviewFeatCardModel['source']
  sourceLabel: string | null
} {
  switch (grantSource.kind) {
    case 'background-origin':
      return {
        source: 'background-origin',
        sourceLabel: grantSource.backgroundName,
      }
    case 'character-feat':
      return { source: 'selection', sourceLabel: 'Legacy feat' }
    case 'species-feat-grant':
      return {
        source: 'species-feat-grant',
        sourceLabel: `${grantSource.grantLabel} · ${grantSource.speciesDisplayName}`,
      }
    case 'class-feat-grant':
      return {
        source: 'class-feat-grant',
        sourceLabel: `${grantSource.grantLabel} · ${grantSource.className} ${grantSource.classLevel}`,
      }
  }
}

function buildFeatCardsFromGrants(
  grants: readonly ResolvedFeatGrant[],
  definitionsById: ReadonlyMap<string, FeatDefinition>,
  characterFeat: FeatSelection | null,
): ReviewFeatCardModel[] {
  const cards: ReviewFeatCardModel[] = []

  for (const grant of grants) {
    const definition = definitionsById.get(grant.featId) ?? null
    const { source, sourceLabel } = mapFeatGrantSource(grant.source)
    const selection =
      grant.source.kind === 'character-feat' && characterFeat !== null
        ? characterFeat
        : Object.keys(grant.choices).length > 0
          ? { featId: grant.featId, choices: grant.choices }
          : null

    const card =
      definition !== null
        ? buildFeatCard(definition, selection, source, sourceLabel)
        : {
            name: grant.featId,
            description: '',
            category: '',
            categoryBadge: '',
            summary: grant.displayLabel,
            benefits: [],
            prerequisite: null,
            choices: [],
            source,
            sourceLabel,
          }

    if (card !== null) {
      cards.push(card)
    }
  }

  return cards
}

function buildSkills(
  abilityScores: AbilityScores,
  proficiencyBonus: number,
  proficientSkills: Set<SkillId>,
  expertiseSkills: Set<SkillId>,
  jackOfAllTrades = false,
): ReviewSkillRowModel[] {
  return SKILL_IDS.map((skillId) => {
    const abilityId = SKILL_ABILITY_MAP[skillId]
    const rank: ProficiencyRank = expertiseSkills.has(skillId)
      ? 'expertise'
      : proficientSkills.has(skillId)
        ? 'proficient'
        : 'none'
    const modifier = getSkillModifier(
      abilityScores[abilityId],
      proficiencyBonus,
      rank,
      { jackOfAllTrades },
    )

    return {
      skillId,
      name: SKILL_LABELS[skillId],
      abilityAbbreviation: ABILITY_ABBREVIATIONS[abilityId],
      proficiency: rank,
      modifier,
      modifierLabel: formatSignedModifier(modifier),
    }
  })
}

function buildSavingThrows(
  abilityScores: AbilityScores,
  proficiencyBonus: number,
  proficientSaves: Set<AbilityId>,
): ReviewSaveRowModel[] {
  return ABILITY_IDS.map((abilityId) => {
    const proficient = proficientSaves.has(abilityId)
    const modifier = getSavingThrowModifier(
      abilityScores[abilityId],
      proficiencyBonus,
      proficient,
    )

    return {
      abilityId,
      abbreviation: ABILITY_ABBREVIATIONS[abilityId],
      proficient,
      modifier,
      modifierLabel: formatSignedModifier(modifier),
    }
  })
}

function buildSenses(
  abilityScores: AbilityScores,
  proficiencyBonus: number,
  proficientSkills: Set<SkillId>,
  speciesDefinition: SpeciesDefinition | null,
  speciesSelection: SpeciesSelection | null,
  jackOfAllTrades = false,
): ReviewSensesModel {
  const perceptionMod = getSkillModifier(
    abilityScores.wisdom,
    proficiencyBonus,
    proficientSkills.has('perception') ? 'proficient' : 'none',
    { jackOfAllTrades },
  )
  const insightMod = getSkillModifier(
    abilityScores.wisdom,
    proficiencyBonus,
    proficientSkills.has('insight') ? 'proficient' : 'none',
    { jackOfAllTrades },
  )
  const investigationMod = getAbilityModifier(abilityScores.intelligence)

  const special: { label: string; detail: string }[] = []

  if (speciesDefinition !== null && speciesSelection !== null) {
    for (const effect of resolveSpeciesEffects(
      speciesDefinition,
      speciesSelection,
    )) {
      if (effect.kind === 'darkvision') {
        special.push({
          label: 'Darkvision',
          detail: `${effect.rangeFeet} ft.`,
        })
      }
    }
  }

  return {
    passives: [
      { label: 'Passive Perception', value: getPassiveScore(perceptionMod) },
      {
        label: 'Passive Investigation',
        value: getPassiveScore(investigationMod),
      },
      { label: 'Passive Insight', value: getPassiveScore(insightMod) },
    ],
    special,
  }
}

function buildProficiencies(
  character: Character,
  classDefinitions: Map<string, ClassDefinition>,
  backgroundDefinition: BackgroundDefinition | null,
  backgroundSelection: BackgroundSelection | null,
  speciesDefinition: SpeciesDefinition | null,
  featGrants?: readonly ResolvedFeatGrant[],
  featDefinitionsById?: ReadonlyMap<string, FeatDefinition>,
): ReviewProficienciesModel {
  const armor = new Set<string>()
  const weapons = new Set<string>()
  const tools = new Set<string>()
  const languages = new Set<string>(
    speciesDefinition === null
      ? []
      : resolveSpeciesKnownLanguageLabels(
          speciesDefinition.languages,
          character.species,
        ),
  )

  for (const instance of character.classes) {
    const definition = classDefinitions.get(instance.classId)
    if (definition === undefined) {
      continue
    }

    for (const effect of resolveClassEffects(definition, {
      classId: instance.classId,
      level: instance.level,
      choices: instance.choices,
    })) {
      if (effect.kind === 'armor-proficiency') {
        for (const label of formatArmorProficiencyChipLabels([
          effect.category,
        ])) {
          armor.add(label)
        }
      }
      if (effect.kind === 'weapon-proficiency') {
        for (const label of formatWeaponProficiencyChipLabels([
          effect.category,
        ])) {
          weapons.add(label)
        }
      }
      if (effect.kind === 'language') {
        languages.add(effect.label)
      }
      if (effect.kind === 'tool-proficiency') {
        tools.add(effect.label)
      }
    }
  }

  if (backgroundDefinition !== null) {
    tools.add(
      formatToolProficiencySummary(
        backgroundDefinition,
        backgroundSelection,
      ).replace(/ \(not chosen yet\)$/, ''),
    )
  }

  if (featGrants !== undefined && featDefinitionsById !== undefined) {
    const toolLabelById = new Map(
      listSkillOrToolProficiencyOptions()
        .filter((option) => option.kind === 'tool')
        .map((option) => [option.targetId, option.label]),
    )

    for (const grant of featGrants) {
      const definition = featDefinitionsById.get(grant.featId)
      if (definition === undefined) {
        continue
      }
      for (const toolId of collectToolIdsFromFeatChoices(
        definition,
        grant.choices,
      )) {
        tools.add(toolLabelById.get(toolId) ?? toolId)
      }
    }
  }

  return {
    armor: [...armor],
    weapons: [...weapons],
    tools: [...tools].filter((label) => !label.includes('not chosen yet')),
    languages: [...languages],
  }
}

function buildSavingThrowNotes(
  speciesDefinition: SpeciesDefinition | null,
  speciesSelection: SpeciesSelection | null,
): string[] {
  if (speciesDefinition === null || speciesSelection === null) {
    return []
  }

  const notes: string[] = []
  for (const effect of resolveSpeciesEffects(
    speciesDefinition,
    speciesSelection,
  )) {
    if (effect.kind === 'save-advantage') {
      const conditionLabel =
        effect.condition.charAt(0).toUpperCase() + effect.condition.slice(1)
      notes.push(
        `Advantage on saving throws to avoid or end the ${conditionLabel} condition.`,
      )
      continue
    }

    if (effect.kind === 'save-advantage-ability') {
      const labels = effect.abilities.map(
        (ability) => ability.charAt(0).toUpperCase() + ability.slice(1),
      )
      notes.push(`Advantage on ${labels.join(', ')} saving throws.`)
    }
  }

  return notes
}

export type BuildReviewSheetModelsInput = {
  character: Character
  speciesDefinition: SpeciesDefinition | null
  backgroundDefinition: BackgroundDefinition | null
  featDefinition: FeatDefinition | null
  /** Resolved origin feat when `character.feat` is unset. */
  originFeatDefinition?: FeatDefinition | null
  /**
   * Resolved feat grants (preferred). When provided, Overview uses these for
   * source-labeled feat cards instead of only character.feat / origin feat.
   */
  featGrants?: readonly ResolvedFeatGrant[]
  featDefinitionsById?: ReadonlyMap<string, FeatDefinition>
  classDefinitions: Map<string, ClassDefinition>
  /**
   * Class instances used for Hit Points (committed, optionally overlaid by
   * eligible drafts). Defaults to `character.classes`.
   */
  hitPointClasses?: Character['classes']
  resolvedEquipment?: ResolvedEquipment
  equipmentDefinitionsById?: ReadonlyMap<string, EquipmentItemDefinition>
}

export function buildReviewSheetModels(
  input: BuildReviewSheetModelsInput,
): ReviewSheetModels {
  const { character } = input
  const proficiencyBonus = getProficiencyBonus(character.targetLevel)
  const proficientSkills = collectProficientSkills(
    character,
    input.classDefinitions,
    input.backgroundDefinition,
    input.speciesDefinition,
    input.featGrants,
    input.featDefinitionsById,
  )
  const expertiseSkills = collectExpertiseSkills(
    character,
    input.classDefinitions,
  )
  const jackOfAllTrades = collectJackOfAllTrades(
    character,
    input.classDefinitions,
  )
  const proficientSaves = collectSavingThrowProficiencies(
    character,
    input.classDefinitions,
  )

  const skills = buildSkills(
    character.abilityScores,
    proficiencyBonus,
    proficientSkills,
    expertiseSkills,
    jackOfAllTrades,
  )
  const featEffects =
    input.featGrants !== undefined
      ? resolveCharacterFeatEffects(
          input.featGrants,
          input.featDefinitionsById ?? new Map(),
        )
      : []
  const initiativeModifier =
    getAbilityModifier(character.abilityScores.dexterity) +
    (hasInitiativeProficiency(featEffects) ? proficiencyBonus : 0)
  const speciesCard = buildSpeciesCard(
    input.speciesDefinition,
    character.species,
  )
  const hitPointClasses = input.hitPointClasses ?? character.classes
  const hitPoints = calculateCharacterHitPoints({
    classes: hitPointClasses,
    startingClassInstanceId: character.startingClassInstanceId,
    classDefinitionsById: input.classDefinitions,
    abilityScores: character.abilityScores,
    speciesDefinition: input.speciesDefinition,
    speciesSelection: character.species,
  })
  const hitPointMaximum =
    hitPointClasses.length > 0 && hitPoints.isComplete
      ? hitPoints.maximum
      : null

  const emptyResolvedEquipment: ResolvedEquipment = {
    sources: [],
    entries: [],
    inventory: [],
    mergedInventory: [],
    currency: { goldPieces: 0 },
    weightCarriedLb: 0,
  }
  const resolvedEquipmentForAc =
    input.resolvedEquipment ?? emptyResolvedEquipment
  const equipmentDefinitionsById =
    input.equipmentDefinitionsById ?? new Map()
  const equippedForAc = selectEquippedArmorAndShield(
    character.equipment.loadout,
    resolvedEquipmentForAc,
    equipmentDefinitionsById,
  )
  const defenseAcBonus = resolveArmorClassBonusFromFeatEffects(
    featEffects,
    equippedForAc.armor !== null,
  )
  const armorClass = calculateCharacterArmorClass({
    abilityScores: character.abilityScores,
    resolvedEquipment: resolvedEquipmentForAc,
    loadout: character.equipment.loadout,
    equipmentDefinitionsById,
    otherBonus: defenseAcBonus,
  })

  const feats =
    input.featGrants !== undefined
      ? buildFeatCardsFromGrants(
          input.featGrants,
          input.featDefinitionsById ?? new Map(),
          character.feat,
        )
      : (() => {
          const legacy =
            character.feat !== null
              ? buildFeatCard(input.featDefinition, character.feat, 'selection', 'Legacy feat')
              : buildOriginFeatCard(
                  input.backgroundDefinition,
                  input.originFeatDefinition ?? null,
                )
          return legacy === null ? [] : [legacy]
        })()

  return {
    species: speciesCard,
    background: buildBackgroundCard(
      input.backgroundDefinition,
      character.background,
    ),
    feat: feats[0] ?? null,
    feats,
    skills,
    savingThrows: buildSavingThrows(
      character.abilityScores,
      proficiencyBonus,
      proficientSaves,
    ),
    savingThrowNotes: buildSavingThrowNotes(
      input.speciesDefinition,
      character.species,
    ),
    senses: buildSenses(
      character.abilityScores,
      proficiencyBonus,
      proficientSkills,
      input.speciesDefinition,
      character.species,
      jackOfAllTrades,
    ),
    proficiencies: buildProficiencies(
      character,
      input.classDefinitions,
      input.backgroundDefinition,
      character.background,
      input.speciesDefinition,
      input.featGrants,
      input.featDefinitionsById,
    ),
    proficiencyBonus,
    proficiencyBonusLabel: formatSignedModifier(proficiencyBonus),
    speedFeet: speciesCard?.speedFeet ?? null,
    speedLabel:
      speciesCard !== null ? `${speciesCard.speedFeet} ft.` : null,
    initiativeModifier,
    initiativeLabel: formatSignedModifier(initiativeModifier),
    hitPointMaximum,
    hitPointMaximumLabel:
      hitPointMaximum === null ? '—' : String(hitPointMaximum),
    armorClass: armorClass.total,
    armorClassLabel: String(armorClass.total),
    armorClassBreakdown: {
      base: armorClass.base,
      dexterityBonus: armorClass.dexterityBonus,
      shieldBonus: armorClass.shieldBonus,
      otherBonus: armorClass.otherBonus,
      armorItemId: armorClass.armorItemId,
      shieldItemId: armorClass.shieldItemId,
    },
  }
}
