# CharacterForge

A modern D&D 5e single-page character creator built with React, TypeScript, and
Vite. CharacterForge guides players through a seven-step wizard, validates
choices against edition-specific rules data, and persists characters to
localStorage with explicit schema versioning.

## Project goals

- Provide a clear, accessible character creation flow for D&D 5e (2014 and
  2024 SRD rules).
- Keep **domain**, **rules**, **adapters**, and **UI** separated so content and
  persistence can evolve independently.
- Store every mechanical value in **edition-specific definitions** with stable
  IDs (`srd-2024:fighter`, `srd-2024:dwarf`) rather than scattering edition
  conditionals through UI or generic rules code.
- Support save/reload, draft semantics, and forward-compatible storage
  migrations.

## Implemented features

### Wizard (7 steps)

| Step | Status |
|------|--------|
| Basics (name, rules edition) | Required — complete |
| Species | Required — catalogue, search, choices, edition change |
| Class | Required — see [Class step](#class-step) below |
| Ability Scores | Required — manual, standard array, point buy, rolled |
| Background | Placeholder |
| Equipment | Placeholder |
| Review | Summary cards, finish policy |

### Class step

The Class step uses a **class-path introduction** before the catalogue:

1. **Intro** — choose **Single Class** or **Multiclass** (card-style radio
   options). The catalogue is hidden until a path is selected.
2. **Change path** — a compact secondary control (`Class path: … Change`) returns
   to the intro without clearing in-progress work. Switching paths preserves or
   confirms data as appropriate (e.g. multiclass → single class when multiple
   classes exist).

**Single class**

- Class catalogue (preview classes such as Barbarian are excluded).
- After selecting a class, a two-column layout:
  - **Class Overview** (left) — level stepper, reference metadata as compact
    chips (primary abilities, saving throws, armour, weapons), and interactive
    setup choices such as skill proficiencies.
  - **Class Progression** (right) — level accordions, linked feature choices, and
    deferred requirements.

**Multiclass**

- Class catalogue with toggle selection (includes preview classes).
- Staged workflow: select classes → assign levels per class → choose starting
  class → configure each class instance.
- Character level is derived from the sum of allocated class levels.

**Editor workflow state** (not part of the saved character model): selected class
path, in-progress class drafts, and active instance id are persisted in
`localStorage` per character so refresh and draft recovery restore the Class
step UI correctly.

### Rules content (bundled)

**SRD 2024**

- Species: Dwarf, Dragonborn
- Classes:
  - **Fighter** — levels 1–20, fighting style, skill proficiencies, martial
    archetype (Champion) at level 3, feature progression through level 20
  - **Barbarian** — levels 1–20, Rage, Unarmored Defense, weapon mastery
    (melee), Path of the Berserker at level 3, feature progression through
    level 20

**SRD 2014**

- Catalogue slots reserved; no bundled species or classes yet. Edition-specific
  folder structure and IDs are ready for content without refactoring.

### Persistence

- Versioned localStorage envelope (`schemaVersion: 9`)
- Sequential migrations from legacy saves (v0 → v9)
- Multi-instance class model: `classes[]`, `targetLevel`, `startingClassInstanceId`
- Background selections and character details on the saved character
- Draft blocking on save when species or class selections are incomplete
- `.cforge` JSON import/export using the same envelope (see
  [`src/adapters/STORAGE.md`](src/adapters/STORAGE.md))

### UI

- Responsive species and class catalogue layouts with live search (species)
- Class-path intro cards and compact path control
- Single-class overview/progression layout (sticky overview on wide viewports)
- Edition-change confirmation when incompatible species or class selections
  would be cleared
- Transparent PNG class icons (Fighter, Barbarian, Rogue, Artificer) with SVG
  fallback for unregistered classes

## Architecture overview

```
src/
  domain/          Types, ports, edition-safe schemas (Character, species, class)
  rules/           Validation and effect resolution from definitions + selections
  content/         Content packs + Content Registry (game definitions only)
    registry/      ContentRegistry — single lookup surface for bundled content
    packs/
      srd-2024/    Bundled SRD 2024 pack (classes, subclasses, …)
  data/            Remaining edition content still migrating into packs
    species/srd-2024/
    backgrounds/srd-2024/
    feats/srd-2024/
  adapters/        ClassCatalog, SpeciesCatalog, localStorage repository
  features/        React UI (pickers, drafts, icons)
  app/             Wizard shell, hooks, step status, save/finish policy
  assets/classes/  Class emblem PNGs (and future artwork)
```

**Data flow:** UI and rules load definitions through catalog ports backed by the
Content Registry → user selections are held as drafts until validation passes →
committed selections live on `Character` → save writes the current schema
envelope → load migrates and validates. Features must not import pack files
directly; packs contain definitions only (no UI or engine logic).

**Edition safety:** `ClassDefinition` and `SpeciesDefinition` each carry
`editionId` and a full stable `id`. Validation compares selection IDs to the
resolved definition; changing edition prompts before clearing incompatible
selections.

**Class editor state:** `Character` stores committed class instances only.
In-progress class drafts and the selected single/multiclass path live in
editor workflow storage (`src/app/session/classEditorWorkflowStorage.ts`) and
are rehydrated on load.

See [`src/adapters/STORAGE.md`](src/adapters/STORAGE.md) for persistence
details.

## Development commands

```bash
npm install    # install dependencies
npm run dev    # start Vite dev server
npm run build  # typecheck and production build
npm test       # run Vitest suite
npm run lint   # Oxlint
npm run preview  # preview production build
```

## Storage schema version

**Current version: 9**

Envelope shape:

```json
{
  "schemaVersion": 9,
  "character": {
    "species": null,
    "targetLevel": 1,
    "classes": [],
    "startingClassInstanceId": null,
    "background": null,
    "details": {}
  }
}
```

- **v0:** legacy root-level character JSON
- **v1:** versioned envelope without species
- **v2:** adds `species`
- **v3:** adds legacy single `class`
- **v4–v6:** adds and cleans up `background`
- **v7–v8:** adds and restructures `details`
- **v9:** replaces `class` with `classes[]`, `targetLevel`, and
  `startingClassInstanceId`

Migrations run on load in `src/adapters/storage/migrations/`.

## Supported editions and content

| Edition ID | Label | Species | Classes |
|------------|-------|---------|---------|
| `srd-2024` | D&D 5e 2024 | Dwarf, Dragonborn | Fighter; Barbarian |
| `srd-2014` | D&D 5e 2014 | (none bundled) | (none bundled) |

Mechanical text and choices come from SRD documents under CC-BY-4.0. See
[`src/data/species/attribution.md`](src/data/species/attribution.md) for species
source attribution.

## Asset attribution and licensing

### SRD rules text

Species and class **mechanics** are derived from Wizards of the Coast System
Reference Documents (SRD 5.2 for 2024 content, SRD 5.1 reserved for 2014).
Attribution and licence metadata live in `src/data/content/{edition}/source.ts`.

### Class icon PNGs

Original transparent PNG emblems in `src/assets/classes/`. Currently wired in
the app: **Fighter**, **Barbarian**, **Rogue**, **Artificer**. See
[`src/assets/classes/attribution.md`](src/assets/classes/attribution.md).

Icons are decorative; class names in the UI provide accessible labels.

### Other assets

- `src/assets/hero.png` — marketing/hero artwork
- Placeholder JPEG class artwork in `src/assets/classes/` is not yet used in
  the UI

## Roadmap

- **Class content:** Additional 2024 SRD classes (Rogue, Monk, Paladin, and
  others); parallel `srd-2014` definitions where rules differ
- **Class icons:** Register remaining PNG emblems as artwork is finalized
- **Species:** 2014 SRD species in `src/data/species/srd-2014/`
- **Background step:** edition-specific background definitions and picker
- **Equipment step:** starting gear, weapon mastery choices (deferred from
  Fighter level-1 feature text)
- **Review polish:** richer summaries as more steps ship
- **Out of scope for now:** automatic cross-edition conversion, non-SRD book
  content
