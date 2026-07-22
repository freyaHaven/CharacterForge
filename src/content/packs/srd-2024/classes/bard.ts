import type { ClassDefinition } from '../../../../domain/class/types'
import { createAsiChoiceDefinition } from '../../../../domain/class/abilityScoreImprovement'
import { createEpicBoonChoiceDefinition } from '../../../../domain/class/epicBoon'
import { subclassToChoiceOption } from '../../../../domain/class/subclassDefinition'
import { SKILL_IDS, SKILL_LABELS } from '../../../../domain/skills/types'
import {
  MUSICAL_INSTRUMENT_IDS,
  MUSICAL_INSTRUMENT_LABELS,
} from '../../../../domain/tools/types'
import { createCompleteClassPackageOrGoldStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { BARD_PACKAGE_A } from '../equipment/packages'
import { SRD_2024_SOURCE } from '../source'
import {
  bardSpellcastingSrd2024,
  wordsOfCreationEntitlement,
} from '../spellcasting/bard'
import { collegeOfLoreSrd2024 } from '../subclasses/college-of-lore'
import { BARDIC_INSPIRATION_DIE_BY_LEVEL } from '../../../../domain/spell/progressions'

function formatBardicInspirationDieTable(): string {
  const lines = BARDIC_INSPIRATION_DIE_BY_LEVEL.map(
    (faces, index) => `Level ${index + 1}: d${faces}`,
  )
  return lines.join('; ')
}

const EXPERTISE_OPTIONS = SKILL_IDS.map((skillId) => ({
  id: skillId,
  label: SKILL_LABELS[skillId],
  effects: [{ kind: 'skill-expertise' as const, skillId }],
}))

export const bardSrd2024: ClassDefinition = {
  id: 'srd-2024:bard',
  editionId: 'srd-2024',
  name: 'Bard',
  description:
    'An inspiring magician whose power echoes the music of creation, weaving magic through word, song, and performance.',
  source: SRD_2024_SOURCE,
  catalogOrder: 11,
  hitDie: { sides: 8 },
  primaryAbilities: ['charisma'],
  multiclassPrerequisite: {
    kind: 'all-of',
    abilities: ['charisma'],
    minimum: 13,
    summary: 'Charisma 13',
  },
  savingThrows: ['dexterity', 'charisma'],
  spellcasting: bardSpellcastingSrd2024,
  proficiencies: {
    armor: ['light'],
    weapons: ['simple'],
    tools: [],
    skillOptions: [...SKILL_IDS],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'bardic-inspiration',
          name: 'Bardic Inspiration',
          description:
            `You can supernaturally inspire others through words, music, or dance. This inspiration is represented by your Bardic Inspiration die, which begins as a d6 (Bardic Inspiration die by level: ${formatBardicInspirationDieTable()}).\nUsing Bardic Inspiration. As a Bonus Action, you can inspire another creature within 60 feet of yourself who can see or hear you. That creature gains one of your Bardic Inspiration dice. A creature can have only one Bardic Inspiration die at a time.\nOnce within the next hour when the creature fails a D20 Test, the creature can roll the Bardic Inspiration die and add the number rolled to the d20, potentially turning the failure into a success. A Bardic Inspiration die is expended when it's rolled.\nNumber of Uses. You can confer a Bardic Inspiration die a number of times equal to your Charisma modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.\nAt Higher Levels. Your Bardic Inspiration die changes when you reach certain Bard levels, as shown in the Bardic Die column of the Bard Features table.\nCharacter Forge records this feature and die size only — it does not track expended uses or apply rolls during play.`,
        },
        {
          id: 'spellcasting',
          name: 'Spellcasting',
          description:
            'You have learned to cast spells through your bardic arts. See "Spells" for the rules on spellcasting.\nCantrips. You know two cantrips of your choice from the Bard spell list. Dancing Lights and Vicious Mockery are recommended.\nWhenever you gain a Bard level, you can replace one of your cantrips with another cantrip of your choice from the Bard spell list.\nWhen you reach Bard levels 4 and 10, you learn another cantrip of your choice from the Bard spell list, as shown in the Cantrips column of the Bard Features table.\nSpell Slots. The Bard Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 spells from the Bard spell list. Charm Person, Color Spray, Dissonant Whispers, and Healing Word are recommended.\nThe number of spells on your list increases as you gain Bard levels, as shown in the Prepared Spells column of the Bard Features table. Whenever that number increases, choose additional spells from the Bard spell list until the number of spells on your list matches the number on the table. The chosen spells must be of a level for which you have spell slots.\nIf another Bard feature gives you spells that you always have prepared, those spells don\'t count against the number of spells you can prepare with this feature, but those spells otherwise count as Bard spells for you.\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells there with other Bard spells for which you have spell slots.\nSpellcasting Ability. Charisma is your spellcasting ability for your Bard spells.\nSpellcasting Focus. You can use a Musical Instrument as a Spellcasting Focus for your Bard spells.',
        },
      ],
    },
    {
      level: 2,
      features: [
        {
          id: 'expertise',
          name: 'Expertise',
          description:
            'You gain Expertise in two of your skill proficiencies of your choice. Performance and Persuasion are recommended if you have proficiency in them.\nAt Bard level 9, you gain Expertise in two more of your skill proficiencies of your choice.',
        },
        {
          id: 'jack-of-all-trades',
          name: 'Jack of All Trades',
          description:
            'You can add half your Proficiency Bonus (round down) to any ability check you make that uses a skill proficiency you lack and that doesn\'t otherwise use your Proficiency Bonus.',
          effects: [{ kind: 'jack-of-all-trades' }],
        },
      ],
    },
    {
      level: 3,
      features: [
        {
          id: 'bard-subclass',
          name: 'Bard Subclass',
          description:
            'You gain a Bard subclass of your choice. The College of Lore subclass is detailed in the SRD. A subclass is a specialization that grants you features at certain Bard levels. For the rest of your career, you gain each of your subclass features that are of your Bard level or lower.',
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
          id: 'font-of-inspiration',
          name: 'Font of Inspiration',
          description:
            'You now regain all your expended uses of Bardic Inspiration when you finish a Short or Long Rest.\nIn addition, you can expend a spell slot (no action required) to regain one expended use of Bardic Inspiration.',
        },
      ],
    },
    {
      level: 6,
      features: [
        {
          id: 'bard-subclass-feature-6',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Bard subclass.',
        },
      ],
    },
    {
      level: 7,
      features: [
        {
          id: 'countercharm',
          name: 'Countercharm',
          description:
            'You can use musical notes or words of power to disrupt mind-influencing effects. If you or a creature within 30 feet of you fails a saving throw against an effect that applies the Charmed or Frightened condition, you can take a Reaction to cause the save to be rerolled, and the new roll has Advantage.',
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
          id: 'expertise-9',
          name: 'Expertise',
          description:
            'You gain Expertise in two more of your skill proficiencies of your choice.',
        },
      ],
    },
    {
      level: 10,
      features: [
        {
          id: 'magical-secrets',
          name: 'Magical Secrets',
          description:
            'You\'ve learned secrets from various magical traditions. Whenever you reach a Bard level (including this level) and the Prepared Spells number in the Bard Features table increases, you can choose any of your new prepared spells from the Bard, Cleric, Druid, and Wizard spell lists, and the chosen spells count as Bard spells for you. In addition, whenever you replace a spell prepared for this class, you can replace it with a spell from those lists. Your prepared spell budget is unchanged — Magical Secrets expands which lists you may draw from.',
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
          id: 'bard-subclass-feature-14',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Bard subclass.',
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
          id: 'superior-inspiration',
          name: 'Superior Inspiration',
          description:
            'When you roll Initiative, you regain expended uses of Bardic Inspiration until you have two if you have fewer than that.',
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
          id: 'words-of-creation',
          name: 'Words of Creation',
          description:
            'You have mastered two of the Words of Creation: the words of life and death. You therefore always have the Power Word Heal and Power Word Kill spells prepared. When you cast either spell, you can target a second creature with it if that creature is within 10 feet of the first target.',
          spellEntitlements: [wordsOfCreationEntitlement],
        },
      ],
    },
  ],
  choices: [
    {
      id: 'skill-proficiencies',
      level: 1,
      prompt: 'Choose three skill proficiencies',
      type: 'multi-select',
      required: true,
      min: 3,
      max: 3,
      options: SKILL_IDS.map((skillId) => ({
        id: skillId,
        label: SKILL_LABELS[skillId],
        effects: [{ kind: 'skill-proficiency', skillId }],
      })),
    },
    {
      id: 'musical-instruments',
      level: 1,
      prompt: 'Choose three Musical Instruments',
      type: 'multi-select',
      required: true,
      min: 3,
      max: 3,
      options: MUSICAL_INSTRUMENT_IDS.map((toolId) => ({
        id: toolId,
        label: MUSICAL_INSTRUMENT_LABELS[toolId],
        effects: [
          {
            kind: 'tool-proficiency' as const,
            toolId,
            label: MUSICAL_INSTRUMENT_LABELS[toolId],
          },
        ],
      })),
    },
    {
      id: 'expertise',
      level: 2,
      prompt: 'Choose two skills for Expertise',
      type: 'multi-select',
      required: true,
      min: 2,
      max: 2,
      options: EXPERTISE_OPTIONS,
    },
    {
      id: 'bard-subclass',
      level: 3,
      prompt: 'Choose a Bard Subclass',
      type: 'single-select',
      required: true,
      options: [subclassToChoiceOption(collegeOfLoreSrd2024)],
    },
    {
      id: 'lore-bonus-proficiencies',
      level: 3,
      prompt: 'Choose three bonus skill proficiencies (College of Lore)',
      type: 'multi-select',
      required: true,
      min: 3,
      max: 3,
      availableWhen: {
        choiceId: 'bard-subclass',
        optionId: 'college-of-lore',
      },
      options: SKILL_IDS.map((skillId) => ({
        id: skillId,
        label: SKILL_LABELS[skillId],
        effects: [{ kind: 'skill-proficiency', skillId }],
      })),
    },
    {
      id: 'expertise-9',
      level: 9,
      prompt: 'Choose two more skills for Expertise',
      type: 'multi-select',
      required: true,
      min: 2,
      max: 2,
      options: EXPERTISE_OPTIONS,
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
    items: BARD_PACKAGE_A,
    goldPieces: 90,
    packageEntitlements: [
      {
        type: 'choose-items',
        id: 'musical-instrument',
        label: 'Choose a Musical Instrument',
        count: 1,
        catalogueFilter: { kind: 'tags', tags: ['musical-instrument'] },
      },
    ],
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
