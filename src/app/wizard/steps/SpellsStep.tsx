import { useEffect, useMemo, useState } from 'react'
import type { SpellCatalog } from '../../../domain/ports/spellCatalog'
import type { SpellDefinition } from '../../../domain/spell/types'
import type { SpellSourceRef, SpellSourceState } from '../../../domain/spell/types'
import { spellSourcesEqual } from '../../../domain/spell/sourceKey'
import { formatAbilityLabel } from '../../../features/class/formatClassDetails'
import { buildEntitlementCountDisplay } from '../../../features/spells/entitlementCountDisplay'
import { SpellSelectionGrid } from '../../../features/spells/SpellSelectionGrid'
import type {
  CharacterSpellcastingSummary,
  ResolvedSpellEntitlement,
  ResolvedSpellSourceGroup,
} from '../../../rules/character/resolveCharacterSpellcasting'
import { evaluateSpellCatalogueEligibility } from '../../../rules/spell/spellSelectionEligibility'
import type { SpellValidationIssue } from '../../../rules/spell/validateSpellSourceStates'

type SpellsStepProps = {
  summary: CharacterSpellcastingSummary
  spellSourceStates: SpellSourceState[]
  onChangeSpellSourceStates: (next: SpellSourceState[]) => void
  spellCatalog: SpellCatalog
  validationIssues: SpellValidationIssue[]
}

function upsertSelections(
  states: SpellSourceState[],
  source: SpellSourceRef,
  spellIds: string[],
): SpellSourceState[] {
  const nextState: SpellSourceState = {
    source,
    selections: spellIds.map((spellId) => ({ spellId })),
  }

  const index = states.findIndex((state) =>
    spellSourcesEqual(state.source, source),
  )

  if (index === -1) {
    return [...states, nextState]
  }

  return states.map((state, stateIndex) =>
    stateIndex === index ? nextState : state,
  )
}

function findSourceForEntitlement(
  summary: CharacterSpellcastingSummary,
  group: ResolvedSpellSourceGroup,
  entitlement: ResolvedSpellEntitlement,
): SpellSourceRef | undefined {
  return summary.activeSources.find((candidate) => {
    if (candidate.entitlementId !== entitlement.entitlementId) {
      return false
    }
    if (candidate.kind === 'class-instance') {
      return group.groupId === `class:${candidate.instanceId}`
    }
    if (candidate.kind === 'feat') {
      if (candidate.slot === 'class-choice') {
        return (
          group.groupId ===
          `feat:class-choice:${candidate.instanceId}:${candidate.choiceId}:${candidate.featId}`
        )
      }
      return group.groupId === `feat:${candidate.slot}:${candidate.featId}`
    }
    if (candidate.kind === 'background-origin') {
      return group.groupId === `background-origin:${candidate.backgroundId}`
    }
    return false
  })
}

/** Under-limit counts are already shown on entitlement headings — omit those sentences. */
function isDisplayedSpellIssue(issue: SpellValidationIssue): boolean {
  return issue.code !== 'under-limit'
}

function issueBelongsToGroup(
  issue: SpellValidationIssue,
  group: ResolvedSpellSourceGroup,
): boolean {
  if (issue.groupLabel === group.label) {
    return true
  }
  if (
    issue.entitlementId !== undefined &&
    group.entitlements.some(
      (entitlement) => entitlement.entitlementId === issue.entitlementId,
    )
  ) {
    return true
  }
  return false
}

function formatIssueMessageForGroup(
  issue: SpellValidationIssue,
  groupLabel: string,
): string {
  const prefix = `${groupLabel} — `
  if (issue.message.startsWith(prefix)) {
    return issue.message.slice(prefix.length)
  }
  return issue.message
}

function SelectEntitlementEditor({
  summary,
  group,
  entitlement,
  source,
  spellSourceStates,
  onChangeSpellSourceStates,
  availableSpells,
  invalidSpellIds,
  slotsByLevel,
}: {
  summary: CharacterSpellcastingSummary
  group: ResolvedSpellSourceGroup
  entitlement: ResolvedSpellEntitlement
  source: SpellSourceRef
  spellSourceStates: SpellSourceState[]
  onChangeSpellSourceStates: (next: SpellSourceState[]) => void
  availableSpells: SpellDefinition[]
  invalidSpellIds: ReadonlySet<string>
  slotsByLevel: readonly number[] | null
}) {
  const selected = new Set(entitlement.selectedSpellIds)
  const grantedIds = new Set(
    entitlement.grantedSpells.map((grant) => grant.spellId),
  )

  const grantedSpells = useMemo(() => {
    return entitlement.grantedSpells
      .map((grant) => availableSpells.find((spell) => spell.id === grant.spellId))
      .filter((spell): spell is SpellDefinition => spell !== undefined)
  }, [availableSpells, entitlement.grantedSpells])

  const selectableSpells = useMemo(() => {
    const eligible = availableSpells.filter(
      (spell) =>
        entitlement.accessibleLevels.includes(spell.level) &&
        !grantedIds.has(spell.id),
    )

    const byId = new Map(eligible.map((spell) => [spell.id, spell]))

    // Soft-invalid: keep stale/selected spells visible even if no longer eligible.
    for (const spellId of entitlement.selectedSpellIds) {
      if (byId.has(spellId) || grantedIds.has(spellId)) {
        continue
      }
      const stale = availableSpells.find((spell) => spell.id === spellId)
      if (stale !== undefined) {
        byId.set(stale.id, stale)
      }
    }

    return [...byId.values()].sort(
      (a, b) => a.level - b.level || a.name.localeCompare(b.name),
    )
  }, [
    availableSpells,
    entitlement.accessibleLevels,
    entitlement.selectedSpellIds,
    grantedIds,
  ])

  const countDisplay = useMemo(() => {
    const spellLevelById = new Map(
      availableSpells.map((spell) => [spell.id, spell.level]),
    )
    const countingGrantLevels = entitlement.grantedSpells
      .filter((grant) => grant.countsAgainstLimit)
      .map((grant) => spellLevelById.get(grant.spellId))
      .filter((level): level is number => level !== undefined)

    return buildEntitlementCountDisplay({
      entitlementLabel: entitlement.label,
      limit: entitlement.limit,
      accessibleLevels: entitlement.accessibleLevels,
      spellLevelById,
      selectedSpellIds: entitlement.selectedSpellIds,
      countingGrantLevels,
      slotsByLevel,
    })
  }, [
    availableSpells,
    entitlement.accessibleLevels,
    entitlement.grantedSpells,
    entitlement.label,
    entitlement.limit,
    entitlement.selectedSpellIds,
    slotsByLevel,
  ])

  const eligibilityBySpellId = useMemo(() => {
    return evaluateSpellCatalogueEligibility({
      summary,
      group,
      entitlement,
      spellIds: selectableSpells.map((spell) => spell.id),
    })
  }, [summary, group, entitlement, selectableSpells])

  function toggle(spellId: string) {
    const eligibility = eligibilityBySpellId.get(spellId)
    if (
      eligibility?.recommendation === 'blocked' &&
      !selected.has(spellId)
    ) {
      return
    }

    if (!selected.has(spellId)) {
      const countingGrants = entitlement.grantedSpells.filter(
        (grant) => grant.countsAgainstLimit,
      ).length
      const used = entitlement.selectedSpellIds.length + countingGrants
      if (used >= entitlement.limit) {
        return
      }

      const spell = selectableSpells.find((entry) => entry.id === spellId)
      if (spell !== undefined) {
        const levelRow = countDisplay.levelRows.find(
          (row) => row.level === spell.level,
        )
        if (
          levelRow?.capacity !== null &&
          levelRow !== undefined &&
          levelRow.selected >= levelRow.capacity
        ) {
          return
        }
      }
    }

    const nextIds = selected.has(spellId)
      ? entitlement.selectedSpellIds.filter((id) => id !== spellId)
      : [...entitlement.selectedSpellIds, spellId]

    onChangeSpellSourceStates(
      upsertSelections(spellSourceStates, source, nextIds),
    )
  }

  const idPrefix = `${group.groupId}-${entitlement.entitlementId}`
  const countingGrants = entitlement.grantedSpells.filter(
    (grant) => grant.countsAgainstLimit,
  ).length
  const used =
    entitlement.selectedSpellIds.length + countingGrants
  const atSelectionLimit = used >= entitlement.limit

  return (
    <SpellSelectionGrid
      idPrefix={idPrefix}
      title={entitlement.label}
      countLabel={countDisplay.countLabel}
      levelRows={countDisplay.levelRows}
      selectableSpells={selectableSpells}
      grantedSpells={grantedSpells}
      selectedSpellIds={selected}
      invalidSpellIds={invalidSpellIds}
      eligibilityBySpellId={eligibilityBySpellId}
      atSelectionLimit={atSelectionLimit}
      onToggleSpell={toggle}
    />
  )
}

export function SpellsStep({
  summary,
  spellSourceStates,
  onChangeSpellSourceStates,
  spellCatalog,
  validationIssues,
}: SpellsStepProps) {
  const [spellsByList, setSpellsByList] = useState<
    Record<string, SpellDefinition[]>
  >({})
  const [spellsById, setSpellsById] = useState<Record<string, SpellDefinition>>(
    {},
  )

  useEffect(() => {
    let isActive = true

    async function loadLists() {
      const listIds = new Set<string>()
      const grantedSpellIds = new Set<string>()

      for (const group of summary.groups) {
        for (const entitlement of group.entitlements) {
          if (entitlement.listId !== undefined) {
            listIds.add(entitlement.listId)
          }
          for (const grant of entitlement.grantedSpells) {
            grantedSpellIds.add(grant.spellId)
          }
        }
      }

      const nextLists: Record<string, SpellDefinition[]> = {}
      const nextById: Record<string, SpellDefinition> = {}

      for (const listId of listIds) {
        const list = await spellCatalog.getSpellList(listId)
        if (list === null) {
          nextLists[listId] = []
          continue
        }
        const spells = await Promise.all(
          list.spellIds.map((spellId) => spellCatalog.getSpell(spellId)),
        )
        const resolved = spells.filter(
          (spell): spell is SpellDefinition => spell !== null,
        )
        nextLists[listId] = resolved
        for (const spell of resolved) {
          nextById[spell.id] = spell
        }
      }

      for (const spellId of grantedSpellIds) {
        if (nextById[spellId] !== undefined) {
          continue
        }
        const spell = await spellCatalog.getSpell(spellId)
        if (spell !== null) {
          nextById[spell.id] = spell
        }
      }

      if (isActive) {
        setSpellsByList(nextLists)
        setSpellsById(nextById)
      }
    }

    void loadLists()

    return () => {
      isActive = false
    }
  }, [summary.groups, spellCatalog])

  const displayedIssues = useMemo(
    () => validationIssues.filter(isDisplayedSpellIssue),
    [validationIssues],
  )

  const unscopedIssues = useMemo(
    () =>
      displayedIssues.filter(
        (issue) =>
          !summary.groups.some((group) => issueBelongsToGroup(issue, group)),
      ),
    [displayedIssues, summary.groups],
  )

  const slotsByLevel = summary.sharedSlots?.slotsByLevel ?? null

  return (
    <section
      aria-labelledby="wizard-step-spells-heading"
      className="wizard-step-panel"
    >
      <h2 id="wizard-step-spells-heading">Spells</h2>
      <p className="wizard-step-panel__intro">
        Always prepared spells do not use your preparation limit.
      </p>

      {unscopedIssues.length > 0 ? (
        <ul className="spells-validation" aria-label="Spell validation issues">
          {unscopedIssues.map((issue, index) => (
            <li key={`${issue.code}-${issue.sourceKey}-${index}`}>
              {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      {summary.groups.map((group) => {
        const groupIssues = displayedIssues.filter((issue) =>
          issueBelongsToGroup(issue, group),
        )

        return (
          <section
            key={group.groupId}
            className="spells-source"
            aria-labelledby={`spells-source-${group.groupId}`}
          >
            <h3 id={`spells-source-${group.groupId}`}>{group.label}</h3>
            <p className="spells-source__meta">
              {formatAbilityLabel(group.ability)} · Save DC {group.saveDcLabel}{' '}
              · Spell Attack {group.attackBonusLabel}
            </p>

            {groupIssues.length > 0 ? (
              <ul
                className="spells-validation spells-validation--source"
                aria-label={`${group.label} spell validation issues`}
              >
                {groupIssues.map((issue, index) => (
                  <li key={`${issue.code}-${issue.sourceKey}-${index}`}>
                    {formatIssueMessageForGroup(issue, group.label)}
                  </li>
                ))}
              </ul>
            ) : null}

            {group.entitlements.map((entitlement) => {
              if (entitlement.kind === 'granted') {
                const foldedIntoSelect = group.entitlements.some(
                  (entry) =>
                    entry.kind === 'select' && entry.grantedSpells.length > 0,
                )
                if (foldedIntoSelect) {
                  return null
                }

                const grantedDefinitions = entitlement.grantedSpells
                  .map((grant) => spellsById[grant.spellId])
                  .filter(
                    (spell): spell is SpellDefinition => spell !== undefined,
                  )

                return (
                  <SpellSelectionGrid
                    key={entitlement.entitlementId}
                    idPrefix={`${group.groupId}-${entitlement.entitlementId}`}
                    title={entitlement.label}
                    countLabel="Always prepared"
                    selectableSpells={[]}
                    grantedSpells={grantedDefinitions}
                    selectedSpellIds={new Set()}
                    onToggleSpell={() => undefined}
                  />
                )
              }

              const resolvedSource = findSourceForEntitlement(
                summary,
                group,
                entitlement,
              )

              if (resolvedSource === undefined) {
                return null
              }

              const sourceInvalidIds = new Set(
                validationIssues
                  .filter(
                    (issue) =>
                      issue.entitlementId === entitlement.entitlementId &&
                      issue.spellId !== undefined,
                  )
                  .map((issue) => issue.spellId!),
              )

              const listSpells =
                entitlement.listId !== undefined
                  ? (spellsByList[entitlement.listId] ?? [])
                  : []

              // Merge catalog spells for granted ids that may not be on this list.
              const availableSpells = [...listSpells]
              for (const grant of entitlement.grantedSpells) {
                const spell = spellsById[grant.spellId]
                if (
                  spell !== undefined &&
                  !availableSpells.some((entry) => entry.id === spell.id)
                ) {
                  availableSpells.push(spell)
                }
              }

              return (
                <SelectEntitlementEditor
                  key={entitlement.entitlementId}
                  summary={summary}
                  group={group}
                  entitlement={entitlement}
                  source={resolvedSource}
                  spellSourceStates={spellSourceStates}
                  onChangeSpellSourceStates={onChangeSpellSourceStates}
                  availableSpells={availableSpells}
                  invalidSpellIds={sourceInvalidIds}
                  slotsByLevel={slotsByLevel}
                />
              )
            })}
          </section>
        )
      })}
    </section>
  )
}
