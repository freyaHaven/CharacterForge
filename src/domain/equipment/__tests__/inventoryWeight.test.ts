import { describe, expect, it } from 'vitest'
import type { EquipmentItemDefinition } from '../types'
import {
  calculateCarryingCapacityLb,
  calculateCarryingLoad,
  calculateEntryWeight,
  calculateInventoryWeight,
  calculateInventoryWeightFromEnriched,
  formatCarryingLoadSummary,
  formatEntryWeightDisplay,
  SRD_2024_CARRYING_CAPACITY_MULTIPLIER,
} from '../inventoryWeight'

function def(
  partial: Partial<EquipmentItemDefinition> &
    Pick<EquipmentItemDefinition, 'id' | 'name'>,
): EquipmentItemDefinition {
  return {
    editionId: 'srd-2024',
    category: 'gear',
    source: {
      id: 'test',
      name: 'Test',
      version: '1',
      licence: 'cc-by-4.0',
      attribution: 'test',
      documentUrl: 'https://example.test',
    },
    ...partial,
  }
}

const backpack = def({
  id: 'backpack',
  name: 'Backpack',
  category: 'container',
  isContainer: true,
  weightLb: 5,
})
const torch = def({ id: 'torch', name: 'Torch', weightLb: 1 })
const mystery = def({ id: 'mystery', name: 'Mystery', weightLb: undefined })
const arrows = def({
  id: 'arrows',
  name: 'Arrows',
  category: 'ammunition',
  weightLb: 0.05,
})
const pouch = def({
  id: 'pouch',
  name: 'Pouch',
  category: 'container',
  isContainer: true,
  weightLb: 1,
})

const catalog = new Map<string, EquipmentItemDefinition>([
  [backpack.id, backpack],
  [torch.id, torch],
  [mystery.id, mystery],
  [arrows.id, arrows],
  [pouch.id, pouch],
])

describe('inventoryWeight', () => {
  it('calculates single-entry and stacked weight', () => {
    const single = calculateEntryWeight(
      {
        instanceId: 'a',
        itemId: 'torch',
        quantity: 1,
        location: { kind: 'carried' },
      },
      catalog,
    )
    expect(single).toMatchObject({
      unitWeightLb: 1,
      stackWeightLb: 1,
      weightKnown: true,
    })

    const stacked = calculateEntryWeight(
      {
        instanceId: 'b',
        itemId: 'torch',
        quantity: 10,
        location: { kind: 'carried' },
      },
      catalog,
    )
    expect(stacked.stackWeightLb).toBe(10)
    expect(formatEntryWeightDisplay(stacked)).toEqual({
      stackLabel: '10 lb',
      unitLabel: '1 lb each',
    })
  })

  it('tracks mixed known and unknown weights as incomplete', () => {
    const breakdown = calculateInventoryWeight(
      [
        {
          instanceId: 't',
          itemId: 'torch',
          quantity: 2,
          location: { kind: 'carried' },
        },
        {
          instanceId: 'm',
          itemId: 'mystery',
          quantity: 1,
          location: { kind: 'carried' },
        },
      ],
      catalog,
    )

    expect(breakdown.knownTotalLb).toBe(2)
    expect(breakdown.unknownEntryCount).toBe(1)
    expect(breakdown.isComplete).toBe(false)
  })

  it('sums carried and container contents toward the same owned total', () => {
    const breakdown = calculateInventoryWeight(
      [
        {
          instanceId: 'pack',
          itemId: 'backpack',
          quantity: 1,
          location: { kind: 'carried' },
        },
        {
          instanceId: 't',
          itemId: 'torch',
          quantity: 3,
          location: { kind: 'container', containerInstanceId: 'pack' },
        },
        {
          instanceId: 'loose',
          itemId: 'arrows',
          quantity: 20,
          location: { kind: 'carried' },
        },
      ],
      catalog,
    )

    // 5 + 3 + 1 = 9
    expect(breakdown.knownTotalLb).toBe(9)
    expect(breakdown.carriedDirectKnownLb).toBe(6)
    expect(breakdown.byContainer.get('pack')?.knownContentsWeightLb).toBe(3)
  })

  it('aggregates nested container contents', () => {
    const breakdown = calculateInventoryWeight(
      [
        {
          instanceId: 'pack',
          itemId: 'backpack',
          quantity: 1,
          location: { kind: 'carried' },
        },
        {
          instanceId: 'pouch-1',
          itemId: 'pouch',
          quantity: 1,
          location: { kind: 'container', containerInstanceId: 'pack' },
        },
        {
          instanceId: 't',
          itemId: 'torch',
          quantity: 4,
          location: { kind: 'container', containerInstanceId: 'pouch-1' },
        },
      ],
      catalog,
    )

    expect(breakdown.knownTotalLb).toBe(10) // 5 + 1 + 4
    expect(breakdown.byContainer.get('pack')?.knownContentsWeightLb).toBe(5) // pouch + torches
    expect(breakdown.byContainer.get('pouch-1')?.knownContentsWeightLb).toBe(4)
  })

  it('counts duplicate item instances separately', () => {
    const breakdown = calculateInventoryWeight(
      [
        {
          instanceId: 't1',
          itemId: 'torch',
          quantity: 2,
          location: { kind: 'carried' },
        },
        {
          instanceId: 't2',
          itemId: 'torch',
          quantity: 3,
          location: { kind: 'carried' },
        },
      ],
      catalog,
    )
    expect(breakdown.knownTotalLb).toBe(5)
    expect(breakdown.entries).toHaveLength(2)
  })

  it('handles empty inventory', () => {
    const breakdown = calculateInventoryWeight([], catalog)
    expect(breakdown.knownTotalLb).toBe(0)
    expect(breakdown.isComplete).toBe(true)
    expect(breakdown.unknownEntryCount).toBe(0)

    const load = calculateCarryingLoad(breakdown, 12)
    expect(load.capacityLb).toBe(180)
    expect(load.status).toBe('under-capacity')
  })

  it('treats unknown catalogue entries as unknown weight', () => {
    const breakdown = calculateInventoryWeight(
      [
        {
          instanceId: 'x',
          itemId: 'missing-item',
          quantity: 1,
          location: { kind: 'carried' },
        },
      ],
      catalog,
    )
    expect(breakdown.knownTotalLb).toBe(0)
    expect(breakdown.unknownEntryCount).toBe(1)
    expect(breakdown.isComplete).toBe(false)
  })

  it('records invalid container references without crashing', () => {
    const breakdown = calculateInventoryWeight(
      [
        {
          instanceId: 't',
          itemId: 'torch',
          quantity: 1,
          location: {
            kind: 'container',
            containerInstanceId: 'gone-container',
          },
        },
      ],
      catalog,
    )
    expect(breakdown.invalidContainerRefs).toEqual(['t'])
    expect(breakdown.knownTotalLb).toBe(1)
  })

  it('handles containment cycles safely', () => {
    const breakdown = calculateInventoryWeight(
      [
        {
          instanceId: 'a',
          itemId: 'backpack',
          quantity: 1,
          location: { kind: 'container', containerInstanceId: 'b' },
        },
        {
          instanceId: 'b',
          itemId: 'pouch',
          quantity: 1,
          location: { kind: 'container', containerInstanceId: 'a' },
        },
        {
          instanceId: 't',
          itemId: 'torch',
          quantity: 2,
          location: { kind: 'container', containerInstanceId: 'a' },
        },
      ],
      catalog,
    )

    expect(breakdown.cycleDetected).toBe(true)
    expect(breakdown.knownTotalLb).toBe(8) // 5 + 1 + 2 still counted as owned
    expect(breakdown.byContainer.get('a')?.knownContentsWeightLb).toBeGreaterThan(
      0,
    )
  })

  it('handles self-referential container cycles', () => {
    const breakdown = calculateInventoryWeight(
      [
        {
          instanceId: 'loop',
          itemId: 'backpack',
          quantity: 1,
          location: { kind: 'container', containerInstanceId: 'loop' },
        },
      ],
      catalog,
    )
    expect(breakdown.cycleDetected).toBe(true)
    expect(breakdown.knownTotalLb).toBe(5)
  })

  it('derives carrying capacity from Strength × 15', () => {
    expect(SRD_2024_CARRYING_CAPACITY_MULTIPLIER).toBe(15)
    expect(calculateCarryingCapacityLb(10)).toBe(150)
    expect(calculateCarryingCapacityLb(15)).toBe(225)
    expect(calculateCarryingCapacityLb(Number.NaN)).toBe(0)
  })

  it('reports under, exact, and overloaded carrying states', () => {
    const under = calculateCarryingLoad(
      { knownTotalLb: 40, unknownEntryCount: 0, isComplete: true },
      10,
    )
    expect(under).toMatchObject({
      capacityLb: 150,
      remainingLb: 110,
      overloaded: false,
      status: 'under-capacity',
    })

    const exact = calculateCarryingLoad(
      { knownTotalLb: 150, unknownEntryCount: 0, isComplete: true },
      10,
    )
    expect(exact.status).toBe('at-capacity')
    expect(exact.remainingLb).toBe(0)

    const over = calculateCarryingLoad(
      { knownTotalLb: 162, unknownEntryCount: 0, isComplete: true },
      10,
    )
    expect(over.overloaded).toBe(true)
    expect(over.status).toBe('overloaded')
    expect(over.remainingLb).toBe(-12)
  })

  it('formats incomplete and overloaded summary copy', () => {
    const incomplete = calculateCarryingLoad(
      { knownTotalLb: 47, unknownEntryCount: 2, isComplete: false },
      12,
    )
    const summary = formatCarryingLoadSummary(incomplete, 2)
    expect(summary.primary).toBe('At least 47 lb / 180 lb')
    expect(summary.detail).toBe('2 items have unknown weight')
    expect(summary.statusLabel).toContain('remaining')

    const overloaded = calculateCarryingLoad(
      { knownTotalLb: 192, unknownEntryCount: 0, isComplete: true },
      12,
    )
    expect(formatCarryingLoadSummary(overloaded, 0).statusLabel).toBe(
      '12 lb over carrying capacity',
    )
  })

  it('accepts enriched entries without mutating them', () => {
    const entries = [
      {
        instanceId: 'a',
        itemId: 'torch',
        quantity: 3,
        location: { kind: 'carried' as const },
        weightLb: 1,
        isContainer: false,
      },
    ]
    const snapshot = structuredClone(entries)
    const breakdown = calculateInventoryWeightFromEnriched(entries)
    expect(breakdown.knownTotalLb).toBe(3)
    expect(entries).toEqual(snapshot)
  })
})
