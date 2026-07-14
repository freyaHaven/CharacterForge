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
            'You gain a Fighting Style feat of your choice. Choose one option below.',
        },
        {
          id: 'second-wind',
          name: 'Second Wind',
          description:
            'You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can take a Bonus Action to regain Hit Points equal to 1d10 plus your Fighter level. Once you use this feature, you cannot use it again until you finish a Short or Long Rest.',
        },
        {
          id: 'weapon-mastery',
          name: 'Weapon Mastery',
          description:
            'Your training with weapons allows you to use the mastery properties of weapons you are proficient with. Choose three kinds of weapons to master on the Equipment step. Starting equipment choices are also made there.',
        },
      ],
    },
  ],
  choices: [
    {
      id: 'fighting-style',
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
  ],
}
