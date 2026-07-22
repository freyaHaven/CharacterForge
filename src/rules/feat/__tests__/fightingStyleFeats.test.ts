import { describe, expect, it } from 'vitest'
import { defenseSrd2024 } from '../../../content/packs/srd-2024/feats/defense'
import { archerySrd2024 } from '../../../content/packs/srd-2024/feats/archery'
import {
  getFightingStyleFeatIdFromChoiceValue,
  isCompleteFightingStyleChoiceValue,
  selectFightingStyleFeat,
  createFightingStyleChoiceDefinition,
} from '../../../domain/class/fightingStyle'
import { getChoicesAvailableAtLevel } from '../../../domain/class/choiceAvailability'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import { pruneClassInstanceChoicesForLevel } from '../../../domain/class/pruneClassInstanceChoices'
import {
  resolveArmorClassBonusFromFeatEffects,
  resolveFeatDefinitionEffects,
} from '../resolveFeatEffects'

describe('fighting style feats (P2.2)', () => {
  it('maps legacy bare option ids and feat encodings to catalogue ids', () => {
    expect(getFightingStyleFeatIdFromChoiceValue('defense')).toBe(
      'srd-2024:defense',
    )
    expect(
      getFightingStyleFeatIdFromChoiceValue(selectFightingStyleFeat('srd-2024:archery')),
    ).toBe('srd-2024:archery')
    expect(getFightingStyleFeatIdFromChoiceValue('blessed-warrior')).toBeNull()
  })

  it('treats Blessed Warrior as a complete alternate on Paladin-style choices', () => {
    const choice = createFightingStyleChoiceDefinition({
      level: 2,
      alternateOptions: [
        {
          id: 'blessed-warrior',
          label: 'Blessed Warrior',
        },
      ],
    })

    expect(isCompleteFightingStyleChoiceValue(choice, 'blessed-warrior')).toBe(
      true,
    )
    expect(isCompleteFightingStyleChoiceValue(choice, 'defense')).toBe(true)
    expect(
      isCompleteFightingStyleChoiceValue(
        choice,
        selectFightingStyleFeat(defenseSrd2024.id),
      ),
    ).toBe(true)
  })

  it('exposes Champion Additional Fighting Style only when Champion is selected', () => {
    const withoutChampion = getChoicesAvailableAtLevel(fighterSrd2024, 7, {
      'fighter-subclass': 'eldritch-knight',
    }).map((choice) => choice.id)

    expect(withoutChampion).not.toContain('champion-additional-fighting-style')

    const withChampion = getChoicesAvailableAtLevel(fighterSrd2024, 7, {
      'fighter-subclass': 'champion',
    }).map((choice) => choice.id)

    expect(withChampion).toContain('champion-additional-fighting-style')
  })

  it('prunes Champion Additional Fighting Style when subclass changes', () => {
    const pruned = pruneClassInstanceChoicesForLevel(
      {
        instanceId: 'fighter-1',
        classId: fighterSrd2024.id,
        level: 7,
        choices: {
          'fighter-subclass': 'champion',
          'champion-additional-fighting-style': selectFightingStyleFeat(
            archerySrd2024.id,
          ),
        },
      },
      fighterSrd2024,
      7,
    )

    // Still champion — keep
    expect(pruned.choices['champion-additional-fighting-style']).toBe(
      selectFightingStyleFeat(archerySrd2024.id),
    )

    const afterSubclassChange = pruneClassInstanceChoicesForLevel(
      {
        ...pruned,
        choices: {
          ...pruned.choices,
          'fighter-subclass': 'not-champion',
        },
      },
      fighterSrd2024,
      7,
    )

    expect(
      afterSubclassChange.choices['champion-additional-fighting-style'],
    ).toBeUndefined()
  })

  it('applies Defense AC bonus only while wearing armour, once', () => {
    const effects = [
      ...resolveFeatDefinitionEffects(defenseSrd2024),
      ...resolveFeatDefinitionEffects(defenseSrd2024),
    ]

    expect(resolveArmorClassBonusFromFeatEffects(effects, false)).toBe(0)
    expect(resolveArmorClassBonusFromFeatEffects(effects, true)).toBe(1)
  })
})
