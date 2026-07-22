import type { ClassDefinition } from '../../../../domain/class/types'
import { createAsiChoiceDefinition } from '../../../../domain/class/abilityScoreImprovement'
import { createEpicBoonChoiceDefinition } from '../../../../domain/class/epicBoon'
import { subclassToChoiceOption } from '../../../../domain/class/subclassDefinition'
import type { SkillId } from '../../../../domain/skills/types'
import { SKILL_LABELS } from '../../../../domain/skills/types'
import { createCompleteClassPackageOrGoldStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { CLERIC_PACKAGE_A } from '../equipment/packages'
import { SRD_2024_SOURCE } from '../source'
import {
  clericSpellcastingSrd2024,
  thaumaturgeCantripEntitlement,
} from '../spellcasting/cleric'
import { lifeDomainSrd2024 } from '../subclasses/life-domain'

const CLERIC_SKILL_OPTIONS = [
  'history',
  'insight',
  'medicine',
  'persuasion',
  'religion',
] as const satisfies readonly SkillId[]

export const clericSrd2024: ClassDefinition = {
  id: 'srd-2024:cleric',
  editionId: 'srd-2024',
  name: 'Cleric',
  description:
    'A priestly champion who wields divine magic in service of a higher power.',
  source: SRD_2024_SOURCE,
  catalogOrder: 12,
  hitDie: { sides: 8 },
  primaryAbilities: ['wisdom'],
  multiclassPrerequisite: {
    kind: 'all-of',
    abilities: ['wisdom'],
    minimum: 13,
    summary: 'Wisdom 13',
  },
  savingThrows: ['wisdom', 'charisma'],
  spellcasting: clericSpellcastingSrd2024,
  proficiencies: {
    armor: ['light', 'medium', 'shield'],
    weapons: ['simple'],
    tools: [],
    skillOptions: [...CLERIC_SKILL_OPTIONS],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'spellcasting',
          name: 'Spellcasting',
          description:
            'You have learned to cast spells through prayer and meditation. See "Spells" for the rules on spellcasting.\nCantrips. You know three cantrips of your choice from the Cleric spell list. Guidance, Sacred Flame, and Thaumaturgy are recommended.\nWhenever you gain a Cleric level, you can replace one of your cantrips with another cantrip of your choice from the Cleric spell list.\nWhen you reach Cleric levels 4 and 10, you learn another cantrip of your choice from the Cleric spell list, as shown in the Cantrips column of the Cleric Features table.\nSpell Slots. The Cleric Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 spells from the Cleric spell list. Bless, Cure Wounds, Guiding Bolt, and Shield of Faith are recommended.\nThe number of spells on your list increases as you gain Cleric levels, as shown in the Prepared Spells column of the Cleric Features table. Whenever that number increases, choose additional spells from the Cleric spell list until the number of spells on your list matches the number on the table. The chosen spells must be of a level for which you have spell slots.\nIf another Cleric feature gives you spells that you always have prepared, those spells don\'t count against the number of spells you can prepare with this feature, but those spells otherwise count as Cleric spells for you.\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells there with other Cleric spells for which you have spell slots.\nSpellcasting Ability. Wisdom is your spellcasting ability for your Cleric spells.\nSpellcasting Focus. You can use a Holy Symbol as a Spellcasting Focus for your Cleric spells.',
        },
        {
          id: 'divine-order',
          name: 'Divine Order',
          description:
            'You have dedicated yourself to one of the following sacred roles of your choice.\nProtector. Trained for battle, you gain proficiency with Martial weapons and training with Heavy armor.\nThaumaturge. You know one extra cantrip from the Cleric spell list. In addition, your mystical connection to the divine gives you a bonus to your Intelligence (Arcana or Religion) checks. The bonus equals your Wisdom modifier (minimum of +1).',
        },
      ],
    },
    {
      level: 2,
      features: [
        {
          id: 'channel-divinity',
          name: 'Channel Divinity',
          description:
            'You can channel divine energy directly from the Outer Planes to fuel magical effects. You start with two such effects: Divine Spark and Turn Undead, each of which is described below. Each time you use this class\'s Channel Divinity, choose which Channel Divinity effect from this class to create. You gain additional effect options at higher Cleric levels.\nYou can use this class\'s Channel Divinity twice. You regain one of its expended uses when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest. You gain additional uses when you reach certain Cleric levels, as shown in the Channel Divinity column of the Cleric Features table.\nIf a Channel Divinity effect requires a saving throw, the DC equals the spell save DC from this class\'s Spellcasting feature.\nDivine Spark. As a Magic action, you point your Holy Symbol at another creature you can see within 30 feet of yourself and focus divine energy at it. Roll 1d8 and add your Wisdom modifier. You either restore Hit Points to the creature equal to that total or force the creature to make a Constitution saving throw. On a failed save, the creature takes Necrotic or Radiant damage (your choice) equal to that total. On a successful save, the creature takes half as much damage (round down).\nYou roll an additional d8 when you reach Cleric levels 7 (2d8), 13 (3d8), and 18 (4d8).\nTurn Undead. As a Magic action, you present your Holy Symbol and censure Undead creatures. Each Undead of your choice within 30 feet of you must make a Wisdom saving throw. If the creature fails its save, it has the Frightened and Incapacitated conditions for 1 minute. For that duration, it tries to move as far from you as it can on its turns. This effect ends early on the creature if it takes any damage, if you have the Incapacitated condition, or if you die.',
        },
      ],
    },
    {
      level: 3,
      features: [
        {
          id: 'cleric-subclass',
          name: 'Cleric Subclass',
          description:
            'You gain a Cleric subclass of your choice. The Life Domain subclass is detailed in the SRD. A subclass is a specialization that grants you features at certain Cleric levels. For the rest of your career, you gain each of your subclass features that are of your Cleric level or lower.',
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
          id: 'sear-undead',
          name: 'Sear Undead',
          description:
            'Whenever you use Turn Undead, you can roll a number of d8s equal to your Wisdom modifier (minimum of 1d8) and add the rolls together. Each Undead that fails its saving throw against that use of Turn Undead takes Radiant damage equal to the roll\'s total. This damage doesn\'t end the turn effect.',
        },
      ],
    },
    {
      level: 6,
      features: [
        {
          id: 'cleric-subclass-feature-6',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Cleric subclass.',
        },
        {
          id: 'channel-divinity-uses-3',
          name: 'Channel Divinity Improvement',
          description:
            'You can use Channel Divinity three times between Long Rests, as shown on the Cleric Features table.',
        },
      ],
    },
    {
      level: 7,
      features: [
        {
          id: 'blessed-strikes',
          name: 'Blessed Strikes',
          description:
            'Divine power infuses you in battle. You gain one of the following options of your choice.\nDivine Strike. Once on each of your turns when you hit a creature with an attack roll using a weapon, you can cause the target to take an extra 1d8 Necrotic or Radiant damage (your choice).\nPotent Spellcasting. Add your Wisdom modifier to the damage you deal with any Cleric cantrip.',
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
      features: [],
    },
    {
      level: 10,
      features: [
        {
          id: 'divine-intervention',
          name: 'Divine Intervention',
          description:
            'You can call on your deity or pantheon to intervene on your behalf. As a Magic action, choose any Cleric spell of level 5 or lower that doesn\'t require a Reaction to cast. As part of the same action, you cast that spell without expending a spell slot or needing Material components. You can\'t use this feature again until you finish a Long Rest.',
        },
      ],
    },
    {
      level: 11,
      features: [],
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
      features: [],
    },
    {
      level: 14,
      features: [
        {
          id: 'improved-blessed-strikes',
          name: 'Improved Blessed Strikes',
          description:
            'The option you chose for Blessed Strikes grows more powerful.\nDivine Strike. The extra damage of your Divine Strike increases to 2d8.\nPotent Spellcasting. When you cast a Cleric cantrip and deal damage to a creature with it, you can give vitality to yourself or another creature within 60 feet of yourself, granting a number of Temporary Hit Points equal to twice your Wisdom modifier.',
        },
      ],
    },
    {
      level: 15,
      features: [],
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
          id: 'cleric-subclass-feature-17',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Cleric subclass.',
        },
      ],
    },
    {
      level: 18,
      features: [
        {
          id: 'channel-divinity-uses-4',
          name: 'Channel Divinity Improvement',
          description:
            'You can use Channel Divinity four times between Long Rests, as shown on the Cleric Features table.',
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
            'You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Fate is recommended.',
        },
      ],
    },
    {
      level: 20,
      features: [
        {
          id: 'greater-divine-intervention',
          name: 'Greater Divine Intervention',
          description:
            'You can call on even more powerful divine intervention. When you use your Divine Intervention feature, you can choose Wish when you select a spell. If you do so, you can\'t use Divine Intervention again until you finish 2d4 Long Rests.',
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
      options: CLERIC_SKILL_OPTIONS.map((skillId) => ({
        id: skillId,
        label: SKILL_LABELS[skillId],
        effects: [{ kind: 'skill-proficiency', skillId }],
      })),
    },
    {
      id: 'divine-order',
      level: 1,
      prompt: 'Choose a Divine Order',
      type: 'single-select',
      required: true,
      options: [
        {
          id: 'protector',
          label: 'Protector',
          description:
            'Trained for battle, you gain proficiency with Martial weapons and training with Heavy armor.',
          effects: [
            { kind: 'armor-proficiency', category: 'heavy' },
            { kind: 'weapon-proficiency', category: 'martial' },
          ],
        },
        {
          id: 'thaumaturge',
          label: 'Thaumaturge',
          description:
            'You know one extra cantrip from the Cleric spell list. In addition, your mystical connection to the divine gives you a bonus to your Intelligence (Arcana or Religion) checks equal to your Wisdom modifier (minimum of +1).',
          spellEntitlements: [thaumaturgeCantripEntitlement],
        },
      ],
    },
    {
      id: 'cleric-subclass',
      level: 3,
      prompt: 'Choose a Cleric Subclass',
      type: 'single-select',
      required: true,
      options: [subclassToChoiceOption(lifeDomainSrd2024)],
    },
    {
      id: 'blessed-strikes',
      level: 7,
      prompt: 'Choose a Blessed Strikes option',
      type: 'single-select',
      required: true,
      options: [
        {
          id: 'divine-strike',
          label: 'Divine Strike',
          description:
            'Once on each of your turns when you hit a creature with an attack roll using a weapon, you can cause the target to take an extra 1d8 Necrotic or Radiant damage (your choice).',
        },
        {
          id: 'potent-spellcasting',
          label: 'Potent Spellcasting',
          description:
            'Add your Wisdom modifier to the damage you deal with any Cleric cantrip.',
        },
      ],
    },
    createAsiChoiceDefinition('ability-score-improvement-4', 4),
    createAsiChoiceDefinition('ability-score-improvement-8', 8),
    createAsiChoiceDefinition('ability-score-improvement-12', 12),
    createAsiChoiceDefinition('ability-score-improvement-16', 16),
    createEpicBoonChoiceDefinition({
      recommendedFeatId: 'srd-2024:boon-of-fate',
    }),
  ],
  startingEquipment: createCompleteClassPackageOrGoldStartingEquipment({
    items: CLERIC_PACKAGE_A,
    goldPieces: 110,
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
