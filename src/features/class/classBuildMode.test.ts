import { describe, expect, it } from 'vitest'
import type { ClassDefinition } from '../../domain/class/types'
import {
  createClassInstanceDraft,
  createEmptyClassSelectionDrafts,
} from './classSelectionDraft'
import {
  deriveMulticlassStage,
  filterCatalogForBuildMode,
  formatMulticlassLevelSummary,
  getUniqueClassIds,
  inferInitialBuildMode,
} from './classBuildMode'

describe('classBuildMode', () => {
  it('infers build mode from committed classes', () => {
    expect(inferInitialBuildMode([])).toBeNull()
    expect(
      inferInitialBuildMode([
        {
          instanceId: 'a',
          classId: 'srd-2024:fighter',
          level: 1,
          choices: {},
        },
      ]),
    ).toBe('single-class')
    expect(
      inferInitialBuildMode([
        {
          instanceId: 'a',
          classId: 'srd-2024:fighter',
          level: 1,
          choices: {},
        },
        {
          instanceId: 'b',
          classId: 'srd-2024:barbarian',
          level: 1,
          choices: {},
        },
      ]),
    ).toBe('multiclass')
  })

  it('does not infer single class when a second class is still being drafted', () => {
    const drafts = {
      ...createEmptyClassSelectionDrafts(),
      barbarian: createClassInstanceDraft('barbarian', 'srd-2024:barbarian'),
    }

    expect(
      inferInitialBuildMode(
        [
          {
            instanceId: 'fighter',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {},
          },
        ],
        drafts,
      ),
    ).toBe('multiclass')
  })

  it('derives multiclass stages from setup progress', () => {
    const drafts = createEmptyClassSelectionDrafts()

    expect(deriveMulticlassStage([], drafts, null)).toBe('select-classes')

    const withTwoClasses = {
      ...drafts,
      fighter: createClassInstanceDraft('fighter', 'srd-2024:fighter'),
      barbarian: createClassInstanceDraft('barbarian', 'srd-2024:barbarian'),
    }

    expect(deriveMulticlassStage([], withTwoClasses, null)).toBe(
      'starting-class',
    )

    expect(
      deriveMulticlassStage([], withTwoClasses, 'fighter'),
    ).toBe('configure')
  })

  it('tracks unique class ids across committed and draft instances', () => {
    const drafts = {
      ...createEmptyClassSelectionDrafts(),
      barbarian: createClassInstanceDraft('barbarian', 'srd-2024:barbarian'),
    }

    expect(
      getUniqueClassIds(
        [
          {
            instanceId: 'fighter',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {},
          },
        ],
        drafts,
      ),
    ).toEqual(['srd-2024:fighter', 'srd-2024:barbarian'])
  })

  it('hides preview classes in single-class catalogue filtering', () => {
    const classes = [
      {
        id: 'srd-2024:fighter',
        name: 'Fighter',
        catalogStatus: 'available' as const,
      },
      {
        id: 'srd-2024:barbarian',
        name: 'Barbarian',
        catalogStatus: 'preview' as const,
      },
    ]

    expect(filterCatalogForBuildMode(classes as ClassDefinition[], 'single-class')).toEqual([
      classes[0],
    ])
    expect(filterCatalogForBuildMode(classes as ClassDefinition[], 'multiclass')).toEqual(classes)
  })

  it('formats multiclass level summaries without allocation language', () => {
    const summary = formatMulticlassLevelSummary(
      [
        {
          instanceId: 'fighter',
          classId: 'srd-2024:fighter',
          level: 3,
          choices: {},
        },
        {
          instanceId: 'barbarian',
          classId: 'srd-2024:barbarian',
          level: 2,
          choices: {},
        },
      ],
      new Map([
        ['srd-2024:fighter', 'Fighter'],
        ['srd-2024:barbarian', 'Barbarian'],
      ]),
    )

    expect(summary).toBe('Fighter 3 + Barbarian 2')
  })
})
