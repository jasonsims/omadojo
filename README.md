# Omadojo

Muscle memory for [Omarchy](https://omarchy.org). A static web trainer with a simulated Hyprland desktop where every shortcut really tiles, swaps, floats, groups and moves windows across workspaces.

## Modes

- **Learn** — five guided lessons that follow the Omarchy manual's Navigation chapter.
- **Drill** — spaced repetition across six decks (Essentials, Tiling, Workspaces, Groups, Apps, Clipboard/style/system). Keys hide once you know them.
- **Blitz** — 60-second scored round with a combo multiplier.
- **Free** — sandbox with no prompts.
- **Keys** — searchable cheat sheet with your mastery level per shortcut.

Phones get a tap-to-answer recall quiz instead of key input.

## Getting Super to reach the page

Operating systems usually grab Super combos before a web page sees them (on Omarchy, Hyprland acts on them for real).

- **Lock keys** puts the page in fullscreen and calls `navigator.keyboard.lock()`. In Chromium-based browsers on Wayland this uses the keyboard-shortcuts-inhibit protocol, which Hyprland supports. Hold Esc to leave.
- **Key setup → stand-in key** makes Caps Lock, Right Ctrl, or any key you pick act as Super while held.

## Run it

No build step, but it needs a local server because the scripts are ES modules:

```sh
npm run dev        # http://127.0.0.1:8000
```

Any static server works too (`python -m http.server 8000`).

## Test it

```sh
npm install
npx playwright install chromium
npm test           # unit tests: layout geometry and every drill prompt
npm run smoke      # browser smoke test: lessons, drills, stand-in key, phone width
```

## Deploy it

Pushes to `main` run the tests and deploy to GitHub Pages (`.github/workflows/pages.yml`). Set Settings → Pages → Source to **GitHub Actions** once.

## Source of truth

Bindings follow the Omarchy manual (Omarchy 4):
[Hotkeys](https://omarchy.org/manual/hotkeys/) · [Navigation](https://omarchy.org/manual/navigation/).
The desktop is a simplified simulation of Hyprland's dwindle and scrolling layouts.

## Ideas

- Omarchy shell plugin (Quickshell/QML) that watches real Hyprland events and coaches you in place.
- Read the user's own `~/.config/hypr/bindings.lua` so custom bindings show up in drills.

Fan project, not affiliated with Omarchy.
