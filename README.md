# Codex - Campaign Grimoire for Foundry VTT

> "Every hero deserves to have their story told."

Codex is a Foundry VTT module for tracking the story your campaign leaves behind: combat statistics, earned epithets, and a free-form expedition journal for each adventurer.

**Current version:** 0.2.0

## Using Codex

1. Open the **Scene Controls** sidebar (token/layer tools).
2. Click the **Codex** button (book icon).
3. Select a player-owned actor from the sidebar.
4. Switch between **Statistics**, **Journal**, and **Epithets** tabs.

GMs also see a **Settings** tab to configure system paths, attack detection, and epithet rules.

## Features

### Combat Statistics

Codex keeps a lightweight record for every player-owned actor:

![Statistics tab](docs/screenshot-stats.png)

- **Damage Dealt**: counted from attack chat rolls (second roll total when the message matches the configured attack flavor).
- **Damage Taken**: counted when the actor's HP is reduced.
- **Critical Hits**: natural 20 on attack rolls (d20); maximum result on the primary die for other rolls.
- **Critical Fails**: natural 1 on attack rolls (d20); natural 1 on the primary die for other rolls.
- **Kill Count**: tracked manually, because not every kill happens inside Foundry.

Statistics can also be adjusted manually from the Codex window. Resetting statistics removes automatic epithets but keeps manual ones.

### Expedition Journal

![Journal tab](docs/screenshot-journal.png)

Each character has a free-form journal for session notes, discoveries, reminders, secrets, NPC details, or anything else worth preserving.

Journal entries include:

- **Title**: session number, in-game date, scene name, or any label that fits.
- **Content**: free text with no required format.
- **Tags**: free-form comma-separated labels (e.g. `combat`, `npc`, `secret`).

### Epithets

![Epithets tab](docs/screenshot-epithets.png)

Characters can earn epithets automatically by reaching statistic thresholds, or manually when the table wants to commemorate a memorable moment.

Default automatic epithets ship with the module and are fully editable by the GM in the **Settings** tab. Thresholds per stat:

| Stat | Thresholds |
| --- | --- |
| Kill Count | 25, 50, 75, 100 |
| Critical Hits | 10, 25, 50 |
| Critical Fails | 10, 25, 50 |
| Damage Taken | 75, 250, 500 |
| Damage Dealt | 100, 250, 500, 1000 |

GMs can create, edit, and delete rules — including per-actor rules with multiple conditions (AND/OR). Manual epithets are never removed automatically.

## System Support

Codex is designed to work across RPG systems. Open the Codex window and go to the **Settings** tab (GM only) to configure the paths and chat text used by your system.

| Setting | Default | Description |
| --- | --- | --- |
| HP Path | `system.attributes.hp.value` | Path to the actor HP value in your system data. |
| Attack Chat Flavor | `attacking` | Text used to identify attack messages in chat. |

To inspect the HP structure for your current system, open the browser console with `F12` and run:

```js
game.actors.contents[0].system
```

Tested systems:

- Shadowdark RPG
- Dungeons & Dragons 5e, with **Attack Chat Flavor** set to `attack`

## Installation

### Manual Installation

1. In Foundry VTT, open **Add-on Modules**.
2. Click **Install Module**.
3. Paste this manifest URL:

```text
https://github.com/Riuchek/Codex/releases/latest/download/module.json
```

### Foundry Module Browser

Not yet listed in the official Foundry package repository. Use manual installation above.

## Development

Install dependencies and build the distributable module:

```sh
npm install
npm run build
```

For live rebuilds during development:

```sh
npm run watch
```

The built module files are generated in `dist/`. Symlink `dist/` to `{FoundryData}/modules/codex/` for local testing.

## Compatibility

| Foundry Version | Status |
| --- | --- |
| v13 | Verified |
| v12 | Untested |
| v11 | Minimum declared in manifest, untested |

## Languages

- English
- Portuguese (Brazil)

Note: the rule editor dialog currently uses hardcoded English strings. Full i18n coverage is on the roadmap.

## License

Codex is released under the [MIT License](LICENSE.md).

## Credits

Developed by **Riuchek** for Shadowdark RPG campaigns.

Typography uses [Cinzel](https://fonts.google.com/specimen/Cinzel) and [EB Garamond](https://fonts.google.com/specimen/EB+Garamond) from Google Fonts.

Texture from [Transparent Textures](https://www.transparenttextures.com/).
