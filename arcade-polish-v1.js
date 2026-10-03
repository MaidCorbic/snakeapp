/* SNAKE EVOLUTION // ARCADE POLISH V1
   Presentation enhancement layer. Gameplay remains in game.js. */
(() => {
  "use strict";
  if (window.__snakeArcadePolishV1) return;
  window.__snakeArcadePolishV1 = true;

  const shell = () => document.querySelector(".game-shell");
  const score = () => document.querySelector("#score");
  const combo = () => document.querySelector("#combo");
  const abilities = () => [...document.querySelectorAll(".ability")];

  let lastScore = 0;
  let lastCombo = "";
  let raf = 0;

  const pulse = (className) => {
    const el = shell();
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
    clearTimeout(el.__arcadePulse);
    el.__arcadePulse = setTimeout(() => el.classList.remove(className), 180);
  };

  const update = () => {
    const scoreValue = Number(score()?.textContent || 0);
    const comboValue = combo()?.textContent || "";
    if (scoreValue > lastScore) pulse("arcade-hit");
    if (comboValue !== lastCombo && /x[2-9]|x[1-9][0-9]/.test(comboValue)) pulse("arcade-combo");
    lastScore = scoreValue;
    lastCombo = comboValue;

    abilities().forEach(button => {
      const fill = button.querySelector("i");
      const ready = !fill || getComputedStyle(fill).width === "0px" || fill.getBoundingClientRect().width < 2;
      button.classList.toggle("ready", ready && !button.disabled);
    });
    raf = window.setTimeout(update, 180);
  };

  window.SnakeArcadePolish = {
    version: "1.0.0",
    start() {
      if (!raf) update();
    }
  };

  window.addEventListener("load", () => window.SnakeArcadePolish.start(), {once:true});
})();
