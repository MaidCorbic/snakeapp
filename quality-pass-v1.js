/* SNAKE EVOLUTION — menu quality pass */
(() => {
  "use strict";
  if (window.__snakeQualityMenuV1) return;
  window.__snakeQualityMenuV1 = true;
  const SETTINGS_KEY = "snake-evolution-settings";
  const colors = [
    ["Neon green","#79e35b"],["Arcade gold","#ffd85c"],["Cyber blue","#62cfff"],
    ["Violet","#a66cff"],["Coral","#ff6b8b"],["Ice mint","#4de1d1"]
  ];
  const readSettings = () => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {}; } catch { return {}; } };
  const validColor = value => /^#[0-9a-f]{6}$/i.test(String(value || ""));
  function runtimeStyle() {
    if (document.querySelector("#seQualityPassStyle")) return;
    const style = document.createElement("style");
    style.id = "seQualityPassStyle";
    style.textContent = "/* SNAKE EVOLUTION — quality pass visuals */\n.se-hub-mark{display:none!important}\n.se-hub-head{gap:18px!important}\n.se-hub-head>div{min-width:0}\n.se-hub-description{max-width:640px;line-height:1.8}\n.boot-topline{position:relative!important;min-height:46px;align-items:center!important}\n.boot-topline>.eyebrow{flex:0 0 auto}\n.boot-top-meta{flex:1 1 auto;min-width:0;justify-content:flex-end!important}\n#bootVersion{white-space:nowrap;flex:0 0 auto}\n#bootClock{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;z-index:4;white-space:nowrap}\n.boot-brief .brief-controls{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:9px!important;align-items:stretch!important;padding:12px!important}\n.boot-brief .brief-controls::before{grid-column:1/-1}\n.brief-control-chip{display:flex;flex-direction:column;align-items:flex-start;gap:7px;min-width:0;padding:10px;border:1px solid #334b38;border-radius:8px;background:linear-gradient(145deg,#0d1911,#080d09)}\n.brief-control-chip b{font:600 6px/1.5 system-ui,sans-serif;letter-spacing:1px;color:#9fbc9f}\n.brief-control-keys{display:flex;flex-wrap:wrap;gap:5px}\n.brief-control-chip kbd{padding:6px 7px!important;border:1px solid #3d6245!important;border-radius:5px!important;background:#0c180f!important;color:#dfffd6!important;font:6px \"Press Start 2P\",monospace!important}\n#bootOptionsPanel .options-grid{display:grid!important;grid-template-columns:1fr!important;gap:10px!important}\n#bootOptionsPanel .option-group{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 22px;min-width:0;padding:13px 16px;border:1px solid #273c2d;border-radius:10px;background:linear-gradient(145deg,#0c150f,#080d09)}\n#bootOptionsPanel .option-group-title{grid-column:1/-1;margin:0 0 7px;padding:0 0 10px;border-bottom:1px solid #26392b;color:#a9c9ac;font:600 7px/1.5 \"Press Start 2P\",monospace;letter-spacing:.5px}\n#bootOptionsPanel .options-grid .option-row{min-width:0;gap:12px;align-items:center}\n#bootOptionsPanel .option-row>div:first-child{min-width:0}\n#bootOptionsPanel .option-row>div:first-child b{font-size:7px!important;line-height:1.5!important;overflow-wrap:anywhere}\n#bootOptionsPanel .option-row>div:first-child small{font-size:5px!important;line-height:1.7!important}\n#bootOptionsPanel .option-group[aria-label=\"PROFILE & UTILITIES\"],#bootOptionsPanel .control-deck-profile-row{display:none!important}\n#bootOptionsPanel .snake-color-row{grid-column:1/-1;display:flex!important;align-items:center;justify-content:space-between;gap:16px!important;padding:12px 0!important;border-bottom:0!important}\n.snake-palette{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:8px;min-width:0}\n.snake-swatch{display:inline-grid;place-items:center;width:28px;height:28px;padding:0;border:2px solid #3b5440;border-radius:50%;background:var(--swatch)!important;cursor:pointer;box-shadow:0 3px 0 #020503;transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease}\n.snake-swatch:hover{transform:translateY(-2px)}\n.snake-swatch[aria-pressed=\"true\"]{border-color:#efffe8;box-shadow:0 0 0 2px #79e35b70,0 0 15px var(--swatch);transform:scale(1.08)}\n.snake-swatch>span{width:8px;height:8px;border-radius:50%;background:#f7fff3;opacity:0}\n.snake-swatch[aria-pressed=\"true\"]>span{opacity:1}\n#bootOptionsPanel .option-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}\n#bootOptionsPanel .option-actions .boot-action{min-width:0;white-space:normal;line-height:1.6}\n#seThreatStatus{display:grid;grid-template-columns:auto repeat(3,minmax(0,1fr));align-items:center;gap:8px;margin:9px 0 0;padding:10px 12px;border:1px solid #2a4432;border-radius:9px;background:linear-gradient(100deg,#0d1710,#080d09);color:#8da591;font:600 10px/1.4 system-ui,sans-serif;letter-spacing:.5px}\n#seThreatStatus .se-threat-heading{color:#cfe5d1;font:6px \"Press Start 2P\",monospace;letter-spacing:.3px;white-space:nowrap}\n#seThreatStatus .se-threat-stat{display:flex;justify-content:space-between;gap:8px;padding:5px 8px;border-left:1px solid #26392b;min-width:0}\n#seThreatStatus strong{color:#e7f4e8;font-variant-numeric:tabular-nums}\n#seThreatStatus .se-threat-hunters strong{color:#79d9ff}\n#seThreatStatus .se-threat-hazards strong{color:#ff7885}\n#seThreatStatus .se-threat-boss strong{color:#ffbb74}\nbody.se-hide-threat-radar #seThreatStatus{display:none!important}\n#achievementList.achievement-list{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;align-items:stretch}\n#achievements .achievement-item{display:flex!important;flex-direction:column;justify-content:flex-start;min-width:0;min-height:86px!important;height:auto!important;padding:11px!important;border-radius:8px!important;overflow:hidden;overflow-wrap:anywhere}\n#achievements .achievement-item b{font-size:6px!important;line-height:1.55!important;margin:0 0 7px!important;overflow-wrap:anywhere}\n#achievements .achievement-item span{font-size:5px!important;line-height:1.7!important;overflow-wrap:anywhere}\n#achievementList .ultimate-achievements{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;grid-column:1/-1}\n#achievementList .ultimate-achievements .achievement-item{min-height:86px!important}\n#achievementList .se-bonus-achievements{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}\n#achievementList .se-bonus-card{min-width:0;min-height:86px;padding:11px;border:1px solid #2d4432;border-radius:8px;background:linear-gradient(145deg,#0d1710,#080d09);overflow-wrap:anywhere}\n#achievementList .se-bonus-card strong{display:block;margin-bottom:7px;color:#a8d7a5;font:6px/1.6 \"Press Start 2P\",monospace}\n#achievementList .se-bonus-card small{display:block;color:#849b88;font:11px/1.6 system-ui,sans-serif}\n#achievementList .se-bonus-card.is-complete{border-color:#87743d;background:linear-gradient(145deg,#1c1b0f,#0c1009)}\n#achievementList .se-bonus-card.is-complete strong{color:#ffdf81}\n.se-tutorial-overlay{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:18px;background:rgba(2,5,3,.86);backdrop-filter:blur(9px)}\n.se-tutorial-card{width:min(680px,96vw);max-height:min(88dvh,760px);overflow:auto;padding:clamp(18px,3vw,30px);border:1px solid #557b56;border-top:3px solid #9eff7c;border-radius:14px;background:radial-gradient(circle at 50% 0%,#15261a,#070c09 65%);box-shadow:0 0 0 1px #0c160e,0 22px 80px #000b;color:#eaf6eb}\n.se-tutorial-eyebrow{margin:0 0 12px;color:#a6ff83;font:7px/1.8 \"Press Start 2P\",monospace;letter-spacing:1px}\n.se-tutorial-card h2{margin:0 0 10px;font:clamp(16px,3vw,25px)/1.4 \"Press Start 2P\",monospace;letter-spacing:.4px}\n.se-tutorial-card>p{margin:0 0 18px;color:#9eb4a1;font:14px/1.7 system-ui,sans-serif}\n.se-tutorial-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:0 0 18px}\n.se-tutorial-step{padding:12px;border:1px solid #2a4331;border-radius:8px;background:#09120c}\n.se-tutorial-step b{display:block;margin-bottom:8px;color:#c7efc2;font:6px/1.7 \"Press Start 2P\",monospace}\n.se-tutorial-step span{display:block;color:#90a893;font:12px/1.7 system-ui,sans-serif}\n.se-tutorial-keys{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 20px}\n.se-tutorial-keys kbd{padding:7px 9px;border:1px solid #405a44;border-radius:5px;background:#0a130c;color:#ddf5dd;font:10px system-ui,sans-serif}\n.se-tutorial-actions{display:flex;gap:10px}\n.se-tutorial-actions button{flex:1;min-height:44px;border:1px solid #629a5d;border-radius:8px;background:linear-gradient(#1d3b22,#102216);color:#dfffd6;font:7px \"Press Start 2P\",monospace;cursor:pointer}\n.se-tutorial-actions button:last-child{border-color:#394b3c;background:#0b120d;color:#a3b5a4}\n@media(max-width:900px){\n #achievementList.achievement-list,#achievementList .ultimate-achievements,#achievementList .se-bonus-achievements{grid-template-columns:repeat(3,minmax(0,1fr))!important}\n}\n@media(max-width:700px){\n .boot-topline{display:grid!important;grid-template-columns:1fr;gap:8px!important}\n .boot-top-meta{display:grid!important;grid-template-columns:1fr 1fr;gap:7px!important}\n #bootClock{position:static!important;left:auto!important;top:auto!important;transform:none!important;grid-column:1/-1;grid-row:1;justify-self:center}\n #bootVersion{grid-column:1;grid-row:2;justify-self:start}\n .boot-status{grid-column:2;grid-row:2;justify-self:end}\n .boot-brief .brief-controls{grid-template-columns:1fr!important}\n #bootOptionsPanel .option-group{grid-template-columns:minmax(0,1fr);padding:10px}\n #bootOptionsPanel .option-group-title{font-size:6px}\n #bootOptionsPanel .option-actions{grid-template-columns:repeat(2,minmax(0,1fr))}\n #bootOptionsPanel .snake-color-row{align-items:flex-start!important;flex-direction:column!important}\n .snake-palette{justify-content:flex-start}\n #seThreatStatus{grid-template-columns:1fr 1fr;font-size:10px}\n #seThreatStatus .se-threat-heading{grid-column:1/-1}\n #seThreatStatus .se-threat-stat{border-left:0;border-top:1px solid #26392b;padding:7px 0}\n #achievementList.achievement-list,#achievementList .ultimate-achievements,#achievementList .se-bonus-achievements{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}\n #achievements .achievement-item,#achievementList .se-bonus-card{min-height:80px!important;padding:9px!important}\n .se-tutorial-grid{grid-template-columns:1fr}\n .se-tutorial-card{padding:18px}\n .se-tutorial-card h2{font-size:16px}\n .se-tutorial-actions{flex-direction:column}\n}\n@media(max-width:420px){\n .boot-top-meta{gap:5px!important}\n #bootVersion{font-size:4px!important;padding:5px 6px!important}\n .boot-status{font-size:4px!important;padding:5px 6px!important}\n .brief-control-chip{padding:8px}\n .brief-control-chip kbd{font-size:5px!important;padding:5px!important}\n #bootOptionsPanel .option-row>div:first-child b{font-size:6px!important}\n #bootOptionsPanel .option-row>div:first-child small{font-size:4.5px!important}\n #bootOptionsPanel .option-actions{grid-template-columns:1fr}\n #achievementList.achievement-list,#achievementList .ultimate-achievements,#achievementList .se-bonus-achievements{grid-template-columns:1fr!important}\n}\n@media(prefers-reduced-motion:reduce){\n .snake-swatch{transition:none!important}\n .se-tutorial-card *{animation:none!important;transition:none!important}\n}\n";
    document.head.appendChild(style);
  }
  function ensureColorControls() {
    const panel = document.querySelector("#bootOptionsPanel");
    const grid = panel?.querySelector(".options-grid");
    if (!panel || !grid) return null;

    // Remove the auto-saving custom picker; keep one explicit-save editor.
    panel.querySelectorAll(".snake-custom-color, #seCustomSnakeColor").forEach(node => {
      const wrapper = node.closest(".snake-custom-color");
      if (wrapper) wrapper.remove();
      else node.remove();
    });

    let group = panel.querySelector(".snake-color-group");
    if (!group) {
      group = document.createElement("section");
      group.className = "option-group snake-color-group";
      group.setAttribute("aria-label", "SNAKE APPEARANCE");
      const heading = document.createElement("h3");
      heading.className = "option-group-title";
      heading.textContent = "04 / SNAKE CUSTOMIZATION";
      group.appendChild(heading);
      const row = document.createElement("div");
      row.className = "option-row snake-color-row";
      row.innerHTML = '<div><b>SNAKE COLOR</b><small>Preview changes live. SAVE stores it on this device.</small></div><div class="snake-palette" role="group" aria-label="Snake color presets"></div>';
      group.appendChild(row);
      const presentation = grid.querySelector('.option-group[aria-label="PRESENTATION"]');
      if (presentation) presentation.insertAdjacentElement("afterend", group);
      else grid.appendChild(group);
    }

    const palette = group.querySelector(".snake-palette");
    if (!palette) return null;
    palette.querySelectorAll(".snake-swatch").forEach(node => node.remove());
    colors.forEach(([name, color]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "snake-swatch";
      button.style.setProperty("--swatch", color);
      button.dataset.snakeColor = color;
      button.title = name;
      button.setAttribute("aria-label", name);
      button.setAttribute("aria-pressed", "false");
      button.innerHTML = "<span aria-hidden='true'></span>";
      palette.appendChild(button);
    });

    let editor = group.querySelector(".snake-color-editor");
    if (!editor) {
      editor = document.createElement("div");
      editor.className = "snake-color-editor";
      editor.innerHTML = '<label for="snakeHexInput">HEX</label><input id="snakeHexInput" type="text" value="#79e35b" inputmode="text" autocomplete="off" spellcheck="false" maxlength="7" pattern="^#[0-9a-fA-F]{6}$" aria-describedby="snakeHexHelp"><input id="snakeColorPicker" type="color" value="#79e35b" aria-label="Choose custom snake color"><button type="button" id="snakeColorSave" class="boot-action boot-primary">SAVE</button><small id="snakeHexHelp">Format: #RRGGBB.</small><div id="snakeColorStatus" role="status" aria-live="polite"></div>';
      group.appendChild(editor);
    }
    return { panel, group, palette, input: editor.querySelector("#snakeHexInput"), picker: editor.querySelector("#snakeColorPicker"), save: editor.querySelector("#snakeColorSave"), status: editor.querySelector("#snakeColorStatus") };
  }

  function cleanOptions() {
    const panel = document.querySelector("#bootOptionsPanel");
    const grid = panel?.querySelector(".options-grid");
    if (!grid) return;
    panel.querySelector(".control-deck-profile-row")?.remove();
    panel.querySelectorAll(".option-group").forEach(group => {
      const headingText = group.querySelector(".option-group-title")?.textContent || "";
      if (/PROFILE & UTILITIES|GAME CUSTOMIZATION/.test(headingText) && !group.querySelector(".option-row")) group.remove();
    });
    setupSnakeColorControls(ensureColorControls());
  }

  function setupSnakeColorControls(controls) {
    if (!controls || controls.panel.dataset.snakeColorControls === "1") return;
    const {panel, palette, input, picker, save, status} = controls;
    if (!input || !picker || !save) return;
    panel.dataset.snakeColorControls = "1";
    const setStatus = (message, isError = false) => {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = isError ? "error" : "ok";
    };
    const setActiveSwatch = color => {
      palette.querySelectorAll(".snake-swatch").forEach(swatch => {
        swatch.setAttribute("aria-pressed", String(swatch.dataset.snakeColor?.toLowerCase() === color.toLowerCase()));
      });
    };
    const normalize = value => String(value || "").trim().toLowerCase();
    const setDraft = (value, {preview = true} = {}) => {
      const color = normalize(value);
      if (input.value !== color) input.value = color;
      const valid = validColor(color);
      input.setAttribute("aria-invalid", String(!valid));
      save.disabled = !valid;
      if (!valid) {
        setStatus("Enter a valid HEX value such as #62cfff.", true);
        return false;
      }
      picker.value = color;
      setActiveSwatch(color);
      if (preview) {
        document.dispatchEvent(new CustomEvent("snake-evolution-color-preview", {detail:{snakeColor:color}}));
        document.documentElement.style.setProperty("--snake-color", color);
      }
      setStatus("PREVIEW ONLY: " + color.toUpperCase());
      return true;
    };

    const current = readSettings().snakeColor || "#79e35b";
    setDraft(validColor(current) ? current : "#79e35b", {preview:false});
    palette.addEventListener("click", event => {
      const swatch = event.target.closest(".snake-swatch");
      if (swatch && palette.contains(swatch)) setDraft(swatch.dataset.snakeColor || "");
    });
    picker.addEventListener("input", () => setDraft(picker.value));
    input.addEventListener("input", () => {
      const candidate = normalize(input.value);
      if (validColor(candidate)) setDraft(candidate);
      else {
        input.setAttribute("aria-invalid", "true");
        save.disabled = true;
        setStatus("Enter exactly #RRGGBB to preview.", true);
      }
    });
    input.addEventListener("change", () => {
      const candidate = normalize(input.value);
      if (validColor(candidate)) setDraft(candidate);
    });
    save.addEventListener("click", () => {
      const candidate = normalize(input.value);
      if (!validColor(candidate)) {
        input.setAttribute("aria-invalid", "true");
        save.disabled = true;
        input.focus();
        setStatus("SAVE blocked: HEX must match #RRGGBB.", true);
        return;
      }
      const settings = readSettings();
      settings.snakeColor = candidate;
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        setStatus("SAVE failed: browser storage is unavailable.", true);
        return;
      }
      document.dispatchEvent(new CustomEvent("snake-evolution-external-settings-changed", {detail:{snakeColor:candidate}}));
      document.dispatchEvent(new CustomEvent("snake-evolution-color-preview", {detail:{snakeColor:candidate}}));
      setActiveSwatch(candidate);
      input.setAttribute("aria-invalid", "false");
      save.disabled = false;
      setStatus("SAVED: " + candidate.toUpperCase());
    });
  }
  function enhanceControlScheme() {
    const controls = document.querySelector(".boot-brief .brief-controls");
    if (!controls || controls.dataset.polished === "1") return;
    controls.dataset.polished = "1";
    controls.innerHTML = '<span class="brief-control-chip"><b>MOVE</b><span class="brief-control-keys"><kbd>WASD</kbd><kbd>ARROWS</kbd></span></span><span class="brief-control-chip"><b>DASH / DEFEND</b><span class="brief-control-keys"><kbd>SPACE</kbd><kbd>SHIFT</kbd></span></span><span class="brief-control-chip"><b>PAUSE</b><span class="brief-control-keys"><kbd>P</kbd><kbd>ESC</kbd></span></span>';
  }
  function versionLabel() {
    const version = document.querySelector("#bootVersion");
    if (version) version.textContent = "V2.8.2";
  }
  function start() {
    runtimeStyle();
    versionLabel();
    cleanOptions();
    enhanceControlScheme();
    const settings = readSettings();
    if (validColor(settings.snakeColor)) document.documentElement.style.setProperty("--snake-color", settings.snakeColor);
    if (validColor(settings.snakeColor)) {
      document.querySelectorAll("#bootOptionsPanel .snake-swatch").forEach(swatch => swatch.setAttribute("aria-pressed", String(swatch.dataset.snakeColor?.toLowerCase() === settings.snakeColor.toLowerCase())));
    }
  }
  document.addEventListener("snake-evolution-settings-changed", event => {
    const color = event.detail?.snakeColor;
    if (!validColor(color)) return;
    const editor = document.querySelector("#bootOptionsPanel .snake-color-editor");
    const input = editor?.querySelector("#snakeHexInput");
    const picker = editor?.querySelector("#snakeColorPicker");
    if (input && document.activeElement !== input) input.value = color.toLowerCase();
    if (picker) picker.value = color.toLowerCase();
    document.querySelectorAll("#bootOptionsPanel .snake-swatch").forEach(swatch => {
      swatch.setAttribute("aria-pressed", String(swatch.dataset.snakeColor?.toLowerCase() === color.toLowerCase()));
    });
    document.documentElement.style.setProperty("--snake-color", color.toLowerCase());
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
  else start();
  window.SnakeQualityMenu = Object.freeze({version:"1.1.0",refresh:cleanOptions});
})();
