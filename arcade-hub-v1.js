/* Snake Evolution — Arcade Hub UX layer v1. */
(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const safeRead=(key,fallback={})=>{try{const v=JSON.parse(localStorage.getItem(key)||"null");return v&&typeof v==="object"?v:fallback}catch{return fallback}};
const put=(node,value)=>{if(node)node.textContent=String(value)};
const dateKey=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
function refreshHub(){
 const save=safeRead("snake-evolution-save"),bestValue=safeRead("snake-evolution-best",0);
 const best=Math.max(0,Number(bestValue)||Number(save.best)||0),runs=Math.max(0,Number(save.runs)||0);
 put($("#seHubSummary"),"BEST "+best+" · RUNS "+runs);
 put($("#seHubCareer"),runs?runs+" recorded runs · best "+best:"Your recorded runs and personal best");
 put($("#seHubDate"),"DAILY CHALLENGE // "+dateKey());
}
function addHub(){
 const menu=$("#bootMenu"),profile=menu?.querySelector(".landing-profile");
 if(!menu||!profile||$("#seArcadeHub"))return;
 const hub=document.createElement("section");
 hub.id="seArcadeHub";hub.className="se-hub";hub.setAttribute("aria-label","Arcade hub navigation");
 hub.innerHTML='<div class="se-hub-head"><div><div class="se-hub-kicker">PLAYER CENTER // LOCAL PROFILE</div><h3>Your next run starts here.</h3></div><p id="seHubDate">DAILY CHALLENGE</p></div><div class="se-hub-grid"><button class="se-hub-tile" type="button" data-hub-action="profile"><span class="se-tile-icon" aria-hidden="true">◈</span><b>CAREER PROFILE</b><small id="seHubCareer">Your recorded runs and personal best</small></button><button class="se-hub-tile" type="button" data-hub-action="daily"><span class="se-tile-icon" aria-hidden="true">◎</span><b>DAILY CHALLENGE</b><small>Today’s seeded run and local record</small></button><button class="se-hub-tile" type="button" data-hub-action="collection"><span class="se-tile-icon" aria-hidden="true">◇</span><b>COLLECTIONS</b><small>Evolution cards and unlocked badges</small></button><button class="se-hub-tile" type="button" data-hub-action="settings"><span class="se-tile-icon" aria-hidden="true">⚙</span><b>GAME SETTINGS</b><small>Controls, display, audio and access</small></button></div><div class="se-hub-foot"><span>PROFILE STORAGE <strong>LOCAL DEVICE</strong></span><span id="seHubSummary">BEST 0 · RUNS 0</span></div>';
 profile.insertAdjacentElement("afterend",hub);
 hub.addEventListener("click",event=>{
  const button=event.target.closest("[data-hub-action]");if(!button)return;
  const action=button.dataset.hubAction;
  if(action==="daily"){$("#bootDaily")?.click();return}
  if(action==="settings"){$("#bootOptions")?.click();return}
  if(action==="collection"){$("#bootOptions")?.click();window.setTimeout(()=>($("#bootCardDeck")||$("#bootBadgeArchive"))?.click(),40);return}
  if(action==="profile"){
   const save=safeRead("snake-evolution-save"),best=Math.max(0,Number(safeRead("snake-evolution-best",0))||Number(save.best)||0),runs=Math.max(0,Number(save.runs)||0),wins=Math.max(0,Number(save.wins)||0);
   const ratio=runs?Math.round(wins/runs*100):0;
   const details=["CAREER PROFILE","Best score: "+best,"Runs recorded: "+runs,"Survival wins: "+wins,"Win rate: "+ratio+"%","Daily record: "+(Number(safeRead("snake-evolution-daily-best",0))||0),"","Records are stored locally in this browser."].join("\n");
   let panel=$("#seProfileDialog");if(!panel){panel=document.createElement("div");panel.id="seProfileDialog";panel.className="boot-panel";panel.style.cssText="margin:16px 0;padding:20px;border:1px solid var(--se-line);border-radius:14px;background:#0a120d;color:#e8f6eb;white-space:pre-line;font:13px/1.9 ui-monospace,monospace";panel.setAttribute("role","status");hub.insertAdjacentElement("afterend",panel)}
   panel.replaceChildren();const content=document.createElement("div");content.textContent=details;panel.append(content);
   const close=document.createElement("button");close.type="button";close.className="boot-action secondary";close.textContent="CLOSE PROFILE";close.addEventListener("click",()=>panel.remove());panel.append(close);
  }
 });
 refreshHub();
}
function observeResults(){
 const result=$("#message");if(!result||result.dataset.seHubObserved)return;result.dataset.seHubObserved="true";
 new MutationObserver(()=>{if(result.classList.contains("hidden"))return;const title=$("h2",result);if(!title||$("#seResultHint",result))return;const hint=document.createElement("p");hint.id="seResultHint";hint.textContent="RUN RECORDED // Review your stats, then run it back or return to the arcade.";hint.style.cssText="max-width:560px;margin:12px auto;color:#9aaea0;font:12px/1.6 system-ui,sans-serif;text-align:center";title.insertAdjacentElement("afterend",hint)}).observe(result,{attributes:true,childList:true,subtree:true});
}
function init(){addHub();observeResults();refreshHub();window.addEventListener("focus",refreshHub);document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshHub()});const menu=$("#bootMenu");if(menu)new MutationObserver(refreshHub).observe(menu,{attributes:true,attributeFilter:["class"]})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();