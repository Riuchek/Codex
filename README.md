# Codex - Campaign Grimoire for Foundry VTT

> "Every hero deserves to have their story told."

Codex is a Foundry VTT module for tracking the story your campaign leaves behind: combat statistics, earned epithets, and a free-form expedition journal for each adventurer.



## Features

### Combat Statistics

Codex keeps a lightweight record for every player-owned actor:

![Statistics tab](docs/screenshot-stats.png)

- **Damage Dealt**: counted from attack chat rolls.
- **Damage Taken**: counted when the actor's HP is reduced.
- **Critical Hits**: counted from maximum die results.
- **Critical Fails**: counted from natural 1 results.
- **Kill Count**: tracked manually, because not every kill happens inside Foundry.

Statistics can also be adjusted manually from the Codex window.

### Expedition Journal

![Journal tab](docs/screenshot-journal.png)

Each character has a free-form journal for session notes, discoveries, reminders, secrets, NPC details, or anything else worth preserving.

Journal entries include:

- **Title**: session number, in-game date, scene name, or any label that fits.
- **Content**: free text with no required format.
- **Tags**: built-in tags such as `combat`, `npc`, `secret`, and `reminder`, plus custom tags.

### Epithets

![Epithets tab](docs/screenshot-epithets.png)

Characters can earn epithets automatically by reaching statistic thresholds, or manually when the table wants to commemorate a memorable moment.

| Stat | Threshold | Epithet |
| --- | ---: | --- |
| Kill Count | 25 | Hothead |
| Kill Count | 50 | Assassin |
| Kill Count | 75 | Butcher |
| Kill Count | 100 | Bloodthirsty |
| Critical Hits | 10 | Lucky |
| Critical Hits | 25 | Blessed |
| Critical Hits | 50 | Wheel of Fortune |
| Critical Fails | 10 | Jammed |
| Critical Fails | 25 | Fumbler |
| Critical Fails | 50 | Atomized by the Dice |
| Damage Taken | 75 | Friend of Pain |
| Damage Taken | 250 | Damage Magnet |
| Damage Taken | 500 | Plot Armor |
| Damage Dealt | 100 | Hard Hitter |
| Damage Dealt | 250 | Sharp Blade |
| Damage Dealt | 500 | Avenger |
| Damage Dealt | 1000 | The Unstoppable |

Manual epithets are never removed automatically.

## System Support

Codex is designed to work across RPG systems. Open **Game Settings > Codex** to configure the paths and chat text used by your system.

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

### Foundry Module Browser

Search for **Codex** in Foundry's **Add-on Modules** browser if it is available in your module list.

### Manual Installation

1. In Foundry VTT, open **Add-on Modules**.
2. Click **Install Module**.
3. Paste this manifest URL:

```text
https://github.com/Riuchek/Codex/releases/latest/download/module.json
```

## Development

Install dependencies and build the distributable module:

```sh
npm install
npm run build
```

The built module files are generated in `dist/`.

## Compatibility

| Foundry Version | Status |
| --- | --- |
| v13 | Verified |
| v12 | Untested |
| v11 | Untested |

## Languages

- English
- Portuguese (Brazil)

## License

Codex is released under the [MIT License](LICENSE.md).

## Credits

Developed by **Riuchek** for Shadowdark RPG campaigns.

Typography uses [Cinzel](https://fonts.google.com/specimen/Cinzel) and [EB Garamond](https://fonts.google.com/specimen/EB+Garamond) from Google Fonts.

Texture from [Transparent Textures](https://www.transparenttextures.com/).