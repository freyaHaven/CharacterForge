import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../../adapters/bundledClassCatalog'
import { createBundledFeatCatalog } from '../../adapters/bundledFeatCatalog'
import { createBundledSpeciesCatalog } from '../../adapters/bundledSpeciesCatalog'
import { withSingleClassInstance } from '../../domain/character/characterClassSelection'
import { createTestFighterClassInstance } from '../../testing/classFixtures'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { createDefaultCharacterDetails } from '../../domain/character/details'
import type { Character } from '../../domain/types'
import { COMPLETE_DWARF_SELECTION } from '../../testing/speciesSelectionTestUtils'
import { buildReviewSheetModels } from '../buildReviewSheetModels'

async function createChampionSoldierCharacter(): Promise<{
  character: Character
  models: ReturnType<typeof buildReviewSheetModels>
}> {
  const fighterInstance = createTestFighterClassInstance({
    level: 3,
    choices: {
      'fighting-style': 'defense',
      'skill-proficiencies': ['athletics', 'perception'],
      'fighter-subclass': 'champion',
    },
  })

  const character = createDefaultCharacter({
    name: 'Freya',
    species: { ...COMPLETE_DWARF_SELECTION },
    background: {
      backgroundId: 'srd-2024:soldier',
      abilityScoreIncrease: {
        mode: 'two-and-one',
        plusTwo: 'strength',
        plusOne: 'constitution',
      },
      choices: { 'gaming-set': 'dice-set' },
    },
    feat: { featId: 'srd-2024:savage-attacker', choices: {} },
    details: {
      ...createDefaultCharacterDetails(),
      age: '52',
      pronouns: 'she-her',
      alignment: 'lawful-good',
    },
    abilityScores: {
      strength: 16,
      dexterity: 14,
      constitution: 15,
      intelligence: 10,
      wisdom: 12,
      charisma: 8,
    },
    targetLevel: 3,
    ...withSingleClassInstance(fighterInstance),
  })

  const speciesCatalog = createBundledSpeciesCatalog()
  const classCatalog = createBundledClassCatalog()
  const backgroundCatalog = createBundledBackgroundCatalog()
  const featCatalog = createBundledFeatCatalog()

  const speciesDefinition = await speciesCatalog.getSpecies('srd-2024:dwarf')
  const backgroundDefinition =
    await backgroundCatalog.getBackground('srd-2024:soldier')
  const featDefinition = await featCatalog.getFeat('srd-2024:savage-attacker')
  const fighterDefinition = await classCatalog.getClass('srd-2024:fighter')
  const classDefinitions = new Map()
  if (fighterDefinition !== null) {
    classDefinitions.set(fighterDefinition.id, fighterDefinition)
  }

  return {
    character,
    models: buildReviewSheetModels({
      character,
      speciesDefinition,
      backgroundDefinition,
      featDefinition,
      classDefinitions,
    }),
  }
}

describe('buildReviewSheetModels', () => {
  it('builds species, background, feat, skills, saves, senses, and proficiencies for a Dwarf Fighter Champion Soldier', async () => {
    const { models } = await createChampionSoldierCharacter()

    expect(models.species?.name).toBe('Dwarf')
    expect(models.species?.sizeLabel).toBe('Medium')
    expect(models.species?.speedFeet).toBe(30)
    expect(models.species?.traits.map((trait) => trait.name)).toContain(
      'Dwarven Resilience',
    )

    expect(models.background?.name).toBe('Soldier')
    expect(models.background?.skillProficiencies).toEqual([
      'Athletics',
      'Intimidation',
    ])
    expect(models.background?.toolProficiency).toBe('Dice Set')
    expect(models.background?.originFeatName).toBe('Savage Attacker')
    expect(models.background?.abilityScoreBenefits).toContain('Strength +2')

    expect(models.feat?.name).toBe('Savage Attacker')
    expect(models.feat?.categoryBadge).toBe('Origin')
    expect(models.feat?.description).toMatch(/damage dice twice/i)
    expect(models.feat?.source).toBe('selection')
    expect(models.feat?.sourceLabel).toBe('Legacy feat')
    expect(models.feats).toHaveLength(1)

    const athletics = models.skills.find((skill) => skill.skillId === 'athletics')
    const perception = models.skills.find(
      (skill) => skill.skillId === 'perception',
    )
    const stealth = models.skills.find((skill) => skill.skillId === 'stealth')

    expect(athletics?.proficiency).toBe('proficient')
    expect(athletics?.modifierLabel).toBe('+5')
    expect(perception?.proficiency).toBe('proficient')
    expect(perception?.modifierLabel).toBe('+3')
    expect(stealth?.proficiency).toBe('none')
    expect(stealth?.modifierLabel).toBe('+2')

    const strengthSave = models.savingThrows.find(
      (save) => save.abilityId === 'strength',
    )
    const intelligenceSave = models.savingThrows.find(
      (save) => save.abilityId === 'intelligence',
    )
    expect(strengthSave?.proficient).toBe(true)
    expect(strengthSave?.modifierLabel).toBe('+5')
    expect(intelligenceSave?.proficient).toBe(false)
    expect(intelligenceSave?.modifierLabel).toBe('+0')

    expect(models.senses.passives).toEqual([
      { label: 'Passive Perception', value: 13 },
      { label: 'Passive Investigation', value: 10 },
      { label: 'Passive Insight', value: 11 },
    ])
    expect(models.senses.special).toEqual([
      { label: 'Darkvision', detail: '120 ft.' },
    ])
    expect(models.senses.resistances).toEqual([])

    expect(models.proficiencies.armor).toEqual(
      expect.arrayContaining(['Light', 'Medium', 'Heavy', 'Shield']),
    )
    expect(models.proficiencies.weapons).toEqual(
      expect.arrayContaining(['Simple', 'Martial']),
    )
    expect(models.proficiencies.tools).toEqual(['Dice Set'])
    expect(models.proficiencies.languages).toEqual([
      'Common',
      'Dwarvish',
      'Elvish',
    ])
    expect(models.proficiencyBonusLabel).toBe('+2')
    expect(models.initiativeLabel).toBe('+2')
    expect(models.speedLabel).toBe('30 ft.')
    // Unarmoured until starting equipment is resolved: 10 + Dex (+2)
    expect(models.armorClassLabel).toBe('12')
    expect(models.armorClassBreakdown.armorItemId).toBeNull()
  })

  it('adds proficiency bonus to initiative when Alert is granted', async () => {
    const { character } = await createChampionSoldierCharacter()
    const featCatalog = createBundledFeatCatalog()
    const alertDefinition = await featCatalog.getFeat('srd-2024:alert')
    const classCatalog = createBundledClassCatalog()
    const fighterDefinition = await classCatalog.getClass('srd-2024:fighter')
    const classDefinitions = new Map()
    if (fighterDefinition !== null) {
      classDefinitions.set(fighterDefinition.id, fighterDefinition)
    }

    const models = buildReviewSheetModels({
      character: {
        ...character,
        feat: null,
        abilityScores: {
          ...character.abilityScores,
          dexterity: 14,
        },
        targetLevel: 5,
      },
      speciesDefinition: null,
      backgroundDefinition: null,
      featDefinition: null,
      featGrants: [
        {
          featId: 'srd-2024:alert',
          choices: {},
          source: {
            kind: 'background-origin',
            backgroundId: 'srd-2024:criminal',
            backgroundName: 'Criminal',
          },
          displayLabel: 'Background',
        },
      ],
      featDefinitionsById: new Map(
        alertDefinition !== null ? [[alertDefinition.id, alertDefinition]] : [],
      ),
      classDefinitions,
    })

    // DEX 14 → +2, PB at level 5 → +3, Alert → +5
    expect(models.proficiencyBonusLabel).toBe('+3')
    expect(models.initiativeLabel).toBe('+5')
  })

  it('adds Defense Fighting Style +1 AC only while wearing armour', async () => {
    const { character } = await createChampionSoldierCharacter()
    const featCatalog = createBundledFeatCatalog()
    const defenseDefinition = await featCatalog.getFeat('srd-2024:defense')
    const classCatalog = createBundledClassCatalog()
    const fighterDefinition = await classCatalog.getClass('srd-2024:fighter')
    const classDefinitions = new Map()
    if (fighterDefinition !== null) {
      classDefinitions.set(fighterDefinition.id, fighterDefinition)
    }

    const { SRD_2024_EQUIPMENT_BY_ID } = await import(
      '../../content/packs/srd-2024/equipment'
    )

    const grants = [
      {
        featId: 'srd-2024:defense',
        choices: {},
        source: {
          kind: 'class-feat-grant' as const,
          instanceId: character.classes[0]!.instanceId,
          classId: 'srd-2024:fighter',
          className: 'Fighter',
          classLevel: 3,
          choiceId: 'fighting-style',
          grantLabel: 'Fighting Style',
        },
        displayLabel: 'Defense (Fighting Style · Fighter 3)',
      },
    ]

    const unarmored = buildReviewSheetModels({
      character: {
        ...character,
        abilityScores: {
          ...character.abilityScores,
          dexterity: 14,
        },
      },
      speciesDefinition: null,
      backgroundDefinition: null,
      featDefinition: null,
      featGrants: grants,
      featDefinitionsById: new Map(
        defenseDefinition !== null
          ? [[defenseDefinition.id, defenseDefinition]]
          : [],
      ),
      classDefinitions,
    })
    expect(unarmored.armorClassLabel).toBe('12')
    expect(unarmored.armorClassBreakdown.otherBonus).toBe(0)

    const armored = buildReviewSheetModels({
      character: {
        ...character,
        abilityScores: {
          ...character.abilityScores,
          dexterity: 14,
        },
        equipment: {
          ...character.equipment,
          loadout: {
            armorItemId: 'srd-2024:chain-mail',
            mainHandItemId: null,
            offHandItemId: null,
            mainHandGrip: null,
          },
        },
      },
      speciesDefinition: null,
      backgroundDefinition: null,
      featDefinition: null,
      featGrants: grants,
      featDefinitionsById: new Map(
        defenseDefinition !== null
          ? [[defenseDefinition.id, defenseDefinition]]
          : [],
      ),
      classDefinitions,
      resolvedEquipment: {
        sources: [],
        entries: [],
        inventory: [
          {
            itemId: 'srd-2024:chain-mail',
            name: 'Chain Mail',
            quantity: 1,
            category: 'armor',
          },
        ],
        mergedInventory: [
          {
            itemId: 'srd-2024:chain-mail',
            name: 'Chain Mail',
            quantity: 1,
            category: 'armor',
          },
        ],
        currency: { goldPieces: 0 },
        weightCarriedLb: 0,
      },
      equipmentDefinitionsById: SRD_2024_EQUIPMENT_BY_ID,
    })

    // Chain mail 16 + Defense 1 (DEX ignored for heavy)
    expect(armored.armorClassLabel).toBe('17')
    expect(armored.armorClassBreakdown.otherBonus).toBe(1)
  })

  it('derives Armour Class from resolved starting armour and shield', async () => {
    const { character, models: baseModels } = await createChampionSoldierCharacter()
    const speciesCatalog = createBundledSpeciesCatalog()
    const classCatalog = createBundledClassCatalog()
    const backgroundCatalog = createBundledBackgroundCatalog()
    const featCatalog = createBundledFeatCatalog()

    const speciesDefinition = await speciesCatalog.getSpecies('srd-2024:dwarf')
    const backgroundDefinition =
      await backgroundCatalog.getBackground('srd-2024:soldier')
    const featDefinition = await featCatalog.getFeat('srd-2024:savage-attacker')
    const fighterDefinition = await classCatalog.getClass('srd-2024:fighter')
    const classDefinitions = new Map()
    if (fighterDefinition !== null) {
      classDefinitions.set(fighterDefinition.id, fighterDefinition)
    }

    const { SRD_2024_EQUIPMENT_BY_ID } = await import(
      '../../content/packs/srd-2024/equipment'
    )

    const models = buildReviewSheetModels({
      character: {
        ...character,
        abilityScores: {
          ...character.abilityScores,
          dexterity: 14,
        },
        equipment: {
          ...character.equipment,
          loadout: {
            armorItemId: 'srd-2024:chain-mail',
            mainHandItemId: null,
            offHandItemId: 'srd-2024:shield',
            mainHandGrip: null,
          },
        },
      },
      speciesDefinition,
      backgroundDefinition,
      featDefinition,
      classDefinitions,
      resolvedEquipment: {
        sources: [],
        entries: [],
        currency: { goldPieces: 0 },
        inventory: [
          {
            itemId: 'srd-2024:chain-mail',
            name: 'Chain Mail',
            quantity: 1,
            category: 'armor',
          },
          {
            itemId: 'srd-2024:shield',
            name: 'Shield',
            quantity: 1,
            category: 'shield',
          },
        ],
        mergedInventory: [
          {
            itemId: 'srd-2024:chain-mail',
            name: 'Chain Mail',
            quantity: 1,
            category: 'armor',
          },
          {
            itemId: 'srd-2024:shield',
            name: 'Shield',
            quantity: 1,
            category: 'shield',
          },
        ],
        weightCarriedLb: 0,
      },
      equipmentDefinitionsById: SRD_2024_EQUIPMENT_BY_ID,
    })

    expect(baseModels.armorClassLabel).toBe('12')
    expect(models.armorClassLabel).toBe('18') // 16 heavy + 2 shield
    expect(models.armorClassBreakdown).toMatchObject({
      base: 16,
      dexterityBonus: 0,
      shieldBonus: 2,
      armorItemId: 'srd-2024:chain-mail',
      shieldItemId: 'srd-2024:shield',
    })
  })

  it('falls back to the background origin feat when no feat selection exists', async () => {
    const backgroundDefinition = await createBundledBackgroundCatalog().getBackground(
      'srd-2024:soldier',
    )
    const originFeatDefinition = await createBundledFeatCatalog().getFeat(
      'srd-2024:savage-attacker',
    )
    const character = createDefaultCharacter({
      background: {
        backgroundId: 'srd-2024:soldier',
        abilityScoreIncrease: {
          mode: 'two-and-one',
          plusTwo: 'strength',
          plusOne: 'constitution',
        },
        choices: { 'gaming-set': 'dice-set' },
      },
      feat: null,
    })

    const models = buildReviewSheetModels({
      character,
      speciesDefinition: null,
      backgroundDefinition,
      featDefinition: null,
      originFeatDefinition,
      classDefinitions: new Map(),
    })

    expect(models.feat?.name).toBe('Savage Attacker')
    expect(models.feat?.source).toBe('background-origin')
    expect(models.feat?.sourceLabel).toBe('Soldier')
    expect(models.feat?.description).toMatch(/damage dice twice/i)
  })
})
