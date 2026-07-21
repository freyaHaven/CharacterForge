import type { FeatDefinition } from '../../../../domain/feat/types'
import { SRD_2024_SOURCE } from '../source'

export const boonOfCombatProwessSrd2024: FeatDefinition = {
  id: 'srd-2024:boon-of-combat-prowess',
  editionId: 'srd-2024',
  name: 'Boon of Combat Prowess',
  summary: 'Turn a miss into a hit once per turn.',
  description:
    'You gain the following benefits. Ability Score Increase. Increase one ability score of your choice by 1, to a maximum of 30. Peerless Aim. When you miss with an attack roll, you can hit instead. Once you use this benefit, you can’t use it again until the start of your next turn.',
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
        'Increase one ability score of your choice by 1, to a maximum of 30.',
    },
    {
      id: 'peerless-aim',
      name: 'Peerless Aim',
      description:
        'When you miss with an attack roll, you can hit instead. Once you use this benefit, you can’t use it again until the start of your next turn.',
    },
  ],
  repeatable: false,
  choices: [],
}
