import { getAbilityModifier } from '../domain/abilities'
import type { AbilityId } from '../domain/abilities/types'
import { ABILITY_IDS } from '../domain/abilities/types'
import type { AbilityScores, Character } from '../domain/types'
import type { BackgroundDefinition, BackgroundSelection } from '../domain/background/types'
import type { ClassDefinition } from '../domain/class/types'
import { classInstanceToSelection } from '../domain/character/characterClassSelection'
import type { FeatDefinition, FeatSelection } from '../domain/feat/types'
import type { SpeciesDefinition, SpeciesSelection } from '../domain/species/types'
import { SKILL_IDS, SKILL_LABELS, type SkillId } from '../domain/skills/types'
import { resolveClassEffects } from '../rules/class/resolveClassEffects'
import { resolveSpeciesEffects } from '../rules/species/resolveSpeciesEffects'
import { resolveHitPointMaximum } from '../rules/hit-points/resolveHitPointMaximum'
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
import { getBackgroundChoiceIds } from '../rules/background/backgroundRules'
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
  source: 'selection' | 'background-origin'
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
  feat: ReviewFeatCardModel | null
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
}

function formatSizeLabel(size: SpeciesDefinition['size']): string {
  return size.charAt(0).toUpperCase() + size.slice(1)
}

function collectProficientSkills(
  character: Character,
  classDefinitions: Map<string, ClassDefinition>,
  backgroundDefinition: BackgroundDefinition | null,
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

  return skills
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

  let ancestryLabel: string | null = null
  for (const choice of definition.choices) {
    const selectedId = selection.choices[choice.id]
    if (selectedId === undefined) {
      continue
    }
    const option = choice.options.find((entry) => entry.id === selectedId)
    if (option !== undefined) {
      ancestryLabel = option.label
    }
  }

  return {
    speciesId: definition.id,
    name: definition.name,
    sizeLabel: formatSizeLabel(definition.size),
    speedFeet: definition.speed.walk,
    traits: definition.traits.map((trait) => ({
      id: trait.id,
      name: trait.name,
      description: trait.description,
    })),
    ancestryLabel,
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

function buildFeatCard(
  definition: FeatDefinition | null,
  selection: FeatSelection | null,
  source: ReviewFeatCardModel['source'] = 'selection',
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
      const selectedId = selection.choices[choice.id]
      if (selectedId === undefined) {
        continue
      }
      const option = choice.options.find((entry) => entry.id === selectedId)
      choices.push({
        prompt: choice.prompt,
        summary: option?.label ?? selectedId,
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
      definition.prerequisite.kind === 'text'
        ? definition.prerequisite.summary
        : null,
    choices,
    source,
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
    return buildFeatCard(featDefinition, null, 'background-origin')
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
  }
}

function buildSkills(
  abilityScores: AbilityScores,
  proficiencyBonus: number,
  proficientSkills: Set<SkillId>,
): ReviewSkillRowModel[] {
  return SKILL_IDS.map((skillId) => {
    const abilityId = SKILL_ABILITY_MAP[skillId]
    const rank: ProficiencyRank = proficientSkills.has(skillId)
      ? 'proficient'
      : 'none'
    const modifier = getSkillModifier(
      abilityScores[abilityId],
      proficiencyBonus,
      rank,
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
): ReviewSensesModel {
  const perceptionMod = getSkillModifier(
    abilityScores.wisdom,
    proficiencyBonus,
    proficientSkills.has('perception') ? 'proficient' : 'none',
  )
  const insightMod = getSkillModifier(
    abilityScores.wisdom,
    proficiencyBonus,
    proficientSkills.has('insight') ? 'proficient' : 'none',
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
): ReviewProficienciesModel {
  const armor = new Set<string>()
  const weapons = new Set<string>()
  const tools = new Set<string>()
  const languages: string[] = []

  for (const instance of character.classes) {
    const definition = classDefinitions.get(instance.classId)
    if (definition === undefined) {
      continue
    }

    for (const label of formatArmorProficiencyChipLabels(
      definition.proficiencies.armor,
    )) {
      armor.add(label)
    }
    for (const label of formatWeaponProficiencyChipLabels(
      definition.proficiencies.weapons,
    )) {
      weapons.add(label)
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

  return {
    armor: [...armor],
    weapons: [...weapons],
    tools: [...tools].filter((label) => !label.includes('not chosen yet')),
    languages,
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
    if (effect.kind === 'save-advantage' && effect.condition === 'poisoned') {
      notes.push(
        'Advantage on saving throws to avoid or end the Poisoned condition.',
      )
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
  classDefinitions: Map<string, ClassDefinition>
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
  )
  const proficientSaves = collectSavingThrowProficiencies(
    character,
    input.classDefinitions,
  )

  const skills = buildSkills(
    character.abilityScores,
    proficiencyBonus,
    proficientSkills,
  )
  const initiativeModifier = getAbilityModifier(character.abilityScores.dexterity)
  const speciesCard = buildSpeciesCard(
    input.speciesDefinition,
    character.species,
  )
  const hitPoints = resolveHitPointMaximum({
    classes: character.classes,
    startingClassInstanceId: character.startingClassInstanceId,
    classDefinitionsById: input.classDefinitions,
    abilityScores: character.abilityScores,
    speciesDefinition: input.speciesDefinition,
    speciesSelection: character.species,
  })
  const hitPointMaximum =
    character.classes.length > 0 && hitPoints.isComplete
      ? hitPoints.maximum
      : null

  return {
    species: speciesCard,
    background: buildBackgroundCard(
      input.backgroundDefinition,
      character.background,
    ),
    feat:
      character.feat !== null
        ? buildFeatCard(input.featDefinition, character.feat, 'selection')
        : buildOriginFeatCard(
            input.backgroundDefinition,
            input.originFeatDefinition ?? null,
          ),
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
    ),
    proficiencies: buildProficiencies(
      character,
      input.classDefinitions,
      input.backgroundDefinition,
      character.background,
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
  }
}
