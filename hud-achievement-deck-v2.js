/* SNAKE EVOLUTION V2.9.0 — interactive achievement flip-card deck */
(() => {
  "use strict";
  if (window.__snakeAchievementDeckV2) return;
  window.__snakeAchievementDeckV2 = true;

  const ROOT = "#achievementList";
  const GLYPHS = ["✦", "◈", "⬡", "✧", "⌘", "✪", "◎", "⬢", "✹", "◇", "△", "❖"];
  let filterMode = "all";

  function cleanTitle(value) {
    return String(value || "").replace(/^\s*(?:UNLOCKED|LOCKED)\s*\/\/\s*/i, "").trim() || "FIELD ACHIEVEMENT";
  }

  function makeNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function createFace(className, children) {
    const face = makeNode("span", className);
    children.forEach(child => face.appendChild(child));
    return face;
  }

  function transformCard(card) {
    if (!(card instanceof HTMLElement) || card.dataset.deckReady === "true") return;
    const headline = card.querySelector("b, strong");
    const detail = card.querySelector("span, small, p");
    const rawHeading = headline?.textContent || "";
    const title = cleanTitle(rawHeading);
    const description = (detail?.textContent || "Complete the listed gameplay milestone to add this achievement to your record.").trim();
    const unlocked = card.classList.contains("unlocked") || card.classList.contains("is-complete") || /^\s*UNLOCKED\b/i.test(rawHeading);
    const state = unlocked ? "unlocked" : "locked";
    const index = [...title].reduce((sum, character) => (sum + character.charCodeAt(0)) % 97, 0);
    card.classList.add("achievement-deck-card");
    card.dataset.deckReady = "true";
    card.dataset.deckState = state;
    card.dataset.deckTitle = title;
    card.setAttribute("aria-label", title + (unlocked ? ", unlocked achievement" : ", locked achievement"));

    const button = makeNode("button", "achievement-flip");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Flip to inspect " + title);

    const inner = makeNode("span", "achievement-card-inner");
    const top = makeNode("span", "achievement-card-top");
    top.append(
      makeNode("span", "", unlocked ? "UNLOCKED" : "FIELD RECORD"),
      makeNode("span", "achievement-card-id", "#" + String(index + 1).padStart(2, "0"))
    );
    const glyph = makeNode("span", "achievement-card-glyph", GLYPHS[index % GLYPHS.length]);
    glyph.setAttribute("aria-hidden", "true");
    const frontTitle = makeNode("strong", "achievement-card-title", title);
    const status = makeNode("span", "achievement-card-status", unlocked ? "UNLOCKED" : "LOCKED");
    const hint = makeNode("span", "achievement-card-flip-hint", "TAP TO INSPECT ↻");
    const front = createFace("achievement-face achievement-front", [top, glyph, frontTitle, status, hint]);

    const back = createFace("achievement-face achievement-back", [
      makeNode("span", "achievement-face-label", unlocked ? "ARCHIVE // VERIFIED" : "FIELD NOTES // REQUIREMENT"),
      makeNode("strong", "achievement-back-title", title),
      makeNode("span", "achievement-back-copy", description),
      makeNode("span", "achievement-back-status", unlocked
        ? "RECORDED ON THIS DEVICE"
        : "UNLOCK // " + description)
    ]);
    back.setAttribute("aria-hidden", "true");

    inner.append(front, back);
    button.appendChild(inner);
    card.replaceChildren(button);
    button.addEventListener("click", () => {
      const flipped = card.classList.toggle("is-flipped");
      button.setAttribute("aria-expanded", String(flipped));
      button.setAttribute("aria-label", flipped ? "Show front of " + title : "Flip to inspect " + title);
      front.setAttribute("aria-hidden", String(flipped));
      back.setAttribute("aria-hidden", String(!flipped));
    });
  }

  function ensureToolbar(root) {
    let toolbar = root.querySelector(":scope > .achievement-deck-toolbar");
    if (toolbar) return toolbar;

    toolbar = makeNode("div", "achievement-deck-toolbar");
    toolbar.innerHTML = "";
    const intro = makeNode("span", "achievement-deck-intro");
    intro.append(
      makeNode("strong", "", "ACHIEVEMENT DECK"),
      makeNode("small", "", "Select a card to inspect its unlock condition.")
    );
    const count = makeNode("span", "achievement-deck-count", "0 UNLOCKED");
    count.id = "achievementDeckCount";
    const filters = makeNode("span", "achievement-deck-filters");
    filters.setAttribute("role", "group");
    filters.setAttribute("aria-label", "Filter achievements");
    [
      ["all", "ALL CARDS"],
      ["unlocked", "UNLOCKED"],
      ["locked", "LOCKED"]
    ].forEach(([value, label]) => {
      const button = makeNode("button", "achievement-filter", label);
      button.type = "button";
      button.dataset.filter = value;
      button.setAttribute("aria-pressed", String(filterMode === value));
      filters.appendChild(button);
    });
    toolbar.append(intro, count, filters);
    root.insertBefore(toolbar, root.firstChild);
    toolbar.addEventListener("click", event => {
      const button = event.target.closest("button[data-filter]");
      if (!button || !toolbar.contains(button)) return;
      filterMode = button.dataset.filter || "all";
      refresh(root);
    });
    return toolbar;
  }

  function refresh(root) {
    if (!root) return;
    const toolbar = ensureToolbar(root);
    root.querySelectorAll(".achievement-item:not([data-deck-ready]), .se-bonus-card:not([data-deck-ready])")
      .forEach(transformCard);
    const cards = [...root.querySelectorAll(".achievement-deck-card")];
    const unlockedCount = cards.filter(card => card.dataset.deckState === "unlocked").length;
    const count = toolbar.querySelector("#achievementDeckCount");
    if (count) { const nextCount = unlockedCount + " / " + cards.length + " UNLOCKED"; if (count.textContent !== nextCount) count.textContent = nextCount; }

    toolbar.querySelectorAll("button[data-filter]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === filterMode));
    });
    cards.forEach(card => {
      const visible = filterMode === "all" || card.dataset.deckState === filterMode;
      card.hidden = !visible;
    });
  }

  function init() {
    const root = document.querySelector(ROOT);
    if (!root) return;
    refresh(root);
    const observer = new MutationObserver(() => refresh(root));
    observer.observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();