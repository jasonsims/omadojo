# AGENTS.md — working on Omadojo

Read this before changing anything. It explains what the app is, how it is built, what must not break, and how to check your work.

## What this is

Omadojo is a browser trainer for [Omarchy](https://omarchy.org) keyboard shortcuts. It shows a simulated Hyprland desktop; every shortcut the user presses really tiles, swaps, floats, groups or moves windows on it, and a coach panel prompts, scores and spaces repetitions.

- Static site: `index.html`, CSS in `styles/`, vanilla JS ES modules in `src/`. No framework, no build step, no runtime dependencies except the JetBrains Mono web font.
- Needs an HTTP server (ES modules don't load from `file://`). `npm run dev` serves it on http://127.0.0.1:8000. GitHub Pages deploys `main` via `.github/workflows/pages.yml`.
- Progress lives in `localStorage` under `omadojo.cfg` and `omadojo.prog`.

## Source of truth for shortcuts

Use the current Omarchy manual (Omarchy 4), not older Hyprland or Omarchy tutorials. Several bindings changed in v4 (e.g. `Super + L` toggles the scrolling layout; `Super + Ctrl + L` locks).

- Hotkeys: https://omarchy.org/manual/hotkeys/
- Navigation: https://omarchy.org/manual/navigation/

If you add or change a binding, cite which manual table it came from in your commit message.

## Architecture

The code is ES modules in four layers plus the view. Imports point one way, `lib → config → model → actions → coach state → input → view → coach engine → main`, and the graph has no cycles. Keep it that way.

```
src/
  main.js              DOM event wiring and boot; #debug hook
  lib/util.js          $, esc, store (localStorage), rnd, shuffle
  lib/keys.js          canon, keyName, keycap markup
  config.js            CFG, PROG, THEMES, setTheme, resetProgress
  model/desktop.js     S and its mutations, neighbor(), osd(), notify(), effects
  model/layout.js      tileRects, floatRect, nearest (pure geometry)
  model/apps.js        the fake app catalog
  actions/act.js       ACTS, BIND, act(), DECKS, runAction()
  actions/<deck>.js    basics, tiling, workspaces, groups, apps, system
  actions/index.js     registers the decks in cheat-sheet order; import ACTS/BIND from here
  actions/ensure.js    drill preconditions and prepare(), which the coach runs before each prompt
  actions/overlays.js  OV, PANELS, ovNav()
  coach/state.js       D, L, pick(), distractors()
  coach/lessons.js     LESSONS
  coach/engine.js      press(), after(), nextPrompt(), setMode(), startLesson()
  input/host.js        platform, stand-in choices, host.keylock, hostWarn()
  input/modifiers.js   held, mods(), prune()
  view/*.js            screen, coach, setup, theme, sound
styles/
  themes.css           color tokens and every Omarchy theme
  app.css              layout and components
```

1. **Desktop model** (`src/model/desktop.js`) — the state object `S`.
   - `S.ws` holds workspaces `1`–`4` and the scratchpad `S`. Each workspace has `slots` (tiled positions), `floats`, `focus`, `layout` (`dwindle` | `scrolling`), and per-split `flips` / `ratios`.
   - A **slot** is `{wins:[ids], active, grouped}`. A normal window is a one-window slot; a group is a slot with several windows and a tab strip. Do not model groups any other way.
   - `S.pinned` holds popped (sticky + floating) windows that show on every workspace.
   - Mutations go through small functions: `openApp`, `detach`, `closeWin`, `moveTo`, `toScratch`, `gotoWs`, `cycle`, `gstep`, `resize`. They never touch the DOM.
   - When the model needs the screen (an on-screen message, a re-render, a theme change) it calls `effects.osd`, `effects.render` or `effects.theme`. `main.js` wires these to the view at boot; under Node they do nothing, which is what lets the unit tests run the model and actions.
   - Window ids come from the module-level counter `NID` and are never reused (the renderer keys DOM nodes by id).

2. **Layout** (`src/model/layout.js`) — pure geometry, no DOM.
   - `tileRects(ws)` returns normalized (0–1) rectangles for the work area. Dwindle: each window takes `ratio` of the remaining rect, split along the longer side, inverted by `flips[i]`. Scrolling: a strip of columns with `ws.scroll` keeping focus in view.
   - `nearest(rects, id, rect, dir)` finds the nearest window in a direction. `neighbor(dir)` in the model calls it for the focused window; focus, swap, resize and move-into-group all use it. Fix direction bugs here, not in individual actions.
   - The aspect ratio of the work area comes from the view through `setAspect()`.

3. **Actions and keys** (`src/actions/`, `src/lib/keys.js`, `src/input/`)
   - Every shortcut is one `act(id, deck, keys, label, run, opts)` call. `opts` can include `ask` (drill prompt, string or function), `ensure` (sets up preconditions before a drill prompt), `os` (warning that the host OS may grab it) and `drill:false`.
   - That single table drives key handling (`BIND`), the Keys cheat sheet, the drill pool and tap-mode distractors. Add shortcuts by adding `act()` entries to the deck's file; do not special-case keys elsewhere. A new deck file must be imported from `actions/index.js`, and code outside `src/actions/` imports the table from `actions/index.js` so the decks are always registered.
   - Combos are canonical strings: modifiers in the order `super, ctrl, alt, shift`, then the key, e.g. `super+alt+shift+3`. Use `canon()` when writing them.
   - Keys are read from `event.code` (physical key), so Shift+1 is `1` and layouts don't matter.
   - Modifiers are tracked manually in `held` rather than trusting `event.metaKey` etc. This is what makes the **stand-in Super key** (`CFG.standin`) work. `prune()` drops stale modifiers using the event flags.

4. **Coach** (`src/coach/`)
   - `press(combo)` runs the action on the desktop, then calls `after(combo, action)`, which scores against the current Learn step or Drill/Blitz prompt.
   - **Drill**: `pick()` weights by mastery level 0–5 (`PROG[id].l`), `nextPrompt()` runs the item's `ensure()` so the prompt is always possible, `success()` / `miss()` update levels. Keys are hidden once known and revealed after a delay.
   - **Learn**: `LESSONS` is a scripted list of `{say, keys, note, pre}` steps.
   - **Blitz**: Drill with a 60 s timer, speed bonus and combo multiplier.
   - Drill preconditions use helpers `prep`, `trim`, `ensureTiled`, `ensureDir`, `ensureGroup`. Reuse them for new items.

**Rendering** (`src/view/`): `renderScreen()` reconciles window elements by id and sets left/top/width/height in px; CSS transitions provide the tiling animation. `renderCoach()` rebuilds the coach panel with `innerHTML`. Overlays (menus, panels, lock screen) render from the `OV` and `PANELS` tables.

**Theming**: colors are CSS custom properties. Dark-first (Tokyo Night) on bare `:root`, light (Flexoki Light) via `prefers-color-scheme` and `[data-theme]`, and explicit Omarchy themes via `:root[data-om="…"]`. Never use literal colors in component rules.

## Must not break

- **Stand-in Super key** and **Lock keys** (fullscreen + `navigator.keyboard.lock()`). Host operating systems grab Super combos; these are the only ways many users can practise.
- **Platform warnings**: on macOS, Cmd+W/Q close the browser; on Windows, Win+L locks the PC. Key setup opens on first visit, Learn/Drill show `hostWarn()`, and macOS gets a `beforeunload` guard. Keep all three.
- **Tap mode** for touch devices. Only a real Super combo may switch it back to keyboard.
- Light and dark themes, and every `data-om` theme.
- No horizontal scroll at 390px width.
- No network requests besides Google Fonts. No analytics.

## Checking your work

Set up once with `npm install && npx playwright install chromium`. Before committing:

1. `npm test` — unit tests (`node:test`, no extra dependencies):
   - `tests/unit/layout.test.js`: dwindle tiles the work area with no gaps or overlaps, splits follow the longer side, scrolling keeps focus visible, `neighbor()` picks the right window.
   - `tests/unit/drills.test.js`: every drill prompt changes the desktop after its `ensure()`. If you add a drill item, this test covers it automatically.
2. `npm run smoke` — Playwright plays all five lessons, 40 drill prompts and the stand-in Super key with real key events, checks for horizontal scroll at 390px, and fails on any page error.
3. `npm run dev` and open http://127.0.0.1:8000/#debug. The `#debug` hash exposes `window.__od` (state, `press`, `setMode`, `startLesson`, `lessonKey`, `D`, `L`) for poking at things.

CI runs 1 and 2 on every pull request and before every Pages deploy.

## Good next steps

- Import the user's own `~/.config/hypr/bindings.lua` so custom bindings appear in drills.
- An Omarchy shell plugin (Quickshell/QML, `panel` kind) that listens to real Hyprland events and coaches in place.

## Conventions

- No runtime dependencies and no build step. Dev dependencies stay minimal (Playwright for the smoke test).
- New modules go in the layer they belong to; don't import upward (the model never imports actions, coach or view).
- UI copy is plain and active ("Open a terminal", not "Terminal opening functionality").
- Fan project, not affiliated with Omarchy. Don't use Omarchy logos or wordmarks.
