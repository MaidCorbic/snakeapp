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
  "ultimate-ui-v1.js",
  "arcade-hub-v1.js",
  "quality-gameplay-v1.js",
  "hud-achievement-deck-v2.js"
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
const qualityPassJs = read("quality-pass-v1.js");
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

check("HUD V2.9.0 and interactive achievement deck are wired",
  html.includes('V2.9.0') &&
  html.includes('hud-achievement-deck-v2.css?v=hud-deck-v2') &&
  !html.includes('hud-achievement-deck-v2.js?v=hud-deck-v2') &&
  menu.includes("loadAchievementDeck") &&
  menu.includes("hud-achievement-deck-v2.js?v=hud-deck-v4") &&
  read("hud-achievement-deck-v2.js").includes("achievement-back-copy") &&
  read("hud-achievement-deck-v2.css").includes("rotateY(180deg)") &&
  read("hud-achievement-deck-v2.css").includes("#achievementList .achievement-deck-card.is-flipped .achievement-card-inner"));
check("new runs clear carry-over chain, salvage and zone-event state",
  ultimate.includes('chainUntil=0;chainBest=0;salvageChain=0;salvageUntil=0;advancedZoneEvent=null;') &&
  read("tests/e2e/game.spec.cjs").includes("restarting a run clears temporary chain, salvage and zone-event state"));
check("arcade polish stylesheet exists", fs.existsSync(path.join(root, "arcade-polish-v1.css")));
check("ultimate UI assets are linked and grouped options are present", html.includes("ultimate-ui-v1.css?v=ultimate-ui-v2") && html.includes("ultimate-ui-v1.js?v=ultimate-ui-v7") && ultimateUiCss.includes(".option-group") && ultimateUiCss.includes(".ultimate-result-card") && /setAttribute\("role",\s*"dialog"\)/.test(ultimateUiJs));
check("release polish stylesheet is linked", html.includes('release-polish-v1.css?v=release-v1') && releasePolish.includes(":focus-visible"));
check("Endless is available from the landing menu", html.includes('id="bootEndless"') && !html.includes(".boot-actions #bootEndless{\n  display:none!important;") && !reworkCss.includes("body.rework-v2 .boot-actions #bootEndless{\n  display:none!important;"));
check("rework stylesheet exists", fs.existsSync(path.join(root, "snake-rework-v2.css")));
check("party run wiring exists", /bootFun/.test(html) && /mode === "party"/.test(menu) && /FUN_RUN_TIME/.test(game));
check("arcade polish loader is wired", /arcade-polish-v1\.js\?v=arcade-v3/.test(menu) && /snake-rework-v2\.js\?v=rework-v6/.test(menu));

check("run finalization is one-shot and best-score storage is guarded", game.includes("function finalizeRun(won,summary)") && game.includes("function saveBestScoreSafely()") && game.includes("runFinalized=false"));
check("Endless cycle respects the shared hazard cap", ultimate.includes("addHazards(3)") && !ultimate.includes("hazards.push(free())"));
check("advanced audio tolerates blocked local storage", ultimate.includes('try{if(localStorage.getItem("snake-evolution-sound")==="off")return}catch{}'));
check("timed achievement mode lookup tolerates blocked storage", metaProgression.includes('let storedMode="standard";try{storedMode=localStorage.getItem("snake-evolution-mode")||"standard"}catch{}'));
check("rework mode detection tolerates blocked local storage", rework.includes('const getMode = () => { try { return localStorage.getItem(PARTY_KEY) === "party" ? "party" : "standard"; } catch { return "standard"; } };'));
check("Party Run has an explicit isolated start API", ultimate.includes('function startParty(){prepareRun("party")}') && ultimate.includes("startParty,resetRank") && /mode === "party" \? "startParty"/.test(menu));
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
  "hud-achievement-deck-v2.css",
  "hud-achievement-deck-v2.js",
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

check("gameplay assets are defined once in an ordered manifest", menu.includes("const GAMEPLAY_SCRIPT_LAYERS = Object.freeze([") &&
  menu.includes("game.js?v=arcade-v28") &&
  menu.includes("ultimate-gameplay-v1.js?v=ultimate-v16") &&
  menu.includes("gameplay-update-v2.js?v=update-v15") &&
  menu.includes("snake-rework-v2.js?v=rework-v6") &&
  menu.includes("quality-gameplay-v1.js?v=quality-v3") &&
  html.includes("meta-progression-v1.js?v=meta-v4") &&
  menu.indexOf('id: "snakeGameplayUpdateV2"') < menu.indexOf('id: "snakeQualityGameplayScript"'));

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

check("one authoritative HEX editor supports validation, live preview, and explicit save",
  html.includes('id="snakeHexInput"') && html.includes('id="snakeColorSave"') &&
  qualityPassJs.includes('function ensureColorControls()') &&
  qualityPassJs.includes('function setupSnakeColorControls(controls)') &&
  qualityPassJs.includes('snake-evolution-color-preview') &&
  qualityPassJs.includes('SAVE blocked') &&
  !qualityPassJs.includes('function applySnakeColor') &&
  read("tests/e2e/game.spec.cjs").includes("Options use one HEX editor and only save color on explicit SAVE"));
check("color control keeps one editor and normalizes the original duplicate markup",
  (html.match(/id="snakeHexInput"/g) || []).length === 1 &&
  (html.match(/id="snakeColorSave"/g) || []).length === 1 &&
  qualityPassJs.includes('panel.querySelectorAll(".snake-custom-color, #seCustomSnakeColor")') &&
  qualityPassJs.includes('legacyGroup.replaceWith(group)') &&
  qualityPassJs.includes('localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))'));
check("Options and action hierarchy use readable labels, descriptions, and a dedicated danger zone", html.includes("TIMED ACHIEVEMENTS") && menu.includes('GAME_VERSION = "2.9.0"') && menu.includes("settings.homeClock);") && menu.includes("window.confirm(") && read("quality-pass-v1.js").includes("02 / SNAKE APPEARANCE") && read("arcade-menu-v2.css").includes("option-danger-zone") && ultimateUiCss.includes("option-row > div:first-child small") && ultimateUiCss.includes("font-size:clamp(12px,1vw,14px)"));
check("browser regression covers single HEX editor preview, explicit persistence, and invalid input", read("tests/e2e/game.spec.cjs").includes("Options use one HEX editor and only save color on explicit SAVE") && read("tests/e2e/game.spec.cjs").includes("snakeHexInput") && read("tests/e2e/game.spec.cjs").includes("SAVED: #1A2B3C"));
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


check("gameplay tick scheduling has one explicit owner and a bounded error recovery path",
  /tickSchedulerOwner="core"/.test(game) &&
  /function\s+scheduleCoreTick\(/.test(game) &&
  /setTickSchedulerOwner\("external"\)/.test(update) &&
  /MAX_CONSECUTIVE_TICK_ERRORS = 3/.test(update) &&
  /coreTickSchedules/.test(update));
check("leaderboard data is validated and rendered without HTML interpolation",
  /function\s+readLeaderboardRecords\(/.test(ultimate) &&
  /replaceChildren\(\)/.test(ultimate) &&
  !/el\.innerHTML=list\.length\?list\.map/.test(ultimate));
check("browser regressions cover scheduler ownership, repeated tick faults and corrupt leaderboard data",
  /one scheduler owns ticks through pause, resume and restart/.test(read("tests/e2e/game.spec.cjs")) &&
  /repeated gameplay tick failures pause the game/.test(read("tests/e2e/game.spec.cjs")) &&
  /corrupted local leaderboard records are filtered/.test(read("tests/e2e/game.spec.cjs")));

check("CI workflow invokes the same validator",
  /node\s+scripts\/validate-game\.cjs/.test(read(".github/workflows/ci.yml")));

process.stdout.write("\nAll Snake Evolution CI validation checks passed.\n");
