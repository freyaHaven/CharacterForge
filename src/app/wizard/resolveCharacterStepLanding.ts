import type { BackgroundCatalog } from '../../domain/ports/backgroundCatalog'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { EquipmentCatalog } from '../../domain/ports/equipmentCatalog'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { SpellCatalog } from '../../domain/ports/spellCatalog'
import type { Character } from '../../domain/types'
import type { ClassDefinition } from '../../domain/class/types'
import type { FeatDefinition } from '../../domain/feat/types'
import {
  abilityScoresToStandardArrayDraft,
  validateStandardArrayDraft,
} from '../../features/ability-scores/standardArrayDraft'
import {
  initializeRolledDraftFromAbilityScores,
  validateRolledDraft,
} from '../../features/ability-scores/rolledDraft'
import { validatePointBuyAssignment } from '../../rules/point-buy'
import { validateBackgroundSelection } from '../../rules/background/backgroundRules'
import {
  validateClassInstance,
} from '../../rules/class/classRules'
import { validateCharacterClassesWithDefinitions } from '../../rules/class/validateCharacterClasses'
import { validateFeatSelection } from '../../rules/feat/featRules'
import { validateSpeciesSelection } from '../../rules/species/speciesRules'
import { resolveCharacterSpellcasting } from '../../rules/character/resolveCharacterSpellcasting'
import { validateSpellSourceStates } from '../../rules/spell/validateSpellSourceStates'
import { resolveCharacterEquipment } from '../../rules/character/resolveCharacterEquipment'
import { validateResolvedEquipment } from '../../rules/equipment/validateEquipmentSelections'
import {
  getAllStepStatuses,
  getFirstIncompleteCharacterStep,
  type StepValidationContext,
} from './stepStatus'
import { createWizardStepContext } from './stepVisibility'
import type { WizardStepId } from './types'

export type CharacterStepCatalogs = {
  speciesCatalog: SpeciesCatalog
  classCatalog: ClassCatalog
  backgroundCatalog: BackgroundCatalog
  featCatalog: FeatCatalog
  spellCatalog: SpellCatalog
  equipmentCatalog: EquipmentCatalog
}

/**
 * Builds a committed-only {@link StepValidationContext} for a persisted
 * character (no UI drafts or touch flags). Ability-score touch is treated as
 * true so method validation reflects saved scores, matching step-status rules.
 */
export async function buildCommittedStepValidationContext(
  character: Character,
  catalogs: CharacterStepCatalogs,
): Promise<StepValidationContext> {
  const [
    speciesDefinition,
    backgroundDefinition,
    featDefinition,
    feats,
  ] = await Promise.all([
    character.species === null
      ? Promise.resolve(null)
      : catalogs.speciesCatalog.getSpecies(character.species.speciesId),
    character.background === null
      ? Promise.resolve(null)
      : catalogs.backgroundCatalog.getBackground(
          character.background.backgroundId,
        ),
    character.feat === null
      ? Promise.resolve(null)
      : catalogs.featCatalog.getFeat(character.feat.featId),
    catalogs.featCatalog.listFeats(character.editionId),
  ])

  const featById = new Map<string, FeatDefinition>(
    feats.map((feat) => [feat.id, feat]),
  )

  const committedSpeciesValid =
    character.species !== null &&
    validateSpeciesSelection(
      character.species,
      character.editionId,
      speciesDefinition,
      { featById },
    ).ok

  const originFeatDefinition =
    backgroundDefinition !== null
      ? (featById.get(backgroundDefinition.originFeat.featId) ?? null)
      : null

  const classDefinitionEntries = await Promise.all(
    character.classes.map(async (instance) => {
      const definition = await catalogs.classCatalog.getClass(instance.classId)
      return definition === null
        ? null
        : ([instance.classId, definition] as const)
    }),
  )
  const classDefinitionsById = new Map<string, ClassDefinition>(
    classDefinitionEntries.filter(
      (entry): entry is readonly [string, ClassDefinition] => entry !== null,
    ),
  )

  const outsideTakenFeatIds = [
    ...(backgroundDefinition !== null
      ? [backgroundDefinition.originFeat.featId]
      : []),
    ...(character.feat?.featId !== undefined ? [character.feat.featId] : []),
  ]

  const characterClassesResult =
    character.classes.length === 0
      ? null
      : validateCharacterClassesWithDefinitions(
          {
            classes: character.classes,
            targetLevel: character.targetLevel,
            editionId: character.editionId,
            startingClassInstanceId: character.startingClassInstanceId,
            abilityScores: character.abilityScores,
            backgroundDefinition,
            backgroundSelection: character.background,
          },
          (classId) => classDefinitionsById.get(classId) ?? null,
        )

  const committedClassValid =
    character.classes.length > 0 &&
    characterClassesResult !== null &&
    characterClassesResult.status === 'complete' &&
    character.classes.every((instance) => {
      const definition = classDefinitionsById.get(instance.classId) ?? null
      return validateClassInstance(instance, character.editionId, definition, {
        featById,
        characterFeatId: character.feat?.featId ?? null,
        takenFeatIds: outsideTakenFeatIds,
        eligibilityContext: {
          characterLevel: character.targetLevel,
          abilityScores: character.abilityScores,
          hasSpellcasting: [...classDefinitionsById.values()].some(
            (entry) => entry.spellcasting !== undefined,
          ),
          hasFightingStyle: true,
          takenFeatIds: outsideTakenFeatIds,
        },
      }).ok
    })

  const committedBackgroundValid =
    character.background !== null &&
    validateBackgroundSelection(
      character.background,
      character.editionId,
      backgroundDefinition,
      { originFeatDefinition },
    ).ok

  const committedFeatValid =
    character.feat !== null &&
    validateFeatSelection(
      character.feat,
      character.editionId,
      featDefinition,
    ).ok

  const standardArrayValidation =
    character.creationMethod === 'standard-array'
      ? validateStandardArrayDraft(
          abilityScoresToStandardArrayDraft(character.abilityScores),
        )
      : null

  const pointBuyValidation =
    character.creationMethod === 'point-buy'
      ? validatePointBuyAssignment(character.abilityScores)
      : null

  const rolledValidation =
    character.creationMethod === 'rolled'
      ? validateRolledDraft(
          initializeRolledDraftFromAbilityScores(character.abilityScores),
        )
      : null

  return {
    character,
    basicsTouched: false,
    detailsTouched: false,
    abilityScoresTouched: true,
    speciesDraft: null,
    speciesDraftValidation: null,
    committedSpeciesValid,
    classDraft: null,
    classDraftValidation: null,
    committedClassValid,
    backgroundDraft: null,
    backgroundDraftValidation: null,
    committedBackgroundValid,
    featDraft: null,
    featDraftValidation: null,
    committedFeatValid,
    spellValidation: null,
    committedSpellsValid: true,
    equipmentValidation: null,
    committedEquipmentValid: true,
    standardArrayValidation,
    pointBuyValidation,
    rolledValidation,
  }
}

/**
 * Shared open/import destination: first incomplete applicable wizard step, or
 * `review` (Overview) when every applicable step is complete.
 *
 * Uses committed character data and the same step-status / visibility rules as
 * the wizard nav. Call only after migrations and normalization.
 */
export async function getCharacterOpenDestination(
  character: Character,
  catalogs: CharacterStepCatalogs,
): Promise<WizardStepId> {
  const baseContext = await buildCommittedStepValidationContext(
    character,
    catalogs,
  )

  const spellcasting = await resolveCharacterSpellcasting(
    catalogs.classCatalog,
    character,
    {
      featCatalog: catalogs.featCatalog,
      backgroundCatalog: catalogs.backgroundCatalog,
      spellCatalog: catalogs.spellCatalog,
    },
  )

  const spellValidation =
    spellcasting.hasSpellContent
      ? await validateSpellSourceStates(
          spellcasting,
          character.spellSourceStates,
          catalogs.spellCatalog,
        )
      : null

  const committedSpellsValid =
    !spellcasting.hasSpellContent ||
    spellValidation === null ||
    spellValidation.ok

  const resolvedEquipment = await resolveCharacterEquipment(
    catalogs.classCatalog,
    catalogs.backgroundCatalog,
    catalogs.equipmentCatalog,
    character,
  )

  const equipmentValidation =
    resolvedEquipment.sources.length === 0
      ? null
      : validateResolvedEquipment(resolvedEquipment)

  const committedEquipmentValid =
    equipmentValidation === null || equipmentValidation.ok

  const stepStatuses = getAllStepStatuses({
    ...baseContext,
    spellValidation,
    committedSpellsValid,
    equipmentValidation,
    committedEquipmentValid,
  })

  return getFirstIncompleteCharacterStep(
    stepStatuses,
    createWizardStepContext(character, {
      hasSpellContent: spellcasting.hasSpellContent,
    }),
  )
}

