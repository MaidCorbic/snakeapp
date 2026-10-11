# Snake Evolution

**Current version: V2.9.0 — HUD & Achievement Deck**

This pass refreshes the run-intel cards and Threat Scan, turns Advanced Achievements into an interactive flip-card archive with unlock filters, modernizes the Snake Build progression panel, and fixes transient state leaking into restarted runs.


A browser-based arcade snake survival game with Survival, Daily, Endless, and Party Run modes.

## Arcade Hub redesign (v1)

The additive redesign introduces a clearer landing-page hierarchy, a Player Center with direct links to existing profile/records, Daily Run, collection, and settings flows, and a consistent responsive visual system for the menu, HUD, abilities, and result dialog. It reuses existing gameplay APIs and local progression storage rather than creating a second game engine or conflicting save format.

### Existing systems

- Four game modes: Survival, Daily, Endless, and Party Run
- Energy/Core pickups, combo scoring, XP, upgrades, missions, contracts, mutations, and extraction
- Hazards, hunter variants, Warden boss encounters, and abilities
- Evolution cards, badges, achievements, local leaderboards, and ghost runs
- Keyboard, touch/swipe, pause/resume, reduced motion, and configurable HUD
- Playwright E2E coverage and a static validation script

## Development

- `node scripts/validate-game.cjs` — run the static game validator
- `npm run test:e2e` — run browser E2E tests (Playwright required)

The game is a static HTML/CSS/JavaScript application. Player records are stored locally in the current browser and are not synced to a server.


## Options and color customization

Options use a larger, cleaner text scale and hide redundant helper paragraphs. Snake Color supports preset swatches, a native color picker, and any valid `#RRGGBB` HEX value. The color previews in the arena immediately; SAVE validates and persists the chosen color to local browser storage for later runs.

## Stability and options cleanup

The options panel now has one authoritative snake-color editor: preset swatches, one HEX field, a native color input, live preview, format validation, and an explicit SAVE action. Previewing a color does not write it to browser storage; SAVE reports success or storage failure. The previous auto-saving duplicate picker is removed during the existing quality pass.

Gameplay tick recovery and pause/resume now clear the previous scheduled timeout before advancing the simulation and keep paused/dead runs from scheduling another tick. Regression coverage checks explicit HEX save behavior, invalid input, storage resilience, and pause/resume/restart behavior.

Run checks with `node scripts/validate-game.cjs`, `node scripts/stability-regression.cjs`, and `npm run test:e2e`.
