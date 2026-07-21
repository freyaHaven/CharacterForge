# CharacterForge

A modern D&D 5e single-page character creator built with React, TypeScript, and
Vite. CharacterForge guides players through a wizard, validates choices against
edition-specific rules data, and persists characters to localStorage with explicit
schema versioning.

**SRD 2024 coverage:** see [`docs/SRD-2024-COVERAGE.md`](docs/SRD-2024-COVERAGE.md)
for the authoritative checklist of what is complete, partial, or missing against SRD
5.2.1.

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

### Wizard

Ten steps are defined in the catalog; navigation shows only steps that are
**visible** for the current character (some are conditional or temporarily hidden).

| Step | Required | Status |
|------|----------|--------|
| Basics (name, rules edition) | Yes | Complete |
| Class | Yes | Single-class and multiclass (levels 1–20) — see [Class step](#class-step) |
| Background | No | Four SRD 2024 backgrounds |
| Species | Yes | Nine SRD 2024 species with choices |
| Ability Scores | Yes | Manual, standard array, point buy, rolled |
| Equipment | No | Class/background starting gear (package vs gold) |
| Feats | No | Built but **hidden** from nav |
| Spells | No | **Conditional** — casters and feat-granted spells |
| Overview (Review) | No | Character sheet, inventory loadout, finish policy |

The **Background** step also hosts optional **Character Details** (identity,
personality, backstory) below background selection. Those fields live on the
character model, never block step completion, and are not a separate nav step.

### Class step

The Class step uses a **class-path introduction** before the catalogue:

1. **Intro** — choose **Single Class** or **Multiclass** (card-style radio
   options). The catalogue is hidden until a path is selected.
2. **Change path** — a compact secondary control (`Class path: … Change`) returns
   to the intro without clearing in-progress work. Switching paths preserves or
   confirms data as appropriate (e.g. multiclass → single class when multiple
   classes exist).

**Single class**

- Class catalogue (preview classes are excluded from single-class mode).
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

**SRD 2024** (manifest `5.2.1`) — **7 of 12** SRD classes today:

- Species: Dragonborn, Dwarf, Elf, Gnome, Goliath, Halfling, Human, Orc, Tiefling
- Classes:
  - **Fighter** — levels 1–20, fighting style, skill proficiencies, martial
    archetype (Champion) at level 3, feature progression through level 20
  - **Barbarian** — levels 1–20, Rage, Unarmored Defense, weapon mastery
    (melee), Path of the Berserker at level 3, feature progression through
    level 20
  - **Rogue** — levels 1–20, Expertise, Sneak Attack, weapon mastery, Thief
    subclass at level 3, feature progression through level 20
  - **Monk** — levels 1–20, Martial Arts, Focus, Unarmored Defense/Movement,
    Warrior of the Open Hand at level 3, feature progression through level 20
  - **Ranger** — levels 1–20, Spellcasting, Favored Enemy, Fighting Style,
    weapon mastery, Hunter at level 3, feature progression through level 20
  - **Paladin** — levels 1–20, Lay On Hands, Spellcasting, Fighting Style,
    weapon mastery, Oath of Devotion at level 3, feature progression through
    level 20
  - **Cleric** — levels 1–20, Spellcasting, Divine Order, Life Domain at
    level 3, feature progression through level 20
- Backgrounds: Acolyte, Criminal, Sage, Soldier
- Feats: Alert, Magic Initiate (Cleric/Wizard), Savage Attacker (origin feats for
  backgrounds and ASI selection)
- Spells: ~100 definitions on demand for bundled casters and feat grants (not a
  full SRD spell compendium)

**Starting equipment (SRD 2024)**

- All bundled classes: Package A (and Package B for Fighter) vs gold on the
  Equipment step
- Backgrounds: package vs 50 GP
- Equipment catalog: ~61 items referenced by starting packages only (not a full
  SRD compendium or shop)

**Missing SRD 2024 classes:** Bard, Druid, Sorcerer, Warlock, Wizard.

**SRD 2014**

- Catalogue slots reserved; no bundled species or classes yet. Edition-specific
  folder structure and IDs are ready for content without refactoring.

### Persistence

- Versioned localStorage envelope (**schema version 14**)
- Sequential migrations from legacy saves (v0 → v14)
- Multi-instance class model: `classes[]`, `targetLevel`, `startingClassInstanceId`
- Background, feat, spell, equipment, and character details on the saved character
- Draft blocking on save when species or class selections are incomplete
- `.cforge` JSON import/export using the same envelope (see
  [`src/adapters/STORAGE.md`](src/adapters/STORAGE.md))

### UI

- Responsive species and class catalogue layouts with live search (species)
- Class-path intro cards and compact path control
- Single-class overview/progression layout (sticky overview on wide viewports)
- Edition-change confirmation when incompatible species or class selections
  would be cleared
- Overview character sheet: combat stats, skills, features, spells, inventory with
  inline loadout editing
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
      srd-2024/    Bundled SRD 2024 pack (classes, subclasses, feats, backgrounds, species)
      srd-2014/    Source metadata reserved for future 2014 pack content
  adapters/        Catalog ports (class, species, feat, background), localStorage repository
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

**Current version: 14**

Envelope shape (simplified):

```json
{
  "schemaVersion": 14,
  "character": {
    "species": null,
    "targetLevel": 1,
    "classes": [],
    "startingClassInstanceId": null,
    "background": null,
    "feat": null,
    "spellSourceStates": [],
    "equipment": { "selections": [], "loadout": {} },
    "details": {}
  }
}
```

Major milestones:

- **v0:** legacy root-level character JSON
- **v1–v2:** envelope + species
- **v3–v6:** class (legacy) + background
- **v7–v8:** character details
- **v9:** multiclass `classes[]`, `targetLevel`, `startingClassInstanceId`
- **v10–v11:** feat + hit point increases
- **v12–v14:** spell states, equipment selections, loadout

Migrations run on load in `src/adapters/storage/migrations/`.

## Supported editions and content

| Edition ID | Label | Species | Classes |
|------------|-------|---------|---------|
| `srd-2024` | D&D 5e 2024 | 9 bundled | 7 bundled (Fighter, Barbarian, Rogue, Monk, Ranger, Paladin, Cleric) |
| `srd-2014` | D&D 5e 2014 | (none bundled) | (none bundled) |

Mechanical text and choices come from SRD documents under CC-BY-4.0. See
[`src/content/ATTRIBUTION.md`](src/content/ATTRIBUTION.md) for source
attribution.

## Asset attribution and licensing

### SRD rules text

Species and class **mechanics** are derived from Wizards of the Coast System
Reference Documents (SRD 5.2 for 2024 content, SRD 5.1 reserved for 2014).
Attribution and licence metadata live in
`src/content/packs/{edition}/source.ts`.

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

Prioritized gaps and play-sheet requirements are maintained in
[`docs/SRD-2024-COVERAGE.md`](docs/SRD-2024-COVERAGE.md). Highlights:

- **Creator:** remaining five SRD classes, species mechanical gaps, Details
  step visibility; nested ASI-feat config from Epic Boon deferred
- **Play sheet:** feat-derived stats, resource tracking, rest workflow
- **Optional:** full SRD compendiums, custom backgrounds, campaign tools
- **Out of scope:** non-SRD book content, automatic cross-edition conversion
