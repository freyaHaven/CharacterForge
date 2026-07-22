import type { ClassDefinition } from '../../../../domain/class/types'
import { createAsiChoiceDefinition } from '../../../../domain/class/abilityScoreImprovement'
import { createEpicBoonChoiceDefinition } from '../../../../domain/class/epicBoon'
import { subclassToChoiceOption } from '../../../../domain/class/subclassDefinition'
import type { SkillId } from '../../../../domain/skills/types'
import { SKILL_LABELS } from '../../../../domain/skills/types'
import { FINESSE_OR_LIGHT_WEAPON_IDS } from '../../../../domain/weapons/types'
import {
  formatWeaponMasteryDescription,
  formatWeaponMasteryOptionLabel,
} from '../../../../domain/weapons/mastery'
import { createCompleteClassPackageOrGoldStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { ROGUE_PACKAGE_A } from '../equipment/packages'
import { SRD_2024_SOURCE } from '../source'
import { thiefSrd2024 } from '../subclasses/thief'

const ROGUE_SKILL_OPTIONS = [
  'acrobatics',
  'athletics',
  'deception',
  'insight',
  'intimidation',
  'investigation',
  'perception',
  'persuasion',
  'sleight-of-hand',
  'stealth',
] as const satisfies readonly SkillId[]

const WEAPON_MASTERY_OPTIONS = FINESSE_OR_LIGHT_WEAPON_IDS.map((weaponId) => ({
  id: weaponId,
  label: formatWeaponMasteryOptionLabel(weaponId),
  description: formatWeaponMasteryDescription(weaponId),
}))

const EXPERTISE_OPTIONS = ROGUE_SKILL_OPTIONS.map((skillId) => ({
  id: skillId,
  label: SKILL_LABELS[skillId],
  effects: [{ kind: 'skill-expertise' as const, skillId }],
}))

export const rogueSrd2024: ClassDefinition = {
  id: 'srd-2024:rogue',
  editionId: 'srd-2024',
  name: 'Rogue',
  description:
    'A scoundrel who uses stealth and trickery to overcome obstacles and enemies.',
  source: SRD_2024_SOURCE,
  catalogOrder: 20,
  hitDie: { sides: 8 },
  primaryAbilities: ['dexterity'],
  multiclassPrerequisite: {
    kind: 'all-of',
    abilities: ['dexterity'],
    minimum: 13,
    summary: 'Dexterity 13',
  },
  savingThrows: ['dexterity', 'intelligence'],
  proficiencies: {
    armor: ['light'],
    weapons: ['simple', 'martial'],
    tools: [],
    skillOptions: [...ROGUE_SKILL_OPTIONS],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'expertise',
          name: 'Expertise',
          description:
            'You gain Expertise in two of your skill proficiencies of your choice. Sleight of Hand and Stealth are recommended if you have proficiency in them.\nAt Rogue level 6, you gain Expertise in two more of your skill proficiencies of your choice.',
        },
        {
          id: 'sneak-attack',
          name: 'Sneak Attack',
          description:
            'You know how to strike subtly and exploit a foe\'s distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack roll if you have Advantage on the roll and the attack uses a Finesse or a Ranged weapon. The extra damage\'s type is the same as the weapon\'s type.\nYou don\'t need Advantage on the attack roll if at least one of your allies is within 5 feet of the target, the ally doesn\'t have the Incapacitated condition, and you don\'t have Disadvantage on the attack roll.\nThe extra damage increases as you gain Rogue levels, as shown in the Sneak Attack column of the Rogue Features table.',
        },
        {
          id: 'thieves-cant',
          name: 'Thieves\' Cant',
          description:
            'You picked up various languages in the communities where you plied your roguish talents. You know Thieves\' Cant and one other language of your choice from the language tables in Character Creation.',
        },
        {
          id: 'weapon-mastery',
          name: 'Weapon Mastery',
          description:
            'Your training with weapons allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency, such as Daggers and Shortbows.\nWhenever you finish a Long Rest, you can change the kinds of weapons you chose.',
        },
      ],
    },
    {
      level: 2,
      features: [
        {
          id: 'cunning-action',
          name: 'Cunning Action',
          description:
            'Your quick thinking and agility allow you to move and act quickly. On your turn, you can take one of the following actions as a Bonus Action: Dash, Disengage, or Hide.',
        },
      ],
    },
    {
      level: 3,
      features: [
        {
          id: 'rogue-subclass',
          name: 'Rogue Subclass',
          description:
            'You gain a Rogue subclass of your choice. The Thief subclass is detailed in the SRD. A subclass is a specialization that grants you features at certain Rogue levels. For the rest of your career, you gain each of your subclass features that are of your Rogue level or lower.',
        },
        {
          id: 'steady-aim',
          name: 'Steady Aim',
          description:
            'As a Bonus Action, you give yourself Advantage on your next attack roll on the current turn. You can use this feature only if you haven\'t moved during this turn, and after you use it, your Speed is 0 until the end of the current turn.',
        },
        {
          id: 'sneak-attack-2d6',
          name: 'Sneak Attack Improvement',
          description:
            'Your Sneak Attack damage increases to 2d6, as shown on the Rogue Features table.',
        },
      ],
    },
    {
      level: 4,
      features: [
        {
          id: 'ability-score-improvement-4',
          name: 'Ability Score Improvement',
          description:
            'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.',
        },
      ],
    },
    {
      level: 5,
      features: [
        {
          id: 'cunning-strike',
          name: 'Cunning Strike',
          description:
            'You\'ve developed cunning ways to use your Sneak Attack. When you deal Sneak Attack damage, you can add one of the following Cunning Strike effects. Each effect has a die cost, which is the number of Sneak Attack damage dice you must forgo to add the effect. You remove the die before rolling, and the effect occurs immediately after the attack\'s damage is dealt.\nIf a Cunning Strike effect requires a saving throw, the DC equals 8 plus your Dexterity modifier and Proficiency Bonus.\nPoison (Cost: 1d6). You add a toxin to your strike, forcing the target to make a Constitution saving throw. On a failed save, the target has the Poisoned condition for 1 minute. At the end of each of its turns, the Poisoned target repeats the save, ending the effect on itself on a success. To use this effect, you must have a Poisoner\'s Kit on your person.\nTrip (Cost: 1d6). If the target is Large or smaller, it must succeed on a Dexterity saving throw or have the Prone condition.\nWithdraw (Cost: 1d6). Immediately after the attack, you move up to half your Speed without provoking Opportunity Attacks.',
        },
        {
          id: 'uncanny-dodge',
          name: 'Uncanny Dodge',
          description:
            'When an attacker that you can see hits you with an attack roll, you can take a Reaction to halve the attack\'s damage against you (round down).',
        },
        {
          id: 'sneak-attack-3d6',
          name: 'Sneak Attack Improvement',
          description:
            'Your Sneak Attack damage increases to 3d6, as shown on the Rogue Features table.',
        },
      ],
    },
    {
      level: 6,
      features: [
        {
          id: 'expertise-6',
          name: 'Expertise',
          description:
            'You gain Expertise in two more of your skill proficiencies of your choice.',
        },
      ],
    },
    {
      level: 7,
      features: [
        {
          id: 'evasion',
          name: 'Evasion',
          description:
            'You can nimbly dodge out of the way of certain dangers. When you\'re subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw and only half damage if you fail. You can\'t use this feature if you have the Incapacitated condition.',
        },
        {
          id: 'reliable-talent',
          name: 'Reliable Talent',
          description:
            'Whenever you make an ability check that uses one of your skill or tool proficiencies, you can treat a d20 roll of 9 or lower as a 10.',
        },
        {
          id: 'sneak-attack-4d6',
          name: 'Sneak Attack Improvement',
          description:
            'Your Sneak Attack damage increases to 4d6, as shown on the Rogue Features table.',
        },
      ],
    },
    {
      level: 8,
      features: [
        {
          id: 'ability-score-improvement-8',
          name: 'Ability Score Improvement',
          description:
            'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.',
        },
      ],
    },
    {
      level: 9,
      features: [
        {
          id: 'rogue-subclass-feature-9',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Rogue subclass.',
        },
        {
          id: 'sneak-attack-5d6',
          name: 'Sneak Attack Improvement',
          description:
            'Your Sneak Attack damage increases to 5d6, as shown on the Rogue Features table.',
        },
      ],
    },
    {
      level: 10,
      features: [
        {
          id: 'ability-score-improvement-10',
          name: 'Ability Score Improvement',
          description:
            'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.',
        },
      ],
    },
    {
      level: 11,
      features: [
        {
          id: 'improved-cunning-strike',
          name: 'Improved Cunning Strike',
          description:
            'You can use up to two Cunning Strike effects when you deal Sneak Attack damage, paying the die cost for each effect.',
        },
        {
          id: 'sneak-attack-6d6',
          name: 'Sneak Attack Improvement',
          description:
            'Your Sneak Attack damage increases to 6d6, as shown on the Rogue Features table.',
        },
      ],
    },
    {
      level: 12,
      features: [
        {
          id: 'ability-score-improvement-12',
          name: 'Ability Score Improvement',
          description:
            'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.',
        },
      ],
    },
    {
      level: 13,
      features: [
        {
          id: 'rogue-subclass-feature-13',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Rogue subclass.',
        },
        {
          id: 'sneak-attack-7d6',
          name: 'Sneak Attack Improvement',
          description:
            'Your Sneak Attack damage increases to 7d6, as shown on the Rogue Features table.',
        },
      ],
    },
    {
      level: 14,
      features: [
        {
          id: 'devious-strikes',
          name: 'Devious Strikes',
          description:
            'You\'ve practiced new ways to use your Sneak Attack deviously. The following effects are now among your Cunning Strike options.\nDaze (Cost: 2d6). The target must succeed on a Constitution saving throw, or on its next turn, it can do only one of the following: move or take an action or a Bonus Action.\nKnock Out (Cost: 6d6). The target must succeed on a Constitution saving throw, or it has the Unconscious condition for 1 minute or until it takes any damage. The Unconscious target repeats the save at the end of each of its turns, ending the effect on itself on a success.\nObscure (Cost: 3d6). The target must succeed on a Dexterity saving throw, or it has the Blinded condition until the end of its next turn.',
        },
      ],
    },
    {
      level: 15,
      features: [
        {
          id: 'slippery-mind',
          name: 'Slippery Mind',
          description:
            'Your cunning mind is exceptionally difficult to control. You gain proficiency in Wisdom and Charisma saving throws.',
        },
        {
          id: 'sneak-attack-8d6',
          name: 'Sneak Attack Improvement',
          description:
            'Your Sneak Attack damage increases to 8d6, as shown on the Rogue Features table.',
        },
      ],
    },
    {
      level: 16,
      features: [
        {
          id: 'ability-score-improvement-16',
          name: 'Ability Score Improvement',
          description:
            'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.',
        },
      ],
    },
    {
      level: 17,
      features: [
        {
          id: 'rogue-subclass-feature-17',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Rogue subclass.',
        },
        {
          id: 'sneak-attack-9d6',
          name: 'Sneak Attack Improvement',
          description:
            'Your Sneak Attack damage increases to 9d6, as shown on the Rogue Features table.',
        },
      ],
    },
    {
      level: 18,
      features: [
        {
          id: 'elusive',
          name: 'Elusive',
          description:
            'You\'re so evasive that attackers rarely gain the upper hand against you. No attack roll can have Advantage against you unless you have the Incapacitated condition.',
        },
      ],
    },
    {
      level: 19,
      features: [
        {
          id: 'epic-boon',
          name: 'Epic Boon',
          description:
            'You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of the Night Spirit is recommended.',
        },
        {
          id: 'sneak-attack-10d6',
          name: 'Sneak Attack Improvement',
          description:
            'Your Sneak Attack damage increases to 10d6, as shown on the Rogue Features table.',
        },
      ],
    },
    {
      level: 20,
      features: [
        {
          id: 'stroke-of-luck',
          name: 'Stroke of Luck',
          description:
            'You have a marvelous knack for succeeding when you need to. If you fail a D20 Test, you can turn the roll into a 20.\nOnce you use this feature, you can\'t use it again until you finish a Short or Long Rest.',
        },
      ],
    },
  ],
  choices: [
    {
      id: 'skill-proficiencies',
      level: 1,
      prompt: 'Choose four skill proficiencies',
      type: 'multi-select',
      required: true,
      min: 4,
      max: 4,
      options: ROGUE_SKILL_OPTIONS.map((skillId) => ({
        id: skillId,
        label: SKILL_LABELS[skillId],
        effects: [{ kind: 'skill-proficiency', skillId }],
      })),
    },
    {
      id: 'expertise',
      level: 1,
      prompt: 'Choose two skills for Expertise',
      type: 'multi-select',
      required: true,
      min: 2,
      max: 2,
      options: EXPERTISE_OPTIONS,
    },
    {
      id: 'weapon-mastery',
      level: 1,
      prompt: 'Choose 2 weapon masteries',
      type: 'multi-select',
      required: true,
      min: 2,
      max: 2,
      options: WEAPON_MASTERY_OPTIONS,
    },
    {
      id: 'rogue-subclass',
      level: 3,
      prompt: 'Choose a Rogue Subclass',
      type: 'single-select',
      required: true,
      options: [subclassToChoiceOption(thiefSrd2024)],
    },
    {
      id: 'expertise-6',
      level: 6,
      prompt: 'Choose two more skills for Expertise',
      type: 'multi-select',
      required: true,
      min: 2,
      max: 2,
      options: EXPERTISE_OPTIONS,
    },
    createAsiChoiceDefinition('ability-score-improvement-4', 4),
    createAsiChoiceDefinition('ability-score-improvement-8', 8),
    createAsiChoiceDefinition('ability-score-improvement-10', 10),
    createAsiChoiceDefinition('ability-score-improvement-12', 12),
    createAsiChoiceDefinition('ability-score-improvement-16', 16),
    createEpicBoonChoiceDefinition({
      recommendedFeatId: 'srd-2024:boon-of-the-night-spirit',
    }),
  ],
  startingEquipment: createCompleteClassPackageOrGoldStartingEquipment({
    items: ROGUE_PACKAGE_A,
    goldPieces: 100,
  }),
  deferredRequirements: [
    {
      id: 'starting-equipment',
      level: 1,
      destinationStep: 'equipment',
      label: 'Starting Equipment',
      description: 'Choose starting equipment in Equipment',
    },
  ],
}
