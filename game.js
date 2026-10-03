const canvas=document.querySelector("#game"),ctx=canvas.getContext("2d"),message=document.querySelector("#message"),scoreEl=document.querySelector("#score"),comboEl=document.querySelector("#combo"),timeEl=document.querySelector("#time"),bestEl=document.querySelector("#best"),start=document.querySelector("#start"),toast=document.querySelector("#toast"),zoneEl=document.querySelector("#zone"),evoEl=document.querySelector("#evo"),bossHud=document.querySelector("#bossHud"),bossHp=document.querySelector("#bossHp"),statsPanel=document.querySelector("#runStats"),missionPanel=document.querySelector("#missions"),pauseBtn=document.querySelector("#pauseBtn"),eventBanner=document.querySelector("#eventBanner"),floaters=document.querySelector("#floaters"),saveStats=document.querySelector("#saveStats");
const dashBtn=document.querySelector("#dash"),shieldBtn=document.querySelector("#shield"),pulseBtn=document.querySelector("#pulse"),furyBtn=document.querySelector("#fury"),dashFill=document.querySelector("#dashFill"),shieldFill=document.querySelector("#shieldFill"),pulseFill=document.querySelector("#pulseFill"),furyFill=document.querySelector("#furyFill");
const COLS=32,ROWS=20,RUN_TIME=300000,FUN_RUN_TIME=180000;const settingsKey="snake-evolution-settings";const defaultSettings={grid:true,vibration:true,reducedMotion:false};let settings={...defaultSettings};try{settings={...defaultSettings,...JSON.parse(localStorage.getItem(settingsKey)||"{}")}}catch{}
let funMode=false,activeRunTime=RUN_TIME,funSegment=0;
let snake=[],dir,next,energy=null,core=null,hazards=[],hunters=[],powerups=[],boss=null,supplyDrop=null,runMutation=null,score=0,combo=1,alive=false,paused=false,startedAt=0,timer,spawnClock=0,eventClock=0,hunterClock=0,bossClock=0,supplyDropClock=0,level=1,zone=0,shieldUntil=0,pulseUntil=0,dashReady=0,shieldReady=0,pulseReady=0,furyUntil=0,fury=0,lives=3,maxLives=4,lastStandAnnounced=false,xp=0,xpLevel=1,xpNext=100,danger=0,threatBonus=0,lastDangerBand=0,lastZone=-1,objective=null,objectiveDone=false,contract=null,contractDone=false,contractRewarded=false,streakRewards=0,chain=0,eventClock2=0,stats={energy:0,cores:0,elites:0,hunters:0,wardens:0,damage:0,runCount:0,powerups:0,pulses:0,furyUses:0,supplyDrops:0,contracts:0};
let contractAccepted=false,contractOfferOpen=false,contractDeclined=false,extractionOpen=false,extractionNextAt=0,extractionHeatUntil=0,advancedExitMode="RUNNING",chainUntil=0,chainBest=0,salvageChain=0,salvageUntil=0,advancedZoneEvent=null;
const missionList=document.querySelector("#missionList");const best=()=>Number(localStorage.getItem("snake-evolution-best")||0);
const missions=()=>{try{return JSON.parse(localStorage.getItem("snake-evolution-missions")||"{}")}catch{return {}}};
const saveMissions=m=>{try{localStorage.setItem("snake-evolution-missions",JSON.stringify(m))}catch{}};
const same=(a,b)=>a.x===b.x&&a.y===b.y,rand=()=>({x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)});
const zoneNames=["NEON GRID","HAZARD SECTOR","DARK SECTOR","Warden Territory","FINAL LOCKDOWN"];
const evoNames=["RUNNER","CHARGER","PHANTOM","OVERLORD"];const evoColors=["#79e35b","#ffd85c","#a66cff","#ff3f8f"];
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);if(r.width<2||r.height<2)return;canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));ctx.setTransform(canvas.width/COLS,0,0,canvas.height/ROWS,0,0)}addEventListener("resize",resize,{passive:true});addEventListener("orientationchange",()=>setTimeout(resize,80),{passive:true});if(window.visualViewport)visualViewport.addEventListener("resize",resize,{passive:true});resize();
function gain(points){const mutationScore=runMutation?.[0]==="SALVAGE RUN"?1.35:1;const lastStandMultiplier=lives===1?1.25:1;score+=Math.round(points*mutationScore*lastStandMultiplier*(performance.now()<furyUntil?2:1)*(funMode?1.25:1))}
const mutationDefs=[
  ["SALVAGE RUN","Loot +35%","All score rewards are amplified."],
  ["HUNTER ALERT","Hunters +1 / Threat +8","Waves are denser and hunter kills pay more."],
  ["HAZARD SHIFT","Hazards +3 / Cores faster","The arena is more dangerous, but cores spawn sooner."],
  ["SUPPLY RUSH","Drops arrive faster","Supply drops arrive sooner with better rarity odds."],
  ["OVERCLOCK","Faster movement","Snake speed and DASH cooldowns are improved."]
];
function selectMutation(){runMutation=mutationDefs[Math.floor(Math.random()*mutationDefs.length)]}
function mutationName(){return runMutation?.[0]||"STANDARD"}
const objectiveDefs=[
  ["ENERGY RUSH","Collect 12 ENERGY",()=>stats.energy,12],
  ["HUNTER BOUNTY","Defeat 5 HUNTERS",()=>stats.hunters,5],["ELITE HUNT","Defeat 2 ELITE HUNTERS",()=>stats.elites,2],
  ["CORE RAID","Collect 2 CORES",()=>stats.cores,2],
  ["SURVIVOR","Stay alive for 60 seconds",()=>Math.floor((performance.now()-startedAt)/1000),60]
];
function gainXp(amount){xp+=Math.max(0,amount);while(xp>=xpNext&&xpLevel<10){xp-=xpNext;xpLevel++;xpNext=100+xpLevel*50;lives=Math.min(maxLives,lives+1);say("XP LEVEL UP // LV"+xpLevel+" // LIFE RECOVERED");haptic(18)}}
function selectObjective(){objective=objectiveDefs[Math.floor(Math.random()*objectiveDefs.length)];objectiveDone=false}
function checkObjective(){if(!objective||objectiveDone)return;const value=objective[2](),target=objective[3];if(value>=target){objectiveDone=true;gain(350);gainXp(100);chargeFury(35);say("OBJECTIVE COMPLETE // +350 // +100 XP");haptic(32)}}
const contractDefs=[
  ["REDLINE","Reach 70% THREAT","danger",70,500,90,25],
  ["BOUNTY","Defeat 7 HUNTERS","hunters",7,500,100,20],
  ["ELITE PURGE","Defeat 2 ELITES","elites",2,650,120,30],
  ["CORE RAID","Collect 3 CORES","cores",3,600,110,30],
  ["SALVAGE","Collect 4 POWER-UPS","powerups",4,550,90,25]
];
const rarityData={
  common:{label:"COMMON",score:120,xp:30,fury:10},
  rare:{label:"RARE",score:260,xp:55,fury:20},
  legendary:{label:"LEGENDARY",score:650,xp:120,fury:35}
};
function selectContract(){contract=contractDefs[Math.floor(Math.random()*contractDefs.length)];contractDone=false;contractRewarded=false;threatBonus=contract[2]==="danger"?8:0}
function contractValue(){if(!contract)return 0;return contract[2]==="danger"?danger:stats[contract[2]]||0}
function checkContract(){
  if(!contract||contractDone)return;
  if(contractValue()>=contract[3]){
    contractDone=true;
    threatBonus=0;
    stats.contracts++;
    const reward=contract[4];
    gain(reward);gainXp(contract[5]);chargeFury(contract[6]);
    say("CONTRACT COMPLETE // +"+reward+" // +"+contract[5]+" XP");
    event(contract[0]+" // CLEARED");
    floatText("CONTRACT +"+reward);
    haptic(35);
  }
}
function spawnSupplyDrop(){
  if(supplyDrop)return;
  const roll=Math.random(),late=currentZone()>=3;
  const supplyBoost=runMutation?.[0]==="SUPPLY RUSH";const legendaryChance=(late?.16:.10)+(supplyBoost?0.08:0),rareChance=(late?.48:.38)+(supplyBoost?0.12:0);const rarity=roll<legendaryChance?"legendary":roll<rareChance?"rare":"common";
  const pos=free();
  supplyDrop={x:pos.x,y:pos.y,rarity,expires:performance.now()+14000};
  const hazardCount=rarity==="legendary"?5:rarity==="rare"?4:3;
  for(let i=0;i<hazardCount;i++)hazards.push(free());
  event("SUPPLY DROP // "+rarityData[rarity].label);
  say("SUPPLY DROP // "+rarityData[rarity].label+" // 14s");
}
function collectSupplyDrop(head){
  if(!supplyDrop||!same(supplyDrop,head))return;
  const rarity=supplyDrop.rarity,data=rarityData[rarity];
  supplyDrop=null;
  stats.supplyDrops++;
  gain(data.score);gainXp(data.xp);chargeFury(data.fury);haptic(rarity==="legendary"?32:16);
  if(rarity==="common"){dashReady=performance.now();say("SUPPLY // DASH READY // +"+data.score)}
  else if(rarity==="rare"){shieldReady=performance.now();if(!core)core=free();say("RARE SUPPLY // SHIELD + CORE")}
  else{lives=Math.min(3,lives+1);dashReady=performance.now();shieldReady=performance.now();pulseReady=performance.now();hazards=hazards.filter(h=>Math.abs(h.x-snake[0].x)+Math.abs(h.y-snake[0].y)>6);event("LEGENDARY // EMERGENCY RESUPPLY");say("LEGENDARY SUPPLY // LIFE +1 // ALL SYSTEMS READY")}
  floatText(data.label+" +"+data.score);
}
function handleZoneTransition(){
  const current=currentZone();
  if(current===lastZone)return;
  lastZone=current;
  if(current<=0)return;
  const names=["SECTOR SHIFT","HAZARD SECTOR","DARK SECTOR","WARDEN TERRITORY","FINAL LOCKDOWN"];
  event(names[current]+" // NEW THREATS");
  say("ZONE "+(current+1)+" // "+zoneNames[current]);
  if(current>=2&&!boss)powerups.push({...free(),type:"overdrive"});
  if(current>=1&&!supplyDrop)spawnSupplyDrop();
  gainXp(20*current);
}
function checkStreakRewards(){
  const thresholds=[5,10,15];
  const next=thresholds[streakRewards];
  if(!next||chain<next)return;
  streakRewards++;
  const bonus=next*50;
  gain(bonus);gainXp(next*8);chargeFury(15);
  say("STREAK x"+next+" // +"+bonus);
  floatText("STREAK x"+next);
  haptic(12+next);
}
function chargeFury(amount){if(performance.now()<furyUntil)return;fury=Math.min(100,fury+amount);updateAbilityUI()}
function haptic(ms=12){if(settings.vibration&&navigator.vibrate)try{navigator.vibrate(ms)}catch{}}
function free(){let p,t=0;do{p=rand();t++}while(t<600&&(snake.some(s=>same(s,p))||hazards.some(s=>same(s,p))||hunters.some(s=>same(s,p))||powerups.some(s=>same(s,p))||(energy&&same(energy,p))||(core&&same(core,p))||(boss&&same(boss,p))));return p}
function currentZone(){return Math.min(4,Math.floor((performance.now()-startedAt)/(funMode?36000:60000)))}
function currentLevel(){return Math.min(4,1+Math.floor(score/600))}
function evolution(){return currentLevel()}
function event(t){eventBanner.textContent="⚠ "+t;eventBanner.classList.add("show");clearTimeout(event.t);event.t=setTimeout(()=>eventBanner.classList.remove("show"),1300)}
function floatText(t,p=snake[0]){const el=document.createElement("span");el.className="floater";el.textContent=t;el.style.left=((p.x/COLS)*100)+"%";el.style.top=((p.y/ROWS)*100)+"%";floaters.appendChild(el);setTimeout(()=>el.remove(),700)}
function pause(){if(!alive)return;paused=!paused;if(paused){clearTimeout(timer);const o=document.createElement("div");o.className="pause-overlay";o.id="pauseOverlay";o.innerHTML="<div><h2>PAUSED</h2><button id=\"resume\">RESUME</button><button id=\"restartPause\">RESTART</button><button id=\"menuPause\">MAIN MENU</button></div>";document.querySelector(".game-shell").appendChild(o);o.querySelector("#resume").onclick=pause;o.querySelector("#restartPause").onclick=()=>{o.remove();paused=false;reset()};o.querySelector("#menuPause").onclick=()=>{o.remove();alive=false;message.style.display="none";window.showBootMenu?.()}}else{document.querySelector("#pauseOverlay")?.remove();move()}}
function showSave(){let s={};try{s=JSON.parse(localStorage.getItem("snake-evolution-save")||"{}")}catch{}saveStats.innerHTML="RUNS <strong>"+(s.runs||0)+"</strong> · WINS <strong>"+(s.wins||0)+"</strong> · BEST COMBO <strong>x"+(s.combo||1)+"</strong> · WARDENS <strong>"+(s.wardens||0)+"</strong> · ELITES <strong>"+(s.elites||0)+"</strong> · DROPS <strong>"+(s.supplyDrops||0)+"</strong> · CONTRACTS <strong>"+(s.contracts||0)+"</strong> · EVOLUTION <strong>"+(evoNames[s.evo-1]||"RUNNER")+"</strong>"}
function hud(){
 scoreEl.textContent=score;
 comboEl.textContent=chain>1?"x"+combo+" / CHAIN x"+chain:"x"+combo;
 bestEl.textContent=best();
 const left=Math.max(0,activeRunTime-(performance.now()-startedAt));
 timeEl.textContent=Math.floor(left/60000)+":"+String(Math.ceil((left%60000)/1000)).padStart(2,"0");
 zone=currentZone();level=currentLevel();
 zoneEl.textContent=zoneNames[zone];evoEl.textContent=evoNames[level-1];
 const lifeEl=document.querySelector("#lives"),streakEl=document.querySelector("#streakMark"),xpEl=document.querySelector("#xp"),xpFillEl=document.querySelector("#xpFill"),xpLevelEl=document.querySelector("#xpLevel"),mutationEl=document.querySelector("#mutation"),mutationLabel=document.querySelector("#mutationLabel");
 if(lifeEl)lifeEl.textContent="♥".repeat(lives)+"♡".repeat(Math.max(0,maxLives-lives));if(streakEl)streakEl.textContent="STREAK x"+chain;
 if(xpEl)xpEl.textContent=xp+"/"+xpNext;
 if(xpFillEl)xpFillEl.style.width=Math.min(100,xp/xpNext*100)+"%";
 if(xpLevelEl)xpLevelEl.textContent="LVL "+xpLevel;
 if(mutationEl)mutationEl.textContent=mutationName();
 if(mutationLabel)mutationLabel.textContent=runMutation?.[1]||"STANDARD";
 danger=Math.min(100,Math.round(zone*13+hunters.length*9+hazards.length*4+Math.min(28,(performance.now()-startedAt)/12000)+threatBonus));
 const dangerEl=document.querySelector("#danger"),dangerFill=document.querySelector("#dangerFill"),dangerLabel=document.querySelector("#dangerLabel"),dangerCard=document.querySelector(".danger-card");
 if(dangerEl)dangerEl.textContent=danger+"%";
 if(dangerFill)dangerFill.style.width=danger+"%";
 if(dangerLabel){dangerLabel.textContent=danger>=85?"CRITICAL":danger>=60?"HIGH":danger>=35?"ELEVATED":"STABLE";dangerLabel.classList.toggle("elevated",danger>=35&&danger<60);dangerLabel.classList.toggle("high",danger>=60&&danger<85);dangerLabel.classList.toggle("critical",danger>=85)}if(dangerCard){dangerCard.classList.toggle("elevated",danger>=35&&danger<60);dangerCard.classList.toggle("high",danger>=60&&danger<85);dangerCard.classList.toggle("critical",danger>=85)}
 const objectiveEl=document.querySelector("#objective"),objectiveFill=document.querySelector("#objectiveFill"),objectiveLabel=document.querySelector("#objectiveLabel");
 if(objective){
   const value=Math.min(objective[3],objective[2]()),pct=Math.min(100,value/objective[3]*100);
   if(objectiveEl)objectiveEl.textContent=objective[0];
   if(objectiveLabel){objectiveLabel.textContent=objectiveDone?"COMPLETE":value+"/"+objective[3];objectiveLabel.classList.toggle("complete",objectiveDone)}if(objectiveFill)objectiveFill.parentElement?.classList.toggle("complete",objectiveDone);
   if(objectiveFill)objectiveFill.style.width=pct+"%";
 }
 const contractEl=document.querySelector("#contract"),contractFill=document.querySelector("#contractFill"),contractLabel=document.querySelector("#contractLabel"),contractCard=document.querySelector(".contract-card");
 if(contract){
   const value=Math.min(contract[3],contractValue()),pct=Math.min(100,value/contract[3]*100);
   if(contractEl)contractEl.textContent=contract[0];
   if(contractLabel){contractLabel.textContent=contractDone?"COMPLETE":value+"/"+contract[3];contractLabel.classList.toggle("complete",contractDone)}
   if(contractFill)contractFill.style.width=pct+"%";
   if(contractCard)contractCard.classList.toggle("complete",contractDone);
 }
 if(boss){bossHud.classList.add("show");bossHp.textContent=boss.hp+"/"+boss.maxHp}else bossHud.classList.remove("show")
}
function say(t){toast.textContent=t;toast.classList.add("show");clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove("show"),1000)}
function reset(){clearTimeout(timer);paused=false;funMode=localStorage.getItem("snake-evolution-mode")==="party";activeRunTime=funMode?FUN_RUN_TIME:RUN_TIME;funSegment=0;document.querySelector("#pauseOverlay")?.remove();selectMutation();snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];dir=next={x:1,y:0};score=0;combo=1;hazards=[];hunters=[];powerups=[];boss=null;supplyDrop=null;spawnClock=0;eventClock=0;hunterClock=0;bossClock=0;supplyDropClock=0;level=1;zone=0;stats={energy:0,cores:0,elites:0,hunters:0,wardens:0,damage:0,runCount:0,powerups:0,pulses:0,furyUses:0,supplyDrops:0,contracts:0};chain=0;eventClock2=0;fury=0;furyUntil=0;streakRewards=0;lastZone=-1;lastDangerBand=0;lives=funMode?4:3;lastStandAnnounced=false;xp=0;xpLevel=1;xpNext=100;danger=0;threatBonus=0;contract=null;contractDone=false;contractRewarded=false;selectObjective();selectContract();energy=free();core=null;shieldUntil=pulseUntil=0;dashReady=shieldReady=pulseReady=0;alive=true;startedAt=performance.now();message.classList.remove("show");message.classList.add("hidden");statsPanel.classList.remove("show");missionPanel.classList.remove("show");start.textContent="RUN AGAIN";event(funMode?"PARTY RUN // CHAOS ONLINE":"MUTATION // "+mutationName());say(funMode?"PARTY RUN // 03:00 // +25% SCORE":mutationName()+" // "+(runMutation?.[1]||"STANDARD"));hud();draw();move()}
function setDir(x,y){
 if(!alive||paused||(!x&&!y))return;
 if(x===-dir.x&&y===-dir.y)return;
 next={x,y};
}

function useDash(){if(!alive||paused||performance.now()<dashReady)return;clearTimeout(timer);const baseCd=evolution()>=3?5500:7000,cd=runMutation?.[0]==="OVERCLOCK"?Math.round(baseCd*.8):baseCd;dashReady=performance.now()+cd;say("DASH // OVERRIDE");move(true)}
function useShield(){if(!alive||paused||performance.now()<shieldReady)return;shieldReady=performance.now()+12000;shieldUntil=performance.now()+2500;say("SHIELD // ACTIVE");hud();updateAbilityUI();draw()}
function usePulse(){if(!alive||paused||performance.now()<pulseReady)return;stats.pulses++;chargeFury(20);haptic(18);const cd=evolution()>=3?10500:15000;pulseReady=performance.now()+cd;pulseUntil=performance.now()+350;const nearby=hunters.filter(h=>Math.abs(h.x-snake[0].x)+Math.abs(h.y-snake[0].y)<=8);
let destroyed=0;
nearby.forEach(h=>{if(h.type==="elite"){h.hp--;if(h.hp<=0){destroyed++;stats.elites++}}else destroyed++});
if(nearby.length)hunters=hunters.filter(h=>!nearby.includes(h)||h.type==="elite"&&h.hp>0);
if(destroyed){stats.hunters+=destroyed;gainXp(destroyed*30+stats.elites*15);chain+=destroyed;gain(destroyed*(runMutation?.[0]==="HUNTER ALERT"?140:100));chargeFury(destroyed*10);floatText("CHAIN x"+chain);checkStreakRewards()}hazards=hazards.filter(h=>Math.abs(h.x-snake[0].x)+Math.abs(h.y-snake[0].y)>5);if(boss){boss.hp=Math.max(0,boss.hp-2);if(boss.hp===0)destroyBoss()}gain(25);say("PULSE // CLEAR");hud();updateAbilityUI()}
function useFury(){if(!alive||paused||fury<100||performance.now()<furyUntil)return;fury=0;furyUntil=performance.now()+8000;stats.furyUses++;haptic(28);hunters=[];hazards=hazards.filter(h=>Math.abs(h.x-snake[0].x)+Math.abs(h.y-snake[0].y)>8);say("FURY // 2X SCORE // THREAT WIPE");hud();draw()}
function key(e){const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," ","w","a","s","d","shift","q"].includes(k))e.preventDefault();if(contractOfferOpen&&(k===" "||k==="enter")){acceptContract();return}if(k==="escape"||k==="p"){pause();return}if(k==="arrowup"||k==="w")setDir(0,-1);if(k==="arrowdown"||k==="s")setDir(0,1);if(k==="arrowleft"||k==="a")setDir(-1,0);if(k==="arrowright"||k==="d")setDir(1,0);if(k===" ")useDash();if(k==="shift")useShield();if(k==="e")usePulse();if(k==="q")useFury()}
addEventListener("keydown",key);
start.onclick=()=>{message.classList.remove("show");message.classList.add("hidden");reset()};
showSave();
document.querySelectorAll("[data-dir]").forEach(b=>b.addEventListener("pointerdown",e=>{
 e.preventDefault();
 const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.dir];
 setDir(...d);
},{passive:false}));
dashBtn?.addEventListener("pointerdown",e=>{e.preventDefault();useDash()},{passive:false});
shieldBtn?.addEventListener("pointerdown",e=>{e.preventDefault();useShield()},{passive:false});
pulseBtn?.addEventListener("pointerdown",e=>{e.preventDefault();usePulse()},{passive:false});
furyBtn?.addEventListener("pointerdown",e=>{e.preventDefault();useFury()},{passive:false});
let touchStart=null,lastTouchInputAt=0,touchDirectionSent=false;
const beginTouch=(x,y)=>{
 if(!alive||paused)return;
 touchStart={x,y};
 touchDirectionSent=false;
};
const applySwipe=(x,y)=>{
 if(!touchStart||!alive||paused||touchDirectionSent)return;
 const dx=x-touchStart.x,dy=y-touchStart.y;
 if(Math.max(Math.abs(dx),Math.abs(dy))<10)return;
 const now=performance.now();
 if(now-lastTouchInputAt<45)return;
 lastTouchInputAt=now;
 touchDirectionSent=true;
 if(Math.abs(dx)>Math.abs(dy))setDir(Math.sign(dx),0);else setDir(0,Math.sign(dy));
};
const finishTouch=(x,y)=>{
 applySwipe(x,y);
 touchStart=null;
 touchDirectionSent=false;
};
canvas.addEventListener("pointerdown",e=>{
 if(e.pointerType==="mouse")return;
 e.preventDefault();
 try{canvas.setPointerCapture(e.pointerId)}catch{}
 beginTouch(e.clientX,e.clientY);
},{passive:false});
canvas.addEventListener("pointermove",e=>{
 if(e.pointerType==="mouse")return;
 e.preventDefault();
 applySwipe(e.clientX,e.clientY);
},{passive:false});
canvas.addEventListener("pointerup",e=>{
 if(e.pointerType==="mouse")return;
 e.preventDefault();
 finishTouch(e.clientX,e.clientY);
 try{canvas.releasePointerCapture(e.pointerId)}catch{}
},{passive:false});
canvas.addEventListener("pointercancel",e=>{
 touchStart=null;
 touchDirectionSent=false;
 try{canvas.releasePointerCapture(e.pointerId)}catch{}
},{passive:true});
canvas.addEventListener("touchstart",e=>{if(alive&&!paused)e.preventDefault()},{passive:false});
canvas.addEventListener("touchmove",e=>{if(alive&&!paused)e.preventDefault()},{passive:false});
function spawnWave(){const lv=Math.min(5,1+Math.floor((performance.now()-startedAt)/60000));const count=Math.min(1+Math.floor(lv/2)+(runMutation?.[0]==="HUNTER ALERT"?1:0),6);while(hunters.length<count){const elite=lv>=3&&Math.random()<.22;hunters.push({...free(),type:elite?"elite":Math.random()<.35?"interceptor":"hunter",hp:elite?2:1})};if(lv>=2&&hazards.length<4+lv+(runMutation?.[0]==="HAZARD SHIFT"?3:0))hazards.push(free());if(lv>=3&&Math.random()<.65){const roll=Math.random();const type=roll<.08?"medkit":roll<.16?"apex":["overdrive","magnet","repair"][Math.floor(Math.random()*3)];powerups.push({...free(),type})}say("WAVE // LV"+lv)}
function hunterStep(){
 hunters.forEach(h=>{
   const step=()=>{const dx=snake[0].x-h.x,dy=snake[0].y;if(h.type==="interceptor"&&Math.abs(dx)+Math.abs(dy)<10){h.x+=Math.sign(dx);h.y+=Math.sign(dy)}else if(Math.abs(dx)>Math.abs(dy))h.x+=Math.sign(dx);else h.y+=Math.sign(dy);h.x=(h.x+COLS)%COLS;h.y=(h.y+ROWS)%ROWS};
   step();
   if(h.type==="elite")step();
 })
}
function spawnBoss(){if(boss)return;boss={...free(),hp:12,maxHp:12,phase:1};event("WARDEN INCOMING");say("WARDEN // BOSS INBOUND")}
function destroyBoss(){if(!boss)return;boss=null;stats.wardens++;gainXp(150);chain++;const points=1000+chain*100;gain(points);chargeFury(25);floatText("+"+points);say("WARDEN DESTROYED // +"+points)}
function bossStep(){if(!boss)return;bossClock++;boss.phase=boss.hp<=6?2:1;if(boss.phase===2&&bossClock%3)return;if(boss.phase===1&&bossClock%5)return;const dx=snake[0].x-boss.x,dy=snake[0].y-boss.y;if(Math.abs(dx)>Math.abs(dy))boss.x+=Math.sign(dx);else boss.y+=Math.sign(dy);boss.x=(boss.x+COLS)%COLS;boss.y=(boss.y+ROWS)%ROWS;if(bossClock%(boss.phase===2?7:15)===0)hazards.push(free());if(boss.phase===2&&bossClock%21===0){event("WARDEN PHASE 2");say("WARDEN // ENRAGED")}}
function collectPowerup(head){const i=powerups.findIndex(x=>same(x,head));if(i<0)return;const type=powerups[i].type;powerups.splice(i,1);stats.powerups++;chargeFury(6);haptic(10);if(type==="overdrive"){dashReady=performance.now();gain(100);say("OVERDRIVE // DASH READY")}else if(type==="magnet"){energy=free();core=free();gain(75);say("MAGNET // LOOT RELOCATED")}else if(type==="apex"){gain(400);gainXp(80);combo=Math.min(9,combo+2);chain+=2;chargeFury(30);hazards=[];say("APEX CORE // THREAT WIPE")}else if(type==="medkit"){lives=Math.min(3,lives+1);gainXp(40);gain(125);say("MEDKIT // LIFE +1")}else{snake.push({...snake[snake.length-1]});gainXp(25);gain(150);say("REPAIR // +LENGTH")}}
const missionDefs=[["energy25","COLLECTOR","Collect 25 ENERGY",()=>stats.energy,25],["core5","CORE HUNTER","Collect 5 CORES",()=>stats.cores,5],["hunter10","HUNTER","Defeat 10 HUNTERS",()=>stats.hunters,10],["combo9","COMBO MASTER","Reach COMBO x9",()=>combo,9],["fury1","FURY","Activate FURY once",()=>stats.furyUses,1],["warden","WARDEN SLAYER","Destroy 1 WARDEN",()=>stats.wardens,1],["nohit","NO HIT","Finish a run without damage",()=>stats.damage===0&&!alive?1:0,1],["score2500","SCORE BREAKER","Score 2,500 points",()=>score,2500],["powerups3","POWER USER","Collect 3 power-ups",()=>stats.powerups,3],["pulses3","PULSE RUNNER","Use PULSE 3 times",()=>stats.pulses,3],["survive120","LONG RUN","Survive 120 seconds",()=>Math.min(120,Math.floor((performance.now()-startedAt)/1000)),120]];
function renderMissions(){if(!missionList)return;const m=missions();missionList.innerHTML=missionDefs.map(([id,name,label,get,target])=>{const done=!!m[id];const value=Math.min(target,get());const pct=Math.round(value/target*100);return `<div class="mission-item ${done?"done":""}"><div><b>${name}</b><span>${label}</span></div><strong>${done?"DONE":value+"/"+target}</strong><i><em style="width:${pct}%"></em></i></div>`}).join("")}
let missionRenderAt=0;
function missionCheck(){
 const m=missions(),done=[];missionDefs.forEach(([id,name,label,get,target])=>{if(!m[id]&&get()>=target){m[id]=1;done.push(name)}});
 const now=performance.now();
 if(done.length)saveMissions(m);
 if(done.length||now-missionRenderAt>=500){missionRenderAt=now;renderMissions()}
 if(done.length){say("MISSION // "+done.join(" + "));haptic(24)}
}
function takeDamage(reason="COLLISION"){stats.damage++;lives=Math.max(0,lives-1);haptic(30);if(lives<=0){say("NO LIVES // RUN OVER");return end()}snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];dir=next={x:1,y:0};shieldUntil=performance.now()+1800;hazards=hazards.filter(h=>Math.abs(h.x-10)+Math.abs(h.y-10)>4);hunters=hunters.filter(h=>Math.abs(h.x-10)+Math.abs(h.y-10)>5);say(reason+" // LIFE LOST // "+lives+" LEFT");if(lives===1&&!lastStandAnnounced){lastStandAnnounced=true;say("LAST STAND // SCORE +25%");event("LAST STAND // BONUS ACTIVE")}hud();draw()}
function move(force=false){if(!alive)return;dir=next;const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS)return end();const protectedNow=performance.now()<shieldUntil||performance.now()<pulseUntil;
if(!protectedNow&&(snake.some((s,i)=>i>0&&same(s,head))||hazards.some(h=>same(h,head))||hunters.some(h=>same(h,head))||(boss&&same(boss,head)))){
 takeDamage(hunters.some(h=>same(h,head))?"HUNTER HIT":hazards.some(h=>same(h,head))?"HAZARD HIT":"SELF HIT");
 if(alive&&!paused)timer=setTimeout(move,Math.max(60,118-combo*6-(force?35:0)-(runMutation?.[0]==="OVERCLOCK"?14:0)));
 return
}
snake.unshift(head);let grow=false;
if(energy&&same(head,energy)){haptic(8);const points=10*combo;gain(points);combo=Math.min(9,combo+1);chain++;stats.energy++;gainXp(12);chargeFury(8);floatText("+"+points);energy=free();grow=true;const coreEvery=runMutation?.[0]==="HAZARD SHIFT"?2:3;if(stats.energy%coreEvery===0){core=free();say("CORE SPAWNED")}}
if(core&&same(head,core)){haptic(14);const points=50*combo+chain*5;gain(points);combo=Math.min(9,combo+1);stats.cores++;gainXp(45);chargeFury(15);core=null;energy=free();grow=true;say("CORE +"+points)}
collectPowerup(head);collectSupplyDrop(head);if(boss&&same(head,boss)&&protectedNow){boss.hp--;gain(100+chain*10);chargeFury(12);floatText("HIT",boss);if(boss.hp<=0)destroyBoss()}
if(!grow)snake.pop();spawnClock++;eventClock++;hunterClock++;eventClock2++;if(eventClock2%210===0)startAdvancedZoneEvent();
supplyDropClock++;if(supplyDrop&&performance.now()>supplyDrop.expires){supplyDrop=null;say("SUPPLY DROP // LOST")}
if(!supplyDrop&&zone>=1&&supplyDropClock%(runMutation?.[0]==="SUPPLY RUSH"?190:260)===0)spawnSupplyDrop();
if(spawnClock%32===0&&hazards.length<Math.min(3+level+zone+(runMutation?.[0]==="HAZARD SHIFT"?3:0),11))hazards.push(free());
if(eventClock%82===0&&hunters.length<Math.min(2+level,6))spawnWave();
if(eventClock%150===0&&currentZone()>=2)spawnBoss();
if(hunterClock%3===0&&hunters.length)hunterStep();bossStep();
if(false&&eventClock%70===0){combo=Math.max(1,combo-1);if(combo===1)chain=0}
const elapsed=performance.now()-startedAt;if(funMode){const segment=Math.min(5,Math.floor(elapsed/30000));if(segment>funSegment){funSegment=segment;const labels=["WARMUP","SPEED ROUND","HAZARD PARTY","HUNTER RUSH","OVERDRIVE","FINAL FRENZY"];gain(150+segment*75);gainXp(20+segment*8);hazards=hazards.filter(h=>Math.abs(h.x-snake[0].x)+Math.abs(h.y-snake[0].y)>3);energy=free();event("PARTY // "+labels[segment]);say("SEGMENT "+segment+" // BONUS +"+(150+segment*75));window.SnakeReworkV2?.showSegment("SEGMENT "+segment,labels[segment]+" // BONUS SECURED")}}if(elapsed>=activeRunTime)return win();
missionCheck();checkObjective();handleZoneTransition();checkStreakRewards();hud();checkContract();if(danger>=85&&lastDangerBand<85){say("DANGER // CRITICAL HEAT");event("CRITICAL HEAT")}lastDangerBand=danger>=85?85:danger>=60?60:0;updateAbilityUI();draw();timer=setTimeout(move,Math.max(40,118-combo*6-(force?35:0)-(runMutation?.[0]==="OVERCLOCK"?14:0)))}
function statsMarkup(win){const bestScore=best(),newRecord=score>=bestScore&&score>0;return '<h2>'+(win?"SURVIVAL COMPLETE":"RUN OVER")+'</h2><div class="stats-grid"><span>SCORE<strong>'+score+'</strong></span><span>XP LVL<strong>'+xpLevel+'</strong></span><span>LIVES<strong>'+lives+'/'+maxLives+'</strong></span><span>TIME<strong>'+timeEl.textContent+'</strong></span><span>COMBO<strong>x'+combo+'</strong></span><span>ENERGY<strong>'+stats.energy+'</strong></span><span>CORES<strong>'+stats.cores+'</strong></span><span>HUNTERS<strong>'+stats.hunters+'</strong></span><span>ELITES<strong>'+stats.elites+'</strong></span><span>WARDENS<strong>'+stats.wardens+'</strong></span><span>SUPPLY<strong>'+stats.supplyDrops+'</strong></span><span>CONTRACT<strong>'+(contract?contract[0]:"-")+(contractDone?" // DONE":"") +'</strong></span><span>ZONE<strong>'+zoneNames[zone]+'</strong></span><span>OBJECTIVE<strong>'+(objective?objective[0]:"-")+(objectiveDone?" // DONE":"") +'</strong></span><span>DANGER<strong>'+danger+'%</strong></span></div>'+(newRecord?'<b class="record">NEW RECORD!</b>':'')}
function persist(win){let s={};try{s=JSON.parse(localStorage.getItem("snake-evolution-save")||"{}")}catch{}s.runs=(s.runs||0)+1;s.wins=(s.wins||0)+(win?1:0);s.combo=Math.max(s.combo||1,combo);s.wardens=(s.wardens||0)+stats.wardens;s.elites=(s.elites||0)+stats.elites;s.supplyDrops=(s.supplyDrops||0)+stats.supplyDrops;s.contracts=(s.contracts||0)+stats.contracts;s.evo=Math.max(s.evo||1,evolution());localStorage.setItem("snake-evolution-save",JSON.stringify(s));showSave()}
function showRunResult(win,summary){const card=message.querySelector(".message-card");if(!card)return;card.querySelector("h2")?.remove();card.querySelector("p")?.remove();card.querySelector(".stats-grid")?.remove();card.querySelector(".record")?.remove();card.querySelector(".result-copy")?.remove();card.insertAdjacentHTML("afterbegin",statsMarkup(win));const copy=document.createElement("p");copy.className="result-copy";copy.textContent=summary;const button=card.querySelector("#start");card.insertBefore(copy,button);statsPanel.innerHTML="";statsPanel.classList.remove("show");missionPanel.classList.remove("show");message.classList.remove("hidden");message.classList.add("show")}
function end(){alive=false;clearTimeout(timer);if(score>best())localStorage.setItem("snake-evolution-best",score);missionCheck();persist(false);showRunResult(false,"RUN COMPLETE // FINAL RESULTS");hud();updateAbilityUI()}
function win(){alive=false;clearTimeout(timer);const bonus=500+level*100;gain(bonus);missionCheck();if(score>best())localStorage.setItem("snake-evolution-best",score);persist(true);showRunResult(true,"SURVIVAL COMPLETE // BONUS +"+bonus);say("SURVIVED // BONUS +"+bonus);hud();updateAbilityUI()}
function renderAbility(button,fill,readyAt,fullCooldown,label,key){
 if(!button||!fill)return;
 const now=performance.now(),remaining=Math.max(0,readyAt-now),ready=remaining===0;
 const progress=ready?100:Math.max(0,100-(remaining/fullCooldown*100));
 fill.style.width=progress+"%";
 button.disabled=!ready;
 button.setAttribute("aria-disabled",String(!ready));
 button.classList.toggle("ready",ready);
 button.classList.toggle("cooldown",!ready);
 button.querySelector("b").textContent=ready?label:label+" // CD";
 button.querySelector("span").textContent=ready?key:Math.ceil(remaining/1000)+"s";
}
function updateAbilityUI(){
 const now=performance.now();
 renderAbility(dashBtn,dashFill,dashReady,7000,"DASH","SPACE");
 renderAbility(shieldBtn,shieldFill,shieldReady,12000,"SHIELD","SHIFT");
 renderAbility(pulseBtn,pulseFill,pulseReady,evolution()>=3?10500:15000,"PULSE","E");
 if(furyFill){
   furyFill.style.width=fury+"%";
   const active=now<furyUntil,ready=fury>=100&&!active;
   furyBtn.disabled=!ready;
   furyBtn.setAttribute("aria-disabled",String(!ready));
   furyBtn.classList.toggle("ready",ready);
   furyBtn.classList.toggle("cooldown",!ready&&!active);
   furyBtn.classList.toggle("active",active);
   furyBtn.querySelector("b").textContent=active?"FURY // ACTIVE":ready?"FURY":"FURY // CHARGE";
   furyBtn.querySelector("span").textContent=active?Math.max(1,Math.ceil((furyUntil-now)/1000))+"s":Math.round(fury)+"%";
 }
}
function pixel(p,c){ctx.fillStyle=c;ctx.fillRect(p.x+.12,p.y+.12,.76,.76);ctx.fillStyle="#0005";ctx.fillRect(p.x+.12,p.y+.72,.76,.14)}
function draw(){const z=currentZone();const bg=["#060806","#090704","#050609","#09050b","#0b0508"][z],grid=["#111a15","#21150e","#121521","#201125","#281015"][z];ctx.fillStyle=bg;ctx.fillRect(0,0,COLS,ROWS);if(settings.grid){ctx.strokeStyle=grid;ctx.lineWidth=.1;for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,ROWS);ctx.stroke()}for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(COLS,y);ctx.stroke()}}
hazards.forEach(p=>pixel(p,z>=3?"#ff3f6b":"#ff5b62"));hunters.forEach(p=>{pixel(p,p.type==="elite"?"#ff9f43":p.type==="interceptor"?"#d66cff":"#66c7ff");ctx.fillStyle=p.type==="elite"?"#5a2a08":"#0b2634";ctx.fillRect(p.x+.3,p.y+.3,.4,.4);if(p.type==="elite"){ctx.strokeStyle="#ffd85c";ctx.lineWidth=.12;ctx.strokeRect(p.x+.07,p.y+.07,.86,.86)}});powerups.forEach(p=>pixel(p,p.type==="overdrive"?"#ff9f43":p.type==="magnet"?"#a66cff":p.type==="apex"?"#ffffff":p.type==="medkit"?"#ff6b8b":"#4de1d1"));if(supplyDrop){const c=supplyDrop.rarity==="legendary"?"#ffffff":supplyDrop.rarity==="rare"?"#ffd85c":"#66c7ff";pixel(supplyDrop,c);ctx.strokeStyle=c;ctx.lineWidth=.18;ctx.strokeRect(supplyDrop.x+.04,supplyDrop.y+.04,.92,.92)}if(boss){pixel(boss,boss.phase===2?"#ff203f":"#ff3f8f");ctx.fillStyle="#fff";ctx.fillRect(boss.x+.18,boss.y+.18,.64,.12);ctx.fillStyle="#111";ctx.fillRect(boss.x+.18,boss.y+.18,.64*(boss.hp/boss.maxHp),.12)}if(energy)pixel(energy,"#79e35b");if(core){pixel(core,"#ffd85c");pixel({x:core.x,y:Math.max(0,core.y-1)},"#ffd85c")}snake.forEach((p,i)=>pixel(p,i?evoColors[evolution()-1]:"#b8ff8d"));if(level>1){ctx.strokeStyle=evoColors[evolution()-1];ctx.lineWidth=.14;ctx.strokeRect(snake[0].x+.04,snake[0].y+.04,.92,.92)}if(performance.now()<shieldUntil){ctx.strokeStyle="#66c7ff";ctx.lineWidth=.25;ctx.strokeRect(snake[0].x+.08,snake[0].y+.08,.84,.84)}}
message.classList.add("hidden");message.classList.remove("show");draw();updateAbilityUI();showSave();renderMissions();

const upgradeDefs=[
  ["dash","DASH MKII",3,"Shorter DASH cooldown."],
  ["scanner","CORE SCANNER",3,"Cores appear sooner."],
  ["fury","FURY CELL",3,"FURY charge is more efficient."],
  ["armor","REINFORCED BODY",3,"Longer recovery shield after a hit."]
];
const achievementDefs=[
  ["warden1","WARDEN BREAKER","Destroy a WARDEN.",s=>s.wardens>=1],
  ["elite10","ELITE TRACKER","Defeat 10 ELITES.",s=>s.elites>=10],
  ["fury5","FURY ENGINE","Activate FURY 5 times.",s=>s.furyUses>=5],
  ["cashout3","CASH OUT ARTIST","Complete 3 EXTRACTIONS.",s=>s.extracts>=3],
  ["salvage8","SALVAGE MASTER","Reach SALVAGE x8.",s=>s.bestSalvage>=8],
  ["lockdown","FINAL LOCKDOWN","Reach the final zone.",s=>s.bestZone>=4],
  ["runs5","RUN VETERAN","Complete 5 runs.",s=>s.runs>=5],
  ["clean","CLEAN RUN","Survive 5 minutes with no damage.",(s,win,mode)=>win&&mode==="SURVIVED"&&stats.damage===0],
  ["alert","HUNTER ALERT SURVIVOR","Survive under HUNTER ALERT.",(s,win)=>win&&runMutation?.[0]==="HUNTER ALERT"]
];
function readStore(key,fallback={}){try{return {...fallback,...JSON.parse(localStorage.getItem(key)||"{}")}}catch{return {...fallback}}}
function writeStore(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function getUpgrades(){return readStore("snake-evolution-upgrades",{data:0,dash:0,scanner:0,fury:0,armor:0})}
function upgradeCost(level){return 2+level*2}
function renderUpgrades(){
  const root=document.querySelector("#upgradeList"),dataEl=document.querySelector("#upgradeData");if(!root)return;const u=getUpgrades();
  if(dataEl)dataEl.textContent="DATA "+u.data;
  root.innerHTML=upgradeDefs.map(def=>{const id=def[0],name=def[1],max=def[2],desc=def[3],lv=u[id]||0,cost=lv<max?upgradeCost(lv):0;return "<button class=\"upgrade-item\" data-upgrade=\""+id+"\" "+(alive?"disabled ":"")+(lv>=max||u.data<cost?"disabled":"")+"><b>"+name+"</b><span>LV "+lv+"/"+max+" // "+desc+"</span><strong>"+(lv>=max?"MAX":"BUY "+cost+" DATA")+"</strong></button>"}).join("");
  root.querySelectorAll("[data-upgrade]").forEach(b=>b.addEventListener("click",()=>buyUpgrade(b.dataset.upgrade)))
}
function buyUpgrade(id){
  const u=getUpgrades(),def=upgradeDefs.find(x=>x[0]===id);if(!def||alive||u[id]>=def[2])return;
  const cost=upgradeCost(u[id]||0);if(u.data<cost)return;
  u.data-=cost;u[id]=(u[id]||0)+1;writeStore("snake-evolution-upgrades",u);say(def[1]+" // LV "+u[id]);haptic(18);renderUpgrades()
}
function renderAchievements(){
  const root=document.querySelector("#achievementList");if(!root)return;const a=readStore("snake-evolution-achievements",{});
  root.innerHTML=achievementDefs.map(def=>"<div class=\"achievement-item "+(a[def[0]]?"unlocked":"")+" \"><b>"+(a[def[0]]?"UNLOCKED":"LOCKED")+" // "+def[1]+"</b><span>"+def[2]+"</span></div>").join("")
}
function checkAchievements(win=false,mode="ENDED"){
  const s=readStore("snake-evolution-save",{runs:0,wardens:0,elites:0,extracts:0,bestSalvage:0,bestZone:0}),a=readStore("snake-evolution-achievements",{}),unlocked=[];
  achievementDefs.forEach(def=>{if(!a[def[0]]&&def[3](s,win,mode)){a[def[0]]=1;unlocked.push(def[1])}});
  writeStore("snake-evolution-achievements",a);renderAchievements();
  if(unlocked.length){say("ACHIEVEMENT // "+unlocked.join(" + "));event("UNLOCKED // "+unlocked[0]);haptic(30)}
}
function touchAdvancedChain(){chainUntil=performance.now()+2600+combo*150}
function checkAdvancedChain(){if(chain&&performance.now()>chainUntil){chain=0;combo=Math.max(1,combo-1);say("CHAIN LOST // COMBO -1")}}
function registerAdvancedLoot(){
  const now=performance.now();salvageChain=salvageUntil>now?salvageChain+1:1;salvageUntil=now+4500;chainBest=Math.max(chainBest,salvageChain);
  if(salvageChain>1)score+=25*salvageChain;
  if([3,5,8].includes(salvageChain)){const reward=salvageChain*50;score+=reward;gainXp(salvageChain*6);say("SALVAGE x"+salvageChain+" // +"+reward);floatText("SALVAGE x"+salvageChain);haptic(14)}
}
function clearAdvancedLoot(){if(salvageChain&&performance.now()>salvageUntil)salvageChain=0}
function advancedEventActive(type){return advancedZoneEvent?.type===type&&performance.now()<advancedZoneEvent.until}
function startAdvancedZoneEvent(){
  const types=["HAZARD_STORM","HUNTER_SWARM","POWER_SURGE","BLACKOUT","DOUBLE_CORE","HUNTER_LOCK"],type=types[Math.floor(Math.random()*types.length)];
  const durations={HAZARD_STORM:9000,HUNTER_SWARM:9000,POWER_SURGE:10000,BLACKOUT:8000,DOUBLE_CORE:10000,HUNTER_LOCK:9000};
  advancedZoneEvent={type,until:performance.now()+durations[type]};event(type+" // "+Math.ceil(durations[type]/1000)+"s");say(type+" // ACTIVE");
  if(type==="HAZARD_STORM")for(let i=0;i<4+zone;i++)hazards.push(free());
  if(type==="HUNTER_SWARM")while(hunters.length<Math.min(7,4+level))hunters.push({...free(),type:"hunter",variant:null,hp:1});
}
function tickAdvancedEvent(){if(advancedZoneEvent&&performance.now()>advancedZoneEvent.until){say(advancedZoneEvent.type+" // ENDED");advancedZoneEvent=null}}
function openAdvancedExtraction(){if(!alive||extractionOpen)return;extractionOpen=true;paused=true;clearTimeout(timer);document.querySelector("#extractionPanel")?.classList.remove("hidden");event("EXTRACTION // DECISION")}
function cashOut(){if(!extractionOpen||!alive)return;advancedExitMode="CASH OUT";const bonus=Math.round(score*.2)+zone*250+combo*50;extractionOpen=false;paused=false;score+=bonus;document.querySelector("#extractionPanel")?.classList.add("hidden");baseEnd();message.querySelector("h2").textContent="RUN EXTRACTED";message.querySelector("p").textContent="Score secured. Bonus +"+bonus+".";statsPanel.innerHTML=statsMarkup(false)+"<p class=\"result-copy\">EXTRACTION SUCCESS // CASH OUT</p>";renderUpgrades();renderAchievements();advancedExitMode="ENDED"}
function keepRunning(){if(!extractionOpen||!alive)return;extractionOpen=false;paused=false;extractionHeatUntil=performance.now()+30000;extractionNextAt=performance.now()-startedAt+60000;document.querySelector("#extractionPanel")?.classList.add("hidden");gain(150);chargeFury(15);event("KEEP RUNNING // HEAT +12");say("KEEP RUNNING // +150 // FURY +15");move()}
function acceptContract(){if(!contract||!contractOfferOpen)return;contractAccepted=true;contractOfferOpen=false;contractDeclined=false;threatBonus+=contract[2]==="danger"?8:5;say("CONTRACT ACCEPTED // "+contract[0]);event("RISK CONTRACT // LIVE");move()}
function declineContract(){if(!contract||!contractOfferOpen)return;contractAccepted=false;contractOfferOpen=false;contractDeclined=true;threatBonus=0;say("CONTRACT DECLINED");event("CONTRACT // DECLINED");move()}

const baseGain=gain,baseChargeFury=chargeFury,baseUseDash=useDash,baseTakeDamage=takeDamage,baseSelectContract=selectContract,baseCheckContract=checkContract,baseSpawnWave=spawnWave,baseHunterStep=hunterStep,baseSpawnBoss=spawnBoss,baseBossStep=bossStep,baseDraw=draw,baseHud=hud,baseMove=move,baseReset=reset,basePersist=persist,baseEnd=end;
gain=function(points){baseGain(points);if(alive&&points>0)touchAdvancedChain()};
chargeFury=function(amount){const before=fury;baseChargeFury(amount);if(performance.now()<furyUntil||fury>=100)return;const u=getUpgrades();fury=Math.min(100,fury+amount*(u.fury||0)*.08*(advancedEventActive("POWER_SURGE")?.5:0))};
useDash=function(){const before=dashReady;baseUseDash();if(!alive)return;const u=getUpgrades();const baseCd=Math.max(3200,(evolution()>=3?5500:7000)-(u.dash||0)*500);if(dashReady>performance.now())dashReady=Math.min(dashReady,performance.now()+baseCd)};
takeDamage=function(reason){baseTakeDamage(reason);if(alive){const u=getUpgrades();shieldUntil=Math.max(shieldUntil,performance.now()+1800+(u.armor||0)*500)}};
selectContract=function(){baseSelectContract();contractAccepted=false;contractOfferOpen=true;contractDeclined=false;threatBonus=0};
checkContract=function(){if(contractAccepted&&!contractDeclined)baseCheckContract()};
spawnWave=function(){const before=hunters.length;baseSpawnWave();hunters.forEach(h=>{if(h.type==="elite"&&!h.variant)h.variant=Math.random()<.5?"charger":"watcher"});if(advancedEventActive("HUNTER_SWARM"))while(hunters.length<Math.min(7,4+level))hunters.push({...free(),type:"hunter",variant:null,hp:1})};
hunterStep=function(){baseHunterStep();hunters.forEach(h=>{if(h.type==="elite"&&h.variant==="charger"&&Math.random()<.25){h.x=(h.x+Math.sign(snake[0].x-h.x)*2+COLS)%COLS;h.y=(h.y+Math.sign(snake[0].y-h.y)*2+ROWS)%ROWS}else if(h.type==="elite"&&h.variant==="watcher"&&Math.abs(snake[0].x-h.x)+Math.abs(snake[0].y-h.y)<7){h.x=(h.x-Math.sign(snake[0].x-h.x)+COLS)%COLS;h.y=(h.y-Math.sign(snake[0].y-h.y)+ROWS)%ROWS}if(advancedEventActive("HUNTER_LOCK")){h.x=(h.x+Math.sign(snake[0].x-h.x)+COLS)%COLS;h.y=(h.y+Math.sign(snake[0].y-h.y)+ROWS)%ROWS}})};
spawnBoss=function(){baseSpawnBoss();if(boss){boss.maxHp=18;boss.hp=18;boss.phase=1}};
bossStep=function(){if(!boss)return;const prior=boss.phase;boss.phase=boss.hp<=6?3:boss.hp<=12?2:1;baseBossStep();if(!boss)return;if(boss.phase!==prior){event("WARDEN PHASE "+boss.phase);say("WARDEN // PHASE "+boss.phase+(boss.phase===3?" // LOCKDOWN":""))}if(boss.phase===3){boss.phase=3;if(bossClock%2===0)hazards.push(free());if(bossClock%9===0){const p=free();boss.x=p.x;boss.y=p.y;event("WARDEN TELEPORT")}}};
draw=function(){baseDraw();if(boss&&boss.phase===3){ctx.strokeStyle="#ffffff";ctx.lineWidth=.22;ctx.strokeRect(boss.x+.03,boss.y+.03,.94,.94)}if(advancedEventActive("BLACKOUT")){ctx.fillStyle="#010102cc";ctx.fillRect(0,0,COLS,ROWS);ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.arc(snake[0].x+.5,snake[0].y+.5,4.2,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation="source-over"}};
hud=function(){
  baseHud();
  const watcherCount=hunters.filter(h=>h.variant==="watcher").length;danger=Math.min(100,danger+watcherCount*5+(extractionHeatUntil>performance.now()?12:0));
  const d=document.querySelector("#danger"),df=document.querySelector("#dangerFill"),dl=document.querySelector("#dangerLabel");if(d)d.textContent=danger+"%";if(df)df.style.width=danger+"%";if(dl)dl.textContent=danger>=85?"CRITICAL":danger>=60?"HIGH":danger>=35?"ELEVATED":"STABLE";
  const cf=document.querySelector("#chainFill"),cl=document.querySelector("#chainLabel"),sv=document.querySelector("#salvage"),sl=document.querySelector("#salvageLabel"),es=document.querySelector("#extractStatus");const cp=chain?Math.max(0,Math.min(100,(chainUntil-performance.now())/(2600+combo*150)*100)):0;
  if(cf)cf.style.width=cp+"%";if(cl)cl.textContent=chain?"CHAIN x"+chain:"CHAIN READY";if(sv)sv.textContent="x"+salvageChain;if(sl)sl.textContent=salvageChain?"ACTIVE":"READY";
  if(es)es.textContent=extractionOpen?"DECISION":extractionNextAt?Math.max(0,Math.ceil((extractionNextAt-(performance.now()-startedAt))/1000))+"s":"LOCKED";
  const ca=document.querySelector("#contractAccept"),cd=document.querySelector("#contractDecline"),ce=document.querySelector("#contract"),cb=document.querySelector("#contractLabel");if(ca)ca.classList.toggle("hidden",!contractOfferOpen);if(cd)cd.classList.toggle("hidden",!contractOfferOpen);if(ce)ce.textContent=contractOfferOpen?"OFFER":contractDeclined?"DECLINED":contract?.[0]||"NONE";if(cb)cb.textContent=contractOfferOpen?"ACCEPT OR DECLINE":contractDone?"COMPLETE":contract?contractValue()+"/"+contract[3]:"NONE";
  if(boss&&document.querySelector("#bossHp"))document.querySelector("#bossHp").textContent=boss.hp+"/"+boss.maxHp+" // P"+boss.phase;
};
move=function(force=false){
  if(!alive)return;if(contractOfferOpen||extractionOpen)return;
  const elapsed=performance.now()-startedAt;if(extractionNextAt&&elapsed>=extractionNextAt){openAdvancedExtraction();return}
  const before={energy:stats.energy,cores:stats.cores,powerups:stats.powerups,supplyDrops:stats.supplyDrops};
  baseMove(force);
  if(!alive)return;
  if(stats.cores>before.cores||stats.powerups>before.powerups||stats.supplyDrops>before.supplyDrops)registerAdvancedLoot();
  if(stats.energy>before.energy)touchAdvancedChain();
  const u=getUpgrades();const scanner=u.scanner||0;if(stats.energy>before.energy){const every=advancedEventActive("DOUBLE_CORE")?1:Math.max(1,3-scanner-(runMutation?.[0]==="HAZARD SHIFT"?1:0));if(stats.energy%every===0&&!core)core=free()}
  checkAdvancedChain();clearAdvancedLoot();tickAdvancedEvent();
  if(!window.__snakeUltimateLayerActive){hud();draw()}
};
reset=function(){baseReset();contractAccepted=false;contractOfferOpen=true;contractDeclined=false;extractionOpen=false;extractionNextAt=120000;extractionHeatUntil=0;advancedExitMode="RUNNING";chainUntil=performance.now()+4000;chainBest=0;salvageChain=0;salvageUntil=0;advancedZoneEvent=null;renderUpgrades();renderAchievements();hud();draw()};
persist=function(win){basePersist(win);let s=readStore("snake-evolution-save",{runs:0,wins:0,wardens:0,elites:0,supplyDrops:0,contracts:0,extracts:0,bestSalvage:0,bestZone:0});s.extracts=(s.extracts||0)+(advancedExitMode==="CASH OUT"?1:0);s.bestSalvage=Math.max(s.bestSalvage||0,chainBest);s.bestZone=Math.max(s.bestZone||0,currentZone());writeStore("snake-evolution-save",s);const u=getUpgrades();u.data=(u.data||0)+1+currentZone()+Math.floor(score/2500)+(win?2:0)+(advancedExitMode==="CASH OUT"?1:0);writeStore("snake-evolution-upgrades",u);checkAchievements(win,win?"SURVIVED":advancedExitMode==="CASH OUT"?"CASH OUT":"ENDED");renderUpgrades();renderAchievements();showSave();advancedExitMode="ENDED"};
showSave=(()=>{const base=showSave;return function(){base();const u=getUpgrades();saveStats.innerHTML+=" · DATA <strong>"+u.data+"</strong> · EXTRACTS <strong>"+(readStore("snake-evolution-save",{extracts:0}).extracts||0)+"</strong>"}})();
document.querySelector("#contractAccept")?.addEventListener("click",acceptContract);
document.querySelector("#contractDecline")?.addEventListener("click",declineContract);
document.querySelector("#extractCashOut")?.addEventListener("click",cashOut);
document.querySelector("#extractContinue")?.addEventListener("click",keepRunning);
renderUpgrades();renderAchievements();showSave();
window.SnakeEvolution={start:reset,getState:()=>({alive,score,combo,fury,lives,xp,xpLevel,xpNext,danger,level,zone,objective:objective?.[0]||null,objectiveDone,contract:contract?.[0]||null,contractAccepted,contractOfferOpen,contractDone,supplyDrop:supplyDrop?.rarity||null,mutation:mutationName(),salvageChain,zoneEvent:advancedZoneEvent?.type||null,extractionOpen,extractionNextAt})};