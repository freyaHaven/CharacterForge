import type { ClassChoiceOption } from '../../../../domain/class/types'
import {
  pactOfTheTomeCantripsEntitlement,
  pactOfTheTomeRitualsEntitlement,
} from '../spellcasting/warlock'

const ELDRITCH_INVOCATIONS_CHOICE_ID = 'eldritch-invocations' as const

function levelPrereq(level: number) {
  return { kind: 'min-source-level' as const, level }
}

function requiresInvocation(optionId: string) {
  return {
    kind: 'requires-selected-option' as const,
    choiceId: ELDRITCH_INVOCATIONS_CHOICE_ID,
    optionId,
  }
}

function numberedRepeat(
  base: ClassChoiceOption,
  copies: number,
): ClassChoiceOption[] {
  const options: ClassChoiceOption[] = [{ ...base, repeatable: true }]
  for (let index = 2; index <= copies; index += 1) {
    options.push({
      ...base,
      id: `${base.id}-${index}`,
      label: `${base.label} (${index})`,
      repeatable: true,
    })
  }
  return options
}

const AGONIZING_BLAST: ClassChoiceOption = {
  id: 'agonizing-blast',
  label: 'Agonizing Blast',
  description:
    'Prerequisite: Level 2+ Warlock, a Warlock cantrip that deals damage. Choose one of your known Warlock cantrips that deals damage. You can add your Charisma modifier to that spell\'s damage rolls. Repeatable — choose a different eligible cantrip each time.',
  prerequisites: [levelPrereq(2)],
  repeatable: true,
}

const ELDRITCH_SPEAR: ClassChoiceOption = {
  id: 'eldritch-spear',
  label: 'Eldritch Spear',
  description:
    'Prerequisite: Level 2+ Warlock, a Warlock cantrip that deals damage with a range of 10+ feet. Choose one such cantrip. When you cast it, its range increases by 30 feet × your Warlock level. Repeatable.',
  prerequisites: [levelPrereq(2)],
  repeatable: true,
}

const REPELLING_BLAST: ClassChoiceOption = {
  id: 'repelling-blast',
  label: 'Repelling Blast',
  description:
    'Prerequisite: Level 2+ Warlock, a Warlock cantrip that deals damage via an attack roll. Choose one such cantrip. When you hit a Large or smaller creature with that cantrip, you can push the creature up to 10 feet straight away from you. Repeatable.',
  prerequisites: [levelPrereq(2)],
  repeatable: true,
}

const LESSONS_OF_THE_FIRST_ONES: ClassChoiceOption = {
  id: 'lessons-of-the-first-ones',
  label: 'Lessons of the First Ones',
  description:
    'Prerequisite: Level 2+ Warlock. You have received an Origin feat of your choice. Repeatable — choose a different Origin feat each time.',
  prerequisites: [levelPrereq(2)],
  repeatable: true,
}

const BASE_INVOCATIONS: ClassChoiceOption[] = [
  {
    id: 'armor-of-shadows',
    label: 'Armor of Shadows',
    description:
      'You can cast Mage Armor on yourself without expending a spell slot.',
  },
  {
    id: 'ascendant-step',
    label: 'Ascendant Step',
    description:
      'Prerequisite: Level 5+ Warlock. You can cast Levitate on yourself without expending a spell slot.',
    prerequisites: [levelPrereq(5)],
  },
  {
    id: 'devils-sight',
    label: "Devil's Sight",
    description:
      'Prerequisite: Level 2+ Warlock. You can see normally in Dim Light and Darkness—both magical and nonmagical—within 120 feet of yourself.',
    prerequisites: [levelPrereq(2)],
  },
  {
    id: 'devouring-blade',
    label: 'Devouring Blade',
    description:
      'Prerequisite: Level 12+ Warlock, Thirsting Blade. The Extra Attack of your Thirsting Blade invocation confers two extra attacks rather than one.',
    prerequisites: [levelPrereq(12), requiresInvocation('thirsting-blade')],
  },
  {
    id: 'eldritch-mind',
    label: 'Eldritch Mind',
    description:
      'You have Advantage on Constitution saving throws that you make to maintain Concentration.',
  },
  {
    id: 'eldritch-smite',
    label: 'Eldritch Smite',
    description:
      'Prerequisite: Level 5+ Warlock, Pact of the Blade. Once per turn when you hit a creature with your pact weapon, you can expend a Pact Magic spell slot to deal an extra 1d8 Force damage to the target, plus another 1d8 per level of the spell slot, and you can give the target the Prone condition if it is Huge or smaller.',
    prerequisites: [levelPrereq(5), requiresInvocation('pact-of-the-blade')],
  },
  {
    id: 'fiendish-vigor',
    label: 'Fiendish Vigor',
    description:
      'Prerequisite: Level 2+ Warlock. You can cast False Life on yourself without expending a spell slot. When you cast the spell with this feature, you don\'t roll the die for the Temporary Hit Points; you automatically get the highest number on the die.',
    prerequisites: [levelPrereq(2)],
  },
  {
    id: 'gaze-of-two-minds',
    label: 'Gaze of Two Minds',
    description:
      'Prerequisite: Level 5+ Warlock. You can use a Bonus Action to touch a willing Humanoid and perceive through its senses until the end of your next turn. As long as the creature is on the same plane of existence as you, you can use a Bonus Action on subsequent turns to maintain this connection, extending the duration until the end of your next turn. The connection ends if you or the creature are no longer on the same plane, if either of you takes psychic damage, or if you are Incapacitated or die. While perceiving through the other creature\'s senses, you benefit from any special senses it has, and you can speak through its mouth in your own voice even if it can\'t speak.',
    prerequisites: [levelPrereq(5)],
  },
  {
    id: 'gift-of-the-depths',
    label: 'Gift of the Depths',
    description:
      'Prerequisite: Level 5+ Warlock. You can breathe underwater, and you gain a Swim Speed equal to your Speed. You can also cast Water Breathing once without expending a spell slot. You regain the ability to cast it this way when you finish a Long Rest.',
    prerequisites: [levelPrereq(5)],
  },
  {
    id: 'gift-of-the-protectors',
    label: 'Gift of the Protectors',
    description:
      'Prerequisite: Level 9+ Warlock, Pact of the Tome. A new page appears in your Book of Shadows. When you or a creature you can see within 30 feet of you that is named on the page would drop to 0 Hit Points but not be killed outright, that creature can drop to 1 Hit Point instead. Once a creature benefits from this invocation, that creature can\'t benefit from it again until you finish a Long Rest.',
    prerequisites: [levelPrereq(9), requiresInvocation('pact-of-the-tome')],
  },
  {
    id: 'lifedrinker',
    label: 'Lifedrinker',
    description:
      'Prerequisite: Level 9+ Warlock, Pact of the Blade. Once per turn when you hit a creature with your pact weapon, you can deal an extra 1d8 Necrotic, Psychic, or Radiant damage (your choice) to the creature, and you can expend one of your Hit Point Dice to roll it and regain a number of Hit Points equal to the roll plus your Constitution modifier (minimum of 1 Hit Point).',
    prerequisites: [levelPrereq(9), requiresInvocation('pact-of-the-blade')],
  },
  {
    id: 'mask-of-many-faces',
    label: 'Mask of Many Faces',
    description:
      'You can cast Disguise Self without expending a spell slot.',
  },
  {
    id: 'master-of-myriad-forms',
    label: 'Master of Myriad Forms',
    description:
      'Prerequisite: Level 5+ Warlock. You can cast Alter Self without expending a spell slot.',
    prerequisites: [levelPrereq(5)],
  },
  {
    id: 'misty-visions',
    label: 'Misty Visions',
    description:
      'You can cast Silent Image without expending a spell slot.',
  },
  {
    id: 'one-with-shadows',
    label: 'One with Shadows',
    description:
      'Prerequisite: Level 5+ Warlock. While you\'re in an area of Dim Light or Darkness, you can cast Invisibility on yourself without expending a spell slot.',
    prerequisites: [levelPrereq(5)],
  },
  {
    id: 'otherworldly-leap',
    label: 'Otherworldly Leap',
    description:
      'Prerequisite: Level 2+ Warlock. You can cast Jump on yourself without expending a spell slot.',
    prerequisites: [levelPrereq(2)],
  },
  {
    id: 'pact-of-the-blade',
    label: 'Pact of the Blade',
    description:
      'As a Bonus Action, you can conjure a pact weapon in your hand—a Simple or Martial Melee weapon of your choice with which you bond—or create a bond with a magic weapon you touch. Until the bond ends, you have proficiency with the weapon, can use it as a Spellcasting Focus, and can use Charisma for attack and damage rolls. Character Forge records the weapon type choice and proficiency; conjuring during play is not tracked.',
  },
  {
    id: 'pact-of-the-chain',
    label: 'Pact of the Chain',
    description:
      'You learn the Find Familiar spell and can cast it as a Magic action without expending a spell slot. When you cast it, you can choose a normal familiar form or Imp, Pseudodragon, Quasit, Skeleton, Sphinx of Wonder, Sprite, or Venomous Snake. Character Forge records the familiar form choice; summoning during play is not tracked.',
    spellEntitlements: [
      {
        id: 'pact-of-the-chain-find-familiar',
        kind: 'granted',
        countsAgainstLimit: false,
        appliesTo: 'prepared',
        spells: [{ spellId: 'srd-2024:find-familiar', minLevel: 1 }],
      },
    ],
  },
  {
    id: 'pact-of-the-tome',
    label: 'Pact of the Tome',
    description:
      'You conjure a Book of Shadows. Choose three cantrips and two level 1 ritual spells from any class\'s spell list. While the book is on your person, you have those spells prepared as Warlock spells. You can use the book as a Spellcasting Focus.',
    spellEntitlements: [
      pactOfTheTomeCantripsEntitlement,
      pactOfTheTomeRitualsEntitlement,
    ],
  },
  {
    id: 'thirsting-blade',
    label: 'Thirsting Blade',
    description:
      'Prerequisite: Level 5+ Warlock, Pact of the Blade. You gain the Extra Attack feature for your pact weapon only — you can attack twice with it when you take the Attack action.',
    prerequisites: [levelPrereq(5), requiresInvocation('pact-of-the-blade')],
  },
  {
    id: 'visions-of-distant-realms',
    label: 'Visions of Distant Realms',
    description:
      'Prerequisite: Level 9+ Warlock. You can cast Arcane Eye without expending a spell slot.',
    prerequisites: [levelPrereq(9)],
  },
  {
    id: 'whispers-of-the-grave',
    label: 'Whispers of the Grave',
    description:
      'Prerequisite: Level 7+ Warlock. You can cast Speak with Dead without expending a spell slot.',
    prerequisites: [levelPrereq(7)],
  },
  {
    id: 'witch-sight',
    label: 'Witch Sight',
    description:
      'Prerequisite: Level 15+ Warlock. You have Truesight with a range of 30 feet.',
    prerequisites: [levelPrereq(15)],
  },
]

/**
 * All SRD 2024 Eldritch Invocation options (including numbered repeats).
 * Pact Boons are invocations (Blade / Chain / Tome), not a separate branch.
 */
export const ELDRITCH_INVOCATION_OPTIONS: ClassChoiceOption[] = [
  ...numberedRepeat(AGONIZING_BLAST, 3),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'armor-of-shadows'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'ascendant-step'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'devils-sight'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'devouring-blade'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'eldritch-mind'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'eldritch-smite'),
  ...numberedRepeat(ELDRITCH_SPEAR, 3),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'fiendish-vigor'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'gaze-of-two-minds'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'gift-of-the-depths'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'gift-of-the-protectors'),
  ...numberedRepeat(LESSONS_OF_THE_FIRST_ONES, 3),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'lifedrinker'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'mask-of-many-faces'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'master-of-myriad-forms'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'misty-visions'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'one-with-shadows'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'otherworldly-leap'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'pact-of-the-blade'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'pact-of-the-chain'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'pact-of-the-tome'),
  ...numberedRepeat(REPELLING_BLAST, 3),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'thirsting-blade'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'visions-of-distant-realms'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'whispers-of-the-grave'),
  ...BASE_INVOCATIONS.filter((option) => option.id === 'witch-sight'),
]

export const ELDRITCH_INVOCATIONS_CHOICE = ELDRITCH_INVOCATIONS_CHOICE_ID

/** Unique base invocation ids (excluding numbered repeats). */
export const SRD_ELDRITCH_INVOCATION_BASE_IDS = [
  'agonizing-blast',
  'armor-of-shadows',
  'ascendant-step',
  'devils-sight',
  'devouring-blade',
  'eldritch-mind',
  'eldritch-smite',
  'eldritch-spear',
  'fiendish-vigor',
  'gaze-of-two-minds',
  'gift-of-the-depths',
  'gift-of-the-protectors',
  'lessons-of-the-first-ones',
  'lifedrinker',
  'mask-of-many-faces',
  'master-of-myriad-forms',
  'misty-visions',
  'one-with-shadows',
  'otherworldly-leap',
  'pact-of-the-blade',
  'pact-of-the-chain',
  'pact-of-the-tome',
  'repelling-blast',
  'thirsting-blade',
  'visions-of-distant-realms',
  'whispers-of-the-grave',
  'witch-sight',
] as const
