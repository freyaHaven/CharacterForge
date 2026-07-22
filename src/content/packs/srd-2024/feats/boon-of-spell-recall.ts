import type { FeatDefinition } from '../../../../domain/feat/types'
import { createAsiScoreIncreaseChoice } from '../../../../domain/feat/asiScoreIncreaseChoice'
import { SRD_2024_SOURCE } from '../source'

export const boonOfSpellRecallSrd2024: FeatDefinition = {
  id: 'srd-2024:boon-of-spell-recall',
  editionId: 'srd-2024',
  name: 'Boon of Spell Recall',
  summary: 'Chance to not expend level 1–4 spell slots.',
  description:
    'You gain the following benefits. Ability Score Increase. Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 30. Free Casting. Whenever you cast a spell with a level 1–4 spell slot, roll 1d4. If the number you roll is the same as the slot’s level, the slot isn’t expended.',
  source: SRD_2024_SOURCE,
  category: 'epic-boon',
  prerequisite: {
    kind: 'requirements',
    summary: 'Level 19+, Spellcasting Feature',
    requirements: [
      { kind: 'min-character-level', level: 19 },
      { kind: 'has-spellcasting' },
    ],
  },
  benefits: [
    {
      id: 'ability-score-increase',
      name: 'Ability Score Increase',
      description:
        'Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 30.',
    },
    {
      id: 'free-casting',
      name: 'Free Casting',
      description:
        'Whenever you cast a spell with a level 1–4 spell slot, roll 1d4. If the number you roll is the same as the slot’s level, the slot isn’t expended.',
    },
  ],
  repeatable: false,
  choices: [
    createAsiScoreIncreaseChoice({
      modes: ['plus-1'],
      abilities: ['intelligence', 'wisdom', 'charisma'],
      maximum: 30,
    }),
  ],
}
