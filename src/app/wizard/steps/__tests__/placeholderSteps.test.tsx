// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../../../../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../../../../adapters/bundledClassCatalog'
import { createBundledFeatCatalog } from '../../../../adapters/bundledFeatCatalog'
import { createBundledSpeciesCatalog } from '../../../../adapters/bundledSpeciesCatalog'
import { DEFAULT_ABILITY_SCORES } from '../../../../domain/character/defaults'
import type { ClassBuildMode } from '../../../../features/class/classBuildMode'
import { createEmptyClassSelectionDrafts } from '../../../../features/class/classSelectionDraft'
import { BackgroundStep } from '../BackgroundStep'
import { ClassStep } from '../ClassStep'
import { EquipmentStep } from '../EquipmentStep'

function renderClassStep(buildMode: ClassBuildMode | null = 'single-class') {
  render(
    <ClassStep
      editionId="srd-2024"
      buildMode={buildMode}
      targetLevel={1}
      committedClasses={[]}
      classDrafts={createEmptyClassSelectionDrafts()}
      startingClassInstanceId={null}
      activeInstanceId={null}
      draft={null}
      abilityScores={DEFAULT_ABILITY_SCORES}
      speciesSelection={null}
      catalog={createBundledClassCatalog()}
      speciesCatalog={createBundledSpeciesCatalog()}
      featCatalog={createBundledFeatCatalog()}
      characterFeatId={null}
      onBuildModeChange={() => {}}
      onReturnToClassPathIntro={() => {}}
      onSwitchToMulticlass={() => {}}
      onSwitchToSingleClass={() => {}}
      onSyncTargetLevel={() => {}}
      onActiveInstanceChange={() => {}}
      onDraftChange={() => {}}
      onCommitInstance={() => {}}
      onRemoveInstance={() => {}}
      onStartingClassChange={() => {}}
      onSelectOrAddClass={() => 'new-instance'}
      onToggleMulticlassClass={() => 'added'}
      onMulticlassInstanceLevelChange={() => {}}
    />,
  )
}

describe('ClassStep', () => {
  it('renders the class picker catalogue in single-class mode', async () => {
    renderClassStep('single-class')

    await waitFor(() => {
      expect(screen.queryByText(/loading classes/i)).not.toBeInTheDocument()
    })

    expect(
      screen.queryByRole('heading', { name: 'Class', level: 2 }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/class path:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fighter' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Barbarian' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rogue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Monk' })).toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
    expect(screen.queryByText('Preview')).not.toBeInTheDocument()
  })

  it('includes martial classes in multiclass mode', async () => {
    renderClassStep('multiclass')

    await waitFor(() => {
      expect(screen.queryByText(/loading classes/i)).not.toBeInTheDocument()
    })

    expect(
      screen.getByRole('heading', { name: 'Multiclass', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fighter/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Barbarian/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rogue/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Monk/i })).toBeInTheDocument()
    expect(screen.queryByText('Preview')).not.toBeInTheDocument()
  })

  it('shows the class-path introduction when no path is selected', async () => {
    renderClassStep(null)

    expect(
      screen.getByRole('heading', { name: 'Class', level: 2 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/how will your character gain their class levels/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Fighter' })).not.toBeInTheDocument()
  })
})

describe('BackgroundStep', () => {
  it('renders the background picker catalogue', async () => {
    render(
      <BackgroundStep
        editionId="srd-2024"
        committedSelection={null}
        draft={null}
        catalog={createBundledBackgroundCatalog()}
        onDraftChange={() => {}}
        onCommittedSelectionChange={() => {}}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Background', level: 2 }),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText(/loading backgrounds/i)).not.toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: 'Soldier' })).toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
  })
})

describe('EquipmentStep', () => {
  it('renders the heading, explanation, and coming soon notice', () => {
    render(<EquipmentStep />)

    expect(
      screen.getByRole('heading', { name: 'Equipment', level: 2 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/starting weapons, armour, tools, and supplies/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('does not render interactive selection controls', () => {
    render(<EquipmentStep />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
