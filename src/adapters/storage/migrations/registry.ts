import type { MigrationFn } from './types'
import { migrateV0ToV1 } from './migrateV0ToV1'
import { migrateV1ToV2 } from './migrateV1ToV2'

/**
 * Sequential migrations keyed by source schema version.
 * `MIGRATIONS[n]` upgrades stored data from version `n` to version `n + 1`.
 */
export const MIGRATIONS: Record<number, MigrationFn> = {
  0: migrateV0ToV1,
  1: migrateV1ToV2,
}
