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
  "snake-rework-v2.js",
  "ultimate-ui-v1.js"
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
const releasePolish = read("release-polish-v1.css");
const metaProgression = read("meta-progression-v1.js");
const rework = read("snake-rework-v2.js");
const reworkCss = read("snake-rework-v2.css");
const ultimateUiCss = read("ultimate-ui-v1.css");
const ultimateUiJs = read("ultimate-ui-v1.js");
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
check("ultimate UI assets are linked and grouped options are present", html.includes("ultimate-ui-v1.css?v=ultimate-ui-v1") && html.includes("ultimate-ui-v1.js?v=ultimate-ui-v1") && ultimateUiCss.includes(".option-group") && ultimateUiCss.includes(".ultimate-result-card") && /setAttribute\("role",\s*"dialog"\)/.test(ultimateUiJs));
check("release polish stylesheet is linked", html.includes('release-polish-v1.css?v=release-v1') && releasePolish.includes(":focus-visible"));
check("Endless is available from the landing menu", html.includes('id="bootEndless"') && !html.includes(".boot-actions #bootEndless{\n  display:none!important;") && !reworkCss.includes("body.rework-v2 .boot-actions #bootEndless{\n  display:none!important;"));
check("rework stylesheet exists", fs.existsSync(path.join(root, "snake-rework-v2.css")));
check("party run wiring exists", /bootFun/.test(html) && /mode === "party"/.test(menu) && /FUN_RUN_TIME/.test(game));
check("arcade polish loader is wired", /arcade-polish-v1\.js\?v=arcade-v2/.test(menu) && /snake-rework-v2\.js\?v=rework-v5/.test(menu));

check("run finalization is one-shot and best-score storage is guarded", game.includes("function finalizeRun(won,summary)") && game.includes("function saveBestScoreSafely()") && game.includes("runFinalized=false"));
check("Endless cycle respects the shared hazard cap", ultimate.includes("addHazards(3)") && !ultimate.includes("hazards.push(free())"));
check("advanced audio tolerates blocked local storage", ultimate.includes('try{if(localStorage.getItem("snake-evolution-sound")==="off")return}catch{}'));
check("timed achievement mode lookup tolerates blocked storage", metaProgression.includes('let storedMode="standard";try{storedMode=localStorage.getItem("snake-evolution-mode")||"standard"}catch{}'));
check("rework mode detection tolerates blocked local storage", rework.includes('const getMode = () => { try { return localStorage.getItem(PARTY_KEY) === "party" ? "party" : "standard"; } catch { return "standard"; } };'));
check("Party Run has an explicit isolated start API", ultimate.includes('function startParty(){prepareRun("party")}') && ultimate.includes("startParty,resetRank") && menu.includes('else if (mode === "party") window.SnakeEvolution?.startParty?.();'));
check("Party Run excludes the contradictory One Chance condition", ultimate.includes('conditionDefs.filter(condition=>condition[0]!=="ONE CHANCE")'));
check("Party Run preserves extra lives under One Chance", ultimate.includes('if(runCondition?.[0]==="ONE CHANCE"&&!funMode)lives=1;'));
check("required project files exist", [
  "index.html",
  "release-polish-v1.css",
  "style.css",
  "game.js",
  "menu.js",
  "ultimate-gameplay-v1.js",
  "gameplay-update-v2.js",
  "scripts/validate-game.cjs",
  "ultimate-ui-v1.js",
  "ultimate-ui-v1.css",
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

check("menu loads cache-busted gameplay layers", menu.includes("game.js?v=survival-v24") &&
  menu.includes("ultimate-gameplay-v1.js?v=ultimate-v11") &&
  menu.includes("gameplay-update-v2.js?v=update-v10") &&
  menu.includes("snake-rework-v2.js?v=rework-v5") &&
  html.includes("meta-progression-v1.js?v=meta-v4"));

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
  /finalizeRun\(false/.test(game) &&
  /finalizeRun\(true/.test(game));

check("gameplay balance tuning limits arena pressure",
  /const BALANCE=\{hazardSpawnEvery:40,hazardCap:8,hunterWaveEvery:96,hunterCap:5,bossSpawnEvery:180,zoneEventEvery:240,hazardStormBase:2,hunterSwarmCap:5\}/.test(game) &&
  /spawnClock%BALANCE\.hazardSpawnEvery/.test(game) &&
  /eventClock%BALANCE\.hunterWaveEvery/.test(game) &&
  /eventClock%BALANCE\.bossSpawnEvery/.test(game) &&
  /eventClock2%BALANCE\.zoneEventEvery/.test(game) &&
  /window\.__snakeBalanceProfile=Object\.freeze\(\{\.\.\.BALANCE\}\)/.test(game) &&
  /function\s+addHazards\(count=1\)/.test(game) &&
  (game.match(/hazards\.push\(free\(\)\)/g) || []).length === 1);

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

check("browser regression covers modes and storage resilience", read("tests/e2e/game.spec.cjs").includes("Daily and Endless launch buttons are visible") && read("tests/e2e/game.spec.cjs").includes("blocked browser storage") && read("tests/e2e/game.spec.cjs").includes("narrow viewport keeps the game"));
check("browser regression covers live gameplay settings",
  /gameplay display and combat-effect settings affect the live game/.test(read("tests/e2e/game.spec.cjs")));

check("CI workflow invokes the same validator",
  /node\s+scripts\/validate-game\.cjs/.test(read(".github/workflows/ci.yml")));

process.stdout.write("\nAll Snake Evolution CI validation checks passed.\n");
