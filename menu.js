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
  const volumeSlider = document.querySelector("#bootVolume");
  const volumeValue = document.querySelector("#bootVolumeValue");
  const fullscreenBtn = document.querySelector("#bootFullscreen");
  const resetSettingsBtn = document.querySelector("#bootResetSettings");
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
    [[gridToggle,"grid"],[vibrationToggle,"vibration"],[motionToggle,"reducedMotion"],[crtToggle,"crt"],[contrastToggle,"highContrast"],[timerToggle,"showTimer"],[homeClockToggle,"homeClock"],[xpToggle,"showXp"],[intelToggle,"showIntel"],[missionsToggle,"showMissions"],[abilitiesToggle,"showAbilities"],[touchToggle,"touchControls"],[autoPauseToggle,"autoPause"],[fxToggle,"combatFx"],[soundToggle,"sound"],[musicToggle,"music"]].forEach(([button,key]) => {
      if (!button) return;
      button.textContent = settings[key] ? "ON" : "OFF";
      button.setAttribute("aria-pressed", String(!!settings[key]));
    });
    if (volumeSlider) volumeSlider.value = String(settings.volume ?? 65);
    if (volumeValue) volumeValue.textContent = String(settings.volume ?? 65) + "%";
    if (settingsState) settingsState.textContent = "LOCAL // SAVED";
    applyVisualSettings();
  };

  // NEON DRIVE // softer 16-bit synthwave loop, 112 BPM, designed for menu + run.
  const getMusicVolume = () => Math.max(0,Math.min(1,(Number(settings.volume ?? 65)/100)*0.075));
  const leadNotes = [440,523.25,587.33,659.25,587.33,523.25,493.88,440,392,493.88,523.25,587.33,659.25,587.33,523.25,493.88];
  const bassNotes = [110,110,146.83,146.83,98,98,130.81,130.81];
  const chordSets = [[220,261.63,329.63],[196,246.94,293.66],[174.61,220,261.63],[196,246.94,329.63]];
  let musicStarting=false;

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
      const beat=musicStep%16;
      const note=leadNotes[beat];
      playMusicTone(note,.17,"triangle",.42);
      if(beat%2===0) playMusicTone(bassNotes[Math.floor(beat/2)%bassNotes.length],.3,"sawtooth",.16);
      if(beat%4===0){
        const chord=chordSets[Math.floor(beat/4)%chordSets.length];
        chord.forEach((f,i)=>playMusicTone(f,.42,"sine",i===1?.06:.045));
        playMusicKick();
      } else if(beat%2===1) {
        playMusicTone(note*2,.055,"square",.035);
      }
      musicStep++;
      musicTimer=setTimeout(tick,134);
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

  const startLoadedMode = (mode) => {
    if (mode === "daily") window.SnakeEvolution?.startDaily?.();
    else if (mode === "endless") window.SnakeEvolution?.startEndless?.();
    else { if (mode === "party") { try { localStorage.setItem("snake-evolution-mode","party"); } catch {} } else { try { localStorage.setItem("snake-evolution-mode","standard"); } catch {} } window.SnakeEvolution?.start?.(); }
  };

  const loadGame = (mode="normal") => {
    hidePanels();
    if (gameLoaded) {
      bootMenu?.classList.add("hidden");
      document.body.classList.remove("boot-open");
      app?.classList.remove("preboot");
      startLoadedMode(mode);
      return;
    }
    if (gameLoading) return;
    gameLoading = true;
    bootFailed = false;
    bootMenu?.classList.add("hidden");
    document.body.classList.remove("boot-open");
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
    script.src = "game.js?v=survival-v16";
    script.onload = () => {
      if (bootFailed) return;
      const ultimate = document.createElement("script");
      ultimate.id = "snakeUltimateScript";
      ultimate.src = "ultimate-gameplay-v1.js?v=ultimate-v8";
      ultimate.onload = () => {
        if (bootFailed) return;
        const update = document.createElement("script");
        update.id = "snakeGameplayUpdateV2";
        update.src = "gameplay-update-v2.js?v=update-v8";
        update.onload = () => {
          if (bootFailed) return;
          const polish = document.createElement("script");
          polish.id = "snakeArcadePolishV1";
          polish.src = "arcade-polish-v1.js?v=arcade-v2";
          polish.onload = () => {
            if (bootFailed) return;
            window.removeEventListener("error", onRuntimeError);
            gameLoading = false;
            gameLoaded = true;
            window.SnakeArcadePolish?.start?.();
            const rework = document.createElement("script");
            rework.id = "snakeReworkV2";
            rework.src = "snake-rework-v2.js?v=rework-v3";
            rework.onload = () => startLoadedMode(mode);
            rework.onerror = () => failLoad("REWORK PRESENTATION LAYER COULD NOT LOAD");
            document.body.appendChild(rework);
          };
          polish.onerror = () => {
            window.removeEventListener("error", onRuntimeError);
            failLoad("ARCADE POLISH LAYER COULD NOT LOAD");
          };
          document.body.appendChild(polish);
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