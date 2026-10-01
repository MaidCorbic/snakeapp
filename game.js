const canvas=document.querySelector("#game"),ctx=canvas.getContext("2d"),message=document.querySelector("#message"),scoreEl=document.querySelector("#score"),comboEl=document.querySelector("#combo"),timeEl=document.querySelector("#time"),bestEl=document.querySelector("#best"),start=document.querySelector("#start"),toast=document.querySelector("#toast"),zoneEl=document.querySelector("#zone"),evoEl=document.querySelector("#evo"),bossHud=document.querySelector("#bossHud"),bossHp=document.querySelector("#bossHp"),statsPanel=document.querySelector("#runStats"),missionPanel=document.querySelector("#missions"),menu=document.querySelector("#menu"),menuStart=document.querySelector("#menuStart"),howBtn=document.querySelector("#how"),pauseBtn=document.querySelector("#pauseBtn"),eventBanner=document.querySelector("#eventBanner"),floaters=document.querySelector("#floaters"),saveStats=document.querySelector("#saveStats");
const dashBtn=document.querySelector("#dash"),shieldBtn=document.querySelector("#shield"),pulseBtn=document.querySelector("#pulse"),dashFill=document.querySelector("#dashFill"),shieldFill=document.querySelector("#shieldFill"),pulseFill=document.querySelector("#pulseFill");
const COLS=32,ROWS=20,RUN_TIME=300000;
let snake=[],dir,next,energy=null,core=null,hazards=[],hunters=[],powerups=[],boss=null,score=0,combo=1,alive=false,paused=false,startedAt=0,timer,spawnClock=0,eventClock=0,hunterClock=0,bossClock=0,level=1,zone=0,shieldUntil=0,pulseUntil=0,dashReady=0,shieldReady=0,pulseReady=0,chain=0,eventClock2=0,stats={energy:0,cores:0,hunters:0,wardens:0,damage:0,runCount:0};
const best=()=>Number(localStorage.getItem("snake-evolution-best")||0);
const missions=()=>{try{return JSON.parse(localStorage.getItem("snake-evolution-missions")||"{}")}catch{return {}}};
const saveMissions=m=>localStorage.setItem("snake-evolution-missions",JSON.stringify(m));
const same=(a,b)=>a.x===b.x&&a.y===b.y,rand=()=>({x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)});
const zoneNames=["NEON GRID","HAZARD SECTOR","DARK SECTOR","Warden Territory","FINAL LOCKDOWN"];
const evoNames=["RUNNER","CHARGER","PHANTOM","OVERLORD"];const evoColors=["#79e35b","#ffd85c","#a66cff","#ff3f8f"];
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(canvas.width/COLS,0,0,canvas.height/ROWS)}addEventListener("resize",resize);resize();
function free(){let p,t=0;do{p=rand();t++}while(t<600&&(snake.some(s=>same(s,p))||hazards.some(s=>same(s,p))||hunters.some(s=>same(s,p))||powerups.some(s=>same(s,p))||(energy&&same(energy,p))||(core&&same(core,p))||(boss&&same(boss,p))));return p}
function currentZone(){return Math.min(4,Math.floor((performance.now()-startedAt)/60000))}
function currentLevel(){return Math.min(4,1+Math.floor(score/600))}
function evolution(){return currentLevel()}
function event(t){eventBanner.textContent="⚠ "+t;eventBanner.classList.add("show");clearTimeout(event.t);event.t=setTimeout(()=>eventBanner.classList.remove("show"),1300)}
function floatText(t,p=snake[0]){const el=document.createElement("span");el.className="floater";el.textContent=t;el.style.left=((p.x/COLS)*100)+"%";el.style.top=((p.y/ROWS)*100)+"%";floaters.appendChild(el);setTimeout(()=>el.remove(),700)}
function pause(){if(!alive)return;paused=!paused;if(paused){clearTimeout(timer);const o=document.createElement("div");o.className="pause-overlay";o.id="pauseOverlay";o.innerHTML="<div><h2>PAUSED</h2><button id=\"resume\">RESUME</button><button id=\"restartPause\">RESTART</button><button id=\"menuPause\">MAIN MENU</button></div>";document.querySelector(".game-shell").appendChild(o);o.querySelector("#resume").onclick=pause;o.querySelector("#restartPause").onclick=()=>{o.remove();paused=false;reset()};o.querySelector("#menuPause").onclick=()=>{o.remove();alive=false;menu.classList.remove("hidden");message.style.display="none"}}else{document.querySelector("#pauseOverlay")?.remove();move()}}
function showSave(){let s={};try{s=JSON.parse(localStorage.getItem("snake-evolution-save")||"{}")}catch{}saveStats.innerHTML="RUNS <strong>"+(s.runs||0)+"</strong> · WINS <strong>"+(s.wins||0)+"</strong> · BEST COMBO <strong>x"+(s.combo||1)+"</strong> · WARDENS <strong>"+(s.wardens||0)+"</strong> · EVOLUTION <strong>"+(evoNames[s.evo-1]||"RUNNER")+"</strong>"}
function hud(){scoreEl.textContent=score;comboEl.textContent=chain>1?"x"+combo+" / CHAIN x"+chain:"x"+combo;bestEl.textContent=best();const left=Math.max(0,RUN_TIME-(performance.now()-startedAt));timeEl.textContent=Math.floor(left/60000)+":"+String(Math.ceil((left%60000)/1000)).padStart(2,"0");zone=currentZone();level=currentLevel();zoneEl.textContent=zoneNames[zone];evoEl.textContent=evoNames[level-1];if(boss){bossHud.classList.add("show");bossHp.textContent=boss.hp+"/"+boss.maxHp}else bossHud.classList.remove("show")}
function say(t){toast.textContent=t;toast.classList.add("show");clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove("show"),1000)}
function reset(){clearTimeout(timer);menu.classList.add("hidden");howPanel?.classList.add("hidden");menuStart?.classList.remove("hidden");howBtn?.classList.remove("hidden");paused=false;clearTimeout(timer);document.querySelector("#pauseOverlay")?.remove();snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];dir=next={x:1,y:0};score=0;combo=1;hazards=[];hunters=[];powerups=[];boss=null;spawnClock=0;eventClock=0;hunterClock=0;bossClock=0;level=1;zone=0;stats={energy:0,cores:0,hunters:0,wardens:0,damage:0,runCount:0};chain=0;eventClock2=0;energy=free();core=null;shieldUntil=pulseUntil=0;dashReady=shieldReady=pulseReady=0;alive=true;startedAt=performance.now();message.style.display="none";statsPanel.classList.remove("show");missionPanel.classList.remove("show");start.textContent="RUN AGAIN";hud();draw();move()}
function setDir(x,y){if(alive&&!(x===-dir.x&&y===-dir.y))next={x,y}}
function useDash(){if(!alive||paused||performance.now()<dashReady)return;clearTimeout(timer);const cd=evolution()>=3?5500:7000;dashReady=performance.now()+cd;say("DASH // OVERRIDE");move(true)}
function useShield(){if(!alive||paused||performance.now()<shieldReady)return;shieldReady=performance.now()+12000;shieldUntil=performance.now()+2500;say("SHIELD // ACTIVE")}
function usePulse(){if(!alive||paused||performance.now()<pulseReady)return;const cd=evolution()>=3?10500:15000;pulseReady=performance.now()+cd;pulseUntil=performance.now()+350;const beforeHunters=hunters.length;hunters=hunters.filter(h=>Math.abs(h.x-snake[0].x)+Math.abs(h.y-snake[0].y)>8);const destroyed=beforeHunters-hunters.length;if(destroyed){stats.hunters+=destroyed;chain+=destroyed;score+=destroyed*100;floatText("CHAIN x"+chain)}hazards=hazards.filter(h=>Math.abs(h.x-snake[0].x)+Math.abs(h.y-snake[0].y)>5);if(boss){boss.hp=Math.max(0,boss.hp-2);if(boss.hp===0)destroyBoss()}score+=25;say("PULSE // CLEAR");hud()}
function key(e){const k=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," ","w","a","s","d","shift"].includes(k))e.preventDefault();if(k==="escape"||k==="p"){pause();return}if(k==="arrowup"||k==="w")setDir(0,-1);if(k==="arrowdown"||k==="s")setDir(0,1);if(k==="arrowleft"||k==="a")setDir(-1,0);if(k==="arrowright"||k==="d")setDir(1,0);if(k===" ")useDash();if(k==="shift")useShield();if(k==="e")usePulse()}
addEventListener("keydown",key);
const howPanel=document.querySelector("#howPanel"),howBack=document.querySelector("#howBack");
function openGameFromMenu(e){e?.preventDefault();e?.stopPropagation();howPanel.classList.add("hidden");menu.classList.add("hidden");message.style.display="none";reset()}
function openTutorial(e){e?.preventDefault();e?.stopPropagation();menu.classList.remove("hidden");howPanel.classList.remove("hidden");howBtn.setAttribute("aria-expanded","true")}
function closeTutorial(e){e?.preventDefault();e?.stopPropagation();howPanel.classList.add("hidden");howBtn.setAttribute("aria-expanded","false")}
/* Native click is the primary activation path: Android/iOS, mouse, keyboard and accessibility all converge here. */
menuStart.onclick=openGameFromMenu;
howBtn.onclick=openTutorial;
howBack.onclick=closeTutorial;
/* Capture-phase delegation is a second safety net for mobile browsers that retarget taps. */
document.addEventListener("click",e=>{
 const button=e.target?.closest?.("#menuStart,#how,#howBack");
 if(!button)return;
 if(button===menuStart){e.stopImmediatePropagation();return openGameFromMenu(e)}
 if(button===howBtn){e.stopImmediatePropagation();return openTutorial(e)}
 if(button===howBack){e.stopImmediatePropagation();return closeTutorial(e)}
},{capture:true});
start.onclick=()=>{message.style.display="none";reset()};
showSave();
document.querySelectorAll("[data-dir]").forEach(b=>b.addEventListener("pointerdown",e=>{
 e.preventDefault();
 const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.dir];
 setDir(...d);
},{passive:false}));
dashBtn.addEventListener("pointerdown",e=>{e.preventDefault();useDash()},{passive:false});
shieldBtn.addEventListener("pointerdown",e=>{e.preventDefault();useShield()},{passive:false});
pulseBtn.addEventListener("pointerdown",e=>{e.preventDefault();usePulse()},{passive:false});
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
function spawnWave(){const lv=Math.min(5,1+Math.floor((performance.now()-startedAt)/60000));const count=Math.min(1+Math.floor(lv/2),5);while(hunters.length<count)hunters.push({...free(),type:Math.random()<.35?"interceptor":"hunter"});if(lv>=2&&hazards.length<4+lv)hazards.push(free());if(lv>=3&&Math.random()<.65)powerups.push({...free(),type:["overdrive","magnet","repair"][Math.floor(Math.random()*3)]});say("WAVE // LV"+lv)}
function hunterStep(){hunters.forEach(h=>{const dx=snake[0].x-h.x,dy=snake[0].y;if(h.type==="interceptor"&&Math.abs(dx)+Math.abs(dy)<10){h.x+=Math.sign(dx);h.y+=Math.sign(dy)}else if(Math.abs(dx)>Math.abs(dy))h.x+=Math.sign(dx);else h.y+=Math.sign(dy);h.x=(h.x+COLS)%COLS;h.y=(h.y+ROWS)%ROWS})}
function spawnBoss(){if(boss)return;boss={...free(),hp:12,maxHp:12,phase:1};event("WARDEN INCOMING");say("WARDEN // BOSS INBOUND")}
function destroyBoss(){if(!boss)return;boss=null;stats.wardens++;chain++;const gain=1000+chain*100;score+=gain;floatText("+"+gain);say("WARDEN DESTROYED // +"+gain)}
function bossStep(){if(!boss)return;bossClock++;boss.phase=boss.hp<=6?2:1;if(boss.phase===2&&bossClock%3)return;if(boss.phase===1&&bossClock%5)return;const dx=snake[0].x-boss.x,dy=snake[0].y-boss.y;if(Math.abs(dx)>Math.abs(dy))boss.x+=Math.sign(dx);else boss.y+=Math.sign(dy);boss.x=(boss.x+COLS)%COLS;boss.y=(boss.y+ROWS)%ROWS;if(bossClock%(boss.phase===2?7:15)===0)hazards.push(free());if(boss.phase===2&&bossClock%21===0){event("WARDEN PHASE 2");say("WARDEN // ENRAGED")}}
function collectPowerup(head){const i=powerups.findIndex(x=>same(x,head));if(i<0)return;const type=powerups[i].type;powerups.splice(i,1);if(type==="overdrive"){dashReady=performance.now();score+=100;say("OVERDRIVE // DASH READY")}else if(type==="magnet"){energy=free();core=free();score+=75;say("MAGNET // LOOT RELOCATED")}else{snake.push({...snake[snake.length-1]});score+=150;say("REPAIR // +LENGTH")}}
function missionCheck(){const m=missions(),done=[];if(stats.energy>=25&&!m.energy25){m.energy25=1;done.push("COLLECTOR")}if(stats.cores>=5&&!m.core5){m.core5=1;done.push("CORE HUNTER")}if(stats.hunters>=10&&!m.hunter10){m.hunter10=1;done.push("HUNTER")}if(combo>=9&&!m.combo9){m.combo9=1;done.push("COMBO MASTER")}if(stats.wardens>=1&&!m.warden){m.warden=1;done.push("WARDEN SLAYER")}if(stats.damage===0&&!alive&&!m.nohit){m.nohit=1;done.push("NO HIT")}saveMissions(m);if(done.length)say("MISSION // "+done.join(" + "))}
function move(force=false){if(!alive)return;dir=next;const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS)return end();const protectedNow=performance.now()<shieldUntil||performance.now()<pulseUntil;
if(!protectedNow&&(snake.some((s,i)=>i>0&&same(s,head))||hazards.some(h=>same(h,head))||hunters.some(h=>same(h,head))||(boss&&same(boss,head)))){stats.damage++;return end()}
snake.unshift(head);let grow=false;
if(energy&&same(head,energy)){const gain=10*combo;score+=gain;combo=Math.min(9,combo+1);chain++;stats.energy++;floatText("+"+gain);energy=free();grow=true;if(stats.energy%3===0){core=free();say("CORE SPAWNED")}}
if(core&&same(head,core)){const gain=50*combo+chain*5;score+=gain;combo=Math.min(9,combo+1);stats.cores++;core=null;energy=free();grow=true;say("CORE +"+gain)}
collectPowerup(head);if(boss&&same(head,boss)&&protectedNow){boss.hp--;score+=100+chain*10;floatText("HIT",boss);if(boss.hp<=0)destroyBoss()}
if(!grow)snake.pop();spawnClock++;eventClock++;hunterClock++;eventClock2++;if(eventClock2%210===0){const events=["HAZARD STORM","HUNTER SWARM","POWER SURGE"];const ev=events[Math.floor(Math.random()*events.length)];event(ev);if(ev==="HAZARD STORM")for(let i=0;i<3+zone;i++)hazards.push(free());if(ev==="HUNTER SWARM")while(hunters.length<Math.min(6,3+level))hunters.push({...free(),type:"hunter"});if(ev==="POWER SURGE"){score+=150;floatText("+150")}}
if(spawnClock%32===0&&hazards.length<Math.min(3+level+zone,11))hazards.push(free());
if(eventClock%82===0&&hunters.length<Math.min(2+level,6))spawnWave();
if(eventClock%150===0&&currentZone()>=2)spawnBoss();
if(hunterClock%3===0&&hunters.length)hunterStep();bossStep();
if(eventClock%70===0){combo=Math.max(1,combo-1);if(combo===1)chain=0}
const elapsed=performance.now()-startedAt;if(elapsed>=RUN_TIME)return win();
missionCheck();hud();updateAbilityUI();draw();timer=setTimeout(move,Math.max(48,118-combo*6-(force?35:0)))}
function statsMarkup(win){const bestScore=best(),newRecord=score>=bestScore&&score>0;return '<h2>'+(win?"SURVIVAL COMPLETE":"RUN OVER")+'</h2><div class="stats-grid"><span>SCORE<strong>'+score+'</strong></span><span>TIME<strong>'+timeEl.textContent+'</strong></span><span>COMBO<strong>x'+combo+'</strong></span><span>ENERGY<strong>'+stats.energy+'</strong></span><span>CORES<strong>'+stats.cores+'</strong></span><span>HUNTERS<strong>'+stats.hunters+'</strong></span><span>WARDENS<strong>'+stats.wardens+'</strong></span><span>ZONE<strong>'+zoneNames[zone]+'</strong></span></div>'+(newRecord?'<b class="record">NEW RECORD!</b>':'')}
function persist(win){let s={};try{s=JSON.parse(localStorage.getItem("snake-evolution-save")||"{}")}catch{}s.runs=(s.runs||0)+1;s.wins=(s.wins||0)+(win?1:0);s.combo=Math.max(s.combo||1,combo);s.wardens=(s.wardens||0)+stats.wardens;s.evo=Math.max(s.evo||1,evolution());localStorage.setItem("snake-evolution-save",JSON.stringify(s));showSave()}
function end(){alive=false;clearTimeout(timer);if(score>best())localStorage.setItem("snake-evolution-best",score);missionCheck();persist(false);message.querySelector("p").textContent="The run ended. Review your stats below.";message.style.display="grid";statsPanel.innerHTML=statsMarkup(false);statsPanel.classList.add("show");missionPanel.classList.add("show");hud();updateAbilityUI()}
function win(){alive=false;clearTimeout(timer);score+=500+level*100;const bonus=500+level*100;missionCheck();if(score>best())localStorage.setItem("snake-evolution-best",score);persist(true);message.querySelector("p").textContent="Five minutes survived. Bonus +"+bonus+".";message.style.display="grid";statsPanel.innerHTML=statsMarkup(true);statsPanel.classList.add("show");missionPanel.classList.add("show");say("SURVIVED // BONUS +"+bonus);hud();updateAbilityUI()}
function updateAbilityUI(){const now=performance.now();dashFill.style.width=(now>=dashReady?100:Math.max(0,100-(dashReady-now)/70))+"%";shieldFill.style.width=(now>=shieldReady?100:Math.max(0,100-(shieldReady-now)/120))+"%";pulseFill.style.width=(now>=pulseReady?100:Math.max(0,100-(pulseReady-now)/150))+"%"}
function pixel(p,c){ctx.fillStyle=c;ctx.fillRect(p.x+.12,p.y+.12,.76,.76);ctx.fillStyle="#0005";ctx.fillRect(p.x+.12,p.y+.72,.76,.14)}
function draw(){const z=currentZone();const bg=["#060806","#090704","#050609","#09050b","#0b0508"][z],grid=["#111a15","#21150e","#121521","#201125","#281015"][z];ctx.fillStyle=bg;ctx.fillRect(0,0,COLS,ROWS);ctx.strokeStyle=grid;ctx.lineWidth=.1;for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,ROWS);ctx.stroke()}for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(COLS,y);ctx.stroke()}
hazards.forEach(p=>pixel(p,z>=3?"#ff3f6b":"#ff5b62"));hunters.forEach(p=>{pixel(p,p.type==="interceptor"?"#d66cff":"#66c7ff");ctx.fillStyle="#0b2634";ctx.fillRect(p.x+.3,p.y+.3,.4,.4)});powerups.forEach(p=>pixel(p,p.type==="overdrive"?"#ff9f43":p.type==="magnet"?"#a66cff":"#4de1d1"));if(boss){pixel(boss,boss.phase===2?"#ff203f":"#ff3f8f");ctx.fillStyle="#fff";ctx.fillRect(boss.x+.18,boss.y+.18,.64,.12);ctx.fillStyle="#111";ctx.fillRect(boss.x+.18,boss.y+.18,.64*(boss.hp/boss.maxHp),.12)}if(energy)pixel(energy,"#79e35b");if(core){pixel(core,"#ffd85c");pixel({x:core.x,y:Math.max(0,core.y-1)},"#ffd85c")}snake.forEach((p,i)=>pixel(p,i?evoColors[evolution()-1]:"#b8ff8d"));if(level>1){ctx.strokeStyle=evoColors[evolution()-1];ctx.lineWidth=.14;ctx.strokeRect(snake[0].x+.04,snake[0].y+.04,.92,.92)}if(performance.now()<shieldUntil){ctx.strokeStyle="#66c7ff";ctx.lineWidth=.25;ctx.strokeRect(snake[0].x+.08,snake[0].y+.08,.84,.84)}}
draw();updateAbilityUI();showSave();