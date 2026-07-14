# Storage format

## Current format (schema version 2)

Characters are persisted inside a versioned envelope:

```json
{
  "schemaVersion": 2,
  "character": { }
}
```

The inner character includes `species: null | { speciesId, choices }`.

The localStorage adapter reads stored JSON, migrates legacy shapes, validates
the inner character with `isCharacter()`, and returns the domain model.

## Legacy formats

| Version | Shape |
|---------|-------|
| 0 | Raw `Character` JSON at the root (no `schemaVersion`, no `species`) |
| 1 | `{ schemaVersion: 1, character }` without `species` on the character |

On load, schema 0 and 1 saves migrate forward to schema 2. Migration adds
`species: null` without changing other character fields.

## Migration rules

1. Detect the stored schema version (`0` for legacy root objects).
2. Reject saves with a schema version newer than the app supports.
3. Run sequential migrations in `src/adapters/storage/migrations/`.
4. Validate the migrated character with `isCharacter()`.
5. Never silently treat unmigrated saves as missing characters.

Migration logic belongs in `src/adapters/storage/`, not in domain or UI code.

## Saving

All saves are written in the current envelope format so the next load skips
migration when already up to date.
