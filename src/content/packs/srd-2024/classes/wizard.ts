import type { ClassDefinition } from '../../../../domain/class/types'
import { createAsiChoiceDefinition } from '../../../../domain/class/abilityScoreImprovement'
import { createEpicBoonChoiceDefinition } from '../../../../domain/class/epicBoon'
import { subclassToChoiceOption } from '../../../../domain/class/subclassDefinition'
import type { SkillId } from '../../../../domain/skills/types'
import { SKILL_LABELS } from '../../../../domain/skills/types'
import { createCompleteClassPackageOrGoldStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { WIZARD_PACKAGE_A } from '../equipment/packages'
import { SRD_2024_SOURCE } from '../source'
import { wizardSpellcastingSrd2024 } from '../spellcasting/wizard'
import { evokerSrd2024 } from '../subclasses/evoker'

const WIZARD_SKILL_OPTIONS = [
  'arcana',
  'history',
  'insight',
  'investigation',
  'medicine',
  'nature',
  'religion',
] as const satisfies readonly SkillId[]

const SCHOLAR_SKILL_OPTIONS = [
  'arcana',
  'history',
  'investigation',
  'medicine',
  'nature',
  'religion',
] as const satisfies readonly SkillId[]

export const wizardSrd2024: ClassDefinition = {
  id: 'srd-2024:wizard',
  editionId: 'srd-2024',
  name: 'Wizard',
  description:
    'A scholarly magic-user capable of manipulating the structures of reality through rigorous study of arcane formulae.',
  source: SRD_2024_SOURCE,
  catalogOrder: 24,
  hitDie: { sides: 6 },
  primaryAbilities: ['intelligence'],
  multiclassPrerequisite: {
    kind: 'all-of',
    abilities: ['intelligence'],
    minimum: 13,
    summary: 'Intelligence 13',
  },
  savingThrows: ['intelligence', 'wisdom'],
  spellcasting: wizardSpellcastingSrd2024,
  proficiencies: {
    armor: [],
    weapons: ['simple'],
    tools: [],
    skillOptions: [...WIZARD_SKILL_OPTIONS],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'spellcasting',
          name: 'Spellcasting',
          description:
            'You have learned to cast spells through study of arcane magic. See "Spells" for the rules on spellcasting.\nCantrips. You know three cantrips of your choice from the Wizard spell list. Light, Mage Hand, and Ray of Frost are recommended.\nWhenever you gain a Wizard level, you can replace one of your cantrips with another cantrip of your choice from the Wizard spell list.\nWhen you reach Wizard levels 4 and 10, you learn another cantrip of your choice from the Wizard spell list, as shown in the Cantrips column of the Wizard Features table.\nSpellbook. Your wizardly apprenticeship culminated in the creation of a unique book: your spellbook. It is a Tiny object that weighs 3 pounds. The book contains the level 1+ spells you know. It starts with six level 1 Wizard spells of your choice. Detect Magic, Feather Fall, Mage Armor, Magic Missile, Sleep, and Thunderwave are recommended.\nWhenever you gain a Wizard level after 1, add two Wizard spells of your choice to your spellbook. Each of these spells must be of a level for which you have spell slots.\nSpell Slots. The Wizard Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 spells from your spellbook. The number of spells on your list increases as you gain Wizard levels, as shown in the Prepared Spells column of the Wizard Features table. The chosen spells must be of a level for which you have spell slots and must be in your spellbook.\nIf another Wizard feature gives you spells that you always have prepared, those spells don\'t count against the number of spells you can prepare with this feature.\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells there with other spells from your spellbook for which you have spell slots.\nSpellcasting Ability. Intelligence is your spellcasting ability for your Wizard spells.\nSpellcasting Focus. You can use an Arcane Focus as a Spellcasting Focus for your Wizard spells.',
        },
        {
          id: 'ritual-adept',
          name: 'Ritual Adept',
          description:
            'You can cast any spell as a Ritual if that spell has the Ritual tag and the spell is in your spellbook. You needn\'t have the spell prepared, but you must read from the book to cast a spell in this way.',
        },
        {
          id: 'arcane-recovery',
          name: 'Arcane Recovery',
          description:
            'You can regain some of your magical energy by studying your spellbook. When you finish a Short Rest, you can choose expended spell slots to recover. The spell slots can have a combined level equal to no more than half your Wizard level (round up), and none of the slots can be level 6 or higher. For example, if you\'re a level 4 Wizard, you can recover up to two levels worth of spell slots, regenerating either a level 2 slot or two level 1 slots.\nOnce you use this feature, you can\'t do so again until you finish a Long Rest.',
        },
      ],
    },
    {
      level: 2,
      features: [
        {
          id: 'scholar',
          name: 'Scholar',
          description:
            'While studying magic, you also specialized in an academic field of study. Choose one of the following skills in which you have proficiency: Arcana, History, Investigation, Medicine, Nature, or Religion. You have Expertise in the chosen skill.',
        },
      ],
    },
    {
      level: 3,
      features: [
        {
          id: 'wizard-subclass',
          name: 'Wizard Subclass',
          description:
            'You gain a Wizard subclass of your choice. The Evoker subclass is detailed in the SRD. A subclass is a specialization that grants you features at certain Wizard levels. For the rest of your career, you gain each of your subclass features that are of your Wizard level or lower.',
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
          id: 'memorize-spell',
          name: 'Memorize Spell',
          description:
            'Whenever you finish a Short Rest, you can study your spellbook and replace one spell of level 1+ you have prepared for this class with another spell of the same level from your spellbook.',
        },
      ],
    },
    {
      level: 6,
      features: [
        {
          id: 'wizard-subclass-feature-6',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Wizard subclass.',
        },
      ],
    },
    {
      level: 7,
      features: [],
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
          id: 'wizard-subclass-feature-10',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Wizard subclass.',
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
          id: 'wizard-subclass-feature-14',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Wizard subclass.',
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
      features: [],
    },
    {
      level: 18,
      features: [
        {
          id: 'spell-mastery',
          name: 'Spell Mastery',
          description:
            'You have achieved such mastery over certain spells that you can cast them at will. Choose a level 1 and a level 2 spell in your spellbook that have a casting time of an Action. You always have those spells prepared, and you can cast them at their lowest level without expending a spell slot. To cast either spell with a higher-level slot, you must expend a spell slot.\nWhenever you finish a Long Rest, you can study your spellbook and replace either of those spells with an eligible spell of the same level from the book.',
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
            'You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Spell Recall is recommended.',
        },
      ],
    },
    {
      level: 20,
      features: [
        {
          id: 'signature-spells',
          name: 'Signature Spells',
          description:
            'Choose two level 3 spells in your spellbook as your signature spells. You always have these spells prepared, and you can cast each of them once at level 3 without expending a spell slot. When you do so, you can\'t cast them in this way again until you finish a Short or Long Rest. To cast either spell with a spell slot, you must expend a slot as normal.',
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
      options: WIZARD_SKILL_OPTIONS.map((skillId) => ({
        id: skillId,
        label: SKILL_LABELS[skillId],
        effects: [{ kind: 'skill-proficiency', skillId }],
      })),
    },
    {
      id: 'scholar',
      level: 2,
      prompt: 'Choose one skill for Scholar (Expertise)',
      type: 'multi-select',
      required: true,
      min: 1,
      max: 1,
      options: SCHOLAR_SKILL_OPTIONS.map((skillId) => ({
        id: skillId,
        label: SKILL_LABELS[skillId],
        effects: [{ kind: 'skill-expertise', skillId }],
      })),
    },
    {
      id: 'wizard-subclass',
      level: 3,
      prompt: 'Choose a Wizard Subclass',
      type: 'single-select',
      required: true,
      options: [subclassToChoiceOption(evokerSrd2024)],
    },
    createAsiChoiceDefinition('ability-score-improvement-4', 4),
    createAsiChoiceDefinition('ability-score-improvement-8', 8),
    createAsiChoiceDefinition('ability-score-improvement-12', 12),
    createAsiChoiceDefinition('ability-score-improvement-16', 16),
    createEpicBoonChoiceDefinition({
      recommendedFeatId: 'srd-2024:boon-of-spell-recall',
    }),
  ],
  startingEquipment: createCompleteClassPackageOrGoldStartingEquipment({
    items: WIZARD_PACKAGE_A,
    goldPieces: 55,
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
