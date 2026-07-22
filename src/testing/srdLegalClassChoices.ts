/**
 * Test-only SRD 2024 legal class choice builders for P2.12 matrices.
 * Intentionally imports content packs (allowed under src/testing/).
 */
import { createAsiChoicesUpToLevel } from '../domain/class/abilityScoreImprovement'
import { selectEpicBoonFeat } from '../domain/class/epicBoon'
import { selectFightingStyleFeat } from '../domain/class/fightingStyle'
import { createFeatGrantChoiceStorageKey } from '../domain/feat/featGrantChoiceStorage'
import { selectAsiPlus1 } from '../domain/class/abilityScoreImprovement'
import type { CharacterClassSelection } from '../domain/class/types'
import {
  getEligibleBeastForms,
  getWildShapeKnownFormsCount,
} from '../domain/class/beastForms'
import { createBarbarianWeaponMasteryChoices } from '../content/packs/srd-2024/classes/barbarian.weaponMastery'
import { createFighterWeaponMasteryChoices } from '../content/packs/srd-2024/classes/fighter.weaponMastery'
import { createPaladinWeaponMasteryChoices } from '../content/packs/srd-2024/classes/paladin.weaponMastery'
import { createRangerWeaponMasteryChoices } from '../content/packs/srd-2024/classes/ranger.weaponMastery'
import { createRogueWeaponMasteryChoices } from '../content/packs/srd-2024/classes/rogue.weaponMastery'
import {
  BARBARIAN_ASI_FEATURE_LEVELS,
  BARD_ASI_FEATURE_LEVELS,
  CLERIC_ASI_FEATURE_LEVELS,
  DRUID_ASI_FEATURE_LEVELS,
  MONK_ASI_FEATURE_LEVELS,
  PALADIN_ASI_FEATURE_LEVELS,
  RANGER_ASI_FEATURE_LEVELS,
  ROGUE_ASI_FEATURE_LEVELS,
  SORCERER_ASI_FEATURE_LEVELS,
  WARLOCK_ASI_FEATURE_LEVELS,
  WIZARD_ASI_FEATURE_LEVELS,
} from '../content/packs/srd-2024/progressions/asiLevels'
import { WARLOCK_INVOCATIONS_BY_LEVEL } from '../content/packs/srd-2024/progressions'

export type LegalClassLevel = 1 | 3 | 20

function withEpicBoonAsi(
  choices: CharacterClassSelection['choices'],
  boonFeatId: string,
  ability:
    | 'strength'
    | 'dexterity'
    | 'constitution'
    | 'intelligence'
    | 'wisdom'
    | 'charisma' = 'strength',
): CharacterClassSelection['choices'] {
  return {
    ...choices,
    'epic-boon': selectEpicBoonFeat(boonFeatId),
    [createFeatGrantChoiceStorageKey('epic-boon', 'ability-score-increase')]:
      selectAsiPlus1(ability),
  }
}

function warlockInvocationsAt(level: number): string[] {
  const count = WARLOCK_INVOCATIONS_BY_LEVEL[level - 1] ?? 1
  const pool = [
    'eldritch-mind',
    'armor-of-shadows',
    'mask-of-many-faces',
    'misty-visions',
    'fiendish-vigor',
    'devils-sight',
    'otherworldly-leap',
    'agonizing-blast',
    'repelling-blast',
    'pact-of-the-blade',
  ]
  return pool.slice(0, count)
}

/** Minimal Wild Shape form picks for Druid L2+. */
function wildShapeForms(level: number): string[] {
  const count = getWildShapeKnownFormsCount(level)
  return getEligibleBeastForms(level)
    .slice(0, count)
    .map((form) => form.id)
}

export function buildLegalClassInstance(
  classKey:
    | 'barbarian'
    | 'bard'
    | 'cleric'
    | 'druid'
    | 'fighter'
    | 'monk'
    | 'paladin'
    | 'ranger'
    | 'rogue'
    | 'sorcerer'
    | 'warlock'
    | 'wizard',
  level: LegalClassLevel,
): CharacterClassSelection {
  const instanceId = `${classKey}-legal-1`
  const classId = `srd-2024:${classKey}`

  switch (classKey) {
    case 'fighter': {
      let choices: CharacterClassSelection['choices'] = {
        'fighting-style': 'defense',
        'skill-proficiencies': ['athletics', 'perception'],
        ...createFighterWeaponMasteryChoices(level),
        ...createAsiChoicesUpToLevel(level),
      }
      if (level >= 3) {
        choices['fighter-subclass'] = 'champion'
      }
      if (level >= 7) {
        choices['champion-additional-fighting-style'] =
          selectFightingStyleFeat('srd-2024:archery')
      }
      if (level >= 19) {
        choices = withEpicBoonAsi(
          choices,
          'srd-2024:boon-of-combat-prowess',
          'strength',
        )
      }
      return { instanceId, classId, level, choices }
    }
    case 'barbarian': {
      let choices: CharacterClassSelection['choices'] = {
        'skill-proficiencies': ['athletics', 'perception'],
        ...createBarbarianWeaponMasteryChoices(level),
        ...createAsiChoicesUpToLevel(level, BARBARIAN_ASI_FEATURE_LEVELS),
      }
      if (level >= 3) {
        choices['barbarian-subclass'] = 'path-of-the-berserker'
        choices['primal-knowledge'] = ['intimidation']
      }
      if (level >= 19) {
        choices = withEpicBoonAsi(
          choices,
          'srd-2024:boon-of-irresistible-offense',
          'strength',
        )
      }
      return { instanceId, classId, level, choices }
    }
    case 'rogue': {
      let choices: CharacterClassSelection['choices'] = {
        'skill-proficiencies': [
          'stealth',
          'sleight-of-hand',
          'perception',
          'athletics',
        ],
        expertise: ['stealth', 'sleight-of-hand'],
        ...createRogueWeaponMasteryChoices(level),
        ...createAsiChoicesUpToLevel(level, ROGUE_ASI_FEATURE_LEVELS),
      }
      if (level >= 3) {
        choices['rogue-subclass'] = 'thief'
      }
      if (level >= 6) {
        choices['expertise-6'] = ['perception', 'athletics']
      }
      if (level >= 19) {
        choices = withEpicBoonAsi(
          choices,
          'srd-2024:boon-of-the-night-spirit',
          'dexterity',
        )
      }
      return { instanceId, classId, level, choices }
    }
    case 'monk': {
      let choices: CharacterClassSelection['choices'] = {
        'skill-proficiencies': ['acrobatics', 'stealth'],
        'tool-proficiency': 'flute',
        ...createAsiChoicesUpToLevel(level, MONK_ASI_FEATURE_LEVELS),
      }
      if (level >= 3) {
        choices['monk-subclass'] = 'warrior-of-the-open-hand'
      }
      if (level >= 19) {
        choices = withEpicBoonAsi(
          choices,
          'srd-2024:boon-of-irresistible-offense',
          'dexterity',
        )
      }
      return { instanceId, classId, level, choices }
    }
    case 'paladin': {
      let choices: CharacterClassSelection['choices'] = {
        'skill-proficiencies': ['athletics', 'persuasion'],
        ...createPaladinWeaponMasteryChoices(level),
        ...createAsiChoicesUpToLevel(level, PALADIN_ASI_FEATURE_LEVELS),
      }
      if (level >= 2) {
        choices['fighting-style'] = 'defense'
      }
      if (level >= 3) {
        choices['paladin-subclass'] = 'oath-of-devotion'
      }
      if (level >= 19) {
        choices = withEpicBoonAsi(
          choices,
          'srd-2024:boon-of-truesight',
          'charisma',
        )
      }
      return { instanceId, classId, level, choices }
    }
    case 'ranger': {
      let choices: CharacterClassSelection['choices'] = {
        'skill-proficiencies': ['stealth', 'perception', 'survival'],
        ...createRangerWeaponMasteryChoices(level),
        ...createAsiChoicesUpToLevel(level, RANGER_ASI_FEATURE_LEVELS),
      }
      if (level >= 2) {
        choices['fighting-style'] = 'archery'
        choices.expertise = ['stealth']
      }
      if (level >= 3) {
        choices['ranger-subclass'] = 'hunter'
      }
      if (level >= 9) {
        choices['expertise-9'] = ['perception', 'survival']
      }
      if (level >= 19) {
        choices = withEpicBoonAsi(
          choices,
          'srd-2024:boon-of-dimensional-travel',
          'dexterity',
        )
      }
      return { instanceId, classId, level, choices }
    }
    case 'cleric': {
      let choices: CharacterClassSelection['choices'] = {
        'skill-proficiencies': ['insight', 'religion'],
        'divine-order': 'protector',
        ...createAsiChoicesUpToLevel(level, CLERIC_ASI_FEATURE_LEVELS),
      }
      if (level >= 3) {
        choices['cleric-subclass'] = 'life-domain'
      }
      if (level >= 7) {
        choices['blessed-strikes'] = 'potent-spellcasting'
      }
      if (level >= 19) {
        choices = withEpicBoonAsi(choices, 'srd-2024:boon-of-fate', 'wisdom')
      }
      return { instanceId, classId, level, choices }
    }
    case 'druid': {
      let choices: CharacterClassSelection['choices'] = {
        'skill-proficiencies': ['nature', 'perception'],
        'primal-order': 'warden',
        ...createAsiChoicesUpToLevel(level, DRUID_ASI_FEATURE_LEVELS),
      }
      if (level >= 2) {
        choices['wild-shape-forms'] = wildShapeForms(level)
      }
      if (level >= 3) {
        choices['druid-subclass'] = 'circle-of-the-land'
        choices['circle-land'] = 'temperate'
      }
      if (level >= 7) {
        choices['elemental-fury'] = 'potent-spellcasting'
      }
      if (level >= 19) {
        choices = withEpicBoonAsi(
          choices,
          'srd-2024:boon-of-dimensional-travel',
          'wisdom',
        )
      }
      return { instanceId, classId, level, choices }
    }
    case 'wizard': {
      let choices: CharacterClassSelection['choices'] = {
        'skill-proficiencies': ['arcana', 'history'],
        ...createAsiChoicesUpToLevel(level, WIZARD_ASI_FEATURE_LEVELS),
      }
      if (level >= 2) {
        choices.scholar = ['arcana']
      }
      if (level >= 3) {
        choices['wizard-subclass'] = 'evoker'
      }
      if (level >= 19) {
        choices = withEpicBoonAsi(
          choices,
          'srd-2024:boon-of-spell-recall',
          'intelligence',
        )
      }
      return { instanceId, classId, level, choices }
    }
    case 'bard': {
      let choices: CharacterClassSelection['choices'] = {
        'skill-proficiencies': ['performance', 'persuasion', 'deception'],
        'musical-instruments': ['lute', 'flute', 'drum'],
        ...createAsiChoicesUpToLevel(level, BARD_ASI_FEATURE_LEVELS),
      }
      if (level >= 2) {
        choices.expertise = ['performance', 'persuasion']
      }
      if (level >= 3) {
        choices['bard-subclass'] = 'college-of-lore'
        choices['lore-bonus-proficiencies'] = [
          'arcana',
          'history',
          'investigation',
        ]
      }
      if (level >= 9) {
        choices['expertise-9'] = ['deception', 'arcana']
      }
      if (level >= 19) {
        choices = withEpicBoonAsi(
          choices,
          'srd-2024:boon-of-spell-recall',
          'charisma',
        )
      }
      return { instanceId, classId, level, choices }
    }
    case 'sorcerer': {
      let choices: CharacterClassSelection['choices'] = {
        'skill-proficiencies': ['arcana', 'persuasion'],
        ...createAsiChoicesUpToLevel(level, SORCERER_ASI_FEATURE_LEVELS),
      }
      if (level >= 2) {
        choices.metamagic = ['careful-spell', 'distant-spell']
      }
      if (level >= 3) {
        choices['sorcerer-subclass'] = 'draconic-sorcery'
      }
      if (level >= 6) {
        choices['elemental-affinity'] = 'fire'
      }
      if (level >= 10) {
        choices['metamagic-10'] = ['empowered-spell', 'extended-spell']
      }
      if (level >= 17) {
        choices['metamagic-17'] = ['heightened-spell', 'quickened-spell']
      }
      if (level >= 19) {
        choices = withEpicBoonAsi(
          choices,
          'srd-2024:boon-of-dimensional-travel',
          'charisma',
        )
      }
      return { instanceId, classId, level, choices }
    }
    case 'warlock': {
      const invocations = warlockInvocationsAt(level)
      let choices: CharacterClassSelection['choices'] = {
        'skill-proficiencies': ['arcana', 'deception'],
        'eldritch-invocations': invocations,
        ...createAsiChoicesUpToLevel(level, WARLOCK_ASI_FEATURE_LEVELS),
      }
      if (invocations.includes('pact-of-the-blade')) {
        choices['pact-blade-weapon'] = 'longsword'
      }
      if (invocations.includes('agonizing-blast')) {
        choices['invocation-agonizing-blast-cantrip'] = 'srd-2024:eldritch-blast'
      }
      if (invocations.includes('repelling-blast')) {
        choices['invocation-repelling-blast-cantrip'] = 'srd-2024:eldritch-blast'
      }
      if (level >= 3) {
        choices['warlock-subclass'] = 'fiend'
      }
      if (level >= 10) {
        choices['fiendish-resilience'] = 'fire'
      }
      if (level >= 19) {
        choices = withEpicBoonAsi(choices, 'srd-2024:boon-of-fate', 'charisma')
      }
      return { instanceId, classId, level, choices }
    }
  }
}

export const ALL_SRD_CLASS_KEYS = [
  'barbarian',
  'bard',
  'cleric',
  'druid',
  'fighter',
  'monk',
  'paladin',
  'ranger',
  'rogue',
  'sorcerer',
  'warlock',
  'wizard',
] as const
