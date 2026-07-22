# Character Forge — Phase 3 Roadmap

## Character Management & Gameplay

### Phase Goal

Phase 3 transitions Character Forge from a **character builder** into a **complete digital character sheet** suitable for active tabletop play.

The guiding philosophy changes from:

> "Can the player build a legal character?"

to:

> "Can the player comfortably play an entire campaign using Character Forge?"

The existing character creation flow remains the authoritative source for immutable character data. Phase 3 focuses on gameplay state, usability, and quality-of-life improvements while preserving the existing architecture.

---

# Architectural Principles

## 1. Separate Build Data from Gameplay State

Character creation decisions should remain immutable until the user explicitly edits the build.

Examples:

* Species
* Class
* Background
* Ability Scores
* Feats
* Starting Equipment
* Spell selections

Gameplay data is expected to change constantly.

Examples:

* Current HP
* Temporary HP
* Spell slots
* Class resources
* Equipped items
* Inventory quantities
* Currency
* Conditions
* Death Saves
* Notes

Gameplay actions must never modify build data directly.

---

## 2. Reuse Existing Systems

Whenever possible, Phase 3 should extend existing systems rather than replacing them.

Examples include:

* Equipment Resolver
* Spell Source Resolver
* Validation Engine
* Content Pack System
* Feature Definitions
* Character Overview

---

## 3. Content-Driven Design

Avoid hardcoding class-specific gameplay logic whenever possible.

Resources, restoration behaviour, equipment interactions and similar mechanics should originate from content definitions.

Example concepts:

* Resource pools
* Rest recovery
* Equipment properties
* Attunement
* Weapon behaviours

The engine should execute generic rules supplied by content packs.

---

# Phase 3 Milestones

---

# P3.1 — Inventory System

Goal:

Replace the current "Starting Equipment" presentation with a complete inventory management system.

Objectives:

* Dedicated Inventory page
* Search
* Sorting
* Filtering
* Container support
* Currency management
* Quantity editing
* Equip / Unequip
* Move items between containers
* Split and merge stacks
* Custom items
* Carry weight calculation
* Encumbrance support (optional rule)

Inventory should become the authoritative representation of everything the character owns.

> **Detailed implementation plan:** see [PHASE-3.1-INVENTORY-PLAN.md](./PHASE-3.1-INVENTORY-PLAN.md).

---

# P3.2 — Character Sheet

Goal:

Provide a complete playable character sheet.

Include sections for:

* Identity
* Ability Scores
* Saving Throws
* Skills
* Initiative
* Armor Class
* Hit Points
* Hit Dice
* Speed
* Passive Scores
* Languages
* Senses
* Proficiencies
* Weapons
* Spellcasting
* Equipment Summary
* Features
* Notes

This milestone focuses primarily on presentation rather than gameplay editing.

---

# P3.3 — Gameplay Resources

Goal:

Introduce mutable gameplay state.

Support tracking of:

* Current HP
* Temporary HP
* Hit Dice
* Death Saves

Spellcasting:

* Spell Slots
* Pact Slots
* Prepared Spells
* Concentration

Class resources including (but not limited to):

* Rage
* Ki
* Bardic Inspiration
* Wild Shape
* Channel Divinity
* Second Wind
* Action Surge

Resources should be generated from content definitions whenever possible.

---

# P3.4 — Equipment & Combat

Goal:

Expand equipment into an active gameplay system.

Support:

* Weapon sets
* Shield handling
* Ammunition tracking
* Thrown weapons
* Versatile weapon modes
* Magic item bonuses
* Attunement
* Equipped summaries
* Weapon statistics previews

Equipment should accurately represent the character's current combat configuration.

---

# P3.5 — Rest System

Goal:

Automate gameplay recovery.

Provide:

* Short Rest
* Long Rest

Recovery should restore applicable resources automatically according to content definitions.

Examples include:

* Spell Slots
* Class Resources
* Hit Dice
* Temporary HP cleanup
* Daily abilities

Avoid class-specific hardcoded recovery logic.

---

# P3.6 — Conditions & Effects

Goal:

Track temporary gameplay effects.

Support:

* Standard D&D Conditions
* Exhaustion
* Custom conditions
* Duration tracking
* Concentration reminders
* Temporary effects

Conditions should remain independent from permanent character data.

---

# P3.7 — Notes & Journal

Goal:

Allow players to record campaign information.

Suggested sections:

* Campaign Notes
* NPCs
* Quests
* Treasure
* Session Log
* Personal Notes

Simple text support is sufficient for the initial implementation.

---

# P3.8 — Character Export

Goal:

Improve interoperability.

Support:

* Printable Character Sheet
* PDF Export
* JSON Export
* Improved Import/Export
* Shareable Builds (future-friendly architecture)

---

# P3.9 — Homebrew Content

Goal:

Leverage the existing Content Pack architecture.

Support user-created content including:

* Species
* Backgrounds
* Classes
* Subclasses
* Feats
* Spells
* Equipment
* Magic Items

This milestone should validate that Character Forge's architecture supports extensibility without modifying the core application.

---

# P3.10 — Polish

Goal:

Finalize the gameplay experience.

Focus on:

* Accessibility improvements
* Keyboard navigation
* Mobile responsiveness
* Performance optimizations
* Animation polish
* UI consistency
* Additional automated testing
* General quality-of-life improvements

---

# Overall Success Criteria

At the conclusion of Phase 3, Character Forge should function not only as a character builder but also as a complete digital companion throughout an entire D&D campaign.

A player should be able to:

* Create a character.
* Save and reload progress.
* Manage inventory.
* Equip and unequip gear.
* Track HP and resources.
* Cast spells.
* Take rests.
* Apply conditions.
* Manage notes.
* Export or print the character.
* Continue using the same character throughout long-term play without requiring external character sheets.

Phase 3 should build upon the robust architecture established during Phases 1 and 2 while maintaining Character Forge's core philosophy: approachable for new players, efficient for experienced players, and driven by reusable content rather than hardcoded rules.
