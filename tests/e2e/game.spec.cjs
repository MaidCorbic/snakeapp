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
      body: source + "\nwindow.__snakeE2E = { startGameplay: () => { contractOfferOpen = false; contractAccepted = true; move(); }, endRun: () => end(), winRun: () => win(), freeCell: () => free(), forceSelfCollisionWithShield: () => { snake = [{x:10,y:10},{x:11,y:10},{x:11,y:9}]; dir = next = {x:1,y:0}; shieldUntil = performance.now() + 5000; pulseUntil = 0; lives = 3; stats.damage = 0; alive = true; paused = false; move(); } };\n"
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
  await page.evaluate(() => window.__snakeE2E.startGameplay());
}

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
    "snakeReworkV2"
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