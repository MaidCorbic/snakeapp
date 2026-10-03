/* SNAKE EVOLUTION // REWORK V2
   Presentation + lightweight mode orchestration. */
(() => {
  "use strict";
  if (window.__snakeReworkV2) return;
  window.__snakeReworkV2 = true;
  document.body.classList.add("rework-v2");

  const PARTY_KEY = "snake-evolution-mode";
  const getMode = () => localStorage.getItem(PARTY_KEY) === "party" ? "party" : "standard";
  const setMode = mode => {
    try { localStorage.setItem(PARTY_KEY, mode); } catch {}
    document.body.classList.toggle("rework-party", mode === "party");
  };

  const gameShell = () => document.querySelector(".game-shell");
  const showSegment = (title,copy) => {
    const shell=gameShell(); if(!shell) return;
    let el=document.querySelector("#reworkSegment");
    if(!el){el=document.createElement("div");el.id="reworkSegment";shell.appendChild(el)}
    el.innerHTML="<strong>"+title+"</strong><span>"+copy+"</span>";
    el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
    clearTimeout(el.__timer); el.__timer=setTimeout(()=>el.classList.remove("show"),2200);
  };

  const syncBadge = () => {
    const shell=gameShell(); if(!shell)return;
    let badge=document.querySelector("#reworkModeBadge");
    if(!badge){badge=document.createElement("div");badge.id="reworkModeBadge";shell.appendChild(badge)}
    const party=getMode()==="party";
    badge.textContent=party?"PARTY RUN // 03:00":"SURVIVAL // 05:00";
    badge.classList.toggle("party",party);
    document.body.classList.toggle("rework-party",party);
  };

  const decorateMenu = () => {
    const actions=document.querySelector(".boot-actions");
    if(!actions||document.querySelector("#bootFun"))return;
    const b=document.createElement("button");
    b.type="button"; b.id="bootFun"; b.className="boot-action secondary";
    b.textContent="PARTY RUN // CHAOS";
    actions.appendChild(b);
    b.addEventListener("click",()=>{
      setMode("party");
      window.startSnakeReworkMode?.("party");
    });
  };

  const startStandard = () => { setMode("standard"); window.SnakeEvolution?.start?.(); };
  window.startSnakeReworkMode = mode => {
    setMode(mode);
    if(window.SnakeEvolution?.start) window.SnakeEvolution.start();
    else window.__snakeReworkPendingMode = mode;
  };

  const decorateRun = () => {
    const shell = gameShell();
    if (!shell || shell.dataset.reworkTicker === "1") return;
    shell.dataset.reworkTicker = "1";
    syncBadge();
    const score=document.querySelector("#score");
    const combo=document.querySelector("#combo");
    if(!score||!combo)return;
    let last=Number(score.textContent)||0;
    const tick=()=>{
      if(!document.querySelector(".game-shell"))return;
      syncBadge();
      const now=Number(score.textContent)||0;
      if(now>last && getMode()==="party" && now-last>=100) showSegment("BIG SCORE","CHAIN IT // KEEP MOVING");
      last=now;
      window.setTimeout(tick,260);
    };
    tick();
  };

  const observeGame = new MutationObserver(() => {
    if(document.querySelector(".game-shell")) decorateRun();
  });
  observeGame.observe(document.body,{childList:true,subtree:true});

  document.addEventListener("click",e=>{
    const target=e.target.closest?.("#bootStart,#bootDaily,#bootEndless");
    if(target){
      setMode("standard");
      setTimeout(decorateRun,80);
    }
  });

  decorateMenu();
  setMode(getMode());
  window.SnakeReworkV2={version:"2.0.0",setMode,showSegment};
})();
