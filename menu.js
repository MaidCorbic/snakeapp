(() => {
  "use strict";
  const bootMenu = document.querySelector("#bootMenu");
  const app = document.querySelector("#app");
  const startBtn = document.querySelector("#bootStart");
  const howBtn = document.querySelector("#bootHow");
  const optionsBtn = document.querySelector("#bootOptions");
  const dailyBtn = document.querySelector("#bootDaily");
  const endlessBtn = document.querySelector("#bootEndless");
  const howPanel = document.querySelector("#bootHowPanel");
  const optionsPanel = document.querySelector("#bootOptionsPanel");
  const howBack = document.querySelector("#bootHowBack");
  const optionsBack = document.querySelector("#bootOptionsBack");
  const gridToggle = document.querySelector("#bootGrid");
  const vibrationToggle = document.querySelector("#bootVibration");
  const motionToggle = document.querySelector("#bootMotion");
  const soundToggle = document.querySelector("#bootSound");
  const errorPanel = document.querySelector("#bootError");
  const errorText = document.querySelector("#bootErrorText");
  const retryBtn = document.querySelector("#bootErrorRetry");
  const settingsKey = "snake-evolution-settings";
  const defaults = {grid:true,vibration:true,reducedMotion:false,sound:true};
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
    [[gridToggle,"grid"],[vibrationToggle,"vibration"],[motionToggle,"reducedMotion"],[soundToggle,"sound"]].forEach(([button,key]) => {
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

  const startLoadedMode = (mode) => {
    if (mode === "daily") window.SnakeEvolution?.startDaily?.();
    else if (mode === "endless") window.SnakeEvolution?.startEndless?.();
    else window.SnakeEvolution?.start?.();
  };

  const loadGame = (mode="normal") => {
    hidePanels();
    if (gameLoaded) {
      bootMenu?.classList.add("hidden");
      app?.classList.remove("preboot");
      startLoadedMode(mode);
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
    script.src = "game.js?v=survival-v9";
    script.onload = () => {
      if (bootFailed) return;
      const ultimate = document.createElement("script");
      ultimate.id = "snakeUltimateScript";
      ultimate.src = "ultimate-gameplay-v1.js?v=ultimate-v5";
      ultimate.onload = () => {
        if (bootFailed) return;
        const update = document.createElement("script");
        update.id = "snakeGameplayUpdateV2";
        update.src = "gameplay-update-v2.js?v=update-v6";
        update.onload = () => {
          if (bootFailed) return;
          window.removeEventListener("error", onRuntimeError);
          gameLoading = false;
          gameLoaded = true;
          startLoadedMode(mode);
        };
        update.onerror = () => {
          window.removeEventListener("error", onRuntimeError);
          failLoad("GAMEPLAY UPDATE PACK COULD NOT LOAD");
        };
        document.body.appendChild(update);
      };
      ultimate.onerror = () => {
        window.removeEventListener("error", onRuntimeError);
        failLoad("ULTIMATE GAMEPLAY LAYER COULD NOT LOAD");
      };
      document.body.appendChild(ultimate);
    };
    script.onerror = () => {
      window.removeEventListener("error", onRuntimeError);
      failLoad("GAME SCRIPT COULD NOT LOAD");
    };
    document.body.appendChild(script);
  };

  startBtn?.addEventListener("click", () => loadGame("normal"));
  dailyBtn?.addEventListener("click", () => loadGame("daily"));
  endlessBtn?.addEventListener("click", () => loadGame("endless"));
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
  soundToggle?.addEventListener("click", () => { settings.sound=!settings.sound; try { localStorage.setItem("snake-evolution-sound", settings.sound ? "on" : "off"); } catch {} saveSettings(); });

  window.showBootMenu = showBootMenu;
  renderSettings();
  if (settings.sound === false) { try { localStorage.setItem("snake-evolution-sound", "off"); } catch {} }
  showBootMenu();
})();