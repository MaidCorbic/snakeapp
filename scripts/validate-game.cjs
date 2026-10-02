"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  assert.ok(fs.existsSync(fullPath), "Required file missing: " + relativePath);
  return fs.readFileSync(fullPath, "utf8");
}
function check(name, condition) {
  assert.ok(condition, "Validation failed: " + name);
  process.stdout.write("PASS  " + name + "\n");
}

const game = read("game.js");
const menu = read("menu.js");
const ultimate = read("ultimate-gameplay-v1.js");
const updateV2 = read("gameplay-update-v2.js");
const html = read("index.html");
const css = read("style.css");

for (const [file, source] of [
  ["game.js", game],
  ["menu.js", menu],
  ["ultimate-gameplay-v1.js", ultimate],
  ["gameplay-update-v2.js", updateV2]
]) {
  new vm.Script(source, { filename: file });
  process.stdout.write("PASS  JavaScript syntax: " + file + "\n");
}
new vm.Script(read("scripts/validate-game.cjs"), { filename: "scripts/validate-game.cjs" });

const htmlIds = new Set([...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(match => match[1]));
const requiredIds = [
  "bootMenu", "bootStart", "bootHow", "bootOptions", "bootDaily", "bootEndless",
  "bootGrid", "bootVibration", "bootMotion", "bootSound", "bootError",
  "app", "game", "start", "score", "combo", "time", "best", "zone", "evo",
  "lives", "xp", "xpFill", "mutation", "mutationLabel", "condition", "conditionLabel",
  "danger", "dangerFill", "objective", "objectiveFill", "contract", "contractFill",
  "contractAccept", "contractDecline", "chainFill", "salvage", "extractStatus",
  "extractionPanel", "extractCashOut", "extractContinue", "dash", "dashFill",
  "shield", "shieldFill", "pulse", "pulseFill", "fury", "furyFill",
  "missionList", "upgradeList", "upgradeData", "achievementList",
  "runMode", "evoPerk", "maxThreat", "bounty", "bountyLabel", "perfectLabel",
  "leaderboardList", "dailyLeaderboardList", "pauseBtn", "nearMiss"
];
const missingIds = requiredIds.filter(id => !htmlIds.has(id));
check("required HTML controls and HUD ids", missingIds.length === 0 && (missingIds.length ? missingIds.join(", ") : true));

check("boot menu loads base game", /script\.src\s*=\s*["']game\.js\?v=/.test(menu));
check("boot menu loads ultimate layer after base game", /script\.onload\s*=\s*\(\)\s*=>\s*\{[\s\S]*?ultimate\.src\s*=\s*["']ultimate-gameplay-v1\.js\?v=/.test(menu));
check("boot menu loads update pack after ultimate layer", /ultimate\.onload\s*=\s*\(\)\s*=>\s*\{[\s\S]*?update\.src\s*=\s*["']gameplay-update-v2\.js\?v=/.test(menu));
check("menu guards duplicate/in-progress loads", /if\s*\(gameLoaded\)/.test(menu) && /if\s*\(gameLoading\)\s*return/.test(menu));
check("boot failure does not start a partial game", /ultimate\.onload\s*=\s*\(\)\s*=>\s*\{\s*if\s*\(bootFailed\)\s*return;/.test(menu));
check("HTML references the current menu cache key", /menu\.js\?v=boot-v15/.test(html));
check("menu asset versions are current", /game\.js\?v=survival-v9/.test(menu) && /ultimate-gameplay-v1\.js\?v=ultimate-v3/.test(menu) && /gameplay-update-v2\.js\?v=update-v4/.test(menu));
check("main game exposes the start API", /window\.SnakeEvolution\s*=/.test(game));
check("permanent upgrades have a purchase handler", /function\s+buyUpgrade\s*\(/.test(game) && /data-upgrade/.test(game));
check("mission persistence is guarded and render-throttled", /const\s+saveMissions\s*=\s*m\s*=>\s*\{\s*try\s*\{\s*localStorage\.setItem/.test(game) && /now\s*-\s*missionRenderAt\s*>=\s*500/.test(game) && /if\s*\(\s*done\.length\s*\)\s*saveMissions\(m\)/.test(game));
check("nonfatal collisions restart the gameplay timer", /if\s*\(\s*alive\s*&&\s*!paused\s*\)\s*timer\s*=\s*setTimeout\(move/.test(game));
check("ultimate layer prevents duplicate base HUD redraw", /window\.__snakeUltimateLayerActive\s*=\s*true/.test(ultimate) && /if\s*\(\s*!window\.__snakeUltimateLayerActive\s*\)\s*\{\s*hud\(\);\s*draw\(\)\s*\}/.test(game));
check("arena collisions continue the timer when survivable", /if\s*\(\s*alive\s*&&\s*!paused\s*&&\s*!contractOfferOpen\s*&&\s*!extractionOpen\s*\)\s*timer\s*=\s*setTimeout\(move/.test(ultimate));
check("loot chain is registered once per energy pickup", /if\s*\(\s*stats\.energy\s*>\s*before\.energy\s*\)\s*\{\s*registerAdvancedLoot\(\)\s*\}/.test(ultimate));
check("daily and endless entry points exist", /function\s+startDaily\s*\(/.test(ultimate) && /function\s+startEndless\s*\(/.test(ultimate) && /enableDailyRng/.test(ultimate));
check("restart preserves selected mode while menu Start remains standard", /reset=function\(\)\{prepareRun\(activeMode\)\}/.test(ultimate) && /start:\(\)=>prepareRun\("standard"\)/.test(ultimate));
check("elite Charger and Watcher behaviors exist", /h\.type\s*===\s*["']elite["']&&h\.variant\s*===\s*["']charger["']/.test(ultimate) && /h\.type\s*===\s*["']elite["']&&h\.variant\s*===\s*["']watcher["']/.test(ultimate));
check("risk contracts, extraction and progression hooks exist", /function\s+acceptContract\s*\(/.test(game) && /function\s+cashOut\s*\(/.test(game) && /function\s+buyUpgrade\s*\(/.test(game));
check("procedural arena, telegraphs, shrine and secret zone exist", /function\s+generateArena\s*\(/.test(ultimate) && /function\s+addTelegraph\s*\(/.test(ultimate) && /function\s+spawnRiskShrine\s*\(/.test(ultimate) && /function\s+spawnSecretPortal\s*\(/.test(ultimate));
check("combo finisher, perfect run, ghost and local leaderboard exist", /CHAIN FINISHER/.test(ultimate) && /PERFECT x1\.25/.test(ultimate) && /function\s+saveGhost\s*\(/.test(ultimate) && /function\s+saveLeaderboard\s*\(/.test(ultimate));
check("mobile touch controls retain touch-action support", /data-dir=["']up["']/.test(html) && /canvas\s*\{\s*touch-action\s*:\s*none/s.test(css));
check("update pack includes pause, visibility pause, checkpoints and near-miss", /pauseControl\?\.addEventListener/.test(updateV2) && /visibilitychange/.test(updateV2) && /ZONE CHECKPOINT/.test(updateV2) && /function checkNearMiss/.test(updateV2));
check("gameplay update recovers the tick timer after callback errors", /function moveWithV2Recovery/.test(updateV2) && /finally[\s\S]*?timer = setTimeout\(move, delay\)/.test(updateV2));
check("landing screen has a mission briefing and responsive action groups", /class="boot-layout"/.test(html) && /class="boot-brief"/.test(html) && /class="[^"]*boot-primary/.test(html) && /\.boot-layout\s*\{grid-template-columns:1fr/s.test(css));
check("redundant duplicate run telemetry row is removed", [...html.matchAll(/id="runMode"/g)].length === 1 && [...html.matchAll(/id="evoPerk"/g)].length === 1 && [...html.matchAll(/id="maxThreat"/g)].length === 1);
check("energy pickup respawns on a distinct unoccupied non-arena tile", /function safeEnergyRespawnU/.test(ultimate) && /cellBlockedU\(p,previous\)/.test(ultimate) && /if\(stats\.energy>before\.energy\)energy=safeEnergyRespawnU\(consumedEnergy\)/.test(ultimate));
check("energy surge rewards every tenth collected green cell", /energyPickupCount % 10 === 0/.test(updateV2) && /ENERGY SURGE/.test(updateV2) && /gainXp\(25\)/.test(updateV2) && /chargeFury\(8\)/.test(updateV2));
check("landing page copy remains readable at desktop and compact widths", /\.brief-item div small\{font-size:6px;line-height:1\.9\}/.test(css) && /\.brief-item div small\{font-size:5px;line-height:1\.8\}/.test(css));

check("CI validates this regression script and update module", fs.existsSync(path.join(root, ".github/workflows/ci.yml")) && /node scripts\/validate-game\.cjs/.test(read(".github/workflows/ci.yml")) && /node --check gameplay-update-v2\.js/.test(read(".github/workflows/ci.yml")));

process.stdout.write("\nAll Snake Evolution regression checks passed.\n");
