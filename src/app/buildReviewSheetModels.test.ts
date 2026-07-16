import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../adapters/bundledClassCatalog'
import { createBundledFeatCatalog } from '../adapters/bundledFeatCatalog'
import { createBundledSpeciesCatalog } from '../adapters/bundledSpeciesCatalog'
import {
  createTestFighterClassInstance,
  withSingleClassInstance,
} from '../domain/character/characterClassSelection'
import { createDefaultCharacter } from '../domain/character/defaults'
import { createDefaultCharacterDetails } from '../domain/character/details'
import type { Character } from '../domain/types'
import { buildReviewSheetModels } from './buildReviewSheetModels'

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
    species: { speciesId: 'srd-2024:dwarf', choices: {} },
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

    expect(models.proficiencies.armor).toEqual(
      expect.arrayContaining(['Light', 'Medium', 'Heavy', 'Shield']),
    )
    expect(models.proficiencies.weapons).toEqual(
      expect.arrayContaining(['Simple', 'Martial']),
    )
    expect(models.proficiencies.tools).toEqual(['Dice Set'])
    expect(models.proficiencyBonusLabel).toBe('+2')
    expect(models.initiativeLabel).toBe('+2')
    expect(models.speedLabel).toBe('30 ft.')
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
    expect(models.feat?.description).toMatch(/damage dice twice/i)
  })
})
