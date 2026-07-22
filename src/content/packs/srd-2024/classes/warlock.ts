import type { ClassDefinition } from '../../../../domain/class/types'
import { createAsiChoiceDefinition } from '../../../../domain/class/abilityScoreImprovement'
import { createEpicBoonChoiceDefinition } from '../../../../domain/class/epicBoon'
import { subclassToChoiceOption } from '../../../../domain/class/subclassDefinition'
import { SKILL_LABELS, type SkillId } from '../../../../domain/skills/types'
import {
  DAMAGE_TYPE_IDS,
  type DamageTypeId,
} from '../../../../domain/species/types'
import {
  MELEE_WEAPON_IDS,
  WEAPON_LABELS,
  type MeleeWeaponId,
} from '../../../../domain/weapons/types'
import { createCompleteClassPackageOrGoldStartingEquipment } from '../../../../domain/equipment/startingEquipmentHelpers'
import { WARLOCK_INVOCATIONS_BY_LEVEL } from '../progressions'
import { WARLOCK_PACKAGE_A } from '../equipment/packages'
import {
  ELDRITCH_INVOCATION_OPTIONS,
  ELDRITCH_INVOCATIONS_CHOICE,
} from '../invocations/eldritchInvocations'
import { SRD_2024_SOURCE } from '../source'
import {
  contactPatronSpellEntitlement,
  warlockSpellcastingSrd2024,
} from '../spellcasting/warlock'
import { fiendPatronSrd2024 } from '../subclasses/fiend-patron'

const SKILL_OPTIONS: SkillId[] = [
  'arcana',
  'deception',
  'history',
  'intimidation',
  'investigation',
  'nature',
  'religion',
]

const WARLOCK_DAMAGE_CANTRIPS = [
  { id: 'srd-2024:chill-touch', label: 'Chill Touch' },
  { id: 'srd-2024:eldritch-blast', label: 'Eldritch Blast' },
  { id: 'srd-2024:poison-spray', label: 'Poison Spray' },
  { id: 'srd-2024:true-strike', label: 'True Strike' },
] as const

const WARLOCK_ATTACK_CANTRIPS = [
  { id: 'srd-2024:chill-touch', label: 'Chill Touch' },
  { id: 'srd-2024:eldritch-blast', label: 'Eldritch Blast' },
  { id: 'srd-2024:true-strike', label: 'True Strike' },
] as const

const WARLOCK_SPEAR_CANTRIPS = WARLOCK_DAMAGE_CANTRIPS

const PACT_CHAIN_FAMILIARS = [
  { id: 'imp', label: 'Imp' },
  { id: 'pseudodragon', label: 'Pseudodragon' },
  { id: 'quasit', label: 'Quasit' },
  { id: 'skeleton', label: 'Skeleton' },
  { id: 'sphinx-of-wonder', label: 'Sphinx of Wonder' },
  { id: 'sprite', label: 'Sprite' },
  { id: 'venomous-snake', label: 'Venomous Snake' },
  {
    id: 'normal-form',
    label: 'Normal Find Familiar form',
    description: 'Any normal form allowed by Find Familiar.',
  },
] as const

function formatDamageTypeLabel(damageType: DamageTypeId): string {
  return damageType.charAt(0).toUpperCase() + damageType.slice(1)
}

const FIENDISH_RESILIENCE_OPTIONS = DAMAGE_TYPE_IDS.filter(
  (damageType) => damageType !== 'force',
).map((damageType) => ({
  id: damageType,
  label: formatDamageTypeLabel(damageType),
  effects: [{ kind: 'damage-resistance' as const, damageType }],
}))

function blastCantripChoices(
  baseOptionId: string,
  prompt: string,
  cantrips: readonly { id: string; label: string }[],
) {
  const optionIds = [baseOptionId, `${baseOptionId}-2`, `${baseOptionId}-3`]
  return optionIds.map((optionId, index) => ({
    id: `invocation-${optionId}-cantrip`,
    level: 1 as const,
    prompt: index === 0 ? prompt : `${prompt} (${index + 1})`,
    type: 'single-select' as const,
    required: true,
    availableWhen: {
      choiceId: ELDRITCH_INVOCATIONS_CHOICE,
      optionId,
    },
    options: cantrips.map((cantrip) => ({
      id: cantrip.id,
      label: cantrip.label,
    })),
  }))
}

function lessonsFeatChoices() {
  const optionIds = [
    'lessons-of-the-first-ones',
    'lessons-of-the-first-ones-2',
    'lessons-of-the-first-ones-3',
  ]
  return optionIds.map((optionId, index) =>
    ({
      id: `feat-grant:${optionId}`,
      level: 1 as const,
      prompt:
        index === 0
          ? 'Choose an Origin feat (Lessons of the First Ones)'
          : `Choose an Origin feat (Lessons of the First Ones ${index + 1})`,
      type: 'single-select' as const,
      required: true,
      featGrantCategory: 'origin' as const,
      availableWhen: {
        choiceId: ELDRITCH_INVOCATIONS_CHOICE,
        optionId,
      },
      options: [],
    }),
  )
}

export const warlockSrd2024: ClassDefinition = {
  id: 'srd-2024:warlock',
  editionId: 'srd-2024',
  name: 'Warlock',
  description:
    'A wielder of magic that is derived from a bargain with an otherworldly being of the Outer Planes or a similar entity.',
  source: SRD_2024_SOURCE,
  catalogOrder: 22,
  hitDie: { sides: 8 },
  primaryAbilities: ['charisma'],
  multiclassPrerequisite: {
    kind: 'all-of',
    abilities: ['charisma'],
    minimum: 13,
    summary: 'Charisma 13',
  },
  savingThrows: ['wisdom', 'charisma'],
  spellcasting: warlockSpellcastingSrd2024,
  proficiencies: {
    armor: ['light'],
    weapons: ['simple'],
    tools: [],
    skillOptions: [...SKILL_OPTIONS],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'pact-magic',
          name: 'Pact Magic',
          description:
            'Through occult study or a bargain, you learn to cast spells. See "Spells" for the rules on spellcasting.\nCantrips. You know two cantrips of your choice from the Warlock spell list. Eldritch Blast and Prestidigitation are recommended. Whenever you gain a Warlock level, you can replace one of your cantrips with another cantrip from the Warlock spell list. You learn additional cantrips at the levels shown in the Cantrips column of the Warlock Features table.\nSpell Slots. The Warlock Features table shows how many spell slots you have to cast your Warlock spells of level 1+. All of your Pact Magic slots are the same level. You regain all expended Pact Magic slots when you finish a Short or Long Rest.\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 spells from the Warlock spell list. Charm Person and Hex are recommended. The number of spells on your list increases as shown in the Prepared Spells column. The chosen spells must be of a level no higher than your Pact Magic slot level.\nIf another Warlock feature gives you spells that you always have prepared, those spells don\'t count against the number of spells you can prepare with this feature.\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can change your list of prepared spells, replacing any of them with other Warlock spells for which you have Pact Magic slots.\nSpellcasting Ability. Charisma is your spellcasting ability for your Warlock spells.\nSpellcasting Focus. You can use an Arcane Focus as a Spellcasting Focus for your Warlock spells.',
        },
        {
          id: 'eldritch-invocations',
          name: 'Eldritch Invocations',
          description:
            'You have unearthed Eldritch Invocations, pieces of forbidden knowledge that imbue you with an abiding magical ability or other lessons. You gain one invocation of your choice, such as Pact of the Tome or Pact of the Blade. Invocations are detailed in the Eldritch Invocation Options list.\nWhen you gain certain Warlock levels, you gain more invocations of your choice, as shown in the Invocations column of the Warlock Features table.\nAdditionally, whenever you gain a Warlock level, you can replace one of your invocations with another one for which you qualify. You can\'t replace an invocation if it\'s a prerequisite for another invocation you have, unless you also replace that other invocation.\nCharacter Forge records your invocation choices and nested creation-time picks. Play-time casting from invocations is not tracked.',
        },
      ],
    },
    {
      level: 2,
      features: [
        {
          id: 'magical-cunning',
          name: 'Magical Cunning',
          description:
            'You can perform an esoteric rite for 1 minute. When you finish, you regain expended Pact Magic slots but no more than a number equal to half your maximum (round up). Once you use this feature, you can\'t do so again until you finish a Long Rest.\nCharacter Forge records this feature only — Magical Cunning recovery during play is not tracked.',
        },
      ],
    },
    {
      level: 3,
      features: [
        {
          id: 'warlock-subclass',
          name: 'Warlock Subclass',
          description:
            'You gain a Warlock subclass of your choice. The Fiend Patron subclass is detailed in the SRD. A subclass is a specialization that grants you features at certain Warlock levels.',
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
    { level: 5, features: [] },
    { level: 6, features: [] },
    { level: 7, features: [] },
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
          id: 'contact-patron',
          name: 'Contact Patron',
          description:
            'In the past, you usually contacted your patron through intermediaries. Now you can communicate directly; you always have the Contact Other Plane spell prepared. With this feature, you can cast the spell without expending a spell slot to contact your patron, and you automatically succeed on the spell\'s saving throw. Once you cast Contact Other Plane with this feature, you can\'t do so in this way again until you finish a Long Rest.\nCharacter Forge grants Contact Other Plane as always prepared. Casting without a slot during play is not tracked.',
          spellEntitlements: [contactPatronSpellEntitlement],
        },
      ],
    },
    { level: 10, features: [] },
    {
      level: 11,
      features: [
        {
          id: 'mystic-arcanum-6',
          name: 'Mystic Arcanum (6th-level)',
          description:
            'Your patron bestows a magical secret called an arcanum upon you. Choose one level 6 spell from the Warlock spell list as this arcanum. You can cast your arcanum spell once without expending a spell slot, and you must finish a Long Rest before you can cast it in this way again. As shown in the Warlock Features table, you gain additional Mystic Arcanum spells of higher levels later. Whenever you gain a Warlock level, you can replace one of your arcanum spells with another Warlock spell of the same level.',
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
          id: 'mystic-arcanum-7',
          name: 'Mystic Arcanum (7th-level)',
          description:
            'You learn a level 7 Warlock spell as a Mystic Arcanum. You can cast it once without a spell slot and regain that use when you finish a Long Rest.',
        },
      ],
    },
    { level: 14, features: [] },
    {
      level: 15,
      features: [
        {
          id: 'mystic-arcanum-8',
          name: 'Mystic Arcanum (8th-level)',
          description:
            'You learn a level 8 Warlock spell as a Mystic Arcanum. You can cast it once without a spell slot and regain that use when you finish a Long Rest.',
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
          id: 'mystic-arcanum-9',
          name: 'Mystic Arcanum (9th-level)',
          description:
            'You learn a level 9 Warlock spell as a Mystic Arcanum. You can cast it once without a spell slot and regain that use when you finish a Long Rest.',
        },
      ],
    },
    { level: 18, features: [] },
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
          id: 'eldritch-master',
          name: 'Eldritch Master',
          description:
            'When you use your Magical Cunning feature, you regain all your expended Pact Magic spell slots.\nCharacter Forge records this feature only — Magical Cunning execution during play is not tracked.',
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
      id: ELDRITCH_INVOCATIONS_CHOICE,
      level: 1,
      prompt: 'Choose Eldritch Invocations',
      type: 'multi-select',
      required: true,
      min: 1,
      max: 1,
      limitsByLevel: [...WARLOCK_INVOCATIONS_BY_LEVEL],
      options: ELDRITCH_INVOCATION_OPTIONS,
    },
    {
      id: 'warlock-subclass',
      level: 3,
      prompt: 'Choose a Warlock Subclass',
      type: 'single-select',
      required: true,
      options: [subclassToChoiceOption(fiendPatronSrd2024)],
    },
    {
      id: 'fiendish-resilience',
      level: 10,
      prompt: 'Choose a Fiendish Resilience damage type (not Force)',
      type: 'single-select',
      required: true,
      availableWhen: {
        choiceId: 'warlock-subclass',
        optionId: 'fiend',
      },
      options: FIENDISH_RESILIENCE_OPTIONS,
    },
    {
      id: 'pact-blade-weapon',
      level: 1,
      prompt: 'Choose your Pact of the Blade weapon type',
      type: 'single-select',
      required: true,
      availableWhen: {
        choiceId: ELDRITCH_INVOCATIONS_CHOICE,
        optionId: 'pact-of-the-blade',
      },
      options: MELEE_WEAPON_IDS.map((weaponId: MeleeWeaponId) => ({
        id: weaponId,
        label: WEAPON_LABELS[weaponId],
        effects: [
          { kind: 'weapon-proficiency-item' as const, weaponId },
          {
            kind: 'weapon-attack-ability' as const,
            abilities: ['charisma' as const],
          },
        ],
      })),
    },
    {
      id: 'pact-chain-familiar',
      level: 1,
      prompt: 'Choose a Pact of the Chain familiar form',
      type: 'single-select',
      required: true,
      availableWhen: {
        choiceId: ELDRITCH_INVOCATIONS_CHOICE,
        optionId: 'pact-of-the-chain',
      },
      options: PACT_CHAIN_FAMILIARS.map((form) => ({
        id: form.id,
        label: form.label,
        description: 'description' in form ? form.description : undefined,
      })),
    },
    ...blastCantripChoices(
      'agonizing-blast',
      'Choose a cantrip for Agonizing Blast',
      WARLOCK_DAMAGE_CANTRIPS,
    ),
    ...blastCantripChoices(
      'eldritch-spear',
      'Choose a cantrip for Eldritch Spear',
      WARLOCK_SPEAR_CANTRIPS,
    ),
    ...blastCantripChoices(
      'repelling-blast',
      'Choose a cantrip for Repelling Blast',
      WARLOCK_ATTACK_CANTRIPS,
    ),
    ...lessonsFeatChoices(),
    createAsiChoiceDefinition('ability-score-improvement-4', 4),
    createAsiChoiceDefinition('ability-score-improvement-8', 8),
    createAsiChoiceDefinition('ability-score-improvement-12', 12),
    createAsiChoiceDefinition('ability-score-improvement-16', 16),
    createEpicBoonChoiceDefinition({
      recommendedFeatId: 'srd-2024:boon-of-fate',
    }),
  ],
  startingEquipment: createCompleteClassPackageOrGoldStartingEquipment({
    items: WARLOCK_PACKAGE_A,
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
