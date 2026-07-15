// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useMemo, useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../../adapters/bundledClassCatalog'
import { useClassEditor } from '../../app/hooks/useClassEditor'
import { clearClassEditorWorkflow } from '../../app/session/classEditorWorkflowStorage'
import { createDefaultCharacter } from '../../domain/character/defaults'
import type { Character } from '../../domain/types'
import type { CharacterClassSelection } from '../../domain/class/types'
import type { ClassBuildMode } from './classBuildMode'
import {
  createEmptyClassSelectionDrafts,
  type ClassSelectionDraft,
  type ClassSelectionDrafts,
} from './classSelectionDraft'
import { ClassPicker } from './ClassPicker'

type ClassPickerHarnessProps = {
  initialCharacter?: Partial<Character>
  initialBuildMode?: ClassBuildMode | null
  initialDrafts?: ClassSelectionDrafts
  initialDraft?: ClassSelectionDraft | null
  initialInstanceId?: string | null
}

function ClassPickerHarness({
  initialCharacter = {},
  initialBuildMode = null as ClassBuildMode | null,
  initialDrafts: _initialDrafts = createEmptyClassSelectionDrafts(),
  initialDraft: _initialDraft = null,
  initialInstanceId: _initialInstanceId = null,
}: ClassPickerHarnessProps) {
  const catalog = useMemo(() => createBundledClassCatalog(), [])
  const [character, setCharacter] = useState<Character>(() => ({
    ...createDefaultCharacter(),
    ...initialCharacter,
  }))
  const editor = useClassEditor({
    character,
    setCharacter,
    classCatalog: catalog,
  })

  useEffect(() => {
    editor.hydrateForCharacter({
      ...createDefaultCharacter(),
      ...initialCharacter,
    })

    if (initialBuildMode !== null) {
      editor.setBuildMode(initialBuildMode)
    }
  }, [])

  return (
    <ClassPicker
      editionId={character.editionId}
      buildMode={editor.buildMode}
      targetLevel={editor.targetLevel}
      committedClasses={editor.committedClasses}
      classDrafts={editor.classDrafts}
      startingClassInstanceId={editor.startingClassInstanceId}
      activeInstanceId={editor.activeInstanceId}
      draft={editor.classDraft}
      catalog={catalog}
      onBuildModeChange={editor.setBuildMode}
      onReturnToClassPathIntro={editor.returnToClassPathIntro}
      onSwitchToMulticlass={editor.switchToMulticlass}
      onSwitchToSingleClass={editor.switchToSingleClass}
      onSyncTargetLevel={editor.syncTargetLevel}
      onActiveInstanceChange={editor.setActiveInstanceId}
      onDraftChange={editor.setClassDraft}
      onCommitInstance={editor.commitClassInstance}
      onRemoveInstance={editor.removeClassInstance}
      onStartingClassChange={editor.setStartingClass}
      onSelectOrAddClass={(classDefinition) =>
        editor.selectOrAddClass(classDefinition.id)
      }
      onToggleMulticlassClass={editor.toggleMulticlassClass}
      onMulticlassInstanceLevelChange={editor.setMulticlassInstanceLevel}
    />
  )
}

function ClassPickerHarnessWithCommitted({
  initialTargetLevel = 1,
  initialCommitted = [] as CharacterClassSelection[],
  initialBuildMode = 'single-class' as ClassBuildMode,
  initialStartingClassInstanceId = null as string | null,
  initialInstanceId = null as string | null,
  initialDrafts = createEmptyClassSelectionDrafts(),
  initialDraft = null as ClassSelectionDraft | null,
}: {
  initialTargetLevel?: number
  initialCommitted?: CharacterClassSelection[]
  initialBuildMode?: ClassBuildMode
  initialStartingClassInstanceId?: string | null
  initialInstanceId?: string | null
  initialDrafts?: ClassSelectionDrafts
  initialDraft?: ClassSelectionDraft | null
}) {
  return (
    <ClassPickerHarness
      initialBuildMode={initialBuildMode}
      initialCharacter={{
        targetLevel: initialTargetLevel,
        classes: initialCommitted,
        startingClassInstanceId: initialStartingClassInstanceId,
      }}
      initialDrafts={initialDrafts}
      initialDraft={initialDraft}
      initialInstanceId={initialInstanceId}
    />
  )
}

async function waitForClassesLoaded() {
  await waitFor(() => {
    expect(screen.queryByText(/loading classes/i)).not.toBeInTheDocument()
  })
}

async function selectClassPath(
  user: ReturnType<typeof userEvent.setup>,
  mode: 'single-class' | 'multiclass',
) {
  await user.click(
    screen.getByRole('radio', {
      name: mode === 'single-class' ? /single class/i : /multiclass/i,
    }),
  )
}

async function selectSingleClassMode(user: ReturnType<typeof userEvent.setup>) {
  if (screen.queryByRole('radio', { name: /single class/i }) !== null) {
    await selectClassPath(user, 'single-class')
  }
}

async function selectMulticlassMode(user: ReturnType<typeof userEvent.setup>) {
  const multiclassRadio = screen.queryByRole('radio', { name: /multiclass/i })

  if (multiclassRadio !== null) {
    await user.click(multiclassRadio)
  }
}

async function setClassLevel(level: number) {
  const input = screen.getByRole('spinbutton', { name: /levels in this class/i })
  fireEvent.change(input, { target: { value: String(level) } })
  fireEvent.blur(input)

  await waitFor(() => {
    expect(input).toHaveValue(level)
  })
}

function getSummaryStatus() {
  return document.querySelector('.class-picker__summary-status')
}

function getOverviewColumn() {
  return document.querySelector('.class-picker__overview-column') as HTMLElement
}

function getProgressionColumn() {
  return document.querySelector('.class-picker__progression-column') as HTMLElement
}

describe('ClassPicker', () => {
  beforeEach(() => {
    clearClassEditorWorkflow(createDefaultCharacter().id)
  })

  it('shows the class-path introduction before the catalogue on first entry', async () => {
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    expect(
      screen.getByRole('heading', { name: 'Class', level: 2 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/how will your character gain their class levels/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: /single class/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /multiclass/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Fighter' })).not.toBeInTheDocument()
    expect(
      screen.queryByText(/how will your character gain their class levels/i),
    ).toBeInTheDocument()
  })

  it('shows fighter choices on the first click without committing', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('radio', { name: /Defense/i })).toBeInTheDocument()

    const overviewColumn = getOverviewColumn()
    expect(
      within(overviewColumn).getByRole('group', { name: /skill proficiencies/i }),
    ).toBeInTheDocument()
    expect(
      within(overviewColumn).getByText(/choose 2 from:/i),
    ).toBeInTheDocument()
    expect(getProgressionColumn()).not.toHaveTextContent(
      /choose two skill proficiencies/i,
    )
    expect(getSummaryStatus()).toHaveTextContent(
      /Complete required choices to confirm/i,
    )
  })

  it('does not show choices after focus alone', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    fireEvent.focus(screen.getByRole('button', { name: 'Fighter' }))

    expect(
      screen.queryByRole('button', { name: /Fighting Style/i }),
    ).not.toBeInTheDocument()
  })

  it('commits when fighting style and exactly two skills are chosen', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await user.click(screen.getByRole('radio', { name: /Archery/i }))
    await user.click(screen.getByRole('checkbox', { name: 'Athletics' }))
    await user.click(screen.getByRole('checkbox', { name: 'Survival' }))

    expect(screen.getByText('Selected: Archery')).toBeInTheDocument()
    expect(
      document.querySelector('.feature-choice-card__selection-description'),
    ).toHaveTextContent(
      /\+2 bonus to attack rolls you make with Ranged weapons/i,
    )
    expect(getSummaryStatus()).toHaveTextContent('Class selection complete')
    expect(getSummaryStatus()).not.toHaveTextContent(
      /Complete required choices to confirm/i,
    )
  })

  it('prevents selecting more than two skills and allows deselection', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    const overviewColumn = getOverviewColumn()
    const athletics = within(overviewColumn).getByRole('checkbox', {
      name: 'Athletics',
    })
    const perception = within(overviewColumn).getByRole('checkbox', {
      name: 'Perception',
    })
    const history = within(overviewColumn).getByRole('checkbox', {
      name: 'History',
    })

    await user.click(athletics)
    await user.click(perception)
    expect(history).toBeDisabled()

    await user.click(athletics)
    expect(history).not.toBeDisabled()
    expect(within(overviewColumn).getByText(/selected 1 of 2/i)).toBeInTheDocument()
  })

  it('returns to draft-only when a committed skill is deselected', async () => {
    const user = userEvent.setup()
    render(
      <ClassPickerHarnessWithCommitted
        initialCommitted={[
          {
            instanceId: 'test-class-instance',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {
              'fighting-style': 'defense',
              'skill-proficiencies': ['athletics', 'perception'],
            },
          },
        ]}
        initialInstanceId="test-class-instance"
        initialStartingClassInstanceId="test-class-instance"
      />,
    )
    await waitForClassesLoaded()

    await user.click(screen.getByRole('checkbox', { name: 'Athletics' }))

    expect(screen.getByText('Selected: Defense')).toBeInTheDocument()
    expect(getSummaryStatus()).toHaveTextContent(
      /Complete required choices to confirm/i,
    )
  })

  it('shows level 1 features including weapon mastery guidance', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    expect(screen.getByText('Weapon Mastery')).toBeInTheDocument()
    expect(
      document.querySelector('.class-picker__feature-level-title'),
    ).toHaveTextContent('Level 1')
    expect(
      screen.queryByRole('heading', { name: 'Level 3', level: 5 }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Second Wind/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Weapon Mastery/i })).not.toBeInTheDocument()
    expect(screen.getByText(/equipment step/i)).toBeInTheDocument()
    expect(screen.getByText(/three kinds of Simple or Martial weapons/i)).toBeInTheDocument()
  })

  it('shows level 3 features and requires martial archetype before commit', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await user.click(screen.getByRole('radio', { name: /Defense/i }))
    await user.click(screen.getByRole('checkbox', { name: 'Athletics' }))
    await user.click(screen.getByRole('checkbox', { name: 'Perception' }))

    await waitFor(() => {
      expect(getSummaryStatus()).toHaveTextContent('Class selection complete')
    })

    await setClassLevel(3)

    expect(
      screen.getByRole('heading', { name: 'Level 3', level: 5 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Fighter Subclass/i }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(getSummaryStatus()).toHaveTextContent(
      /Complete required choices to confirm/i,
    )
  })

  it('shows level 5 features after completing level 3 choices', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await user.click(screen.getByRole('radio', { name: /Defense/i }))
    await user.click(screen.getByRole('checkbox', { name: 'Athletics' }))
    await user.click(screen.getByRole('checkbox', { name: 'Perception' }))
    await setClassLevel(3)
    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /Champion/i }),
      ).toBeInTheDocument()
    })
    await user.click(
      screen.getByRole('radio', { name: /Champion/i }),
    )

    await waitFor(() => {
      expect(getSummaryStatus()).toHaveTextContent('Class selection complete')
    })

    await setClassLevel(5)

    expect(screen.getByText('Extra Attack')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Level 5', level: 5 }),
    ).toBeInTheDocument()
    expect(document.querySelector('.class-picker__summary-subtitle')).toHaveTextContent(
      'Level 5 · Champion',
    )
    expect(getSummaryStatus()).toHaveTextContent('Class selection complete')
  })

  it('preserves feature choice expansion state across level changes', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await user.click(screen.getByRole('radio', { name: /Defense/i }))
    await user.click(screen.getByRole('button', { name: /Fighting Style/i }))

    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'true')

    await setClassLevel(3)

    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('button', { name: /Fighter Subclass/i }),
    ).toHaveAttribute('aria-expanded', 'true')

    await user.click(
      screen.getByRole('radio', { name: /Champion/i }),
    )
    await setClassLevel(1)

    expect(
      screen.queryByRole('button', { name: /Fighter Subclass/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders overview and progression sections after selecting a class', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    expect(screen.queryByRole('button', { name: 'Fighter' })).not.toBeInTheDocument()

    await selectSingleClassMode(user)

    expect(screen.getByRole('button', { name: 'Fighter' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Class Progression', level: 3 }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('radio', { name: /single class/i }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    const overviewColumn = getOverviewColumn()
    const progressionColumn = getProgressionColumn()

    expect(
      screen.getByRole('heading', { name: 'Class Overview', level: 3 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Class Progression', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Fighter', { selector: '.class-picker__overview-class-name' })).toBeInTheDocument()
    expect(document.querySelector('.class-picker__summary-subtitle')).toHaveTextContent(
      'Level 1',
    )
    expect(
      within(overviewColumn).getByRole('checkbox', { name: 'Athletics' }),
    ).toBeInTheDocument()
    expect(
      within(progressionColumn).queryByRole('checkbox', { name: 'Athletics' }),
    ).not.toBeInTheDocument()
    expect(
      overviewColumn.querySelectorAll('.class-picker__overview-chip').length,
    ).toBeGreaterThan(0)
    expect(
      within(overviewColumn).getByText('Martial', {
        selector: '.class-picker__overview-chip',
      }),
    ).toBeInTheDocument()
    expect(within(overviewColumn).getByText('d10')).toBeInTheDocument()
    expect(
      overviewColumn.compareDocumentPosition(progressionColumn) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.getByText('Remaining character decisions')).toBeInTheDocument()
  })

  it('uses real buttons with a non-colour-only selected state', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    const selectedCard = screen.getByRole('button', { name: 'Fighter' })
    expect(selectedCard).toHaveAttribute('aria-pressed', 'true')
    expect(
      selectedCard.querySelector('.class-picker__card-badge[aria-hidden="true"]'),
    ).not.toBeNull()
  })

  it('switches between class tabs in multiclass configure stage', async () => {
    const user = userEvent.setup()
    render(
      <ClassPickerHarnessWithCommitted
        initialBuildMode="multiclass"
        initialTargetLevel={2}
        initialCommitted={[
          {
            instanceId: 'fighter-instance',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {
              'fighting-style': 'defense',
              'skill-proficiencies': ['athletics', 'perception'],
            },
          },
          {
            instanceId: 'barbarian-instance',
            classId: 'srd-2024:barbarian',
            level: 1,
            choices: {},
          },
        ]}
        initialInstanceId="barbarian-instance"
        initialStartingClassInstanceId="fighter-instance"
      />,
    )
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: /Fighter 1/i }))

    expect(
      screen.getByRole('heading', { name: 'Fighter', level: 3 }),
    ).toBeInTheDocument()
  })

  it('hides allocation terminology in single-class mode', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    expect(screen.queryByText(/target level/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/allocated/i)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('group', {
        name: /which class did your character begin with/i,
      }),
    ).not.toBeInTheDocument()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    expect(screen.queryByText(/target level/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/allocated/i)).not.toBeInTheDocument()
  })

  it('shows starting class choice only in multiclass setup', async () => {
    render(
      <ClassPickerHarnessWithCommitted
        initialBuildMode="multiclass"
        initialTargetLevel={2}
        initialCommitted={[
          {
            instanceId: 'fighter-instance',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {},
          },
          {
            instanceId: 'barbarian-instance',
            classId: 'srd-2024:barbarian',
            level: 1,
            choices: {},
          },
        ]}
        initialStartingClassInstanceId={null}
      />,
    )
    await waitForClassesLoaded()

    expect(
      screen.getByRole('group', {
        name: /which class did your character begin with/i,
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/allocated/i)).not.toBeInTheDocument()
  })

  it('shows multiclass level allocation without target level controls', async () => {
    render(
      <ClassPickerHarnessWithCommitted
        initialBuildMode="multiclass"
        initialTargetLevel={5}
        initialCommitted={[
          {
            instanceId: 'fighter-instance',
            classId: 'srd-2024:fighter',
            level: 3,
            choices: {
              'fighting-style': 'defense',
              'skill-proficiencies': ['athletics', 'perception'],
            },
          },
          {
            instanceId: 'barbarian-instance',
            classId: 'srd-2024:barbarian',
            level: 2,
            choices: {},
          },
        ]}
        initialInstanceId="fighter-instance"
        initialStartingClassInstanceId="fighter-instance"
      />,
    )
    await waitForClassesLoaded()

    expect(screen.queryByText(/target level/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/allocated/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Fighter 3 \+ Barbarian 2/i)).toBeInTheDocument()
    expect(screen.getByText('Character level: 5')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /configure your classes/i }),
    ).toBeInTheDocument()
  })

  it('adds barbarian in multiclass setup and updates character level from allocation', async () => {
    const user = userEvent.setup()
    render(
      <ClassPickerHarnessWithCommitted
        initialBuildMode="multiclass"
        initialTargetLevel={3}
        initialCommitted={[
          {
            instanceId: 'fighter-instance',
            classId: 'srd-2024:fighter',
            level: 3,
            choices: {
              'fighting-style': 'defense',
              'skill-proficiencies': ['athletics', 'perception'],
            },
          },
        ]}
        initialStartingClassInstanceId={null}
      />,
    )
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: /Barbarian/i }))

    expect(screen.getByText('Character level: 4')).toBeInTheDocument()

    const barbarianLevelInput = screen.getByRole('spinbutton', {
      name: /levels in barbarian/i,
    })
    fireEvent.change(barbarianLevelInput, { target: { value: '2' } })
    fireEvent.blur(barbarianLevelInput)

    await waitFor(() => {
      expect(screen.getByText('Character level: 5')).toBeInTheDocument()
    })
  })

  it('opens the multiclass catalogue with its own heading', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectMulticlassMode(user)

    expect(
      screen.getByRole('heading', { name: 'Multiclass', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fighter/i })).toBeInTheDocument()
    expect(
      screen.queryByText(/how will your character gain their class levels/i),
    ).not.toBeInTheDocument()
  })

  it('returns to the class-path introduction when Change is selected', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    expect(screen.getByRole('button', { name: 'Fighter' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^change$/i }))

    expect(
      screen.getByText(/how will your character gain their class levels/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Fighter' })).not.toBeInTheDocument()
  })

  it('preserves a configured class when switching from single class to multiclass', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await user.click(screen.getByRole('radio', { name: /Defense/i }))
    await user.click(screen.getByRole('checkbox', { name: 'Athletics' }))
    await user.click(screen.getByRole('checkbox', { name: 'Perception' }))

    await user.click(screen.getByRole('button', { name: /^change$/i }))
    await selectMulticlassMode(user)
    await user.click(screen.getByRole('button', { name: /^confirm$/i }))

    expect(screen.getByText(/✓ Fighter/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fighter/i, pressed: true })).toBeInTheDocument()
  })

  it('requires confirmation before reducing multiclass to single class', async () => {
    const user = userEvent.setup()
    render(
      <ClassPickerHarnessWithCommitted
        initialBuildMode="multiclass"
        initialTargetLevel={2}
        initialCommitted={[
          {
            instanceId: 'fighter-instance',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {
              'fighting-style': 'defense',
              'skill-proficiencies': ['athletics', 'perception'],
            },
          },
          {
            instanceId: 'barbarian-instance',
            classId: 'srd-2024:barbarian',
            level: 1,
            choices: {},
          },
        ]}
        initialStartingClassInstanceId="fighter-instance"
      />,
    )
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: /^change$/i }))
    await selectClassPath(user, 'single-class')

    expect(
      screen.getByRole('alertdialog', { name: /switch to single class/i }),
    ).toBeInTheDocument()
  })
})
