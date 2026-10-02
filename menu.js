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
  const musicToggle = document.querySelector("#bootMusic");
  const crtToggle = document.querySelector("#bootCrt");
  const contrastToggle = document.querySelector("#bootContrast");
  const volumeSlider = document.querySelector("#bootVolume");
  const volumeValue = document.querySelector("#bootVolumeValue");
  const fullscreenBtn = document.querySelector("#bootFullscreen");
  const resetSettingsBtn = document.querySelector("#bootResetSettings");
  const settingsState = document.querySelector("#bootSettingsState");
  const versionLabel = document.querySelector("#bootGameVersion");
  const GAME_VERSION = "1.10.0";
  const errorPanel = document.querySelector("#bootError");
  const errorText = document.querySelector("#bootErrorText");
  const retryBtn = document.querySelector("#bootErrorRetry");
  const settingsKey = "snake-evolution-settings";
  const defaults = {grid:true,vibration:true,reducedMotion:false,crt:true,highContrast:false,sound:true,music:true,volume:65};
  let settings = {...defaults};
  let gameLoaded = false;
  let gameLoading = false;
  let bootFailed = false;
  let musicContext = null;
  let musicGain = null;
  let musicTimer = null;
  let musicStep = 0;

  try { settings = {...defaults, ...JSON.parse(localStorage.getItem(settingsKey) || "{}")}; } catch {}

  const hidePanels = () => {
    howPanel?.classList.add("hidden");
    optionsPanel?.classList.add("hidden");
  };

  const applyVisualSettings = () => {
    document.documentElement.classList.toggle("reduced-motion", !!settings.reducedMotion);
    document.body.classList.toggle("no-crt", !settings.crt);
    document.body.classList.toggle("high-contrast", !!settings.highContrast);
  };

  const renderSettings = () => {
    [[gridToggle,"grid"],[vibrationToggle,"vibration"],[motionToggle,"reducedMotion"],[crtToggle,"crt"],[contrastToggle,"highContrast"],[soundToggle,"sound"],[musicToggle,"music"]].forEach(([button,key]) => {
      if (!button) return;
      button.textContent = settings[key] ? "ON" : "OFF";
      button.setAttribute("aria-pressed", String(!!settings[key]));
    });
    if (volumeSlider) volumeSlider.value = String(settings.volume ?? 65);
    if (volumeValue) volumeValue.textContent = String(settings.volume ?? 65) + "%";
    if (settingsState) settingsState.textContent = "LOCAL // SAVED";
    applyVisualSettings();
  };

  const getMusicVolume = () => Math.max(0,Math.min(1,(Number(settings.volume ?? 65)/100)*0.09));
  const musicNotes = [196,246.94,293.66,392,293.66,261.63,220,293.66,196,246.94,329.63,392,349.23,293.66,246.94,220];
  const bassNotes = [98,98,130.81,130.81,110,110,87.31,87.31];
  const playMusicTone = (frequency,duration=.22,type="square",level=.45,octave=1) => {
    if(!musicContext || !settings.music || settings.volume<=0) return;
    const now=musicContext.currentTime;
    const oscillator=musicContext.createOscillator();
    const gain=musicContext.createGain();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(frequency*octave,now);
    gain.gain.setValueAtTime(0.0001,now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001,getMusicVolume()*level),now+0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001,now+duration);
    oscillator.connect(gain);gain.connect(musicGain);
    oscillator.start(now);oscillator.stop(now+duration+0.03);
  };
  const startMusic = () => {
    if(!settings.music || settings.volume<=0) return;
    try {
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      if(!musicContext) {
        musicContext=new AC();
        musicGain=musicContext.createGain();
        musicGain.gain.value=1;
        musicGain.connect(musicContext.destination);
      }
      if(musicContext.state==="suspended") musicContext.resume().catch(()=>{});
      if(musicTimer) return;
      musicStep=0;
      const tick=()=>{
        if(!settings.music || settings.volume<=0){musicTimer=null;return}
        const note=musicNotes[musicStep%musicNotes.length];
        playMusicTone(note,.19,"square",.32,1);
        if(musicStep%2===0) playMusicTone(bassNotes[Math.floor(musicStep/2)%bassNotes.length],.34,"triangle",.22,1);
        if(musicStep%4===0) playMusicTone(note*2,.08,"sine",.12,1);
        musicStep++;
        musicTimer=setTimeout(tick,230);
      };
      tick();
    } catch {}
  };
  const stopMusic = () => {
    if(musicTimer){clearTimeout(musicTimer);musicTimer=null}
  };

  const saveSettings = () => {
    try { localStorage.setItem(settingsKey, JSON.stringify(settings)); } catch {}
    renderSettings();
    if (settings.music) startMusic(); else stopMusic();
  };

  const showBootMenu = () => {
    app?.classList.add("preboot");
    document.body.classList.add("boot-open");
    bootMenu?.classList.remove("hidden");
    errorPanel?.classList.add("hidden");
    hidePanels();
    renderSettings();
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
    else window.SnakeEvolution?.start?.();
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
    script.src = "game.js?v=survival-v10";
    script.onload = () => {
      if (bootFailed) return;
      const ultimate = document.createElement("script");
      ultimate.id = "snakeUltimateScript";
      ultimate.src = "ultimate-gameplay-v1.js?v=ultimate-v7";
      ultimate.onload = () => {
        if (bootFailed) return;
        const update = document.createElement("script");
        update.id = "snakeGameplayUpdateV2";
        update.src = "gameplay-update-v2.js?v=update-v7";
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

  [startBtn,dailyBtn,endlessBtn,howBtn,optionsBtn].forEach(button=>button?.addEventListener("click",()=>startMusic(),{once:true}));
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
  soundToggle?.addEventListener("click", () => {
    settings.sound=!settings.sound;
    try { localStorage.setItem("snake-evolution-sound", settings.sound ? "on" : "off"); } catch {}
    saveSettings();
  });
  musicToggle?.addEventListener("click", () => { settings.music=!settings.music; saveSettings(); });
  crtToggle?.addEventListener("click", () => { settings.crt=!settings.crt; saveSettings(); });
  contrastToggle?.addEventListener("click", () => { settings.highContrast=!settings.highContrast; saveSettings(); });
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
  if (settings.sound === false) { try { localStorage.setItem("snake-evolution-sound", "off"); } catch {} }
  showBootMenu();
})();