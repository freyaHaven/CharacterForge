import type { FeatDefinition } from '../../../../domain/feat/types'
import { createAsiScoreIncreaseChoice } from '../../../../domain/feat/asiScoreIncreaseChoice'
import { SRD_2024_SOURCE } from '../source'

export const boonOfIrresistibleOffenseSrd2024: FeatDefinition = {
  id: 'srd-2024:boon-of-irresistible-offense',
  editionId: 'srd-2024',
  name: 'Boon of Irresistible Offense',
  summary: 'Ignore Bludgeoning, Piercing, and Slashing Resistance.',
  description:
    'You gain the following benefits. Ability Score Increase. Increase your Strength or Dexterity score by 1, to a maximum of 30. Overcome Defenses. The Bludgeoning, Piercing, and Slashing damage you deal always ignores Resistance. Overwhelming Strike. When you roll a 20 on the d20 for an attack roll, you can deal extra damage to the target equal to the ability score increased by this feat. The extra damage’s type is the same as the attack’s type.',
  source: SRD_2024_SOURCE,
  category: 'epic-boon',
  prerequisite: {
    kind: 'requirements',
    summary: 'Level 19+',
    requirements: [{ kind: 'min-character-level', level: 19 }],
  },
  benefits: [
    {
      id: 'ability-score-increase',
      name: 'Ability Score Increase',
      description:
        'Increase your Strength or Dexterity score by 1, to a maximum of 30.',
    },
    {
      id: 'overcome-defenses',
      name: 'Overcome Defenses',
      description:
        'The Bludgeoning, Piercing, and Slashing damage you deal always ignores Resistance.',
    },
    {
      id: 'overwhelming-strike',
      name: 'Overwhelming Strike',
      description:
        'When you roll a 20 on the d20 for an attack roll, you can deal extra damage to the target equal to the ability score increased by this feat. The extra damage’s type is the same as the attack’s type.',
    },
  ],
  repeatable: false,
  choices: [
    createAsiScoreIncreaseChoice({
      modes: ['plus-1'],
      abilities: ['strength', 'dexterity'],
      maximum: 30,
    }),
  ],
}
