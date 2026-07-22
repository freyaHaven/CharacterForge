/** @vitest-environment jsdom */

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SpellDefinition } from '../../../domain/spell/types'
import { SpellSelectionCard } from '../SpellSelectionCard'
import { SpellSelectionGrid } from '../SpellSelectionGrid'

const TEST_SOURCE = {
  id: 'test',
  name: 'Test',
  version: '1',
  licence: 'CC-BY-4.0',
  attribution: 'Test',
  documentUrl: 'https://example.test',
}

const guidance: SpellDefinition = {
  id: 'srd-2024:guidance',
  editionId: 'srd-2024',
  name: 'Guidance',
  level: 0,
  school: 'Divination',
  castingTime: 'Action',
  range: 'Touch',
  components: 'V, S',
  duration: 'Concentration, up to 1 minute',
  description: 'Add 1d4 to one ability check.',
  source: TEST_SOURCE,
}

const light: SpellDefinition = {
  ...guidance,
  id: 'srd-2024:light',
  name: 'Light',
  school: 'Evocation',
  description: 'An object sheds bright light.',
}

const sacredFlame: SpellDefinition = {
  ...guidance,
  id: 'srd-2024:sacred-flame',
  name: 'Sacred Flame',
  school: 'Evocation',
  description: 'Flame-like radiance descends on a creature.',
}

afterEach(() => {
  cleanup()
})

describe('SpellSelectionCard', () => {
  it('toggles selection via checkbox semantics', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <SpellSelectionCard
        spell={guidance}
        inputId="spell-guidance"
        selected={false}
        onToggle={onToggle}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: /guidance/i }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('does not open preview on card hover or checkbox focus', async () => {
    const user = userEvent.setup()

    render(
      <SpellSelectionCard
        spell={guidance}
        inputId="spell-guidance"
        selected={false}
        onToggle={() => undefined}
      />,
    )

    const card = screen.getByText('Guidance').closest('.spell-selection-card')
    expect(card).not.toBeNull()

    await user.hover(card!)
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument()

    await user.tab()
    expect(screen.getByRole('checkbox', { name: /guidance/i })).toHaveFocus()
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument()
  })

  it('opens preview from the info button without toggling selection', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <SpellSelectionCard
        spell={guidance}
        inputId="spell-guidance"
        selected={false}
        onToggle={onToggle}
      />,
    )

    await user.click(screen.getByRole('button', { name: /guidance details/i }))
    expect(onToggle).not.toHaveBeenCalled()
    expect(
      await screen.findByRole('tooltip', { hidden: true }),
    ).toHaveTextContent('Touch')

    await user.click(screen.getByRole('button', { name: /close guidance details/i }))
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument()
  })

  it('renders granted cards without a checkbox', () => {
    render(
      <SpellSelectionCard
        spell={guidance}
        inputId="spell-guidance"
        selected
        granted
      />,
    )

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByText('Always prepared')).toBeInTheDocument()
    expect(
      document.querySelector('.spell-selection-card--granted'),
    ).not.toBeNull()
  })

  it('marks invalid selections', () => {
    render(
      <SpellSelectionCard
        spell={guidance}
        inputId="spell-guidance"
        selected
        invalid
        onToggle={() => undefined}
      />,
    )

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true')
    expect(
      document.querySelector('.spell-selection-card--invalid'),
    ).not.toBeNull()
  })

  it('blocks selecting a spell already available elsewhere when forbidden', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <SpellSelectionCard
        spell={guidance}
        inputId="spell-guidance"
        selected={false}
        eligibility={{
          spellId: guidance.id,
          alreadyAvailableFromOtherSource: true,
          duplicateWithinCurrentSource: false,
          ownedByCurrentEntitlement: false,
          duplicateReason: 'Already known from: Cleric — Cantrips',
          otherSourceOrigins: [],
          currentSourceOrigins: [],
          policy: 'forbid',
          canSelect: false,
          recommendation: 'blocked',
        }}
        onToggle={onToggle}
      />,
    )

    expect(screen.getByText('Already known')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeDisabled()
    await user.click(screen.getByText('Guidance'))
    expect(onToggle).not.toHaveBeenCalled()
  })
})

describe('SpellSelectionGrid', () => {
  it('renders a responsive catalogue grid with equal-height card layout classes', () => {
    const { container } = render(
      <SpellSelectionGrid
        idPrefix="cantrips"
        title="Cantrips"
        countLabel="0/3"
        selectableSpells={[guidance, light, sacredFlame]}
        selectedSpellIds={new Set()}
        onToggleSpell={() => undefined}
      />,
    )

    expect(screen.getByRole('heading', { name: /cantrips/i })).toHaveTextContent(
      '0/3',
    )
    expect(container.querySelector('.spell-selection-grid__cards')).not.toBeNull()
    expect(screen.getByText('Cantrip • Divination')).toBeInTheDocument()
    expect(screen.getAllByText('Cantrip • Evocation')).toHaveLength(2)
  })

  it('renders per-level accordions when level rows are provided', async () => {
    const user = userEvent.setup()

    render(
      <SpellSelectionGrid
        idPrefix="prepared"
        title="Prepared Spells"
        countLabel="3/5"
        levelRows={[
          {
            level: 1,
            label: '1st level',
            selected: 1,
            capacity: null,
            limitScope: 'entitlement',
          },
          {
            level: 2,
            label: '2nd level',
            selected: 0,
            capacity: null,
            limitScope: 'entitlement',
          },
        ]}
        selectableSpells={[
          { ...light, level: 1 },
          { ...sacredFlame, level: 2, name: 'Aid', id: 'srd-2024:aid' },
        ]}
        selectedSpellIds={new Set(['srd-2024:light'])}
        onToggleSpell={() => undefined}
      />,
    )

    expect(
      screen.getByRole('heading', { name: /prepared spells/i }),
    ).toHaveTextContent('3/5')
    expect(screen.getByText('1st level')).toBeInTheDocument()
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    expect(screen.getByText('2nd level')).toBeInTheDocument()
    expect(screen.queryByText('2/3')).not.toBeInTheDocument()
    expect(screen.queryByText('1/2')).not.toBeInTheDocument()

    // Level with selections starts expanded; empty selection level stays collapsed.
    expect(screen.getByRole('checkbox', { name: /light/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /hide 1st level spells/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /browse 2nd-level spells/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /aid/i })).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /browse 2nd-level spells/i }),
    )
    expect(screen.getByRole('checkbox', { name: /aid/i })).toBeInTheDocument()
  })

  it('blocks unselected spells only for genuine per-group capacity', () => {
    render(
      <SpellSelectionGrid
        idPrefix="prepared"
        title="Prepared Spells"
        countLabel="2/5"
        levelRows={[
          {
            level: 1,
            label: '1st level',
            selected: 2,
            capacity: 2,
            limitScope: 'group',
          },
        ]}
        selectableSpells={[
          { ...light, level: 1 },
          { ...sacredFlame, level: 1 },
          {
            ...guidance,
            id: 'srd-2024:bless',
            name: 'Bless',
            level: 1,
            school: 'Enchantment',
          },
        ]}
        selectedSpellIds={new Set(['srd-2024:light', 'srd-2024:sacred-flame'])}
        onToggleSpell={() => undefined}
      />,
    )

    expect(screen.getByRole('checkbox', { name: /light/i })).not.toBeDisabled()
    expect(
      screen.getByRole('checkbox', { name: /sacred flame/i }),
    ).not.toBeDisabled()
    expect(screen.getByRole('checkbox', { name: /bless/i })).toBeDisabled()
  })

  it('does not treat entitlement-scoped selected counts as a per-level pick cap', async () => {
    const user = userEvent.setup()

    render(
      <SpellSelectionGrid
        idPrefix="spellbook"
        title="Wizard level 3 spellbook addition"
        countLabel="0/2"
        levelRows={[
          {
            level: 1,
            label: '1st level',
            selected: 0,
            capacity: null,
            limitScope: 'entitlement',
          },
          {
            level: 2,
            label: '2nd level',
            selected: 0,
            capacity: null,
            limitScope: 'entitlement',
          },
        ]}
        selectableSpells={[
          { ...light, level: 1 },
          { ...sacredFlame, level: 2, name: 'Blur', id: 'srd-2024:blur' },
        ]}
        selectedSpellIds={new Set()}
        onToggleSpell={() => undefined}
      />,
    )

    expect(
      screen.getByRole('heading', {
        name: /wizard level 3 spellbook addition/i,
      }),
    ).toHaveTextContent('0/2')
    expect(screen.queryByText('0/4')).not.toBeInTheDocument()
    expect(screen.queryByText('0/3')).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /browse 1st-level spells/i }),
    )
    expect(screen.getByRole('checkbox', { name: /light/i })).not.toBeDisabled()
  })

  it('blocks additional picks when the global selection limit is reached', () => {
    render(
      <SpellSelectionGrid
        idPrefix="cantrips"
        title="Cantrips"
        countLabel="2/2"
        selectableSpells={[guidance, light, sacredFlame]}
        selectedSpellIds={new Set(['srd-2024:guidance', 'srd-2024:light'])}
        atSelectionLimit
        onToggleSpell={() => undefined}
      />,
    )

    expect(screen.getByRole('checkbox', { name: /guidance/i })).not.toBeDisabled()
    expect(screen.getByRole('checkbox', { name: /light/i })).not.toBeDisabled()
    expect(screen.getByRole('checkbox', { name: /sacred flame/i })).toBeDisabled()
  })

  it('keeps granted spells distinct and non-editable', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(
      <SpellSelectionGrid
        idPrefix="prepared"
        title="Prepared Spells"
        countLabel="0/4"
        selectableSpells={[light]}
        grantedSpells={[guidance]}
        selectedSpellIds={new Set()}
        onToggleSpell={onToggle}
      />,
    )

    const grantedList = screen.getByRole('list', {
      name: /always prepared spells/i,
    })
    expect(within(grantedList).getByText('Guidance')).toBeInTheDocument()
    expect(within(grantedList).queryByRole('checkbox')).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /light/i }))
    expect(onToggle).toHaveBeenCalledWith('srd-2024:light')
  })

  it('positions the shared popover in a portal when opened via info control', async () => {
    const user = userEvent.setup()

    render(
      <SpellSelectionGrid
        idPrefix="cantrips"
        title="Cantrips"
        countLabel="0/3"
        selectableSpells={[guidance]}
        selectedSpellIds={new Set()}
        onToggleSpell={() => undefined}
      />,
    )

    await user.click(screen.getByRole('button', { name: /guidance details/i }))
    const tooltip = await screen.findByRole('tooltip', { hidden: true })
    expect(tooltip.parentElement).toBe(document.body)
    expect(tooltip.className).toContain('spell-preview-popover')
  })
})
