import { describe, expect, it } from 'vitest'
import { deriveFeatOptionGrants } from '../deriveFeatOptionGrants'
import {
  evaluateOptionOverlap,
  evaluateSpellPickOverlap,
} from '../evaluateOptionOverlap'
import type { CharacterCapabilityInventory } from '../types'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { SPELL_LIST_IDS } from '../../../content/packs/srd-2024/spell-lists'

describe('capability overlap evaluation', () => {
  it('marks a concrete spell pick redundant when already known from another source', () => {
    const inventory: CharacterCapabilityInventory = {
      tokens: [
        {
          kind: 'spell',
          id: 'srd-2024:detect-magic',
          source: {
            label: 'Magic Initiate (Granted by Background)',
            kind: 'background-origin',
          },
          how: 'selected',
        },
      ],
    }

    const verdict = evaluateSpellPickOverlap(
      'srd-2024:detect-magic',
      inventory,
    )

    expect(verdict.status).toBe('redundant')
    expect(verdict.reasons[0]?.message).toContain('Already known from:')
    expect(verdict.reasons[0]?.message).toContain('Magic Initiate')
  })

  it('marks Magic Initiate (Wizard) redundant when the character already has Wizard list access', async () => {
    const feat = await createBundledFeatCatalog().getFeat(
      'srd-2024:magic-initiate-wizard',
    )
    expect(feat).not.toBeNull()

    const grants = deriveFeatOptionGrants(feat!)
    expect(grants.some((grant) => grant.kind === 'spell-list-access')).toBe(
      true,
    )

    const inventory: CharacterCapabilityInventory = {
      tokens: [
        {
          kind: 'spell-list-access',
          id: SPELL_LIST_IDS.wizard,
          source: { label: 'Wizard', kind: 'class' },
          how: 'fixed',
        },
      ],
    }

    expect(evaluateOptionOverlap(grants, inventory).status).toBe('redundant')
    expect(evaluateOptionOverlap(grants, inventory).reasons[0]?.message).toMatch(
      /Wizard spellcasting/i,
    )
  })

  it('keeps Magic Initiate (Cleric) recommended for a Wizard-only caster', async () => {
    const feat = await createBundledFeatCatalog().getFeat(
      'srd-2024:magic-initiate-cleric',
    )
    expect(feat).not.toBeNull()

    const inventory: CharacterCapabilityInventory = {
      tokens: [
        {
          kind: 'spell-list-access',
          id: SPELL_LIST_IDS.wizard,
          source: { label: 'Wizard', kind: 'class' },
          how: 'fixed',
        },
      ],
    }

    expect(
      evaluateOptionOverlap(deriveFeatOptionGrants(feat!), inventory).status,
    ).toBe('recommended')
  })

  it('does not claim redundancy for text-only feats with no structured grants', async () => {
    const alert = await createBundledFeatCatalog().getFeat('srd-2024:alert')
    expect(alert).not.toBeNull()

    // Alert has initiative effect — empty inventory → recommended
    const empty: CharacterCapabilityInventory = { tokens: [] }
    expect(
      evaluateOptionOverlap(deriveFeatOptionGrants(alert!), empty).status,
    ).toBe('recommended')
  })
})
