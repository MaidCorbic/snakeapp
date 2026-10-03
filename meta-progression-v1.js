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
  const SETTINGS_DEFAULTS = {showTimer:true, combatFx:true};
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
body.meta-no-combat-fx .event-banner,body.meta-no-combat-fx .toast,body.meta-no-combat-fx .floaters{display:none!important}
@media(max-width:700px){.meta-panel{padding:11px}.meta-card-grid,.badge-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.timed-list{grid-template-columns:1fr}.meta-actions{grid-template-columns:1fr}.meta-card{min-height:122px}.badge-emblem{width:58px;height:58px}.badge-emblem .badge-glyph{font-size:17px}}
@media(max-width:480px){.meta-card-grid,.badge-grid{grid-template-columns:1fr 1fr}.meta-card h4{font-size:5px}.meta-badge{min-height:152px}.badge-emblem{width:52px;height:52px}}
\`x60;
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
  function parseTimeRemaining(){
    const text=String(document.querySelector("#time")?.textContent||"").trim();
    if(!text || text.startsWith("∞")) return null;
    const parts=text.split(":").map(Number);
    if(parts.length!==2 || parts.some(Number.isNaN)) return null;
    return Math.max(0,parts[0]*60+parts[1]);
  }
  let runStartedAt=0;
  let runWasAlive=false;

  function elapsedSeconds(state){
    if(!state?.alive)return 0;
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
    document.querySelector("#"+id)?.classList.remove("hidden");
    if(id==="bootCardDeckPanel")renderCardDeck();
    if(id==="bootBadgePanel")renderBadges();
    if(id==="bootAchievementPanel")renderTimedAchievements(getRunState());
  }

  function wirePanels(){
    [["bootCardDeck","bootCardDeckPanel"],["bootBadgeArchive","bootBadgePanel"],["bootAutoAchievements","bootAchievementPanel"]].forEach(([button,panel])=>{
      document.querySelector("#"+button)?.addEventListener("click",()=>showMetaPanel(panel));
    });
    ["bootCardDeckBack","bootBadgeBack","bootAchievementsBack"].forEach(id=>{
      document.querySelector("#"+id)?.addEventListener("click",hideMetaPanels);
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