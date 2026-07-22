import { describe, expect, it } from 'vitest'
import { selectAsiFeat } from '../../../domain/class/abilityScoreImprovement'
import { createSyntheticClassDefinition } from '../../../testing/syntheticClassDefinition'
import { skilledSrd2024 } from '../../../content/packs/srd-2024/feats/skilled'
import {
  createFeatGrantChoiceStorageKey,
  pruneOrphanFeatGrantChoiceKeys,
} from '../../../domain/feat/featGrantChoiceStorage'
import { validateFeatDefinitionChoices } from '../../../domain/feat/validateFeatChoices'
import { validateClassInstance } from '../../class/classRules'
import { pruneClassInstanceChoicesForLevel } from '../../../domain/class/pruneClassInstanceChoices'
import { createAsiChoiceDefinition } from '../../../domain/class/abilityScoreImprovement'

describe('skilled feat choices', () => {
  const skilledPicks = [
    'skill:athletics',
    'skill:perception',
    'tool:thieves-tools',
  ] as const

  it('validates incomplete Skilled nested choices on an ASI grant', () => {
    const definition = createSyntheticClassDefinition({
      choices: [createAsiChoiceDefinition('ability-score-improvement-4', 4)],
    })

    const result = validateClassInstance(
      {
        instanceId: 'fighter-1',
        classId: definition.id,
        level: 4,
        choices: {
          'ability-score-improvement-4': selectAsiFeat('srd-2024:skilled'),
        },
      },
      'srd-2024',
      definition,
      {
        featById: new Map([[skilledSrd2024.id, skilledSrd2024]]),
      },
    )

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContainEqual({
        sourceInstanceId: 'fighter-1',
        sourceClassId: definition.id,
        code: 'missing-required-choice',
        choiceId: 'ability-score-improvement-4',
        message: expect.any(String),
      })
    }
  })

  it('accepts complete Skilled nested companion choices', () => {
    const definition = createSyntheticClassDefinition({
      choices: [createAsiChoiceDefinition('ability-score-improvement-4', 4)],
    })
    const storageKey = createFeatGrantChoiceStorageKey(
      'ability-score-improvement-4',
      'skill-or-tool-proficiencies',
    )

    const result = validateClassInstance(
      {
        instanceId: 'fighter-1',
        classId: definition.id,
        level: 4,
        choices: {
          'ability-score-improvement-4': selectAsiFeat('srd-2024:skilled'),
          [storageKey]: [...skilledPicks],
        },
      },
      'srd-2024',
      definition,
      {
        featById: new Map([[skilledSrd2024.id, skilledSrd2024]]),
      },
    )

    expect(result).toEqual({ ok: true })
  })

  it('treats owned skills as invalid for Skilled picks', () => {
    expect(
      validateFeatDefinitionChoices(
        skilledSrd2024,
        { 'skill-or-tool-proficiencies': [...skilledPicks] },
        { ownedSkillIds: new Set(['athletics']) },
      ),
    ).toEqual([
      { code: 'already-proficient', choiceId: 'skill-or-tool-proficiencies' },
    ])
  })

  it('prunes Skilled companion keys when the ASI level is lost', () => {
    const definition = createSyntheticClassDefinition({
      choices: [createAsiChoiceDefinition('ability-score-improvement-4', 4)],
    })
    const storageKey = createFeatGrantChoiceStorageKey(
      'ability-score-improvement-4',
      'skill-or-tool-proficiencies',
    )

    const pruned = pruneClassInstanceChoicesForLevel(
      {
        instanceId: 'fighter-1',
        classId: definition.id,
        level: 4,
        choices: {
          'ability-score-improvement-4': selectAsiFeat('srd-2024:skilled'),
          [storageKey]: [...skilledPicks],
        },
      },
      definition,
      3,
    )

    expect(pruned.choices).toEqual({})
    expect(
      pruneOrphanFeatGrantChoiceKeys(
        {
          [storageKey]: [...skilledPicks],
        },
        new Set(),
      ),
    ).toEqual({})
  })
})
