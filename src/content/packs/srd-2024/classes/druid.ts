import type { ClassDefinition } from '../../../../domain/class/types'
import { createAsiChoiceDefinition } from '../../../../domain/class/abilityScoreImprovement'
import {
  beastFormsToChoiceOptions,
  getEligibleBeastForms,
} from '../../../../domain/class/beastForms'
import { createEpicBoonChoiceDefinition } from '../../../../domain/class/epicBoon'
import { subclassToChoiceOption } from '../../../../domain/class/subclassDefinition'
import type { SkillId } from '../../../../domain/skills/types'
import { SKILL_LABELS } from '../../../../domain/skills/types'
import { createCompleteClassPackageOrGoldStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { DRUID_PACKAGE_A } from '../equipment/packages'
import { SRD_2024_SOURCE } from '../source'
import {
  druidicSpeakWithAnimalsEntitlement,
  druidSpellcastingSrd2024,
  magicianCantripEntitlement,
} from '../spellcasting/druid'
import { circleOfTheLandSrd2024 } from '../subclasses/circle-of-the-land'
import { DRUID_WILD_SHAPE_USES_BY_LEVEL } from '../../../../domain/spell/progressions'

const DRUID_SKILL_OPTIONS = [
  'arcana',
  'animal-handling',
  'insight',
  'medicine',
  'nature',
  'perception',
  'religion',
  'survival',
] as const satisfies readonly SkillId[]

function circleLandSpellEntitlement(
  landId: string,
  spells: { spellId: string; minLevel: number }[],
) {
  return {
    id: `circle-land-${landId}`,
    kind: 'granted' as const,
    countsAgainstLimit: false as const,
    appliesTo: 'prepared' as const,
    spells,
  }
}

const CIRCLE_LAND_OPTIONS = [
  {
    id: 'arid',
    label: 'Arid',
    description:
      '3rd: Blur, Burning Hands, Fire Bolt; 5th: Fireball; 7th: Blight; 9th: Wall of Stone. Nature\'s Ward: Fire resistance.',
    spellEntitlements: [
      circleLandSpellEntitlement('arid', [
        { spellId: 'srd-2024:blur', minLevel: 3 },
        { spellId: 'srd-2024:burning-hands', minLevel: 3 },
        { spellId: 'srd-2024:fire-bolt', minLevel: 3 },
        { spellId: 'srd-2024:fireball', minLevel: 5 },
        { spellId: 'srd-2024:blight', minLevel: 7 },
        { spellId: 'srd-2024:wall-of-stone', minLevel: 9 },
      ]),
    ],
  },
  {
    id: 'polar',
    label: 'Polar',
    description:
      '3rd: Fog Cloud, Hold Person, Ray of Frost; 5th: Sleet Storm; 7th: Ice Storm; 9th: Cone of Cold. Nature\'s Ward: Cold resistance.',
    spellEntitlements: [
      circleLandSpellEntitlement('polar', [
        { spellId: 'srd-2024:fog-cloud', minLevel: 3 },
        { spellId: 'srd-2024:hold-person', minLevel: 3 },
        { spellId: 'srd-2024:ray-of-frost', minLevel: 3 },
        { spellId: 'srd-2024:sleet-storm', minLevel: 5 },
        { spellId: 'srd-2024:ice-storm', minLevel: 7 },
        { spellId: 'srd-2024:cone-of-cold', minLevel: 9 },
      ]),
    ],
  },
  {
    id: 'temperate',
    label: 'Temperate',
    description:
      '3rd: Misty Step, Shocking Grasp, Sleep; 5th: Lightning Bolt; 7th: Freedom of Movement; 9th: Tree Stride. Nature\'s Ward: Lightning resistance.',
    spellEntitlements: [
      circleLandSpellEntitlement('temperate', [
        { spellId: 'srd-2024:misty-step', minLevel: 3 },
        { spellId: 'srd-2024:shocking-grasp', minLevel: 3 },
        { spellId: 'srd-2024:sleep', minLevel: 3 },
        { spellId: 'srd-2024:lightning-bolt', minLevel: 5 },
        { spellId: 'srd-2024:freedom-of-movement', minLevel: 7 },
        { spellId: 'srd-2024:tree-stride', minLevel: 9 },
      ]),
    ],
  },
  {
    id: 'tropical',
    label: 'Tropical',
    description:
      '3rd: Acid Splash, Ray of Sickness, Web; 5th: Stinking Cloud; 7th: Polymorph; 9th: Insect Plague. Nature\'s Ward: Poison resistance.',
    spellEntitlements: [
      circleLandSpellEntitlement('tropical', [
        { spellId: 'srd-2024:acid-splash', minLevel: 3 },
        { spellId: 'srd-2024:ray-of-sickness', minLevel: 3 },
        { spellId: 'srd-2024:web', minLevel: 3 },
        { spellId: 'srd-2024:stinking-cloud', minLevel: 5 },
        { spellId: 'srd-2024:polymorph', minLevel: 7 },
        { spellId: 'srd-2024:insect-plague', minLevel: 9 },
      ]),
    ],
  },
] as const

function formatWildShapeUsesTable(): string {
  const lines = DRUID_WILD_SHAPE_USES_BY_LEVEL.map(
    (uses, index) => `Level ${index + 1}: ${uses === 0 ? '—' : uses}`,
  )
  return lines.join('; ')
}

export const druidSrd2024: ClassDefinition = {
  id: 'srd-2024:druid',
  editionId: 'srd-2024',
  name: 'Druid',
  description:
    'A priest of the Old Faith, wielding the powers of nature and adopting animal forms.',
  source: SRD_2024_SOURCE,
  catalogOrder: 13,
  hitDie: { sides: 8 },
  primaryAbilities: ['wisdom'],
  multiclassPrerequisite: {
    kind: 'all-of',
    abilities: ['wisdom'],
    minimum: 13,
    summary: 'Wisdom 13',
  },
  savingThrows: ['intelligence', 'wisdom'],
  spellcasting: druidSpellcastingSrd2024,
  proficiencies: {
    armor: ['light', 'shield'],
    weapons: ['simple'],
    tools: [],
    skillOptions: [...DRUID_SKILL_OPTIONS],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'spellcasting',
          name: 'Spellcasting',
          description:
            'You have learned to cast spells through studying the mystical forces of nature. See "Spells" for the rules on spellcasting.\nCantrips. You know two cantrips of your choice from the Druid spell list. Druidcraft and Produce Flame are recommended.\nWhenever you gain a Druid level, you can replace one of your cantrips with another cantrip of your choice from the Druid spell list.\nWhen you reach Druid levels 4 and 10, you learn another cantrip of your choice from the Druid spell list, as shown in the Cantrips column of the Druid Features table.\nSpell slots. The Druid Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose four level 1 spells from the Druid spell list. Animal Friendship, Cure Wounds, Faerie Fire, and Thunderwave are recommended.\nThe number of spells on your list increases as you gain Druid levels, as shown in the Prepared Spells column of the Druid Features table. Whenever that number increases, choose additional spells from the Druid spell list until the number of spells on your list matches the number on the table. The chosen spells must be of a level for which you have spell slots.\nIf another Druid feature gives you spells that you always have prepared, those spells don\'t count against the number of spells you can prepare with this feature, but those spells otherwise count as Druid spells for you.\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of the spells there with other Druid spells for which you have spell slots.\nSpellcasting Ability. Wisdom is your spellcasting ability for your Druid spells.\nSpellcasting Focus. You can use a Druidic Focus as a Spellcasting Focus for your Druid spells.',
        },
        {
          id: 'druidic',
          name: 'Druidic',
          description:
            'You know Druidic, the secret language of Druids. While learning this ancient tongue, you also unlocked the magic of communicating with animals; you always have the Speak with Animals spell prepared.\nYou can use Druidic to leave hidden messages. You and others who know Druidic automatically spot such a message. Others spot the message\'s presence with a successful DC 15 Intelligence (Investigation) check but can\'t decipher it without magic.',
          effects: [
            { kind: 'language', languageId: 'druidic', label: 'Druidic' },
            {
              kind: 'tool-proficiency',
              toolId: 'herbalism-kit',
              label: 'Herbalism Kit',
            },
          ],
          spellEntitlements: [druidicSpeakWithAnimalsEntitlement],
        },
        {
          id: 'primal-order',
          name: 'Primal Order',
          description:
            'You have dedicated yourself to one of the following sacred roles of your choice.\nMagician. You know one extra cantrip from the Druid spell list. In addition, your mystical connection to nature gives you a bonus to your Intelligence (Arcana or Nature) checks. The bonus equals your Wisdom modifier (minimum bonus of +1).\nWarden. Trained for battle, you gain proficiency with Martial weapons and training with Medium armor.',
        },
      ],
    },
    {
      level: 2,
      features: [
        {
          id: 'wild-shape',
          name: 'Wild Shape',
          description:
            `The power of nature allows you to assume the form of an animal. As a Bonus Action, you shape-shift into a Beast form that you have learned for this feature (see "Known Forms" below). You stay in that form for a number of hours equal to half your Druid level or until you use Wild Shape again, have the Incapacitated condition, or die. You can also leave the form early as a Bonus Action.\nNumber of Uses. You can use Wild Shape twice. You regain one expended use when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest. You gain additional uses when you reach certain Druid levels (Wild Shape uses by level: ${formatWildShapeUsesTable()}).\nKnown Forms. You know four Beast forms for this feature, chosen from among Beast stat blocks that have a maximum Challenge Rating of 1/4 and that lack a Fly Speed. The Rat, Riding Horse, Spider, and Wolf are recommended. Whenever you finish a Long Rest, you can replace one of your known forms with another eligible form.\nBeast Shapes. Level 2: 4 forms, Max CR 1/4, no Fly Speed. Level 4: 6 forms, Max CR 1/2, no Fly Speed. Level 8: 8 forms, Max CR 1, Fly Speed allowed.\nRules While Shape-Shifted. While in a form, you retain your personality, memories, and ability to speak. You gain Temporary Hit Points equal to your Druid level when you assume a form. Your game statistics are replaced by the Beast's stat block with listed exceptions. You can't cast spells while shape-shifted (until Beast Spells). Character Forge records Known Forms only — it does not transform sheet statistics.`,
        },
        {
          id: 'wild-companion',
          name: 'Wild Companion',
          description:
            'You can summon a nature spirit that assumes an animal form to aid you. As a Magic action, you can expend a spell slot or a use of Wild Shape to cast the Find Familiar spell without Material components.\nWhen you cast the spell in this way, the familiar is Fey and disappears when you finish a Long Rest.',
        },
      ],
    },
    {
      level: 3,
      features: [
        {
          id: 'druid-subclass',
          name: 'Druid Subclass',
          description:
            'You gain a Druid subclass of your choice. The Circle of the Land subclass is detailed in the SRD. A subclass is a specialization that grants you features at certain Druid levels. For the rest of your career, you gain each of your subclass features that are of your Druid level or lower.',
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
          id: 'wild-resurgence',
          name: 'Wild Resurgence',
          description:
            "Once on each of your turns, if you have no uses of Wild Shape left, you can give yourself one use by expending a spell slot (no action required).\nIn addition, you can expend one use of Wild Shape (no action required) to give yourself a level 1 spell slot, but you can't do so again until you finish a Long Rest.",
        },
      ],
    },
    {
      level: 6,
      features: [
        {
          id: 'druid-subclass-feature-6',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Druid subclass.',
        },
      ],
    },
    {
      level: 7,
      features: [
        {
          id: 'elemental-fury',
          name: 'Elemental Fury',
          description:
            'The might of the elements flows through you. You gain one of the following options of your choice.\nPotent Spellcasting. Add your Wisdom modifier to the damage you deal with any Druid cantrip.\nPrimal Strike. Once on each of your turns when you hit a creature with an attack roll using a weapon or a Beast form\'s attack in Wild Shape, you can cause the target to take an extra 1d8 Cold, Fire, Lightning, or Thunder damage (choose when you hit).',
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
          id: 'druid-subclass-feature-10',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Druid subclass.',
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
          id: 'druid-subclass-feature-14',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Druid subclass.',
        },
      ],
    },
    {
      level: 15,
      features: [
        {
          id: 'improved-elemental-fury',
          name: 'Improved Elemental Fury',
          description:
            'The option you chose for Elemental Fury grows more powerful.\nPotent Spellcasting. When you cast a Druid cantrip with a range of 10 feet or greater, the spell\'s range increases by 300 feet.\nPrimal Strike. The extra damage of your Primal Strike increases to 2d8.',
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
      features: [],
    },
    {
      level: 18,
      features: [
        {
          id: 'beast-spells',
          name: 'Beast Spells',
          description:
            'While using Wild Shape, you can cast spells in Beast form, except for any spell that has a Material component with a cost specified or that consumes its Material component.',
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
          id: 'archdruid',
          name: 'Archdruid',
          description:
            "The vitality of nature constantly blooms within you, granting the following benefits.\nEvergreen Wild Shape. Whenever you roll Initiative and have no uses of Wild Shape left, you regain one expended use of it.\nNature Magician. You can convert uses of Wild Shape into a spell slot (no action required). Choose a number of your unexpended uses of Wild Shape and convert them into a single spell slot, with each use contributing 2 spell levels. For example, if you convert two uses of Wild Shape, you produce a level 4 spell slot. Once you use this benefit, you can't do so again until you finish a Long Rest.\nLongevity. The primal magic that you wield causes you to age more slowly. For every ten years that pass, your body ages only one year.",
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
      options: DRUID_SKILL_OPTIONS.map((skillId) => ({
        id: skillId,
        label: SKILL_LABELS[skillId],
        effects: [{ kind: 'skill-proficiency', skillId }],
      })),
    },
    {
      id: 'primal-order',
      level: 1,
      prompt: 'Choose a Primal Order',
      type: 'single-select',
      required: true,
      options: [
        {
          id: 'magician',
          label: 'Magician',
          description:
            'You know one extra cantrip from the Druid spell list. In addition, your mystical connection to nature gives you a bonus to your Intelligence (Arcana or Nature) checks equal to your Wisdom modifier (minimum of +1).',
          spellEntitlements: [magicianCantripEntitlement],
        },
        {
          id: 'warden',
          label: 'Warden',
          description:
            'Trained for battle, you gain proficiency with Martial weapons and training with Medium armor.',
          effects: [
            { kind: 'armor-proficiency', category: 'medium' },
            { kind: 'weapon-proficiency', category: 'martial' },
          ],
        },
      ],
    },
    {
      id: 'wild-shape-forms',
      level: 2,
      prompt: 'Choose Known Forms for Wild Shape',
      type: 'multi-select',
      required: true,
      min: 4,
      max: 4,
      options: beastFormsToChoiceOptions(getEligibleBeastForms(2)),
    },
    {
      id: 'druid-subclass',
      level: 3,
      prompt: 'Choose a Druid Subclass',
      type: 'single-select',
      required: true,
      options: [subclassToChoiceOption(circleOfTheLandSrd2024)],
    },
    {
      id: 'circle-land',
      level: 3,
      prompt: 'Choose a land type for Circle Spells',
      type: 'single-select',
      required: true,
      availableWhen: {
        choiceId: 'druid-subclass',
        optionId: 'circle-of-the-land',
      },
      options: [...CIRCLE_LAND_OPTIONS],
    },
    {
      id: 'elemental-fury',
      level: 7,
      prompt: 'Choose an Elemental Fury option',
      type: 'single-select',
      required: true,
      options: [
        {
          id: 'potent-spellcasting',
          label: 'Potent Spellcasting',
          description:
            'Add your Wisdom modifier to the damage you deal with any Druid cantrip.',
        },
        {
          id: 'primal-strike',
          label: 'Primal Strike',
          description:
            "Once on each of your turns when you hit a creature with an attack roll using a weapon or a Beast form's attack in Wild Shape, you can cause the target to take an extra 1d8 Cold, Fire, Lightning, or Thunder damage (choose when you hit).",
        },
      ],
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
    items: DRUID_PACKAGE_A,
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
