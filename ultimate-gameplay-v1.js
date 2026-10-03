/* ULTIMATE GAMEPLAY LAYER V1 */
(() => {
  "use strict";
  window.__snakeUltimateLayerActive=true;
  let dailyMode=false,endlessMode=false,endlessCycle=0,endlessTotalStart=0,dailySeed=0,riskHeatUntil=0,ghostSaved=false,lastPerfectMilestone=0,activeMode="standard";
  let evolutionCards=[],energyRespawnSerial=0,recentEnergyCells=[],encounters=[],encounterClock=0,encounterSerial=0,encounterBoostUntil=0,ghostSyncUntil=0,ghostBestScore=0;
  let runCondition=null,arenaBlocks=[],telegraphs=[],riskShrine=null,secretPortal=null,secretUntil=0;
  let perfectStart=0,perfectBroken=false,deathCause="NONE",maxThreat=0,bountyTarget=null,bountyClaimed=false;
  let enemyId=0,ghostPath=[],ghostIndex=0,runPath=[],nextRiskAt=0,nextSecretAt=0,bossTelegraphUntil=0,layerZone=-1,layerEventClock=0,audioCtx=null;
  const originalRandom=Math.random;
  const baseGainU=gain,baseHudU=hud,baseDrawU=draw,baseMoveU=move,baseResetU=reset,baseTakeDamageU=takeDamage,baseUseDashU=useDash,baseUsePulseU=usePulse,baseUseFuryU=useFury,baseCollectPowerupU=collectPowerup,baseSpawnWaveU=spawnWave,baseHunterStepU=hunterStep,baseBossStepU=bossStep,basePersistU=persist,baseStatsMarkupU=statsMarkup,baseRenderAchievementsU=renderAchievements,baseGainXpU=gainXp;

  function hashSeed(input){let h=2166136261;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function dailyDateKey(){const d=new Date();return d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0")+"-"+String(d.getUTCDate()).padStart(2,"0")}
  function enableDailyRng(){dailySeed=hashSeed("SNAKE-EVOLUTION-DAILY-"+dailyDateKey());Math.random=function(){dailySeed=(Math.imul(1664525,dailySeed)+1013904223)>>>0;return dailySeed/4294967296}}
  function restoreRng(){Math.random=originalRandom}

  const conditionDefs=[
    ["ONE CHANCE","1 LIFE // +40% SCORE"],
    ["NO MEDKITS","MEDKIT // SCORE ONLY"],
    ["LOW VISIBILITY","BLACKOUTS"],
    ["DOUBLE DOWN","THREAT +10 // SCORE +25%"]
  ];
  function chooseCondition(){runCondition=conditionDefs[Math.floor(Math.random()*conditionDefs.length)]}
  function conditionName(){return runCondition?.[0]||"STANDARD"}
  function conditionScoreMult(){return runCondition?.[0]==="ONE CHANCE"?1.4:runCondition?.[0]==="DOUBLE DOWN"?1.25:1}

  const achievementDefsU=[
    ["daily1","DAILY OPERATIVE","Complete a DAILY RUN.",s=>s.dailyRuns>=1],
    ["endless1","ENDLESS SURVIVOR","Enter an ENDLESS cycle.",s=>s.endlessCycles>=1],
    ["perfect1","PERFECT FORM","Maintain PERFECT status for 60 seconds.",s=>s.perfectSeconds>=60],
    ["bounty1","BOUNTY HUNTER","Claim a marked bounty.",s=>s.bounties>=1],
    ["shrine1","RISK TAKER","Activate a RISK SHRINE.",s=>s.shrines>=1],
    ["secret1","ANOMALY","Enter the SECRET VAULT.",s=>s.secretZones>=1],
    ["finisher1","CHAIN EXECUTION","Use a x10 CHAIN FINISHER.",s=>s.finishers>=1],
    ["ghost1","GHOST RUNNER","Record a personal ghost route.",s=>s.ghostRuns>=1],
    ["dailyTop","DAILY VETERAN","Record 3 DAILY runs.",s=>s.dailyRuns>=3]
  ];
  function ultimateStats(){return readStore("snake-evolution-ultimate",{dailyRuns:0,endlessCycles:0,perfectSeconds:0,bounties:0,shrines:0,secretZones:0,finishers:0,ghostRuns:0})}
  function saveUltimateStats(s){writeStore("snake-evolution-ultimate",s)}
  function renderUltimateAchievements(){
    const root=document.querySelector("#achievementList");if(!root)return;
    let box=root.querySelector(".ultimate-achievements");if(box)box.remove();
    box=document.createElement("div");box.className="ultimate-achievements";
    const s=ultimateStats(),a=readStore("snake-evolution-achievements-v2",{});
    achievementDefsU.forEach(def=>{
      if(!a[def[0]]&&def[3](s)){a[def[0]]=1;say("ACHIEVEMENT // "+def[1]);event("UNLOCKED // "+def[1]);}
      const row=document.createElement("div");row.className="achievement-item "+(a[def[0]]?"unlocked":"");
      row.innerHTML="<b>"+(a[def[0]]?"UNLOCKED":"LOCKED")+" // "+def[1]+"</b><span>"+def[2]+"</span>";box.appendChild(row)
    });
    writeStore("snake-evolution-achievements-v2",a);root.appendChild(box)
  }

  function audioInit(){try{if(localStorage.getItem("snake-evolution-sound")==="off")return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!audioCtx)audioCtx=new AC();if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{})}catch{}}
  function audioSettingsU(){try{return JSON.parse(localStorage.getItem("snake-evolution-settings")||"{}")}catch{return {}}}
  function audioCue(kind="ui"){
    if(localStorage.getItem("snake-evolution-sound")==="off")return;
    audioInit();if(!audioCtx)return;
    const settings=audioSettingsU(),master=Math.max(0,Math.min(1,Number(settings.volume??65)/100)),f={ui:320,pickup:540,ability:280,warning:130,boss:70,success:700,kill:180}[kind]||320,now=audioCtx.currentTime,o=audioCtx.createOscillator(),v=audioCtx.createGain();
    o.frequency.setValueAtTime(f,now);o.frequency.exponentialRampToValueAtTime(Math.max(55,f*.72),now+.07);v.gain.setValueAtTime(.0001,now);v.gain.exponentialRampToValueAtTime(.04*master,now+.01);v.gain.exponentialRampToValueAtTime(.0001,now+.08);o.connect(v);v.connect(audioCtx.destination);o.start(now);o.stop(now+.09)
  }
  gainXp=function(amount){baseGainXpU(amount*(encounterBoostUntil>performance.now()?2:1))};
  const sayU=say,eventU=event;
  say=function(t){audioCue(/WARDEN|CRITICAL|BREACH|LOCKDOWN/.test(t)?"warning":/FURY|DASH|SHIELD|PULSE/.test(t)?"ability":/COMPLETE|SURVIVED|EXTRACTED|ACHIEVEMENT/.test(t)?"success":/CORE|ENERGY|SUPPLY|SALVAGE/.test(t)?"pickup":"ui");sayU(t)};
  event=function(t){audioCue(/WARDEN|LOCKDOWN/.test(t)?"boss":"warning");eventU(t)};

  function cellBlockedU(p, previous){
    return !p
      ||(previous&&same(p,previous))
      ||arenaBlocks.some(b=>same(b,p))
      ||snake.some(s=>same(s,p))
      ||hunters.some(h=>same(h,p))
      ||hazards.some(h=>same(h,p))
      ||powerups.some(x=>same(x,p))
      ||(energy&&same(energy,p))
      ||(core&&same(core,p))
      ||(boss&&same(boss,p))
      ||(supplyDrop&&same(supplyDrop,p))
      ||(riskShrine&&same(riskShrine,p))
      ||(secretPortal&&same(secretPortal,p))
      ||encounters.some(e=>same(e,p));
  }
  function rememberEnergyPointU(point){
    if(!point)return;
    recentEnergyCells=[point,...recentEnergyCells.filter(p=>!same(p,point))].slice(0,8);
  }
  function toroidalDistance(a,b){
    if(!a||!b)return Infinity;
    const dx=Math.min(Math.abs(a.x-b.x),COLS-Math.abs(a.x-b.x)),dy=Math.min(Math.abs(a.y-b.y),ROWS-Math.abs(a.y-b.y));
    return dx+dy;
  }
  function safeEnergyRespawnU(previous){
    const cells=COLS*ROWS,start=(Math.floor(Math.random()*cells)+energyRespawnSerial++*137+17)%cells,minDistance=Math.min(10,Math.max(7,Math.floor(COLS/4)));
    const avoidRecent=p=>recentEnergyCells.some(r=>same(r,p));
    for(let offset=0;offset<cells;offset++){
      const index=(start+offset)%cells,p={x:index%COLS,y:Math.floor(index/COLS)};
      const farEnough=!previous||toroidalDistance(p,previous)>=minDistance;
      if(!cellBlockedU(p,previous)&&!avoidRecent(p)&&farEnough){rememberEnergyPointU(p);return p}
    }
    for(let offset=0;offset<cells;offset++){
      const index=(start+offset)%cells,p={x:index%COLS,y:Math.floor(index/COLS)};
      if(!cellBlockedU(p,previous)&&!avoidRecent(p)){rememberEnergyPointU(p);return p}
    }
    for(let offset=0;offset<cells;offset++){
      const index=(start+offset)%cells,p={x:index%COLS,y:Math.floor(index/COLS)};
      if(!cellBlockedU(p,previous)&&(!previous||!same(p,previous))){rememberEnergyPointU(p);return p}
    }
    return previous?{x:(previous.x+minDistance)%COLS,y:previous.y}:null;
  }
  function safePointU(){
    let p,t=0;
    do{p=rand();t++}while(t<800&&(arenaBlocks.some(b=>same(b,p))||snake.some(s=>same(s,p))||hunters.some(h=>same(h,p))||(riskShrine&&same(riskShrine,p))||(secretPortal&&same(secretPortal,p))));
    return p
  }

  const encounterDefsU=[
    {type:"guardian",name:"GUARDIAN CUBE",friend:true,color:"#66c7ff",desc:"+1 LIFE or emergency shield.",score:160,xp:55},
    {type:"booster",name:"BOOST CUBE",friend:true,color:"#ffd85c",desc:"2X XP for 10s.",score:220,xp:70},
    {type:"leech",name:"LEECH CUBE",friend:false,color:"#c66cff",desc:"Contact costs a LIFE.",score:0,xp:0},
    {type:"jammer",name:"JAMMER CUBE",friend:false,color:"#ff8b5a",desc:"Breaks chain and raises threat.",score:0,xp:10}
  ];
  function encounterPointU(){
    const cells=COLS*ROWS,start=(encounterSerial*173+53)%cells;
    for(let offset=0;offset<cells;offset++){
      const index=(start+offset)%cells,p={x:index%COLS,y:Math.floor(index/COLS)};
      if(!cellBlockedU(p,null)&&(!snake[0]||Math.abs(p.x-snake[0].x)+Math.abs(p.y-snake[0].y)>=6))return p;
    }
    return null;
  }
  function spawnEncounterU(){
    if(!alive||encounters.length>=2)return;
    const point=encounterPointU();if(!point)return;
    const friendly=encounterSerial%2===0;
    const pool=encounterDefsU.filter(d=>d.friend===friendly);
    const def=pool[Math.floor(Math.random()*pool.length)];
    encounterSerial++;
    const entity={...point,type:def.type,friend:def.friend,spawned:performance.now(),expires:performance.now()+19000};
    encounters.push(entity);
    addTelegraph(point.x,point.y,def.name,def.color,700);
    event((def.friend?"ALLY":"ENEMY")+" CUBE // "+def.name);
    say(def.name+" // "+def.desc);
  }
  function stepEncountersU(){
    if(!encounters.length)return;
    const head=snake[0];
    encounters.forEach((e,i)=>{
      if(e.type==="leech"&&head&&Math.random()<.34){
        const sx=Math.sign(head.x-e.x),sy=Math.sign(head.y-e.y);
        if(Math.abs(head.x-e.x)>=Math.abs(head.y-e.y))e.x=(e.x+sx+COLS)%COLS;
        else e.y=(e.y+sy+ROWS)%ROWS;
      }else if(e.type==="jammer"&&Math.random()<.15){
        e.x=(e.x+(i%2?1:-1)+COLS)%COLS;
      }else if(e.type==="guardian"&&Math.random()<.2){
        e.x=(e.x+(i%2?1:-1)+COLS)%COLS;
      }
    });
    encounters=encounters.filter(e=>performance.now()<e.expires);
  }
  function handleEncounterU(head){
    const index=encounters.findIndex(e=>same(e,head));if(index<0)return false;
    const hit=encounters.splice(index,1)[0];
    if(hit.type==="guardian"){
      if(lives<maxLives){
        lives=Math.min(maxLives,lives+1);gain(160);gainXp(55);chargeFury(14);shieldUntil=Math.max(shieldUntil,performance.now()+1800);
        say("GUARDIAN CUBE // +1 LIFE // SHIELD");
      }else{
        gain(110);gainXp(25);chargeFury(8);shieldUntil=Math.max(shieldUntil,performance.now()+2800);
        say("GUARDIAN CUBE // LIFE FULL // SHIELD");
      }
      haptic(20);
    }else if(hit.type==="booster"){
      encounterBoostUntil=performance.now()+10000;gain(hit.score);gainXp(hit.xp);chargeFury(12);chain+=1;
      say("BOOST CUBE // 2X XP // 10s");event("BUILD BOOST // XP x2");haptic(17);
    }else if(hit.type==="leech"){
      chain=0;combo=Math.max(1,combo-2);takeDamage("LEECH CUBE");
      if(alive)say("LEECH CUBE // LIFE -1 // CHAIN BROKEN");
    }else if(hit.type==="jammer"){
      chain=0;combo=Math.max(1,combo-1);threatBonus=Math.min(50,threatBonus+10);gainXp(10);
      say("JAMMER CUBE // CHAIN BROKEN // THREAT +10");event("SIGNAL JAM // THREAT +10");haptic(11);
    }
    return true;
  }
  function encounterStatusU(){
    if(encounterBoostUntil>performance.now())return "BOOST x2 XP";
    if(encounters.length)return encounters[0].friend?"ALLY "+encounters[0].type.toUpperCase():"ENEMY "+encounters[0].type.toUpperCase();
    return "SCANNING";
  }

  const evolutionCardDefs=[
    {id:"scout",name:"SCOUT CHIP",rarity:"COMMON",xp:45,score:90,desc:"Arena data. +45 XP on collect."},
    {id:"core",name:"CORE MATRIX",rarity:"COMMON",xp:60,score:120,desc:"Stable core. +60 XP on collect."},
    {id:"guardian",name:"GUARDIAN SCALE",rarity:"RARE",xp:75,score:170,desc:"Recovery pattern. +75 XP and short shield."},
    {id:"fury",name:"FURY CIRCUIT",rarity:"RARE",xp:80,score:190,desc:"Combat cache. +80 XP and FURY charge."},
    {id:"hunter",name:"HUNTER SIGIL",rarity:"EPIC",xp:95,score:230,desc:"Predator trace. +95 XP and chain value."},
    {id:"apex",name:"APEX BLUEPRINT",rarity:"EPIC",xp:120,score:300,desc:"Rare blueprint. +120 XP and score."}
  ];
  function cardStore(){return readStore("snake-evolution-card-collection",{scout:0,core:0,guardian:0,fury:0,hunter:0,apex:0,total:0})}
  function saveCardStore(value){writeStore("snake-evolution-card-collection",value)}
  function cardDef(id){return evolutionCardDefs.find(card=>card.id===id)||evolutionCardDefs[0]}
  function safeCardPointU(){
    const cells=COLS*ROWS,start=(energyRespawnSerial*97+31)%cells;
    for(let offset=0;offset<cells;offset++){
      const index=(start+offset)%cells,p={x:index%COLS,y:Math.floor(index/COLS)};
      if(!cellBlockedU(p,null)&&(!snake[0]||Math.abs(p.x-snake[0].x)+Math.abs(p.y-snake[0].y)>=5))return p;
    }
    return null;
  }
  function spawnEvolutionCardU(){
    if(!alive||evolutionCards.length)return;
    const point=safeCardPointU();if(!point)return;
    const pick=evolutionCardDefs[Math.floor(Math.random()*evolutionCardDefs.length)];
    evolutionCards.push({...point,id:pick.id,expires:performance.now()+20000});
    event("EVOLUTION CARD // "+pick.rarity);
    say(pick.name+" // COLLECTIBLE // 20s");
  }
  function collectEvolutionCardU(head){
    const i=evolutionCards.findIndex(card=>same(card,head));if(i<0)return;
    const hit=evolutionCards.splice(i,1)[0],data=cardDef(hit.id),store=cardStore();
    store[hit.id]=(store[hit.id]||0)+1;store.total=(store.total||0)+1;saveCardStore(store);
    gain(data.score);gainXp(data.xp);chargeFury(data.rarity==="EPIC"?10:6);
    if(data.id==="guardian")shieldUntil=Math.max(shieldUntil,performance.now()+1400);
    chain+=1;
    floatText(data.name+" +"+data.xp+" XP");
    say(data.name+" // +"+data.xp+" XP // COLLECTION x"+store[hit.id]);
    haptic(data.rarity==="EPIC"?24:15);
    renderEvolutionCardsU();
  }
  function renderEvolutionCardsU(){
    const root=document.querySelector("#cardCollection");if(!root)return;
    const store=cardStore();
    root.innerHTML=evolutionCardDefs.map(card=>{
      const count=store[card.id]||0,level=Math.min(3,1+Math.floor(count/3));
      return '<div class="evolution-card '+card.rarity.toLowerCase()+(count?" collected":"")+'"><div class="evolution-card-top"><b>'+card.rarity+'</b><strong>x'+count+'</strong></div><h4>'+card.name+'</h4><p>'+card.desc+'</p><small>MASTERY LV '+level+'/3</small></div>';
    }).join("");
  }

  function generateArena(){arenaBlocks=[];if(secretUntil>performance.now())return;const density=2+Math.min(5,currentZone());for(let i=0;i<density;i++){const p=safePointU();if(Math.abs(p.x-snake[0].x)<5&&Math.abs(p.y-snake[0].y)<4)continue;arenaBlocks.push(p);if(i%2===1&&p.x+1<COLS-1)arenaBlocks.push({x:p.x+1,y:p.y})}}
  function addTelegraph(x,y,type,color="#ff5b62",ttl=500,extra={}){telegraphs.push({x,y,type,color,until:performance.now()+ttl,...extra})}
  function cleanTelegraphs(){telegraphs=telegraphs.filter(t=>performance.now()<t.until)}

  function loadGhost(){
    const key=dailyMode?"snake-evolution-daily-ghost":"snake-evolution-ghost";
    try{ghostPath=JSON.parse(localStorage.getItem(key)||"[]")}catch{ghostPath=[]}
    try{ghostBestScore=Number(localStorage.getItem(key+"-meta")||0)}catch{ghostBestScore=0}
    ghostIndex=0;ghostSyncUntil=0;runPath=[];
  }
  function recordStep(){
    if(!alive)return;
    const p=snake[0];runPath.push({x:p.x,y:p.y});ghostIndex=Math.min(ghostIndex+1,ghostPath.length);
    if(ghostPath.length){
      const gp=ghostPath[Math.min(ghostIndex,ghostPath.length-1)];
      if(gp&&performance.now()>ghostSyncUntil){
        const dx=Math.min(Math.abs(p.x-gp.x),COLS-Math.abs(p.x-gp.x)),dy=Math.min(Math.abs(p.y-gp.y),ROWS-Math.abs(p.y-gp.y));
        if(dx+dy<=2){ghostSyncUntil=performance.now()+6000;gain(40);gainXp(8);chargeFury(3);say("GHOST SYNC // +40")}
      }
    }
  }
  function saveGhost(){
    const key=dailyMode?"snake-evolution-daily-ghost":"snake-evolution-ghost";
    const bestKey=dailyMode?"snake-evolution-daily-ghost-best":"snake-evolution-ghost-best";
    const best=Number(localStorage.getItem(bestKey)||0);
    if(score>best||ghostPath.length===0){
      try{localStorage.setItem(key,JSON.stringify(runPath.slice(0,5000)));localStorage.setItem(bestKey,String(score));localStorage.setItem(key+"-meta",String(score));ghostBestScore=score;ghostSaved=true}catch{}
    }
  }
  function saveLeaderboard(mode){const key=dailyMode?"snake-evolution-daily-leaderboard":"snake-evolution-leaderboard";let list=[];try{list=JSON.parse(localStorage.getItem(key)||"[]")}catch{}list.push({score:Math.round(score),combo,zone:currentZone(),evolution:evoNames[evolution()-1],mutation:mutationName(),condition:conditionName(),mode,date:dailyDateKey()});list.sort((a,b)=>b.score-a.score);writeStore(key,list.slice(0,10))}
  function renderLeaderboard(){
    const render=(el,key)=>{if(!el)return;let list=[];try{list=JSON.parse(localStorage.getItem(key)||"[]")}catch{}el.innerHTML=list.length?list.map((r,n)=>"<div class=\"leader-row\"><b>#"+(n+1)+"</b><strong>"+r.score+"</strong><span>x"+r.combo+" // "+r.evolution+"</span><small>"+r.mutation+" // "+r.mode+"</small></div>").join(""):"<div class=\"leader-empty\">NO RUNS RECORDED</div>"};
    render(document.querySelector("#leaderboardList"),"snake-evolution-leaderboard");render(document.querySelector("#dailyLeaderboardList"),"snake-evolution-daily-leaderboard")
  }

  function spawnRiskShrine(){if(riskShrine||currentZone()<2)return;riskShrine=safePointU();riskShrine.expires=performance.now()+18000;addTelegraph(riskShrine.x,riskShrine.y,"RISK SHRINE","#ffd85c",900);event("RISK SHRINE // ACCEPT THE HEAT");say("RISK SHRINE // +15 THREAT // +400")}
  function collectRiskShrine(head){if(!riskShrine||!same(riskShrine,head))return;riskShrine=null;riskHeatUntil=performance.now()+25000;threatBonus+=15;gain(400);gainXp(100);chargeFury(25);const s=ultimateStats();s.shrines++;saveUltimateStats(s);say("RISK SHRINE // HEAT +15 // 25s");event("RISK SHRINE ACTIVE")}
  function spawnSecretPortal(){if(secretPortal||currentZone()<2||secretUntil>performance.now())return;secretPortal=safePointU();addTelegraph(secretPortal.x,secretPortal.y,"SECRET","#a66cff",1200);event("ANOMALY // SECRET VAULT")}
  function enterSecret(head){if(!secretPortal||!same(secretPortal,head))return;secretPortal=null;secretUntil=performance.now()+22000;arenaBlocks=[];gain(300);gainXp(100);chargeFury(20);const s=ultimateStats();s.secretZones++;saveUltimateStats(s);for(let i=0;i<2;i++)powerups.push({...safePointU(),type:Math.random()<.5?"apex":"overdrive"});event("SECRET VAULT // 22s");say("SECRET ZONE // LOOT SURGE")}

  function startEmergencyEvent(){
    const types=["CORE_FLOOD","HUNTER_BREACH","WARDEN_SIGNAL","SYSTEM_FAILURE","BLACKOUT","DOUBLE_CORE","HUNTER_LOCK"],type=types[Math.floor(Math.random()*types.length)],duration={CORE_FLOOD:7000,HUNTER_BREACH:7000,WARDEN_SIGNAL:7000,SYSTEM_FAILURE:6500,BLACKOUT:8000,DOUBLE_CORE:10000,HUNTER_LOCK:9000}[type];
    advancedZoneEvent={type,until:performance.now()+duration};event(type+" // "+Math.ceil(duration/1000)+"s");say(type+" // ACTIVE");
    if(type==="CORE_FLOOD"){core=core||safePointU();energy=energy||safePointU()}
    if(type==="HUNTER_BREACH")for(let i=0;i<3;i++)hunters.push({...safePointU(),type:"hunter",variant:null,hp:1,id:++enemyId});
    if(type==="WARDEN_SIGNAL"&&currentZone()>=2&&!boss)spawnBoss()
  }

  useDash=function(){audioCue("ability");baseUseDashU();if(alive&&evolution()===2)dashReady=Math.min(dashReady,performance.now()+3500)};
  collectPowerup=function(head){const hit=powerups.find(p=>same(p,head)),oldLives=lives;baseCollectPowerupU(head);if(runCondition?.[0]==="NO MEDKITS"&&hit?.type==="medkit"){lives=oldLives;gain(250);gainXp(50);say("NO MEDKITS // +250 SCORE")}};
  useFury=function(){audioCue("ability");baseUseFuryU();if(alive&&evolution()>=4)gainXp(8)};
  gain=function(points){const perfect=!perfectBroken&&alive&&(performance.now()-perfectStart)>=30000;baseGainU(points*conditionScoreMult()*(perfect?1.25:1))};
  chargeFury=function(amount){const before=fury;baseChargeFuryU(amount);if(performance.now()<furyUntil||fury>=100)return;const u=getUpgrades(),extra=1+(u.fury||0)*.08;fury=Math.min(100,fury+amount*extra*.08)};
  takeDamage=function(reason="COLLISION"){deathCause=reason;perfectBroken=true;if(evolution()>=3&&performance.now()>phantomWardUntil){phantomWardUntil=performance.now()+22000;shieldUntil=performance.now()+2500;say("PHANTOM // PHASED HIT");return}baseTakeDamageU(reason)};
  let phantomWardUntil=0;

  usePulse=function(){const finisher=alive&&chain>=10,bountyBefore=bountyTarget;audioCue("ability");baseUsePulseU();if(finisher&&alive){gain(750);gainXp(100);hazards=[];chargeFury(25);const s=ultimateStats();s.finishers++;saveUltimateStats(s);say("CHAIN FINISHER // +750");event("CHAIN x10 // FINISHER")}if(evolution()>=4&&boss){boss.hp=Math.max(0,boss.hp-1);if(boss.hp===0)destroyBoss()}if(bountyBefore&&!hunters.includes(bountyBefore)&&!bountyClaimed){bountyClaimed=true;gain(450);gainXp(90);const s=ultimateStats();s.bounties++;saveUltimateStats(s);say("BOUNTY TARGET DOWN // +450");event("BOUNTY COMPLETE")}};

  spawnWave=function(){baseSpawnWaveU();hunters.forEach(h=>{if(!h.id)h.id=++enemyId;if(h.type==="elite"&&!h.variant)h.variant=Math.random()<.5?"charger":"watcher"});if(!bountyTarget&&!bountyClaimed){bountyTarget=hunters.find(h=>h.type==="elite")||hunters[0]||null;if(bountyTarget){bountyTarget.bounty=true;say("BOUNTY // TARGET MARKED")}}};
  hunterStep=function(){
    hunters.filter(h=>h.type==="elite"&&h.variant==="charger").forEach(h=>{const dx=snake[0].x-h.x,dy=snake[0].y-h.y;if(Math.abs(dx)+Math.abs(dy)<9)addTelegraph(h.x,h.y,"CHARGER","#ff6a3d",450)});
    hunters.filter(h=>h.type==="elite"&&h.variant==="watcher").forEach(h=>{const d=Math.abs(snake[0].x-h.x)+Math.abs(snake[0].y-h.y);if(d<8)addTelegraph(h.x,h.y,"WATCHER","#d69bff",450)});
    baseHunterStepU();
    hunters.forEach((h,i)=>{
      if(h.type==="hunter"&&!h.variant)h.x=(h.x+(i%2?1:-1)+COLS)%COLS;
      if(h.type==="elite"&&h.variant==="watcher"&&Math.abs(snake[0].x-h.x)+Math.abs(snake[0].y-h.y)<7){
        h.x=(h.x-Math.sign(snake[0].x-h.x)+COLS)%COLS;
        h.y=(h.y-Math.sign(snake[0].y-h.y)+ROWS)%ROWS
      }
    })
  };
  bossStep=function(){if(boss&&boss.phase>=2&&bossTelegraphUntil<=performance.now()){bossTelegraphUntil=performance.now()+450;addTelegraph(boss.x,boss.y,"WARDEN STRIKE","#ff3f8f",450,{radius:boss.phase===3?4:3})}baseBossStepU()};

  move=function(force=false){
    if(!alive||contractOfferOpen||extractionOpen)return;
    const nh={x:snake[0].x+next.x,y:snake[0].y+next.y};
    if(arenaBlocks.some(b=>same(b,nh))){
      addTelegraph(nh.x,nh.y,"WALL","#ff5b62",260);
      takeDamage("ARENA WALL");
      if(alive&&!paused&&!contractOfferOpen&&!extractionOpen)timer=setTimeout(move,Math.max(60,118-combo*6-(force?35:0)-(runMutation?.[0]==="OVERCLOCK"?14:0)));
      return
    }
    const before={energy:stats.energy,cores:stats.cores,powerups:stats.powerups,supplyDrops:stats.supplyDrops,elites:stats.elites};
    const consumedEnergy=energy?{x:energy.x,y:energy.y}:null;
    stepEncountersU();
    baseMoveU(force);if(!alive)return;
    const beforeEnergyPoint=consumedEnergy;
    const energyCollected=stats.energy>before.energy;
    recordStep();const head=snake[0];collectRiskShrine(head);enterSecret(head);
    if(energyCollected){
      energy=safeEnergyRespawnU(consumedEnergy);
      registerAdvancedLoot();
      if(stats.energy%15===0)spawnEvolutionCardU();
    }else if(beforeEnergyPoint&&energy&&!same(beforeEnergyPoint,energy)){
      energy=safeEnergyRespawnU(beforeEnergyPoint);
    }
    handleEncounterU(head);if(!alive)return;
    encounterClock++;
    if(encounterClock%120===0&&encounters.length<2)spawnEncounterU();
    collectEvolutionCardU(head);
    if(evolutionCards.length&&performance.now()>evolutionCards[0].expires){evolutionCards=[];say("EVOLUTION CARD // EXPIRED")}
    maxThreat=Math.max(maxThreat,danger);
    if(layerZone!==currentZone()){layerZone=currentZone();zone=currentZone();generateArena()}
    if(performance.now()>nextRiskAt&&currentZone()>=2){spawnRiskShrine();nextRiskAt=performance.now()+80000}
    if(performance.now()>nextSecretAt&&currentZone()>=2){spawnSecretPortal();nextSecretAt=performance.now()+90000}
    if(riskShrine&&performance.now()>riskShrine.expires){riskShrine=null;say("RISK SHRINE // EXPIRED")}if(riskHeatUntil&&performance.now()>riskHeatUntil){riskHeatUntil=0;threatBonus=Math.max(0,threatBonus-15);say("RISK SHRINE // HEAT ENDED")}
    if(eventClock2!==layerEventClock&&eventClock2%420===105){layerEventClock=eventClock2;startEmergencyEvent()}
    if(runCondition?.[0]==="LOW VISIBILITY"&&eventClock2%180===0&&!advancedEventActive("BLACKOUT"))advancedZoneEvent={type:"BLACKOUT",until:performance.now()+7000};
    cleanTelegraphs();if(salvageChain&&performance.now()>salvageUntil)salvageChain=0;
    if(chain&&performance.now()>chainUntil){chain=0;combo=Math.max(1,combo-1);say("CHAIN LOST // COMBO -1")}
    hud();draw()
  };

  const baseCurrentZoneU=currentZone;
  currentZone=function(){return endlessMode&&alive?4:baseCurrentZoneU()};

  reset=function(){prepareRun(activeMode)};
  function prepareRun(mode){
    activeMode=mode;dailyMode=mode==="daily";endlessMode=mode==="endless";endlessCycle=0;endlessTotalStart=performance.now();
    if(dailyMode)enableDailyRng();else restoreRng();
    chooseCondition();deathCause="NONE";perfectBroken=false;lastPerfectMilestone=0;ghostSaved=false;maxThreat=0;threatBonus=runCondition?.[0]==="DOUBLE DOWN"?10:0;bountyTarget=null;bountyClaimed=false;enemyId=0;arenaBlocks=[];telegraphs=[];riskShrine=null;secretPortal=null;secretUntil=0;layerZone=-1;layerEventClock=0;nextRiskAt=performance.now()+60000;nextSecretAt=performance.now()+90000;
    loadGhost();contractOfferOpen=true;extractionOpen=false;evolutionCards=[];energyRespawnSerial=0;recentEnergyCells=[];encounters=[];encounterClock=0;encounterSerial=0;encounterBoostUntil=0;baseResetU();score=0;combo=1;if(energy){const initial={x:energy.x,y:energy.y};energy=safeEnergyRespawnU(initial)}if(runCondition?.[0]==="ONE CHANCE")lives=1;
    perfectStart=performance.now();generateArena();hud();draw();renderLeaderboard();baseRenderAchievementsU();renderUltimateAchievements();renderEvolutionCardsU()
  }
  function startDaily(){prepareRun("daily")}
  function startEndless(){prepareRun("endless")};

  const baseWinU=win;
  win=function(){
    if(endlessMode){
      endlessCycle++;const s=ultimateStats();s.endlessCycles=Math.max(s.endlessCycles,endlessCycle);s.perfectSeconds=Math.max(s.perfectSeconds,Math.floor((performance.now()-perfectStart)/1000));saveUltimateStats(s);
      startedAt=performance.now();extractionOpen=false;extractionNextAt=60000;extractionHeatUntil=performance.now()+20000;threatBonus=Math.min(50,threatBonus+8);for(let i=0;i<3;i++)hazards.push(free());event("ENDLESS CYCLE "+endlessCycle);say("ENDLESS // CYCLE "+endlessCycle+" // THREAT +8");hud();draw();move();return
    }
    baseWinU()
  };

  persist=function(winResult){saveGhost();saveLeaderboard(advancedExitMode==="CASH OUT"?"CASH OUT":winResult?"SURVIVED":"ENDED");basePersistU(winResult);const s=ultimateStats();if(dailyMode)s.dailyRuns++;if(!perfectBroken)s.perfectSeconds=Math.max(s.perfectSeconds,Math.floor((performance.now()-perfectStart)/1000));if(runPath.length&&!ghostSaved){s.ghostRuns++;ghostSaved=true}saveUltimateStats(s);restoreRng();renderLeaderboard();renderUltimateAchievements()};
  statsMarkup=function(winResult){const cause=advancedExitMode==="CASH OUT"?"CASH OUT":winResult?"TIME CLEARED":deathCause;return baseStatsMarkupU(winResult)+'<div class="analysis-grid"><span>CAUSE<strong>'+cause+'</strong></span><span>MAX THREAT<strong>'+maxThreat+'%</strong></span><span>CONDITION<strong>'+conditionName()+'</strong></span><span>MODE<strong>'+(endlessMode?"ENDLESS":dailyMode?"DAILY":"STANDARD")+'</strong></span></div>'};

  hud=function(){
    baseHudU();maxThreat=Math.max(maxThreat,danger);
    const cond=document.querySelector("#condition"),condLabel=document.querySelector("#conditionLabel"),mode=document.querySelector("#runMode"),bounty=document.querySelector("#bounty"),bountyLabel=document.querySelector("#bountyLabel"),perfect=document.querySelector("#perfectLabel"),maxD=document.querySelector("#maxThreat"),perk=document.querySelector("#evoPerk");
    if(cond)cond.textContent=conditionName();if(condLabel)condLabel.textContent=runCondition?.[1]||"STANDARD";if(mode)mode.textContent=endlessMode?"ENDLESS C"+endlessCycle:dailyMode?"DAILY":"STANDARD";
    if(bounty)bounty.textContent=bountyClaimed?"CLEARED":bountyTarget?"TARGET":"SEARCHING";if(bountyLabel)bountyLabel.textContent=bountyTarget&&!bountyClaimed?(bountyTarget.variant||bountyTarget.type||"TARGET").toUpperCase():"READY";
    if(perfect){const sec=Math.floor((performance.now()-perfectStart)/1000);perfect.textContent=!perfectBroken&&sec>=30?"PERFECT x1.25":perfectBroken?"BROKEN":"BUILDING";if(!perfectBroken&&sec>=60&&lastPerfectMilestone<60){lastPerfectMilestone=60;const s=ultimateStats();s.perfectSeconds=Math.max(s.perfectSeconds,sec);saveUltimateStats(s);renderUltimateAchievements()}}
    if(maxD)maxD.textContent=maxThreat+"%";if(perk)perk.textContent=evolution()===1?"SPEED":evolution()===2?"DASH BOOST":evolution()===3?"PHASED HIT":evolution()===4?"PULSE+":"STANDARD";
    if(secretUntil>performance.now()&&zoneEl)zoneEl.textContent="SECRET VAULT";else if(zoneEl)zoneEl.textContent=(dailyMode?zoneNames[zone]+" // DAILY":zoneNames[zone]);
    const buildLevelEl=document.querySelector("#evolutionBuildLevel"),buildNextEl=document.querySelector("#evolutionBuildNext"),buildFillEl=document.querySelector("#evolutionBuildFill"),encounterEl=document.querySelector("#encounterStatus"),ghostEl=document.querySelector("#ghostStatus");
    if(buildLevelEl)buildLevelEl.textContent="BUILD LVL "+xpLevel;
    if(buildNextEl)buildNextEl.textContent=xpLevel>=10?"MAX BUILD":"NEXT "+Math.max(0,xpNext-xp)+" XP";
    if(buildFillEl)buildFillEl.style.width=(xpLevel>=10?100:Math.min(100,xp/xpNext*100))+"%";
    if(encounterEl)encounterEl.textContent=encounterStatusU();
    if(ghostEl)ghostEl.textContent=ghostPath.length?(ghostBestScore?"PB "+ghostBestScore:"ACTIVE")+" // "+Math.min(ghostIndex,ghostPath.length)+"/"+ghostPath.length:"NONE";
    if(endlessMode){const total=Math.floor((performance.now()-endlessTotalStart)/1000);timeEl.textContent="∞ "+Math.floor(total/60)+":"+String(total%60).padStart(2,"0")}
  };

  draw=function(){
    baseDrawU();cleanTelegraphs();
    evolutionCards.forEach(card=>{const data=cardDef(card.id),c=data.rarity==="EPIC"?"#ffffff":data.rarity==="RARE"?"#66c7ff":"#79e35b";pixel(card,c);ctx.strokeStyle=c;ctx.lineWidth=.12;ctx.strokeRect(card.x+.04,card.y+.04,.92,.92)});
    const pulse=0.5+0.5*Math.sin(performance.now()/260);
    if(energy){
      ctx.strokeStyle="rgba(121,227,91,"+(0.24+0.22*pulse)+")";
      ctx.lineWidth=.12+.04*pulse;
      const ring=.06+.06*pulse;
      ctx.strokeRect(energy.x+ring,energy.y+ring,.88-ring*2,.88-ring*2);
    }
    arenaBlocks.forEach(b=>{ctx.fillStyle="#303b34";ctx.fillRect(b.x+.04,b.y+.04,.92,.92);ctx.fillStyle="#141b16";ctx.fillRect(b.x+.22,b.y+.22,.56,.56)});
    telegraphs.forEach(t=>{ctx.strokeStyle=t.color;ctx.lineWidth=.14;if(t.type==="WARDEN STRIKE"){const r=t.radius||2;ctx.strokeRect(t.x-r+.05,t.y-r+.05,r*2-.1,r*2-.1)}else ctx.strokeRect(t.x+.06,t.y+.06,.88,.88)});
    if(riskShrine){pixel(riskShrine,"#ffd85c");ctx.strokeStyle="#fff1a0";ctx.lineWidth=.16;ctx.strokeRect(riskShrine.x+.02,riskShrine.y+.02,.96,.96)}
    if(secretPortal){pixel(secretPortal,"#a66cff");ctx.strokeStyle="#e1c9ff";ctx.lineWidth=.16;ctx.strokeRect(secretPortal.x+.02,secretPortal.y+.02,.96,.96)}
    if(secretUntil>performance.now()){ctx.fillStyle="#210b38aa";ctx.fillRect(0,0,COLS,ROWS)}
    if(ghostPath.length&&ghostIndex<ghostPath.length&&!perfectBroken){
      const trail=Math.min(5,ghostPath.length-ghostIndex);
      for(let i=trail;i>0;i--){const gp=ghostPath[ghostIndex+i-1];if(!gp)continue;ctx.globalAlpha=.10+.045*(trail-i);pixel(gp,"#6f9781")}
      ctx.globalAlpha=1;
      const gp=ghostPath[ghostIndex];if(gp){pixel(gp,"#a5ffc0");ctx.strokeStyle="#a5ffc0";ctx.lineWidth=.10;ctx.strokeRect(gp.x+.04,gp.y+.04,.92,.92)}
    }
    encounters.forEach(e=>{
      const data=encounterDefsU.find(d=>d.type===e.type)||encounterDefsU[0],pulse=.55+.45*Math.sin(performance.now()/180+(e.x+e.y));
      pixel(e,data.color);ctx.globalAlpha=.4+.3*pulse;ctx.strokeStyle=data.color;ctx.lineWidth=.12;ctx.strokeRect(e.x+.05,e.y+.05,.90,.90);ctx.globalAlpha=1;
      ctx.fillStyle="#081008";
      if(data.friend){ctx.fillRect(e.x+.30,e.y+.20,.14,.14);ctx.fillRect(e.x+.56,e.y+.20,.14,.14);ctx.fillRect(e.x+.38,e.y+.56,.24,.08)}
      else{ctx.fillRect(e.x+.25,e.y+.28,.16,.16);ctx.fillRect(e.x+.59,e.y+.28,.16,.16);ctx.fillRect(e.x+.42,e.y+.52,.16,.12)}
    });
    if(encounterBoostUntil>performance.now()&&snake[0]){ctx.globalAlpha=.25;ctx.strokeStyle="#ffd85c";ctx.lineWidth=.18;ctx.strokeRect(snake[0].x+.02,snake[0].y+.02,.96,.96);ctx.globalAlpha=1}
    if(bountyTarget&&!bountyClaimed&&hunters.includes(bountyTarget)){ctx.strokeStyle="#fff";ctx.lineWidth=.12;ctx.strokeRect(bountyTarget.x+.02,bountyTarget.y+.02,.96,.96)}
  };

  baseRenderAchievementsU();renderUltimateAchievements();renderLeaderboard();
  if(!window.startDailyRun)window.startDailyRun=startDaily;if(!window.startEndlessRun)window.startEndlessRun=startEndless;
  function resetRank(){["snake-evolution-best","snake-evolution-save","snake-evolution-leaderboard","snake-evolution-daily-leaderboard","snake-evolution-ghost","snake-evolution-ghost-best","snake-evolution-ghost-meta","snake-evolution-daily-ghost","snake-evolution-daily-ghost-best","snake-evolution-daily-ghost-meta"].forEach(key=>{try{localStorage.removeItem(key)}catch{}});ghostBestScore=0;ghostPath=[];ghostIndex=0;renderLeaderboard();baseHudU();showSave()} window.SnakeEvolution={start:()=>prepareRun("standard"),startDaily,startEndless,resetRank,getState:()=>({alive,score,combo,fury,lives,xp,xpLevel,xpNext,danger,level,zone,objective:objective?.[0]||null,objectiveDone,contract:contract?.[0]||null,contractAccepted,contractOfferOpen,contractDone,supplyDrop:supplyDrop?.rarity||null,mutation:mutationName(),condition:conditionName(),daily:dailyMode,endless:endlessMode,endlessCycle,salvageChain,zoneEvent:advancedZoneEvent?.type||null,secretZone:secretUntil>performance.now(),riskShrine:!!riskShrine,perfectBroken,maxThreat,deathCause,bountyClaimed,ghostLength:ghostPath.length,evolutionCardDrops:evolutionCards.length,evolutionCardCollection:cardStore(),buildLevel:xpLevel,extraLifeCapacity:maxLives,encounterCount:encounters.length,encounterBoost:encounterBoostUntil>performance.now(),ghostBestScore:ghostBestScore})};
})();