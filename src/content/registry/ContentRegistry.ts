import type { BackgroundDefinition } from '../../domain/background/types'
import type { ClassDefinition, SubclassDefinition } from '../../domain/class/types'
import { subclassToChoiceOption } from '../../domain/class/subclassDefinition'
import type { EditionId } from '../../domain/edition'
import type { FeatDefinition } from '../../domain/feat/types'
import type { SpeciesDefinition } from '../../domain/species/types'
import type { ContentPack, ContentPackManifest } from '../types/contentPack'

/**
 * When a pack declares subclasses, overwrite matching `*-subclass` choice options
 * from those definitions so the registry is the single assembled view.
 * If the pack lists no subclasses for a class, embedded options are left as-is.
 */
export function attachPackSubclasses(
  classDefinition: ClassDefinition,
  subclasses: readonly SubclassDefinition[],
): ClassDefinition {
  const matching = subclasses.filter(
    (subclass) => subclass.classId === classDefinition.id,
  )

  if (matching.length === 0) {
    return classDefinition
  }

  return {
    ...classDefinition,
    choices: classDefinition.choices.map((choice) => {
      if (choice.type !== 'single-select' || !choice.id.endsWith('-subclass')) {
        return choice
      }

      return {
        ...choice,
        options: matching.map(subclassToChoiceOption),
      }
    }),
  }
}

/**
 * Indexes bundled content packs and exposes lookup APIs.
 * Features and adapters should obtain game content only through this registry.
 */
export class ContentRegistry {
  private readonly packsById = new Map<string, ContentPackManifest>()
  private readonly classesById = new Map<string, ClassDefinition>()
  private readonly subclassesById = new Map<string, SubclassDefinition>()
  private readonly speciesById = new Map<string, SpeciesDefinition>()
  private readonly backgroundsById = new Map<string, BackgroundDefinition>()
  private readonly featsById = new Map<string, FeatDefinition>()
  private readonly classesByEdition = new Map<EditionId, ClassDefinition[]>()
  private readonly featsByEdition = new Map<EditionId, FeatDefinition[]>()
  private readonly subclassesByClassId = new Map<string, SubclassDefinition[]>()

  registerPack(pack: ContentPack): void {
    if (this.packsById.has(pack.manifest.id)) {
      throw new Error(`Content pack already registered: ${pack.manifest.id}`)
    }

    this.packsById.set(pack.manifest.id, pack.manifest)

    const subclasses = pack.subclasses ?? []

    for (const subclass of subclasses) {
      this.indexById(this.subclassesById, subclass.id, subclass, 'subclass')
      const classSubclasses = this.subclassesByClassId.get(subclass.classId) ?? []
      classSubclasses.push(subclass)
      this.subclassesByClassId.set(subclass.classId, classSubclasses)
    }

    for (const classDefinition of pack.classes ?? []) {
      const assembled = attachPackSubclasses(classDefinition, subclasses)
      this.indexById(this.classesById, assembled.id, assembled, 'class')
      const editionClasses = this.classesByEdition.get(assembled.editionId) ?? []
      editionClasses.push(assembled)
      this.classesByEdition.set(assembled.editionId, editionClasses)
    }

    for (const species of pack.species ?? []) {
      this.indexById(this.speciesById, species.id, species, 'species')
    }

    for (const background of pack.backgrounds ?? []) {
      this.indexById(this.backgroundsById, background.id, background, 'background')
    }

    for (const feat of pack.feats ?? []) {
      this.indexById(this.featsById, feat.id, feat, 'feat')
      const editionFeats = this.featsByEdition.get(feat.editionId) ?? []
      editionFeats.push(feat)
      this.featsByEdition.set(feat.editionId, editionFeats)
    }
  }

  listPacks(): ContentPackManifest[] {
    return [...this.packsById.values()]
  }

  getPack(packId: string): ContentPackManifest | null {
    return this.packsById.get(packId) ?? null
  }

  getClass(classId: string): ClassDefinition | null {
    return this.classesById.get(classId) ?? null
  }

  listClasses(editionId: EditionId): ClassDefinition[] {
    return this.classesByEdition.get(editionId) ?? []
  }

  getSubclass(subclassId: string): SubclassDefinition | null {
    return this.subclassesById.get(subclassId) ?? null
  }

  listSubclasses(classId?: string): SubclassDefinition[] {
    if (classId === undefined) {
      return [...this.subclassesById.values()]
    }

    return this.subclassesByClassId.get(classId) ?? []
  }

  getSpecies(speciesId: string): SpeciesDefinition | null {
    return this.speciesById.get(speciesId) ?? null
  }

  getBackground(backgroundId: string): BackgroundDefinition | null {
    return this.backgroundsById.get(backgroundId) ?? null
  }

  getFeat(featId: string): FeatDefinition | null {
    return this.featsById.get(featId) ?? null
  }

  listFeats(editionId: EditionId): FeatDefinition[] {
    return this.featsByEdition.get(editionId) ?? []
  }

  getSpell(_spellId: string): null {
    return null
  }

  getEquipment(_equipmentId: string): null {
    return null
  }

  private indexById<T>(
    map: Map<string, T>,
    id: string,
    value: T,
    kind: string,
  ): void {
    if (map.has(id)) {
      throw new Error(`Duplicate ${kind} id across content packs: ${id}`)
    }

    map.set(id, value)
  }
}

export function createContentRegistry(packs: ContentPack[]): ContentRegistry {
  const registry = new ContentRegistry()

  for (const pack of packs) {
    registry.registerPack(pack)
  }

  return registry
}
