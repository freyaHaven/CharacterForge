import type { MigrationFn } from './types'
import { migrateV0ToV1 } from './migrateV0ToV1'
import { migrateV1ToV2 } from './migrateV1ToV2'
import { migrateV2ToV3 } from './migrateV2ToV3'
import { migrateV3ToV4 } from './migrateV3ToV4'
import { migrateV4ToV5 } from './migrateV4ToV5'
import { migrateV5ToV6 } from './migrateV5ToV6'

/**
 * Sequential migrations keyed by source schema version.
 * `MIGRATIONS[n]` upgrades stored data from version `n` to version `n + 1`.
 */
export const MIGRATIONS: Record<number, MigrationFn> = {
  0: migrateV0ToV1,
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
  4: migrateV4ToV5,
  5: migrateV5ToV6,
}
