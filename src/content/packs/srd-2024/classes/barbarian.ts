import type { ClassDefinition } from '../../../../domain/class/types'
import { createAsiChoiceDefinition } from '../../../../domain/class/abilityScoreImprovement'
import { createEpicBoonChoiceDefinition } from '../../../../domain/class/epicBoon'
import { subclassToChoiceOption } from '../../../../domain/class/subclassDefinition'
import type { SkillId } from '../../../../domain/skills/types'
import { SKILL_LABELS } from '../../../../domain/skills/types'
import { MELEE_WEAPON_IDS } from '../../../../domain/weapons/types'
import {
  formatWeaponMasteryDescription,
  formatWeaponMasteryOptionLabel,
} from '../../../../domain/weapons/mastery'
import { createCompleteClassPackageOrGoldStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { BARBARIAN_PACKAGE_A } from '../equipment/packages'
import { SRD_2024_SOURCE } from '../source'
import { berserkerSrd2024 } from '../subclasses/berserker'

const BARBARIAN_SKILL_OPTIONS = [
  'animal-handling',
  'athletics',
  'intimidation',
  'nature',
  'perception',
  'survival',
] as const satisfies readonly SkillId[]

const WEAPON_MASTERY_OPTIONS = MELEE_WEAPON_IDS.map((weaponId) => ({
  id: weaponId,
  label: formatWeaponMasteryOptionLabel(weaponId),
  description: formatWeaponMasteryDescription(weaponId),
}))

export const barbarianSrd2024: ClassDefinition = {
  id: 'srd-2024:barbarian',
  editionId: 'srd-2024',
  name: 'Barbarian',
  description:
    'A fierce warrior who can enter a battle rage and shrug off deadly blows.',
  source: SRD_2024_SOURCE,
  hitDie: { sides: 12 },
  primaryAbilities: ['strength'],
  savingThrows: ['strength', 'constitution'],
  proficiencies: {
    armor: ['light', 'medium', 'shield'],
    weapons: ['simple', 'martial'],
    tools: [],
    skillOptions: [...BARBARIAN_SKILL_OPTIONS],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'rage',
          name: 'Rage',
          description:
            'You can imbue yourself with a primal power called Rage, a force that grants you extraordinary might and resilience. You can enter it as a Bonus Action if you aren\'t wearing Heavy armor.\nYou can enter your Rage the number of times shown for your Barbarian level in the Rages column of the Barbarian Features table. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest.\nWhile active, your Rage follows the rules below.\nDamage Resistance. You have Resistance to Bludgeoning, Piercing, and Slashing damage.\nRage Damage. When you make an attack using Strength—with either a weapon or an Unarmed Strike—and deal damage to the target, you gain a bonus to the damage that increases as you gain levels as a Barbarian, as shown in the Rage Damage column of the Barbarian Features table.\nStrength Advantage. You have Advantage on Strength checks and Strength saving throws.\nNo Concentration or Spells. You can\'t maintain Concentration, and you can\'t cast spells.\nDuration. The Rage lasts until the end of your next turn, and it ends early if you don Heavy armor or have the Incapacitated condition. If your Rage is still active on your next turn, you can extend the Rage for another round by doing one of the following: make an attack roll against an enemy; force an enemy to make a saving throw; or take a Bonus Action to extend your Rage. Each time the Rage is extended, it lasts until the end of your next turn. You can maintain a Rage for up to 10 minutes.',
        },
        {
          id: 'unarmored-defense',
          name: 'Unarmored Defense',
          description:
            'While you aren\'t wearing any armor, your base Armor Class equals 10 plus your Dexterity and Constitution modifiers. You can use a Shield and still gain this benefit.',
        },
        {
          id: 'weapon-mastery',
          name: 'Weapon Mastery',
          description:
            'Your training with weapons allows you to use the mastery properties of two kinds of Simple or Martial Melee weapons of your choice, such as Greataxes and Handaxes. Whenever you finish a Long Rest, you can practice weapon drills and change one of those weapon choices. When you reach certain Barbarian levels, you gain the ability to use the mastery properties of more kinds of weapons, as shown in the Weapon Mastery column of the Barbarian Features table.',
        },
      ],
    },
    {
      level: 2,
      features: [
        {
          id: 'danger-sense',
          name: 'Danger Sense',
          description:
            'You gain an uncanny sense of when things aren\'t as they should be, giving you an edge when you dodge perils. You have Advantage on Dexterity saving throws unless you have the Incapacitated condition.',
        },
        {
          id: 'reckless-attack',
          name: 'Reckless Attack',
          description:
            'You can throw aside all concern for defense to attack with increased ferocity. When you make your first attack roll on your turn, you can decide to attack recklessly. Doing so gives you Advantage on attack rolls using Strength until the start of your next turn, but attack rolls against you have Advantage during that time.',
        },
      ],
    },
    {
      level: 3,
      features: [
        {
          id: 'barbarian-subclass',
          name: 'Barbarian Subclass',
          description:
            'You gain a Barbarian subclass of your choice. The Path of the Berserker subclass is detailed in the SRD. A subclass is a specialization that grants you features at certain Barbarian levels. For the rest of your career, you gain each of your subclass features that are of your Barbarian level or lower.',
        },
        {
          id: 'primal-knowledge',
          name: 'Primal Knowledge',
          description:
            'You gain proficiency in another skill of your choice from the skill list available to Barbarians at level 1.\nIn addition, while your Rage is active, you can channel primal power when you attempt certain tasks; whenever you make an ability check using one of the following skills, you can make it as a Strength check even if it normally uses a different ability: Acrobatics, Intimidation, Perception, Stealth, or Survival. When you use this ability, your Strength represents primal power coursing through you, honing your agility, bearing, and senses.',
        },
        {
          id: 'rage-uses-3',
          name: 'Rage Improvement',
          description:
            'You can enter your Rage three times, as shown on the Barbarian Features table.',
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
        {
          id: 'weapon-mastery-weapons-3',
          name: 'Weapon Mastery (Additional)',
          description:
            'You can use the mastery properties of three kinds of Simple or Martial Melee weapons of your choice.',
        },
      ],
    },
    {
      level: 5,
      features: [
        {
          id: 'extra-attack',
          name: 'Extra Attack',
          description:
            'You can attack twice instead of once whenever you take the Attack action on your turn.',
        },
        {
          id: 'fast-movement',
          name: 'Fast Movement',
          description:
            'Your speed increases by 10 feet while you aren\'t wearing Heavy armor.',
        },
      ],
    },
    {
      level: 6,
      features: [
        {
          id: 'barbarian-subclass-feature-6',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Barbarian subclass.',
        },
        {
          id: 'rage-uses-4',
          name: 'Rage Improvement',
          description:
            'You can enter your Rage four times, as shown on the Barbarian Features table.',
        },
      ],
    },
    {
      level: 7,
      features: [
        {
          id: 'feral-instinct',
          name: 'Feral Instinct',
          description:
            'Your instincts are so honed that you have Advantage on Initiative rolls.',
        },
        {
          id: 'instinctive-pounce',
          name: 'Instinctive Pounce',
          description:
            'As part of the Bonus Action you take to enter your Rage, you can move up to half your Speed.',
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
          id: 'brutal-strike',
          name: 'Brutal Strike',
          description:
            'If you use Reckless Attack, you can forgo any Advantage on one Strength-based attack roll of your choice on your turn. The chosen attack roll mustn\'t have Disadvantage. If the chosen attack roll hits, the target takes an extra 1d10 damage of the same type dealt by the weapon or Unarmed Strike, and you can cause one Brutal Strike effect of your choice. You have the following effect options.\nForceful Blow. The target is pushed 15 feet straight away from you. You can then move up to half your Speed straight toward the target without provoking Opportunity Attacks.\nHamstring Blow. The target\'s Speed is reduced by 15 feet until the start of your next turn. A target can be affected by only one Hamstring Blow at a time — the most recent one.',
        },
        {
          id: 'rage-damage-3',
          name: 'Rage Damage Improvement',
          description:
            'Your Rage Damage bonus increases to +3, as shown on the Barbarian Features table.',
        },
      ],
    },
    {
      level: 10,
      features: [
        {
          id: 'barbarian-subclass-feature-10',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Barbarian subclass.',
        },
        {
          id: 'weapon-mastery-weapons-4',
          name: 'Weapon Mastery (Additional)',
          description:
            'You can use the mastery properties of four kinds of Simple or Martial Melee weapons of your choice.',
        },
      ],
    },
    {
      level: 11,
      features: [
        {
          id: 'relentless-rage',
          name: 'Relentless Rage',
          description:
            'Your Rage can keep you fighting despite grievous wounds. If you drop to 0 Hit Points while your Rage is active and don\'t die outright, you can make a DC 10 Constitution saving throw. If you succeed, your Hit Points instead change to a number equal to twice your Barbarian level.\nEach time you use this feature after the first, the DC increases by 5. When you finish a Short or Long Rest, the DC resets to 10.',
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
        {
          id: 'rage-uses-5',
          name: 'Rage Improvement',
          description:
            'You can enter your Rage five times, as shown on the Barbarian Features table.',
        },
      ],
    },
    {
      level: 13,
      features: [
        {
          id: 'improved-brutal-strike-13',
          name: 'Improved Brutal Strike',
          description:
            'You have honed new ways to attack furiously. The following effects are now among your Brutal Strike options.\nStaggering Blow. The target has Disadvantage on the next saving throw it makes, and it can\'t make Opportunity Attacks until the start of your next turn.\nSundering Blow. Before the start of your next turn, the next attack roll made by another creature against the target gains a +5 bonus to the roll. An attack roll can gain only one Sundering Blow bonus.',
        },
      ],
    },
    {
      level: 14,
      features: [
        {
          id: 'barbarian-subclass-feature-14',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Barbarian subclass.',
        },
      ],
    },
    {
      level: 15,
      features: [
        {
          id: 'persistent-rage',
          name: 'Persistent Rage',
          description:
            'When you roll Initiative, you can regain all expended uses of Rage. After you regain uses of Rage in this way, you can\'t do so again until you finish a Long Rest.\nIn addition, your Rage is so fierce that it now lasts for 10 minutes without you needing to do anything to extend it from round to round. Your Rage ends early if you have the Unconscious condition (not just the Incapacitated condition) or don Heavy armor.',
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
        {
          id: 'rage-damage-4',
          name: 'Rage Damage Improvement',
          description:
            'Your Rage Damage bonus increases to +4, as shown on the Barbarian Features table.',
        },
      ],
    },
    {
      level: 17,
      features: [
        {
          id: 'improved-brutal-strike-17',
          name: 'Improved Brutal Strike',
          description:
            'The extra damage of your Brutal Strike increases to 2d10. In addition, you can use two different Brutal Strike effects whenever you use your Brutal Strike feature.',
        },
        {
          id: 'rage-uses-6',
          name: 'Rage Improvement',
          description:
            'You can enter your Rage six times, as shown on the Barbarian Features table.',
        },
      ],
    },
    {
      level: 18,
      features: [
        {
          id: 'indomitable-might',
          name: 'Indomitable Might',
          description:
            'If your total for a Strength check or Strength saving throw is less than your Strength score, you can use that score in place of the total.',
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
            'You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Irresistible Offense is recommended.',
        },
      ],
    },
    {
      level: 20,
      features: [
        {
          id: 'primal-champion',
          name: 'Primal Champion',
          description:
            'You embody primal power. Your Strength and Constitution scores increase by 4, to a maximum of 25.',
        },
      ],
    },
  ],
  choices: [
    {
      id: 'skill-proficiencies',
      level: 1,
      prompt: 'Choose two skill proficiencies',
      type: 'multi-select',
      required: true,
      min: 2,
      max: 2,
      options: BARBARIAN_SKILL_OPTIONS.map((skillId) => ({
        id: skillId,
        label: SKILL_LABELS[skillId],
        effects: [{ kind: 'skill-proficiency', skillId }],
      })),
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
      id: 'weapon-mastery-weapons-3',
      level: 4,
      prompt: 'Choose 1 additional weapon mastery',
      type: 'multi-select',
      required: true,
      min: 1,
      max: 1,
      options: WEAPON_MASTERY_OPTIONS,
    },
    {
      id: 'weapon-mastery-weapons-4',
      level: 10,
      prompt: 'Choose 1 additional weapon mastery',
      type: 'multi-select',
      required: true,
      min: 1,
      max: 1,
      options: WEAPON_MASTERY_OPTIONS,
    },
    {
      id: 'barbarian-subclass',
      level: 3,
      prompt: 'Choose a Barbarian Subclass',
      type: 'single-select',
      required: true,
      options: [subclassToChoiceOption(berserkerSrd2024)],
    },
    {
      id: 'primal-knowledge',
      level: 3,
      prompt: 'Choose one additional skill proficiency',
      type: 'multi-select',
      required: true,
      min: 1,
      max: 1,
      options: BARBARIAN_SKILL_OPTIONS.map((skillId) => ({
        id: skillId,
        label: SKILL_LABELS[skillId],
        effects: [{ kind: 'skill-proficiency', skillId }],
      })),
    },
    createAsiChoiceDefinition('ability-score-improvement-4', 4),
    createAsiChoiceDefinition('ability-score-improvement-8', 8),
    createAsiChoiceDefinition('ability-score-improvement-12', 12),
    createAsiChoiceDefinition('ability-score-improvement-16', 16),
    createEpicBoonChoiceDefinition({
      recommendedFeatId: 'srd-2024:boon-of-irresistible-offense',
    }),
  ],
  startingEquipment: createCompleteClassPackageOrGoldStartingEquipment({
    items: BARBARIAN_PACKAGE_A,
    goldPieces: 75,
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
