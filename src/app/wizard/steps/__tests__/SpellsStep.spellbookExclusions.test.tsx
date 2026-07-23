/** @vitest-environment jsdom */

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SpellDefinition } from '../../../../domain/spell/types'
import type {
  CharacterSpellcastingSummary,
  ResolvedSpellEntitlement,
  ResolvedSpellSourceGroup,
} from '../../../../rules/character/resolveCharacterSpellcasting'
import { SpellsStep } from '../SpellsStep'

const TEST_SOURCE = {
  id: 'test',
  name: 'Test',
  version: '1',
  licence: 'CC-BY-4.0',
  attribution: 'Test',
  documentUrl: 'https://example.test',
}

function spell(
  partial: Pick<SpellDefinition, 'id' | 'name' | 'level'> &
    Partial<SpellDefinition>,
): SpellDefinition {
  return {
    editionId: 'srd-2024',
    school: 'Evocation',
    castingTime: 'Action',
    range: 'Self',
    components: 'V, S',
    duration: 'Instantaneous',
    description: 'Test spell.',
    source: TEST_SOURCE,
    ...partial,
  }
}

const magicMissile = spell({
  id: 'srd-2024:magic-missile',
  name: 'Magic Missile',
  level: 1,
})
const shield = spell({
  id: 'srd-2024:shield',
  name: 'Shield',
  level: 1,
})
const mistyStep = spell({
  id: 'srd-2024:misty-step',
  name: 'Misty Step',
  level: 2,
})
const blur = spell({
  id: 'srd-2024:blur',
  name: 'Blur',
  level: 2,
})

afterEach(() => {
  cleanup()
})

function spellbookEntitlement(
  partial: Partial<ResolvedSpellEntitlement> &
    Pick<ResolvedSpellEntitlement, 'entitlementId' | 'label' | 'limit'>,
): ResolvedSpellEntitlement {
  return {
    kind: 'select',
    selectionKind: 'spellbook',
    listId: 'srd-2024:spell-list:wizard',
    accessibleLevels: [1, 2],
    selectedSpellIds: [],
    grantedSpells: [],
    remainingPicks: partial.limit,
    ability: 'intelligence',
    saveDc: 13,
    attackBonus: 5,
    saveDcLabel: '13',
    attackBonusLabel: '+5',
    countsAgainstLimit: true,
    ...partial,
  }
}

function wizardSpellbookGroup(
  entitlements: ResolvedSpellEntitlement[],
): ResolvedSpellSourceGroup {
  return {
    groupId: 'class:wiz-1',
    label: 'Wizard',
    ability: 'intelligence',
    saveDc: 13,
    attackBonus: 5,
    saveDcLabel: '13',
    attackBonusLabel: '+5',
    sortKey: {
      originKind: 'class-core',
      classInstanceIndex: 0,
      grantingLevel: 1,
      progressionOrder: 0,
      displayName: 'Wizard',
    },
    entitlements,
  }
}

function makeCatalog(spells: SpellDefinition[]) {
  const spellsById = new Map(spells.map((entry) => [entry.id, entry]))
  return {
    getSpell: vi.fn(async (id: string) => spellsById.get(id) ?? null),
    getSpellList: vi.fn(async () => ({
      id: 'srd-2024:spell-list:wizard',
      editionId: 'srd-2024' as const,
      name: 'Wizard',
      spellIds: [...spellsById.keys()],
      source: TEST_SOURCE,
    })),
    listSpells: vi.fn(async () => [...spellsById.values()]),
    listSpellLists: vi.fn(async () => []),
  }
}

async function expandCollapsedAccordions(
  root: ParentNode,
  user: ReturnType<typeof userEvent.setup>,
) {
  const headers = root.querySelectorAll('button.choice-accordion__header')
  for (const button of headers) {
    if (button.getAttribute('aria-expanded') === 'false') {
      await user.click(button)
    }
  }
}

function additionSection(): HTMLElement {
  const heading = screen.getByRole('heading', {
    name: /wizard level 3 spellbook addition/i,
  })
  const section = heading.closest('section')
  expect(section).not.toBeNull()
  return section!
}

function additionRedundantToggle(): HTMLInputElement {
  const section = additionSection()
  const label = section.previousElementSibling
  expect(label).not.toBeNull()
  const input = label!.querySelector('input[type="checkbox"]')
  expect(input).not.toBeNull()
  return input as HTMLInputElement
}

describe('SpellsStep spellbook catalogue exclusions', () => {
  it('hides already-known spellbook spells by default and reveals them with attribution', async () => {
    const user = userEvent.setup()
    const group = wizardSpellbookGroup([
      spellbookEntitlement({
        entitlementId: 'spellbook-1',
        label: 'Wizard level 1 spellbook',
        limit: 6,
        accessibleLevels: [1],
        selectedSpellIds: [magicMissile.id, shield.id],
        remainingPicks: 4,
      }),
      spellbookEntitlement({
        entitlementId: 'spellbook-3',
        label: 'Wizard level 3 spellbook addition',
        limit: 2,
        accessibleLevels: [1, 2],
        selectedSpellIds: [],
        remainingPicks: 2,
      }),
    ])

    const summary: CharacterSpellcastingSummary = {
      hasSpellcastingCapability: true,
      hasSpellContent: true,
      spellLines: [],
      groups: [group],
      sharedSlots: { slotsByLevel: [4, 2], highestSlotLevel: 2 },
      pactSlots: null,
      activeSources: [
        {
          kind: 'class-instance',
          instanceId: 'wiz-1',
          entitlementId: 'spellbook-1',
        },
        {
          kind: 'class-instance',
          instanceId: 'wiz-1',
          entitlementId: 'spellbook-3',
        },
      ],
    }

    render(
      <SpellsStep
        summary={summary}
        spellSourceStates={[]}
        onChangeSpellSourceStates={() => undefined}
        spellCatalog={makeCatalog([magicMissile, shield, mistyStep, blur])}
        validationIssues={[]}
      />,
    )

    const addition = additionSection()
    await expandCollapsedAccordions(addition, user)

    expect(
      await within(addition).findByRole('checkbox', { name: /misty step/i }),
    ).toBeInTheDocument()
    expect(
      within(addition).getByRole('checkbox', { name: /blur/i }),
    ).toBeInTheDocument()
    expect(
      within(addition).queryByRole('checkbox', { name: /magic missile/i }),
    ).not.toBeInTheDocument()
    expect(
      within(addition).queryByRole('checkbox', { name: /shield/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: /wizard level 3 spellbook addition/i,
      }),
    ).toHaveTextContent('0/2')
    expect(
      within(addition).getByRole('status'),
    ).toHaveTextContent(/2 redundant choices hidden/i)

    await user.click(additionRedundantToggle())
    await expandCollapsedAccordions(addition, user)

    expect(
      await within(addition).findByRole('checkbox', { name: /magic missile/i }),
    ).toBeInTheDocument()
    expect(within(addition).getAllByText('Redundant').length).toBeGreaterThan(0)
    expect(
      within(addition).getAllByText(
        /Already known from:.*Wizard level 1 spellbook/i,
      ).length,
    ).toBeGreaterThan(0)

    // Redundant catalogue entries do not change entitlement progress.
    expect(
      screen.getByRole('heading', {
        name: /wizard level 3 spellbook addition/i,
      }),
    ).toHaveTextContent('0/2')
    expect(
      within(addition).getByRole('checkbox', { name: /misty step/i }),
    ).toBeInTheDocument()
  })

  it('keeps a committed redundant spellbook pick visible and clearable', async () => {
    const group = wizardSpellbookGroup([
      spellbookEntitlement({
        entitlementId: 'spellbook-1',
        label: 'Wizard level 1 spellbook',
        limit: 6,
        accessibleLevels: [1],
        selectedSpellIds: [magicMissile.id],
        remainingPicks: 5,
      }),
      spellbookEntitlement({
        entitlementId: 'spellbook-3',
        label: 'Wizard level 3 spellbook addition',
        limit: 2,
        accessibleLevels: [1, 2],
        selectedSpellIds: [magicMissile.id],
        remainingPicks: 1,
      }),
    ])

    const summary: CharacterSpellcastingSummary = {
      hasSpellcastingCapability: true,
      hasSpellContent: true,
      spellLines: [],
      groups: [group],
      sharedSlots: { slotsByLevel: [4, 2], highestSlotLevel: 2 },
      pactSlots: null,
      activeSources: [
        {
          kind: 'class-instance',
          instanceId: 'wiz-1',
          entitlementId: 'spellbook-1',
        },
        {
          kind: 'class-instance',
          instanceId: 'wiz-1',
          entitlementId: 'spellbook-3',
        },
      ],
    }

    render(
      <SpellsStep
        summary={summary}
        spellSourceStates={[
          {
            source: {
              kind: 'class-instance',
              instanceId: 'wiz-1',
              entitlementId: 'spellbook-3',
            },
            selections: [{ spellId: magicMissile.id }],
          },
        ]}
        onChangeSpellSourceStates={() => undefined}
        spellCatalog={makeCatalog([magicMissile, mistyStep])}
        validationIssues={[
          {
            code: 'cross-source-duplicate',
            sourceKey: 'wiz-1:spellbook-3',
            message: 'Duplicate spellbook entry',
            groupLabel: 'Wizard',
            entitlementId: 'spellbook-3',
            spellId: magicMissile.id,
          },
        ]}
      />,
    )

    const addition = additionSection()
    const missile = await within(addition).findByRole('checkbox', {
      name: /magic missile/i,
    })
    expect(missile).toBeChecked()
    expect(missile).toHaveAttribute('aria-invalid', 'true')
    expect(missile).not.toBeDisabled()
    expect(
      screen.getByRole('heading', {
        name: /wizard level 3 spellbook addition/i,
      }),
    ).toHaveTextContent('1/2')
  })
})
