import type { ClassDefinition } from '../../../../domain/class/types'
import { createAsiChoiceDefinition } from '../../../../domain/class/abilityScoreImprovement'
import { subclassToChoiceOption } from '../../../../domain/class/subclassDefinition'
import type { SkillId } from '../../../../domain/skills/types'
import { SKILL_LABELS } from '../../../../domain/skills/types'
import { createArtisanOrInstrumentToolOptions } from '../../../../domain/tools/types'
import { createCompleteClassPackageOrGoldStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { MONK_PACKAGE_A } from '../equipment/packages'
import { SRD_2024_SOURCE } from '../source'
import { openHandSrd2024 } from '../subclasses/open-hand'

const MONK_SKILL_OPTIONS = [
  'acrobatics',
  'athletics',
  'history',
  'insight',
  'religion',
  'stealth',
] as const satisfies readonly SkillId[]

export const monkSrd2024: ClassDefinition = {
  id: 'srd-2024:monk',
  editionId: 'srd-2024',
  name: 'Monk',
  description:
    'A master of martial arts who harnesses the power of the body in pursuit of physical and spiritual perfection.',
  source: SRD_2024_SOURCE,
  catalogOrder: 15,
  hitDie: { sides: 8 },
  primaryAbilities: ['dexterity', 'wisdom'],
  savingThrows: ['strength', 'dexterity'],
  proficiencies: {
    armor: [],
    weapons: ['simple', 'martial'],
    tools: [],
    skillOptions: [...MONK_SKILL_OPTIONS],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'martial-arts',
          name: 'Martial Arts',
          description:
            'Your practice of martial arts gives you mastery of combat styles that use your Unarmed Strike and Monk weapons, which are Simple Melee weapons and Martial Melee weapons that have the Light property.\nYou gain the following benefits while you are unarmed or wielding only Monk weapons and you aren\'t wearing armor or wielding a Shield.\nBonus Unarmed Strike. You can make an Unarmed Strike as a Bonus Action.\nMartial Arts Die. You can roll 1d6 in place of the normal damage of your Unarmed Strike or Monk weapons. This die changes as you gain Monk levels, as shown in the Martial Arts column of the Monk Features table.\nDexterous Attacks. You can use your Dexterity modifier instead of your Strength modifier for the attack and damage rolls of your Unarmed Strikes and Monk weapons. In addition, when you use the Grapple or Shove option of your Unarmed Strike, you can use your Dexterity modifier instead of your Strength modifier to determine the save DC.',
        },
        {
          id: 'unarmored-defense',
          name: 'Unarmored Defense',
          description:
            'While you aren\'t wearing armor or wielding a Shield, your base Armor Class equals 10 plus your Dexterity and Wisdom modifiers.',
        },
        {
          id: 'tool-proficiency',
          name: 'Tool Proficiency',
          description:
            'You gain proficiency with one type of Artisan\'s Tools or one Musical Instrument of your choice.',
        },
      ],
    },
    {
      level: 2,
      features: [
        {
          id: 'monks-focus',
          name: 'Monk\'s Focus',
          description:
            'Your focus and martial training allow you to harness a well of extraordinary energy within yourself. This energy is represented by Focus Points. Your Monk level determines the number of points you have, as shown in the Focus Points column of the Monk Features table.\nYou can expend these points to enhance or fuel certain Monk features. You start knowing three such features: Flurry of Blows, Patient Defense, and Step of the Wind, each of which is detailed below.\nWhen you expend a Focus Point, it is unavailable until you finish a Short or Long Rest, at the end of which you regain all your expended points.\nSome features that use Focus Points require your target to make a saving throw. The save DC equals 8 plus your Wisdom modifier and Proficiency Bonus.\nFlurry of Blows. You can expend 1 Focus Point to make two Unarmed Strikes as a Bonus Action.\nPatient Defense. You can take the Disengage action as a Bonus Action. Alternatively, you can expend 1 Focus Point to take both the Disengage and the Dodge actions as a Bonus Action.\nStep of the Wind. You can take the Dash action as a Bonus Action. Alternatively, you can expend 1 Focus Point to take both the Disengage and Dash actions as a Bonus Action, and your jump distance is doubled for the turn.',
        },
        {
          id: 'unarmored-movement',
          name: 'Unarmored Movement',
          description:
            'Your speed increases by 10 feet while you aren\'t wearing armor or wielding a Shield. This bonus increases when you reach certain Monk levels, as shown on the Monk Features table.',
        },
        {
          id: 'uncanny-metabolism',
          name: 'Uncanny Metabolism',
          description:
            'When you roll Initiative, you can regain all expended Focus Points. When you do so, roll your Martial Arts die, and regain a number of Hit Points equal to your Monk level plus the number rolled. Once you use this feature, you can\'t use it again until you finish a Long Rest.',
        },
      ],
    },
    {
      level: 3,
      features: [
        {
          id: 'deflect-attacks',
          name: 'Deflect Attacks',
          description:
            'When an attack roll hits you and its damage includes Bludgeoning, Piercing, or Slashing damage, you can take a Reaction to reduce the attack\'s total damage against you. The reduction equals 1d10 plus your Dexterity modifier and Monk level.\nIf you reduce the damage to 0, you can expend 1 Focus Point to redirect some of the attack\'s force. If you do so, choose a creature you can see within 5 feet of yourself if the attack was a melee attack or a creature you can see within 60 feet of yourself that isn\'t behind Total Cover if the attack was a ranged attack. That creature must succeed on a Dexterity saving throw or take damage equal to two rolls of your Martial Arts die plus your Dexterity modifier. The damage is the same type dealt by the attack.',
        },
        {
          id: 'monk-subclass',
          name: 'Monk Subclass',
          description:
            'You gain a Monk subclass of your choice. The Warrior of the Open Hand subclass is detailed in the SRD. A subclass is a specialization that grants you features at certain Monk levels. For the rest of your career, you gain each of your subclass features that are of your Monk level or lower.',
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
          id: 'slow-fall',
          name: 'Slow Fall',
          description:
            'You can take a Reaction when you fall to reduce any damage you take from the fall by an amount equal to five times your Monk level.',
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
          id: 'stunning-strike',
          name: 'Stunning Strike',
          description:
            'Once per turn when you hit a creature with a Monk weapon or an Unarmed Strike, you can expend 1 Focus Point to attempt a stunning strike. The target must make a Constitution saving throw. On a failed save, the target has the Stunned condition until the start of your next turn. On a successful save, the target\'s Speed is halved until the start of your next turn, and the next attack roll made against the target before then has Advantage.',
        },
        {
          id: 'martial-arts-die-d8',
          name: 'Martial Arts Improvement',
          description:
            'Your Martial Arts die becomes a d8, as shown on the Monk Features table.',
        },
      ],
    },
    {
      level: 6,
      features: [
        {
          id: 'empowered-strikes',
          name: 'Empowered Strikes',
          description:
            'Whenever you deal damage with your Unarmed Strike, it can deal your choice of Force damage or its normal damage type.',
        },
        {
          id: 'monk-subclass-feature-6',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Monk subclass.',
        },
        {
          id: 'unarmored-movement-15',
          name: 'Unarmored Movement Improvement',
          description:
            'Your Unarmored Movement bonus increases to +15 feet, as shown on the Monk Features table.',
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
            'When you\'re subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw and only half damage if you fail. You don\'t benefit from this feature if you have the Incapacitated condition.',
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
          id: 'acrobatic-movement',
          name: 'Acrobatic Movement',
          description:
            'While you aren\'t wearing armor or wielding a Shield, you gain the ability to move along vertical surfaces and across liquids on your turn without falling during the movement.',
        },
      ],
    },
    {
      level: 10,
      features: [
        {
          id: 'heightened-focus',
          name: 'Heightened Focus',
          description:
            'Your Flurry of Blows, Patient Defense, and Step of the Wind gain the following benefits.\nFlurry of Blows. You can expend 1 Focus Point to use Flurry of Blows and make three Unarmed Strikes with it instead of two.\nPatient Defense. When you expend a Focus Point to use Patient Defense, you gain a number of Temporary Hit Points equal to two rolls of your Martial Arts die.\nStep of the Wind. When you expend a Focus Point to use Step of the Wind, you can choose a willing creature within 5 feet of yourself that is Large or smaller. You move the creature with you until the end of your turn. The creature\'s movement doesn\'t provoke Opportunity Attacks.',
        },
        {
          id: 'self-restoration',
          name: 'Self-Restoration',
          description:
            'Through sheer force of will, you can remove one of the following conditions from yourself at the end of each of your turns: Charmed, Frightened, or Poisoned.\nIn addition, forgoing food and drink doesn\'t give you levels of Exhaustion.',
        },
        {
          id: 'unarmored-movement-20',
          name: 'Unarmored Movement Improvement',
          description:
            'Your Unarmored Movement bonus increases to +20 feet, as shown on the Monk Features table.',
        },
      ],
    },
    {
      level: 11,
      features: [
        {
          id: 'monk-subclass-feature-11',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Monk subclass.',
        },
        {
          id: 'martial-arts-die-d10',
          name: 'Martial Arts Improvement',
          description:
            'Your Martial Arts die becomes a d10, as shown on the Monk Features table.',
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
          id: 'deflect-energy',
          name: 'Deflect Energy',
          description:
            'You can now use your Deflect Attacks feature against attacks that deal any damage type, not just Bludgeoning, Piercing, or Slashing.',
        },
      ],
    },
    {
      level: 14,
      features: [
        {
          id: 'disciplined-survivor',
          name: 'Disciplined Survivor',
          description:
            'Your physical and mental discipline grant you proficiency in all saving throws.\nAdditionally, whenever you make a saving throw and fail, you can expend 1 Focus Point to reroll it, and you must use the new roll.',
        },
        {
          id: 'unarmored-movement-25',
          name: 'Unarmored Movement Improvement',
          description:
            'Your Unarmored Movement bonus increases to +25 feet, as shown on the Monk Features table.',
        },
      ],
    },
    {
      level: 15,
      features: [
        {
          id: 'perfect-focus',
          name: 'Perfect Focus',
          description:
            'When you roll Initiative and don\'t use Uncanny Metabolism, you regain expended Focus Points until you have 4 if you have 3 or fewer.',
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
          id: 'monk-subclass-feature-17',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Monk subclass.',
        },
        {
          id: 'martial-arts-die-d12',
          name: 'Martial Arts Improvement',
          description:
            'Your Martial Arts die becomes a d12, as shown on the Monk Features table.',
        },
      ],
    },
    {
      level: 18,
      features: [
        {
          id: 'superior-defense',
          name: 'Superior Defense',
          description:
            'At the start of your turn, you can expend 3 Focus Points to bolster yourself against harm for 1 minute or until you have the Incapacitated condition. During that time, you have Resistance to all damage except Force damage.',
        },
        {
          id: 'unarmored-movement-30',
          name: 'Unarmored Movement Improvement',
          description:
            'Your Unarmored Movement bonus increases to +30 feet, as shown on the Monk Features table.',
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
          id: 'body-and-mind',
          name: 'Body and Mind',
          description:
            'You have developed your body and mind to new heights. Your Dexterity and Wisdom scores increase by 4, to a maximum of 25.',
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
      options: MONK_SKILL_OPTIONS.map((skillId) => ({
        id: skillId,
        label: SKILL_LABELS[skillId],
        effects: [{ kind: 'skill-proficiency', skillId }],
      })),
    },
    {
      id: 'tool-proficiency',
      level: 1,
      prompt: 'Choose Artisan\'s Tools or a Musical Instrument',
      type: 'single-select',
      required: true,
      options: createArtisanOrInstrumentToolOptions(),
    },
    {
      id: 'monk-subclass',
      level: 3,
      prompt: 'Choose a Monk Subclass',
      type: 'single-select',
      required: true,
      options: [subclassToChoiceOption(openHandSrd2024)],
    },
    createAsiChoiceDefinition('ability-score-improvement-4', 4),
    createAsiChoiceDefinition('ability-score-improvement-8', 8),
    createAsiChoiceDefinition('ability-score-improvement-12', 12),
    createAsiChoiceDefinition('ability-score-improvement-16', 16),
  ],
  startingEquipment: createCompleteClassPackageOrGoldStartingEquipment({
    items: MONK_PACKAGE_A,
    goldPieces: 50,
  }),
  deferredRequirements: [
    {
      id: 'starting-equipment',
      level: 1,
      destinationStep: 'equipment',
      label: 'Starting Equipment',
      description: 'Choose starting equipment in Equipment',
    },
    {
      id: 'epic-boon-19',
      level: 19,
      destinationStep: 'ability-scores',
      label: 'Epic Boon',
      description: 'Resolve the level 19 Epic Boon or qualifying feat',
    },
  ],
}
