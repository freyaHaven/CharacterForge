# SRD 2024 Coverage Checklist

Authoritative audit of CharacterForge against **SRD 5.2.1** (`srd-2024` content pack,
manifest version `5.2.1`). Last audited against repository state with storage schema
**v15**.

This document evaluates **implementation depth**, not file presence alone. Each area is
scored across seven dimensions:

| Dimension | Meaning |
|-----------|---------|
| **Content** | Edition-specific definitions in `src/content/packs/srd-2024/` |
| **UI** | Wizard step, picker, or sheet surface for configuring the feature |
| **Persistence** | Saved on `Character`, migrated across schema versions |
| **Validation** | Rules enforce legal selections and block invalid saves/finish |
| **Derived** | Effects feed HP, AC, proficiencies, spell slots, inventory, etc. |
| **Sheet** | Overview / character-sheet presentation |
| **Tests** | Automated coverage (unit, integration, or workflow) |

### Status legend

| Symbol | Meaning |
|--------|---------|
| ✅ Complete | End-to-end for current scope |
| 🟡 Partial | Some dimensions work; notable gaps remain |
| ❌ Missing | Not implemented |
| ⏸ Intentionally deferred | Explicitly postponed or stubbed |
| ➖ N/A | Not applicable to current edition scope |

---

## Summary

| Area | Overall | Notes |
|------|---------|-------|
| Species & ancestry | 🟡 | 9/9 SRD species; creator-time effects wired; play-time traits descriptive (Phase 3) |
| Backgrounds | ✅ | 4/4 SRD backgrounds; Background is required for Finish |
| Classes & subclasses | ✅ | **12/12** SRD classes; 1 subclass each |
| Class feature choices | ✅ | L1–20 choices including Epic Boon nested ASI; play-time activations Phase 3 |
| Deferred class requirements | ✅ | Starting equipment gates Finish via deferred requirements |
| Feats & acquisition | ✅ | Origin + epic boons + Fighting Style + Grappler/Skilled/ASI/Magic Initiate; Feats step hidden |
| Fighting styles | ✅ | Feat defs + shared grant pipeline; Champion L7 Additional FS; Defense AC ✅ |
| Weapon mastery | 🟡 | Slot schedules + UI; combat execution deferred |
| Ability scores & ASIs | ✅ | All three methods + class ASI choices including feat option |
| Spell catalogue & lists | ✅ | Full lists for all 12 classes; Magical Secrets / Discoveries / unions |
| Spellcasting | ✅ | All 12 classes; spellbook + Pact Magic; prepared limits; creation-time only |
| Starting equipment | ✅ | Nested trees for bundled classes/backgrounds |
| Full equipment catalogue | ⏸ | Starting-package scope; shop deferred |
| Inventory, currency, loadout | 🟡 | Resolved inventory + Overview loadout; no shop |
| Proficiencies & languages | 🟡 | Class/background/species/feat on sheet; some play-time gaps |
| Derived combat stats | 🟡 | HP/AC/initiative strong; combat execution Phase 3 |
| Multiclass | ✅ | UI + validation + shared slots + ability prerequisites + open/import routing |
| Higher-level creation | ✅ | Levels 1–20; legal-build matrix + incomplete routing matrix (P2.12) |
| Wizard visibility & routing | ✅ | Shared `getCharacterOpenDestination`; Background required |
| Import/export & migrations | ✅ | `.cforge` + localStorage v0→v15 |
| Overview & in-play management | 🟡 | Creation-time sheet complete; no rest/combat/play mode |

---

## Phase 2 completion

**Phase 2 guarantees complete and legal SRD 2024 character creation. It does not yet execute play-time combat, rest, resource, condition, summon, or temporary-effect mechanics.**

As of **P2.12** (schema **v15**):

- All **12** SRD 2024 classes are creatable at levels 1–20 with their bundled subclass.
- All bundled species, backgrounds, feats, subclasses, spells, and starting-equipment paths participate in validation.
- Legal builds reach Overview / Finish; incomplete or illegal builds block Finish with actionable issues and route to the first incomplete active step.
- Save, load, export, and import preserve creation-time state; migrations do not invent selections.
- Content-driven progression remains the architecture; named SRD IDs in generic layers are limited to documented exceptions below.

### Finish policy (P2.12)

Finish is allowed only when every required wizard step is complete, active entitlements are satisfied, prerequisites hold, duplicates/stale dependents are cleared, and derived resolution has no blocking errors. Finish does **not** block on play-time concerns (unspent resources, current HP, expended slots, rests, summons, temp effects, combat targets, reactions, attunement, ammunition, mid-play preparation).

Shared APIs: `getFinishPolicyResult`, `getAllStepStatuses` / `getFirstIncompleteCharacterStep`, `getCharacterOpenDestination` / `buildCommittedStepValidationContext`.

### Coverage matrices (P2.12)

- Legal builds: `src/app/__tests__/p212LegalBuilds.test.ts` (+ `src/testing/srdLegalClassChoices.ts`, `autofillSpellSourceStates.ts`)
- Incomplete routing: `src/app/__tests__/p212IncompleteRouting.test.ts`
- Catalogue integrity: `src/content/packs/srd-2024/__tests__/catalogueIntegrity.test.ts`
- Issue ordering: `src/rules/validation/issueOrdering.ts`

### Documented deliberate exceptions

| Exception | Location | Notes |
|-----------|----------|-------|
| Fighting Style legacy option → feat map | `domain/class/fightingStyle.ts` (`FIGHTING_STYLE_LEGACY_OPTION_TO_FEAT_ID`) | Compatibility for saves using option ids (`defense`, `archery`, …) |
| Gold pieces item id | `domain/equipment/types.ts` (`GOLD_PIECES_ITEM_ID` = `srd-2024:gold-pieces`) | Stable currency grant id in equipment trees |
| ASI feat cycle guard | ASI feat-mode pickers | Prevents selecting the ASI feat as an ASI feat-mode pick |
| Content registry overrides/patches | `content/registry/` | Pack registration may patch/override by id; document pack-level only |
| UI asset / icon mappings | feature UI | Labels/icons may map content ids without affecting resolution |
| Runtime resources & active effects | sheet / Phase 3 | Descriptive only until play-time systems exist |

### Deferred to Phase 3

- Combat execution (attacks, weapon mastery combat, Savage Attacker rolls)
- Rest workflows; HP / hit-dice / spell-slot expenditure tracking
- Concentration, conditions, summons, temporary HP, familiar / pact weapon conjure
- Wild Shape transformation (Known Forms remain creation-time)
- Attunement, ammunition, encumbrance enforcement, shop
- Species play-time uses (Luck, Breath Weapon, Relentless Endurance, etc.)
- Post-creation level-up workflow and live session sheet mode

---

## Detailed coverage

### Species and ancestry / lineage choices

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | 9 species in `species/index.ts` |
| UI | ✅ | `SpeciesStep` → `SpeciesPicker` with search and choices (incl. Human Versatile feat grant) |
| Persistence | ✅ | `character.species`; schema v2+ (no v15 bump for Human Skillful/Versatile) |
| Validation | ✅ | `speciesRules.ts` including feat-grant / duplicate checks |
| Derived | 🟡 | Creator-time: darkvision, resistance, HP, skills, speed, size, ability save notes, lineage/legacy spells, Versatile feat grants. **Play-time** traits (Luck, Breath Weapon, Relentless Endurance, Giant Ancestry uses, Large Form, Resourceful Inspiration, etc.) remain descriptive |
| Sheet | 🟡 | Species card uses resolved size/speed/display name; skills & Versatile on Overview; species spell groups on Spells step |
| Tests | ✅ | `phase1SpeciesMechanics`, `speciesGrants`, workflow / picker tests |

**Phase 1 boundary (D1):** Only creator-time effects are resolved. Active-use / rest / triggered species features stay descriptive until a play-sheet exists.

**Acquisition:** Human Versatile → `species.choices.versatile` → `resolveCharacterFeatGrants` (`species-feat-grant`); never writes `character.feat`.

---

### Backgrounds and custom backgrounds

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | 4 backgrounds: Acolyte, Criminal, Sage, Soldier |
| UI | ✅ | `BackgroundStep` → `BackgroundPicker` + optional `CharacterDetailsSection` |
| Persistence | ✅ | `character.background`; schema v4+ |
| Validation | ✅ | `backgroundRules.ts` — ability scores, skills, tool, feat |
| Derived | ✅ | ASI bonuses, skills, origin feat, starting equipment entitlements |
| Sheet | ✅ | Background card + proficiencies on Overview |
| Tests | ✅ | `backgroundWorkflow`, `backgroundRules`, draft tests |

**Gaps:** No custom / build-your-own background flow (future homebrew tooling — not an
SRD catalogue gap; SRD 5.2.1 names exactly these four). Soldier gaming-set choice is
wired; other tool-choice backgrounds N/A until more content ships.

---

### Classes and subclasses

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | **12/12** SRD classes; **1 subclass each** |
| UI | ✅ | `ClassStep` — single-class and multiclass workflows |
| Persistence | ✅ | `classes[]`, `targetLevel`, `startingClassInstanceId`; schema v9+ |
| Validation | ✅ | `validateCharacterClasses.ts`, `classRules.ts` |
| Derived | 🟡 | Class effects → proficiencies, spellcasting, HP dice; Jack of All Trades on skills |
| Sheet | ✅ | Class feature cards on Overview |
| Tests | ✅ | Per-class content + progression tests; `classWorkflow` |

**Bundled:** Fighter (Champion), Barbarian (Berserker), Bard (College of Lore), Rogue (Thief),
Monk (Open Hand), Ranger (Hunter), Paladin (Devotion), Cleric (Life Domain),
Druid (Circle of the Land), Wizard (Evoker), Sorcerer (Draconic Sorcery),
Warlock (Fiend Patron).

**Warlock (Phase 2 boundary):** CHA prepared Pact Magic (`slotContributor: 'pact'`).
Eldritch Invocations are creation-time multi-select with level-scaled counts and
prerequisites; Pact Boons are invocations (Blade/Chain/Tome). Mystic Arcanum is
fixed-level prepared picks (`countsAgainstLimit: false`). Magical Cunning, temp HP,
familiar summon, pact weapon conjure, and Hurl Through Hell execution are descriptive
only — no play-time resource state.

**Sorcerer (Phase 2 boundary):** Prepared CHA full caster (not known-spells). Metamagic is
creation-time multi-select only (2 at L2 / L10 / L17 with shared-pool exclusion). Font of
Magic / Innate Sorcery / Sorcery Points / Incarnate / Apotheosis / Restoration are
descriptive with max points in Font text — no play-time resource state.

**Bardic Inspiration (Phase 2 boundary):** Feature text + die progression metadata only.
No play-time use tracking or spending.

**Wild Shape (Phase 2 boundary):** Known Forms are creator-time multi-select only.
No play-time transformation of sheet stats.

**Magical Secrets:** From Bard level 10, prepared picks may come from Bard ∪ Cleric ∪
Druid ∪ Wizard via entitlement `expandedListId` / `expandedFromLevel` (same prepared
budget — not a separate known pool). Off-list picks prune when level drops below 10.

---

### Class feature choices

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | Skill proficiencies, subclasses, fighting styles, weapon mastery, ASIs, Epic Boon, Divine Order, Primal Order, Elemental Fury, Circle land, Wild Shape Known Forms, expertise, HP increases |
| UI | ✅ | `ClassProgressionSection`, `ClassMultiSelectChoiceField`, `AsiChoiceField`, `FeatGrantChoiceField` |
| Persistence | ✅ | `ClassInstance.choices`, `hitPointIncreases` |
| Validation | ✅ | `classRules.ts` including ASI/Epic Boon encoding and weapon-mastery dedup |
| Derived | 🟡 | Most choice effects resolve; Champion L7 second fighting style is text-only |
| Sheet | ✅ | Feature accordion + choice summaries |
| Tests | ✅ | `classRules.test.ts`, per-class progression tests, `ClassPicker.test.tsx` |

---

### Deferred class requirements

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | `starting-equipment` (L1) on all bundled classes |
| UI | 🟡 | `ClassDeferredRequirementsPanel` links to destination steps |
| Persistence | ➖ | Requirements are derived, not stored |
| Validation | 🟡 | Unresolved deferred reqs block finish (`characterFinishPolicy.ts`) |
| Derived | ✅ | Starting equipment resolves to inventory |
| Sheet | ✅ | Alerts on Overview when unresolved |
| Tests | ✅ | `deferredRequirements.test.ts`, progression tests |

**Note:** Epic Boon is a **class progression choice** at level 19 (`epic-boon`), not a
deferred requirement.

---

### Feats and feat acquisition

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | **All SRD 5.2.1 feats** (Alert, Magic Initiate ×3 lists, Savage Attacker, Skilled, ASI, Grappler, 4 Fighting Styles, 7 Epic Boons) |
| UI | 🟡 | Grants via Background / ASI / Epic Boon / Fighting Style / Versatile / Invocations; **Feats wizard step stays hidden** |
| Persistence | ✅ | Class/species/background companion keys (`feat-choices:{slot}:…`); schema **v15**; `character.feat` legacy-only |
| Validation | ✅ | Prerequisites, duplicates, nested ASI/spell-ability/Skilled choices, ASI max 20/30, Finish blocks incomplete grants |
| Derived | 🟡 | Alert initiative ✅; Defense AC ✅; Epic Boon / Grappler / ASI score picks ✅; Truesight sense ✅; Night Spirit resistance metadata ✅; Magic Initiate spells + ability choice ✅; combat/teleport/dice/free-cast/invisibility still descriptive |
| Sheet | ✅ | Overview grants + source labels; senses include feat Truesight; resistances list conditional feat metadata |
| Tests | ✅ | `p211SrdFeats`, Fighting Style, Skilled/ASI nested, eligibility, content-defined fixtures |

**SRD feat checklist (P2.11):** Alert; Magic Initiate (Cleric/Druid/Wizard variants); Savage Attacker; Ability Score Improvement; Archery; Defense; Great Weapon Fighting; Two-Weapon Fighting; seven Epic Boons. Also bundled: Skilled, Grappler (SRD, outside the “15” narrative list).

**Magic Initiate:** Shared factory; Int/Wis/Cha ability choice; spell-source isolation via existing entitlements; free cast / Spell Change descriptive until play sheet.

**Epic Boons:** Level 19+ (Spell Recall also `has-spellcasting`); shared `plus-1` ASI choice (max 30; restricted abilities where SRD requires); Truesight / Night Spirit via generic `sense` / `damage-resistance` effects. Peerless Aim, Blink Steps, Improve Fate, Overcome Defenses combat, Free Casting, Merge with Shadows remain Phase 3.

**Acquisition paths:** Background origin feat (nested choices under `feat-choices:origin-feat:…`); class ASI feat mode; Epic Boon; Fighting Style; catalogue feat grants; species Versatile; Warlock Lessons. Shared pipeline: `resolveCharacterFeatGrants` → eligibility, dedup, spell resolution, Overview labels.

**Cycle guards:** ASI feat excluded from ASI “Choose a Feat” lists only. Epic Boon may select the ASI feat with nested score config.

**No feat-id branches in generic resolvers** — behaviour is content metadata + reusable effects/choices.

---

### Fighting styles

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | Archery, Defense, Great Weapon Fighting, Two-Weapon Fighting as `category: 'fighting-style'` feats |
| UI | ✅ | `FeatGrantChoiceField` with `categoryFilter: 'fighting-style'`; Blessed Warrior / Druidic Warrior as alternates |
| Persistence | ✅ | `feat:{id}` (legacy bare option ids still resolve); Champion L7 `champion-additional-fighting-style` |
| Validation | ✅ | Feat eligibility + non-repeatable dedup across grant slots; prunes when subclass/level drops |
| Derived | 🟡 | **Defense +1 AC while wearing armour ✅**; Archery / GWF / TWF combat application deferred |
| Sheet | ✅ | Overview feat grants with source labels; AC includes Defense when armoured |
| Tests | ✅ | `fightingStyleFeats`, AC / sheet Defense tests, Fighter/Paladin/Ranger content tests |

**Acquisition:** Class Fighting Style feature → shared feat-grant pipeline (same as Epic Boon). No parallel class-specific style model.

---

### Weapon mastery

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | Slot thresholds per class; 8 mastery properties; weapon→property map |
| UI | ✅ | Multi-select weapon choices on Class step |
| Persistence | ✅ | Class instance choices |
| Validation | ✅ | Cross-choice duplicate prevention in `classRules.ts` |
| Derived | 🟡 | Property labels on choices; **mastery properties not applied in combat** |
| Sheet | 🟡 | Shown in class feature summaries |
| Tests | ✅ | Per-class `*.weaponMastery.test.ts`, domain mastery tests |

**Deferred:** Fighter L1 “practice weapon drills” gear sub-choices (README roadmap item).

---

### Ability scores and ASIs

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | Standard array, point buy (27), manual/rolled |
| UI | ✅ | `AbilityScoresStep` → `AbilityScoresForm` |
| Persistence | ✅ | `abilityScores`, `creationMethod`; background ASI in selections |
| Validation | ✅ | Method-specific rules + `canSaveCharacter` |
| Derived | ✅ | Modifiers feed skills, saves, spell DCs, HP (CON) |
| Sheet | ✅ | Ability cards with breakdown |
| Tests | ✅ | `standardArrayWorkflow`, `rolledWorkflow`, `abilityScoresWizard`, point-buy tests |

**ASI choices:** All bundled classes through L20; feat option at ASI levels via
`AsiChoiceField`. Epic Boon at L19 is **not** an ASI choice.

---

### Spell catalogue and class spell lists

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | **~360** spell definitions; lists for all 12 classes (+ Magical Secrets / Discoveries / all-cantrips / L1-rituals unions) |
| UI | ➖ | Catalogue consumed by Spells step and ASI feat picker |
| Persistence | ➖ | Definitions only |
| Validation | ➖ | — |
| Derived | ➖ | — |
| Sheet | ➖ | — |
| Tests | 🟡 | Spellcasting resolution tests; no full catalogue completeness test vs SRD |

**Scope:** Spells are included **on demand** (class lists, grants, Magic Initiate), not
as a full SRD spell compendium. All 12 class lists are complete through 9th level where
applicable. Magical Secrets / Magical Discoveries / all-cantrips / level-1-rituals are
authored union lists.

---

### Spellcasting, Pact Magic, spellbooks, prepared/known spells

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | Full/half casters + **Warlock** prepared Pact Magic; domain/circle/lore/draconic/fiend grants; invocations / arcanum / Contact Patron |
| UI | ✅ | `SpellsStep` → `SpellSelectionGrid`; spellbook + prepare-from-book; mastery/signature/arcanum; Pact Magic slot summary; invocation prereq disable reasons |
| Persistence | ✅ | `spellSourceStates`; schema v12+ (optional P2.5 fields; **no migration**, stay v15) |
| Validation | ✅ | `useSpellsStepValidation`, `spellSelectionEligibility`; union spellbook + schools/castingTime/ritual; invocation prerequisites |
| Derived | ✅ | Shared multiclass slots (`full`/`half` only); **Pact Magic `pactSlots` separate**; `countsAgainstLimit: false` for mastery/signature/arcanum/tome |
| Sheet | ✅ | Spell groups on Overview (Pact / Patron / Tome / Arcanum / Contact Patron labels) |
| Tests | 🟡 | `resolveCharacterSpellcasting*.test.ts`, `spellbookAndPactMagic.test.ts`, `contentDrivenProgressions.test.ts`, `warlock*.test.ts`; **no Spells-step wizard E2E** |

**Progression ownership:** Named-class tables (Cleric/Wizard/Warlock/… cantrips,
prepared, pact slots, ASI levels, Bardic Inspiration, Wild Shape uses, invocations)
live in `content/packs/srd-2024/progressions/`. Domain `spell/progressions` keeps
reusable presets (`FULL_CASTER_*`, `HALF_CASTER_*`, `ZERO_CANTRIPS`) plus helpers
(`slotsAtLevel`, `pactMagicAtLevel`, `spellbookSizeAtLevel`, …). Resolvers read
tables from class definitions — they do not import SRD named progressions.

**P2.5–P2.6 architecture:** Spellbook entries live on `selectionKind: 'spellbook'`
select entitlements (Wizard uses **distinct** `spellbook-1`…`spellbook-20` for
attribution). Prepared-from-book uses `prepareFrom: 'spellbook'`; when
`spellbookEntitlementId` is omitted, all spellbook-kind sources on the same class
instance are unioned. Pact Magic uses `slotContributor: 'pact'` →
`resolvePactMagicSlots` / `summary.pactSlots` (never merged into conventional
shared slots). Fixtures: `createTestSpellbookCasterClass` /
`createTestPactCasterClass` (tests only; pact fixture uses prepared + `pact-slot-level`).

**P2.10 Warlock (done):** Full Warlock + Fiend Patron; CHA prepared Pact Magic;
Eldritch Invocations (all SRD options, prereqs, `limitsByLevel`); Pact Boons as
invocations; Mystic Arcanum 6–9; Contact Patron grant; Fiendish Resilience
creation-time damage type; full Warlock spell list. Play-time Magical Cunning /
temp HP / familiar / conjure / Hurl Through Hell deferred.

**Still pending:**
play-time Arcane Recovery / Memorize Spell / Overchannel / Potent Cantrip / Sculpt Spells /
Empowered Evocation / Magical Cunning execution tracking.
Species lineage spells wired for
bundled species. Play-time slot expenditure / rest recovery deferred.

**P2.6 Wizard (done):** Full Wizard class + Evoker; distinct spellbook acquisitions;
Scholar expertise; Spell Mastery + Signature Spells (`countsAgainstLimit: false`);
Ritual Adept descriptive; Wizard spell list through 9th level (~222 list entries).

**P2.8 Bard (done):** Full Bard class + College of Lore; CHA prepared full caster;
Magical Secrets prepared-list expansion at L10+; Magical Discoveries (2 always-prepared
from Cleric∪Druid∪Wizard); Words of Creation grants; Jack of All Trades (skills only,
not initiative); Bardic Inspiration descriptive + die metadata only; full Bard spell list.

**P2.9 Sorcerer (done):** Full Sorcerer class + Draconic Sorcery; CHA **prepared** full
caster (L1 starts at 2 prepared — SRD prose); Metamagic multi-select at L2/10/17 with
shared-pool exclusion; Font/Innate/Incarnate/Apotheosis/Restoration descriptive; Draconic
Resilience HP (+1/class level) + unarmored AC (10+DEX+CHA); Elemental Affinity resistance;
full Sorcerer spell list.

**Finish policy:** Spells step remains `required: false` in the catalog, but when
`hasSpellContent` is true, incomplete/invalid active spell choices
(`under-limit`, `not-in-spellbook`, etc.) block Finish via
`requireCompleteSpells` on `getFinishPolicyResult`.

---

### Starting equipment

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | All 11 classes: Package A (+ Package B for Fighter) vs gold; Sorcerer package A + 50 GP (crystal focus); Bard package A + 90 GP with nested instrument; Wizard package A + 55 GP; 4 backgrounds: package vs 50 GP; **nested** Monk artisan tools + Soldier gaming set + Bard musical instrument |
| UI | ✅ | `EquipmentStep` → `EquipmentSourceSection` with nested choose-option / choose-items |
| Persistence | ✅ | `equipment.selections` with `path[]`; schema v15 |
| Validation | ✅ | Required nested incompleteness blocks Finish via deferred starting-equipment |
| Derived | ✅ | `resolveCharacterEquipment` walks active nodes and materializes inventory + GP |
| Sheet | 🟡 | Inventory appears on Overview after resolution |
| Tests | ✅ | Choice-tree, prune, Monk/Soldier nested resolve, migration v14→v15, package content tests |

**Architecture:** Content-driven nested trees (`choose-option` → option.entitlements →
`choose-items`). Future classes/backgrounds reuse the same resolver/UI — no class-specific
branches. Gold alternatives complete the root without nested package choices. Optional
entitlements (`required: false`) do not block.

**Still open (not incomplete defs):** Cleric/Fighter-style multi-branch SRD trees for classes
that are not yet authored beyond package-vs-gold; play-time shop / encumbrance enforcement /
attunement / inventory actions remain deferred.

---

### Full equipment catalogue

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ⏸ | Starting-package items + full artisan-tool and gaming-set defs (tagged); not a full SRD shop catalogue |
| UI | ❌ | No browse/search compendium or shop |
| Persistence | ➖ | — |
| Validation | ➖ | — |
| Derived | 🟡 | Items used by resolver and loadout |
| Sheet | 🟡 | Owned items on Overview inventory |
| Tests | 🟡 | Materialization / nested filter tests; no SRD-wide catalogue audit |

---

### Inventory, currency, containers, and loadout

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | 🟡 | Items, packs (`expandsTo`), containers, GP |
| UI | 🟡 | Equipment step = selections only; **loadout editing on Overview** (`InventoryPanel`) |
| Persistence | ✅ | `equipment.loadout`; schema v14 |
| Validation | ✅ | Equip conflicts via `previewEquipItem` |
| Derived | ✅ | Encumbrance (`STR × 15`), AC from equipped armor/shield |
| Sheet | ✅ | Tabs, search, weight/cost, equip/unequip |
| Tests | ✅ | `InventoryPanel`, `equipmentLoadout`, status warning tests |

**Gap:** `EquipmentLoadoutManager` exists but is test-only (not wired in wizard).

---

### Proficiencies, Expertise, skills, saves, and languages

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | Class/background/species language definitions |
| UI | ✅ | Skill choices on Class step; languages via species |
| Persistence | ✅ | Class choices + background + species selections |
| Validation | ✅ | Skill choice counts enforced |
| Derived | 🟡 | Class + background skills on sheet; species skills (Phase 1); **Alert initiative ✅** |
| Sheet | 🟡 | Skills, saves, proficiencies panels on Overview |
| Tests | ✅ | `buildReviewSheetModels.test.ts` |

**Gaps:** Feat-granted proficiencies (Alert initiative prof.) not applied. Class tool
proficiencies beyond background tool line not surfaced.

---

### HP, AC, Initiative, speed, senses, and other derived statistics

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | Hit dice, armor stats, species speed/darkvision |
| UI | 🟡 | HP choices on Class step; combat strip on Overview |
| Persistence | ✅ | HP increases on class instances |
| Validation | ✅ | HP choice validation per level |
| Derived | 🟡 | **HP ✅, AC ✅** (loadout-driven + Defense FS); **Initiative** = DEX + Alert PB when granted; **Speed** = species walk (Phase 1) |
| Sheet | ✅ | Combat stat summary on Overview |
| Tests | ✅ | `calculateCharacterHitPoints`, `calculateCharacterArmorClass`, `buildReviewSheetModels`, `resolveFeatEffects` |

**Gaps:** Weapon mastery combat tags not applied yet. Archery / GWF / TWF attack and
damage automation stays play-phase. Alert Initiative Swap remains descriptive.

---

### Multiclass rules

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | `multiclassPrerequisite` on all bundled classes (SRD 13+ primary abilities) |
| UI | ✅ | Multiclass path, level allocation, starting class; prereq failures surfaced |
| Persistence | ✅ | `classes[]`, editor workflow in session storage |
| Validation | ✅ | Duplicate class blocked; allocation vs `targetLevel`; **ability score prerequisites** via resolved scores (base + background ASI + class ASI) |
| Derived | ✅ | Shared spell slots, per-class HP, combined level for proficiency |
| Sheet | ✅ | Multi-class header and feature cards |
| Tests | ✅ | `multiclassPrerequisites.test.ts`, `validateCharacterClasses`, class workflows |

**Behaviour:** Single-class builds skip prerequisites. Multiclass characters must meet
each class’s prerequisite; failures mark Class incomplete and block Finish without
mutating saved selections.

---

### Higher-level character creation

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | All bundled classes define features through L20 |
| UI | ✅ | Level stepper 1–20 (`LevelStepper`) |
| Persistence | ✅ | `targetLevel`, per-instance `level` |
| Validation | ✅ | Level-gated choices work; Epic Boon required at class level ≥ 19 |
| Derived | ✅ | Progression effects scale with level |
| Sheet | ✅ | Overview reflects target level |
| Tests | ✅ | Progression tests per class |

---

### Wizard step visibility and routing

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ✅ | 10 steps in `wizard/steps.ts` |
| UI | 🟡 | Nav shows visible steps only; **no URL/deep links** |
| Persistence | ✅ | `activeStepId` in editor session (sessionStorage) |
| Validation | ✅ | `getFirstIncompleteCharacterStep`, finish policy |
| Derived | ✅ | Open/import lands on first incomplete visible step |
| Sheet | ➖ | — |
| Tests | ✅ | `stepVisibility`, `navigation`, `firstIncompleteCharacterStep`, open-character hook tests |

| Step | Required | Visible by default |
|------|----------|-------------------|
| Basics | Yes | Yes |
| Class | Yes | Yes |
| Background | No | Yes |
| Species | Yes | Yes |
| Abilities | Yes | Yes |
| Equipment | No | Yes |
| Feats | No | **Hidden** (`hasFeatChoices` → false) |
| Spells | No | **When** `hasSpellContent` |
| Overview | No | Yes |

Optional **Character Details** (identity, personality, backstory) are edited on
the Background page below background selection — not a separate wizard step.

---

### Import, export, save, load, and schema migrations

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ➖ | — |
| UI | ✅ | Home + editor import; export download |
| Persistence | ✅ | localStorage `characterforge:character:{id}`; schema **v15** |
| Validation | ✅ | `parseStoredCharacter`, `isCharacter` |
| Derived | ➖ | — |
| Sheet | ➖ | — |
| Tests | ✅ | Per-migration tests (v0→v15), `characterFile.test.ts`, `appEntryFlow.test.tsx` |

**Migration chain:** v0→v15 in `adapters/storage/migrations/`. See
[`src/adapters/STORAGE.md`](../src/adapters/STORAGE.md) — note that file may lag the
code (documents through v11 at time of audit).

---

### Overview and in-play character management

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content | ➖ | — |
| UI | 🟡 | `ReviewStep` (Overview): sheet layout, inventory loadout, finish |
| Persistence | ✅ | Same character model; autosave on edit |
| Validation | ✅ | Finish policy, deferred requirement alerts |
| Derived | 🟡 | Full creation-time sheet; **no play-mode** (rests, HP tracking, spell slot spend, level-up after creation) |
| Sheet | 🟡 | Strong static sheet; not optimized for live session tracking |
| Tests | ✅ | `ReviewStep`, `reviewCharacterSheet`, `organizeReviewSheet` |

**In scope for “creation tool”:** export `.cforge`, reopen, edit any wizard step.
**Out of scope today:** encounter mode, resource tracking, post-creation leveling workflow.

---

## Roadmap

### 1. Required for a complete SRD 2024 character creator

- [x] **Druid (P2.7)** — full class, Circle of the Land, Primal Order, Wild Shape Known Forms (creator-time only), full Druid spell list through 9th
- [x] **Bard (P2.8)** — full class, College of Lore, Magical Secrets list expansion, Magical Discoveries, Words of Creation, Jack of All Trades, full Bard spell list; Bardic Inspiration Phase 2 descriptive only
- [x] **Sorcerer (P2.9)** — full class, Draconic Sorcery, prepared CHA full caster, Metamagic creation-time choices, Elemental Affinity resistance, Draconic Resilience HP/AC, full Sorcerer spell list; Font/Innate/points Phase 2 descriptive only
- [x] **Warlock (P2.10)** — full class, Fiend Patron, CHA prepared Pact Magic, Eldritch Invocations (prereqs + `limitsByLevel`), Pact Boons as invocations, Mystic Arcanum, Contact Patron, Fiendish Resilience creation-time choice, full Warlock spell list; Magical Cunning / temp HP / familiar / conjure / Hurl Through Hell Phase 2 descriptive only
- [x] **P2.11 Complete SRD 2024 feats** — all checklist feats + Epic Boon ASI/senses/resistances; Magic Initiate Druid + ability choice; no schema migration
- [x] **P2.12 Phase 2 Finish, Validation, and Coverage Hardening** — Finish policy, shared routing, legal/incomplete matrices, catalogue integrity, issue ordering; schema remains v15
- [ ] **Species play-time features:** Luck, Breath Weapon, Relentless Endurance, Giant Ancestry uses, Large Form, Resourceful Inspiration
- [x] **ASI feat from Epic Boon / ASI feat-mode** — nested +2 / +1+1 via companion keys; ASI feat excluded from ASI feat-mode pickers only (cycle guard)
- [x] **Skilled sub-choices** — multi-select skill/tool companion keys under feat grants
- [ ] **Additional SRD backgrounds** beyond the bundled four
  - **Correction:** SRD 5.2.1 names exactly four backgrounds (all bundled). Custom
    background builder is future homebrew tooling, not an SRD catalogue gap.
- [x] **Multiclass ability score prerequisites**
- [x] **Champion Additional Fighting Style** (L7)
- [x] **Species lineage spell entitlements** (Elf, Gnome, Tiefling, etc.)
- [x] **Magic Initiate / Alert creator-time derived mechanics** (initiative, spell ability choice, entitlements); Savage Attacker / free cast / Spell Change remain play-time
  - Alert initiative proficiency: done (P2.1)
  - Defense Fighting Style AC: done (P2.2)
  - Magic Initiate ability + Druid list: done (P2.11)
- [x] **Creation-time nested starting-equipment trees** for bundled classes/backgrounds (Monk artisan tools, Soldier gaming set); future classes reuse the same architecture
- [ ] **Additional class starting-equipment branch trees** where SRD offers more nested choices (e.g. remaining package sub-picks) — defs not yet authored, not a resolver gap
- [ ] **Expand spell catalogue** as new casters ship (full lists per class, not stubs)
  - Wizard + Druid + Bard + Sorcerer + Warlock lists complete through 9th level; Magical Secrets / Discoveries / all-cantrips / L1-rituals unions

### 2. Required for a usable character sheet during play

- [x] **Apply feat modifiers** (Alert initiative, Defense AC, Epic Boon ASI/senses/resistances, Grappler ASI) — combat execution still Phase 3
- [ ] **Apply fighting style / weapon mastery** combat effects (or clearly mark as reference-only)
  - Defense AC while wearing armour: done (P2.2)
- [x] **Correct speed** from species choices (Wood Elf, Goliath) — Phase 1
- [ ] **Spell slot tracking** — expended vs remaining, multiclass slot table on sheet
  - Creation-time Pact Magic / shared slot resolution done (P2.5); play-time expenditure & rest recovery deferred
- [ ] **HP tracking** — current vs max, hit dice remaining
- [ ] **Rest workflow** — short/long rest resource recovery (class features, spell slots, HP)
- [ ] **Concentration / condition tracking** (minimal)
- [ ] **Print / PDF export** of Overview layout
- [ ] **Editable Overview** or quick-edit panels without walking full wizard

### 3. Optional SRD compendium or campaign-management features

- [ ] Full SRD equipment compendium and shop/purchase workflow
- [ ] Encumbrance enforcement, attunement, and play-time inventory actions
- [ ] Full SRD spell compendium browser
- [ ] Full SRD feat compendium (remaining origin/general feats)
- [ ] Custom background builder
- [ ] Campaign roster / party management
- [ ] Cloud sync or shared character links
- [ ] Additional subclasses beyond one per class
- [ ] `srd-2014` content pack (species, classes, rules deltas)
- [ ] URL routing / deep links to characters and steps

### 4. Explicitly out of scope

- Non-SRD licensed book content (PHB-only options, setting-specific material)
- Automatic cross-edition character conversion
- Virtual tabletop integration
- Dice rolling / attack automation beyond ability generation
- DM tools (encounter building, initiative tracker for whole party)
- Rules engine for every situational SRD exception text

---

## Audit notes

**Method:** File inspection, test grep, and spot-checks of resolver and wizard paths.
Comments and README claims were verified against code.

**Counts verified in repo:** 9 species, **12** classes, **12** subclasses, 4 backgrounds, **19** feats
(origin feats + fighting styles + epic boons + ASI + Grappler + Skilled + Magic Initiate variants as shipped),
~360 spells, equipment catalogue for starting packages + artisan tools + gaming sets, storage schema **v15**.

**Distinguish gaps carefully:**

- **Incomplete authored defs** — a bundled class/background still missing a nested SRD
  sub-choice that the architecture already supports.
- **Not-yet-implemented play-time class resources** — Magical Cunning execution, temp HP, familiar summon, pact weapon conjure, Hurl Through Hell (creation-time Warlock content is shipped).
  Wild Shape play-time transformation is out of Phase 2 (Known Forms only today).
- **Play-time gaps** — shop, encumbrance enforcement, attunement, rest/level-up inventory.

**Uncertain without manual SRD crosswalk:**

- Whether each starting-equipment package exactly matches SRD 5.2.1 item quantities and
  gold amounts (content tests cover bundled options but not literal SRD page parity).
- Whether all class feature **text** on Overview matches SRD wording (mechanical resolution
  was the audit focus).

**Documentation:** This file is the Phase 2 closure status document (P2.12).
