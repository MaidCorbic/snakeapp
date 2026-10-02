/* GAMEPLAY UPDATE PACK V2: input safety, checkpoints, near-miss feedback */
(() => {
  "use strict";
  if (window.__snakeGameplayUpdateV2) return;
  window.__snakeGameplayUpdateV2 = true;

  let nearMissCount = 0;
  let lastNearMissAt = 0;
  let lastCheckpointZone = 0;
  let checkpointCount = 0;
  let visibilityPause = false;

  const pauseControl = document.querySelector("#pauseBtn");
  const api = window.SnakeEvolution;
  const basePauseV2 = pause;
  const baseZoneTransitionV2 = handleZoneTransition;
  const baseHunterStepV2 = hunterStep;
  const baseHudV2 = hud;
  const baseStatsMarkupV2 = statsMarkup;
  const baseResetV2 = reset;

  function resetUpdateCounters() {
    nearMissCount = 0;
    lastNearMissAt = 0;
    lastCheckpointZone = 0;
    checkpointCount = 0;
    visibilityPause = false;
    syncPauseButton();
  }

  function syncPauseButton() {
    if (!pauseControl) return;
    const isPaused = !!paused;
    pauseControl.textContent = isPaused ? "RESUME" : "PAUSE";
    pauseControl.setAttribute("aria-label", isPaused ? "Resume game" : "Pause game");
    pauseControl.setAttribute("aria-pressed", String(isPaused));
    pauseControl.disabled = !alive;
    pauseControl.classList.toggle("is-paused", isPaused);
  }

  pause = function pauseWithButtonState() {
    if (!alive) {
      syncPauseButton();
      return;
    }
    basePauseV2();
    syncPauseButton();
  };

  pauseControl?.addEventListener("click", event => {
    event.preventDefault();
    if (alive) pause();
  }, { passive: false });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && alive && !paused) {
      visibilityPause = true;
      pause();
      say("AUTO PAUSE // TAB HIDDEN");
    }
  });

  function gridDistance(a, b) {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return Math.min(dx, COLS - dx) + Math.min(dy, ROWS - dy);
  }

  function checkNearMiss() {
    if (!alive || paused) return;
    const now = performance.now();
    if (now - lastNearMissAt < 2200) return;
    const head = snake?.[0];
    if (!head) return;
    const threats = [...hazards, ...hunters];
    const near = threats.some(item => {
      const distance = gridDistance(head, item);
      return distance === 1;
    });
    if (!near) return;

    lastNearMissAt = now;
    nearMissCount += 1;
    gain(14 + Math.min(16, combo * 2));
    chargeFury(2);
    if (nearMissCount % 3 === 0) {
      say("NEAR MISS x" + nearMissCount + " // BONUS");
      event("EVASION BONUS // +" + (14 + Math.min(16, combo * 2)));
    } else {
      say("NEAR MISS // +" + (14 + Math.min(16, combo * 2)));
    }
    haptic(7);
  }

  hunterStep = function hunterStepWithNearMiss() {
    baseHunterStepV2();
    checkNearMiss();
  };

  handleZoneTransition = function handleZoneTransitionWithCheckpoint() {
    const beforeZone = zone;
    baseZoneTransitionV2();
    const state = api?.getState?.();
    if (!alive || state?.endless || zone <= beforeZone || zone <= lastCheckpointZone) return;

    lastCheckpointZone = zone;
    checkpointCount += 1;
    const bonus = 50 + zone * 50;
    gain(bonus);
    gainXp(20 + zone * 10);
    chargeFury(10);
    shieldUntil = Math.max(shieldUntil, performance.now() + 1200);
    say("ZONE CHECKPOINT // +" + bonus + " // SHIELD");
    event("CHECKPOINT SECURED // ZONE " + (zone + 1));
    haptic(16);
  };

  hud = function updateHudWithV2Feedback() {
    baseHudV2();
    const nearMissEl = document.querySelector("#nearMiss");
    if (nearMissEl) nearMissEl.textContent = String(nearMissCount);
    syncPauseButton();
  };

  statsMarkup = function appendUpdateStats(winResult) {
    return baseStatsMarkupV2(winResult)
      + '<div class="update-pack-stats"><span>NEAR MISSES <b>' + nearMissCount
      + '</b></span><span>ZONE CHECKPOINTS <b>' + checkpointCount
      + '</b></span><span>UPDATE PACK <b>V2</b></span></div>';
  };

  reset = function resetWithV2Counters() {
    resetUpdateCounters();
    return baseResetV2();
  };

  if (api) {
    const wrapStart = (fn, mode) => function startWithV2Counters(...args) {
      resetUpdateCounters();
      if (mode === "daily") visibilityPause = false;
      return fn.apply(this, args);
    };
    if (typeof api.start === "function") api.start = wrapStart(api.start, "standard");
    if (typeof api.startDaily === "function") api.startDaily = wrapStart(api.startDaily, "daily");
    if (typeof api.startEndless === "function") api.startEndless = wrapStart(api.startEndless, "endless");

    const baseGetStateV2 = api.getState;
    if (typeof baseGetStateV2 === "function") {
      api.getState = () => ({
        ...baseGetStateV2(),
        nearMisses: nearMissCount,
        zoneCheckpoints: checkpointCount,
        updatePack: "V2"
      });
    }
  }

  resetUpdateCounters();
  syncPauseButton();
})();