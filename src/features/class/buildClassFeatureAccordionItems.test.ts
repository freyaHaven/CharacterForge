import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../content/packs/srd-2024/classes/fighter'
import { buildClassFeatureAccordionItems } from './buildClassFeatureAccordionItems'
import { formatOrdinalLevel } from './formatClassFeatureMeta'

describe('formatOrdinalLevel', () => {
  it('formats common ordinals', () => {
    expect(formatOrdinalLevel(1)).toBe('1st level')
    expect(formatOrdinalLevel(2)).toBe('2nd level')
    expect(formatOrdinalLevel(3)).toBe('3rd level')
    expect(formatOrdinalLevel(4)).toBe('4th level')
    expect(formatOrdinalLevel(11)).toBe('11th level')
    expect(formatOrdinalLevel(21)).toBe('21st level')
  })
})

describe('buildClassFeatureAccordionItems', () => {
  it('puts core traits first and flattens features for the active level', () => {
    const items = buildClassFeatureAccordionItems(fighterSrd2024, 1, {})

    expect(items.map((item) => item.title)).toEqual([
      'Core Fighter Traits',
      'Fighting Style',
      'Second Wind',
      'Weapon Mastery',
    ])
    expect(items[0]).toMatchObject({
      choiceCountLabel: '2 choices',
      levelLabel: '1st level',
      completion: 'incomplete',
    })
    expect(items[1]).toMatchObject({
      choiceCountLabel: '1 choice',
      levelLabel: '1st level',
      completion: 'incomplete',
    })
    expect(items[2]).toMatchObject({
      choiceCountLabel: null,
      completion: 'granted',
    })
    expect(items[3]).toMatchObject({
      choiceCountLabel: '3 choices',
      levelLabel: '1st level',
      completion: 'incomplete',
    })
  })

  it('shows additional weapon mastery as a separate accordion at level 4', () => {
    const items = buildClassFeatureAccordionItems(fighterSrd2024, 4, {
      'weapon-mastery': ['longsword', 'shortbow', 'battleaxe'],
    })

    expect(
      items
        .filter((item) => item.title.startsWith('Weapon Mastery'))
        .map((item) => ({
          title: item.title,
          choiceCountLabel: item.choiceCountLabel,
          levelLabel: item.levelLabel,
          completion: item.completion,
        })),
    ).toEqual([
      {
        title: 'Weapon Mastery',
        choiceCountLabel: '3 choices',
        levelLabel: '1st level',
        completion: 'complete',
      },
      {
        title: 'Weapon Mastery (Additional)',
        choiceCountLabel: '1 choice',
        levelLabel: '4th level',
        completion: 'incomplete',
      },
    ])
  })

  it('keeps a stable subclass title and summarizes the selection', () => {
    const items = buildClassFeatureAccordionItems(fighterSrd2024, 3, {
      'fighter-subclass': 'champion',
    })

    const subclass = items.find((item) => item.title === 'Fighter Subclass')
    expect(subclass).toBeDefined()
    expect(subclass?.summaryLabel).toBe('Champion')
    expect(subclass?.grantedFeatures.map((feature) => feature.name)).toEqual([
      'Improved Critical',
      'Remarkable Athlete',
    ])
  })

  it('summarizes completed choices and shows only level for granted features', () => {
    const items = buildClassFeatureAccordionItems(fighterSrd2024, 1, {
      'fighting-style': 'defense',
      'skill-proficiencies': ['athletics', 'perception'],
      'weapon-mastery': ['longsword', 'shortbow', 'battleaxe'],
    })

    expect(items.find((item) => item.title === 'Fighting Style')).toMatchObject({
      summaryLabel: 'Defense',
      choiceCountLabel: '1 choice',
      levelLabel: '1st level',
      completion: 'complete',
    })
    expect(items.find((item) => item.title === 'Second Wind')).toMatchObject({
      summaryLabel: null,
      choiceCountLabel: null,
      levelLabel: '1st level',
      completion: 'granted',
    })
  })

  it('summarizes completed ASI choices', () => {
    const items = buildClassFeatureAccordionItems(
      fighterSrd2024,
      4,
      {
        'fighting-style': 'defense',
        'skill-proficiencies': ['athletics', 'perception'],
        'weapon-mastery': ['longsword', 'shortbow', 'battleaxe'],
        'weapon-mastery-weapons-4': ['greatsword'],
        'fighter-subclass': 'champion',
        'ability-score-improvement-4': 'plus-2:strength',
      },
      new Map([['savage-attacker', 'Savage Attacker']]),
    )

    expect(
      items.find((item) => item.title === 'Ability Score Improvement'),
    ).toMatchObject({
      summaryLabel: 'STR +2',
      completion: 'complete',
    })
  })

  it('resolves placeholder subclass features from the selected subclass', () => {
    const items = buildClassFeatureAccordionItems(fighterSrd2024, 7, {
      'fighter-subclass': 'champion',
    })

    const additionalFightingStyle = items.find(
      (item) => item.title === 'Additional Fighting Style',
    )
    expect(additionalFightingStyle).toMatchObject({
      description: 'You gain another Fighting Style feat of your choice.',
      completion: 'granted',
    })
  })
})
