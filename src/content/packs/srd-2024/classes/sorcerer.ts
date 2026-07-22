import type { ClassDefinition } from '../../../../domain/class/types'
import { createAsiChoiceDefinition } from '../../../../domain/class/abilityScoreImprovement'
import { createEpicBoonChoiceDefinition } from '../../../../domain/class/epicBoon'
import { subclassToChoiceOption } from '../../../../domain/class/subclassDefinition'
import { SKILL_LABELS, type SkillId } from '../../../../domain/skills/types'
import { createCompleteClassPackageOrGoldStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { SORCERER_PACKAGE_A } from '../equipment/packages'
import { SRD_2024_SOURCE } from '../source'
import { sorcererSpellcastingSrd2024 } from '../spellcasting/sorcerer'
import { draconicSorcerySrd2024 } from '../subclasses/draconic-sorcery'

const SKILL_OPTIONS: SkillId[] = [
  'arcana',
  'deception',
  'insight',
  'intimidation',
  'persuasion',
  'religion',
]

function formatSorceryPointsTable(): string {
  const lines: string[] = []
  for (let level = 2; level <= 20; level += 1) {
    lines.push(`Level ${level}: ${level}`)
  }
  return lines.join('; ')
}

const METAMAGIC_OPTIONS = [
  {
    id: 'careful-spell',
    label: 'Careful Spell',
    description:
      'Cost: 1 Sorcery Point. When you cast a spell that forces other creatures to make a saving throw, you can protect some of those creatures from the spell\'s full force. Choose a number of those creatures up to your Charisma modifier (minimum of one creature). A chosen creature automatically succeeds on its saving throw against the spell, and it takes no damage if it would normally take half damage on a successful save.',
  },
  {
    id: 'distant-spell',
    label: 'Distant Spell',
    description:
      'Cost: 1 Sorcery Point. When you cast a spell that has a range of at least 5 feet, you can double the spell\'s range. Or when you cast a spell that has a range of Touch, you can make the spell\'s range 30 feet.',
  },
  {
    id: 'empowered-spell',
    label: 'Empowered Spell',
    description:
      'Cost: 1 Sorcery Point. When you roll damage for a spell, you can reroll a number of the damage dice up to your Charisma modifier (minimum of one), and you must use the new rolls. You can use Empowered Spell even if you\'ve already used a different Metamagic option during the casting of the spell.',
  },
  {
    id: 'extended-spell',
    label: 'Extended Spell',
    description:
      'Cost: 1 Sorcery Point. When you cast a spell that has a duration of 1 minute or longer, you can double its duration to a maximum duration of 24 hours. If the affected spell requires Concentration, you have Advantage on any saving throw you make to maintain that Concentration.',
  },
  {
    id: 'heightened-spell',
    label: 'Heightened Spell',
    description:
      'Cost: 2 Sorcery Points. When you cast a spell that forces a creature to make a saving throw, you can give one target of the spell Disadvantage on saves against the spell.',
  },
  {
    id: 'quickened-spell',
    label: 'Quickened Spell',
    description:
      'Cost: 2 Sorcery Points. When you cast a spell that has a casting time of an action, you can change the casting time to a Bonus Action for this casting. You can\'t cast another Level 1+ spell on the same turn that you cast a Level 1+ spell with Quickened Spell.',
  },
  {
    id: 'seeking-spell',
    label: 'Seeking Spell',
    description:
      'Cost: 1 Sorcery Point. If you make an attack roll for a spell and miss, you can reroll the d20, and you must use the new roll. You can use Seeking Spell even if you\'ve already used a different Metamagic option during the casting of the spell.',
  },
  {
    id: 'subtle-spell',
    label: 'Subtle Spell',
    description:
      'Cost: 1 Sorcery Point. When you cast a spell, you can cast it without any Verbal, Somatic, or Material components, except Material components that are consumed by the spell or that have a cost specified in the spell.',
  },
  {
    id: 'transmuted-spell',
    label: 'Transmuted Spell',
    description:
      'Cost: 1 Sorcery Point. When you cast a spell that deals a type of damage from the following list, you can change that damage type to one of the other listed types: Acid, Cold, Fire, Lightning, Poison, or Thunder.',
  },
  {
    id: 'twinned-spell',
    label: 'Twinned Spell',
    description:
      'Cost: 1 Sorcery Point. When you cast a spell, such as Charm Person, that can be cast with a higher-level spell slot to target an additional creature, you can increase the spell\'s effective level by 1.',
  },
] as const

const ELEMENTAL_AFFINITY_OPTIONS = [
  {
    id: 'acid',
    label: 'Acid',
    effects: [{ kind: 'damage-resistance' as const, damageType: 'acid' as const }],
  },
  {
    id: 'cold',
    label: 'Cold',
    effects: [{ kind: 'damage-resistance' as const, damageType: 'cold' as const }],
  },
  {
    id: 'fire',
    label: 'Fire',
    effects: [{ kind: 'damage-resistance' as const, damageType: 'fire' as const }],
  },
  {
    id: 'lightning',
    label: 'Lightning',
    effects: [
      { kind: 'damage-resistance' as const, damageType: 'lightning' as const },
    ],
  },
  {
    id: 'poison',
    label: 'Poison',
    effects: [{ kind: 'damage-resistance' as const, damageType: 'poison' as const }],
  },
]

export const sorcererSrd2024: ClassDefinition = {
  id: 'srd-2024:sorcerer',
  editionId: 'srd-2024',
  name: 'Sorcerer',
  description:
    'A spellcaster who draws on innate magic from a gift or bloodline, shaping raw power through force of personality.',
  source: SRD_2024_SOURCE,
  catalogOrder: 12,
  hitDie: { sides: 6 },
  primaryAbilities: ['charisma'],
  multiclassPrerequisite: {
    kind: 'all-of',
    abilities: ['charisma'],
    minimum: 13,
    summary: 'Charisma 13',
  },
  savingThrows: ['constitution', 'charisma'],
  spellcasting: sorcererSpellcastingSrd2024,
  proficiencies: {
    armor: [],
    weapons: ['simple'],
    tools: [],
    skillOptions: [...SKILL_OPTIONS],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'spellcasting',
          name: 'Spellcasting',
          description:
            'Drawing from your innate magic, you can cast spells. See "Spells" for the rules on spellcasting.\nCantrips. You know four cantrips of your choice from the Sorcerer spell list. Light, Prestidigitation, Shocking Grasp, and Sorcerous Burst are recommended.\nWhenever you gain a Sorcerer level, you can replace one of your cantrips with another cantrip of your choice from the Sorcerer spell list.\nWhen you reach Sorcerer levels 4 and 10, you learn another cantrip of your choice from the Sorcerer spell list, as shown in the Cantrips column of the Sorcerer Features table.\nSpell Slots. The Sorcerer Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 spells from the Sorcerer spell list. Burning Hands and Detect Magic are recommended.\nThe number of spells on your list increases as you gain Sorcerer levels, as shown in the Prepared Spells column of the Sorcerer Features table. Whenever that number increases, choose additional Sorcerer spells until the number of spells on your list matches the number on the table. The chosen spells must be of a level for which you have spell slots.\nIf another Sorcerer feature gives you spells that you always have prepared, those spells don\'t count against the number of spells you can prepare with this feature, but those spells otherwise count as Sorcerer spells for you.\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells there with other Sorcerer spells for which you have spell slots.\nSpellcasting Ability. Charisma is your spellcasting ability for your Sorcerer spells.\nSpellcasting Focus. You can use an Arcane Focus as a Spellcasting Focus for your Sorcerer spells.',
        },
        {
          id: 'innate-sorcery',
          name: 'Innate Sorcery',
          description:
            'As a Bonus Action, you can stir the magic within yourself into a state of frenzy for 1 minute. For the duration, you gain the following benefits:\n• The spell save DC of your Sorcerer spells increases by 1.\n• You have Advantage on the attack rolls of Sorcerer spells you cast.\nYou can use this feature twice, and you regain all expended uses when you finish a Long Rest.\nCharacter Forge records this feature only — it does not track expended uses or active Innate Sorcery during play.',
        },
      ],
    },
    {
      level: 2,
      features: [
        {
          id: 'font-of-magic',
          name: 'Font of Magic',
          description:
            `You can tap into the wellspring of magic within yourself. This wellspring is represented by Sorcery Points, which allow you to create a variety of magical effects.\nYou have a number of Sorcery Points equal to your Sorcerer level (Sorcery Points by level: ${formatSorceryPointsTable()}). You can never have more Sorcery Points than your level, and you regain all expended points when you finish a Long Rest.\nYou can use your Sorcery Points to fuel the following abilities:\nConverting Spell Slots to Sorcery Points. As a Bonus Action, you can expend one spell slot and gain a number of Sorcery Points equal to the slot's level.\nCreating Spell Slots. As a Bonus Action, you can transform unexpended Sorcery Points into one spell slot. The Creating Spell Slots table shows the cost of creating a spell slot of a given level, and it lists the minimum Sorcerer level you must be to create a slot. You can create a spell slot no higher than level 5. Any slots you create with this feature vanish when you finish a Long Rest.\nLevel 1 slot: 2 points (Sorcerer level 2+). Level 2: 3 points (L3+). Level 3: 5 points (L5+). Level 4: 6 points (L7+). Level 5: 7 points (L9+).\nCharacter Forge records your maximum Sorcery Points only — it does not track expended points or created slots during play.`,
        },
        {
          id: 'metamagic',
          name: 'Metamagic',
          description:
            'You can weave magic into your spells to create unique effects. You gain two Metamagic options of your choice from the Metamagic Options list. You can use only one Metamagic option on a spell when you cast it, unless otherwise noted.\nWhenever you gain a Sorcerer level, you can replace one of your Metamagic options with another one you don\'t have.\nYou gain two more options when you reach Sorcerer levels 10 and 17.\nCharacter Forge records your Metamagic choices only — it does not track Sorcery Point expenditure or apply Metamagic during play.',
        },
      ],
    },
    {
      level: 3,
      features: [
        {
          id: 'sorcerer-subclass',
          name: 'Sorcerer Subclass',
          description:
            'You gain a Sorcerer subclass of your choice. The Draconic Sorcery subclass is detailed in the SRD. A subclass is a specialization that grants you features at certain Sorcerer levels. For the rest of your career, you gain each of your subclass features that are of your Sorcerer level or lower.',
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
          id: 'sorcerous-restoration',
          name: 'Sorcerous Restoration',
          description:
            'When you finish a Short Rest, you can regain expended Sorcery Points, but no more than a number equal to half your Sorcerer level (round down). Once you use this feature, you can\'t do so again until you finish a Long Rest.\nCharacter Forge records this feature only — it does not track Short Rest recovery during play.',
        },
      ],
    },
    {
      level: 6,
      features: [
        {
          id: 'sorcerer-subclass-feature-6',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Sorcerer subclass.',
        },
      ],
    },
    {
      level: 7,
      features: [
        {
          id: 'sorcery-incarnate',
          name: 'Sorcery Incarnate',
          description:
            'If you have no uses of Innate Sorcery left, you can use it if you spend 2 Sorcery Points when you take the Bonus Action to activate it.\nIn addition, while your Innate Sorcery feature is active, you can use up to two of your Metamagic options on each spell you cast.\nCharacter Forge records this feature only — it does not track Innate Sorcery activation or Metamagic stacking during play.',
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
          id: 'metamagic-10',
          name: 'Metamagic',
          description:
            'You gain two more Metamagic options of your choice.',
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
          id: 'sorcerer-subclass-feature-14',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Sorcerer subclass.',
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
          id: 'metamagic-17',
          name: 'Metamagic',
          description:
            'You gain two more Metamagic options of your choice.',
        },
      ],
    },
    {
      level: 18,
      features: [
        {
          id: 'sorcerer-subclass-feature-18',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Sorcerer subclass.',
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
          id: 'arcane-apotheosis',
          name: 'Arcane Apotheosis',
          description:
            'While your Innate Sorcery feature is active, you can use one Metamagic option on each of your turns without spending Sorcery Points on it.\nCharacter Forge records this feature only — it does not track Innate Sorcery or free Metamagic during play.',
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
      options: SKILL_OPTIONS.map((skillId) => ({
        id: skillId,
        label: SKILL_LABELS[skillId],
        effects: [{ kind: 'skill-proficiency' as const, skillId }],
      })),
    },
    {
      id: 'metamagic',
      level: 2,
      prompt: 'Choose two Metamagic options',
      type: 'multi-select',
      required: true,
      min: 2,
      max: 2,
      options: METAMAGIC_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        description: option.description,
      })),
    },
    {
      id: 'sorcerer-subclass',
      level: 3,
      prompt: 'Choose a Sorcerer Subclass',
      type: 'single-select',
      required: true,
      options: [subclassToChoiceOption(draconicSorcerySrd2024)],
    },
    {
      id: 'elemental-affinity',
      level: 6,
      prompt: 'Choose an Elemental Affinity damage type',
      type: 'single-select',
      required: true,
      availableWhen: {
        choiceId: 'sorcerer-subclass',
        optionId: 'draconic-sorcery',
      },
      options: ELEMENTAL_AFFINITY_OPTIONS,
    },
    {
      id: 'metamagic-10',
      level: 10,
      prompt: 'Choose two more Metamagic options',
      type: 'multi-select',
      required: true,
      min: 2,
      max: 2,
      options: METAMAGIC_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        description: option.description,
      })),
    },
    {
      id: 'metamagic-17',
      level: 17,
      prompt: 'Choose two more Metamagic options',
      type: 'multi-select',
      required: true,
      min: 2,
      max: 2,
      options: METAMAGIC_OPTIONS.map((option) => ({
        id: option.id,
        label: option.label,
        description: option.description,
      })),
    },
    createAsiChoiceDefinition('ability-score-improvement-4', 4),
    createAsiChoiceDefinition('ability-score-improvement-8', 8),
    createAsiChoiceDefinition('ability-score-improvement-12', 12),
    createAsiChoiceDefinition('ability-score-improvement-16', 16),
    createEpicBoonChoiceDefinition({
      recommendedFeatId: 'srd-2024:boon-of-dimensional-travel',
    }),
  ],
  startingEquipment: createCompleteClassPackageOrGoldStartingEquipment({
    items: SORCERER_PACKAGE_A,
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
  ],
}
