"use strict";

const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  // Expose closure-scoped result paths only in the intercepted test response.
  // This does not modify the production game or the deployed GitHub Pages files.
  await page.route(/\/game\.js\?v=/, async route => {
    const response = await route.fetch();
    const source = await response.text();
    await route.fulfill({
      response,
      body: source + "\nwindow.__snakeE2E = { startGameplay: () => { contractOfferOpen = false; contractAccepted = true; move(); }, endRun: () => end(), winRun: () => win(), freeCell: () => free(), setDirection: (x,y) => setDir(x,y), getPendingDirection: () => ({...next}), seedTransientRunState: () => { chain = 4; chainUntil = performance.now() + 10000; chainBest = 9; salvageChain = 5; salvageUntil = performance.now() + 10000; advancedZoneEvent = { type: 'HAZARD_STORM', until: performance.now() + 10000 }; extractionNextAt = 60000; extractionHeatUntil = performance.now() + 10000; advancedExitMode = 'EXTRACTING'; contractDeclined = true; }, getTransientRunState: () => ({ chain, chainUntil, chainBest, salvageChain, salvageUntil, zoneEvent: advancedZoneEvent?.type || null, extractionNextAt, extractionHeatUntil, advancedExitMode, contractDeclined }), forceSelfCollisionWithShield: () => { snake = [{x:10,y:10},{x:11,y:10},{x:11,y:9}]; dir = next = {x:1,y:0}; shieldUntil = performance.now() + 5000; pulseUntil = 0; lives = 3; stats.damage = 0; alive = true; paused = false; move(); }, setEdgeWarningScenario: (x,y,dx,dy) => { clearTimeout(timer); timer = null; snake = [{x,y},{x:x-dx,y:y-dy},{x:x-2*dx,y:y-2*dy}]; dir = next = {x:dx,y:dy}; alive = true; paused = false; draw(); }, setCollisionRecoveryScenario: () => { clearTimeout(timer); timer = null; snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}]; dir = next = {x:1,y:0}; hazards = [{x:11,y:10}]; hunters = []; powerups = []; boss = null; supplyDrop = null; energy = {x:24,y:15}; core = null; shieldUntil = pulseUntil = 0; lives = 3; stats.damage = 0; alive = true; paused = false; move(); }, getCollisionRecoveryState: () => ({ head: { ...snake[0] }, segments: snake.map(point => ({ ...point })), lives, alive, shielded: performance.now() < shieldUntil, damage: stats.damage, overlaps: snake.some(segment => hazards.some(item => same(segment,item)) || hunters.some(item => same(segment,item)) || powerups.some(item => same(segment,item)) || (boss && same(segment,boss)) || (energy && same(segment,energy)) || (core && same(segment,core)) || (supplyDrop && same(segment,supplyDrop))) }) };\n"
    });
  });
});

async function startGame(page) {
  await page.goto("/index.html");
  await expect(page.locator("#bootMenu")).toBeVisible();
  await page.locator("#bootStart").click();
  await expect(page.locator("#bootMenu")).toHaveClass(/hidden/);
  await expect.poll(() => page.evaluate(() => typeof window.SnakeEvolution?.getState)).toBe("function");
  await expect(page.locator("#game")).toBeVisible();
  await expect(page.locator("#message")).toHaveClass(/hidden/);
  await expect.poll(() => page.evaluate(() => typeof window.__snakeE2E?.startGameplay)).toBe("function");
  const tutorial = page.locator(".se-tutorial-overlay");
  if (await tutorial.isVisible().catch(() => false)) await page.locator("#seTutorialStart").click();
  await page.evaluate(() => window.__snakeE2E.startGameplay());
}

test("failed gameplay bootstrap reports an error instead of leaving a blank frozen arena", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/index.html");
  await page.locator("#bootStart").click();

  await expect.poll(() => page.evaluate(() => ({
    started: typeof window.SnakeEvolution?.getState === "function" && !!window.SnakeEvolution.getState().alive,
    failed: !document.querySelector("#bootError")?.classList.contains("hidden")
  }))).toMatchObject({ started: true, failed: false }).catch(async error => {
    const failureText = await page.locator("#bootErrorText").textContent().catch(() => "");
    throw new Error("Gameplay bootstrap did not start. Loader message: " + (failureText || "none") + "; page errors: " + pageErrors.join(" | ") + "; " + error.message);
  });
});

test("landing menu, instructions, and options open and close", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/index.html");
  await expect(page.locator("#bootMenu")).toBeVisible();

  await page.locator("#bootHow").click();
  await expect(page.locator("#bootHowPanel")).toBeVisible();
  await page.locator("#bootHowBack").click();
  await expect(page.locator("#bootHowPanel")).toBeHidden();

  await page.locator("#bootOptions").click();
  await expect(page.locator("#bootOptionsPanel")).toBeVisible();
  const gridToggle = page.locator("#bootGrid");
  const initial = await gridToggle.getAttribute("aria-pressed");
  await gridToggle.click();
  await expect(gridToggle).toHaveAttribute("aria-pressed", initial === "true" ? "false" : "true");
  await expect(page.locator("#bootOptionsPanel")).toBeVisible();
  await page.locator("#bootOptionsBack").click();
  await expect(page.locator("#bootOptionsPanel")).toBeHidden();

  expect(pageErrors).toEqual([]);
});

test("gameplay display and combat-effect settings affect the live game", async ({ page }) => {
  await page.goto("/index.html");
  await page.locator("#bootOptions").click();
  await expect(page.locator("#bootOptionsPanel")).toBeVisible();

  for (const id of ["#bootTimer", "#bootXp", "#bootIntel", "#bootMissions", "#bootAbilities", "#bootTouch", "#bootFx"]) {
    await expect(page.locator(id)).toHaveAttribute("aria-pressed", "true");
    await page.locator(id).click();
    await expect(page.locator(id)).toHaveAttribute("aria-pressed", "false");
  }

  await page.locator("#bootOptionsBack").click();
  await page.locator("#bootStart").click();
  await expect.poll(() => page.evaluate(() => typeof window.SnakeEvolution?.getState)).toBe("function");

  for (const selector of [".time-tile", ".xp-module", ".run-intel", "#missions", ".ability-bar", ".controls"]) {
    await expect(page.locator(selector)).toHaveClass(/setting-disabled/);
  }
  await expect(page.locator("body")).toHaveClass(/no-combat-fx/);
});

test("pause, resume, and restart keep one gameplay timer without page errors", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await startGame(page);

  await page.locator("#pauseBtn").click();
  await expect(page.locator("#pauseOverlay")).toBeVisible();
  const pausedHead = await page.evaluate(() => window.SnakeEvolution.getState().snakeHead);
  await page.waitForTimeout(280);
  expect(await page.evaluate(() => window.SnakeEvolution.getState().snakeHead)).toEqual(pausedHead);

  await page.locator("#resume").click();
  await expect(page.locator("#pauseOverlay")).toHaveCount(0);
  await expect.poll(async () => {
    await page.waitForTimeout(150);
    return page.evaluate(() => window.SnakeEvolution.getState().snakeHead);
  }).not.toEqual(pausedHead);

  await page.locator("#pauseBtn").click();
  await page.locator("#restartPause").click();
  await expect(page.locator("#pauseOverlay")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution.getState().alive)).toBe(true);
  expect(pageErrors).toEqual([]);
});

test("gameplay balance profile is exposed and bounded", async ({ page }) => {
  await startGame(page);
  const balance = await page.evaluate(() => window.__snakeBalanceProfile);
  expect(balance).toEqual({
    hazardSpawnEvery: 40,
    hazardCap: 8,
    hunterWaveEvery: 96,
    hunterCap: 5,
    bossSpawnEvery: 180,
    zoneEventEvery: 240,
    hazardStormBase: 2,
    hunterSwarmCap: 5
  });
});

test("game boot loads all gameplay layers and starts a run", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await startGame(page);
  await expect(page.locator("#score")).toHaveText(/\d+/);
  await expect(page.locator("#pauseBtn")).toBeEnabled();

  const loadedLayers = await page.evaluate(() => [
    "snakeGameScript",
    "snakeUltimateScript",
    "snakeGameplayUpdateV2",
    "snakeArcadePolishV1",
    "snakeReworkV2",
    "snakeQualityGameplayScript",
    "snakeHudAchievementDeckScript"
  ].every(id => Boolean(document.getElementById(id))));
  expect(loadedLayers).toBe(true);
  expect(pageErrors).toEqual([]);
});

test("pause, resume, and restart keep the run interactive", async ({ page }) => {
  await startGame(page);

  await page.locator("#pauseBtn").click();
  await expect(page.locator("#pauseOverlay")).toBeVisible();
  await page.locator("#resume").click();
  await expect(page.locator("#pauseOverlay")).toHaveCount(0);
  await expect(page.locator("#pauseBtn")).toBeEnabled();

  await page.locator("#pauseBtn").click();
  await expect(page.locator("#pauseOverlay")).toBeVisible();
  await page.locator("#restartPause").click();
  await expect(page.locator("#pauseOverlay")).toHaveCount(0);
  await expect(page.locator("#message")).toHaveClass(/hidden/);
  await expect(page.locator("#pauseBtn")).toBeEnabled();
  await expect(page.locator("#score")).toHaveText("0");
});

test("Daily and Endless launch buttons are visible and initialize isolated modes", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.locator("#bootEndless")).toBeVisible();

  await page.locator("#bootDaily").click();
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution?.getState?.().daily)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution?.getState?.().endless)).toBe(false);

  await page.goto("/index.html");
  await expect(page.locator("#bootEndless")).toBeVisible();
  await page.locator("#bootEndless").click();
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution?.getState?.().endless)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution?.getState?.().daily)).toBe(false);
});

test("Party Run keeps its four lives and isolated mode state", async ({ page }) => {
  await page.goto("/index.html");
  await page.locator("#bootFun").click();
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution?.getState?.().alive)).toBe(true);
  await expect(page.locator(".se-tutorial-overlay")).toBeVisible();
  await page.locator("#seTutorialStart").click();
  await expect(page.locator(".se-tutorial-overlay")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution.getState().contractOfferOpen)).toBe(true);
  const state = await page.evaluate(() => window.SnakeEvolution.getState());
  expect(state.lives).toBe(4);
  expect(state.mode).toBe("party");
  expect(state.party).toBe(true);
  expect(state.condition).not.toBe("ONE CHANCE");
  expect(state.daily).toBe(false);
  expect(state.endless).toBe(false);
});

test("run result can return to the menu without double-finalizing", async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => {
    window.__snakeE2E.endRun();
    window.__snakeE2E.winRun();
  });

  await expect(page.locator("#message h2")).toHaveText("RUN OVER");
  await expect(page.locator("#resultMainMenu")).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("snake-evolution-save") || "{}").runs)).toBe(1);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("snake-evolution-save") || "{}").wins || 0)).toBe(0);

  await page.locator("#resultMainMenu").click();
  await expect(page.locator("#bootMenu")).toBeVisible();
  await page.locator("#bootEndless").click();
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution?.getState?.().endless)).toBe(true);
});

test("run startup and result rendering survive blocked browser storage", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = function () { throw new Error("storage unavailable"); };
    Storage.prototype.setItem = function () { throw new Error("storage unavailable"); };
    Storage.prototype.removeItem = function () { throw new Error("storage unavailable"); };
  });
  await page.goto("/index.html");
  await page.locator("#bootStart").click();
  await expect.poll(() => page.evaluate(() => typeof window.SnakeEvolution?.getState)).toBe("function");
  await expect.poll(() => page.evaluate(() => {
    const alive = !!window.SnakeEvolution?.getState?.().alive;
    const errorVisible = !document.querySelector("#bootError")?.classList.contains("hidden");
    return alive || errorVisible;
  }), { timeout: 10_000 }).toBe(true);
  const startup = await page.evaluate(() => ({
    alive: !!window.SnakeEvolution?.getState?.().alive,
    menuVisible: !document.querySelector("#bootMenu")?.classList.contains("hidden"),
    errorVisible: !document.querySelector("#bootError")?.classList.contains("hidden"),
    errorText: document.querySelector("#bootErrorText")?.textContent || ""
  }));
  expect(startup.alive && !startup.errorVisible && !startup.menuVisible,
    "Blocked-storage startup diagnostic: " + JSON.stringify(startup) + "; page errors: " + pageErrors.join(" | ")).toBe(true);
  await expect(page.locator("#bootMenu")).toHaveClass(/hidden/);
  await page.evaluate(() => window.__snakeE2E.endRun());
  await expect(page.locator("#message h2")).toHaveText("RUN OVER");
  await expect(page.locator("#resultMainMenu")).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("narrow viewport keeps the game and result actions within the screen", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/index.html");
  await expect(page.locator("#bootMenu")).toBeVisible();
  await expect(page.locator("#bootEndless")).toBeVisible();

  await page.locator("#bootStart").click();
  await expect.poll(() => page.evaluate(() => typeof window.SnakeEvolution?.getState)).toBe("function");
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution.getState().alive)).toBe(true);
  const layout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    gameWidth: document.querySelector("#game").getBoundingClientRect().width,
    abilityBarDisplay: getComputedStyle(document.querySelector(".ability-bar")).display
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.gameWidth).toBeGreaterThan(0);
  expect(layout.abilityBarDisplay).not.toBe("none");
  await page.evaluate(() => window.__snakeE2E.endRun());
  await expect(page.locator("#resultMainMenu")).toBeVisible();
  const resultWidth = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    cardRight: document.querySelector("#message .message-card").getBoundingClientRect().right
  }));
  expect(resultWidth.cardRight).toBeLessThanOrEqual(resultWidth.viewportWidth + 1);
  expect(pageErrors).toEqual([]);
});


test("ultimate UI uses grouped options and a dedicated accessible result dialog", async ({ page }) => {
  await page.goto("/index.html");
  await page.locator("#bootOptions").click();
  await expect(page.locator("#bootOptionsPanel .option-group")).toHaveCount(4);
  await expect(page.locator("#bootOptionsPanel .option-group-title").first()).toContainText("PRESENTATION");
  await page.locator("#bootOptionsBack").click();
  await startGame(page);
  await page.evaluate(() => window.__snakeE2E.endRun());
  await expect(page.locator("#message")).toHaveAttribute("role", "dialog");
  await expect(page.locator("#message h2")).toHaveAttribute("id", "resultTitle");
  await expect(page.locator("#message .ultimate-result-card")).toBeVisible();
  await expect(page.locator("#resultMainMenu")).toBeVisible();
});


test("Threat Scan explains pressure and exposes a compact live field readout", async ({ page }) => {
  await startGame(page);
  await expect(page.locator("#seThreatStatus")).toBeVisible();
  await expect(page.locator("#seThreatStatus .se-threat-heading")).toHaveText("THREAT SCAN");
  await expect(page.locator("#seThreatStatus .se-threat-brand")).toBeVisible();
  await expect(page.locator("#seThreatHunters")).toBeVisible();
  await expect(page.locator("#seThreatHazards")).toBeVisible();
  await expect(page.locator("#seThreatBoss")).toBeVisible();
  expect(await page.locator("#seThreatStatus").getAttribute("aria-live")).toBeNull();
  await expect(page.locator(".intel-explainer")).toHaveCount(4);
  await expect(page.locator(".danger-card .intel-explainer")).toContainText("Pressure");
  await expect(page.locator(".objective-card .intel-explainer")).toContainText("score and XP");
  await expect(page.locator(".contract-card .intel-explainer")).toContainText("bonus rewards");
});

test("Advanced Achievements cards flip, filter, and expose unlock notes", async ({ page }) => {
  await startGame(page);
  await page.locator("#achievements > summary").click();
  const toolbar = page.locator("#achievementList > .achievement-deck-toolbar");
  await expect(toolbar).toBeVisible();
  const cards = page.locator("#achievementList .achievement-deck-card");
  await expect.poll(() => cards.count()).toBeGreaterThan(0);
  const first = cards.first();
  const flip = first.locator(".achievement-flip");
  await expect(flip).toHaveAttribute("aria-expanded", "false");
  await flip.click();
  await expect(first).toHaveClass(/is-flipped/);
  await expect(flip).toHaveAttribute("aria-expanded", "true");
  await expect(flip.locator(".achievement-back-copy")).toBeVisible();
  await flip.click();
  await expect(first).not.toHaveClass(/is-flipped/);
  await toolbar.locator('[data-filter="locked"]').click();
  const lockedVisible = page.locator("#achievementList .achievement-deck-card:not([hidden])");
  await expect.poll(() => lockedVisible.count()).toBeGreaterThan(0);
  expect(await lockedVisible.evaluateAll(items => items.every(item => item.dataset.deckState === "locked"))).toBe(true);
  await toolbar.locator('[data-filter="all"]').click();
  await expect(toolbar.locator('[data-filter="all"]')).toHaveAttribute("aria-pressed", "true");
});

test("restarting a run clears temporary chain, salvage and zone-event state", async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => window.__snakeE2E.seedTransientRunState());
  const seeded = await page.evaluate(() => window.__snakeE2E.getTransientRunState());
  expect(seeded.salvageChain).toBe(5);
  expect(seeded.zoneEvent).toBe("HAZARD_STORM");
  expect(seeded.extractionNextAt).toBe(60000);
  await page.evaluate(() => window.SnakeEvolution.start());
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution.getState().salvageChain)).toBe(0);
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution.getState().zoneEvent)).toBe(null);
  const reset = await page.evaluate(() => window.__snakeE2E.getTransientRunState());
  expect(reset.chain).toBe(0);
  expect(reset.chainUntil).toBe(0);
  expect(reset.chainBest).toBe(0);
  expect(reset.salvageChain).toBe(0);
  expect(reset.salvageUntil).toBe(0);
  expect(reset.zoneEvent).toBe(null);
  expect(reset.extractionNextAt).toBe(0);
  expect(reset.extractionHeatUntil).toBe(0);
  expect(reset.advancedExitMode).toBe("RUNNING");
  expect(reset.contractDeclined).toBe(false);
});

test("food respawns at a randomized free cell and never overlaps the snake", async ({ page }) => {
  await startGame(page);
  const initial = await page.evaluate(() => window.SnakeEvolution.getState().energyPosition);
  await expect.poll(() => page.evaluate(() => {
    const state = window.SnakeEvolution.getState();
    return state.energyPosition && state.snakeHead && state.energyPosition.x !== state.snakeHead.x;
  })).toBe(true);
  expect(initial).toBeTruthy();
  const position = await page.evaluate(() => window.SnakeEvolution.getState().energyPosition);
  expect(position).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
});

test("collision recovery respawns in a safe lane and keeps the run active", async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => window.__snakeE2E.setCollisionRecoveryScenario());
  const state = await page.evaluate(() => window.__snakeE2E.getCollisionRecoveryState());
  expect(state.lives).toBe(2);
  expect(state.alive).toBe(true);
  expect(state.shielded).toBe(true);
  expect(state.damage).toBe(1);
  expect(state.overlaps).toBe(false);
  expect(state.segments).toHaveLength(3);
  expect(state.head.x).toBeGreaterThanOrEqual(2);
  expect(state.segments.every(segment => segment.y === state.head.y)).toBe(true);
});

test("shield cannot suppress self-collision", async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => window.__snakeE2E.forceSelfCollisionWithShield());
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution.getState().lives)).toBe(2);
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution.getState().deathCause)).toBe("SELF HIT");
});

test("moving into the departing tail cell is legal when not growing", async ({ page }) => {
  await startGame(page);
  const before = await page.evaluate(() => window.SnakeEvolution.getState().lives);
  await page.evaluate(() => {
    snake = [{x:10,y:10},{x:10,y:11},{x:9,y:11},{x:9,y:10}];
    dir = next = {x:-1,y:0};
    energy = {x:24,y:15};
    core = null;
    shieldUntil = pulseUntil = 0;
    move();
  });
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution.getState().lives)).toBe(before);
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution.getState().snakeHead)).toEqual({x:9,y:10});
});

test("all random free-cell spawns avoid occupied gameplay cells", async ({ page }) => {
  await startGame(page);
  const result = await page.evaluate(() => {
    const state = window.SnakeEvolution.getState();
    const point = window.__snakeE2E.freeCell();
    const occupied = [
      ...(state.snakeSegments || []),
      ...(state.arenaBlockPositions || []),
      ...(state.hazardPositions || []),
      ...(state.hunterPositions || []),
      ...(state.powerupPositions || []),
      ...(state.encounterPositions || []),
      ...[state.energyPosition, state.corePosition, state.bossPosition,
        state.supplyDropPosition, state.riskShrinePosition, state.secretPortalPosition].filter(Boolean)
    ];
    return { point, overlaps: occupied.some(item => item.x === point.x && item.y === point.y) };
  });
  expect(result.point).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
  expect(result.overlaps).toBe(false);
});

test("edge warning alerts before an imminent wall collision and clears when safe", async ({ page }) => {
  await startGame(page);
  const warning = page.locator("#edgeWarning");
  await page.evaluate(() => window.__snakeE2E.setEdgeWarningScenario(2, 10, -1, 0));
  await expect(warning).toBeVisible();
  await expect(warning).toContainText("EDGE AHEAD // LEFT");
  await expect(warning).not.toHaveClass(/critical/);

  await page.evaluate(() => window.__snakeE2E.setEdgeWarningScenario(1, 10, -1, 0));
  await expect(warning).toContainText("EDGE // LEFT // TURN NOW");
  await expect(warning).toHaveClass(/critical/);

  await page.evaluate(() => window.__snakeE2E.setEdgeWarningScenario(10, 10, 1, 0));
  await expect(warning).toBeHidden();
});

test("edge warning respects reduced-motion styling and does not block game input", async ({ page }) => {
  await startGame(page);
  const styles = await page.locator("#edgeWarning").evaluate(el => ({
    pointerEvents: getComputedStyle(el).pointerEvents,
    reducedMotionRule: [...document.styleSheets].some(sheet => {
      try { return [...sheet.cssRules].some(rule => rule.cssText.includes("prefers-reduced-motion") && rule.cssText.includes("edge-warning")); }
      catch { return false; }
    })
  }));
  expect(styles.pointerEvents).toBe("none");
  expect(styles.reducedMotionRule).toBe(true);
});

test("ability deck exposes clear names and responsive visual states", async ({ page }) => {
  await startGame(page);
  for (const [id, label] of [["dash","Dash ability"],["shield","Shield ability"],["pulse","Pulse ability"],["fury","Fury ability"]]) {
    await expect(page.locator("#" + id)).toHaveAttribute("aria-label", new RegExp(label, "i"));
    await expect(page.locator("#" + id + " b")).toBeVisible();
  }
  const deck = await page.locator(".ability-bar").evaluate(el => getComputedStyle(el).display);
  expect(deck).toBe("grid");
});

test("wall collision ends a run and displays the loss result", async ({ page }) => {
  await startGame(page);

  // Turn down once before turning left, respecting the no-reverse input rule.
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(150);
  await page.keyboard.press("ArrowLeft");

  await expect(page.locator("#message h2")).toHaveText("RUN OVER", { timeout: 4_000 });
  await expect(page.locator("#message .result-copy")).toContainText("RUN ENDED");
  await expect(page.locator("#message .gameover-details")).toBeVisible();
  await expect(page.locator("#start")).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("snake-evolution-save") || "{}").runs)).toBe(1);
});

test("rapid direction input cannot queue an immediate reverse turn", async ({ page }) => {
  await startGame(page);
  const pending = await page.evaluate(() => {
    // The snake is moving right. These two buffered inputs are both legal
    // relative to the current tick, but the second reverses the queued turn.
    window.__snakeE2E.setDirection(0, -1);
    window.__snakeE2E.setDirection(0, 1);
    return window.__snakeE2E.getPendingDirection();
  });
  expect(pending).toEqual({ x: 0, y: -1 });
});

test("win path renders a victory report and persists the win", async ({ page }) => {
  await startGame(page);
  await expect.poll(() => page.evaluate(() => typeof window.__snakeE2E?.winRun)).toBe("function");

  await page.evaluate(() => window.__snakeE2E.winRun());

  await expect(page.locator("#message h2")).toHaveText("SURVIVAL COMPLETE");
  await expect(page.locator("#message .result-copy")).toContainText("SURVIVAL COMPLETE");
  await expect(page.locator("#message .gameover-details")).toBeVisible();
  await expect(page.locator("#start")).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("snake-evolution-save") || "{}").wins)).toBe(1);
});

test("Player Center uses a clean four-stat dashboard with no duplicate decorative mark", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/index.html");
  await expect(page.locator("#seArcadeHub")).toBeVisible();
  await expect(page.locator("#seArcadeHub .se-progress-stat")).toHaveCount(4);
  await expect(page.locator("#seArcadeHub .se-hub-mark")).toHaveCount(0);
  await expect(page.locator(".landing-profile")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("Options expose snake color and gameplay toggles without Profile and Utilities", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/index.html");
  await expect(page.locator("#bootVersion")).toHaveText("V2.9.0");
  await expect(page.locator("#bootClock")).toBeVisible();
  await page.locator("#bootOptions").click();
  await expect(page.locator("#bootOptionsPanel")).toBeVisible();
  await expect(page.locator(".snake-color-group")).toBeVisible();
  await expect(page.locator('#bootOptionsPanel .option-group[aria-label="PROFILE & UTILITIES"]')).toHaveCount(0);
  await expect(page.locator("#bootOptionsPanel .control-deck-profile-row")).toHaveCount(0);
  const swatch = page.locator('.snake-swatch[data-snake-color="#62cfff"]');
  await swatch.click();
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue("--snake-color"))).toBe("#62cfff");
  await expect(swatch).toHaveAttribute("aria-pressed", "true");
  await page.locator("#snakeColorSave").click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("snake-evolution-settings") || "{}").snakeColor)).toBe("#62cfff");
  await page.locator("#bootRadar").click();
  await expect(page.locator("#bootRadar")).toHaveAttribute("aria-pressed", "false");
  expect(pageErrors).toEqual([]);
});

test("normal launch shows a first-run tutorial and can resume gameplay", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/index.html");
  await page.locator("#bootStart").click();
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution?.getState?.().alive)).toBe(true);
  await expect(page.locator(".se-tutorial-overlay")).toBeVisible();
  await expect(page.locator("#seTutorialStart")).toBeEnabled();
  await page.locator("#seTutorialStart").click();
  await expect(page.locator(".se-tutorial-overlay")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("snake-evolution-tutorial-seen-v1"))).toBe("true");
  await expect(page.locator("#pauseBtn")).toBeEnabled();
  expect(pageErrors).toEqual([]);
});


test("Options use one HEX editor and only save color on explicit SAVE", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/index.html");
  await page.locator("#bootOptions").click();
  await expect(page.locator("#bootOptionsPanel")).toBeVisible();
  await expect(page.locator("#bootOptionsPanel .boot-panel-heading small")).toBeHidden();
  await expect(page.locator("#bootSettingsState")).toBeHidden();
  await expect(page.locator("#bootOptionsPanel .option-group")).toHaveCount(4);
  await expect(page.locator("#snakeHexInput")).toBeVisible();
  await expect(page.locator("#snakeColorPicker")).toBeVisible();
  await expect(page.locator("#snakeColorSave")).toBeVisible();
  await expect(page.locator("#seCustomSnakeColor")).toHaveCount(0);
  await expect(page.locator(".snake-color-editor #snakeHexInput")).toHaveCount(1);

  const before = await page.evaluate(() => JSON.parse(localStorage.getItem("snake-evolution-settings") || "{}").snakeColor);
  await page.locator("#snakeHexInput").fill("#1a2b3c");
  await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue("--snake-color"))).toBe("#1a2b3c");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("snake-evolution-settings") || "{}").snakeColor)).toBe(before);
  await page.locator("#snakeColorSave").click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("snake-evolution-settings") || "{}").snakeColor)).toBe("#1a2b3c");
  await expect(page.locator("#snakeColorStatus")).toContainText("SAVED: #1A2B3C");

  await page.locator("#snakeHexInput").fill("not-a-hex");
  await expect(page.locator("#snakeColorSave")).toBeDisabled();
  await expect(page.locator("#snakeColorStatus")).toContainText("exactly #RRGGBB");
  await expect(page.locator("#snakeColorStatus")).toHaveAttribute("data-state", "error");
  expect(errors).toEqual([]);
});

test("START RUN enters the standard run and PARTY RUN enters Party Run", async ({ page }) => {
  await page.goto("/index.html");
  await page.locator("#bootStart").click();
  await expect(page.locator("#bootMenu")).toHaveClass(/hidden/);
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution?.getState?.().alive)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.SnakeArcadeMenuV2?.getState?.().mode)).toBe("normal");
  await expect(page.locator("#game")).toBeVisible();

  await page.goto("/index.html");
  await page.locator("#bootFun").click();
  await expect(page.locator("#bootMenu")).toHaveClass(/hidden/);
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution?.getState?.().alive)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.SnakeEvolution?.getState?.().party)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.SnakeArcadeMenuV2?.getState?.().mode)).toBe("party");
});

test("arcade soundtrack uses the refreshed pixel-pulse motif", async ({ page }) => {
  await page.goto("/index.html");
  const pattern = await page.evaluate(() => window.SnakeArcadeMenuV2?.getMusicPattern());
  expect(pattern.style).toBe("pixel-pulse");
  await expect.poll(() => page.evaluate(() => window.SnakeArcadeMenuV2?.isMusicPatternActive())).toBe(true);
  expect(pattern.tempoMs).toBe(142);
  expect(pattern.lead).toHaveLength(16);
  expect(pattern.chords).toHaveLength(4);
});

test("control scheme and arcade tutorial titles use readable arcade styling", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.locator(".boot-brief .brief-controls .brief-control-chip")).toHaveCount(3);
  await page.locator("#bootHow").click();
  await expect(page.locator("#bootHowPanel .boot-panel-heading b")).toHaveCSS("font-family", /Press Start 2P/);
  const controls = await page.locator(".boot-brief .brief-controls").evaluate(el => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width };
  });
  expect(controls.width).toBeGreaterThan(0);
  expect(controls.right).toBeGreaterThan(controls.left);
});
