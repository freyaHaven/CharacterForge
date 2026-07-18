import { useEffect, useState } from 'react'
import type { SpellCatalog } from '../../../domain/ports/spellCatalog'
import type { SpellDefinition } from '../../../domain/spell/types'
import type { SpellSourceRef, SpellSourceState } from '../../../domain/spell/types'
import { spellSourcesEqual } from '../../../domain/spell/sourceKey'
import type {
  CharacterSpellcastingSummary,
  ResolvedSpellEntitlement,
  ResolvedSpellSourceGroup,
} from '../../../rules/character/resolveCharacterSpellcasting'
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

function formatSpellSlots(slotsByLevel: number[]): string {
  const parts: string[] = []
  for (let level = 0; level < slotsByLevel.length; level += 1) {
    const count = slotsByLevel[level] ?? 0
    if (count <= 0) {
      continue
    }
    const ordinal =
      level === 0
        ? '1st'
        : level === 1
          ? '2nd'
          : level === 2
            ? '3rd'
            : `${level + 1}th`
    parts.push(`${ordinal}: ${count}`)
  }
  return parts.length > 0 ? parts.join(' · ') : 'None'
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
      return group.groupId === `feat:${candidate.slot}:${candidate.featId}`
    }
    if (candidate.kind === 'background-origin') {
      return group.groupId === `background-origin:${candidate.backgroundId}`
    }
    return false
  })
}

function SelectEntitlementEditor({
  group,
  entitlement,
  source,
  spellSourceStates,
  onChangeSpellSourceStates,
  availableSpells,
}: {
  group: ResolvedSpellSourceGroup
  entitlement: ResolvedSpellEntitlement
  source: SpellSourceRef
  spellSourceStates: SpellSourceState[]
  onChangeSpellSourceStates: (next: SpellSourceState[]) => void
  availableSpells: SpellDefinition[]
}) {
  const selected = new Set(entitlement.selectedSpellIds)
  const grantedIds = new Set(
    entitlement.grantedSpells.map((grant) => grant.spellId),
  )

  const selectable = availableSpells.filter(
    (spell) =>
      entitlement.accessibleLevels.includes(spell.level) &&
      !grantedIds.has(spell.id),
  )

  function toggle(spellId: string) {
    const nextIds = selected.has(spellId)
      ? entitlement.selectedSpellIds.filter((id) => id !== spellId)
      : [...entitlement.selectedSpellIds, spellId]

    onChangeSpellSourceStates(
      upsertSelections(spellSourceStates, source, nextIds),
    )
  }

  return (
    <div className="spells-entitlement">
      <h4 className="spells-entitlement__title">
        {entitlement.label}{' '}
        <span className="spells-entitlement__count">
          {entitlement.selectedSpellIds.length}/{entitlement.limit}
        </span>
      </h4>
      {entitlement.grantedSpells.length > 0 ? (
        <div className="spells-granted">
          <p className="spells-granted__label">Always prepared</p>
          <ul className="spells-granted__list">
            {entitlement.grantedSpells.map((grant) => (
              <li key={grant.spellId}>{grant.name}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <ul className="spells-picker">
        {selectable.map((spell) => {
          const checked = selected.has(spell.id)
          const inputId = `${group.groupId}-${entitlement.entitlementId}-${spell.id}`
          return (
            <li key={spell.id}>
              <label htmlFor={inputId}>
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(spell.id)}
                />{' '}
                {spell.name}
                {spell.level === 0 ? ' (cantrip)' : ` (level ${spell.level})`}
              </label>
            </li>
          )
        })}
      </ul>
    </div>
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

  useEffect(() => {
    let isActive = true

    async function loadLists() {
      const listIds = new Set<string>()
      for (const group of summary.groups) {
        for (const entitlement of group.entitlements) {
          if (entitlement.listId !== undefined) {
            listIds.add(entitlement.listId)
          }
        }
      }

      const next: Record<string, SpellDefinition[]> = {}
      for (const listId of listIds) {
        const list = await spellCatalog.getSpellList(listId)
        if (list === null) {
          next[listId] = []
          continue
        }
        const spells = await Promise.all(
          list.spellIds.map((spellId) => spellCatalog.getSpell(spellId)),
        )
        next[listId] = spells
          .filter((spell): spell is SpellDefinition => spell !== null)
          .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
      }

      if (isActive) {
        setSpellsByList(next)
      }
    }

    void loadLists()

    return () => {
      isActive = false
    }
  }, [summary.groups, spellCatalog])

  return (
    <section
      aria-labelledby="wizard-step-spells-heading"
      className="wizard-step-panel"
    >
      <h2 id="wizard-step-spells-heading">Spells</h2>
      <p className="wizard-step-panel__intro">
        Prepare and learn spells from each of your spellcasting sources. Always
        prepared spells are listed automatically and do not use your preparation
        limit.
      </p>

      {summary.sharedSlots !== null ? (
        <div className="spells-slots">
          <h3 className="spells-slots__title">Spell slots</h3>
          <p>{formatSpellSlots(summary.sharedSlots.slotsByLevel)}</p>
        </div>
      ) : null}

      {validationIssues.length > 0 ? (
        <ul className="spells-validation" aria-label="Spell validation issues">
          {validationIssues.map((issue, index) => (
            <li key={`${issue.code}-${issue.sourceKey}-${index}`}>
              {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      {summary.groups.map((group) => (
        <section
          key={group.groupId}
          className="spells-source"
          aria-labelledby={`spells-source-${group.groupId}`}
        >
          <h3 id={`spells-source-${group.groupId}`}>{group.label}</h3>
          <p className="spells-source__meta">
            Save DC {group.saveDcLabel} · Attack {group.attackBonusLabel}
          </p>

          {group.entitlements.map((entitlement) => {
            if (entitlement.kind === 'granted') {
              return (
                <div
                  key={entitlement.entitlementId}
                  className="spells-entitlement"
                >
                  <h4 className="spells-entitlement__title">
                    {entitlement.label}
                  </h4>
                  <ul className="spells-granted__list">
                    {entitlement.grantedSpells.map((grant) => (
                      <li key={grant.spellId}>
                        {grant.name} (always prepared)
                      </li>
                    ))}
                  </ul>
                </div>
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

            return (
              <SelectEntitlementEditor
                key={entitlement.entitlementId}
                group={group}
                entitlement={entitlement}
                source={resolvedSource}
                spellSourceStates={spellSourceStates}
                onChangeSpellSourceStates={onChangeSpellSourceStates}
                availableSpells={
                  entitlement.listId !== undefined
                    ? (spellsByList[entitlement.listId] ?? [])
                    : []
                }
              />
            )
          })}
        </section>
      ))}
    </section>
  )
}
