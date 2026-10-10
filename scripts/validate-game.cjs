"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function read(file) {
  const full = path.join(root, file);
  assert.ok(fs.existsSync(full), "Required file missing: " + file);
  return fs.readFileSync(full, "utf8");
}

function check(name, condition) {
  assert.ok(condition, "Validation failed: " + name);
  process.stdout.write("PASS  " + name + "\n");
}

const files = [
  "game.js",
  "menu.js",
  "ultimate-gameplay-v1.js",
  "gameplay-update-v2.js",
  "arcade-polish-v1.js",
  "snake-rework-v2.js"
];

for (const file of files) {
  const source = read(file);
  new vm.Script(source, { filename: file });
  process.stdout.write("PASS  JavaScript syntax: " + file + "\n");
}

const html = read("index.html");
const css = read("style.css");
const game = read("game.js");
const menu = read("menu.js");
const ultimate = read("ultimate-gameplay-v1.js");
const update = read("gameplay-update-v2.js");

const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(m => m[1]);
const idSet = new Set(ids);
const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);

const requiredIds = [
  "bootMenu", "bootStart", "bootHow", "bootOptions",
  "app", "game", "start", "score", "combo", "time", "best",
  "zone", "evo", "lives", "xp", "xpFill", "mutation",
  "mutationLabel", "condition", "conditionLabel", "danger",
  "dangerFill", "objective", "objectiveFill", "contract",
  "contractFill", "contractAccept", "contractDecline",
  "chainFill", "salvage", "extractStatus", "extractionPanel",
  "extractCashOut", "extractContinue", "dash", "dashFill",
  "shield", "shieldFill", "pulse", "pulseFill", "fury",
  "furyFill", "missionList", "upgradeList", "achievementList",
  "runMode", "evoPerk", "maxThreat", "bounty", "perfectLabel",
  "leaderboardList", "dailyLeaderboardList", "pauseBtn",
  "nearMiss", "encounterStatus", "ghostStatus"
];

check("arcade polish stylesheet exists", fs.existsSync(path.join(root, "arcade-polish-v1.css")));
check("rework stylesheet exists", fs.existsSync(path.join(root, "snake-rework-v2.css")));
check("party run wiring exists", /bootFun/.test(html) && /mode === "party"/.test(menu) && /FUN_RUN_TIME/.test(game));
check("arcade polish loader is wired", /arcade-polish-v1\.js\?v=arcade-v2/.test(menu) && /snake-rework-v2\.js\?v=rework-v4/.test(menu));

check("required project files exist", [
  "index.html",
  "style.css",
  "game.js",
  "menu.js",
  "ultimate-gameplay-v1.js",
  "gameplay-update-v2.js",
  "scripts/validate-game.cjs",
  ".github/workflows/ci.yml"
].every(file => fs.existsSync(path.join(root, file))));

check("required HUD and menu ids exist", requiredIds.every(id => idSet.has(id)));
check("HTML contains no duplicate ids", duplicateIds.length === 0);

const localScripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
  .map(m => m[1].split("?")[0])
  .filter(src => !/^(https?:)?\/\//.test(src) && !src.startsWith("//"));

for (const src of localScripts) {
  const clean = src.replace(/^\.\//, "");
  check("HTML script exists: " + clean, fs.existsSync(path.join(root, clean)));
}

check("menu loads cache-busted gameplay layers", /game\.js\?v=survival-v23/.test(menu) &&
  /ultimate-gameplay-v1\.js\?v=/.test(menu) &&
  /gameplay-update-v2\.js\?v=/.test(menu));

check("pause control has one authoritative click handler", !/pauseBtn\?\.addEventListener\("click"/.test(game) && /pauseControl\?\.addEventListener\("click"/.test(update));

check("menu reloads stale partial game script before reinjecting", /document\.getElementById\("snakeGameScript"\)/.test(menu) && /window\.location\.reload\(\)/.test(menu));

check("menu prevents duplicate/in-progress game loads",
  /if\s*\(gameLoaded\)/.test(menu) &&
  /if\s*\(gameLoading\)\s*return/.test(menu));

check("boot failure stops partial startup",
  /if\s*\(bootFailed\)\s*return/.test(menu));

check("main game exposes its public start API", /window\.SnakeEvolution\s*=/.test(game));
check("restart and start paths exist",
  /start\.onclick/.test(game) &&
  /function\s+reset\s*\(/.test(game));

check("core gameplay systems exist",
  /function\s+move\s*\(/.test(game) &&
  /function\s+hud\s*\(/.test(game) &&
  /function\s+draw\s*\(/.test(game) &&
  /function\s+end\s*\(/.test(game) &&
  /function\s+win\s*\(/.test(game));

check("progression and mission systems exist",
  /function\s+buyUpgrade\s*\(/.test(game) &&
  /missionList/.test(game) &&
  /function\s+missionCheck\s*\(/.test(game));

check("risk contracts and extraction hooks exist",
  /function\s+acceptContract\s*\(/.test(game) &&
  /function\s+cashOut\s*\(/.test(game) &&
  /extractionOpen/.test(game));

check("ultimate gameplay layer is wired",
  /window\.__snakeUltimateLayerActive\s*=\s*true/.test(ultimate) &&
  /function\s+startDaily\s*\(/.test(ultimate) &&
  /function\s+startEndless\s*\(/.test(ultimate));

check("advanced gameplay systems are present",
  /spawnEncounterU/.test(ultimate) &&
  /saveGhost/.test(ultimate) &&
  /saveLeaderboard/.test(ultimate) &&
  /spawnEvolutionCardU/.test(ultimate));

check("gameplay update layer is wired",
  /pauseControl/.test(update) &&
  /visibilitychange/.test(update) &&
  /function\s+checkNearMiss/.test(update));

check("mobile controls keep touch-action and pointer input",
  /touch-action\s*:\s*none/.test(css) &&
  /pointerdown/.test(game) &&
  /touchstart/.test(game));

check("HUD and game-over presentation hooks exist",
  /run-intel/.test(html) &&
  /run-mode-bar/.test(html) &&
  /#message/.test(css) &&
  /#runStats\s*\{display:none!important\}/.test(css));

check("game-over results use the centered message flow",
  /function\s+showRunResult\s*\(/.test(game) &&
  /showRunResult\(false/.test(game) &&
  /showRunResult\(true/.test(game));

check("gameplay balance tuning limits arena pressure",
  /const BALANCE=\{hazardSpawnEvery:40,hazardCap:8,hunterWaveEvery:96,hunterCap:5,bossSpawnEvery:180,zoneEventEvery:240,hazardStormBase:2,hunterSwarmCap:5\}/.test(game) &&
  /spawnClock%BALANCE\.hazardSpawnEvery/.test(game) &&
  /eventClock%BALANCE\.hunterWaveEvery/.test(game) &&
  /eventClock%BALANCE\.bossSpawnEvery/.test(game) &&
  /eventClock2%BALANCE\.zoneEventEvery/.test(game));

check("gameplay visibility settings are applied to live UI",
  /function\s+applyGameplaySettings\s*\(/.test(game) &&
  /showTimer/.test(game) &&
  /showXp/.test(game) &&
  /showIntel/.test(game) &&
  /showMissions/.test(game) &&
  /showAbilities/.test(game) &&
  /touchControls/.test(game) &&
  /combatFx/.test(game));

check("setting visibility and combat-effect styles are defined",
  /\.setting-disabled\s*\{\s*display:none!important\s*\}/.test(css) &&
  /\.no-combat-fx\s+\.event-banner/.test(css));

check("browser regression covers live gameplay settings",
  /gameplay display and combat-effect settings affect the live game/.test(read("tests/e2e/game.spec.cjs")));

check("CI workflow invokes the same validator",
  /node\s+scripts\/validate-game\.cjs/.test(read(".github/workflows/ci.yml")));

process.stdout.write("\nAll Snake Evolution CI validation checks passed.\n");
