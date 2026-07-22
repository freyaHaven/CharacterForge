import { describe, expect, it } from 'vitest'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import {
  evaluateFeatForEntitlement,
  partitionFeatCatalogue,
  type FeatEntitlementPolicy,
} from '../catalogueEligibility'
import type { FeatEligibilityContext } from '../eligibility'

const baseContext: FeatEligibilityContext = {
  characterLevel: 4,
  abilityScores: {
    strength: 16,
    dexterity: 14,
    constitution: 14,
    intelligence: 10,
    wisdom: 12,
    charisma: 10,
  },
  hasSpellcasting: false,
  hasFightingStyle: true,
  takenFeatIds: [],
}

describe('partitionFeatCatalogue', () => {
  it('hides Epic Boons before a valid entitlement by default', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')
    const policy: FeatEntitlementPolicy = { kind: 'any-qualifying' }
    const lowLevel = { ...baseContext, characterLevel: 4 }

    const result = partitionFeatCatalogue({
      feats,
      context: lowLevel,
      policy,
      showUnavailable: false,
    })

    expect(
      result.visible.some((entry) => entry.definition.category === 'epic-boon'),
    ).toBe(false)
    expect(
      result.hiddenUnavailable.some(
        (entry) => entry.definition.category === 'epic-boon',
      ),
    ).toBe(true)
  })

  it('restricts Origin-only entitlements to Origin feats', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')
    const result = partitionFeatCatalogue({
      feats,
      context: { ...baseContext, characterLevel: 20, hasSpellcasting: true },
      policy: { kind: 'category', category: 'origin' },
      showUnavailable: false,
    })

    expect(
      result.visible.every((entry) => entry.definition.category === 'origin'),
    ).toBe(true)
    expect(
      result.hiddenUnavailable.some(
        (entry) => entry.definition.category === 'general',
      ),
    ).toBe(true)
    expect(
      result.hiddenUnavailable.some(
        (entry) => entry.definition.category === 'epic-boon',
      ),
    ).toBe(true)
  })

  it('filters Fighting Style entitlements to fighting-style feats', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')
    const result = partitionFeatCatalogue({
      feats,
      context: baseContext,
      policy: { kind: 'category', category: 'fighting-style' },
      showUnavailable: false,
    })

    expect(result.visible.length).toBeGreaterThan(0)
    expect(
      result.visible.every(
        (entry) => entry.definition.category === 'fighting-style',
      ),
    ).toBe(true)
  })

  it('exposes unavailable feats with reasons when toggled on', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')
    const result = partitionFeatCatalogue({
      feats,
      context: { ...baseContext, characterLevel: 1 },
      policy: { kind: 'any-qualifying' },
      showUnavailable: true,
    })

    const grappler = result.visible.find(
      (entry) => entry.definition.id === 'srd-2024:grappler',
    )
    expect(grappler?.eligibility.eligible).toBe(false)
    expect(grappler?.eligibility).toMatchObject({
      eligible: false,
      reason: expect.stringMatching(/level|Requires/i),
    })
  })

  it('keeps committed invalid selections visible and clearable', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')
    const result = partitionFeatCatalogue({
      feats,
      context: { ...baseContext, characterLevel: 1 },
      policy: { kind: 'any-qualifying' },
      selectedFeatId: 'srd-2024:grappler',
      showUnavailable: false,
    })

    const retained = result.visible.find(
      (entry) => entry.definition.id === 'srd-2024:grappler',
    )
    expect(retained?.retainedInvalid).toBe(true)
    expect(retained?.eligibility.eligible).toBe(false)
  })

  it('excludes already-owned non-repeatable feats from the default list', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')
    const result = partitionFeatCatalogue({
      feats,
      context: {
        ...baseContext,
        takenFeatIds: ['srd-2024:alert'],
      },
      policy: { kind: 'category', category: 'origin' },
      showUnavailable: false,
    })

    expect(
      result.visible.some((entry) => entry.definition.id === 'srd-2024:alert'),
    ).toBe(false)
  })

  it('hides redundant feats by default and surfaces them when toggled', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')
    const inventory = {
      tokens: [
        {
          kind: 'spell-list-access' as const,
          id: 'srd-2024:spell-list:wizard',
          source: { label: 'Wizard', kind: 'class' },
          how: 'fixed' as const,
        },
      ],
    }

    const hidden = partitionFeatCatalogue({
      feats,
      context: { ...baseContext, characterLevel: 1, hasSpellcasting: true },
      policy: { kind: 'category', category: 'origin' },
      showUnavailable: false,
      showRedundant: false,
      capabilityInventory: inventory,
    })

    expect(
      hidden.visible.some(
        (entry) => entry.definition.id === 'srd-2024:magic-initiate-wizard',
      ),
    ).toBe(false)
    expect(
      hidden.hiddenRedundant.some(
        (entry) => entry.definition.id === 'srd-2024:magic-initiate-wizard',
      ),
    ).toBe(true)

    const shown = partitionFeatCatalogue({
      feats,
      context: { ...baseContext, characterLevel: 1, hasSpellcasting: true },
      policy: { kind: 'category', category: 'origin' },
      showUnavailable: false,
      showRedundant: true,
      capabilityInventory: inventory,
    })

    const mi = shown.visible.find(
      (entry) => entry.definition.id === 'srd-2024:magic-initiate-wizard',
    )
    expect(mi?.overlap.status).toBe('redundant')
  })
})
