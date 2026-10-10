/* SNAKE EVOLUTION // ULTIMATE UI PASS
   Polishes existing systems without replacing the game simulation.
*/
(() => {
  "use strict";
  if (window.__snakeUltimateUiPass) return;
  window.__snakeUltimateUiPass = true;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const safeRead = (key, fallback = null) => {
    try { const value = localStorage.getItem(key); return value === null ? fallback : value; }
    catch { return fallback; }
  };
  const safeWrite = (key, value) => { try { localStorage.setItem(key, value); return true; } catch { return false; } };

  function improveOptions() {
    const panel = $("#bootOptionsPanel");
    const grid = $(".options-grid", panel || document);
    if (!panel || !grid || panel.dataset.ultimateUi === "1") return;
    panel.dataset.ultimateUi = "1";

    const sections = [
      { label: "01 / PRESENTATION", keys: ["bootGrid", "bootMotion", "bootCrt", "bootContrast", "bootHomeClock"] },
      { label: "02 / IN-RUN HUD", keys: ["bootTimer", "bootXp", "bootIntel", "bootMissions", "bootAbilities", "bootTouch", "bootAutoPause"] },
      { label: "03 / AUDIO & FEEDBACK", keys: ["bootVibration", "bootFx", "bootSound", "bootMusic", "bootVolume"] }
    ];
    const allRows = [...grid.children].filter(node => node.classList.contains("option-row"));
    const labels = [...grid.children].filter(node => node.classList.contains("options-section-label"));
    labels.forEach(node => node.remove());
    const rowsById = new Map(allRows.map(row => {
      const control = $("button[id], input[id]", row);
      return [control?.id, row];
    }));

    const groups = [];
    sections.forEach(section => {
      const group = document.createElement("section");
      group.className = "option-group";
      group.setAttribute("aria-label", section.label.replace(/^\d+ \/ /, ""));
      const heading = document.createElement("h3");
      heading.className = "option-group-title";
      heading.textContent = section.label;
      group.appendChild(heading);
      section.keys.forEach(id => {
        const row = rowsById.get(id);
        if (row) { group.appendChild(row); rowsById.delete(id); }
      });
      if (group.querySelector(".option-row")) { grid.appendChild(group); groups.push(group); }
    });
    if (rowsById.size) {
      const group = document.createElement("section");
      group.className = "option-group";
      const heading = document.createElement("h3");
      heading.className = "option-group-title";
      heading.textContent = "04 / PROFILE & UTILITIES";
      group.appendChild(heading);
      rowsById.forEach(row => group.appendChild(row));
      grid.appendChild(group);
      groups.push(group);
    }

    // All controls remain the original controls; this only changes their layout.
    const actions = $(".option-actions", panel);
    if (actions) {
      actions.setAttribute("aria-label", "Settings utilities");
      const resetRank = $("#bootResetRank", actions);
      if (resetRank) resetRank.title = "Clears local score records and saved leaderboard data";
    }
  }

  function improveGameOver() {
    const message = $("#message");
    const card = $(".message-card", message || document);
    if (!message || !card || message.dataset.ultimateUi === "1") return;
    message.dataset.ultimateUi = "1";
    message.setAttribute("role", "dialog");
    message.setAttribute("aria-modal", "true");
    message.setAttribute("aria-labelledby", "resultTitle");
    const observer = new MutationObserver(() => {
      const heading = $("h2", card);
      if (heading && heading.id !== "resultTitle") heading.id = "resultTitle";
      const copy = $(".result-copy", card);
      if (copy) copy.setAttribute("aria-live", "polite");
    });
    observer.observe(card, { childList: true, subtree: true });
    const initialHeading = $("h2", card);
    if (initialHeading) initialHeading.id = "resultTitle";
    // Keep the existing result-generation and run-again handlers intact.
    card.classList.add("ultimate-result-card");
  }

  function addGameplayFeedback() {
    const score = $("#score"), combo = $("#combo"), lives = $("#lives");
    const shell = $(".game-shell");
    if (!score || !combo || !lives || !shell || shell.dataset.ultimateFeedback === "1") return;
    shell.dataset.ultimateFeedback = "1";

    let previousScore = Number(score.textContent) || 0;
    let previousCombo = combo.textContent;
    let previousLives = lives.textContent;
    const pulse = (element, cls) => {
      element.classList.remove(cls);
      void element.offsetWidth;
      element.classList.add(cls);
      window.setTimeout(() => element.classList.remove(cls), 360);
    };
    const observer = new MutationObserver(() => {
      const currentScore = Number(score.textContent) || 0;
      const currentCombo = combo.textContent;
      const currentLives = lives.textContent;
      if (currentScore > previousScore) pulse($("#score")?.closest(".score-tile") || score, "ui-score-pulse");
      if (currentCombo !== previousCombo && /x[2-9]|x\d{2,}/.test(currentCombo)) pulse($("#combo")?.closest(".score-tile") || combo, "ui-combo-pulse");
      if (currentLives !== previousLives && currentLives.length < previousLives.length) pulse(lives, "ui-damage-pulse");
      previousScore = currentScore;
      previousCombo = currentCombo;
      previousLives = currentLives;
    });
    observer.observe(score, { childList: true, characterData: true, subtree: true });
    observer.observe(combo, { childList: true, characterData: true, subtree: true });
    observer.observe(lives, { childList: true, characterData: true, subtree: true });
  }

  function keyboardPolish() {
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        const options = $("#bootOptionsPanel");
        if (options && !options.classList.contains("hidden")) $("#bootOptionsBack")?.click();
        const how = $("#bootHowPanel");
        if (how && !how.classList.contains("hidden")) $("#bootHowBack")?.click();
      }
    });
    document.addEventListener("click", event => {
      const toggle = event.target.closest(".option-toggle");
      if (toggle) {
        // Existing code updates aria-pressed and persisted settings. This hook only mirrors state.
        requestAnimationFrame(() => toggle.classList.toggle("is-on", toggle.getAttribute("aria-pressed") === "true"));
      }
    });
    $$(".option-toggle").forEach(toggle => toggle.classList.toggle("is-on", toggle.getAttribute("aria-pressed") === "true"));
  }

  function start() {
    improveOptions();
    improveGameOver();
    addGameplayFeedback();
    keyboardPolish();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
  window.SnakeUltimateUi = Object.freeze({ version: "1.0.0", start });
})();