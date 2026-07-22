/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
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
    crossSourceDuplicatePolicy: 'allow',
    countsAgainstLimit: true,
    ...partial,
  }
}

describe('SpellsStep spellbook catalogue exclusions', () => {
  it('hides spells already in earlier Wizard spellbook entitlements', async () => {
    const user = userEvent.setup()
    const group: ResolvedSpellSourceGroup = {
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
      entitlements: [
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
      ],
    }

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

    const spellsById = new Map([
      [magicMissile.id, magicMissile],
      [shield.id, shield],
      [mistyStep.id, mistyStep],
      [blur.id, blur],
    ])

    const catalog = {
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

    render(
      <SpellsStep
        summary={summary}
        spellSourceStates={[]}
        onChangeSpellSourceStates={() => undefined}
        spellCatalog={catalog}
        validationIssues={[]}
      />,
    )

    await screen.findByRole('heading', {
      name: /wizard level 3 spellbook addition/i,
    })

    const addition = screen
      .getByRole('heading', { name: /wizard level 3 spellbook addition/i })
      .closest('section')
    expect(addition).not.toBeNull()

    // Expand both level partitions in the addition entitlement.
    const browseButtons = addition!.querySelectorAll(
      'button.spell-level-accordion__trigger',
    )
    for (const button of browseButtons) {
      await user.click(button)
    }

    expect(
      addition!.querySelector('[id*="magic-missile"]'),
    ).toBeNull()
    expect(addition!.querySelector('[id*="shield"]')).toBeNull()
    expect(
      screen.getByRole('checkbox', { name: /misty step/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /blur/i })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: /wizard level 3 spellbook addition/i,
      }),
    ).toHaveTextContent('0/2')
    expect(screen.queryByText('0/4')).not.toBeInTheDocument()
  })

  it('keeps a legacy duplicate visible so it can be cleared', async () => {
    const group: ResolvedSpellSourceGroup = {
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
      entitlements: [
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
      ],
    }

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

    const catalog = {
      getSpell: vi.fn(async (id: string) =>
        id === magicMissile.id
          ? magicMissile
          : id === mistyStep.id
            ? mistyStep
            : null,
      ),
      getSpellList: vi.fn(async () => ({
        id: 'srd-2024:spell-list:wizard',
        editionId: 'srd-2024' as const,
        name: 'Wizard',
        spellIds: [magicMissile.id, mistyStep.id],
        source: TEST_SOURCE,
      })),
      listSpells: vi.fn(async () => [magicMissile, mistyStep]),
      listSpellLists: vi.fn(async () => []),
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
        spellCatalog={catalog}
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

    expect(
      await screen.findByRole('checkbox', { name: /magic missile/i }),
    ).toBeInTheDocument()
  })
})
