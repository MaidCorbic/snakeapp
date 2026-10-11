# Snake Evolution

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

- `npm test` — run the static game validator
- `npm run test:e2e` — run browser E2E tests (Playwright required)

The game is a static HTML/CSS/JavaScript application. Player records are stored locally in the current browser and are not synced to a server.
