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
      body: source + "\nwindow.__snakeE2E = { startGameplay: () => { contractOfferOpen = false; contractAccepted = true; move(); }, endRun: () => end(), winRun: () => win() };\n"
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
  const balance = await page.evaluate(() => window.SnakeEvolution.getState().balance);
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