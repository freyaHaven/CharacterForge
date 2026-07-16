import {
  createContentRegistry,
  type ContentRegistry,
} from '../registry/ContentRegistry'
import { srd2024ContentPack } from '../packs/srd-2024'

let bundledRegistry: ContentRegistry | null = null

/** Loads all bundled content packs into a fresh registry. */
export function createBundledContentRegistry(): ContentRegistry {
  return createContentRegistry([srd2024ContentPack])
}

/**
 * Shared registry for bundled content. Application code and adapters should
 * prefer this over importing pack files directly.
 */
export function getBundledContentRegistry(): ContentRegistry {
  bundledRegistry ??= createBundledContentRegistry()
  return bundledRegistry
}

/** Test helper to reset the singleton between suites when needed. */
export function resetBundledContentRegistryForTests(): void {
  bundledRegistry = null
}
