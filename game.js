const canvas=document.querySelector("#game"),ctx=canvas.getContext("2d"),message=document.querySelector("#message"),scoreEl=document.querySelector("#score"),comboEl=document.querySelector("#combo"),timeEl=document.querySelector("#time"),bestEl=document.querySelector("#best"),start=document.querySelector("#start"),toast=document.querySelector("#toast");
const dashBtn=document.querySelector("#dash"),shieldBtn=document.querySelector("#shield"),pulseBtn=document.querySelector("#pulse"),dashFill=document.querySelector("#dashFill"),shieldFill=document.querySelector("#shieldFill"),pulseFill=document.querySelector("#pulseFill");
const COLS=32,ROWS=20,RUN_TIME=300000;let snake,dir,next,energy,core,hazards,hunters,score,combo,alive=false,startedAt,lastTick,timer,spawnClock,eventClock,level,shieldUntil=0,dashUntil=0,pulseUntil=0,dashReady=0,shieldReady=0,pulseReady=0,hunterClock=0;
const best=()=>Number(localStorage.getItem("snake-evolution-best")||0);bestEl.textContent=best();
const same=(a,b)=>a.x===b.x&&a.y===b.y,rand=()=>({x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)});
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(canvas.width/COLS,0,0,canvas.height/ROWS,0,0)}addEventListener("resize",resize);resize();
function free(){let p,tries=0;do{p=rand();tries++}while(tries<300&&(snake.some(s=>same(s,p))||hazards.some(s=>same(s,p))||hunters.some(s=>same(s,p))||(energy&&same(energy,p))||(core&&same(core,p))));return p}
function hud(){scoreEl.textContent=score;comboEl.textContent="x"+combo;bestEl.textContent=best();const left=Math.max(0,RUN_TIME-(performance.now()-startedAt));timeEl.textContent=Math.floor(left/60000)+":"+String(Math.ceil((left%60000)/1000)).padStart(2,"0")}
function say(t){toast.textContent=t;toast.classList.add("show");clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove("show"),900)}
function reset(){snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];dir=next={x:1,y:0};score=0;combo=1;hazards=[];hunters=[];spawnClock=0;eventClock=0;hunterClock=0;level=1;energy=free();core=null;shieldUntil=dashUntil=pulseUntil=0;dashReady=shieldReady=pulseReady=0;alive=true;startedAt=performance.now();lastTick=startedAt;message.style.display="none";start.textContent="RUN AGAIN";hud();draw();tick()}
function setDir(x,y){if(alive&&!(x===-dir.x&&y===-dir.y))next={x,y}}
function useDash(){if(!alive||performance.now()<dashReady)return;dashReady=performance.now()+7000;dashUntil=performance.now()+850;say("DASH");move(true)}
function useShield(){if(!alive||performance.now()<shieldReady)return;shieldReady=performance.now()+12000;shieldUntil=performance.now()+2500;say("SHIELD")}
function usePulse(){if(!alive||performance.now()<pulseReady)return;pulseReady=performance.now()+15000;pulseUntil=performance.now()+350;say("PULSE");hunters=hunters.filter(h=>Math.abs(h.x-snake[0].x)+Math.abs(h.y-snake[0].y)>8);hazards=hazards.filter(h=>Math.abs(h.x-snake[0].x)+Math.abs(h.y-snake[0].y)>5);score+=25;hud()}
function key(e){const k=e.key.toLowerCase();if(k==="arrowup"||k==="w")setDir(0,-1);if(k==="arrowdown"||k==="s")setDir(0,1);if(k==="arrowleft"||k==="a")setDir(-1,0);if(k==="arrowright"||k==="d")setDir(1,0);if(k===" ")useDash();if(k==="shift")useShield();if(k==="e")usePulse()}
addEventListener("keydown",key);document.querySelectorAll("[data-dir]").forEach(b=>b.addEventListener("pointerdown",()=>{const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.dir];setDir(...d)}));start.onclick=reset;dashBtn.onclick=useDash;shieldBtn.onclick=useShield;pulseBtn.onclick=usePulse;
function spawnWave(){level=Math.min(5,1+Math.floor((RUN_TIME-(RUN_TIME-Math.max(0,performance.now()-startedAt)))/60000));const count=Math.min(1+Math.floor(level/2),4);for(let i=hunters.length;i<count;i++)hunters.push(free());if(level>=3&&hazards.length<8)hazards.push(free());say("HUNTER WAVE")}
function hunterStep(){hunters.forEach(h=>{const dx=snake[0].x-h.x,dy=snake[0].y-h.y;if(Math.abs(dx)>Math.abs(dy))h.x+=Math.sign(dx);else h.y+=Math.sign(dy);h.x=(h.x+COLS)%COLS;h.y=(h.y+ROWS)%ROWS})}
function move(force=false){if(!alive)return;dir=next;const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS){return end()}const protectedNow=performance.now()<shieldUntil||performance.now()<pulseUntil;
if(!protectedNow&&(snake.some((s,i)=>i>0&&same(s,head))||hazards.some(h=>same(h,head))||hunters.some(h=>same(h,head))))return end();
snake.unshift(head);let grow=false;
if(energy&&same(head,energy)){score+=10*combo;combo=Math.min(combo+1,9);energy=free();grow=true;if(combo%3===0){core=free();say("CORE SPAWNED")}}
if(core&&same(head,core)){score+=50*combo;combo=Math.min(combo+1,9);core=null;energy=free();grow=true;say("CORE +"+50*combo)}
if(!grow)snake.pop();
spawnClock++;eventClock++;hunterClock++;
if(spawnClock%32===0&&hazards.length<Math.min(3+level,9))hazards.push(free());
if(eventClock%85===0&&hunters.length<Math.min(level+1,5))spawnWave();
if(hunterClock%3===0&&hunters.length)hunterStep();
if(eventClock%70===0)combo=Math.max(1,combo-1);
const elapsed=performance.now()-startedAt;if(elapsed>=RUN_TIME)return win();
hud();updateAbilityUI();draw();const delay=Math.max(48,118-combo*6-(force?35:0));timer=setTimeout(move,delay)}
function tick(){if(!alive)return;move()}
function end(){alive=false;clearTimeout(timer);if(score>best())localStorage.setItem("snake-evolution-best",score);hud();message.querySelector("h2").textContent="RUN OVER";message.querySelector("p").textContent="SCORE "+score+" • COMBO x"+combo;message.style.display="grid";updateAbilityUI()}
function win(){alive=false;clearTimeout(timer);score+=500+level*100;if(score>best())localStorage.setItem("snake-evolution-best",score);hud();message.querySelector("h2").textContent="ARENA CLEARED";message.querySelector("p").textContent="FIVE MINUTES SURVIVED • BONUS "+(500+level*100);message.style.display="grid";say("SURVIVED")}
function updateAbilityUI(){const now=performance.now();dashFill.style.width=(now>=dashReady?"100":Math.max(0,100-(dashReady-now)/70))+"%";shieldFill.style.width=(now>=shieldReady?"100":Math.max(0,100-(shieldReady-now)/120))+"%";pulseFill.style.width=(now>=pulseReady?"100":Math.max(0,100-(pulseReady-now)/150))+"%"}
function pixel(p,c){ctx.fillStyle=c;ctx.fillRect(p.x+.12,p.y+.12,.76,.76);ctx.fillStyle="#0005";ctx.fillRect(p.x+.12,p.y+.72,.76,.14)}
function draw(){ctx.fillStyle="#060806";ctx.fillRect(0,0,COLS,ROWS);ctx.strokeStyle="#111a15";ctx.lineWidth=.1;for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,ROWS);ctx.stroke()}for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(COLS,y);ctx.stroke()}
hazards.forEach(p=>pixel(p,"#ff5b62"));hunters.forEach(p=>{pixel(p,"#66c7ff");ctx.fillStyle="#0b2634";ctx.fillRect(p.x+.3,p.y+.3,.4,.4)});if(energy)pixel(energy,"#79e35b");if(core){pixel(core,"#ffd85c");pixel({x:core.x,y:core.y-1},"#ffd85c")}snake.forEach((p,i)=>pixel(p,i?"#55bb4a":"#b8ff8d"));if(performance.now()<shieldUntil){ctx.strokeStyle="#66c7ff";ctx.lineWidth=.25;ctx.strokeRect(snake[0].x+.08,snake[0].y+.08,.84,.84)}}
draw();updateAbilityUI();