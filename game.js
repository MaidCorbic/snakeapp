const canvas=document.querySelector("#game"),ctx=canvas.getContext("2d"),message=document.querySelector("#message"),scoreEl=document.querySelector("#score"),comboEl=document.querySelector("#combo"),timeEl=document.querySelector("#time"),bestEl=document.querySelector("#best"),start=document.querySelector("#start"),toast=document.querySelector("#toast"),zoneEl=document.querySelector("#zone"),evoEl=document.querySelector("#evo"),bossHud=document.querySelector("#bossHud"),bossHp=document.querySelector("#bossHp"),statsPanel=document.querySelector("#runStats"),missionPanel=document.querySelector("#missions"),pauseBtn=document.querySelector("#pauseBtn"),eventBanner=document.querySelector("#eventBanner"),floaters=document.querySelector("#floaters"),saveStats=document.querySelector("#saveStats");
const dashBtn=document.querySelector("#dash"),shieldBtn=document.querySelector("#shield"),pulseBtn=document.querySelector("#pulse"),furyBtn=document.querySelector("#fury"),dashFill=document.querySelector("#dashFill"),shieldFill=document.querySelector("#shieldFill"),pulseFill=document.querySelector("#pulseFill"),furyFill=document.querySelector("#furyFill");
const COLS=32,ROWS=20,RUN_TIME=300000;const settingsKey="snake-evolution-settings";const defaultSettings={grid:true,vibration:true,reducedMotion:false};let settings={...defaultSettings};try{settings={...defaultSettings,...JSON.parse(localStorage.getItem(settingsKey)||"{}")}}catch{}
let snake=[],dir,next,energy=null,core=null,hazards=[],hunters=[],powerups=[],boss=null,score=0,combo=1,alive=false,paused=false,startedAt=0,timer,spawnClock=0,eventClock=0,hunterClock=0,bossClock=0,level=1,zone=0,shieldUntil=0,pulseUntil=0,dashReady=0,shieldReady=0,pulseReady=0,furyUntil=0,fury=0,chain=0,eventClock2=0,stats={energy:0,cores:0,hunters:0,wardens:0,damage:0,runCount:0,powerups:0,pulses:0,furyUses:0};
const missionList=document.querySelector("#missionList");const best=()=>Number(localStorage.getItem("snake-evolution-best")||0);
const missions=()=>{try{return JSON.parse(localStorage.getItem("snake-evolution-missions")||"{}")}catch{return {}}};
const saveMissions=m=>localStorage.setItem("snake-evolution-missions",JSON.stringify(m));
const same=(a,b)=>a.x===b.x&&a.y===b.y,rand=()=>({x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)});
const zoneNames=["NEON GRID","HAZARD SECTOR","DARK SECTOR","Warden Territory","FINAL LOCKDOWN"];
const evoNames=["RUNNER","CHARGER","PHANTOM","OVERLORD"];const evoColors=["#79e35b","#ffd85c","#a66cff","#ff3f8f"];
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(canvas.width/COLS,0,0,canvas.height/ROWS)}addEventListener("resize",resize);resize();
function gain(points){score+=Math.round(points*(performance.now()<furyUntil?2:1))}
function chargeFury(amount){if(performance.now()<furyUntil)return;fury=Math.min(100,fury+amount);updateAbilityUI()}
function haptic(ms=12){if(settings.vibration&&navigator.vibrate)try{navigator.vibrate(ms)}catch{}}
function free(){let p,t=0;do{p=rand();t++}while(t<600&&(snake.some(s=>same(s,p))||hazards.some(s=>same(s,p))||hunters.some(s=>same(s,p))||powerups.some(s=>same(s,p))||(energy&&same(energy,p))||(core&&same(core,p))||(boss&&same(boss,p))));return p}
function currentZone(){return Math.min(4,Math.floor((performance.now()-startedAt)/60000))}
function currentLevel(){return Math.min(4,1+Math.floor(score/600))}
function evolution(){return currentLevel()}
function event(t){eventBanner.textContent="⚠ "+t;eventBanner.classList.add("show");clearTimeout(event.t);event.t=setTimeout(()=>eventBanner.classList.remove("show"),1300)}
function floatText(t,p=snake[0]){const el=document.createElement("span");el.className="floater";el.textContent=t;el.style.left=((p.x/COLS)*100)+"%";el.style.top=((p.y/ROWS)*100)+"%";floaters.appendChild(el);setTimeout(()=>el.remove(),700)}
function pause(){if(!alive)return;paused=!paused;if(paused){clearTimeout(timer);const o=document.createElement("div");o.className="pause-overlay";o.id="pauseOverlay";o.innerHTML="<div><h2>PAUSED</h2><button id=\"resume\">RESUME</button><button id=\"restartPause\">RESTART</button><button id=\"menuPause\">MAIN MENU</button></div>";document.querySelector(".game-shell").appendChild(o);o.querySelector("#resume").onclick=pause;o.querySelector("#restartPause").onclick=()=>{o.remove();paused=false;reset()};o.querySelector("#menuPause").onclick=()=>{o.remove();alive=false;message.style.display="none";window.showBootMenu?.()}}else{document.querySelector("#pauseOverlay")?.remove();move()}}
function showSave(){let s={};try{s=JSON.parse(localStorage.getItem("snake-evolution-save")||"{}")}catch{}saveStats.innerHTML="RUNS <strong>"+(s.runs||0)+"</strong> · WINS <strong>"+(s.wins||0)+"</strong> · BEST COMBO <strong>x"+(s.combo||1)+"</strong> · WARDENS <strong>"+(s.wardens||0)+"</strong> · EVOLUTION <strong>"+(evoNames[s.evo-1]||"RUNNER")+"</strong>"}
function hud(){scoreEl.textContent=score;comboEl.textContent=chain>1?"x"+combo+" / CHAIN x"+chain:"x"+combo;bestEl.textContent=best();const left=Math.max(0,RUN_TIME-(performance.now()-startedAt));timeEl.textContent=Math.floor(left/60000)+":"+String(Math.ceil((left%60000)/1000)).padStart(2,"0");zone=currentZone();level=currentLevel();zoneEl.textContent=zoneNames[zone];evoEl.textContent=evoNames[level-1];if(boss){bossHud.classList.add("show");bossHp.textContent=boss.hp+"/"+boss.maxHp}else bossHud.classList.remove("show")}
function say(t){toast.textContent=t;toast.classList.add("show");clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove("show"),1000)}
function reset(){clearTimeout(timer);paused=false;document.querySelector("#pauseOverlay")?.remove();snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];dir=next={x:1,y:0};score=0;combo=1;hazards=[];hunters=[];powerups=[];boss=null;spawnClock=0;eventClock=0;hunterClock=0;bossClock=0;level=1;zone=0;stats={energy:0,cores:0,hunters:0,wardens:0,damage:0,runCount:0,powerups:0,pulses:0,furyUses:0};chain=0;eventClock2=0;fury=0;furyUntil=0;energy=free();core=null;shieldUntil=pulseUntil=0;dashReady=shieldReady=pulseReady=0;alive=true;startedAt=performance.now();message.classList.remove("show");message.classList.add("hidden");statsPanel.classList.remove("show");missionPanel.classList.remove("show");start.textContent="RUN AGAIN";hud();draw();move()}
function setDir(x,y){if(alive&&!(x===-dir.x&&y===-dir.y))next={x,y}}
function useDash(){if(!alive||paused||performance.now()<dashReady)return;clearTimeout(timer);const cd=evolution()>=3?5500:7000;dashReady=performance.now()+cd;say("DASH // OVERRIDE");move(true)}
function useShield(){if(!alive||paused||performance.now()<shieldReady)return;shieldReady=performance.now()+12000;shieldUntil=performance.now()+2500;say("SHIELD // ACTIVE");hud();updateAbilityUI();draw()}
function usePulse(){if(!alive||paused||performance.now()<pulseReady)return;stats.pulses++;chargeFury(20);haptic(18);const cd=evolution()>=3?10500:15000;pulseReady=performance.now()+cd;pulseUntil=performance.now()+350;const beforeHunters=hunters.length;hunters=hunters.filter(h=>Math.abs(h.x-snake[0].x)+Math.abs(h.y-snake[0].y)>8);const destroyed=beforeHunters-hunters.length;if(destroyed){stats.hunters+=destroyed;chain+=destroyed;gain(destroyed*100);chargeFury(destroyed*10);floatText("CHAIN x"+chain)}hazards=hazards.filter(h=>Math.abs(h.x-snake[0].x)+Math.abs(h.y-snake[0].y)>5);if(boss){boss.hp=Math.max(0,boss.hp-2);if(boss.hp===0)destroyBoss()}gain(25);say("PULSE // CLEAR");hud();updateAbilityUI()}
function useFury(){if(!alive||paused||fury<100||performance.now()<furyUntil)return;fury=0;furyUntil=performance.now()+8000;stats.furyUses++;haptic(28);hunters=[];hazards=hazards.filter(h=>Math.abs(h.x-snake[0].x)+Math.abs(h.y-snake[0].y)>8);say("FURY // 2X SCORE // THREAT WIPE");hud();draw()}
function key(e){const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," ","w","a","s","d","shift","q"].includes(k))e.preventDefault();if(k==="escape"||k==="p"){pause();return}if(k==="arrowup"||k==="w")setDir(0,-1);if(k==="arrowdown"||k==="s")setDir(0,1);if(k==="arrowleft"||k==="a")setDir(-1,0);if(k==="arrowright"||k==="d")setDir(1,0);if(k===" ")useDash();if(k==="shift")useShield();if(k==="e")usePulse();if(k==="q")useFury()}
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
let touchStart=null;
canvas.addEventListener("touchstart",e=>{
 if(!alive||paused)return;
 const t=e.changedTouches[0]; touchStart={x:t.clientX,y:t.clientY};
},{passive:true});
canvas.addEventListener("touchend",e=>{
 if(!touchStart||!alive||paused)return;
 const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;
 touchStart=null;
 if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
 if(Math.abs(dx)>Math.abs(dy))setDir(Math.sign(dx),0);else setDir(0,Math.sign(dy));
},{passive:true});
function spawnWave(){const lv=Math.min(5,1+Math.floor((performance.now()-startedAt)/60000));const count=Math.min(1+Math.floor(lv/2),5);while(hunters.length<count)hunters.push({...free(),type:Math.random()<.35?"interceptor":"hunter"});if(lv>=2&&hazards.length<4+lv)hazards.push(free());if(lv>=3&&Math.random()<.65){const type=Math.random()<.12?"apex":["overdrive","magnet","repair"][Math.floor(Math.random()*3)];powerups.push({...free(),type})}say("WAVE // LV"+lv)}
function hunterStep(){hunters.forEach(h=>{const dx=snake[0].x-h.x,dy=snake[0].y;if(h.type==="interceptor"&&Math.abs(dx)+Math.abs(dy)<10){h.x+=Math.sign(dx);h.y+=Math.sign(dy)}else if(Math.abs(dx)>Math.abs(dy))h.x+=Math.sign(dx);else h.y+=Math.sign(dy);h.x=(h.x+COLS)%COLS;h.y=(h.y+ROWS)%ROWS})}
function spawnBoss(){if(boss)return;boss={...free(),hp:12,maxHp:12,phase:1};event("WARDEN INCOMING");say("WARDEN // BOSS INBOUND")}
function destroyBoss(){if(!boss)return;boss=null;stats.wardens++;chain++;const points=1000+chain*100;gain(points);chargeFury(25);floatText("+"+points);say("WARDEN DESTROYED // +"+points)}
function bossStep(){if(!boss)return;bossClock++;boss.phase=boss.hp<=6?2:1;if(boss.phase===2&&bossClock%3)return;if(boss.phase===1&&bossClock%5)return;const dx=snake[0].x-boss.x,dy=snake[0].y-boss.y;if(Math.abs(dx)>Math.abs(dy))boss.x+=Math.sign(dx);else boss.y+=Math.sign(dy);boss.x=(boss.x+COLS)%COLS;boss.y=(boss.y+ROWS)%ROWS;if(bossClock%(boss.phase===2?7:15)===0)hazards.push(free());if(boss.phase===2&&bossClock%21===0){event("WARDEN PHASE 2");say("WARDEN // ENRAGED")}}
function collectPowerup(head){const i=powerups.findIndex(x=>same(x,head));if(i<0)return;const type=powerups[i].type;powerups.splice(i,1);stats.powerups++;chargeFury(6);haptic(10);if(type==="overdrive"){dashReady=performance.now();gain(100);say("OVERDRIVE // DASH READY")}else if(type==="magnet"){energy=free();core=free();gain(75);say("MAGNET // LOOT RELOCATED")}else if(type==="apex"){gain(400);combo=Math.min(9,combo+2);chain+=2;chargeFury(30);hazards=[];say("APEX CORE // THREAT WIPE")}else{snake.push({...snake[snake.length-1]});gain(150);say("REPAIR // +LENGTH")}}
const missionDefs=[["energy25","COLLECTOR","Collect 25 ENERGY",()=>stats.energy,25],["core5","CORE HUNTER","Collect 5 CORES",()=>stats.cores,5],["hunter10","HUNTER","Defeat 10 HUNTERS",()=>stats.hunters,10],["combo9","COMBO MASTER","Reach COMBO x9",()=>combo,9],["fury1","FURY","Activate FURY once",()=>stats.furyUses,1],["warden","WARDEN SLAYER","Destroy 1 WARDEN",()=>stats.wardens,1],["nohit","NO HIT","Finish a run without damage",()=>stats.damage===0&&!alive?1:0,1],["score2500","SCORE BREAKER","Score 2,500 points",()=>score,2500],["powerups3","POWER USER","Collect 3 power-ups",()=>stats.powerups,3],["pulses3","PULSE RUNNER","Use PULSE 3 times",()=>stats.pulses,3],["survive120","LONG RUN","Survive 120 seconds",()=>Math.min(120,Math.floor((performance.now()-startedAt)/1000)),120]];
function renderMissions(){if(!missionList)return;const m=missions();missionList.innerHTML=missionDefs.map(([id,name,label,get,target])=>{const done=!!m[id];const value=Math.min(target,get());const pct=Math.round(value/target*100);return `<div class="mission-item ${done?"done":""}"><div><b>${name}</b><span>${label}</span></div><strong>${done?"DONE":value+"/"+target}</strong><i><em style="width:${pct}%"></em></i></div>`}).join("")}
function missionCheck(){const m=missions(),done=[];missionDefs.forEach(([id,name,label,get,target])=>{if(!m[id]&&get()>=target){m[id]=1;done.push(name)}});saveMissions(m);renderMissions();if(done.length){say("MISSION // "+done.join(" + "));haptic(24)}}
function move(force=false){if(!alive)return;dir=next;const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS)return end();const protectedNow=performance.now()<shieldUntil||performance.now()<pulseUntil;
if(!protectedNow&&(snake.some((s,i)=>i>0&&same(s,head))||hazards.some(h=>same(h,head))||hunters.some(h=>same(h,head))||(boss&&same(boss,head)))){stats.damage++;return end()}
snake.unshift(head);let grow=false;
if(energy&&same(head,energy)){haptic(8);const points=10*combo;gain(points);combo=Math.min(9,combo+1);chain++;stats.energy++;chargeFury(8);floatText("+"+points);energy=free();grow=true;if(stats.energy%3===0){core=free();say("CORE SPAWNED")}}
if(core&&same(head,core)){haptic(14);const points=50*combo+chain*5;gain(points);combo=Math.min(9,combo+1);stats.cores++;chargeFury(15);core=null;energy=free();grow=true;say("CORE +"+points)}
collectPowerup(head);if(boss&&same(head,boss)&&protectedNow){boss.hp--;gain(100+chain*10);chargeFury(12);floatText("HIT",boss);if(boss.hp<=0)destroyBoss()}
if(!grow)snake.pop();spawnClock++;eventClock++;hunterClock++;eventClock2++;if(eventClock2%210===0){const events=["HAZARD STORM","HUNTER SWARM","POWER SURGE"];const ev=events[Math.floor(Math.random()*events.length)];event(ev);if(ev==="HAZARD STORM")for(let i=0;i<3+zone;i++)hazards.push(free());if(ev==="HUNTER SWARM")while(hunters.length<Math.min(6,3+level))hunters.push({...free(),type:"hunter"});if(ev==="POWER SURGE"){gain(150);chargeFury(10);floatText("+150")}}
if(spawnClock%32===0&&hazards.length<Math.min(3+level+zone,11))hazards.push(free());
if(eventClock%82===0&&hunters.length<Math.min(2+level,6))spawnWave();
if(eventClock%150===0&&currentZone()>=2)spawnBoss();
if(hunterClock%3===0&&hunters.length)hunterStep();bossStep();
if(eventClock%70===0){combo=Math.max(1,combo-1);if(combo===1)chain=0}
const elapsed=performance.now()-startedAt;if(elapsed>=RUN_TIME)return win();
missionCheck();hud();updateAbilityUI();draw();timer=setTimeout(move,Math.max(48,118-combo*6-(force?35:0)))}
function statsMarkup(win){const bestScore=best(),newRecord=score>=bestScore&&score>0;return '<h2>'+(win?"SURVIVAL COMPLETE":"RUN OVER")+'</h2><div class="stats-grid"><span>SCORE<strong>'+score+'</strong></span><span>TIME<strong>'+timeEl.textContent+'</strong></span><span>COMBO<strong>x'+combo+'</strong></span><span>ENERGY<strong>'+stats.energy+'</strong></span><span>CORES<strong>'+stats.cores+'</strong></span><span>HUNTERS<strong>'+stats.hunters+'</strong></span><span>WARDENS<strong>'+stats.wardens+'</strong></span><span>ZONE<strong>'+zoneNames[zone]+'</strong></span></div>'+(newRecord?'<b class="record">NEW RECORD!</b>':'')}
function persist(win){let s={};try{s=JSON.parse(localStorage.getItem("snake-evolution-save")||"{}")}catch{}s.runs=(s.runs||0)+1;s.wins=(s.wins||0)+(win?1:0);s.combo=Math.max(s.combo||1,combo);s.wardens=(s.wardens||0)+stats.wardens;s.evo=Math.max(s.evo||1,evolution());localStorage.setItem("snake-evolution-save",JSON.stringify(s));showSave()}
function end(){alive=false;clearTimeout(timer);if(score>best())localStorage.setItem("snake-evolution-best",score);missionCheck();persist(false);message.querySelector("p").textContent="The run ended. Review your stats below.";statsPanel.innerHTML=statsMarkup(false);statsPanel.classList.add("show");missionPanel.classList.add("show");message.classList.remove("hidden");message.classList.add("show");hud();updateAbilityUI()}
function win(){alive=false;clearTimeout(timer);const bonus=500+level*100;gain(bonus);missionCheck();if(score>best())localStorage.setItem("snake-evolution-best",score);persist(true);message.querySelector("p").textContent="Five minutes survived. Bonus +"+bonus+".";message.classList.remove("hidden");message.classList.add("show");statsPanel.innerHTML=statsMarkup(true);statsPanel.classList.add("show");missionPanel.classList.add("show");say("SURVIVED // BONUS +"+bonus);hud();updateAbilityUI()}
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
hazards.forEach(p=>pixel(p,z>=3?"#ff3f6b":"#ff5b62"));hunters.forEach(p=>{pixel(p,p.type==="interceptor"?"#d66cff":"#66c7ff");ctx.fillStyle="#0b2634";ctx.fillRect(p.x+.3,p.y+.3,.4,.4)});powerups.forEach(p=>pixel(p,p.type==="overdrive"?"#ff9f43":p.type==="magnet"?"#a66cff":p.type==="apex"?"#ffffff":"#4de1d1"));if(boss){pixel(boss,boss.phase===2?"#ff203f":"#ff3f8f");ctx.fillStyle="#fff";ctx.fillRect(boss.x+.18,boss.y+.18,.64,.12);ctx.fillStyle="#111";ctx.fillRect(boss.x+.18,boss.y+.18,.64*(boss.hp/boss.maxHp),.12)}if(energy)pixel(energy,"#79e35b");if(core){pixel(core,"#ffd85c");pixel({x:core.x,y:Math.max(0,core.y-1)},"#ffd85c")}snake.forEach((p,i)=>pixel(p,i?evoColors[evolution()-1]:"#b8ff8d"));if(level>1){ctx.strokeStyle=evoColors[evolution()-1];ctx.lineWidth=.14;ctx.strokeRect(snake[0].x+.04,snake[0].y+.04,.92,.92)}if(performance.now()<shieldUntil){ctx.strokeStyle="#66c7ff";ctx.lineWidth=.25;ctx.strokeRect(snake[0].x+.08,snake[0].y+.08,.84,.84)}}
message.classList.add("hidden");message.classList.remove("show");draw();updateAbilityUI();showSave();renderMissions();
window.SnakeEvolution={start:reset,getState:()=>({alive,score,combo,fury,level,zone})};