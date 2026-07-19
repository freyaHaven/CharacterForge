/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { HelpTooltip } from '../HelpTooltip'

afterEach(() => {
  cleanup()
})

describe('HelpTooltip', () => {
  it('opens on keyboard focus without opening on hover', async () => {
    const user = userEvent.setup()

    render(
      <HelpTooltip label="About armor class" title="Armor Class">
        How hard you are to hit in combat.
      </HelpTooltip>,
    )

    const trigger = screen.getByRole('button', { name: /about armor class/i })
    await user.hover(trigger)
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument()

    await user.tab()
    expect(trigger).toHaveFocus()
    expect(
      await screen.findByRole('tooltip', { hidden: true }),
    ).toHaveTextContent('How hard you are to hit in combat.')
  })

  it('pins open on click for touch and closes with Escape', async () => {
    const user = userEvent.setup()

    render(
      <HelpTooltip label="About prepared spells">
        Spells you have ready to cast today.
      </HelpTooltip>,
    )

    const trigger = screen.getByRole('button', {
      name: /about prepared spells/i,
    })
    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(
      await screen.findByRole('tooltip', { hidden: true }),
    ).toHaveTextContent('Spells you have ready to cast today.')
    expect(
      screen.getByRole('button', { name: /close about prepared spells/i }),
    ).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('renders the panel in a portal on document.body', async () => {
    const user = userEvent.setup()

    render(
      <div id="mount">
        <HelpTooltip label="About hit points">
          Your durability in combat.
        </HelpTooltip>
      </div>,
    )

    await user.click(screen.getByRole('button', { name: /about hit points/i }))
    const tooltip = await screen.findByRole('tooltip', { hidden: true })
    expect(tooltip.parentElement).toBe(document.body)
    expect(tooltip.className).toContain('help-tooltip__panel')
  })
})
