/* Snake Evolution — Player Center progress dashboard v2. */
(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const safeRead=(key,fallback)=>{try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)??fallback}catch{return fallback}};
const put=(node,value)=>{if(node)node.textContent=String(value)};
const number=(value)=>Math.max(0,Number(value)||0);
function refreshHub(){
 const save=safeRead("snake-evolution-save",{});
 const best=Math.max(number(safeRead("snake-evolution-best",0)),number(save.best));
 const runs=number(save.runs);
 const daily=number(safeRead("snake-evolution-daily-best",0));
 const cards=safeRead("snake-evolution-card-collection",{});
 const cardCount=number(cards.total)||["scout","core","guardian","fury","hunter","apex"].reduce((sum,id)=>sum+number(cards[id]),0);
 put($("#seHubBest"),best.toLocaleString());
 put($("#seHubRuns"),runs.toLocaleString());
 put($("#seHubDaily"),daily.toLocaleString());
 put($("#seHubCards"),cardCount.toLocaleString());
 put($("#seHubSummary"),runs ? "PROFILE ACTIVE · "+runs.toLocaleString()+" RUNS RECORDED" : "YOUR RECORDS WILL APPEAR HERE AS YOU PLAY");
}
function addHub(){
 const menu=$("#bootMenu"),layout=menu?.querySelector(".boot-layout"),profile=menu?.querySelector(".landing-profile");
 if(!menu||!layout||$("#seArcadeHub"))return;
 profile?.remove();
 const hub=document.createElement("section");
 hub.id="seArcadeHub";hub.className="se-hub";hub.setAttribute("aria-label","Player progress and arcade records");
 hub.innerHTML='<div class="se-hub-head"><div><div class="se-hub-kicker">PLAYER CENTER / YOUR ARCADE RECORD</div><h3>Your progress, at a glance.</h3><p class="se-hub-description">A snapshot of what you have built so far. No extra menus — just your records.</p></div></div><div class="se-progress-grid"><article class="se-progress-stat se-progress-best"><span class="se-stat-label">PERSONAL BEST</span><strong id="seHubBest">0</strong><small>All-time high score</small></article><article class="se-progress-stat"><span class="se-stat-label">RUNS PLAYED</span><strong id="seHubRuns">0</strong><small>Total recorded attempts</small></article><article class="se-progress-stat"><span class="se-stat-label">DAILY BEST</span><strong id="seHubDaily">0</strong><small>Today’s challenge record</small></article><article class="se-progress-stat"><span class="se-stat-label">CARDS COLLECTED</span><strong id="seHubCards">0</strong><small>Evolution collection</small></article></div><div class="se-hub-foot"><span id="seHubSummary">YOUR RECORDS WILL APPEAR HERE AS YOU PLAY</span><span class="se-hub-storage"><i aria-hidden="true"></i> SAVED ON THIS DEVICE</span></div>';
 layout.insertAdjacentElement("afterend",hub);
 refreshHub();
}
function observeResults(){
 const result=$("#message");if(!result||result.dataset.seHubObserved)return;result.dataset.seHubObserved="true";
 new MutationObserver(()=>{if(result.classList.contains("hidden"))return;const title=$("h2",result);if(!title||$("#seResultHint",result))return;const hint=document.createElement("p");hint.id="seResultHint";hint.textContent="RUN RECORDED // Review your stats, then run it back or return to the arcade.";hint.style.cssText="max-width:560px;margin:12px auto;color:#9aaea0;font:12px/1.6 system-ui,sans-serif;text-align:center";title.insertAdjacentElement("afterend",hint)}).observe(result,{attributes:true,childList:true,subtree:true});
}
function init(){addHub();observeResults();refreshHub();window.addEventListener("focus",refreshHub);document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshHub()});}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();