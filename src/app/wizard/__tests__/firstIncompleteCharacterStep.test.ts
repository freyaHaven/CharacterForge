import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../../../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import { createBundledSpellCatalog } from '../../../adapters/bundledSpellCatalog'
import { createBundledEquipmentCatalog } from '../../../adapters/bundledEquipmentCatalog'
import { parseCharacterFile } from '../../../adapters/characterFile'
import { withSingleClassInstance } from '../../../domain/character/characterClassSelection'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import {
  PACKAGE_OPTION_ID,
  STARTING_EQUIPMENT_ENTITLEMENT_ID,
} from '../../../domain/equipment/startingEquipmentHelpers'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../domain/equipment/types'
import type { Character } from '../../../domain/types'
import { createTestFighterClassInstance } from '../../../testing/classFixtures'
import { COMPLETE_DWARF_SELECTION } from '../../../testing/speciesSelectionTestUtils'
import {
  getAllStepStatuses,
  getFirstIncompleteCharacterStep,
  type StepValidationContext,
} from '../stepStatus'
import { createWizardStepContext } from '../stepVisibility'
import { getCharacterOpenDestination } from '../resolveCharacterStepLanding'
import type { StepStatus, WizardStepId } from '../types'

const catalogs = {
  speciesCatalog: createBundledSpeciesCatalog(),
  classCatalog: createBundledClassCatalog(),
  backgroundCatalog: createBundledBackgroundCatalog(),
  featCatalog: createBundledFeatCatalog(),
  spellCatalog: createBundledSpellCatalog(),
  equipmentCatalog: createBundledEquipmentCatalog(),
}

const completeStatus: StepStatus = {
  completion: 'complete',
  hasValidationErrors: false,
}

const incompleteStatus: StepStatus = {
  completion: 'not-started',
  hasValidationErrors: false,
}

const inProgressStatus: StepStatus = {
  completion: 'in-progress',
  hasValidationErrors: false,
}

function createStepStatuses(
  overrides: Partial<Record<WizardStepId, StepStatus>> = {},
): Record<WizardStepId, StepStatus> {
  return {
    basics: completeStatus,
    class: completeStatus,
    background: completeStatus,
    species: completeStatus,
    'ability-scores': completeStatus,
    equipment: completeStatus,
    'character-details': incompleteStatus,
    feats: incompleteStatus,
    spells: incompleteStatus,
    review: inProgressStatus,
    ...overrides,
  }
}

function createContext(
  overrides: Partial<StepValidationContext> = {},
): StepValidationContext {
  return {
    character: createDefaultCharacter(),
    basicsTouched: false,
    detailsTouched: false,
    abilityScoresTouched: true,
    speciesDraft: null,
    speciesDraftValidation: null,
    committedSpeciesValid: true,
    classDraft: null,
    classDraftValidation: null,
    committedClassValid: true,
    backgroundDraft: null,
    backgroundDraftValidation: null,
    committedBackgroundValid: true,
    featDraft: null,
    featDraftValidation: null,
    committedFeatValid: true,
    spellValidation: null,
    committedSpellsValid: true,
    equipmentValidation: null,
    committedEquipmentValid: true,
    standardArrayValidation: null,
    pointBuyValidation: null,
    rolledValidation: null,
    ...overrides,
  }
}

function createCompleteSoldierBackground(): NonNullable<Character['background']> {
  return {
    backgroundId: 'srd-2024:soldier',
    abilityScoreIncrease: {
      mode: 'two-and-one',
      plusTwo: 'strength',
      plusOne: 'constitution',
    },
    choices: {
      'gaming-set': 'dice-set',
    },
  }
}

function createCompleteStartingEquipment(
  classInstanceId: string,
  backgroundId: string,
  classOptionId = 'package-a',
): Character['equipment'] {
  return {
    selections: [
      {
        source: { kind: 'class-instance', instanceId: classInstanceId },
        entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
        optionId: classOptionId,
        choices: [],
      },
      {
        source: { kind: 'background', backgroundId },
        entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
        optionId: PACKAGE_OPTION_ID,
        choices: [],
      },
    ],
    loadout: EMPTY_EQUIPMENT_LOADOUT,
  }
}

function createCompleteFighterCharacter(
  overrides: Partial<Character> = {},
): Character {
  const fighter = createTestFighterClassInstance()

  return createDefaultCharacter({
    id: 'char-complete',
    name: 'Complete Hero',
    creationMethod: 'manual',
    abilityScores: {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    },
    species: { ...COMPLETE_DWARF_SELECTION },
    ...withSingleClassInstance(fighter),
    background: createCompleteSoldierBackground(),
    equipment: createCompleteStartingEquipment(
      fighter.instanceId,
      'srd-2024:soldier',
    ),
    ...overrides,
  })
}

function createCompleteClericCharacter(
  overrides: Partial<Character> = {},
): Character {
  const clericInstanceId = 'cleric-instance-1'

  return createDefaultCharacter({
    id: 'char-cleric',
    name: 'Cleric Hero',
    creationMethod: 'manual',
    abilityScores: {
      strength: 10,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 15,
      charisma: 13,
    },
    species: { ...COMPLETE_DWARF_SELECTION },
    ...withSingleClassInstance({
      instanceId: clericInstanceId,
      classId: 'srd-2024:cleric',
      level: 1,
      choices: {
        'skill-proficiencies': ['insight', 'religion'],
        'divine-order': 'protector',
      },
    }),
    background: createCompleteSoldierBackground(),
    spellSourceStates: [],
    equipment: createCompleteStartingEquipment(
      clericInstanceId,
      'srd-2024:soldier',
    ),
    ...overrides,
  })
}

describe('getFirstIncompleteCharacterStep', () => {
  it('returns review when every applicable non-placeholder step is complete', () => {
    expect(
      getFirstIncompleteCharacterStep(
        createStepStatuses(),
        createWizardStepContext(createDefaultCharacter()),
      ),
    ).toBe('review')
  })

  it('returns the first incomplete step in navigation order', () => {
    expect(
      getFirstIncompleteCharacterStep(
        createStepStatuses({
          basics: incompleteStatus,
          class: incompleteStatus,
        }),
        createWizardStepContext(createDefaultCharacter()),
      ),
    ).toBe('basics')
  })

  it('skips complete earlier steps and returns the first incomplete one', () => {
    expect(
      getFirstIncompleteCharacterStep(
        createStepStatuses({
          class: incompleteStatus,
          species: incompleteStatus,
        }),
        createWizardStepContext(createDefaultCharacter()),
      ),
    ).toBe('class')
  })

  it('treats a partially completed step as incomplete', () => {
    expect(
      getFirstIncompleteCharacterStep(
        createStepStatuses({
          species: inProgressStatus,
        }),
        createWizardStepContext(createDefaultCharacter()),
      ),
    ).toBe('species')
  })

  it('ignores Spells when the step is not visible', () => {
    expect(
      getFirstIncompleteCharacterStep(
        createStepStatuses({
          spells: incompleteStatus,
        }),
        createWizardStepContext(createDefaultCharacter(), {
          hasSpellContent: false,
        }),
      ),
    ).toBe('review')
  })

  it('returns Spells when visible and incomplete after earlier steps', () => {
    expect(
      getFirstIncompleteCharacterStep(
        createStepStatuses({
          spells: incompleteStatus,
        }),
        createWizardStepContext(createDefaultCharacter(), {
          hasSpellContent: true,
        }),
      ),
    ).toBe('spells')
  })

  it('returns Equipment when it is incomplete', () => {
    expect(
      getFirstIncompleteCharacterStep(
        createStepStatuses({
          equipment: incompleteStatus,
        }),
        createWizardStepContext(createDefaultCharacter()),
      ),
    ).toBe('equipment')
  })

  it('uses the same statuses as getAllStepStatuses for a committed character', () => {
    const context = createContext({
      character: createCompleteFighterCharacter(),
      committedSpeciesValid: true,
      committedClassValid: true,
      committedBackgroundValid: true,
      equipmentValidation: { ok: true, issues: [] },
      committedEquipmentValid: true,
    })
    const statuses = getAllStepStatuses(context)

    expect(
      getFirstIncompleteCharacterStep(
        statuses,
        createWizardStepContext(context.character),
      ),
    ).toBe('review')
  })
})

describe('getCharacterOpenDestination', () => {
  it('opens Overview for a fully completed non-spellcaster', async () => {
    await expect(
      getCharacterOpenDestination(createCompleteFighterCharacter(), catalogs),
    ).resolves.toBe('review')
  })

  it('opens Basics when the name is missing', async () => {
    await expect(
      getCharacterOpenDestination(
        createCompleteFighterCharacter({ name: '' }),
        catalogs,
      ),
    ).resolves.toBe('basics')
  })

  it('opens Class when Basics is complete but Class is incomplete', async () => {
    await expect(
      getCharacterOpenDestination(
        createCompleteFighterCharacter({
          classes: [],
          startingClassInstanceId: null,
          targetLevel: 1,
        }),
        catalogs,
      ),
    ).resolves.toBe('class')
  })

  it('opens a later incomplete step only after earlier steps are complete', async () => {
    await expect(
      getCharacterOpenDestination(
        createCompleteFighterCharacter({
          species: null,
        }),
        catalogs,
      ),
    ).resolves.toBe('species')
  })

  it('does not skip to a later complete section when an earlier step is incomplete', async () => {
    await expect(
      getCharacterOpenDestination(
        createCompleteFighterCharacter({ name: '' }),
        catalogs,
      ),
    ).resolves.toBe('basics')
  })

  it('opens Overview for a non-spellcaster rather than Spells', async () => {
    await expect(
      getCharacterOpenDestination(
        createCompleteFighterCharacter({ spellSourceStates: [] }),
        catalogs,
      ),
    ).resolves.toBe('review')
  })

  it('opens Spells for a spellcaster with incomplete spell selections', async () => {
    await expect(
      getCharacterOpenDestination(createCompleteClericCharacter(), catalogs),
    ).resolves.toBe('spells')
  })

  it('evaluates a migrated legacy character using the migrated data', async () => {
    const fighter = createTestFighterClassInstance()
    const legacyPayload = JSON.stringify({
      schemaVersion: 7,
      character: {
        id: 'char-legacy',
        name: 'Legacy Hero',
        editionId: 'srd-2024',
        creationMethod: 'manual',
        abilityScores: {
          strength: 15,
          dexterity: 14,
          constitution: 13,
          intelligence: 12,
          wisdom: 10,
          charisma: 8,
        },
        species: { ...COMPLETE_DWARF_SELECTION },
        // Pre-multiclass singular `class` — must migrate before step evaluation.
        class: {
          classId: fighter.classId,
          level: fighter.level,
          choices: fighter.choices,
        },
        background: null,
        feat: null,
        details: {
          age: '',
          gender: '',
          pronouns: '',
          alignment: null,
          height: '',
          weight: '',
          eyes: 'brown',
          hair: 'black',
          skin: 'fair',
          appearance: '',
          notes: 'old notes',
        },
      },
    })

    const parsed = parseCharacterFile(legacyPayload)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) {
      return
    }

    // Migration produced multiclass shape + v8 details; background still empty.
    expect(parsed.character).not.toHaveProperty('class')
    expect(parsed.character.classes).toEqual([
      expect.objectContaining({
        classId: fighter.classId,
        level: fighter.level,
      }),
    ])
    expect(parsed.character.details).toMatchObject({
      eyeColour: 'brown',
      hairColour: 'black',
      skinTone: 'fair',
      backstoryNotes: 'old notes',
    })
    expect(parsed.character.background).toBeNull()

    // If landing used pre-migration data (no `classes`), Class would win.
    // Migrated Class is complete, so the first incomplete step is Background.
    await expect(
      getCharacterOpenDestination(parsed.character, catalogs),
    ).resolves.toBe('background')
  })

  it('returns the same destination for the same committed character data', async () => {
    const incomplete = createCompleteFighterCharacter({ species: null })
    const complete = createCompleteFighterCharacter()
    const caster = createCompleteClericCharacter()

    const [incompleteDest, completeDest, casterDest] = await Promise.all([
      getCharacterOpenDestination(incomplete, catalogs),
      getCharacterOpenDestination(complete, catalogs),
      getCharacterOpenDestination(caster, catalogs),
    ])

    expect(incompleteDest).toBe('species')
    expect(completeDest).toBe('review')
    expect(casterDest).toBe('spells')

    // Import and saved-character open both call this helper with committed data.
    await expect(
      getCharacterOpenDestination(incomplete, catalogs),
    ).resolves.toBe(incompleteDest)
    await expect(
      getCharacterOpenDestination(complete, catalogs),
    ).resolves.toBe(completeDest)
  })
})
