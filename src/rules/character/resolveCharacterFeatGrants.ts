import type { BackgroundCatalog } from '../../domain/ports/backgroundCatalog'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import {
  isAbilityScoreImprovementChoiceId,
  parseAsiChoice,
} from '../../domain/class/abilityScoreImprovement'
import {
  getEpicBoonFeatIdFromChoiceValue,
  isEpicBoonChoiceId,
} from '../../domain/class/epicBoon'
import { getSpeciesVersatileFeatId } from '../../domain/species/resolveSpeciesDerived'
import type { Character } from '../../domain/types'

export type FeatGrantSource =
  | {
      kind: 'background-origin'
      backgroundId: string
      backgroundName: string
    }
  | {
      /** Legacy free-floating slot — new UI must not write this. */
      kind: 'character-feat'
    }
  | {
      kind: 'species-feat-grant'
      speciesId: string
      speciesDisplayName: string
      choiceId: string
      grantLabel: string
    }
  | {
      kind: 'class-feat-grant'
      instanceId: string
      classId: string
      className: string
      classLevel: number
      choiceId: string
      grantLabel: string
    }

export type ResolvedFeatGrant = {
  featId: string
  /** Sub-choices when persisted (e.g. legacy character.feat). */
  choices: Record<string, string>
  source: FeatGrantSource
  displayLabel: string
}

export type ResolvedCharacterFeats = {
  grants: ResolvedFeatGrant[]
  /**
   * Feat ids counting toward non-repeatable duplicate rules.
   * Repeatable feats may appear more than once in grants but still occupy slots.
   */
  takenFeatIds: string[]
}

export type ResolveCharacterFeatGrantsOptions = {
  classCatalog: ClassCatalog
  backgroundCatalog: BackgroundCatalog
  featCatalog?: FeatCatalog
  speciesCatalog?: SpeciesCatalog
}

function grantLabelForChoiceId(choiceId: string): string {
  if (isEpicBoonChoiceId(choiceId)) {
    return 'Epic Boon'
  }

  if (isAbilityScoreImprovementChoiceId(choiceId)) {
    return 'Ability Score Improvement'
  }

  if (choiceId === 'versatile') {
    return 'Versatile'
  }

  return choiceId
}

function formatGrantDisplayLabel(
  featName: string,
  source: FeatGrantSource,
): string {
  switch (source.kind) {
    case 'background-origin':
      return `${featName} (${source.backgroundName})`
    case 'character-feat':
      return `${featName} (Legacy feat)`
    case 'species-feat-grant':
      return `${featName} (${source.grantLabel} · ${source.speciesDisplayName})`
    case 'class-feat-grant':
      return `${featName} (${source.grantLabel} · ${source.className} ${source.classLevel})`
  }
}

/**
 * Collects feat ids granted by class instance choices (ASI feat mode + Epic Boon).
 */
export function collectClassFeatGrantIds(
  choices: Record<string, string | string[] | undefined>,
  exceptChoiceId?: string,
): string[] {
  const featIds: string[] = []

  for (const [choiceId, value] of Object.entries(choices)) {
    if (choiceId === exceptChoiceId || typeof value !== 'string') {
      continue
    }

    if (isAbilityScoreImprovementChoiceId(choiceId)) {
      const parsed = parseAsiChoice(value)
      if (parsed?.kind === 'feat') {
        featIds.push(parsed.featId)
      }
      continue
    }

    if (isEpicBoonChoiceId(choiceId)) {
      const featId = getEpicBoonFeatIdFromChoiceValue(value)
      if (featId !== null) {
        featIds.push(featId)
      }
    }
  }

  return featIds
}

export async function resolveCharacterFeatGrants(
  character: Character,
  options: ResolveCharacterFeatGrantsOptions,
): Promise<ResolvedCharacterFeats> {
  const grants: ResolvedFeatGrant[] = []
  const featNameById = new Map<string, string>()

  if (options.featCatalog !== undefined) {
    const feats = await options.featCatalog.listFeats(character.editionId)
    for (const feat of feats) {
      featNameById.set(feat.id, feat.name)
    }
  }

  if (character.background !== null) {
    const background = await options.backgroundCatalog.getBackground(
      character.background.backgroundId,
    )
    if (background !== null) {
      const featId = background.originFeat.featId
      const source: FeatGrantSource = {
        kind: 'background-origin',
        backgroundId: background.id,
        backgroundName: background.name,
      }
      const featName =
        featNameById.get(featId) ?? background.originFeat.name
      grants.push({
        featId,
        choices: {},
        source,
        displayLabel: formatGrantDisplayLabel(featName, source),
      })
    }
  }

  if (character.species !== null && options.speciesCatalog !== undefined) {
    const speciesDefinition = await options.speciesCatalog.getSpecies(
      character.species.speciesId,
    )
    if (speciesDefinition !== null) {
      for (const choice of speciesDefinition.choices) {
        if (choice.type !== 'feat-grant') {
          continue
        }

        const featId =
          choice.id === 'versatile'
            ? getSpeciesVersatileFeatId(character.species)
            : typeof character.species.choices[choice.id] === 'string'
              ? (character.species.choices[choice.id] as string)
              : null

        if (featId === null) {
          continue
        }

        const source: FeatGrantSource = {
          kind: 'species-feat-grant',
          speciesId: speciesDefinition.id,
          speciesDisplayName: speciesDefinition.name,
          choiceId: choice.id,
          grantLabel: grantLabelForChoiceId(choice.id),
        }
        const featName = featNameById.get(featId) ?? featId
        grants.push({
          featId,
          choices: {},
          source,
          displayLabel: formatGrantDisplayLabel(featName, source),
        })
      }
    }
  }

  // Legacy compatibility only — new UI must not write character.feat.
  if (character.feat !== null) {
    const featId = character.feat.featId
    const source: FeatGrantSource = { kind: 'character-feat' }
    const featName = featNameById.get(featId) ?? featId
    grants.push({
      featId,
      choices: { ...character.feat.choices },
      source,
      displayLabel: formatGrantDisplayLabel(featName, source),
    })
  }

  for (const instance of character.classes) {
    const definition = await options.classCatalog.getClass(instance.classId)
    const className = definition?.name ?? instance.classId

    for (const [choiceId, value] of Object.entries(instance.choices)) {
      if (typeof value !== 'string') {
        continue
      }

      let featId: string | null = null
      if (isAbilityScoreImprovementChoiceId(choiceId)) {
        const parsed = parseAsiChoice(value)
        featId = parsed?.kind === 'feat' ? parsed.featId : null
      } else if (isEpicBoonChoiceId(choiceId)) {
        featId = getEpicBoonFeatIdFromChoiceValue(value)
      }

      if (featId === null) {
        continue
      }

      const source: FeatGrantSource = {
        kind: 'class-feat-grant',
        instanceId: instance.instanceId,
        classId: instance.classId,
        className,
        classLevel: instance.level,
        choiceId,
        grantLabel: grantLabelForChoiceId(choiceId),
      }
      const featName = featNameById.get(featId) ?? featId
      grants.push({
        featId,
        choices: {},
        source,
        displayLabel: formatGrantDisplayLabel(featName, source),
      })
    }
  }

  return {
    grants,
    takenFeatIds: grants.map((grant) => grant.featId),
  }
}

/**
 * Feat ids already taken outside a specific class choice slot.
 * Includes legacy character.feat, background origin, species grants, and other class grants.
 */
export function collectTakenFeatIdsForClassChoice(input: {
  resolved: ResolvedCharacterFeats
  instanceId: string
  choiceId: string
}): string[] {
  return input.resolved.grants
    .filter((grant) => {
      if (grant.source.kind !== 'class-feat-grant') {
        return true
      }

      return !(
        grant.source.instanceId === input.instanceId &&
        grant.source.choiceId === input.choiceId
      )
    })
    .map((grant) => grant.featId)
}
