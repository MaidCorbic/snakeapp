/* SNAKE EVOLUTION // META PROGRESSION V1
   Automatic timed achievements, 120 visual badges, and Options collection deck. */
(() => {
  "use strict";
  if (window.__snakeMetaProgressionV1) return;
  window.__snakeMetaProgressionV1 = true;

  const SETTINGS_KEY = "snake-evolution-settings";
  const CARD_KEY = "snake-evolution-card-collection";
  const BADGE_KEY = "snake-evolution-badges-v1";
  const TIMED_KEY = "snake-evolution-timed-achievements-v1";
  const SETTINGS_DEFAULTS = {
    showTimer:true,
    homeClock:true,
    showXp:true,
    showIntel:true,
    showMissions:true,
    showAbilities:true,
    touchControls:true,
    autoPause:true,
    combatFx:true
  };
  const cardIds = ["scout","core","guardian","fury","hunter","apex"];
  const glyphs = ["◆","◇","✦","✧","⬢","⬡","✹","✷","✺","✸","✪","◈","◎","◉","△","▽","◁","▷","⊙","◌"];

  function readJSON(key,fallback){
    try {
      const value = JSON.parse(localStorage.getItem(key) || "");
      return value && typeof value === "object" ? value : fallback;
    } catch { return fallback; }
  }
  function writeJSON(key,value){
    try { localStorage.setItem(key,JSON.stringify(value)); } catch {}
  }
  function getSettings(){
    return {...SETTINGS_DEFAULTS,...readJSON(SETTINGS_KEY,{})};
  }
  function saveSettings(settings){
    writeJSON(SETTINGS_KEY,{...readJSON(SETTINGS_KEY,{}),...settings});
    applyPresentationSettings();
  }
  function cardStore(){
    return {...Object.fromEntries(cardIds.map(id=>[id,0])),total:0,...readJSON(CARD_KEY,{})};
  }
  function badgeStore(){ return readJSON(BADGE_KEY,{}); }
  function timedStore(){ return readJSON(TIMED_KEY,{}); }

  function applyPresentationSettings(){
    const settings=getSettings();
    document.documentElement.classList.toggle("meta-hide-timer",settings.showTimer===false);
    document.body.classList.toggle("meta-hide-home-clock",settings.homeClock===false);
    document.body.classList.toggle("meta-hide-xp",settings.showXp===false);
    document.body.classList.toggle("meta-hide-intel",settings.showIntel===false);
    document.body.classList.toggle("meta-hide-missions",settings.showMissions===false);
    document.body.classList.toggle("meta-hide-abilities",settings.showAbilities===false);
    document.body.classList.toggle("meta-hide-touch",settings.touchControls===false);
    document.body.classList.toggle("meta-no-combat-fx",settings.combatFx===false);
  }

  function injectStyle(){
    if(document.querySelector("#metaProgressionStyle")) return;
    const style=document.createElement("style");
    style.id="metaProgressionStyle";
    style.textContent=`
.meta-panel{
  display:flex;flex-direction:column;gap:12px;
  margin-top:8px;padding:16px;
  border:1px solid #425b49;border-radius:13px;
  background:
    radial-gradient(circle at 20% 0%,rgba(141,255,102,.06),transparent 36%),
    linear-gradient(145deg,#0a130d,#050a07);
  box-shadow:inset 0 0 32px rgba(0,0,0,.32),0 0 34px rgba(121,227,91,.06);
}
.meta-panel.hidden{display:none!important}
.meta-panel-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding-bottom:10px;border-bottom:1px solid #263a2c}
.meta-panel-head>div{display:grid;gap:6px}.meta-panel-head b{font-size:8px;color:#d9eadc;letter-spacing:1.1px}.meta-panel-head small{font-size:4.5px;color:#718a76;line-height:1.8}
.meta-panel-head>strong{font-size:6px;color:#ffb04d;white-space:nowrap}
.meta-summary{display:flex;flex-wrap:wrap;gap:6px}
.meta-summary span{padding:7px 9px;border:1px solid #314937;border-radius:8px;background:#09110c;color:#9db4a0;font-size:4.5px;letter-spacing:.6px}
.meta-summary strong{color:#dfffd6;font-size:6px}
.meta-panel-scroll{max-height:min(56vh,560px);overflow:auto;padding-right:4px}
.meta-panel-scroll::-webkit-scrollbar{width:6px}.meta-panel-scroll::-webkit-scrollbar-thumb{background:#29422f;border-radius:99px}
.meta-card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.meta-card{
  position:relative;min-height:132px;padding:12px;border:1px solid #2d4936;border-radius:11px;
  background:linear-gradient(160deg,#0e1912,#070c09);
  overflow:hidden;box-shadow:inset 0 0 20px rgba(0,0,0,.25);
}
.meta-card.collected{border-color:#667a36;box-shadow:inset 0 0 24px rgba(255,196,79,.045),0 0 16px rgba(255,196,79,.04)}
.meta-card::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 82% 18%,rgba(255,255,255,.08),transparent 24%)}
.meta-card-top{display:flex;justify-content:space-between;align-items:center;gap:7px;margin-bottom:15px}.meta-card-top b{font-size:4px;letter-spacing:1px;color:#ffbd61}.meta-card-top strong{font-size:5px;color:#b7cfbb}
.meta-card-glyph{width:44px;height:44px;display:grid;place-items:center;margin-bottom:11px;border:1px solid #4d684f;border-radius:9px;background:linear-gradient(145deg,#16261a,#0a110c);color:#eaffdf;font-size:16px;text-shadow:0 0 14px rgba(141,255,102,.2)}
.meta-card h4{margin:0 0 7px;color:#eaf7eb;font-size:6px;letter-spacing:.5px}.meta-card p{margin:0;color:#7f9783;font-size:4.2px;line-height:1.8}.meta-card small{display:block;margin-top:10px;color:#9ab19d;font-size:4px}
.meta-card .lock{opacity:.4;filter:grayscale(.9)}.meta-card .owned{color:#dfffab}
.badge-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px}
.meta-badge{
  --h:120;--a:0deg;--glow:.25;
  position:relative;min-height:168px;padding:10px;border:1px solid hsl(var(--h) 35% 36% / .58);
  border-radius:12px;background:
    radial-gradient(circle at 50% 22%,hsl(var(--h) 85% 62% / .16),transparent 31%),
    linear-gradient(160deg,#0e1711,#060a07);
  overflow:hidden;box-shadow:inset 0 0 22px rgba(0,0,0,.3),0 0 16px hsl(var(--h) 75% 48% / var(--glow));
}
.meta-badge.locked{filter:saturate(.35);opacity:.62}
.meta-badge-top{display:flex;justify-content:space-between;align-items:center;gap:6px}.meta-badge-top b{font-size:4px;color:hsl(var(--h) 82% 68%);letter-spacing:1px}.meta-badge-top span{font-size:3.5px;color:#728c77}
.badge-emblem{
  position:relative;width:70px;height:70px;margin:12px auto 11px;display:grid;place-items:center;
  border:2px solid hsl(var(--h) 88% 67% / .78);
  background:
    repeating-conic-gradient(from var(--a),hsl(var(--h) 90% 62% / .18) 0 10deg,transparent 10deg 22deg),
    radial-gradient(circle,hsl(var(--h) 80% 62% / .30),#081008 68%);
  box-shadow:0 0 0 4px hsl(var(--h) 50% 30% / .16),0 0 28px hsl(var(--h) 90% 58% / .35);
}
.badge-emblem::before{content:"";position:absolute;inset:9px;border:1px solid hsl(calc(var(--h) + 55) 88% 68% / .74);transform:rotate(var(--a));}
.badge-emblem::after{content:"";position:absolute;inset:17px;border:1px dashed hsl(calc(var(--h) + 180) 80% 75% / .54);transform:rotate(calc(var(--a) * -1));}
.badge-emblem .badge-glyph{position:relative;z-index:2;font-size:20px;color:#f4ffe9;text-shadow:0 0 18px hsl(var(--h) 95% 64% / .7)}
.meta-badge[data-shape="0"] .badge-emblem{border-radius:10px;clip-path:polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)}
.meta-badge[data-shape="1"] .badge-emblem{border-radius:50%}
.meta-badge[data-shape="2"] .badge-emblem{border-radius:2px;transform:rotate(45deg) scale(.86)}.meta-badge[data-shape="2"] .badge-glyph{transform:rotate(-45deg)}
.meta-badge[data-shape="3"] .badge-emblem{border-radius:4px 50% 4px 50%}
.meta-badge[data-shape="4"] .badge-emblem{border-radius:18px 3px 18px 3px}
.meta-badge[data-shape="5"] .badge-emblem{clip-path:polygon(50% 0,88% 14%,100% 50%,88% 86%,50% 100%,12% 86%,0 50%,12% 14%)}
.meta-badge[data-shape="6"] .badge-emblem{clip-path:polygon(18% 0,82% 0,100% 22%,82% 100%,18% 100%,0 22%)}
.meta-badge[data-shape="7"] .badge-emblem{border-radius:3px;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.meta-badge[data-shape="8"] .badge-emblem{border-radius:50% 8px 50% 8px}
.meta-badge[data-shape="9"] .badge-emblem{clip-path:polygon(50% 0,61% 36%,100% 36%,69% 57%,81% 100%,50% 73%,19% 100%,31% 57%,0 36%,39% 36%)}
.meta-badge h4{margin:0 0 5px;color:#ecf7ed;font-size:5.5px;line-height:1.4;letter-spacing:.5px}.meta-badge p{margin:0;color:#829984;font-size:4px;line-height:1.7}.meta-badge small{display:block;margin-top:8px;color:#9db39e;font-size:3.7px}.meta-badge.unlocked{border-color:hsl(var(--h) 65% 52% / .78)}.meta-badge.unlocked .badge-glyph{color:white}
.timed-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:7px}
.timed-achievement{padding:10px;border:1px solid #293f2f;border-radius:9px;background:#09110c}.timed-achievement.unlocked{border-color:#82632d;background:linear-gradient(145deg,#161207,#0c0e08)}.timed-top{display:flex;justify-content:space-between;gap:8px}.timed-top b{font-size:4.6px;color:#ffd17b}.timed-top span{font-size:4px;color:#718872}.timed-achievement strong{display:block;margin:7px 0 4px;color:#e8f4e9;font-size:5.5px}.timed-achievement small{color:#819683;font-size:4px;line-height:1.6}.timed-progress{height:5px;margin-top:9px;border:1px solid #273c2c;border-radius:99px;overflow:hidden;background:#050805}.timed-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff9d36,#ffd36e);box-shadow:0 0 12px #ffad43aa}
.meta-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.meta-actions .boot-action{margin:0!important;min-height:38px}
.meta-close{margin-top:2px}
.meta-live{color:#ffad4f!important}
html.meta-hide-timer #time,html.meta-hide-timer .stats span:has(#time){visibility:hidden}
body.meta-hide-home-clock #bootClock{visibility:hidden!important}
body.meta-hide-xp .xp-module{display:none!important}
body.meta-hide-intel .run-intel{display:none!important}
body.meta-hide-missions #missions{display:none!important}
body.meta-hide-abilities .ability-bar{display:none!important}
body.meta-hide-touch .controls{display:none!important}
.options-section-label{
  grid-column:1/-1;
  margin:5px 0 1px;
  padding:8px 0 7px;
  border-bottom:1px solid #304536;
  color:#94c58a;
  font-size:6.5px;
  line-height:1.5;
  letter-spacing:1.6px;
}
@media(max-width:900px){.options-section-label{font-size:6px}}
@media(max-width:480px){.options-section-label{font-size:5.5px}}

body.meta-no-combat-fx .event-banner,body.meta-no-combat-fx .toast,body.meta-no-combat-fx .floaters{display:none!important}
@media(max-width:700px){.meta-panel{padding:11px}.meta-card-grid,.badge-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.timed-list{grid-template-columns:1fr}.meta-actions{grid-template-columns:1fr}.meta-card{min-height:122px}.badge-emblem{width:58px;height:58px}.badge-emblem .badge-glyph{font-size:17px}}
@media(max-width:480px){.meta-card-grid,.badge-grid{grid-template-columns:1fr 1fr}.meta-card h4{font-size:5px}.meta-badge{min-height:152px}.badge-emblem{width:52px;height:52px}}
/* BADGE ARCHIVE // LARGE VISUAL MODE */
#bootBadgePanel{
  padding:20px!important;
  border-color:#765d2c!important;
  background:radial-gradient(circle at 50% 0%,rgba(255,177,69,.075),transparent 36%),linear-gradient(145deg,#0d120c,#060905)!important;
  box-shadow:inset 0 0 38px rgba(255,180,70,.045),0 0 0 1px rgba(255,177,69,.05),0 0 46px rgba(255,160,50,.08)!important;
}
#bootBadgePanel .meta-panel-head{padding:12px 0 14px!important;border-bottom-color:#4d3b20!important}
#bootBadgePanel .meta-panel-head b{font-size:10px!important;letter-spacing:1.4px!important;color:#f0ddbc!important}
#bootBadgePanel .meta-panel-head small{font-size:5px!important;color:#9c8b70!important}
#bootBadgePanel .meta-panel-head>strong{padding:8px 10px!important;border:1px solid #8b682f!important;border-radius:8px!important;background:#181107!important;color:#ffc46a!important;font-size:8px!important;letter-spacing:1px!important;box-shadow:0 0 18px rgba(255,174,68,.12)!important}
#bootBadgePanel .meta-summary{gap:8px!important;padding:2px 0 5px!important}
#bootBadgePanel .meta-summary span{padding:9px 11px!important;border-color:#56462b!important;font-size:5px!important}
#bootBadgePanel .meta-summary strong{font-size:7px!important;color:#ffdf9a!important}
#bootBadgePanel .meta-panel-scroll{max-height:min(64vh,680px)!important;padding-right:6px!important}
#bootBadgePanel .badge-grid{grid-template-columns:repeat(auto-fill,minmax(215px,1fr))!important;gap:12px!important}
#bootBadgePanel .meta-badge{
  min-height:230px!important;padding:14px!important;border-width:1px!important;border-radius:14px!important;
  box-shadow:inset 0 0 28px rgba(0,0,0,.32),0 0 20px hsl(var(--h) 75% 48% / var(--glow))!important;
}
#bootBadgePanel .meta-badge-top b{font-size:5px!important}
#bootBadgePanel .meta-badge-top span{font-size:4px!important}
#bootBadgePanel .badge-emblem{
  width:98px!important;height:98px!important;margin:18px auto 15px!important;border-width:3px!important;
  box-shadow:0 0 0 5px hsl(var(--h) 50% 30% / .16),0 0 34px hsl(var(--h) 90% 58% / .38)!important;
}
#bootBadgePanel .badge-emblem::before{inset:12px!important;border-width:2px!important}
#bootBadgePanel .badge-emblem::after{inset:22px!important}
#bootBadgePanel .meta-badge .badge-glyph{font-size:30px!important}
#bootBadgePanel .meta-badge h4{margin-bottom:7px!important;font-size:7px!important;line-height:1.45!important}
#bootBadgePanel .meta-badge p{font-size:5px!important;line-height:1.85!important}
#bootBadgePanel .meta-badge small{margin-top:11px!important;font-size:4.5px!important;letter-spacing:.5px!important}
#bootBadgePanel .meta-badge.unlocked{border-color:hsl(var(--h) 72% 60% / .9)!important;transform:translateY(-1px)}
#bootBadgePanel .meta-badge.unlocked::after{
  content:"UNLOCKED";position:absolute;top:11px;right:11px;padding:4px 6px;border:1px solid hsl(var(--h) 70% 58% / .55);
  border-radius:6px;background:#0b100b;color:hsl(var(--h) 82% 72%);font-size:3.5px;letter-spacing:1px;
}
#bootBadgePanel .meta-close{min-height:44px!important;font-size:6px!important}
/* OPTIONS + ACHIEVEMENTS // READABLE UI PASS */
#bootOptionsPanel{
  padding:22px!important;
  border-color:#3f5d47!important;
  background:radial-gradient(circle at 12% 0%,rgba(141,255,102,.07),transparent 35%),linear-gradient(145deg,#0d1710,#060b08)!important;
  box-shadow:inset 0 0 36px rgba(0,0,0,.32),0 0 36px rgba(121,227,91,.08)!important;
}
#bootOptionsPanel .boot-panel-heading{padding-bottom:15px!important;margin-bottom:6px!important}
#bootOptionsPanel .boot-panel-heading b{font-size:11px!important;line-height:1.35!important;color:#e5f3e7!important;letter-spacing:1.5px!important}
#bootOptionsPanel .boot-panel-heading small{font-size:6px!important;line-height:1.9!important;color:#8ca58f!important}
#bootOptionsPanel .boot-panel-heading>strong{font-size:7px!important;padding:6px 8px!important;border:1px solid #405d46;border-radius:7px;background:#0a120d;color:#aaff8d!important}
#bootOptionsPanel .options-grid{gap:0 24px!important}
#bootOptionsPanel .options-grid .option-row{
  min-height:82px!important;
  padding:15px 0!important;
  align-items:center!important;
  border-bottom:1px solid #24372a!important;
}
#bootOptionsPanel .option-row>div:first-child{gap:7px!important}
#bootOptionsPanel .option-row>div:first-child b{
  font-size:8px!important;
  line-height:1.35!important;
  letter-spacing:.9px!important;
  color:#e8f4e9!important;
}
#bootOptionsPanel .option-row>div:first-child small{
  font-size:6px!important;
  line-height:1.85!important;
  color:#91a995!important;
  max-width:330px!important;
}
#bootOptionsPanel .option-toggle{
  min-width:94px!important;
  min-height:44px!important;
  padding:9px 12px!important;
  border:1px solid #46664e!important;
  border-radius:8px!important;
  font-size:7px!important;
  font-weight:700!important;
  letter-spacing:1px!important;
  cursor:pointer!important;
  box-shadow:3px 3px 0 #101a12!important;
}
#bootOptionsPanel .option-toggle[aria-pressed="true"]{
  border-color:#79e35b!important;
  background:linear-gradient(180deg,#18301c,#0d1d12)!important;
  color:#dfffd6!important;
  box-shadow:0 0 18px rgba(121,227,91,.12),3px 3px 0 #27442c!important;
}
#bootOptionsPanel .option-toggle[aria-pressed="false"]{
  background:linear-gradient(180deg,#151c17,#0a100c)!important;
  color:#839987!important;
}
#bootOptionsPanel .range-control{min-width:190px!important;gap:11px!important}
#bootOptionsPanel .range-control input{height:7px!important}
#bootOptionsPanel .range-control output{
  min-width:48px!important;
  font-size:6px!important;
  font-weight:700!important;
  color:#baff9d!important;
}
#bootOptionsPanel .option-actions{
  grid-template-columns:repeat(3,minmax(0,1fr))!important;
  gap:9px!important;
  margin-top:15px!important;
}
#bootOptionsPanel .option-actions .boot-action{
  min-height:46px!important;
  font-size:6.5px!important;
  border-radius:8px!important;
  cursor:pointer!important;
}
#bootOptionsPanel #bootOptionsBack{
  min-height:46px!important;
  margin-top:10px!important;
  font-size:7px!important;
  border-radius:8px!important;
}
#bootAchievementPanel{
  padding:22px!important;
  border-color:#735728!important;
  background:radial-gradient(circle at 50% 0%,rgba(255,177,69,.08),transparent 38%),linear-gradient(145deg,#11110a,#070906)!important;
}
#bootAchievementPanel .meta-panel-head{padding:13px 0 16px!important}
#bootAchievementPanel .meta-panel-head b{font-size:11px!important;line-height:1.35!important;color:#f0e2c7!important;letter-spacing:1.3px!important}
#bootAchievementPanel .meta-panel-head small{font-size:6px!important;line-height:1.9!important;color:#a29379!important}
#bootAchievementPanel .meta-panel-head>strong{font-size:7px!important;padding:8px 10px!important}
#bootAchievementPanel .meta-summary{gap:9px!important;padding:3px 0 9px!important}
#bootAchievementPanel .meta-summary span{
  padding:9px 11px!important;
  font-size:6px!important;
  border-radius:8px!important;
  border-color:#57472d!important;
}
#bootAchievementPanel .meta-summary strong{font-size:7px!important;color:#ffe0a0!important}
#bootAchievementPanel .meta-panel-scroll{max-height:min(66vh,700px)!important}
#bootAchievementPanel .timed-list{
  grid-template-columns:repeat(auto-fill,minmax(250px,1fr))!important;
  gap:10px!important;
}
#bootAchievementPanel .timed-achievement{
  min-height:178px!important;
  padding:13px!important;
  border-radius:11px!important;
  border-color:#384632!important;
  background:linear-gradient(155deg,#11170f,#080c08)!important;
}
#bootAchievementPanel .timed-achievement.unlocked{
  border-color:#926c31!important;
  box-shadow:inset 0 0 24px rgba(255,187,77,.05),0 0 15px rgba(255,170,60,.08)!important;
}
#bootAchievementPanel .timed-top b{font-size:6px!important;color:#ffbc61!important}
#bootAchievementPanel .timed-top span{font-size:6px!important;color:#9cae9c!important}
#bootAchievementPanel .timed-achievement strong{
  margin:11px 0 7px!important;
  font-size:8px!important;
  line-height:1.45!important;
  color:#f0f6ef!important;
  letter-spacing:.5px!important;
}
#bootAchievementPanel .timed-achievement small{
  font-size:6px!important;
  line-height:1.85!important;
  color:#91a492!important;
}
#bootAchievementPanel .timed-progress{
  height:8px!important;
  margin-top:13px!important;
}
#bootAchievementPanel .meta-close{
  min-height:48px!important;
  font-size:7px!important;
  border-radius:8px!important;
}
#achievements .progression-head b{font-size:8px!important}
#achievements .progression-head small{font-size:6px!important;line-height:1.7!important}
#achievements .progression-head>strong{font-size:6px!important}
#achievements .achievement-list{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))!important;gap:10px!important}
#achievements .achievement-item{
  min-height:86px!important;
  padding:12px!important;
  border-radius:9px!important;
}
#achievements .achievement-item b{font-size:7px!important;line-height:1.45!important;margin-bottom:8px!important;color:#b1c5b4!important}
#achievements .achievement-item span{font-size:6px!important;line-height:1.85!important;color:#849985!important}
#achievements .achievement-item.unlocked b{color:#baff9d!important}
#achievements .achievement-item.unlocked span{color:#d5e6d6!important}
@media(max-width:900px){
  #bootOptionsPanel .option-actions{grid-template-columns:1fr 1fr!important}
  #bootOptionsPanel .options-grid{grid-template-columns:1fr!important}
}
@media(max-width:700px){
  #bootOptionsPanel{padding:14px!important}
  #bootOptionsPanel .options-grid .option-row{min-height:74px!important;padding:12px 0!important}
  #bootOptionsPanel .option-row>div:first-child b{font-size:7px!important}
  #bootOptionsPanel .option-row>div:first-child small{font-size:5.5px!important}
  #bootOptionsPanel .option-toggle{min-width:84px!important;min-height:40px!important;font-size:6.5px!important}
  #bootOptionsPanel .range-control{min-width:150px!important}
  #bootOptionsPanel .option-actions{grid-template-columns:1fr 1fr!important}
  #bootAchievementPanel{padding:14px!important}
  #bootAchievementPanel .timed-list{grid-template-columns:1fr!important}
  #bootAchievementPanel .timed-achievement{min-height:165px!important}
  #bootAchievementPanel .timed-achievement strong{font-size:7px!important}
  #bootAchievementPanel .timed-achievement small{font-size:5.5px!important}
  #achievements .achievement-list{grid-template-columns:1fr 1fr!important}
}
@media(max-width:480px){
  #bootOptionsPanel .option-row>div:first-child small{font-size:5px!important}
  #bootOptionsPanel .range-control{min-width:125px!important}
  #bootOptionsPanel .option-actions{grid-template-columns:1fr!important}
  #bootAchievementPanel .timed-achievement{min-height:150px!important}
  #bootAchievementPanel .timed-achievement strong{font-size:6.5px!important}
  #bootAchievementPanel .timed-achievement small{font-size:5px!important}
  #achievements .achievement-list{grid-template-columns:1fr!important}
}
@media(max-width:700px){
  #bootBadgePanel{padding:13px!important}
  #bootBadgePanel .badge-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}
  #bootBadgePanel .meta-badge{min-height:205px!important;padding:11px!important}
  #bootBadgePanel .badge-emblem{width:78px!important;height:78px!important;margin:14px auto 11px!important}
  #bootBadgePanel .meta-badge .badge-glyph{font-size:24px!important}
  #bootBadgePanel .meta-badge h4{font-size:5.8px!important}
  #bootBadgePanel .meta-badge p{font-size:4.3px!important}
}
@media(max-width:480px){
  #bootBadgePanel .badge-grid{grid-template-columns:1fr 1fr!important}
  #bootBadgePanel .meta-badge{min-height:185px!important}
  #bootBadgePanel .badge-emblem{width:68px!important;height:68px!important}
  #bootBadgePanel .meta-badge .badge-glyph{font-size:21px!important}
  #bootBadgePanel .meta-badge h4{font-size:5.1px!important}
  #bootBadgePanel .meta-badge p{font-size:3.9px!important}
}
`;
    document.head.appendChild(style);
  }

  const timedTargets = Array.from({length:24},(_,i)=>(i+1)*10);
  const timedNames = [
    "BOOT SEQUENCE","LIVE CIRCUIT","FIRST CHARGE","STEADY HAND","HOT WIRES","NO BRAKES",
    "DEEP RUN","PRESSURE TEST","LOCKED IN","HARD RESET","OVERDRIVE","HUNTER HOURS",
    "REDLINE","DARK SECTOR","EDGE RUNNER","NIGHT SHIFT","CORE MEMORY","SIGNAL BURN",
    "WALLBREAKER","LAST LIGHT","RIFT WALKER","WARDEN WATCH","FINAL FUSE","NEVER STOP"
  ];
  const timedAchievements = timedTargets.map((seconds,i)=>({
    id:"timed-"+String(i+1).padStart(2,"0"),
    seconds,
    name:timedNames[i],
    desc:"Stay alive for "+seconds+" seconds. The unlock is automatic.",
    reward:cardIds[i%cardIds.length]
  }));

  const badgeFamilies = [
    ["SCORE","SCORE", [100,250,500,750,1000,1500,2000,3000,5000,7500]],
    ["COMBO","BEST COMBO", [2,3,4,5,6,7,8,9,10,11]],
    ["XP","RUN XP", [100,200,300,400,500,600,700,800,900,1000]],
    ["RUNS","COMPLETED RUNS", [1,2,3,4,5,6,7,8,9,10]],
    ["ZONE","BEST ZONE", [1,2,3,4,1,2,3,4,2,4]],
    ["CARDS","COLLECTED CARDS", [1,2,3,4,6,8,10,14,20,30]],
    ["ELITES","ELITE TAKEDOWNS", [1,2,3,4,5,6,7,8,9,10]],
    ["WARDENS","WARDEN TAKEDOWNS", [1,2,3,4,5,6,7,8,9,10]],
    ["EXTRACTS","CASH OUTS", [1,2,3,4,5,6,7,8,9,10]],
    ["PERFECT","PERFECT SECONDS", [15,30,45,60,75,90,105,120,135,150]],
    ["ENDLESS","ENDLESS CYCLES", [1,2,3,4,5,6,7,8,9,10]],
    ["TIMED","SURVIVAL SECONDS", timedTargets.slice(0,10)]
  ];
  const badgeDefs=[];
  badgeFamilies.forEach(([family,label,targets]) => targets.forEach((target,tier) => {
    const serial=badgeDefs.length+1;
    badgeDefs.push({
      id:"badge-"+String(serial).padStart(3,"0"),
      family,label,target,tier:tier+1,name:family+" // "+String(tier+1).padStart(2,"0"),
      desc:label+" ≥ "+target,
      hue:(serial*47)%360,
      angle:(serial*29)%360,
      shape:(serial+family.length)%10,
      glyph:glyphs[(serial*3+family.length)%glyphs.length]
    });
  }));

  function getRunState(){
    try { return window.SnakeEvolution?.getState?.() || null; } catch { return null; }
  }
  function getSavedStats(){
    return {
      save:readJSON("snake-evolution-save",{}),
      ultimate:readJSON("snake-evolution-ultimate",{}),
      cards:cardStore()
    };
  }
  function readClock(text){
    const parts=String(text||"").replace(/^∞\\s*/,"").split(":").map(Number);
    if(parts.length!==2 || parts.some(Number.isNaN))return null;
    return Math.max(0,parts[0]*60+parts[1]);
  }
  function parseTimeRemaining(){
    const text=String(document.querySelector("#time")?.textContent||"").trim();
    if(!text || text.startsWith("∞"))return null;
    return readClock(text);
  }
  function parseEndlessElapsed(){
    const text=String(document.querySelector("#time")?.textContent||"").trim();
    if(!text.startsWith("∞"))return null;
    return readClock(text.slice(1).trim());
  }
  let runStartedAt=0;
  let runWasAlive=false;

  function elapsedSeconds(state){
    if(!state?.alive)return 0;
    const endlessElapsed=parseEndlessElapsed();
    if(endlessElapsed!==null)return endlessElapsed;
    const remaining=parseTimeRemaining();
    if(remaining!==null){
      const modeText=String(document.querySelector("#runMode")?.textContent||"").trim();
      const duration=state.daily || modeText==="DAILY" ? 300 : (localStorage.getItem("snake-evolution-mode")==="party" ? 180 : 300);
      return Math.max(0,duration-remaining);
    }
    if(!runStartedAt)runStartedAt=performance.now();
    return Math.floor((performance.now()-runStartedAt)/1000);
  }

  function grantCard(id,reason){
    const data=cardStore();
    data[id]=(data[id]||0)+1;
    data.total=(data.total||0)+1;
    writeJSON(CARD_KEY,data);
  }

  function autoTimedAchievements(state){
    const elapsed=elapsedSeconds(state);
    if(!state?.alive)return false;
    const store=timedStore();
    let changed=false;
    timedAchievements.forEach((achievement)=>{
      if(store[achievement.id] || elapsed<achievement.seconds) return;
      store[achievement.id]=Date.now();
      grantCard(achievement.reward,"AUTO REWARD // "+achievement.name);
      changed=true;
      notify("ACHIEVEMENT // "+achievement.name,"AUTO UNLOCK // "+achievement.seconds+"s");
    });
    if(changed)writeJSON(TIMED_KEY,store);
    return changed;
  }

  function metricValue(badge,state,saved,elapsed){
    switch(badge.family){
      case "SCORE": return Number(state?.score||0);
      case "COMBO": return Number(state?.combo||0);
      case "XP": return Number(state?.xp||0);
      case "RUNS": return Number(saved.save?.runs||0);
      case "ZONE": return Math.max(Number(state?.zone||0),Number(saved.save?.bestZone||0));
      case "CARDS": return Number(saved.cards?.total||0);
      case "ELITES": return Number(saved.save?.elites||0);
      case "WARDENS": return Number(saved.save?.wardens||0);
      case "EXTRACTS": return Number(saved.save?.extracts||0);
      case "PERFECT": return Number(saved.ultimate?.perfectSeconds||0);
      case "ENDLESS": return Number(saved.ultimate?.endlessCycles||0);
      case "TIMED": return elapsed;
      default:return 0;
    }
  }

  let badgeUnlockCount=0;
  function evaluateBadges(state){
    const elapsed=elapsedSeconds(state);
    const saved=getSavedStats();
    const store=badgeStore();
    let changed=false;
    badgeDefs.forEach((badge)=>{
      if(store[badge.id])return;
      if(metricValue(badge,state,saved,elapsed)>=badge.target){
        store[badge.id]=Date.now();
        badgeUnlockCount++;
        changed=true;
        if(badgeUnlockCount<4)notify("BADGE UNLOCKED // "+badge.name,badge.desc);
      }
    });
    if(changed)writeJSON(BADGE_KEY,store);
    return changed;
  }

  function notify(title,sub){
    const target=document.querySelector("#toast") || document.querySelector("#eventBanner");
    if(!target)return;
    target.textContent=title+(sub?" // "+sub:"");
    target.classList.add("show");
    clearTimeout(target.__metaTimer);
    target.__metaTimer=setTimeout(()=>target.classList.remove("show"),1400);
  }

  function renderCardDeck(){
    const root=document.querySelector("#bootCardDeckList");
    if(!root)return;
    const store=cardStore();
    const defs=[
      ["scout","SCOUT CHIP","COMMON","Arena data // +45 XP","◆"],
      ["core","CORE MATRIX","COMMON","Stable core // +60 XP","⬢"],
      ["guardian","GUARDIAN SCALE","RARE","Recovery pattern // shield","◈"],
      ["fury","FURY CIRCUIT","RARE","Combat cache // FURY","✦"],
      ["hunter","HUNTER SIGIL","EPIC","Predator trace // chain value","✹"],
      ["apex","APEX BLUEPRINT","EPIC","Rare blueprint // high value","✪"]
    ];
    root.innerHTML=defs.map((d)=>{
      const count=Number(store[d[0]]||0),mastery=Math.min(3,1+Math.floor(count/3));
      return '<article class="meta-card '+(count?"collected":"")+'"><div class="meta-card-top"><b>'+d[2]+'</b><strong>'+count+' COPIES</strong></div><div class="meta-card-glyph">'+d[4]+'</div><h4>'+d[1]+'</h4><p>'+d[3]+'</p><small class="'+(count?"owned":"lock")+'">'+(count?"COLLECTED // MASTERY LV "+mastery+"/3":"LOCKED // FIND IN RUN")+'</small></article>';
    }).join("");
    const summary=document.querySelector("#cardDeckSummary");
    if(summary)summary.innerHTML='<span>UNIQUE <strong>'+defs.filter(d=>store[d[0]]).length+'/6</strong></span><span>COPIES <strong>'+(store.total||0)+'</strong></span><span>AUTO REWARDS <strong>ON</strong></span>';
  }

  function renderBadges(){
    const root=document.querySelector("#bootBadgeList");
    if(!root)return;
    const store=badgeStore();
    const unlocked=badgeDefs.filter(b=>store[b.id]).length;
    const summary=document.querySelector("#badgeSummary");
    if(summary)summary.innerHTML='<span>BADGES <strong>'+unlocked+'/'+badgeDefs.length+'</strong></span><span>UNLOCK <strong>AUTOMATIC</strong></span><span>VISUAL VARIANTS <strong>120</strong></span>';
    root.innerHTML=badgeDefs.map((badge)=>{
      const isUnlocked=!!store[badge.id];
      return '<article class="meta-badge '+(isUnlocked?"unlocked":"locked")+'" data-shape="'+badge.shape+'" style="--h:'+badge.hue+';--a:'+badge.angle+'deg;--glow:'+(isUnlocked?".32":".10")+'"><div class="meta-badge-top"><b>'+String(badge.family)+'</b><span>#'+badge.id.replace("badge-","")+'</span></div><div class="badge-emblem"><span class="badge-glyph">'+badge.glyph+'</span></div><h4>'+badge.name+'</h4><p>'+badge.desc+'</p><small>'+(isUnlocked?"UNLOCKED // AUTO":"LOCKED // PLAY TO UNLOCK")+'</small></article>';
    }).join("");
  }

  function renderTimedAchievements(state){
    const root=document.querySelector("#bootTimedList");
    if(!root)return;
    const store=timedStore();
    const elapsed=elapsedSeconds(state);
    const next=timedAchievements.find(a=>!store[a.id]);
    const panelState=document.querySelector("#timedSummary");
    if(panelState){
      const nextText=next?("NEXT "+Math.max(0,next.seconds-Math.floor(elapsed))+"s // "+next.name):"ALL 24 UNLOCKED";
      panelState.innerHTML='<span>ACHIEVEMENTS <strong>'+Object.keys(store).length+'/'+timedAchievements.length+'</strong></span><span>RUN TIMER <strong class="meta-live">'+Math.floor(elapsed/60)+":"+String(Math.floor(elapsed%60)).padStart(2,"0")+'</strong></span><span>'+nextText+'</span>';
    }
    root.innerHTML=timedAchievements.map((a)=>{
      const done=!!store[a.id],progress=Math.min(100,elapsed/a.seconds*100);
      return '<article class="timed-achievement '+(done?"unlocked":"")+'"><div class="timed-top"><b>'+a.id.replace("timed-","A-")+'</b><span>'+a.seconds+'s</span></div><strong>'+a.name+'</strong><small>'+a.desc+'</small><div class="timed-progress"><i style="width:'+(done?100:progress)+'%"></i></div></article>';
    }).join("");
  }

  function hideMetaPanels(){
    ["bootCardDeckPanel","bootBadgePanel","bootAchievementPanel"].forEach(id=>document.querySelector("#"+id)?.classList.add("hidden"));
  }
  function showMetaPanel(id){
    hideMetaPanels();
    document.querySelector("#bootOptionsPanel")?.classList.add("hidden");
    document.querySelector("#bootHowPanel")?.classList.add("hidden");
    document.querySelector("#"+id)?.classList.remove("hidden");
    if(id==="bootCardDeckPanel")renderCardDeck();
    if(id==="bootBadgePanel")renderBadges();
    if(id==="bootAchievementPanel")renderTimedAchievements(getRunState());
  }

  function wirePanels(){
    [["bootCardDeck","bootCardDeckPanel"],["bootBadgeArchive","bootBadgePanel"],["bootAutoAchievements","bootAchievementPanel"]].forEach(([button,panel])=>{
      document.querySelector("#"+button)?.addEventListener("click",()=>showMetaPanel(panel));
    });
    const backToOptions=()=>{
      hideMetaPanels();
      document.querySelector("#bootOptionsPanel")?.classList.remove("hidden");
      document.querySelector("#bootHowPanel")?.classList.add("hidden");
    };
    ["bootCardDeckBack","bootBadgeBack","bootAchievementsBack"].forEach(id=>{
      document.querySelector("#"+id)?.addEventListener("click",backToOptions);
    });
  }

  function sync(){
    applyPresentationSettings();
    const state=getRunState();
    const alive=!!state?.alive;
    if(alive && !runWasAlive)runStartedAt=performance.now();
    if(!alive)runStartedAt=0;
    runWasAlive=alive;
    if(alive)autoTimedAchievements(state);
    evaluateBadges(state);
    if(document.querySelector("#bootCardDeckPanel:not(.hidden)"))renderCardDeck();
    if(document.querySelector("#bootBadgePanel:not(.hidden)"))renderBadges();
    if(document.querySelector("#bootAchievementPanel:not(.hidden)"))renderTimedAchievements(state);
  }

  function init(){
    injectStyle();
    wirePanels();
    applyPresentationSettings();
    window.setInterval(sync,500);
    sync();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();

  window.SnakeMetaProgression={badges:badgeDefs,timedAchievements,renderCardDeck,renderBadges,renderTimedAchievements,getCardStore:cardStore,getBadgeStore:badgeStore};
})();