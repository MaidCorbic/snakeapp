/* VISUAL POLISH V1 — accessible combat feedback without changing game balance */
(() => {
  "use strict";
  if (window.__snakeVisualPolishV1) return;
  window.__snakeVisualPolishV1 = true;
  const body = document.body;
  const canvas = document.querySelector("#game");
  const message = document.querySelector("#message");
  const bossHud = document.querySelector("#bossHud");
  const eventBanner = document.querySelector("#eventBanner");
  const toast = document.querySelector("#toast");
  const floaters = document.querySelector("#floaters");
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    body.classList.contains("reduced-motion") || body.classList.contains("no-combat-fx");
  let lastText = "";
  let lastBanner = "";
  let lastToast = "";
  let lastBossVisible = false;
  let lastScore = "";
  let scoreObserver = null;
  const score = document.querySelector("#score");
  function pulse(className, duration = 320) {
    if (reduced()) return;
    body.classList.remove(className);
    void body.offsetWidth;
    body.classList.add(className);
    window.setTimeout(() => body.classList.remove(className), duration);
  }
  function syncState() {
    const ended = message && !message.classList.contains("hidden");
    const bossVisible = bossHud && getComputedStyle(bossHud).display !== "none" &&
      getComputedStyle(bossHud).visibility !== "hidden";
    body.classList.toggle("vp-game-over", !!ended);
    body.classList.toggle("run-boss", !!bossVisible);
    body.classList.toggle("run-active", !!canvas && !ended);
    if (bossVisible && !lastBossVisible) pulse("vp-boss-hit", 360);
    lastBossVisible = !!bossVisible;
  }
  function watchText(el, callback, getLast, setLast) {
    if (!el) return;
    new MutationObserver(() => {
      const value = (el.textContent || "").trim();
      if (value && value !== getLast()) {
        setLast(value);
        callback(value);
      }
    }).observe(el, {subtree:true,childList:true,characterData:true,attributes:true});
  }
  watchText(eventBanner, value => {
    if (/HIT|DAMAGE|DANGER|CRITICAL|WARDEN|BOSS|STORM|SURGE/i.test(value)) pulse("vp-hit", 260);
  }, () => lastBanner, value => { lastBanner = value; });
  watchText(toast, value => {
    if (/CORE|ENERGY|PICKUP|COLLECT|XP\+|XP \+/i.test(value)) pulse("vp-pickup", 300);
    if (/DAMAGE|HIT|LOST|FAILED|DANGER/i.test(value)) pulse("vp-hit", 260);
  }, () => lastToast, value => { lastToast = value; });
  if (message) new MutationObserver(syncState).observe(message, {attributes:true,attributeFilter:["class","style"]});
  if (bossHud) new MutationObserver(syncState).observe(bossHud, {attributes:true,attributeFilter:["class","style","hidden"]});
  if (score) {
    scoreObserver = new MutationObserver(() => {
      const value = score.textContent.trim();
      if (lastScore && value !== lastScore) {
        const oldValue = Number(lastScore.replace(/[^0-9.-]/g, ""));
        const newValue = Number(value.replace(/[^0-9.-]/g, ""));
        if (Number.isFinite(oldValue) && Number.isFinite(newValue) && newValue > oldValue) pulse("vp-pickup", 240);
      }
      lastScore = value;
    });
    scoreObserver.observe(score, {subtree:true,childList:true,characterData:true});
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncState();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !reduced()) {
      const active = document.activeElement;
      if (active && active.matches("button")) active.blur();
    }
  });
  syncState();
  // A small, non-invasive danger cue based on existing HUD copy; no game state is modified.
  const hudText = document.querySelector(".hud,.game-hud,.stats-bar");
  if (hudText) new MutationObserver(() => {
    const text = hudText.textContent || "";
    body.classList.toggle("run-danger", /DANGER|CRITICAL|LOW HP/i.test(text));
  }).observe(hudText,{subtree:true,childList:true,characterData:true});
})();
