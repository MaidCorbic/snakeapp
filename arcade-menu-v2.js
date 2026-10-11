/* Arcade Menu V2 — interaction contracts and original synth variation */
(() => {
  "use strict";
  if (window.__arcadeMenuV2) return;
  window.__arcadeMenuV2 = true;

  const $ = (selector) => document.querySelector(selector);
  const state = { mode: "normal", launchCount: 0 };
  let musicRestarted = false;
  const mainMenu = $("#bootMenu");

  // Revised chiptune pattern: brighter minor-key pulse with a syncopated lead.
  // It intentionally replaces only the notes in the existing audio loop.
  function replaceMusicPattern() {
    const lead = [587.33, 698.46, 880, 0, 783.99, 698.46, 587.33, 523.25,
      659.25, 0, 783.99, 987.77, 880, 783.99, 659.25, 523.25];
    const bass = [73.42, 73.42, 110, 110, 65.41, 65.41, 98, 98];
    const chords = [[146.83,174.61,220,261.63],[130.81,155.56,196,233.08],
      [164.81,196,246.94,293.66],[130.81,155.56,196,233.08]];
    const descriptor = Object.freeze({ lead, bass, chords, tempoMs: 142, style: "pixel-pulse" });
    window.__snakeArcadeMusic = descriptor;
    document.documentElement.dataset.arcadeMusic = descriptor.style;
  }
  replaceMusicPattern();

  // menu.js reads the pattern at runtime so the new motif reaches the actual audio loop.
  const activateMusicPattern = () => {
    const api = window.__snakeMusicSetPattern;
    if (typeof api === "function") {
      api(window.__snakeArcadeMusic);
      musicRestarted = true;
    }
  };
  window.addEventListener("snake-evolution-music-ready", activateMusicPattern);
  activateMusicPattern();

  function startThroughExistingHandler(buttonId, mode) {
    const button = $("#" + buttonId);
    if (!button || !mainMenu) return;
    button.addEventListener("click", () => {
      state.mode = mode;
      state.launchCount += 1;
      mainMenu.dataset.launchMode = mode;
      mainMenu.dataset.launchAttempt = String(state.launchCount);
    }, { capture: true });
  }
  startThroughExistingHandler("bootStart", "normal");
  startThroughExistingHandler("bootFun", "party");

  // Custom colour control is intentionally native, labelled, and has no raw hex text clutter.
  const customPicker = () => {
    const label = $(".snake-custom-color");
    const input = $("#seCustomSnakeColor");
    if (!label || !input || label.dataset.arcadeHex === "1") return;
    label.dataset.arcadeHex = "1";
    input.title = "Choose a custom snake colour";
    input.setAttribute("aria-label", "Custom snake colour hex picker");
  };
  const enhanceColorPicker = new MutationObserver(customPicker);
  enhanceColorPicker.observe(document.documentElement, { childList: true, subtree: true });
  customPicker();

  window.SnakeArcadeMenuV2 = Object.freeze({
    version: "2.0.0",
    getState: () => ({...state}),
    getMusicPattern: () => window.__snakeArcadeMusic,
    isMusicPatternActive: () => musicRestarted
  });
})();