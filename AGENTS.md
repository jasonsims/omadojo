# AGENTS.md — working on Omadojo

Read this before changing anything. It explains what the app is, how it is built, what must not break, and how to check your work.

## What this is

Omadojo is a browser trainer for [Omarchy](https://omarchy.org) keyboard shortcuts. It shows a simulated Hyprland desktop; every shortcut the user presses really tiles, swaps, floats, groups or moves windows on it, and a coach panel prompts, scores and spaces repetitions.

- Single file: `index.html` (HTML + CSS + vanilla JS). No framework, no build step, no runtime dependencies except the JetBrains Mono web font.
- Runs from `file://` or any static host (GitHub Pages).
- Progress lives in `localStorage` under `omadojo.cfg` and `omadojo.prog`.

## Source of truth for shortcuts

Use the current Omarchy manual (Omarchy 4), not older Hyprland or Omarchy tutorials. Several bindings changed in v4 (e.g. `Super + L` toggles the scrolling layout; `Super + Ctrl + L` locks).

- Hotkeys: https://omarchy.org/manual/hotkeys/
- Navigation: https://omarchy.org/manual/navigation/

If you add or change a binding, cite which manual table it came from in your commit message.

## Architecture

The script is one IIFE in four layers. Each layer only calls the one below it.

1. **Desktop model** — the state object `S`.
   - `S.ws` holds workspaces `1`–`4` and the scratchpad `S`. Each workspace has `slots` (tiled positions), `floats`, `focus`, `layout` (`dwindle` | `scrolling`), and per-split `flips` / `ratios`.
   - A **slot** is `{wins:[ids], active, grouped}`. A normal window is a one-window slot; a group is a slot with several windows and a tab strip. Do not model groups any other way.
   - `S.pinned` holds popped (sticky + floating) windows that show on every workspace.
   - Mutations go through small functions: `openApp`, `detach`, `closeWin`, `moveTo`, `toScratch`, `gotoWs`, `cycle`, `gstep`, `resize`. They never touch the DOM.
   - Window ids come from the module-level counter `NID` and are never reused (the renderer keys DOM nodes by id).

2. **Layout** — pure geometry, no DOM.
   - `tileRects(ws)` returns normalized (0–1) rectangles for the work area. Dwindle: each window takes `ratio` of the remaining rect, split along the longer side, inverted by `flips[i]`. Scrolling: a strip of columns with `ws.scroll` keeping focus in view.
   - `neighbor(dir)` finds the nearest window in a direction from those rectangles. Focus, swap, resize and move-into-group all use it. Fix direction bugs here, not in individual actions.

3. **Actions and keys**
   - Every shortcut is one `act(id, deck, keys, label, run, opts)` call. `opts` can include `ask` (drill prompt, string or function), `ensure` (sets up preconditions before a drill prompt), `os` (warning that the host OS may grab it) and `drill:false`.
   - That single table drives key handling (`BIND`), the Keys cheat sheet, the drill pool and tap-mode distractors. Add shortcuts by adding `act()` entries; do not special-case keys elsewhere.
   - Combos are canonical strings: modifiers in the order `super, ctrl, alt, shift`, then the key, e.g. `super+alt+shift+3`. Use `canon()` when writing them.
   - Keys are read from `event.code` (physical key), so Shift+1 is `1` and layouts don't matter.
   - Modifiers are tracked manually in `held` rather than trusting `event.metaKey` etc. This is what makes the **stand-in Super key** (`CFG.standin`) work. `prune()` drops stale modifiers using the event flags.

4. **Coach**
   - `press(combo)` runs the action on the desktop, then calls `after(combo, action)`, which scores against the current Learn step or Drill/Blitz prompt.
   - **Drill**: `pick()` weights by mastery level 0–5 (`PROG[id].l`), `nextPrompt()` runs the item's `ensure()` so the prompt is always possible, `success()` / `miss()` update levels. Keys are hidden once known and revealed after a delay.
   - **Learn**: `LESSONS` is a scripted list of `{say, keys, note, pre}` steps.
   - **Blitz**: Drill with a 60 s timer, speed bonus and combo multiplier.
   - Drill preconditions use helpers `prep`, `trim`, `ensureTiled`, `ensureDir`, `ensureGroup`. Reuse them for new items.

**Rendering**: `renderScreen()` reconciles window elements by id and sets left/top/width/height in px; CSS transitions provide the tiling animation. `renderCoach()` rebuilds the coach panel with `innerHTML`. Overlays (menus, panels, lock screen) render from the `OV` and `PANELS` tables.

**Theming**: colors are CSS custom properties. Dark-first (Tokyo Night) on bare `:root`, light (Flexoki Light) via `prefers-color-scheme` and `[data-theme]`, and explicit Omarchy themes via `:root[data-om="…"]`. Never use literal colors in component rules.

## Must not break

- **Stand-in Super key** and **Lock keys** (fullscreen + `navigator.keyboard.lock()`). Host operating systems grab Super combos; these are the only ways many users can practise.
- **Platform warnings**: on macOS, Cmd+W/Q close the browser; on Windows, Win+L locks the PC. Key setup opens on first visit, Learn/Drill show `hostWarn()`, and macOS gets a `beforeunload` guard. Keep all three.
- **Tap mode** for touch devices. Only a real Super combo may switch it back to keyboard.
- Light and dark themes, and every `data-om` theme.
- No horizontal scroll at 390px width.
- No network requests besides Google Fonts. No analytics.

## Checking your work

There are no unit tests yet. Before committing:

1. `node -e "new Function(require('fs').readFileSync('index.html','utf8').split('<script>')[1].split('</script>')[0])"` — the script must parse.
2. Run the smoke test: `npm i -D playwright && npx playwright install chromium && node tests/smoke.js`. It plays all five lessons and 40 drill prompts with real key events and fails on any page error.
3. Open `index.html#debug` in a browser. The `#debug` hash exposes `window.__od` (state, `press`, `setMode`, `startLesson`, `lessonKey`, `D`, `L`) for poking at things.

## Good next steps

- Split `index.html` into ES modules (`model`, `layout`, `actions`, `coach`, `view`) without changing behavior; keep a no-build option.
- Unit tests for `tileRects`, `neighbor`, and every `ensure()` (each drill prompt must be achievable after its `ensure`).
- Import the user's own `~/.config/hypr/bindings.lua` so custom bindings appear in drills.
- An Omarchy shell plugin (Quickshell/QML, `panel` kind) that listens to real Hyprland events and coaches in place.

## Conventions

- Keep it one dependency-free file until the module split is done deliberately.
- UI copy is plain and active ("Open a terminal", not "Terminal opening functionality").
- Fan project, not affiliated with Omarchy. Don't use Omarchy logos or wordmarks.
