# P3.1 — Inventory System (Implementation Plan)

**Status:** Slices A–E implemented (persisted inventory, mutation APIs, Inventory UI, add-from-catalogue & custom items, weight & carrying-capacity display)  
**Parent roadmap:** [PHASE-3-ROADMAP.md](./PHASE-3-ROADMAP.md)  
**Current schema:** `17` (`CURRENT_SCHEMA_VERSION` in `src/adapters/storage/storedCharacter.ts`)  
**Audit date:** 2026-07-22

---

## 1. Goal (focused)

Make **owned inventory** the authoritative representation of everything the character currently has, while keeping **starting-equipment selections** as immutable build choices.

P3.1 delivers a usable Inventory surface for campaign play:

* Dedicated Inventory page (or wizard/sheet step)
* Search, sort, filter
* Container support (view + move)
* Currency management
* Quantity editing
* Equip / unequip (building on existing loadout)
* Split / merge stacks
* Custom items
* Carry weight calculation
* Optional-rule encumbrance **display** (not combat penalties)

### Explicitly out of scope for P3.1

Unless required by the persistence/architecture split below, do **not** pull in:

* Full combat management
* Ammunition consumption
* Attunement
* Magic-item effects
* Advanced encumbrance rules / penalties
* Drag-and-drop
* Gameplay resources (HP, slots, class pools)
* Rest mechanics

---

## 2. Audit summary — what exists today

### 2.1 Persisted equipment and loadout models

**Authoritative character field:** `Character.equipment: CharacterEquipment`  
(`src/domain/types.ts`, defaults in `src/domain/character/defaults.ts`)

```ts
// src/domain/equipment/types.ts
CharacterEquipment = {
  selections: EquipmentSelection[]  // starting-equipment answers
  loadout: EquipmentLoadout         // worn/wielded slots by itemId
}

EquipmentLoadout = {
  armorItemId: string | null
  mainHandItemId: string | null
  offHandItemId: string | null
  mainHandGrip: 'one-handed' | 'two-handed' | null
}

InventoryEntry = {
  instanceId, itemId, quantity, location
} // documented as derived; NOT persisted
```

| Data | Persisted? | Notes |
|------|------------|--------|
| Starting selections (`equipment.selections`) | Yes | Package/gold/nested picks |
| Loadout (`equipment.loadout`) | Yes since v14 | Equip/unequip survives save |
| Inventory entries / locations | **No** | Re-materialized every resolve |
| Currency | **No** | Summed at resolve from gold grants/options |
| Custom items | **No** | No schema |
| Carry weight / encumbrance | **No** | Computed in UI / resolver |

Structural guard: `isCharacterEquipment` / `isEquipmentLoadout` (`src/domain/equipment/isCharacterEquipment.ts`).

### 2.2 Equipment resolver and inventory materialization

**Primary API:** `resolveCharacterEquipment`  
(`src/rules/character/resolveCharacterEquipment.ts`)  
Hook: `useEquipmentResolution` (`src/app/useEquipmentResolution.ts`)

Pipeline today:

1. Load catalog for `character.editionId`
2. Resolve class + background `StartingEquipmentDefinition` trees via `collectActiveEquipmentNodes`
3. Collect grants from complete entitlements / selections
4. `materializeInventoryEntries` (`src/domain/equipment/materializeInventory.ts`)
   * Expand kits (`expandsTo`)
   * Peel `GOLD_PIECES_ITEM_ID` into gold
   * Resolve `SELECTED_GAMING_SET_ITEM_ID`
   * Assign deterministic `instanceId`s (`createInventoryInstanceId`)
   * Heuristic default locations (ammo → quiver, gear → backpack, etc.)
5. Merge sources; `assignDefaultLocations`; compute `weightCarriedLb`

`ResolvedEquipment` exposes:

* `entries` — instance + location aware (Inventory UI source of truth **today**)
* `inventory` / `mergedInventory` — quantity-merged by `itemId` (summaries / loadout ownership)
* `currency.goldPieces`
* `weightCarriedLb`
* `sources[]` — per class/background completeness for the Equipment wizard

**Loadout coupling** (`useCharacterEditor`): ownership is the **merged `itemId` set**. Auto-reconcile prunes invalid slots and may infer empty slots. Slots store **`itemId`**, not `instanceId`.

### 2.3 Overview equipment UI

| Component | Path | Production use |
|-----------|------|----------------|
| `InventoryPanel` | `src/features/equipment/InventoryPanel.tsx` | Overview (`ReviewStep`) |
| `EquipmentStatusPanel` | `src/features/equipment/EquipmentStatusPanel.tsx` | Soft warnings |
| `EquipmentLoadoutManager` | `src/features/equipment/EquipmentLoadoutManager.tsx` | **Tests only** (unwired) |
| `EquipmentSourceSection` | `src/features/equipment/EquipmentSourceSection.tsx` | Equipment wizard step |

**InventoryPanel today:** search, filter tabs (All / carried / per-container), read-only qty/weight/cost/location, equip/unequip + versatile grip (persists loadout), conflict dialog. **No** qty edit, move, split/merge, currency edit, add/remove, custom items.

Wiring: `App.tsx` → `ReviewStep` → `InventoryPanel` with `onChangeEquipmentLoadout={editor.setEquipmentLoadout}`.

### 2.4 Starting-equipment flow

* Wizard step: `EquipmentStep` (`src/app/wizard/steps/EquipmentStep.tsx`)
* Status: `getEquipmentStepStatus` via `validateResolvedEquipment`
* Finish gate: deferred requirement `starting-equipment` on some classes
* Content: entitlement trees (`grant` / `choose-option` / `choose-items`) on class + background defs
* Mutations: `setEquipmentSelections` → prune inactive selections → next resolve rebuilds inventory

### 2.5 Schema migrations

| Version | Equipment-related change |
|---------|--------------------------|
| v5→v6 | Strip background embedded starting-equipment choices |
| v12→v13 | Add `equipment.selections` |
| v13→v14 | Add `equipment.loadout` |
| v14→v15 | Normalize selection `path` |

Registry: `src/adapters/storage/migrations/registry.ts`.  
**Doc drift:** `src/adapters/STORAGE.md` still claims schema 11; README may lag — **code is authoritative (v15)**.

Import/export (`.cforge`) uses the same envelope; inventory is **not** exported today because it is not on `Character`.

### 2.6 Validation

| Check | Role |
|-------|------|
| Choice-tree completeness | Creation / Equipment step |
| `validateResolvedEquipment` | Incomplete entitlements |
| Deferred `starting-equipment` | Finish policy |
| `isCharacter` / `isCharacterEquipment` | Load/import shape only |
| `previewEquipItem` / prune | Soft play UX, not schema |
| Encumbrance | Label only (`STR × 15` in InventoryPanel) |

### 2.7 Tests (high-signal)

* `resolveCharacterEquipment.test.ts` — packages, gold, nesting, pruning
* `materializeInventory.test.ts` — locations, containers, cross-source
* `equipmentLoadout.test.ts` — equip/unequip/grip/prune/infer
* `InventoryPanel.test.tsx` — search/tabs/equip callback
* Migration tests v12–v15
* `characterFile.test.ts` — envelope round-trip (equipment usually empty)
* AC tests driven by loadout + ownership

**Gaps:** no persisted inventory CRUD, currency mutation, custom items, seed migration, instance-aware equip, build-vs-play divergence tests.

---

## 3. What can be reused

| Asset | Reuse strategy |
|-------|----------------|
| `InventoryEntry` / `InventoryLocation` | Promote to persisted shape (already designed for containers-by-instance) |
| `materializeInventoryEntries` | Keep as **seed** from starting grants; stop treating as live ownership |
| `resolveCharacterEquipment` | Keep for Equipment wizard completeness + one-time seeding input |
| `equipmentLoadout` + `InventoryPanel` equip UX | Extend; migrate slots toward instance awareness when needed |
| Catalog (`EquipmentItemDefinition`, weight, containers) | Display, filters, equip eligibility, weight |
| Choice tree / prune / validate | Unchanged for build-time Equipment step |
| Migration pipeline | Add v15→v16(+); same envelope pattern |
| Search / container tabs in InventoryPanel | Foundation for dedicated Inventory page |
| Soft status warnings | Keep; re-point ownership source |

---

## 4. Architectural limitations (today)

1. **Inventory is a view, not state** — any play mutation would be wiped on next resolve.
2. **Selections stay live** — editing the Equipment step regenerates grants; no freeze/snapshot.
3. **Currency is ephemeral** — only starting gold options/grants.
4. **Locations are heuristics** — not player-authoritative.
5. **Loadout keyed by `itemId`** — cannot distinguish duplicate instances.
6. **Ownership for AC/reconcile is quantity-merged** — loses instance/location semantics.
7. **No custom-item schema** — catalog is starting-package oriented.
8. **No dedicated Inventory navigation** — Overview section only; `EquipmentLoadoutManager` is dead UI.
9. **No play-state bag** — Phase 3 will eventually need a clear build vs play partition; inventory is the first persisted play surface.

---

## 5. Intended authoritative inventory model

### 5.1 Proposed persisted shape (conceptual)

Extend `CharacterEquipment` (preferred: keep equipment concerns together) or introduce a sibling `inventory` field. Recommendation: **nest under `equipment`** to avoid a second root concern and reuse existing validators/migrations.

```ts
CharacterEquipment = {
  /** Immutable build answers until user explicitly re-runs starting equipment. */
  selections: EquipmentSelection[]

  /** Mutable owned gear — authoritative for play. */
  inventory: {
    entries: InventoryEntry[]
    currency: { goldPieces: number }  // expand denomination later if needed
    /** Optional: player-authored items not in the content catalog. */
    customItems?: CustomEquipmentItemDefinition[]
    /**
     * When true, inventory was seeded from starting equipment and is no longer
     * auto-rebuilt from selections on ordinary loads.
     */
    seededFromStartingEquipment: boolean
  }

  /** Prefer migrating to instanceId refs in a follow-up slice. */
  loadout: EquipmentLoadout // then EquipmentLoadoutV2 with *InstanceId fields
}
```

Display enrichment (name, weight, tags, `isContainer`) remains **derived** from catalog (+ custom item defs), not duplicated on every entry.

### 5.2 Derived vs persisted after P3.1

| Data | Persisted | Derived |
|------|-----------|---------|
| `selections` | ✓ build | |
| `inventory.entries` | ✓ play | |
| `inventory.currency` | ✓ play | |
| `inventory.customItems` | ✓ play | |
| `loadout` | ✓ play | |
| Entry display fields | | catalog / custom defs |
| Carry weight | | Σ weight × qty |
| Encumbrance label | | STR × 15 (optional rule flag later) |
| Starting-equipment completeness | | still from selections + content |

### 5.3 Resolver / API split

| API | Responsibility |
|-----|----------------|
| `resolveCharacterEquipment` (existing) | Build-time grants + completeness for Equipment step; seed input |
| `seedInventoryFromResolvedEquipment` (new) | One-time (or explicit reset) copy of entries + gold into persisted inventory |
| `getOwnedInventory` / enrich helpers (new) | Read persisted entries + join catalog for UI |
| Inventory mutation functions (new) | Pure updates: set qty, move, split, merge, add custom, adjust currency |
| Loadout APIs (existing → evolved) | Equip against **owned** entries; later instance-aware |

UI and AC must stop using live `resolveCharacterEquipment().entries` as ownership once seeded.

---

## 6. Build vs gameplay boundary

| Concern | Layer | Mutable by inventory play actions? |
|---------|-------|--------------------------------------|
| Species / class / background / scores / feats / spells | Build | No |
| `equipment.selections` (package, gold, nested picks) | Build | No — only Equipment step / explicit rebuild |
| Content entitlement trees | Content | No |
| `equipment.inventory.*` | Gameplay | Yes |
| `equipment.loadout` | Gameplay | Yes (equip/unequip) |
| Catalog item definitions | Content | No (except custom items on character) |

### Seeding / locking policy (recommended)

1. While `seededFromStartingEquipment === false` (or inventory empty + wizard incomplete), Overview/Inventory may show **preview** from resolver (current behaviour) OR hide editable actions.
2. On **Finish** (preferred) or first visit to Inventory after starting equipment is complete: seed persisted inventory from resolved entries + currency; set flag.
3. Changing `selections` after seed:
   * **Default:** do not auto-wipe play inventory.
   * Provide explicit **"Reset inventory from starting equipment"** (destructive confirm) that re-seeds.
4. Optionally soft-lock Equipment step edits after Finish with a clear “rebuild inventory” warning — can be a later slice.

Gameplay actions must never write `selections`.

---

## 7. Migration requirements

### 7.1 Schema bump

* `CURRENT_SCHEMA_VERSION`: **15 → 16** (or 16+ if loadout instance migration is split)
* New `migrateV15ToV16.ts` + registry entry + typed `StoredCharacterV16`
* Update `STORAGE.md` and README schema sections (fix existing drift)

### 7.2 Migration behaviour

For each character:

1. Ensure `equipment.selections` / `loadout` exist (already true post-v14/v15).
2. If inventory missing:
   * Run the same materialization path as `resolveCharacterEquipment` **if catalogs are available in migration context**, **or**
   * Persist empty inventory + `seededFromStartingEquipment: false` and seed lazily on first app load when catalogs are present.

**Recommendation:** lazy seed on load/editor init when catalogs exist — migrations today are sync and catalog-light; avoid heavy async catalog work inside migration if the existing pipeline cannot support it cleanly. Migration should at least add the empty inventory shape + flag.

3. Preserve loadout `itemId`s; ownership checks switch to persisted inventory after seed.
4. Import `.cforge` v15 → migrate → seed when opened.

### 7.3 Compatibility risks

* Old clients cannot read v16 — already handled by unsupported-version rejection.
* Characters mid-wizard with incomplete selections should not get a misleading full inventory; seed only when starting equipment is complete (or allow empty + preview).
* Deterministic instance IDs from materialize help stable loadout migration later; document that re-seed regenerates IDs unless a mapping is kept.

---

## 8. Resolver / API changes

| Change | Detail |
|--------|--------|
| Keep `resolveCharacterEquipment` | Equipment step + seed source |
| Add seed helper | Map `ResolvedEquipment.entries` → persisted `InventoryEntry[]`; copy gold |
| Add enrich helper | `InventoryEntry` + catalog → UI row (reuse materialize display fields) |
| Stop Overview ownership from live resolve | After seed, read `character.equipment.inventory` |
| Loadout reconcile | Owned set from persisted entries; avoid overwriting player unequips aggressively once in play mode (`inferEmptySlots` policy revisit) |
| AC / review sheet | Ownership from persisted inventory |
| Editor setters | `setInventoryEntries`, `adjustCurrency`, `addCustomItem`, etc. |
| Currency | Persist GP; denomination expansion optional later |

**Instance-aware loadout:** preferred before duplicate-item edge cases matter. Can be a dedicated slice after basic CRUD if AC continues to work with `itemId` for unique gear.

---

## 9. UI changes

| Area | Change |
|------|--------|
| New Inventory step/page | Dedicated surface (wizard step after Equipment or Overview-adjacent); host full management |
| `InventoryPanel` | Evolve from read-mostly → editable; or split presentational list + action bar |
| Currency controls | Edit GP (gain/spend); display on Inventory |
| Quantity / move / split / merge | Explicit controls (no drag-and-drop in P3.1) |
| Add item | From catalog subset + custom item form |
| Equipment step | Remains build-only; copy clarifying that Inventory is authoritative after seed |
| Overview | Summary + link/embed; avoid two competing editors |
| Retire or repurpose | `EquipmentLoadoutManager` (unwired) — do not revive as a second equip UI |

Sort: name, weight, category, quantity. Filter: category, equipped, container, search (extend existing).

---

## 10. Validation and persistence changes

### Persistence

* Inventory fields on `Character` → automatic `.cforge` / localStorage coverage once `isCharacter` accepts them
* Serialize/parse unchanged aside from schema version + validators

### Validation

| Layer | Rules |
|-------|-------|
| Structural (`isCharacter`) | entries shape, non-negative qty, currency ≥ 0, location refs exist or carried |
| Referential (soft or hard) | `containerInstanceId` points at a container entry; loadout item/instance owned |
| Build-time | Unchanged starting-equipment completeness |
| Play-time | Equip previews; optional warning if weight > STR×15 when optional rule enabled |
| Custom items | Required id/name; weight/cost optional |

Do not block Finish on encumbrance or play inventory edits.

---

## 11. Test coverage plan

| Area | Tests |
|------|-------|
| Seed | Resolved grants → persisted entries + gold; idempotent when already seeded |
| Mutations | qty, move, split, merge, remove, currency |
| Containers | Move into/out; reject move into non-container / self |
| Migration | v15→v16 shape; lazy seed on load |
| Loadout | Equip still works against persisted ownership; prune on remove |
| UI | Inventory page actions fire domain updates; search/sort/filter |
| Import/export | Round-trip entries + currency + custom items |
| Boundary | Changing selections does not mutate inventory without explicit reset |
| Regression | Equipment step + legal builds (P2.12) still pass |

---

## 12. Risks and compatibility concerns

| Risk | Mitigation |
|------|------------|
| Dual sources of truth during transition | Single `seededFromStartingEquipment` flag; UI reads one path |
| Re-edit starting equipment wipes loot | Never auto-rebuild; explicit reset only |
| Migration without catalog | Empty inventory + lazy seed |
| Duplicate `itemId` equip ambiguity | Instance-aware loadout slice early if needed |
| `inferEmptySlots: true` fights player intent | Disable auto-infer after seed / Finish |
| Catalog gaps for “add item” | Start with existing catalog + custom items; no shop |
| Doc drift (STORAGE.md) | Update as part of schema slice |
| Scope creep into P3.4 | Ammunition/attunement/magic effects stay deferred |

---

## 13. Implementation slices (independently testable)

### Slice A — Persisted inventory model + migration + seed

**Deliver:** schema v16 shape; validators; lazy/explicit seed from existing resolver; editor read path; no new play mutations yet (UI can still be read-only against persisted copy).

**Acceptance:**

* Saved characters include `equipment.inventory`
* After seed, reload shows the same entries/currency without re-deriving from selections alone
* Changing nothing else, Overview still displays inventory
* v15 saves migrate and seed when catalogs available
* Unit tests for migration shape + seed idempotency

**Likely files:** `domain/equipment/types.ts`, `isCharacterEquipment.ts`, `storedCharacter.ts`, `migrateV15ToV16.ts`, registry, `materializeInventory.ts` / new `seedInventory.ts`, `useCharacterEditor.ts`, `useEquipmentResolution.ts` / Review wiring, STORAGE.md

---

### Slice B — Inventory mutations (domain API)

**Deliver:** pure functions + editor setters for quantity, add/remove catalog item, currency adjust, move between containers, split/merge stacks. No drag-and-drop.

**Acceptance:**

* Mutations update persisted state only (never `selections`)
* Invalid moves rejected with clear results
* Split/merge preserve totals; merge only compatible stacks (same `itemId`, mergeable location policy)
* Domain tests cover happy path + edge cases
* Loadout prune when equipped item removed

**Likely files:** new `domain/equipment/inventoryMutations.ts` (+ tests), `useCharacterEditor.ts`, loadout reconcile tweak

---

### Slice C — Inventory UI page (management surface)

**Deliver:** dedicated Inventory step/page; wire mutations; search/sort/filter; currency editor; quantity/move/split/merge controls; keep equip/unequip.

**Acceptance:**

* User can manage inventory without opening Equipment (build) step
* Overview either embeds the same panel or links without divergent state
* Keyboard-accessible controls (no DnD required)
* Component tests for primary actions

**Likely files:** new step or `features/equipment/InventoryPage.tsx`, `InventoryPanel.tsx`, `App.tsx` / wizard types/navigation, `ReviewStep.tsx`

---

### Slice D — Custom items + add-from-catalog

**Status:** Implemented (add-from-catalogue + custom items; no definition editing)

**Deliver:** custom item definitions on character; “Add item” from catalog subset; appear in inventory with weight/cost.

**Acceptance:**

* Custom items round-trip in `.cforge`
* Enrichment resolves custom defs when not in catalog
* Remove custom item removes orphans safely

**Likely files:** types, validators, add-item UI, enrich helper, export tests

---

### Slice E — Carry weight + optional encumbrance display

**Status:** Implemented (display + calculation; no movement penalties)

**Deliver:** authoritative weight from persisted inventory; SRD 2024 carrying-capacity indicator (display only); no movement penalties or combat hooks.

**Acceptance:**

* Weight matches Σ definition weights × qty (unknown weights surfaced as incomplete “at least” totals)
* Capacity = Strength × 15; overloaded / remaining / progress shown on Inventory + Overview
* No Finish blocking; no speed modifiers in P3.1

**Likely files:** `inventoryWeight.ts`, `InventoryWeightSummary`, Inventory UI, Overview panel

---

### Slice F — Instance-aware loadout (if not absorbed earlier)

**Deliver:** loadout references `instanceId` (with migration from `itemId`); equip/unequip unambiguous for duplicates.

**Acceptance:**

* Two identical weapons can be owned; equipping selects a specific instance
* AC/ownership use instance identity
* Migrated characters keep sensible equipped gear

**Likely files:** `EquipmentLoadout` type, `equipmentLoadout.ts`, migration v16→v17 or fold into A, AC selectors, InventoryPanel

*Pull Slice F earlier if duplicate-item bugs appear during B/C.*

---

### Slice G — Build/play guardrails + reset

**Deliver:** explicit “Reset inventory from starting equipment”; messaging on Equipment step after seed; disable silent rebuild.

**Acceptance:**

* Selection edits do not change seeded inventory
* Reset re-seeds after confirm and clears/replaces play inventory
* Tests lock the boundary

**Likely files:** `EquipmentStep.tsx`, seed helper, editor, docs

---

## 14. Recommended first implementation slice

**Start with Slice A — Persisted inventory model + migration + seed.**

### Why this is safest

* Establishes the architectural invariant (“inventory is state”) without risky UI or mutation edge cases
* Unblocks every later slice
* Reuses the mature materializer as a seed function rather than rewriting ownership
* Migration/lazy-seed patterns match existing storage design
* Easy to regression-test against current Overview display
* Avoids premature DnD, attunement, and combat scope

### Slice A acceptance criteria (checklist)

1. `CharacterEquipment` includes persisted inventory entries + currency + seed flag (custom items can wait for Slice D).
2. Schema version bumps; v15→v16 migration adds shape without data loss of selections/loadout.
3. When starting equipment is complete, seed copies resolver entries + GP into persisted inventory once.
4. After seed, Overview/Inventory **reads persisted entries** (enriched via catalog), not a live rebuild from selections.
5. Re-load / import preserves inventory.
6. Equipment wizard + P2 legal-build tests still pass.
7. No play mutation UI required yet beyond existing equip/unequip against new ownership source.
8. Docs: STORAGE schema version corrected; this plan remains the guide for B–G.

### Likely systems affected (Slice A)

* `src/domain/equipment/types.ts`
* `src/domain/equipment/isCharacterEquipment.ts`
* `src/domain/equipment/materializeInventory.ts` (seed export) or `seedInventory.ts`
* `src/rules/character/resolveCharacterEquipment.ts` (consumer clarification only)
* `src/adapters/storage/storedCharacter.ts`
* `src/adapters/storage/migrations/migrateV15ToV16.ts` + registry + tests
* `src/adapters/STORAGE.md`
* `src/app/hooks/useCharacterEditor.ts`
* `src/app/useEquipmentResolution.ts` / Overview wiring (`ReviewStep`, `App.tsx`)
* `src/app/buildReviewSheetModels.ts` / AC ownership if it reads resolved inventory
* Tests under `domain/equipment`, `adapters/storage/migrations`, optionally `characterFile`

---

## 15. Success criteria for P3.1 overall

A player can:

* Finish (or complete starting equipment) and receive a durable inventory
* Search / sort / filter owned gear on a dedicated Inventory surface
* Edit quantities and currency
* Move items between containers
* Split and merge stacks
* Add catalog and custom items
* Equip / unequip using existing loadout behaviour (instance-aware if Slice F done)
* See carry weight (and optional encumbrance label)
* Save / reload / import / export without losing play inventory
* Re-run starting equipment only via an explicit reset path

…without implementing combat, ammo consumption, attunement, magic-item effects, advanced encumbrance penalties, drag-and-drop, resources, or rests.
