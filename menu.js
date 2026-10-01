(() => {
  "use strict";
  const bootMenu = document.querySelector("#bootMenu");
  const app = document.querySelector("#app");
  const startBtn = document.querySelector("#bootStart");
  const howBtn = document.querySelector("#bootHow");
  const optionsBtn = document.querySelector("#bootOptions");
  const howPanel = document.querySelector("#bootHowPanel");
  const optionsPanel = document.querySelector("#bootOptionsPanel");
  const howBack = document.querySelector("#bootHowBack");
  const optionsBack = document.querySelector("#bootOptionsBack");
  const gridToggle = document.querySelector("#bootGrid");
  const vibrationToggle = document.querySelector("#bootVibration");
  const motionToggle = document.querySelector("#bootMotion");
  const errorPanel = document.querySelector("#bootError");
  const errorText = document.querySelector("#bootErrorText");
  const retryBtn = document.querySelector("#bootErrorRetry");
  const settingsKey = "snake-evolution-settings";
  const defaults = {grid:true,vibration:true,reducedMotion:false};
  let settings = {...defaults};
  let gameLoaded = false;
  let gameLoading = false;
  let bootFailed = false;

  try { settings = {...defaults, ...JSON.parse(localStorage.getItem(settingsKey) || "{}")}; } catch {}

  const hidePanels = () => {
    howPanel?.classList.add("hidden");
    optionsPanel?.classList.add("hidden");
  };

  const renderSettings = () => {
    [[gridToggle,"grid"],[vibrationToggle,"vibration"],[motionToggle,"reducedMotion"]].forEach(([button,key]) => {
      if (!button) return;
      button.textContent = settings[key] ? "ON" : "OFF";
      button.setAttribute("aria-pressed", String(!!settings[key]));
    });
  };

  const saveSettings = () => {
    try { localStorage.setItem(settingsKey, JSON.stringify(settings)); } catch {}
    renderSettings();
  };

  const showBootMenu = () => {
    app?.classList.add("preboot");
    bootMenu?.classList.remove("hidden");
    errorPanel?.classList.add("hidden");
    hidePanels();
    renderSettings();
  };

  const failLoad = (detail) => {
    gameLoading = false;
    bootMenu?.classList.remove("hidden");
    hidePanels();
    errorPanel?.classList.remove("hidden");
    if (errorText) errorText.textContent = detail || "GAME BOOT FAILED";
  };

  const loadGame = () => {
    hidePanels();
    if (gameLoaded) {
      bootMenu?.classList.add("hidden");
      app?.classList.remove("preboot");
      window.SnakeEvolution?.start?.();
      return;
    }
    if (gameLoading) return;
    gameLoading = true;
    bootFailed = false;
    bootMenu?.classList.add("hidden");
    app?.classList.remove("preboot");

    const onRuntimeError = (event) => {
      if (!gameLoading) return;
      bootFailed = true;
      window.removeEventListener("error", onRuntimeError);
      failLoad("GAME BOOT ERROR: " + (event.message || "unknown runtime error"));
    };
    window.addEventListener("error", onRuntimeError);

    const script = document.createElement("script");
    script.id = "snakeGameScript";
    script.src = "game.js?v=survival-v5";
    script.onload = () => {
      window.removeEventListener("error", onRuntimeError);
      gameLoading = false;
      if (bootFailed) return;
      gameLoaded = true;
      window.SnakeEvolution?.start?.();
    };
    script.onerror = () => {
      window.removeEventListener("error", onRuntimeError);
      failLoad("GAME SCRIPT COULD NOT LOAD");
    };
    document.body.appendChild(script);
  };

  startBtn?.addEventListener("click", loadGame);
  howBtn?.addEventListener("click", () => {
    optionsPanel?.classList.add("hidden");
    howPanel?.classList.remove("hidden");
  });
  optionsBtn?.addEventListener("click", () => {
    howPanel?.classList.add("hidden");
    optionsPanel?.classList.remove("hidden");
    renderSettings();
  });
  howBack?.addEventListener("click", hidePanels);
  optionsBack?.addEventListener("click", hidePanels);
  retryBtn?.addEventListener("click", loadGame);

  gridToggle?.addEventListener("click", () => { settings.grid=!settings.grid; saveSettings(); });
  vibrationToggle?.addEventListener("click", () => { settings.vibration=!settings.vibration; saveSettings(); });
  motionToggle?.addEventListener("click", () => { settings.reducedMotion=!settings.reducedMotion; saveSettings(); });

  window.showBootMenu = showBootMenu;
  renderSettings();
  showBootMenu();
})();