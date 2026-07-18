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
import { SRD_2024_SOURCE } from '../source'
import {
  blessedWarriorCantripsEntitlement,
  paladinSpellcastingSrd2024,
} from '../spellcasting/paladin'
import { devotionSrd2024 } from '../subclasses/devotion'

const PALADIN_SKILL_OPTIONS = [
  'athletics',
  'insight',
  'intimidation',
  'medicine',
  'persuasion',
  'religion',
] as const satisfies readonly SkillId[]

const WEAPON_MASTERY_OPTIONS = WEAPON_IDS.map((weaponId) => ({
  id: weaponId,
  label: formatWeaponMasteryOptionLabel(weaponId),
  description: formatWeaponMasteryDescription(weaponId),
}))

export const paladinSrd2024: ClassDefinition = {
  id: 'srd-2024:paladin',
  editionId: 'srd-2024',
  name: 'Paladin',
  description:
    'A holy warrior bound to a sacred oath, blending martial prowess with divine magic.',
  source: SRD_2024_SOURCE,
  catalogOrder: 16,
  hitDie: { sides: 10 },
  primaryAbilities: ['strength', 'charisma'],
  savingThrows: ['wisdom', 'charisma'],
  spellcasting: paladinSpellcastingSrd2024,
  proficiencies: {
    armor: ['light', 'medium', 'heavy', 'shield'],
    weapons: ['simple', 'martial'],
    tools: [],
    skillOptions: [...PALADIN_SKILL_OPTIONS],
  },
  featureProgression: [
    {
      level: 1,
      features: [
        {
          id: 'lay-on-hands',
          name: 'Lay On Hands',
          description:
            'Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you finish a Long Rest. With that pool, you can restore a total number of Hit Points equal to five times your Paladin level.\nAs a Bonus Action, you can touch a creature (which could be yourself) and draw power from the pool of healing to restore a number of Hit Points to that creature, up to the maximum amount remaining in the pool.\nYou can also expend 5 Hit Points from the pool of healing power to remove the Poisoned condition from the creature; those points don\'t also restore Hit Points to the creature.',
        },
        {
          id: 'spellcasting',
          name: 'Spellcasting',
          description:
            'You have learned to cast spells through prayer and meditation. See "Spells" for the rules on spellcasting.\nSpell Slots. The Paladin Features table shows how many spell slots you have to cast your level 1+ spells. You regain all expended slots when you finish a Long Rest.\nPrepared Spells of Level 1+. You prepare the list of level 1+ spells that are available for you to cast with this feature. To start, choose two level 1 Paladin spells. Heroism and Searing Smite are recommended.\nThe number of spells on your list increases as you gain Paladin levels, as shown in the Prepared Spells column of the Paladin Features table. Whenever that number increases, choose additional Paladin spells until the number of spells on your list matches the number in the Paladin Features table. The chosen spells must be of a level for which you have spell slots.\nIf another Paladin feature gives you spells that you always have prepared, those spells don\'t count against the number of spells you can prepare with this feature, but those spells otherwise count as Paladin spells for you.\nChanging Your Prepared Spells. Whenever you finish a Long Rest, you can replace one spell on your list with another Paladin spell for which you have spell slots.\nSpellcasting Ability. Charisma is your spellcasting ability for your Paladin spells.\nSpellcasting Focus. You can use a Holy Symbol as a Spellcasting Focus for your Paladin spells.',
        },
        {
          id: 'weapon-mastery',
          name: 'Weapon Mastery',
          description:
            'Your training with weapons allows you to use the mastery properties of two kinds of weapons of your choice with which you have proficiency, such as Longswords and Javelins.\nWhenever you finish a Long Rest, you can change the kinds of weapons you chose.',
        },
      ],
    },
    {
      level: 2,
      features: [
        {
          id: 'fighting-style',
          name: 'Fighting Style',
          description:
            'You gain a Fighting Style feat of your choice. Instead of choosing one of those feats, you can choose the Blessed Warrior option.\nBlessed Warrior. You learn two Cleric cantrips of your choice. Guidance and Sacred Flame are recommended. The chosen cantrips count as Paladin spells for you, and Charisma is your spellcasting ability for them. Whenever you gain a Paladin level, you can replace one of these cantrips with another Cleric cantrip.',
        },
        {
          id: 'paladins-smite',
          name: "Paladin's Smite",
          description:
            'You always have the Divine Smite spell prepared. In addition, you can cast it without expending a spell slot, but you must finish a Long Rest before you can cast it in this way again.',
        },
      ],
    },
    {
      level: 3,
      features: [
        {
          id: 'channel-divinity',
          name: 'Channel Divinity',
          description:
            'You can channel divine energy directly from the Outer Planes, using it to fuel magical effects. You start with one such effect: Divine Sense, which is described below. Other Paladin features give additional Channel Divinity effect options. Each time you use this class\'s Channel Divinity, you choose which effect from this class to create.\nYou can use this class\'s Channel Divinity twice. You regain one of its expended uses when you finish a Short Rest, and you regain all expended uses when you finish a Long Rest. You gain an additional use when you reach Paladin level 11.\nIf a Channel Divinity effect requires a saving throw, the DC equals the spell save DC from this class\'s Spellcasting feature.\nDivine Sense. As a Bonus Action, you can open your awareness to detect Celestials, Fiends, and Undead. For the next 10 minutes or until you have the Incapacitated condition, you know the location of any creature of those types within 60 feet of yourself, and you know its creature type. Within the same radius, you also detect the presence of any place or object that has been consecrated or desecrated, as with the Hallow spell.',
        },
        {
          id: 'paladin-subclass',
          name: 'Paladin Subclass',
          description:
            'You gain a Paladin subclass of your choice. The Oath of Devotion subclass is detailed in the SRD. A subclass is a specialization that grants you features at certain Paladin levels. For the rest of your career, you gain each of your subclass features that are of your Paladin level or lower.',
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
          id: 'faithful-steed',
          name: 'Faithful Steed',
          description:
            'You can call on the aid of an otherworldly steed. You always have the Find Steed spell prepared.\nYou can also cast the spell once without expending a spell slot, and you regain the ability to do so when you finish a Long Rest.',
        },
      ],
    },
    {
      level: 6,
      features: [
        {
          id: 'aura-of-protection',
          name: 'Aura of Protection',
          description:
            'You radiate a protective, unseeable aura in a 10-foot Emanation that originates from you. The aura is inactive while you have the Incapacitated condition.\nYou and your allies in the aura gain a bonus to saving throws equal to your Charisma modifier (minimum bonus of +1).\nIf another Paladin is present, a creature can benefit from only one Aura of Protection at a time; the creature chooses which aura while in them.',
        },
      ],
    },
    {
      level: 7,
      features: [
        {
          id: 'paladin-subclass-feature-7',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Paladin subclass.',
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
          id: 'abjure-foes',
          name: 'Abjure Foes',
          description:
            'As a Magic action, you can expend one use of this class\'s Channel Divinity to overwhelm foes with awe. As you present your Holy Symbol or weapon, you can target a number of creatures equal to your Charisma modifier (minimum of one creature) that you can see within 60 feet of yourself. Each target must succeed on a Wisdom saving throw or have the Frightened condition for 1 minute or until it takes any damage. While Frightened in this way, a target can do only one of the following on its turns: move, take an action, or take a Bonus Action.',
        },
      ],
    },
    {
      level: 10,
      features: [
        {
          id: 'aura-of-courage',
          name: 'Aura of Courage',
          description:
            'You and your allies have Immunity to the Frightened condition while in your Aura of Protection. If a Frightened ally enters the aura, that condition has no effect on that ally while there.',
        },
      ],
    },
    {
      level: 11,
      features: [
        {
          id: 'radiant-strikes',
          name: 'Radiant Strikes',
          description:
            'Your strikes now carry supernatural power. When you hit a target with an attack roll using a Melee weapon or an Unarmed Strike, the target takes an extra 1d8 Radiant damage.',
        },
        {
          id: 'channel-divinity-uses-3',
          name: 'Channel Divinity Improvement',
          description:
            'You can use Channel Divinity three times, as shown on the Paladin Features table.',
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
      level: 14,
      features: [
        {
          id: 'restoring-touch',
          name: 'Restoring Touch',
          description:
            'When you use Lay On Hands on a creature, you can also remove one or more of the following conditions from the creature: Blinded, Charmed, Deafened, Frightened, Paralyzed, or Stunned. You must expend 5 Hit Points from the healing pool of Lay On Hands for each of these conditions you remove; those points don\'t also restore Hit Points to the creature.',
        },
      ],
    },
    {
      level: 15,
      features: [
        {
          id: 'paladin-subclass-feature-15',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Paladin subclass.',
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
      level: 18,
      features: [
        {
          id: 'aura-expansion',
          name: 'Aura Expansion',
          description:
            'Your Aura of Protection is now a 30-foot Emanation.',
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
            'You gain an Epic Boon feat or another feat of your choice for which you qualify. Boon of Truesight is recommended.',
        },
      ],
    },
    {
      level: 20,
      features: [
        {
          id: 'paladin-subclass-feature-20',
          name: 'Subclass Feature',
          description: 'You gain a feature from your Paladin subclass.',
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
      options: PALADIN_SKILL_OPTIONS.map((skillId) => ({
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
        {
          id: 'blessed-warrior',
          label: 'Blessed Warrior',
          description:
            'You learn two Cleric cantrips of your choice. Guidance and Sacred Flame are recommended. The chosen cantrips count as Paladin spells for you, and Charisma is your spellcasting ability for them. Whenever you gain a Paladin level, you can replace one of these cantrips with another Cleric cantrip.',
          effects: [{ kind: 'fighting-style', styleId: 'blessed-warrior' }],
          spellEntitlements: [blessedWarriorCantripsEntitlement],
        },
      ],
    },
    {
      id: 'paladin-subclass',
      level: 3,
      prompt: 'Choose a Paladin Subclass',
      type: 'single-select',
      required: true,
      options: [subclassToChoiceOption(devotionSrd2024)],
    },
    createAsiChoiceDefinition('ability-score-improvement-4', 4),
    createAsiChoiceDefinition('ability-score-improvement-8', 8),
    createAsiChoiceDefinition('ability-score-improvement-12', 12),
    createAsiChoiceDefinition('ability-score-improvement-16', 16),
  ],
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
