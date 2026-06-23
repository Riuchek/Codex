# Codex — Technical Architecture

This document describes the internal architecture of the Codex module for Foundry VTT. It is intended for developers, contributors, and AI models working on this codebase.

**Current version:** 0.3.1

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Data Layer](#data-layer)
5. [UI Layer](#ui-layer)
6. [Settings System](#settings-system)
7. [Rule Engine](#rule-engine)
8. [Foundry VTT Integration](#foundry-vtt-integration)
9. [Build Pipeline](#build-pipeline)
10. [Known Limitations](#known-limitations)
11. [Improvement Roadmap](#improvement-roadmap)

---

## Overview

Codex is a Foundry VTT module that tracks campaign statistics, epithets, and journal entries for player-owned actors. It runs entirely in the client (browser) — there is no server-side component beyond Foundry's own data persistence layer.

**Core design decisions:**

- **Data lives on the actor via Flags** — each actor carries its own `ActorRecord` as a Foundry flag. When an actor is deleted, its Codex data is deleted with it. This is intentional ("banished from history").
- **No external database** — all persistence goes through Foundry's built-in `setFlag`/`getFlag` API, which syncs automatically between connected clients.
- **System-agnostic by configuration** — HP path and attack flavor are configurable so the module works across different RPG systems without code changes.

---

## Technology Stack

| Tool | Version | Purpose |
|---|---|---|
| TypeScript | ^5.9 | Type safety across the codebase |
| Vite | ^8.0 | Build tool and bundler |
| vite-plugin-static-copy | ^4.1 | Copy non-JS assets to dist |
| @league-of-foundry-developers/foundry-vtt-types | ^13.x | TypeScript types for the Foundry API |
| Handlebars | (bundled with Foundry) | HTML templating |
| Google Fonts (Cinzel, EB Garamond) | CDN | Medieval typography |
| Transparent Textures | CDN | Parchment background texture |

---

## Project Structure

```
codex/
├── src/                        # TypeScript source
│   ├── module.ts               # Entry point — lifecycle hooks only
│   ├── types.ts                # All interfaces and types
│   ├── constants.ts            # MODULE_ID, DEFAULT_RULES, getNestedValue
│   ├── data/
│   │   ├── ActorRecord.ts      # CRUD for per-actor flags (update queue)
│   │   ├── SettingsManager.ts  # CRUD for module-level settings
│   │   ├── rollUtils.ts        # Dice/roll parsing — no Foundry side effects
│   │   ├── hooks.ts            # Foundry event listeners
│   │   ├── updateQueue.ts      # Per-actor write serialization
│   │   └── importExport.ts     # JSON backup/restore
│   ├── engine/
│   │   └── RuleEngine.ts       # Pure epithet rule evaluation
│   ├── utils/
│   │   └── markdown.ts         # Lightweight markdown renderer for journal
│   └── ui/
│       ├── CodexApp.ts         # ApplicationV2 — shell, tabs, re-render
│       ├── panels/
│       │   ├── StatsPanel.ts
│       │   ├── JournalPanel.ts
│       │   ├── EpithetsPanel.ts
│       │   ├── SettingsPanel.ts
│       │   └── DashboardPanel.ts
│       └── dialogs/
│           ├── RuleEditorDialog.ts
│           └── JournalEntryDialog.ts
│
├── templates/
│   └── codex.html              # Handlebars template for the main window
│
├── styles/
│   └── codex.css               # All styles, CSS variables, medieval theme
│
├── lang/
│   ├── en.json                 # English strings
│   └── pt-BR.json              # Brazilian Portuguese strings
│
├── docs/                       # Screenshots and documentation
├── dist/                       # Build output (gitignored)
├── module.json                 # Foundry module manifest
├── vite.config.ts              # Build configuration
└── tsconfig.json               # TypeScript configuration
```

---

## Data Layer

### Types (`src/types.ts`)

The core data model:

```ts
ActorRecord        // Everything stored per-actor via Foundry flags
  ├── name         // Synced from actor.name
  ├── img          // Synced from actor.img
  ├── stats        // Combat statistics — cumulative (epithet rules use these)
  │   ├── damageDealt
  │   ├── damageTaken
  │   ├── criticals
  │   ├── criticalFails
  │   └── killCount      // Manual only — not auto-captured
  ├── epithets     // Array of Epithet
  └── journal      // Array of JournalEntry

Epithet
  ├── label        // Display name
  ├── color        // Hex color string, e.g. "#c9922a"
  ├── icon         // Emoji or string, e.g. "⚔️"
  ├── auto         // true = generated by a rule, false = manually added
  └── ruleId       // ID of the EpithetRule that generated this (if auto)

JournalEntry
  ├── id           // foundry.utils.randomID()
  ├── title        // Free text — session name, date, etc.
  ├── content      // Free text body
  ├── createdAt    // Date.now() — used for chronological ordering
  └── tags         // string[] — free-form labels entered comma-separated in UI

EpithetRule        // Stored in CodexSettings, not per-actor
  ├── id           // Unique identifier
  ├── label        // Epithet name to award
  ├── color        // Color for the epithet badge
  ├── icon         // Icon for the epithet badge
  ├── scope        // "global" (all actors) or "actor" (one actor)
  ├── actorId      // Only set when scope === "actor"
  ├── conditionMode  // "all" (AND) or "any" (OR) between conditions
  └── conditions   // Array of Condition

Condition
  ├── stat         // Which stat to check (StatKey)
  ├── operator     // ">=" | "<=" | "==" | ">" | "<"
  └── threshold    // Numeric value to compare against

CodexSettings      // Stored in game.settings, world-scoped
  ├── hpPath       // e.g. "system.attributes.hp.value"
  ├── attackFlavor // e.g. "attacking"
  └── rules        // EpithetRule[]
```

### ActorRecord (`src/data/ActorRecord.ts`)

Responsible for reading and writing actor flags. All writes go through an **update queue** to prevent race conditions.

**Key functions:**

```ts
getRecord(actor)
// Pure read of the ActorRecord flag.
// Returns EMPTY_RECORD() when no flag is set — does not write.

initRecord(actor)
// Explicit initialization. Writes only when no flag exists yet.
// Called from CodexApp._prepareContext for all player-owned actors.

updateRecord(actor, patch)
// Shallow-merges patch into the current record and writes.
// Goes through the update queue.

updateStats(actor, patch)
// Updates cumulative stats only (manual edits). Runs RuleEngine.

incrementStats(actor, delta)
// Increments stats. Used by hooks. Runs RuleEngine.

resetAllStats(actor)
// Zeros stats and removes auto epithets.
```

**Update Queue pattern:**

Each actor has its own Promise chain in `updateQueue: Map<string, Promise<void>>`. Every write operation appends to the chain, so concurrent updates are serialized per actor. Failures are logged and surfaced via `ui.notifications.error`:

```
update A ──► update B ──► update C
             (waits)      (waits)
```

This prevents the lost-update problem where two reads happen before either write completes.

### importExport (`src/data/importExport.ts`)

```ts
buildExport()       // Collect all player-owned ActorRecords into CodexExport JSON
importData(data)    // Merge imported records onto matching actors by ID
downloadExport()    // Trigger browser download
pickAndImport()     // File picker → import
```

### rollUtils (`src/data/rollUtils.ts`)

Pure helpers for parsing Foundry chat rolls and detecting criticals. Used by `hooks.ts` — no Foundry writes, easy to unit test:

```ts
getMessageRolls(message)     // Parse Roll objects from a ChatMessage
getMessageFlavor(message)    // Normalized flavor text
matchesAttackFlavor(...)     // Check message/roll flavor against settings
isD20Critical(roll)          // Natural 20 on a d20 term
isD20CritFail(roll)          // Natural 1 on a d20 term
isMaxOnMainDie(roll)         // Max on primary die (non-attack rolls)
isNatural1OnMainDie(roll)    // Natural 1 on primary die
getHpDelta(actor, diff, path) // HP decrease from preUpdateActor diff
```

### SettingsManager (`src/data/SettingsManager.ts`)

Manages the `CodexSettings` object stored in `game.settings` (world-scoped, not per-actor). Registered with `config: false` so nothing appears in Foundry's native settings panel.

**Key functions:**

```ts
registerSettings()    // Called in "init" hook — registers the setting schema
getSettings()         // Returns current settings merged with defaults
saveSettings(patch)   // Shallow-merges and persists
getRules(actorId?)    // Returns applicable rules (global + actor-specific)
saveRule(rule)        // Upserts a rule by ID
deleteRule(ruleId)    // Removes a rule by ID
```

**Default rules** are defined in `constants.ts` as `DEFAULT_RULES: EpithetRule[]`. On first world load, these become the initial `rules` value. Labels are campaign-specific (Portuguese). The GM can modify or delete them — defaults are not re-applied on each load.

### Hooks (`src/data/hooks.ts`)

Listens to Foundry events and calls data layer functions. No UI logic here.

**Registered hooks:**

| Hook | Purpose |
|---|---|
| `createChatMessage` | Tracks criticals, critical fails, and damage dealt from chat rolls |
| `preUpdateActor` | Detects HP reduction to capture damage taken |
| `updateActor` | Syncs `name` and `img` via `updateRecord` when the actor is renamed or avatar changed |

**Chat message logic (`createChatMessage`):**

Only processes messages authored by the current user (`message.isAuthor`) that contain rolls. The target actor is resolved via `getActorFromMessage` (see below).

When the message matches the configured `attackFlavor` (default: `"attacking"`):
- `rolls[0]` = attack roll (d20) → natural 20 = critical, natural 1 = critical fail
- `rolls[1]` = damage roll → total added to `damageDealt`
- Critical hits trigger `ui.notifications.info` with `CODEX.NotifCritical`

When the message does **not** match attack flavor (ability checks, saves, etc.):
- `rolls[0]` → max on primary die = critical, natural 1 on primary die = critical fail
- No damage dealt is recorded

This attack pattern is Shadowdark-specific. Other systems may send rolls differently — hence the configurable `attackFlavor` setting.

**Actor resolution (`getActorFromMessage`):**

Tried in order:
1. `message.speakerActor`
2. `message.speaker.actor` → `game.actors.get`
3. `message.speaker.token` → canvas token's actor
4. Message author's assigned character
5. Single controlled canvas token's actor

Only player-owned actors are tracked.

**Damage taken logic:**

`preUpdateActor` receives the actor's current state and the incoming diff. The HP path (default: `system.attributes.hp.value`) is read from settings and resolved via `getNestedValue(obj, path)`. If the new HP is lower than the old HP, the delta is added to `damageTaken`.

---

## UI Layer

### CodexApp (`src/ui/CodexApp.ts`)

Extends `HandlebarsApplicationMixin(ApplicationV2)` — the Foundry v13 application API. Acts as a thin shell: actor/tab navigation, context preparation, and re-render orchestration. Panel-specific behavior lives in `src/ui/panels/`.

**State:**
```ts
_state: CodexAppState       // { activeActorId, activeTab }
_hookId: number              // updateActor hook ID, cleaned up on close
_settingsHookId: number      // clientSettingChanged hook ID, cleaned up on close
_abortController             // Aborts DOM listeners from the previous render
```

**Lifecycle:**

```
render()
  └─► _prepareContext()   // initRecord for player actors, build template data
  └─► Handlebars renders codex.html
  └─► _onRender()         // AbortController + panel activation + hooks
```

**_prepareContext** returns:
```ts
{
  actors: { id, record, actorRules }[]  // Sorted alphabetically by name
  isGM: boolean
  settings: CodexSettings
  globalRules: EpithetRule[]
}
```

Before building context, `_prepareContext` calls `initRecord` for every player-owned actor. `initRecord` is idempotent — it returns immediately when a flag already exists.

**Re-render strategy:**

An `updateActor` hook triggers a full `render()` when the active tab is not Settings. While the GM is on the Settings tab, actor updates patch only the affected actor's stats, journal, epithets, and sidebar entry — the settings panel is left untouched.

Settings mutations call `SettingsPanel.refresh()` to rebuild rule lists and sync system inputs without repainting the window. Cross-client settings sync uses the `clientSettingChanged` hook the same way.

DOM listeners from the previous render are removed via `AbortController.abort()` before attaching new ones. Settings actions use event delegation on the app root, so they survive partial DOM updates inside the settings panel.

### Panels (`src/ui/panels/`)

Each panel exposes a static `activate(root, signal, ...)` method. All writes go through `updateRecord` or `updateStats` in the data layer.

| Panel | Responsibility |
|---|---|
| `StatsPanel` | Inline stat editing, reset stats (keeps manual epithets) |
| `JournalPanel` | Create, edit, delete journal entries |
| `EpithetsPanel` | Add/remove manual epithets |
| `SettingsPanel` | HP path, attack flavor, epithet rule CRUD (GM only). `refresh()` rebuilds rule lists in place. |

### Dialogs (`src/ui/dialogs/`)

| Dialog | Purpose |
|---|---|
| `RuleEditorDialog` | Create/edit an `EpithetRule` with multi-condition support (`+ Add Condition`) |
| `JournalEntryDialog` | Create/edit a `JournalEntry` |

`RuleEditorDialog` currently uses hardcoded English strings — not yet wired to `lang/*.json`.

### Template (`templates/codex.html`)

Handlebars template. Uses `{{localize "CODEX.Key"}}` for all user-facing strings.

**Structure:**
```
.codex-layout
  ├── aside.codex-sidebar          # Actor list
  └── main.codex-main
      └── .codex-detail (per actor, hidden unless active)
          ├── nav.codex-tabs       # Tab navigation
          └── section.codex-panel (per tab)
              ├── [data-panel="stats"]
              ├── [data-panel="journal"]
              ├── [data-panel="epithets"]
              └── [data-panel="settings"] (GM only)
```

**Data flow:** template receives the object from `_prepareContext`. Actor-specific data is in `actors[n].record`. Global data (settings, globalRules, isGM) is at the root level, accessed via `@root` in nested `{{#each}}` blocks.

---

## Settings System

All Codex configuration is stored in a single `game.settings` key (`codexSettings`) as a JSON object. Registered with `config: false` to avoid polluting Foundry's native settings panel.

The settings object (`CodexSettings`) contains:
- `hpPath` — configures which actor field tracks HP
- `attackFlavor` — configures which chat messages count as attacks
- `rules` — the full list of `EpithetRule` objects

Settings are edited inside the Codex window (**Settings** tab, GM only), not in Foundry's native **Configure Settings** menu.

---

## Rule Engine

Epithet rules are evaluated by `RuleEngine` (`src/engine/RuleEngine.ts`) — a pure class with no Foundry dependencies. `ActorRecord.updateStats` calls `RuleEngine.apply` after merging stat changes.

**Evaluation logic:**

```
for each rule in getRules(actorId):
  if conditionMode === "all":
    epithet is earned if ALL conditions are true
  if conditionMode === "any":
    epithet is earned if AT LEAST ONE condition is true

Condition evaluation:
  value = stats[condition.stat]
  result = value [operator] condition.threshold
```

**Epithet reconciliation:**

After evaluation, the epithet list is rebuilt from scratch:
1. All **manual** epithets are preserved as-is (never auto-removed)
2. **Automatic** epithets are recalculated — only rules that currently evaluate to true produce an epithet
3. New automatic epithets (not in previous list) trigger a notification via `CODEX.NotifEpithet`

This means reducing a stat below a threshold removes the corresponding automatic epithet immediately.

**Rule scoping:**

- `scope: "global"` — applies to all actors
- `scope: "actor"` — applies only to the actor with matching `actorId`

`getRules(actorId)` returns global rules + actor-specific rules for that actor.

---

## Foundry VTT Integration

### Module Lifecycle

```
Hooks.once("init")
  └─► registerSettings()     // Must happen before "ready"

Hooks.once("ready")
  └─► registerHooks()        // Safe to access game.actors, game.settings

Hooks.on("renderSceneControls")
  └─► Injects the Codex button into the scene controls sidebar
```

### Flags

Actor data is stored as:
```
actor.flags.codex.record = ActorRecord
```

Accessed via:
```ts
actor.getFlag("codex", "record")   // read
actor.setFlag("codex", "record", data)  // write (async, triggers updateActor hook)
actor.unsetFlag("codex", "record")      // delete
```

**Important:** `setFlag` replaces the entire value — it does not deep-merge. Always spread the existing record before writing partial updates.

### ApplicationV2 vs Application

This module targets Foundry v13, which deprecated the legacy `Application` class in favor of `ApplicationV2` + `HandlebarsApplicationMixin`. Key differences:

| Legacy | v13 |
|---|---|
| `defaultOptions` | `DEFAULT_OPTIONS` |
| `getData()` | `_prepareContext()` |
| `activateListeners(html: JQuery)` | `_onRender(context, options): Promise<void>` |
| `this.element` is JQuery | `this.element` is `HTMLElement` |

### i18n

Most user-facing strings use `game.i18n.localize("CODEX.Key")` in TypeScript and `{{localize "CODEX.Key"}}` in Handlebars templates. String definitions live in `lang/en.json` and `lang/pt-BR.json`. Foundry selects the file automatically based on the user's language setting.

For strings with variables, use `game.i18n.format("CODEX.Key", { variable: value })`.

**Exception:** none as of 0.3.0 — rule editor strings are in `lang/*.json`.

---

## Build Pipeline

### Local Development

```bash
npm install
npm run build    # single build → dist/
npm run watch    # rebuild on file change → dist/
```

A symlink from `dist/` to `{FoundryData}/modules/codex/` enables live development: save a file, Vite rebuilds in ~25ms, F5 in the browser picks up changes.

### Vite Configuration

`vite.config.ts` builds `src/module.ts` as an ES module library and uses `vite-plugin-static-copy` to copy non-JS assets:

| Source | Destination in dist/ |
|---|---|
| `module.json` | `module.json` |
| `styles/codex.css` | `styles/codex.css` |
| `templates/codex.html` | `templates/codex.html` |
| `lang/en.json` | `lang/en.json` |
| `lang/pt-BR.json` | `lang/pt-BR.json` |

Output is a single `module.mjs` file with a `.map` sourcemap.

### Release Pipeline (GitHub Actions)

Defined in `.github/workflows/release.yml`. Triggered by pushing a version tag (`v*`).

**Steps:**
1. Checkout repository
2. `npm ci` — clean install from `package-lock.json`
3. `npm run build` — produces `dist/`
4. Inject tag version into `dist/module.json` via `jq`
5. Zip contents of `dist/` into `codex.zip`
6. Publish GitHub Release with `codex.zip` and `module.json` as assets

**To release:**
```bash
git tag v0.2.0
git push origin v0.2.0
```

The manifest URL for Foundry installation:
```
https://github.com/Riuchek/Codex/releases/latest/download/module.json
```

---

## Known Limitations

1. **Attack detection is heuristic** — relies on `message.flavor` containing a configurable string. Systems that don't include recognizable flavor text in attack messages will not have `damageDealt` or attack-roll criticals captured.

2. **`damageDealt` only captures weapon attacks** — spells, abilities, and other damage sources that don't match the attack flavor pattern are not counted.

3. **`getRecord` returns an empty default when no flag exists** — callers that need persisted data must call `initRecord` first (CodexApp does this in `_prepareContext`; hooks assume records exist for tracked actors).

---

## Improvement Roadmap

### Architecture
- [x] Split `CodexApp.ts` into panel modules (`StatsPanel`, `JournalPanel`, `EpithetsPanel`, `SettingsPanel`)
- [x] Extract `RuleEngine` as a pure class with no Foundry dependencies
- [x] Add `AbortController` to clean up DOM listeners between renders
- [x] Separate `getRecord` (pure read) from `initRecord` (explicit write)
- [x] Route all flag writes through `updateRecord` / `updateStats` (including `updateActor` hook)
- [x] Extract roll/dice logic into `rollUtils.ts`
- [x] Surface update queue failures via `ui.notifications.error`
- [x] SettingsPanel: refresh only the settings panel instead of full Codex re-render
- [x] Extract `UpdateQueue` into testable module

### Features
- [x] Rule editor: `+ Add Condition` button working inside the dialog
- [x] Rule editor: i18n for dialog strings
- [x] Rule editor: live preview of which actors currently match a rule
- [x] Journal: search/filter entries by tag
- [x] Journal: markdown rendering for entry content
- [x] Import/export Codex data as JSON
- [x] GM dashboard: all characters side by side for comparison

### Testing
- [x] Unit tests for `RuleEngine` (pure logic, no Foundry dependency)
- [x] Unit tests for `getNestedValue`
- [x] Unit tests for `UpdateQueue` serialization behavior

### Publishing
- [ ] Submit to the official Foundry VTT module repository
- [ ] Add Foundry Package ID to `module.json`
- [ ] Test on D&D 5e, Pathfinder 2e, and other major systems
