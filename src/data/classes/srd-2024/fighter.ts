import type { ClassDefinition } from '../../../domain/class/types'
import type { SkillId } from '../../../domain/skills/types'
import { SKILL_LABELS } from '../../../domain/skills/types'
import { SRD_2024_SOURCE } from './source'

const FIGHTER_SKILL_OPTIONS = [
  'acrobatics',
  'animal-handling',
  'athletics',
  'history',
  'insight',
  'intimidation',
  'perception',
  'persuasion',
  'survival',
] as const satisfies readonly SkillId[]

export const fighterSrd2024: ClassDefinition = {
  id: 'srd-2024:fighter',
  editionId: 'srd-2024',
  name: 'Fighter',
  description:
    'A master of martial combat, skilled with a variety of weapons and armor.',
  source: SRD_2024_SOURCE,
  hitDie: { sides: 10 },
  primaryAbilities: ['strength', 'dexterity'],
  savingThrows: ['strength', 'constitution'],
  proficiencies: {
    armor: ['light', 'medium', 'heavy', 'shield'],
    weapons: ['simple', 'martial'],
    tools: [],
    skillOptions: [...FIGHTER_SKILL_OPTIONS],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'fighting-style',
          name: 'Fighting Style',
          description:
            'You have honed your martial prowess and gain a Fighting Style feat of your choice. Defense is recommended. Whenever you gain a Fighter level, you can replace the feat you chose with a different Fighting Style feat.',
        },
        {
          id: 'second-wind',
          name: 'Second Wind',
          description:
            'You have a limited well of physical and mental stamina that you can draw on. As a Bonus Action, you can use it to regain Hit Points equal to 1d10 plus your Fighter level. You can use this feature twice. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest. When you reach certain Fighter levels, you gain more uses of this feature, as shown on the Fighter Features table.',
        },
        {
          id: 'weapon-mastery',
          name: 'Weapon Mastery',
          description:
            'Your training with weapons allows you to use the mastery properties of three kinds of Simple or Martial weapons of your choice. Choose your mastered weapons on the Equipment step. Whenever you finish a Long Rest, you can practice weapon drills and change one of those weapon choices. When you reach certain Fighter levels, you gain the ability to use the mastery properties of more kinds of weapons, as shown on the Fighter Features table.',
        },
      ],
    },
    {
      level: 2,
      features: [
        {
          id: 'action-surge',
          name: 'Action Surge',
          description:
            'You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action, except the Magic action. Once you use this feature, you cannot do so again until you finish a Short or Long Rest. Starting at level 17, you can use it twice before a rest but only once on a turn.',
        },
        {
          id: 'tactical-mind',
          name: 'Tactical Mind',
          description:
            'You have a mind for tactics on and off the battlefield. When you fail an ability check, you can expend a use of your Second Wind to push yourself toward success. Rather than regaining Hit Points, you roll 1d10 and add the number rolled to the ability check, potentially turning it into a success. If the check still fails, this use of Second Wind is not expended.',
        },
      ],
    },
    {
      level: 3,
      features: [
        {
          id: 'fighter-subclass',
          name: 'Fighter Subclass',
          description:
            'You gain a Fighter subclass of your choice. The Champion subclass is detailed in the SRD. A subclass is a specialization that grants you features at certain Fighter levels. For the rest of your career, you gain each of your subclass features that are of your Fighter level or lower.',
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
          id: 'second-wind-uses-3',
          name: 'Second Wind Improvement',
          description:
            'You can use Second Wind three times between Long Rests, as shown on the Fighter Features table.',
        },
        {
          id: 'weapon-mastery-weapons-4',
          name: 'Weapon Mastery Improvement',
          description:
            'You can use the mastery properties of four kinds of Simple or Martial weapons of your choice. Choose your mastered weapons on the Equipment step.',
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
          id: 'tactical-shift',
          name: 'Tactical Shift',
          description:
            'Whenever you activate your Second Wind with a Bonus Action, you can move up to half your Speed without provoking Opportunity Attacks.',
        },
      ],
    },
    {
      level: 6,
      features: [
        {
          id: 'ability-score-improvement-6',
          name: 'Ability Score Improvement',
          description:
            'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.',
        },
      ],
    },
    {
      level: 7,
      features: [
        {
          id: 'fighter-subclass-feature-7',
          name: 'Subclass Feature',
          description:
            'You gain a feature from your Fighter subclass.',
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
          id: 'indomitable',
          name: 'Indomitable',
          description:
            'If you fail a saving throw, you can reroll it with a bonus equal to your Fighter level. You must use the new roll, and you cannot use this feature again until you finish a Long Rest. You can use this feature twice before a Long Rest starting at level 13 and three times before a Long Rest starting at level 17.',
        },
        {
          id: 'tactical-master',
          name: 'Tactical Master',
          description:
            'When you attack with a weapon whose mastery property you can use, you can replace that property with the Push, Sap, or Slow property for that attack.',
        },
      ],
    },
    {
      level: 10,
      features: [
        {
          id: 'fighter-subclass-feature-10',
          name: 'Subclass Feature',
          description:
            'You gain a feature from your Fighter subclass.',
        },
        {
          id: 'second-wind-uses-4',
          name: 'Second Wind Improvement',
          description:
            'You can use Second Wind four times between Long Rests, as shown on the Fighter Features table.',
        },
        {
          id: 'weapon-mastery-weapons-5',
          name: 'Weapon Mastery Improvement',
          description:
            'You can use the mastery properties of five kinds of Simple or Martial weapons of your choice. Choose your mastered weapons on the Equipment step.',
        },
      ],
    },
    {
      level: 11,
      features: [
        {
          id: 'two-extra-attacks',
          name: 'Two Extra Attacks',
          description:
            'You can attack three times instead of once whenever you take the Attack action on your turn.',
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
          id: 'indomitable-uses-2',
          name: 'Indomitable Improvement',
          description:
            'You can use Indomitable twice before a Long Rest.',
        },
        {
          id: 'studied-attacks',
          name: 'Studied Attacks',
          description:
            'You study your opponents and learn from each attack you make. If you make an attack roll against a creature and miss, you have Advantage on your next attack roll against that creature before the end of your next turn.',
        },
      ],
    },
    {
      level: 14,
      features: [
        {
          id: 'ability-score-improvement-14',
          name: 'Ability Score Improvement',
          description:
            'You gain the Ability Score Improvement feat or another feat of your choice for which you qualify.',
        },
      ],
    },
    {
      level: 15,
      features: [
        {
          id: 'fighter-subclass-feature-15',
          name: 'Subclass Feature',
          description:
            'You gain a feature from your Fighter subclass.',
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
          id: 'weapon-mastery-weapons-6',
          name: 'Weapon Mastery Improvement',
          description:
            'You can use the mastery properties of six kinds of Simple or Martial weapons of your choice. Choose your mastered weapons on the Equipment step.',
        },
      ],
    },
    {
      level: 17,
      features: [
        {
          id: 'action-surge-uses-2',
          name: 'Action Surge Improvement',
          description:
            'You can use Action Surge twice before a Short or Long Rest but only once on a turn.',
        },
        {
          id: 'indomitable-uses-3',
          name: 'Indomitable Improvement',
          description:
            'You can use Indomitable three times before a Long Rest.',
        },
      ],
    },
    {
      level: 18,
      features: [
        {
          id: 'fighter-subclass-feature-18',
          name: 'Subclass Feature',
          description:
            'You gain a feature from your Fighter subclass.',
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
            'You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Combat Prowess is recommended.',
        },
      ],
    },
    {
      level: 20,
      features: [
        {
          id: 'three-extra-attacks',
          name: 'Three Extra Attacks',
          description:
            'You can attack four times instead of once whenever you take the Attack action on your turn.',
        },
      ],
    },
  ],
  choices: [
    {
      id: 'fighting-style',
      level: 1,
      prompt: 'Choose a Fighting Style',
      type: 'single-select',
      required: true,
      options: [
        {
          id: 'archery',
          label: 'Archery',
          description:
            'You gain a +2 bonus to attack rolls you make with Ranged weapons.',
          effects: [{ kind: 'fighting-style', styleId: 'archery' }],
        },
        {
          id: 'defense',
          label: 'Defense',
          description:
            'While you are wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.',
          effects: [{ kind: 'fighting-style', styleId: 'defense' }],
        },
        {
          id: 'great-weapon-fighting',
          label: 'Great Weapon Fighting',
          description:
            'When you roll a 1 or 2 on a damage die for an attack with a two-handed or versatile Melee weapon, you can reroll the die.',
          effects: [
            { kind: 'fighting-style', styleId: 'great-weapon-fighting' },
          ],
        },
        {
          id: 'two-weapon-fighting',
          label: 'Two-Weapon Fighting',
          description:
            'When you make an extra attack as a result of using a Light weapon, you can add your ability modifier to the damage of that attack if you are not already adding it to the damage.',
          effects: [
            { kind: 'fighting-style', styleId: 'two-weapon-fighting' },
          ],
        },
      ],
    },
    {
      id: 'skill-proficiencies',
      level: 1,
      prompt: 'Choose two skill proficiencies',
      type: 'multi-select',
      required: true,
      min: 2,
      max: 2,
      options: FIGHTER_SKILL_OPTIONS.map((skillId) => ({
        id: skillId,
        label: SKILL_LABELS[skillId],
        effects: [{ kind: 'skill-proficiency', skillId }],
      })),
    },
    {
      id: 'fighter-subclass',
      level: 3,
      prompt: 'Choose a Fighter Subclass',
      type: 'single-select',
      required: true,
      options: [
        {
          id: 'champion',
          label: 'Champion',
          description:
            'Pursue physical excellence in combat through relentless training and devastating blows.',
        },
      ],
    },
  ],
  deferredRequirements: [
    {
      id: 'weapon-mastery-selection-3',
      level: 1,
      destinationStep: 'equipment',
      label: 'Weapon Mastery',
      description: 'Choose 3 Weapon Masteries in Equipment',
    },
    {
      id: 'starting-equipment',
      level: 1,
      destinationStep: 'equipment',
      label: 'Starting Equipment',
      description: 'Choose starting equipment in Equipment',
    },
    {
      id: 'weapon-mastery-selection-4',
      level: 4,
      destinationStep: 'equipment',
      label: 'Weapon Mastery',
      description: 'Choose 4 Weapon Masteries in Equipment',
    },
    {
      id: 'ability-score-improvement-4',
      level: 4,
      destinationStep: 'ability-scores',
      label: 'Ability Score Improvement',
      description: 'Resolve the level 4 Ability Score Improvement or feat',
    },
    {
      id: 'ability-score-improvement-6',
      level: 6,
      destinationStep: 'ability-scores',
      label: 'Ability Score Improvement',
      description: 'Resolve the level 6 Ability Score Improvement or feat',
    },
    {
      id: 'ability-score-improvement-8',
      level: 8,
      destinationStep: 'ability-scores',
      label: 'Ability Score Improvement',
      description: 'Resolve the level 8 Ability Score Improvement or feat',
    },
    {
      id: 'weapon-mastery-selection-5',
      level: 10,
      destinationStep: 'equipment',
      label: 'Weapon Mastery',
      description: 'Choose 5 Weapon Masteries in Equipment',
    },
    {
      id: 'ability-score-improvement-12',
      level: 12,
      destinationStep: 'ability-scores',
      label: 'Ability Score Improvement',
      description: 'Resolve the level 12 Ability Score Improvement or feat',
    },
    {
      id: 'ability-score-improvement-14',
      level: 14,
      destinationStep: 'ability-scores',
      label: 'Ability Score Improvement',
      description: 'Resolve the level 14 Ability Score Improvement or feat',
    },
    {
      id: 'ability-score-improvement-16',
      level: 16,
      destinationStep: 'ability-scores',
      label: 'Ability Score Improvement',
      description: 'Resolve the level 16 Ability Score Improvement or feat',
    },
    {
      id: 'weapon-mastery-selection-6',
      level: 16,
      destinationStep: 'equipment',
      label: 'Weapon Mastery',
      description: 'Choose 6 Weapon Masteries in Equipment',
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
