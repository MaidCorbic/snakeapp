(() => {
  "use strict";
  const bootMenu = document.querySelector("#bootMenu");
  const app = document.querySelector("#app");
  const startBtn = document.querySelector("#bootStart");
  const howBtn = document.querySelector("#bootHow");
  const optionsBtn = document.querySelector("#bootOptions");
  const dailyBtn = document.querySelector("#bootDaily");
  const endlessBtn = document.querySelector("#bootEndless");
  const funBtn = document.querySelector("#bootFun");
  const howPanel = document.querySelector("#bootHowPanel");
  const optionsPanel = document.querySelector("#bootOptionsPanel");
  const howBack = document.querySelector("#bootHowBack");
  const optionsBack = document.querySelector("#bootOptionsBack");
  const gridToggle = document.querySelector("#bootGrid");
  const vibrationToggle = document.querySelector("#bootVibration");
  const motionToggle = document.querySelector("#bootMotion");
  const soundToggle = document.querySelector("#bootSound");
  const musicToggle = document.querySelector("#bootMusic");
  const crtToggle = document.querySelector("#bootCrt");
  const contrastToggle = document.querySelector("#bootContrast");
  const timerToggle = document.querySelector("#bootTimer");
  const homeClockToggle = document.querySelector("#bootHomeClock");
  const xpToggle = document.querySelector("#bootXp");
  const intelToggle = document.querySelector("#bootIntel");
  const missionsToggle = document.querySelector("#bootMissions");
  const abilitiesToggle = document.querySelector("#bootAbilities");
  const touchToggle = document.querySelector("#bootTouch");
  const autoPauseToggle = document.querySelector("#bootAutoPause");
  const fxToggle = document.querySelector("#bootFx");
  const radarToggle = document.querySelector("#bootRadar");
  const enemyDetailsToggle = document.querySelector("#bootEnemyDetails");
  const volumeSlider = document.querySelector("#bootVolume");
  const volumeValue = document.querySelector("#bootVolumeValue");
  const fullscreenBtn = document.querySelector("#bootFullscreen");
  const resetSettingsBtn = document.querySelector("#bootResetSettings");
  const resetRankBtn = document.querySelector("#bootResetRank");
  const rankProfile = document.querySelector("#bootRankProfile");
  const settingsState = document.querySelector("#bootSettingsState");
  const versionLabel = document.querySelector("#bootGameVersion");
  const bootClock = document.querySelector("#bootClock");
  const GAME_VERSION = "2.0.0";
  const landingBest = document.querySelector("#landingBest");
  const landingLastMode = document.querySelector("#landingLastMode");
  const landingAudioState = document.querySelector("#landingAudioState");
  const errorPanel = document.querySelector("#bootError");
  const errorText = document.querySelector("#bootErrorText");
  const retryBtn = document.querySelector("#bootErrorRetry");
  const settingsKey = "snake-evolution-settings";
  const defaults = {
    grid:true,
    vibration:true,
    reducedMotion:false,
    crt:true,
    highContrast:false,
    showTimer:true,
    homeClock:true,
    showXp:true,
    showIntel:true,
    showMissions:true,
    showAbilities:true,
    touchControls:true,
    autoPause:true,
    threatRadar:true,
    enemyDetails:true,
    snakeColor:"#79e35b",
    combatFx:true,
    sound:true,
    music:true,
    volume:65
  };
  let settings = {...defaults};
  let gameLoaded = false;
  let gameLoading = false;
  let bootFailed = false;
  let musicContext = null;
  let musicGain = null;
  let musicTimer = null;
  let musicStep = 0;

  try { settings = {...defaults, ...JSON.parse(localStorage.getItem(settingsKey) || "{}")}; } catch {}

  const updateBootClock = () => {
    if (!bootClock) return;
    const now = new Date();
    const pad = value => String(value).padStart(2, "0");
    bootClock.textContent = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
  };
  updateBootClock();
  window.setInterval(updateBootClock, 1000);

  const hidePanels = () => {
    howPanel?.classList.add("hidden");
    optionsPanel?.classList.add("hidden");
    ["#bootCardDeckPanel","#bootBadgePanel","#bootAchievementPanel"].forEach(selector=>document.querySelector(selector)?.classList.add("hidden"));
  };

  const applyVisualSettings = () => {
    document.documentElement.classList.toggle("reduced-motion", !!settings.reducedMotion);
    document.body.classList.toggle("no-crt", !settings.crt);
    document.body.classList.toggle("high-contrast", !!settings.highContrast);
  };

  const renderLandingProfile = () => {
    try {
      const best = Number(localStorage.getItem("snake-evolution-best") || 0);
      if (landingBest) landingBest.textContent = best.toLocaleString();
      const last = localStorage.getItem("snake-evolution-mode");
      if (landingLastMode) landingLastMode.textContent = last === "party" ? "PARTY RUN" : "STANDARD";
    } catch {}
    if (landingAudioState) landingAudioState.textContent = settings.music && settings.volume > 0 ? "NEON DRIVE" : "SOUND OFF";
  };

  const renderSettings = () => {
    [[gridToggle,"grid"],[vibrationToggle,"vibration"],[motionToggle,"reducedMotion"],[crtToggle,"crt"],[contrastToggle,"highContrast"],[timerToggle,"showTimer"],[homeClockToggle,"homeClock"],[xpToggle,"showXp"],[intelToggle,"showIntel"],[missionsToggle,"showMissions"],[abilitiesToggle,"showAbilities"],[touchToggle,"touchControls"],[autoPauseToggle,"autoPause"],[radarToggle,"threatRadar"],[enemyDetailsToggle,"enemyDetails"],[fxToggle,"combatFx"],[soundToggle,"sound"],[musicToggle,"music"]].forEach(([button,key]) => {
      if (!button) return;
      button.textContent = settings[key] ? "ON" : "OFF";
      button.setAttribute("aria-pressed", String(!!settings[key]));
    });
    if (volumeSlider) volumeSlider.value = String(settings.volume ?? 65);
    if (volumeValue) volumeValue.textContent = String(settings.volume ?? 65) + "%";
    if (rankProfile) {
      try {
        const best = Number(localStorage.getItem("snake-evolution-best") || 0);
        const save = JSON.parse(localStorage.getItem("snake-evolution-save") || "{}");
        rankProfile.textContent = "BEST " + best.toLocaleString() + " · RUNS " + Number(save.runs || 0);
      } catch {
        rankProfile.textContent = "BEST 0 · RUNS 0";
      }
    }
    if (settingsState) settingsState.textContent = "READY";
    applyVisualSettings();
    const savedColor = /^#[0-9a-f]{6}$/i.test(String(settings.snakeColor || "")) ? settings.snakeColor : "#79e35b";
    document.documentElement.style.setProperty("--snake-color", savedColor);
  };

  // NEON DRIVE // softer 16-bit synthwave loop, 112 BPM, designed for menu + run.
  const getMusicVolume = () => Math.max(0,Math.min(1,(Number(settings.volume ?? 65)/100)*0.075));
  // Slower layered synthwave loop: minor-key pads, arpeggiated lead, warm bass and restrained percussion.
  let leadNotes = [587.33,698.46,880,0,783.99,698.46,587.33,523.25,659.25,0,783.99,987.77,880,783.99,659.25,523.25];
  let bassNotes = [73.42,73.42,110,110,65.41,65.41,98,98];
  let chordSets = [[146.83,174.61,220,261.63],[130.81,155.56,196,233.08],[164.81,196,246.94,293.66],[130.81,155.56,196,233.08]];
  let musicStarting=false;
  window.__snakeMusicSetPattern = pattern => {
    if (!pattern || !Array.isArray(pattern.lead) || !Array.isArray(pattern.bass) || !Array.isArray(pattern.chords)) return;
    leadNotes = pattern.lead.slice();
    bassNotes = pattern.bass.slice();
    chordSets = pattern.chords.map(chord => chord.slice());
    if (musicTimer) stopMusic();
    if (settings.music && settings.volume > 0) startMusic();
  };
  window.dispatchEvent(new CustomEvent("snake-evolution-music-ready"));

  const playMusicTone = (frequency,duration=.2,type="triangle",level=.38) => {
    if(!musicContext || !musicGain || !settings.music || settings.volume<=0) return;
    const now=musicContext.currentTime;
    const oscillator=musicContext.createOscillator();
    const gain=musicContext.createGain();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(frequency,now);
    gain.gain.setValueAtTime(0.0001,now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001,getMusicVolume()*level),now+0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001,now+duration);
    oscillator.connect(gain);gain.connect(musicGain);
    oscillator.start(now);oscillator.stop(now+duration+0.03);
  };

  const playMusicKick = () => {
    if(!musicContext || !musicGain || !settings.music || settings.volume<=0) return;
    const now=musicContext.currentTime;
    const oscillator=musicContext.createOscillator();
    const gain=musicContext.createGain();
    oscillator.type="sine";
    oscillator.frequency.setValueAtTime(110,now);
    oscillator.frequency.exponentialRampToValueAtTime(55,now+.08);
    gain.gain.setValueAtTime(0.0001,now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001,getMusicVolume()*.2),now+.008);
    gain.gain.exponentialRampToValueAtTime(0.0001,now+.09);
    oscillator.connect(gain);gain.connect(musicGain);
    oscillator.start(now);oscillator.stop(now+.11);
  };

  const scheduleMusic = () => {
    if(!musicContext || musicTimer || !settings.music || settings.volume<=0) return;
    musicStep=0;
    const tick=()=>{
      if(!musicContext || !settings.music || settings.volume<=0){musicTimer=null;return}
      const beat=musicStep%32;
      const step=beat%16;
      const note=leadNotes[step];
      if(note>0 && beat%2===0) playMusicTone(note,.24,"triangle",.32);
      if(beat%4===0) playMusicTone(bassNotes[Math.floor(beat/4)%bassNotes.length],.34,"sine",.22);
      if(beat%8===0){
        const chord=chordSets[Math.floor(beat/8)%chordSets.length];
        chord.forEach((f,i)=>playMusicTone(f,.72,"sine",i===0?.045:i===2?.035:.025));
        playMusicKick();
      } else if(beat%4===2) {
        playMusicTone(1760,.045,"sine",.018);
      }
      if(note>0 && beat%4===2) playMusicTone(note*2,.075,"triangle",.07);
      musicStep++;
      musicTimer=setTimeout(tick,142);
    };
    tick();
  };

  const startMusic = () => {
    if(!settings.music || settings.volume<=0) return;
    if(musicStarting || musicTimer) return;
    musicStarting=true;
    try {
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC){musicStarting=false;return}
      if(!musicContext) {
        musicContext=new AC();
        musicGain=musicContext.createGain();
        musicGain.gain.value=1;
        musicGain.connect(musicContext.destination);
      }
      const resume=musicContext.state==="suspended" ? musicContext.resume() : Promise.resolve();
      Promise.resolve(resume).then(()=>{
        musicStarting=false;
        if(musicContext?.state==="running") scheduleMusic();
      }).catch(()=>{musicStarting=false});
    } catch { musicStarting=false }
  };

  const stopMusic = () => {
    if(musicTimer){clearTimeout(musicTimer);musicTimer=null}
  };

  const saveSettings = () => {
    try { localStorage.setItem(settingsKey, JSON.stringify(settings)); } catch {}
    renderSettings();
    document.dispatchEvent(new CustomEvent("snake-evolution-settings-changed",{detail:{...settings}}));
    if (settings.music && settings.volume > 0) startMusic(); else stopMusic();
  };
  document.addEventListener("snake-evolution-external-settings-changed", event => {
    if (!event.detail || typeof event.detail !== "object") return;
    settings = {...settings, ...event.detail};
    try { localStorage.setItem(settingsKey, JSON.stringify(settings)); } catch {}
    renderSettings();
    document.dispatchEvent(new CustomEvent("snake-evolution-settings-changed", {detail:{...settings}}));
  });

  const showBootMenu = () => {
    app?.classList.add("preboot");
    document.body.classList.add("boot-open");
    bootMenu?.classList.remove("hidden");
    errorPanel?.classList.add("hidden");
    hidePanels();
    renderSettings();
    renderLandingProfile();
  };

  const failLoad = (detail) => {
    gameLoading = false;
    document.body.classList.add("boot-open");
    bootMenu?.classList.remove("hidden");
    hidePanels();
    errorPanel?.classList.remove("hidden");
    if (errorText) errorText.textContent = detail || "GAME BOOT FAILED";
  };

  // Keep the visual achievement deck off the critical gameplay bootstrap path.
  // If the optional collection UI fails, the game must still start normally.
  const loadAchievementDeck = () => {
    if (window.__snakeAchievementDeckV2 || document.getElementById("snakeHudAchievementDeckScript")) return;
    const deck = document.createElement("script");
    deck.id = "snakeHudAchievementDeckScript";
    deck.src = "hud-achievement-deck-v2.js?v=hud-deck-v4";
    deck.async = true;
    deck.onerror = () => console.warn("[Snake Evolution] Achievement deck failed to load; gameplay will continue.");
    document.body.appendChild(deck);
  };

  const startLoadedMode = (mode) => {
    const method = mode === "daily" ? "startDaily" : mode === "endless" ? "startEndless" : mode === "party" ? "startParty" : "start";
    if (mode === "party") { try { localStorage.setItem("snake-evolution-mode","party"); } catch {} }
    else { try { localStorage.setItem("snake-evolution-mode","standard"); } catch {} }
    const api = window.SnakeEvolution;
    if (!api || typeof api[method] !== "function") throw new Error("GAME MODE API NOT READY: " + method);
    return api[method]();
  };

  // Single source of truth for gameplay dependencies and their cache versions.
  const GAMEPLAY_SCRIPT_LAYERS = Object.freeze([
    { id: "snakeGameScript", src: "game.js?v=arcade-v28", failure: "GAME SCRIPT COULD NOT LOAD" },
    { id: "snakeUltimateScript", src: "ultimate-gameplay-v1.js?v=ultimate-v16", failure: "ULTIMATE GAMEPLAY LAYER COULD NOT LOAD" },
    { id: "snakeGameplayUpdateV2", src: "gameplay-update-v2.js?v=update-v15", failure: "GAMEPLAY UPDATE PACK COULD NOT LOAD" },
    { id: "snakeArcadePolishV1", src: "arcade-polish-v1.js?v=arcade-v3", failure: "ARCADE POLISH LAYER COULD NOT LOAD" },
    { id: "snakeReworkV2", src: "snake-rework-v2.js?v=rework-v6", failure: "REWORK PRESENTATION LAYER COULD NOT LOAD" },
    { id: "snakeQualityGameplayScript", src: "quality-gameplay-v1.js?v=quality-v3", failure: "GAMEPLAY QUALITY LAYER COULD NOT LOAD" }
  ]);

  const appendGameplayLayer = layer => new Promise((resolve, reject) => {
    if (document.getElementById(layer.id)) {
      reject(new Error("PARTIAL GAME BOOTSTRAP DETECTED — RELOAD REQUIRED"));
      return;
    }
    const script = document.createElement("script");
    script.id = layer.id;
    script.src = layer.src;
    script.async = false;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(layer.failure));
    document.body.appendChild(script);
  });

  const loadGame = async (mode="normal") => {
    hidePanels();
    if (gameLoaded) {
      bootMenu?.classList.add("hidden");
      document.body.classList.remove("boot-open");
      app?.classList.remove("preboot");
      startLoadedMode(mode);
      return;
    }
    if (gameLoading) return;
    if (document.getElementById("snakeGameScript")) {
      window.location.reload();
      return;
    }
    gameLoading = true;
    bootFailed = false;
    bootMenu?.classList.add("hidden");
    document.body.classList.remove("boot-open");
    app?.classList.remove("preboot");

    const cleanupBootListeners = () => {
      window.removeEventListener("error", onRuntimeError);
      window.removeEventListener("unhandledrejection", onRuntimeRejection);
    };
    const onRuntimeError = event => {
      if (!gameLoading) return;
      bootFailed = true;
      cleanupBootListeners();
      failLoad("GAME BOOT ERROR: " + (event.message || "unknown runtime error"));
    };
    const onRuntimeRejection = event => {
      if (!gameLoading) return;
      bootFailed = true;
      cleanupBootListeners();
      failLoad("GAME BOOT ERROR: " + (event.reason?.message || String(event.reason || "unhandled rejection")));
    };
    window.addEventListener("error", onRuntimeError);
    window.addEventListener("unhandledrejection", onRuntimeRejection);

    try {
      for (const layer of GAMEPLAY_SCRIPT_LAYERS) {
        await appendGameplayLayer(layer);
        if (bootFailed) return;

        if (layer.id === "snakeGameScript" && typeof window.SnakeEvolution?.start !== "function") {
          throw new Error("GAME BOOT ERROR: CORE START API NOT READY");
        }
        if (layer.id === "snakeUltimateScript" && typeof window.SnakeEvolution?.start !== "function") {
          throw new Error("GAME BOOT ERROR: ADVANCED START API NOT READY");
        }
        if (layer.id === "snakeArcadePolishV1") {
          try {
            window.SnakeArcadePolish?.start?.();
          } catch (error) {
            throw new Error("GAME BOOT ERROR: ARCADE POLISH INIT FAILED — " + (error?.message || "unknown error"));
          }
        }
      }

      try {
        startLoadedMode(mode);
      } catch (error) {
        throw new Error("GAME BOOT ERROR: GAME START FAILED — " + (error?.message || "unknown start error"));
      }
      cleanupBootListeners();
      gameLoading = false;
      gameLoaded = true;
      loadAchievementDeck();
    } catch (error) {
      cleanupBootListeners();
      if (bootFailed) return;
      failLoad(error?.message || "GAME BOOT FAILED");
    }
  };

  [startBtn,dailyBtn,endlessBtn,funBtn,howBtn,optionsBtn].forEach(button=>button?.addEventListener("click",()=>startMusic(),{once:true}));
  startBtn?.addEventListener("click", () => loadGame("normal"));
  dailyBtn?.addEventListener("click", () => { try { localStorage.setItem("snake-evolution-mode","standard"); } catch {} loadGame("daily"); });
  endlessBtn?.addEventListener("click", () => { try { localStorage.setItem("snake-evolution-mode","standard"); } catch {} loadGame("endless"); });
  funBtn?.addEventListener("click", () => { try { localStorage.setItem("snake-evolution-mode","party"); } catch {} loadGame("party"); });
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
  retryBtn?.addEventListener("click", () => window.location.reload());

  // Visual-only menu feedback. Existing menu handlers remain unchanged.
  const menuAnimationMap = {
    bootStart: "menu-tap-launch",
    bootFun: "menu-tap-chaos",
    bootDaily: "menu-tap-daily",
    bootEndless: "menu-tap-endless",
    bootHow: "menu-tap-panel",
    bootOptions: "menu-tap-console",
    bootOptionsBack: "menu-tap-back",
    bootCardDeck: "menu-tap-meta",
    bootBadgeArchive: "menu-tap-meta",
    bootAutoAchievements: "menu-tap-meta",
    bootCardDeckBack: "menu-tap-back",
    bootBadgeBack: "menu-tap-back",
    bootAchievementsBack: "menu-tap-back",
    bootFullscreen: "menu-tap-meta",
    bootResetSettings: "menu-tap-meta",
    bootResetRank: "menu-tap-meta",
    bootGrid: "menu-tap-toggle",
    bootVibration: "menu-tap-toggle",
    bootMotion: "menu-tap-toggle",
    bootCrt: "menu-tap-toggle",
    bootContrast: "menu-tap-toggle",
    bootTimer: "menu-tap-toggle",
    bootHomeClock: "menu-tap-toggle",
    bootXp: "menu-tap-toggle",
    bootIntel: "menu-tap-toggle",
    bootMissions: "menu-tap-toggle",
    bootAbilities: "menu-tap-toggle",
    bootTouch: "menu-tap-toggle",
    bootAutoPause: "menu-tap-toggle",
    bootRadar: "menu-tap-toggle",
    bootEnemyDetails: "menu-tap-toggle",
    bootFx: "menu-tap-toggle",
    bootSound: "menu-tap-toggle",
    bootMusic: "menu-tap-toggle"
  };
  document.querySelectorAll("#bootMenu button").forEach(button => {
    button.addEventListener("click", () => {
      const className = menuAnimationMap[button.id] || "menu-tap-fallback";
      button.classList.remove(
        "menu-tap","menu-tap-launch","menu-tap-chaos","menu-tap-daily",
        "menu-tap-endless","menu-tap-panel","menu-tap-console",
        "menu-tap-toggle","menu-tap-back","menu-tap-meta","menu-tap-fallback"
      );
      void button.offsetWidth;
      button.classList.add("menu-tap", className);
      window.setTimeout(() => button.classList.remove("menu-tap", className), 650);
    });
  });

  gridToggle?.addEventListener("click", () => { settings.grid=!settings.grid; saveSettings(); });
  vibrationToggle?.addEventListener("click", () => { settings.vibration=!settings.vibration; saveSettings(); });
  motionToggle?.addEventListener("click", () => { settings.reducedMotion=!settings.reducedMotion; saveSettings(); });
  soundToggle?.addEventListener("click", () => {
    settings.sound=!settings.sound;
    try { localStorage.setItem("snake-evolution-sound", settings.sound ? "on" : "off"); } catch {}
    saveSettings();
  });
  musicToggle?.addEventListener("click", () => { settings.music=!settings.music; saveSettings(); });
  crtToggle?.addEventListener("click", () => { settings.crt=!settings.crt; saveSettings(); });
  contrastToggle?.addEventListener("click", () => { settings.highContrast=!settings.highContrast; saveSettings(); });
  timerToggle?.addEventListener("click", () => { settings.showTimer=!settings.showTimer; saveSettings(); });
  homeClockToggle?.addEventListener("click", () => { settings.homeClock=!settings.homeClock; saveSettings(); });
  xpToggle?.addEventListener("click", () => { settings.showXp=!settings.showXp; saveSettings(); });
  intelToggle?.addEventListener("click", () => { settings.showIntel=!settings.showIntel; saveSettings(); });
  missionsToggle?.addEventListener("click", () => { settings.showMissions=!settings.showMissions; saveSettings(); });
  abilitiesToggle?.addEventListener("click", () => { settings.showAbilities=!settings.showAbilities; saveSettings(); });
  touchToggle?.addEventListener("click", () => { settings.touchControls=!settings.touchControls; saveSettings(); });
  autoPauseToggle?.addEventListener("click", () => { settings.autoPause=!settings.autoPause; saveSettings(); });
  radarToggle?.addEventListener("click", () => { settings.threatRadar=!settings.threatRadar; saveSettings(); });
  enemyDetailsToggle?.addEventListener("click", () => { settings.enemyDetails=!settings.enemyDetails; saveSettings(); });
  fxToggle?.addEventListener("click", () => { settings.combatFx=!settings.combatFx; saveSettings(); });
  volumeSlider?.addEventListener("input", () => {
    settings.volume=Number(volumeSlider.value)||0;
    if(volumeValue) volumeValue.textContent=settings.volume+"%";
    saveSettings();
  });
  fullscreenBtn?.addEventListener("click", async () => {
    try {
      if(!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
      else await document.exitFullscreen?.();
    } catch {}
  });
  resetSettingsBtn?.addEventListener("click", () => {
    settings={...defaults};
    saveSettings();
    try { localStorage.removeItem("snake-evolution-sound"); } catch {}
  });
  resetRankBtn?.addEventListener("click", () => {
    const keys=[
      "snake-evolution-best",
      "snake-evolution-save",
      "snake-evolution-leaderboard",
      "snake-evolution-daily-leaderboard",
      "snake-evolution-ghost",
      "snake-evolution-ghost-best",
      "snake-evolution-ghost-meta",
      "snake-evolution-daily-ghost",
      "snake-evolution-daily-ghost-best",
      "snake-evolution-daily-ghost-meta"
    ];
    keys.forEach(key=>{try{localStorage.removeItem(key)}catch{}});
    try{window.SnakeEvolution?.resetRank?.()}catch{}
    renderLandingProfile();
    if(settingsState)settingsState.textContent="RANK // RESET";
    if(rankProfile)rankProfile.textContent="BEST 0 · RUNS 0";
    window.setTimeout(()=>{if(settingsState)settingsState.textContent="READY"},1200);
  });

  const blockPageCopy = () => {
    const block = (event) => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };
    ["contextmenu","selectstart","dragstart","copy","cut","paste"].forEach(type => {
      document.addEventListener(type, block, true);
    });
    document.addEventListener("keydown", (event) => {
      const key = String(event.key || "").toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ["a","c","x","v","s","u"].includes(key)) {
        block(event);
      }
    }, true);
  };
  blockPageCopy();

  window.showBootMenu = showBootMenu;
  if(versionLabel) versionLabel.textContent = "V"+GAME_VERSION;
  document.body.classList.add("boot-open");
  renderSettings();
  if (settings.music) startMusic();
  renderLandingProfile();
  if (settings.sound === false) { try { localStorage.setItem("snake-evolution-sound", "off"); } catch {} }
  showBootMenu();
})();