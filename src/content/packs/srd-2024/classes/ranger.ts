import type { ClassDefinition } from '../../../../domain/class/types'
import { createAsiChoiceDefinition } from '../../../../domain/class/abilityScoreImprovement'
import { subclassToChoiceOption } from '../../../../domain/class/subclassDefinition'
import type { SkillId } from '../../../../domain/skills/types'
import { SKILL_LABELS } from '../../../../domain/skills/types'
import { WEAPON_IDS } from '../../../../domain/weapons/types'
import {
  formatWeaponMasteryDescription,
  formatWeaponMasteryOptionLabel,
} from '../../../../domain/weapons/mastery'
import { createSimplifiedClassStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { RANGER_PACKAGE_A } from '../equipment/packages'
import { SRD_2024_SOURCE } from '../source'
import {
  druidicWarriorCantripsEntitlement,
  rangerSpellcastingSrd2024,
} from '../spellcasting/ranger'
import { hunterSrd2024 } from '../subclasses/hunter'

const RANGER_SKILL_OPTIONS = [
  'animal-handling',
  'athletics',
  'insight',
  'investigation',
  'nature',
  'perception',
  'stealth',
  'survival',
] as const satisfies readonly SkillId[]

const WEAPON_MASTERY_OPTIONS = WEAPON_IDS.map((weaponId) => ({
  id: weaponId,
  label: formatWeaponMasteryOptionLabel(weaponId),
  description: formatWeaponMasteryDescription(weaponId),
}))

const EXPERTISE_OPTIONS = RANGER_SKILL_OPTIONS.map((skillId) => ({
  id: skillId,
  label: SKILL_LABELS[skillId],
  effects: [{ kind: 'skill-expertise' as const, skillId }],
}))

export const rangerSrd2024: ClassDefinition = {
  id: 'srd-2024:ranger',
  editionId: 'srd-2024',
  name: 'Ranger',
  description:
    'A warrior who combats threats on the edges of civilization, blending martial skill with nature magic.',
  source: SRD_2024_SOURCE,
  catalogOrder: 18,
  hitDie: { sides: 10 },
  primaryAbilities: ['dexterity', 'wisdom'],
  savingThrows: ['strength', 'dexterity'],
  spellcasting: rangerSpellcastingSrd2024,
  proficiencies: {
    armor: ['light', 'medium', 'shield'],
    weapons: ['simple', 'martial'],
    tools: [],
    skillOptions: [...RANGER_SKILL_OPTIONS],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'spellcasting',
          name: 'Spellcasting',
          description:
            'You have learned to channel the magical essence of nature to cast spells. See "Spells" for the rules on spellcasting.\nSpell Slots. The Ranger Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Ranger spells. Cure Wounds and Ensnaring Strike are recommended.\nThe number of spells on your list increases as you gain Ranger levels, as shown in the Prepared Spells column of the Ranger Features table. Whenever that number increases, choose additional Ranger spells until the number of spells on your list matches the number in the Ranger Features table. The chosen spells must be of a level for which you have spell slots.\nIf another Ranger feature gives you spells that you always have prepared, those spells don\'t count against the number of spells you can prepare with this feature, but those spells otherwise count as Ranger spells for you.\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can replace one spell on your list with another Ranger spell for which you have spell slots.\nSpellcasting Ability. Wisdom is your spellcasting ability for your Ranger spells.\nSpellcasting Focus. You can use a Druidic Focus as a Spellcasting Focus for your Ranger spells.',
        },
        {
          id: 'favored-enemy',
          name: 'Favored Enemy',
          description:
            "You always have the Hunter's Mark spell prepared. You can cast it twice without expending a spell slot, and you regain all expended uses of this ability when you finish a Long Rest.\nThe number of times you can cast the spell without a spell slot increases when you reach certain Ranger levels, as shown in the Favored Enemy column of the Ranger Features table.",
        },
        {
          id: 'weapon-mastery',
          name: 'Weapon Mastery',
          description:
            'Your training with weapons allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency, such as Longbows and Shortswords.\nWhenever you finish a Long Rest, you can change the kinds of weapons you chose.',
        },
      ],
    },
    {
      level: 2,
      features: [
        {
          id: 'deft-explorer',
          name: 'Deft Explorer',
          description:
            'Thanks to your travels, you gain the following benefits.\nExpertise. Choose one of your skill proficiencies with which you lack Expertise. You gain Expertise in that skill.\nLanguages. You know two languages of your choice from the language tables in "Character Creation."',
        },
        {
          id: 'fighting-style',
          name: 'Fighting Style',
          description:
            'You gain a Fighting Style feat of your choice. Instead of choosing one of those feats, you can choose the Druidic Warrior option.\nDruidic Warrior. You learn two Druid cantrips of your choice. Guidance and Starry Wisp are recommended. The chosen cantrips count as Ranger spells for you, and Wisdom is your spellcasting ability for them. Whenever you gain a Ranger level, you can replace one of these cantrips with another Druid cantrip.',
        },
      ],
    },
    {
      level: 3,
      features: [
        {
          id: 'ranger-subclass',
          name: 'Ranger Subclass',
          description:
            'You gain a Ranger subclass of your choice. The Hunter subclass is detailed in the SRD. A subclass is a specialization that grants you features at certain Ranger levels. For the rest of your career, you gain each of your subclass features that are of your Ranger level or lower.',
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
          id: 'extra-attack',
          name: 'Extra Attack',
          description:
            'You can attack twice instead of once whenever you take the Attack action on your turn.',
        },
        {
          id: 'favored-enemy-uses-3',
          name: 'Favored Enemy Improvement',
          description:
            "You can cast Hunter's Mark without a spell slot three times between Long Rests, as shown on the Ranger Features table.",
        },
      ],
    },
    {
      level: 6,
      features: [
        {
          id: 'roving',
          name: 'Roving',
          description:
            "Your Speed increases by 10 feet while you aren't wearing Heavy armor. You also have a Climb Speed and a Swim Speed equal to your Speed.",
        },
      ],
    },
    {
      level: 7,
      features: [
        {
          id: 'ranger-subclass-feature-7',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Ranger subclass.',
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
            'Choose two of your skill proficiencies with which you lack Expertise. You gain Expertise in those skills.',
        },
        {
          id: 'favored-enemy-uses-4',
          name: 'Favored Enemy Improvement',
          description:
            "You can cast Hunter's Mark without a spell slot four times between Long Rests, as shown on the Ranger Features table.",
        },
      ],
    },
    {
      level: 10,
      features: [
        {
          id: 'tireless',
          name: 'Tireless',
          description:
            'Primal forces now help fuel you on your journeys, granting you the following benefits.\nTemporary Hit Points. As a Magic action, you can give yourself a number of Temporary Hit Points equal to 1d8 plus your Wisdom modifier (minimum of 1). You can use this action a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.\nDecrease Exhaustion. Whenever you finish a Short Rest, your Exhaustion level, if any, decreases by 1.',
        },
      ],
    },
    {
      level: 11,
      features: [
        {
          id: 'ranger-subclass-feature-11',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Ranger subclass.',
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
          id: 'relentless-hunter',
          name: 'Relentless Hunter',
          description:
            "Taking damage can't break your Concentration on Hunter's Mark.",
        },
        {
          id: 'favored-enemy-uses-5',
          name: 'Favored Enemy Improvement',
          description:
            "You can cast Hunter's Mark without a spell slot five times between Long Rests, as shown on the Ranger Features table.",
        },
      ],
    },
    {
      level: 14,
      features: [
        {
          id: 'natures-veil',
          name: "Nature's Veil",
          description:
            'You invoke spirits of nature to magically hide yourself. As a Bonus Action, you can give yourself the Invisible condition until the end of your next turn.\nYou can use this feature a number of times equal to your Wisdom modifier (minimum of once), and you regain all expended uses when you finish a Long Rest.',
        },
      ],
    },
    {
      level: 15,
      features: [
        {
          id: 'ranger-subclass-feature-15',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Ranger subclass.',
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
          id: 'precise-hunter',
          name: 'Precise Hunter',
          description:
            "You have Advantage on attack rolls against the creature currently marked by your Hunter's Mark.",
        },
        {
          id: 'favored-enemy-uses-6',
          name: 'Favored Enemy Improvement',
          description:
            "You can cast Hunter's Mark without a spell slot six times between Long Rests, as shown on the Ranger Features table.",
        },
      ],
    },
    {
      level: 18,
      features: [
        {
          id: 'feral-senses',
          name: 'Feral Senses',
          description:
            'Your connection to the forces of nature grants you Blindsight with a range of 30 feet.',
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
            'You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Dimensional Travel is recommended.',
        },
      ],
    },
    {
      level: 20,
      features: [
        {
          id: 'foe-slayer',
          name: 'Foe Slayer',
          description:
            "The damage die of your Hunter's Mark is a d10 rather than a d6.",
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
      options: RANGER_SKILL_OPTIONS.map((skillId) => ({
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
      id: 'fighting-style',
      level: 2,
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
          id: 'two-weapon-fighting',
          label: 'Two-Weapon Fighting',
          description:
            'When you make an extra attack as a result of using a Light weapon, you can add your ability modifier to the damage of that attack if you are not already adding it to the damage.',
          effects: [
            { kind: 'fighting-style', styleId: 'two-weapon-fighting' },
          ],
        },
        {
          id: 'druidic-warrior',
          label: 'Druidic Warrior',
          description:
            'You learn two Druid cantrips of your choice. Guidance and Starry Wisp are recommended. The chosen cantrips count as Ranger spells for you, and Wisdom is your spellcasting ability for them. Whenever you gain a Ranger level, you can replace one of these cantrips with another Druid cantrip.',
          effects: [{ kind: 'fighting-style', styleId: 'druidic-warrior' }],
          spellEntitlements: [druidicWarriorCantripsEntitlement],
        },
      ],
    },
    {
      id: 'expertise',
      level: 2,
      prompt: 'Choose one skill for Expertise',
      type: 'multi-select',
      required: true,
      min: 1,
      max: 1,
      options: EXPERTISE_OPTIONS,
    },
    {
      id: 'ranger-subclass',
      level: 3,
      prompt: 'Choose a Ranger Subclass',
      type: 'single-select',
      required: true,
      options: [subclassToChoiceOption(hunterSrd2024)],
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
  ],
  startingEquipment: createSimplifiedClassStartingEquipment({
    packageLabel: 'Package A',
    items: RANGER_PACKAGE_A,
    goldPieces: 150,
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
