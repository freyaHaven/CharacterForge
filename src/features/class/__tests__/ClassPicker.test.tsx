// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useMemo, useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { useClassEditor } from '../../../app/hooks/useClassEditor'
import { clearClassEditorWorkflow } from '../../../app/session/classEditorWorkflowStorage'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import type { Character } from '../../../domain/types'
import type { CharacterClassSelection } from '../../../domain/class/types'
import type { ClassBuildMode } from '../classBuildMode'
import {
  createEmptyClassSelectionDrafts,
  type ClassSelectionDraft,
  type ClassSelectionDrafts,
} from '../classSelectionDraft'
import { ClassPicker } from '../ClassPicker'

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
  const featCatalog = useMemo(() => createBundledFeatCatalog(), [])
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
      featCatalog={featCatalog}
      characterFeatId={null}
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
  const input = screen.getByRole('spinbutton', { name: /^level$/i })
  fireEvent.change(input, { target: { value: String(level) } })
  fireEvent.blur(input)

  await waitFor(() => {
    expect(input).toHaveValue(level)
  })
}

function getOverviewColumn() {
  return document.querySelector('.class-picker__overview-column') as HTMLElement
}

function getProgressionColumn() {
  return document.querySelector('.class-picker__progression-column') as HTMLElement
}

function getFeatureAccordionButton(name: RegExp | string) {
  return within(getProgressionColumn()).getByRole('button', { name })
}

function expectFeatureIncomplete(name: RegExp | string) {
  const button = getFeatureAccordionButton(name)
  expect(
    button.querySelector('.class-picker__feature-accordion-warning'),
  ).not.toBeNull()
}

function expectFeatureComplete(name: RegExp | string) {
  const button = getFeatureAccordionButton(name)
  expect(button).toHaveTextContent(/Complete/i)
  expect(
    button.querySelector('.class-picker__feature-accordion-warning'),
  ).toBeNull()
}

async function expandFeatureAccordion(
  user: ReturnType<typeof userEvent.setup>,
  name: RegExp | string,
) {
  const button = getFeatureAccordionButton(name)

  if (button.getAttribute('aria-expanded') !== 'true') {
    await user.click(button)
  }

  return button
}

async function completeLevel1FighterChoices(
  user: ReturnType<typeof userEvent.setup>,
  {
    fightingStyle = /Defense/i,
    skills = ['Athletics', 'Perception'] as const,
    weapons = ['Longsword', 'Shortbow', 'Battleaxe'] as const,
  }: {
    fightingStyle?: RegExp | string
    skills?: readonly [string, string]
    weapons?: readonly [string, string, string]
  } = {},
) {
  await expandFeatureAccordion(user, /Fighting Style/i)
  await user.click(screen.getByRole('radio', { name: fightingStyle }))
  await expandFeatureAccordion(user, /Core Fighter Traits/i)
  await user.click(screen.getByRole('checkbox', { name: new RegExp(`^${skills[0]}\\b`) }))
  await user.click(screen.getByRole('checkbox', { name: new RegExp(`^${skills[1]}\\b`) }))
  await expandFeatureAccordion(user, /^Weapon Mastery(?! \(Additional\))/i)
  await user.click(screen.getByRole('checkbox', { name: new RegExp(`^${weapons[0]}\\b`) }))
  await user.click(screen.getByRole('checkbox', { name: new RegExp(`^${weapons[1]}\\b`) }))
  await user.click(screen.getByRole('checkbox', { name: new RegExp(`^${weapons[2]}\\b`) }))
}

const LEVEL_1_FIGHTER_CHOICES = {
  'fighting-style': 'defense',
  'skill-proficiencies': ['athletics', 'perception'],
  'weapon-mastery': ['longsword', 'shortbow', 'battleaxe'],
} as const

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

    const fightingStyle = getFeatureAccordionButton(/Fighting Style/i)
    expect(fightingStyle).toBeInTheDocument()
    expect(fightingStyle).toHaveAttribute('aria-expanded', 'false')
    expect(fightingStyle).toHaveTextContent(/1 choice/i)
    expect(fightingStyle).toHaveTextContent(/1st level/i)

    await expandFeatureAccordion(user, /Fighting Style/i)
    expect(screen.getByRole('radio', { name: /Defense/i })).toBeInTheDocument()

    const coreTraits = getFeatureAccordionButton(/Core Fighter Traits/i)
    expect(coreTraits).toHaveTextContent(/2 choices/i)
    await expandFeatureAccordion(user, /Core Fighter Traits/i)

    const progressionColumn = getProgressionColumn()
    expect(
      within(progressionColumn).getByRole('group', {
        name: /choose two skill proficiencies/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(getOverviewColumn()).queryByRole('checkbox', { name: /Athletics/ }),
    ).not.toBeInTheDocument()
    expect(getOverviewColumn()).not.toHaveTextContent(
      /Complete required choices to confirm/i,
    )
    expect(getOverviewColumn()).not.toHaveTextContent(/Current Choices/i)
    expectFeatureIncomplete(/Fighting Style/i)
    expectFeatureIncomplete(/^Weapon Mastery(?! \(Additional\))/i)
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

  it('commits when fighting style, skills, and weapon mastery are chosen', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await completeLevel1FighterChoices(user, {
      fightingStyle: /Archery/i,
      skills: ['Athletics', 'Survival'],
    })

    expect(screen.getByRole('radio', { name: /Archery/i })).toBeChecked()
    expectFeatureComplete(/Fighting Style/i)
    expectFeatureComplete(/Core Fighter Traits/i)
    expectFeatureComplete(/^Weapon Mastery(?! \(Additional\))/i)
    expect(getOverviewColumn()).not.toHaveTextContent(/Current Choices/i)
    expect(getOverviewColumn()).toHaveTextContent(/Fighter/i)
    expect(screen.getByRole('spinbutton', { name: /^level$/i })).toHaveValue(1)
  })

  it('prevents selecting more than two skills and allows deselection', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await expandFeatureAccordion(user, /Core Fighter Traits/i)

    const progressionColumn = getProgressionColumn()
    const athletics = within(progressionColumn).getByRole('checkbox', {
      name: /Athletics/,
    })
    const perception = within(progressionColumn).getByRole('checkbox', {
      name: /Perception/,
    })
    const history = within(progressionColumn).getByRole('checkbox', {
      name: /History/,
    })

    await user.click(athletics)
    await user.click(perception)
    expect(history).toBeDisabled()

    await user.click(athletics)
    expect(history).not.toBeDisabled()
    expect(athletics).not.toBeChecked()
    expect(perception).toBeChecked()
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
              ...LEVEL_1_FIGHTER_CHOICES,
            },
          },
        ]}
        initialInstanceId="test-class-instance"
        initialStartingClassInstanceId="test-class-instance"
      />,
    )
    await waitForClassesLoaded()

    await expandFeatureAccordion(user, /Core Fighter Traits/i)
    await user.click(screen.getByRole('checkbox', { name: /Athletics/ }))

    expect(getOverviewColumn()).not.toHaveTextContent(/Current Choices/i)
    expectFeatureIncomplete(/Core Fighter Traits/i)
  })

  it('shows feature accordions for level 1 including weapon mastery', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    expect(getFeatureAccordionButton(/^Weapon Mastery(?! \(Additional\))/i)).toHaveTextContent(
      /3 choices/i,
    )
    expectFeatureIncomplete(/^Weapon Mastery(?! \(Additional\))/i)
    expect(getFeatureAccordionButton(/Second Wind/i)).toBeInTheDocument()
    expect(
      document.querySelector('.class-picker__feature-level-title'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Level 3', level: 5 }),
    ).not.toBeInTheDocument()

    await expandFeatureAccordion(user, /^Weapon Mastery(?! \(Additional\))/i)
    expect(screen.queryByText(/equipment step/i)).not.toBeInTheDocument()
    expect(
      screen.getByText(/three kinds of Simple or Martial weapons/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /Longsword \(Sap\)/ }),
    ).toBeInTheDocument()
  })

  it('hides already selected weapons from additional weapon mastery', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await completeLevel1FighterChoices(user)

    const baseMastery = getFeatureAccordionButton(
      /^Weapon Mastery(?! \(Additional\))/i,
    )
    if (baseMastery.getAttribute('aria-expanded') === 'true') {
      await user.click(baseMastery)
    }

    await setClassLevel(4)

    const additionalPanel = await expandFeatureAccordion(
      user,
      /Weapon Mastery \(Additional\)/i,
    )
    const panelId = additionalPanel.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    const panel = document.getElementById(panelId!)
    expect(panel).not.toBeNull()

    expect(
      within(panel as HTMLElement).queryByRole('checkbox', {
        name: /^Longsword\b/,
      }),
    ).not.toBeInTheDocument()
    expect(
      within(panel as HTMLElement).queryByRole('checkbox', {
        name: /^Shortbow\b/,
      }),
    ).not.toBeInTheDocument()
    expect(
      within(panel as HTMLElement).queryByRole('checkbox', {
        name: /^Battleaxe\b/,
      }),
    ).not.toBeInTheDocument()
    expect(
      within(panel as HTMLElement).getByRole('checkbox', {
        name: /^Greatsword\b/,
      }),
    ).toBeInTheDocument()
  })

  it('shows subclass features under Champion when selected', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await completeLevel1FighterChoices(user)

    await waitFor(() => {
      expectFeatureComplete(/Fighting Style/i)
    })

    await setClassLevel(3)

    const subclassAccordion = getFeatureAccordionButton(/Fighter Subclass/i)
    expect(subclassAccordion).toBeInTheDocument()
    expect(subclassAccordion).toHaveAttribute('aria-expanded', 'false')
    await expandFeatureAccordion(user, /Fighter Subclass/i)
    expectFeatureIncomplete(/Fighter Subclass/i)

    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /Champion/i }),
      ).toBeInTheDocument()
    })
    await user.click(screen.getByRole('radio', { name: /Champion/i }))

    await waitFor(() => {
      expectFeatureComplete(/Fighter Subclass/i)
      expect(screen.getByText('Improved Critical')).toBeInTheDocument()
      expect(screen.getByText('Remarkable Athlete')).toBeInTheDocument()
      expect(
        screen.getByText(
          /score a Critical Hit on a roll of 19 or 20 on the d20/i,
        ),
      ).toBeInTheDocument()
    })
  })

  it('shows level 5 features after completing level 3 choices', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await completeLevel1FighterChoices(user)
    await setClassLevel(3)
    await expandFeatureAccordion(user, /Fighter Subclass/i)
    await waitFor(() => {
      expect(
        screen.getByRole('radio', { name: /Champion/i }),
      ).toBeInTheDocument()
    })
    await user.click(screen.getByRole('radio', { name: /Champion/i }))

    await waitFor(() => {
      expectFeatureComplete(/Fighter Subclass/i)
    })

    await setClassLevel(5)

    expect(getFeatureAccordionButton(/Extra Attack/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Level 5', level: 5 }),
    ).not.toBeInTheDocument()
    expect(document.querySelector('.class-picker__summary-subtitle')).toHaveTextContent(
      'Champion',
    )
    expect(screen.getByRole('spinbutton', { name: /^level$/i })).toHaveValue(5)
    expectFeatureComplete(/Fighting Style/i)
  })

  it('preserves feature choice expansion state across level changes', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await selectSingleClassMode(user)
    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await expandFeatureAccordion(user, /Fighting Style/i)
    await user.click(screen.getByRole('radio', { name: /Defense/i }))

    expect(
      getFeatureAccordionButton(/Fighting Style/i),
    ).toHaveAttribute('aria-expanded', 'true')

    await setClassLevel(3)

    expect(
      getFeatureAccordionButton(/Fighting Style/i),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(
      getFeatureAccordionButton(/Fighter Subclass/i),
    ).toHaveAttribute('aria-expanded', 'false')

    await expandFeatureAccordion(user, /Fighter Subclass/i)
    await user.click(
      screen.getByRole('radio', { name: /Champion/i }),
    )
    await setClassLevel(1)

    expect(
      screen.queryByRole('button', { name: /Fighter Subclass|Champion/i }),
    ).not.toBeInTheDocument()
    expect(
      getFeatureAccordionButton(/Fighting Style/i),
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
      screen.queryByRole('heading', { name: 'Class Features', level: 3 }),
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
      screen.getByRole('heading', { name: 'Class Features', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Fighter', { selector: '.class-picker__overview-class-name' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /^level$/i })).toHaveValue(1)
    expect(
      within(overviewColumn).queryByRole('checkbox', { name: /Athletics/ }),
    ).not.toBeInTheDocument()
    expect(
      within(progressionColumn).getByRole('button', { name: /Core Fighter Traits/i }),
    ).toBeInTheDocument()
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
              ...LEVEL_1_FIGHTER_CHOICES,
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
              ...LEVEL_1_FIGHTER_CHOICES,
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
              ...LEVEL_1_FIGHTER_CHOICES,
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
    await expandFeatureAccordion(user, /Fighting Style/i)
    await user.click(screen.getByRole('radio', { name: /Defense/i }))
    await expandFeatureAccordion(user, /Core Fighter Traits/i)
    await user.click(screen.getByRole('checkbox', { name: /Athletics/ }))
    await user.click(screen.getByRole('checkbox', { name: /Perception/ }))

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
              ...LEVEL_1_FIGHTER_CHOICES,
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
