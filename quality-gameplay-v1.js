/* SNAKE EVOLUTION — gameplay quality and first-run tutorial layer */
(() => {
  "use strict";
  if (window.__snakeQualityGameplayV1) return;
  window.__snakeQualityGameplayV1 = true;
  const SETTINGS_KEY = "snake-evolution-settings";
  const TUTORIAL_KEY = "snake-evolution-tutorial-seen-v1";
  let options = {};
  try { options = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {}; } catch {}
  const safeRead = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); } catch { return fallback; } };
  const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const validColor = value => /^#[0-9a-f]{6}$/i.test(String(value || ""));
  const getState = () => { try { return window.SnakeEvolution?.getState?.() || {}; } catch { return {}; } };
  const settingOn = key => options[key] !== false;
  document.addEventListener("snake-evolution-settings-changed", event => {
    if (event.detail && typeof event.detail === "object") options = {...options, ...event.detail};
    document.body.classList.toggle("se-hide-threat-radar", !settingOn("threatRadar"));
    try { if (typeof draw === "function" && typeof alive !== "undefined" && alive) draw(); } catch {}
  });
  document.body.classList.toggle("se-hide-threat-radar", !settingOn("threatRadar"));

  function addThreatPanel() {
    const canvas = document.querySelector("#game");
    if (!canvas || document.querySelector("#seThreatStatus")) return;
    const panel = document.createElement("section");
    panel.id = "seThreatStatus";
    panel.setAttribute("aria-label", "Live threat scanner");
    panel.setAttribute("aria-live", "polite");
    panel.innerHTML = '<span class="se-threat-heading">THREAT SCAN</span><span class="se-threat-stat se-threat-hunters"><span>HUNTERS</span><strong id="seThreatHunters">0</strong></span><span class="se-threat-stat se-threat-hazards"><span>HAZARDS</span><strong id="seThreatHazards">0</strong></span><span class="se-threat-stat se-threat-boss"><span>WARDEN</span><strong id="seThreatBoss">OFFLINE</strong></span>';
    const shell = canvas.closest(".game-shell");
    (shell || canvas).insertAdjacentElement("afterend", panel);
  }
  function updateThreatPanel() {
    addThreatPanel();
    const hunterCount = Array.isArray(hunters) ? hunters.length : 0;
    const hazardCount = Array.isArray(hazards) ? hazards.length : 0;
    const h = document.querySelector("#seThreatHunters"), z = document.querySelector("#seThreatHazards"), b = document.querySelector("#seThreatBoss");
    if (h) h.textContent = String(hunterCount);
    if (z) z.textContent = String(hazardCount);
    if (b) b.textContent = typeof boss !== "undefined" && boss ? "ACTIVE" : "OFFLINE";
  }
  function drawEnemyDetails() {
    if (!settingOn("enemyDetails") || typeof ctx === "undefined" || !Array.isArray(hunters)) return;
    const pulse = .5 + .5 * Math.sin(performance.now() / 190);
    hunters.forEach(enemy => {
      if (!Number.isFinite(enemy?.x) || !Number.isFinite(enemy?.y)) return;
      const elite = enemy.type === "elite";
      const color = elite ? "#ffbd55" : enemy.type === "interceptor" ? "#d8a0ff" : "#73dfff";
      ctx.save();
      ctx.globalAlpha = .65 + .3 * pulse;
      ctx.strokeStyle = color;
      ctx.lineWidth = .075;
      ctx.shadowColor = color;
      ctx.shadowBlur = .28 + pulse * .24;
      ctx.strokeRect(enemy.x + .035, enemy.y + .035, .93, .93);
      ctx.beginPath();
      ctx.moveTo(enemy.x + .18, enemy.y + .12);
      ctx.lineTo(enemy.x + .5, enemy.y + .025);
      ctx.lineTo(enemy.x + .82, enemy.y + .12);
      ctx.stroke();
      ctx.fillStyle = "#061018";
      ctx.fillRect(enemy.x + .22, enemy.y + .29, .19, .16);
      ctx.fillRect(enemy.x + .59, enemy.y + .29, .19, .16);
      ctx.fillStyle = color;
      ctx.fillRect(enemy.x + .25, enemy.y + .31, .11, .1);
      ctx.fillRect(enemy.x + .62, enemy.y + .31, .11, .1);
      if (elite && Number.isFinite(enemy.hp)) {
        const maxHp = Math.max(1, Number(enemy.maxHp) || 3);
        ctx.fillStyle = "#260c09";
        ctx.fillRect(enemy.x + .12, enemy.y + .82, .76, .08);
        ctx.fillStyle = "#ff9f43";
        ctx.fillRect(enemy.x + .12, enemy.y + .82, .76 * Math.max(0, Math.min(1, enemy.hp / maxHp)), .08);
      }
      ctx.restore();
    });
    if (typeof boss !== "undefined" && boss) {
      const color = boss.phase >= 2 ? "#ff5c72" : "#ff9fdf";
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = .8 + pulse * .2;
      ctx.lineWidth = .1;
      ctx.shadowColor = color;
      ctx.shadowBlur = .5 + pulse * .4;
      ctx.beginPath();
      ctx.moveTo(boss.x + .5, boss.y + .04);
      ctx.lineTo(boss.x + .96, boss.y + .5);
      ctx.lineTo(boss.x + .5, boss.y + .96);
      ctx.lineTo(boss.x + .04, boss.y + .5);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }
  const ACHIEVEMENT_KEY = "snake-evolution-quality-achievements-v1";
  let lastAchievementMarkup = "";
  function trackAchievementState() {
    const state = getState();
    const save = safeRead("snake-evolution-save", {}) || {};
    const earned = safeRead(ACHIEVEMENT_KEY, {}) || {};
    const criteria = {
      first_run: Number(save.runs) >= 1,
      combo_five: Number(state.combo) >= 5,
      zone_three: Number(state.zone) >= 2,
      near_miss_ten: Number(save.nearMisses || 0) >= 10,
      level_four: Number(state.level) >= 4
    };
    let changed = false;
    Object.entries(criteria).forEach(([id, complete]) => {
      if (complete && !earned[id]) { earned[id] = 1; changed = true; }
    });
    if (changed) safeWrite(ACHIEVEMENT_KEY, earned);
    return { earned, changed };
  }
  function polishAchievements(force = false) {
    const root = document.querySelector("#achievementList");
    if (!root) return;
    const { earned } = trackAchievementState();
    const metrics = [
      ["first_run","ARCADE INIT","Finish your first recorded run."],
      ["combo_five","CHAIN REACTION","Reach a combo multiplier of x5."],
      ["zone_three","DEEP EXPLORER","Reach the third zone in a run."],
      ["near_miss_ten","CLOSE CALL","Record ten near misses across runs."],
      ["level_four","APEX BUILD","Reach evolution level 4."]
    ];
    const markup = metrics.map(([id,title,desc]) => '<article class="se-bonus-card '+(earned[id] ? "is-complete" : "")+'"><strong>'+(earned[id] ? "UNLOCKED // " : "LOCKED // ")+title+'</strong><small>'+desc+'</small></article>').join("");
    if (!force && markup === lastAchievementMarkup && root.querySelector(".se-bonus-achievements")) return;
    let wrap = root.querySelector(".se-bonus-achievements");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "se-bonus-achievements";
      wrap.setAttribute("aria-label", "Additional achievements");
      root.appendChild(wrap);
    }
    wrap.innerHTML = markup;
    lastAchievementMarkup = markup;
  }
  function trackCompletedRun() {
    if (typeof persist !== "function" || persist.__qualityNearMissTotal) return;
    const original = persist;
    const wrapped = function persistWithCumulativeNearMisses(...args) {
      const runMisses = Math.max(0, Number(getState().nearMisses) || 0);
      const result = original.apply(this, args);
      const save = safeRead("snake-evolution-save", {}) || {};
      save.nearMisses = Math.max(0, Number(save.nearMisses) || 0) + runMisses;
      safeWrite("snake-evolution-save", save);
      return result;
    };
    wrapped.__qualityNearMissTotal = true;
    persist = wrapped;
  }
  function styleSettingsToBody() {
    document.body.classList.toggle("se-hide-threat-radar", !settingOn("threatRadar"));
  }
  function showFirstRunTutorial() {
    if (safeRead(TUTORIAL_KEY, false)) return;
    if (document.querySelector(".se-tutorial-overlay")) return;
    try {
      if (typeof alive !== "undefined" && alive) {
        paused = true;
        if (typeof timer !== "undefined") clearTimeout(timer);
        timer = null;
      }
    } catch {}
    const overlay = document.createElement("div");
    overlay.className = "se-tutorial-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "seTutorialTitle");
    overlay.innerHTML = '<article class="se-tutorial-card"><div class="se-tutorial-eyebrow">MISSION BOOT // FIRST RUN</div><h2 id="seTutorialTitle">SURVIVE. EVOLVE. REPEAT.</h2><p>A quick field briefing before your first run. You can reopen full instructions from <b>HOW TO PLAY</b> on the main menu.</p><div class="se-tutorial-grid"><div class="se-tutorial-step"><b>01 / COLLECT</b><span>Green energy builds score, XP and FURY. Yellow cores are high-value pickups.</span></div><div class="se-tutorial-step"><b>02 / READ THREATS</b><span>Avoid red hazards. Blue hunters pursue you, elites have extra health, and the Warden is a boss.</span></div><div class="se-tutorial-step"><b>03 / USE ABILITIES</b><span>DASH creates space, SHIELD blocks damage, PULSE clears nearby threats, and FURY buys breathing room.</span></div><div class="se-tutorial-step"><b>04 / BUILD A RECORD</b><span>Finish objectives and contracts, keep your chain alive, and use extraction when it appears.</span></div></div><div class="se-tutorial-keys"><kbd>WASD / ARROWS · MOVE</kbd><kbd>SPACE · DASH</kbd><kbd>SHIFT · SHIELD</kbd><kbd>E · PULSE</kbd><kbd>Q · FURY</kbd><kbd>P / ESC · PAUSE</kbd></div><div class="se-tutorial-actions"><button type="button" id="seTutorialStart">GOT IT — START PLAYING</button><button type="button" id="seTutorialSkip">SKIP BRIEF</button></div></article>';
    document.body.appendChild(overlay);
    const dismiss = () => {
      try { localStorage.setItem(TUTORIAL_KEY, "true"); } catch {}
      overlay.remove();
      try {
        if (typeof alive !== "undefined" && alive) {
          paused = false;
          if (typeof contractOfferOpen !== "undefined" && contractOfferOpen) return;
          if (typeof extractionOpen !== "undefined" && extractionOpen) return;
          if (typeof timer !== "undefined") clearTimeout(timer);
          timer = setTimeout(() => { if (typeof alive !== "undefined" && alive && !paused) move(); }, 160);
        }
      } catch (error) { console.warn("[Snake Evolution] Could not resume after tutorial:", error); }
    };
    overlay.querySelector("#seTutorialStart").addEventListener("click", dismiss);
    overlay.querySelector("#seTutorialSkip").addEventListener("click", dismiss);
    overlay.querySelector("#seTutorialStart").focus();
  }
  function syncContractOffer() {
    const state = getState();
    const offered = state.contractOfferOpen === true;
    const accept = document.querySelector("#contractAccept");
    const decline = document.querySelector("#contractDecline");
    if (accept) {
      accept.classList.toggle("hidden", !offered);
      accept.setAttribute("aria-hidden", String(!offered));
      accept.disabled = !offered;
    }
    if (decline) {
      decline.classList.toggle("hidden", !offered);
      decline.setAttribute("aria-hidden", String(!offered));
      decline.disabled = !offered;
    }
    const title = document.querySelector("#contract");
    const label = document.querySelector("#contractLabel");
    if (offered) {
      if (title) title.textContent = "OFFER";
      if (label) label.textContent = "ACCEPT OR DECLINE";
    }
  }
  function wrapLaunchMethods() {
    const api = window.SnakeEvolution;
    if (!api || api.__qualityLaunchWrapped) return;
    const wrap = (name) => {
      const original = api[name];
      if (typeof original !== "function") return;
      api[name] = function qualityLaunch(...args) {
        const result = original.apply(this, args);
        window.setTimeout(() => {
          styleSettingsToBody();
          syncContractOffer();
          showFirstRunTutorial();
          syncContractOffer();
          updateThreatPanel();
          polishAchievements(true);
        }, 0);
        return result;
      };
    };
    ["start","startParty","startDaily","startEndless"].forEach(wrap);
    Object.defineProperty(api, "__qualityLaunchWrapped", {value:true, configurable:false});
  }
  if (typeof draw === "function" && !draw.__qualityEnemyDraw) {
    const baseDraw = draw;
    const qualityDraw = function qualityEnemyDraw() {
      baseDraw();
      try { drawEnemyDetails(); } catch (error) { console.warn("[Snake Evolution] Enemy overlay skipped:", error); }
      try { trackAchievementState(); } catch {}
    };
    qualityDraw.__qualityEnemyDraw = true;
    draw = qualityDraw;
  }
  if (typeof hud === "function" && !hud.__qualityThreatHud) {
    const baseHud = hud;
    const qualityHud = function qualityThreatHud(...args) {
      const result = baseHud.apply(this, args);
      try { syncContractOffer(); } catch {}
      try { updateThreatPanel(); } catch {}
      return result;
    };
    qualityHud.__qualityThreatHud = true;
    hud = qualityHud;
  }
  styleSettingsToBody();
  addThreatPanel();
  trackCompletedRun();
  wrapLaunchMethods();
  polishAchievements(true);
  window.setInterval(() => { try { syncContractOffer(); polishAchievements(); updateThreatPanel(); } catch {} }, 1000);
  document.addEventListener("snake-evolution-settings-changed", styleSettingsToBody);
  window.SnakeQualityGameplay = Object.freeze({version:"1.0.0", refresh:()=>{updateThreatPanel();polishAchievements();}});
})();
