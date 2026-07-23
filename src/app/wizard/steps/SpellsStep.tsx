import { useEffect, useMemo, useState } from 'react'
import type { SpellCatalog } from '../../../domain/ports/spellCatalog'
import type { SpellDefinition } from '../../../domain/spell/types'
import type { SpellSourceRef, SpellSourceState } from '../../../domain/spell/types'
import { spellSourcesEqual } from '../../../domain/spell/sourceKey'
import {
  ThresholdCollapseList,
  formatThresholdCollapseTitle,
} from '../../../features/choices/ThresholdCollapseList'
import { formatAbilityLabel } from '../../../features/class/formatClassDetails'
import { buildEntitlementCountDisplay } from '../../../features/spells/entitlementCountDisplay'
import { SpellSelectionCard } from '../../../features/spells/SpellSelectionCard'
import { SpellSelectionGrid } from '../../../features/spells/SpellSelectionGrid'
import { buildSpellPresentationModel } from '../../../features/spells/spellPresentationModel'
import { resolveSpellSectionDefaultExpanded } from '../../../features/spells/spellSectionCollapse'
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
    if (candidate.kind === 'species-trait') {
      return (
        group.groupId ===
        `species-trait:${candidate.speciesId}:${candidate.traitId}`
      )
    }
    return false
  })
}

/** Under-limit counts are already shown on entitlement headings — omit those sentences. */
function isDisplayedSpellIssue(issue: SpellValidationIssue): boolean {
  return issue.code !== 'under-limit'
}

function issueBelongsToGroups(
  issue: SpellValidationIssue,
  groups: readonly ResolvedSpellSourceGroup[],
): boolean {
  return groups.some((group) => {
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
  })
}

function formatIssueMessageForSource(
  issue: SpellValidationIssue,
  sourceTitle: string,
  groups: readonly ResolvedSpellSourceGroup[],
): string {
  for (const group of groups) {
    const prefix = `${group.label} — `
    if (issue.message.startsWith(prefix)) {
      return issue.message.slice(prefix.length)
    }
  }
  const sourcePrefix = `${sourceTitle} — `
  if (issue.message.startsWith(sourcePrefix)) {
    return issue.message.slice(sourcePrefix.length)
  }
  return issue.message
}

function SelectEntitlementEditor({
  summary,
  group,
  entitlement,
  poolTitle,
  source,
  spellSourceStates,
  onChangeSpellSourceStates,
  availableSpells,
  invalidSpellIds,
  showRedundant,
}: {
  summary: CharacterSpellcastingSummary
  group: ResolvedSpellSourceGroup
  entitlement: ResolvedSpellEntitlement
  poolTitle: string
  source: SpellSourceRef
  spellSourceStates: SpellSourceState[]
  onChangeSpellSourceStates: (next: SpellSourceState[]) => void
  availableSpells: SpellDefinition[]
  invalidSpellIds: ReadonlySet<string>
  showRedundant: boolean
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
    const prepareFromBook =
      entitlement.prepareFrom === 'spellbook'
        ? new Set([
            ...(entitlement.spellbookSpellIds ?? []),
            ...grantedIds,
          ])
        : null

    const allowedSchools =
      entitlement.schools !== undefined && entitlement.schools.length > 0
        ? new Set(entitlement.schools.map((school) => school.toLowerCase()))
        : null

    const eligible = availableSpells.filter((spell) => {
      if (!entitlement.accessibleLevels.includes(spell.level)) {
        return false
      }
      if (grantedIds.has(spell.id)) {
        return false
      }
      if (prepareFromBook !== null && !prepareFromBook.has(spell.id)) {
        return false
      }
      if (
        allowedSchools !== null &&
        !allowedSchools.has(spell.school.toLowerCase())
      ) {
        return false
      }
      if (
        entitlement.castingTime !== undefined &&
        spell.castingTime !== entitlement.castingTime
      ) {
        return false
      }
      if (entitlement.ritual === true && spell.ritual !== true) {
        return false
      }
      return true
    })

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
    entitlement.castingTime,
    entitlement.prepareFrom,
    entitlement.ritual,
    entitlement.schools,
    entitlement.selectedSpellIds,
    entitlement.spellbookSpellIds,
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
      entitlementLabel: poolTitle,
      limit: entitlement.limit,
      accessibleLevels: entitlement.accessibleLevels,
      spellLevelById,
      selectedSpellIds: entitlement.selectedSpellIds,
      countingGrantLevels,
    })
  }, [
    availableSpells,
    entitlement.accessibleLevels,
    entitlement.grantedSpells,
    entitlement.limit,
    entitlement.selectedSpellIds,
    poolTitle,
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
          levelRow?.limitScope === 'group' &&
          levelRow.capacity !== null &&
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
  const used = entitlement.selectedSpellIds.length + countingGrants
  const atSelectionLimit = used >= entitlement.limit

  return (
    <>
      {entitlement.prepareFrom === 'spellbook' ? (
        <p className="spells-source__note">Prepared from your spellbook</p>
      ) : null}
      {entitlement.description !== undefined &&
      entitlement.description.length > 0 ? (
        <p className="spells-source__note">{entitlement.description}</p>
      ) : null}
      <SpellSelectionGrid
        idPrefix={idPrefix}
        title={poolTitle}
        countLabel={countDisplay.countLabel}
        selectionProgress={{ selected: used, limit: entitlement.limit }}
        levelRows={countDisplay.levelRows}
        selectableSpells={selectableSpells}
        grantedSpells={grantedSpells}
        selectedSpellIds={selected}
        invalidSpellIds={invalidSpellIds}
        eligibilityBySpellId={eligibilityBySpellId}
        atSelectionLimit={atSelectionLimit}
        showRedundant={showRedundant}
        nestedUnderSource
        onToggleSpell={toggle}
      />
    </>
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
  const [showRedundantBySource, setShowRedundantBySource] = useState<
    Record<string, boolean>
  >({})

  const presentation = useMemo(
    () => buildSpellPresentationModel(summary),
    [summary],
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
          !summary.groups.some((group) =>
            issueBelongsToGroups(issue, [group]),
          ),
      ),
    [displayedIssues, summary.groups],
  )

  function formatSlotSummary(
    slots: readonly number[],
    label: string,
  ): string {
    const parts: string[] = []
    for (let index = 0; index < slots.length; index += 1) {
      const count = slots[index] ?? 0
      if (count > 0) {
        parts.push(`${count}× L${index + 1}`)
      }
    }
    if (parts.length === 0) {
      return label
    }
    return `${label}: ${parts.join(', ')}`
  }

  return (
    <section
      aria-labelledby="wizard-step-spells-heading"
      className="wizard-step-panel"
    >
      <h2 id="wizard-step-spells-heading">Spells</h2>
      <p className="wizard-step-panel__intro">
        Always prepared spells do not use your preparation limit.
      </p>

      {summary.sharedSlots !== null || summary.pactSlots !== null ? (
        <ul className="spells-slot-summary" aria-label="Spell slot summary">
          {summary.sharedSlots !== null ? (
            <li>
              {formatSlotSummary(
                summary.sharedSlots.slotsByLevel,
                'Spell slots',
              )}
            </li>
          ) : null}
          {summary.pactSlots?.sources.map((source) => {
            const recoveryLabel =
              source.recovery === 'short-rest' ? 'short rest' : 'long rest'
            return (
              <li key={source.instanceId}>
                Pact Magic ({source.className}): {source.slotCount}× level{' '}
                {source.slotLevel} ({recoveryLabel})
              </li>
            )
          })}
        </ul>
      ) : null}

      {unscopedIssues.length > 0 ? (
        <ul className="spells-validation" aria-label="Spell validation issues">
          {unscopedIssues.map((issue, index) => (
            <li key={`${issue.code}-${issue.sourceKey}-${index}`}>
              {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      {presentation.map((category) => (
        <section
          key={category.category}
          className="spells-category"
          aria-labelledby={`spells-category-${category.category}`}
        >
          <h3
            id={`spells-category-${category.category}`}
            className="spells-category__title"
          >
            {category.label}
          </h3>

          {category.sources.map((source) => {
            const sourceIssues = displayedIssues.filter((issue) =>
              issueBelongsToGroups(issue, source.groups),
            )
            const showRedundant = showRedundantBySource[source.id] === true
            const alwaysPreparedDefinitions = source.alwaysPrepared
              .map((grant) => spellsById[grant.spellId])
              .filter(
                (spell): spell is SpellDefinition => spell !== undefined,
              )
            const hasSelectablePool = source.pools.length > 0

            return (
              <section
                key={source.id}
                className="spells-source"
                aria-labelledby={`spells-source-${source.id}`}
              >
                <h4
                  id={`spells-source-${source.id}`}
                  className="spells-source__title"
                >
                  {source.title}
                </h4>
                <p className="spells-source__meta">
                  {formatAbilityLabel(source.ability)} · Save DC{' '}
                  {source.saveDcLabel} · Spell Attack{' '}
                  {source.attackBonusLabel}
                </p>

                {sourceIssues.length > 0 ? (
                  <ul
                    className="spells-validation spells-validation--source"
                    aria-label={`${source.title} spell validation issues`}
                  >
                    {sourceIssues.map((issue, index) => (
                      <li key={`${issue.code}-${issue.sourceKey}-${index}`}>
                        {formatIssueMessageForSource(
                          issue,
                          source.title,
                          source.groups,
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {alwaysPreparedDefinitions.length > 0 ? (
                  <ThresholdCollapseList
                    id={`${source.id}-always-prepared`}
                    title={formatThresholdCollapseTitle(
                      'Always Prepared',
                      alwaysPreparedDefinitions.length,
                    )}
                    itemCount={alwaysPreparedDefinitions.length}
                    defaultExpanded={resolveSpellSectionDefaultExpanded({
                      kind: 'granted',
                      itemCount: alwaysPreparedDefinitions.length,
                    })}
                  >
                    <div
                      className="spell-selection-grid__cards spell-selection-grid__cards--granted"
                      role="list"
                      aria-label="Always Prepared"
                    >
                      {alwaysPreparedDefinitions.map((spell) => (
                        <div key={spell.id} role="listitem">
                          <SpellSelectionCard
                            spell={spell}
                            inputId={`${source.id}-granted-${spell.id}`}
                            selected
                            granted
                          />
                        </div>
                      ))}
                    </div>
                  </ThresholdCollapseList>
                ) : null}

                {hasSelectablePool ? (
                  <label className="feat-picker__show-unavailable spells-source__redundant-toggle">
                    <input
                      type="checkbox"
                      checked={showRedundant}
                      onChange={(event) => {
                        setShowRedundantBySource((previous) => ({
                          ...previous,
                          [source.id]: event.target.checked,
                        }))
                      }}
                    />
                    <span>Show redundant choices</span>
                  </label>
                ) : null}

                {source.pools.map((pool) => {
                  const resolvedSource = findSourceForEntitlement(
                    summary,
                    pool.group,
                    pool.entitlement,
                  )

                  if (resolvedSource === undefined) {
                    return null
                  }

                  const sourceInvalidIds = new Set(
                    validationIssues
                      .filter(
                        (issue) =>
                          issue.entitlementId ===
                            pool.entitlement.entitlementId &&
                          issue.spellId !== undefined,
                      )
                      .map((issue) => issue.spellId!),
                  )

                  const listSpells =
                    pool.entitlement.listId !== undefined
                      ? (spellsByList[pool.entitlement.listId] ?? [])
                      : []

                  const availableSpells = [...listSpells]
                  for (const grant of pool.entitlement.grantedSpells) {
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
                      key={`${pool.group.groupId}-${pool.entitlement.entitlementId}`}
                      summary={summary}
                      group={pool.group}
                      entitlement={pool.entitlement}
                      poolTitle={pool.title}
                      source={resolvedSource}
                      spellSourceStates={spellSourceStates}
                      onChangeSpellSourceStates={onChangeSpellSourceStates}
                      availableSpells={availableSpells}
                      invalidSpellIds={sourceInvalidIds}
                      showRedundant={showRedundant}
                    />
                  )
                })}
              </section>
            )
          })}
        </section>
      ))}
    </section>
  )
}
