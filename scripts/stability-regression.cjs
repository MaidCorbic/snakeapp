"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const game = fs.readFileSync(path.join(root, "game.js"), "utf8");
const menu = fs.readFileSync(path.join(root, "menu.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function pass(name) {
  process.stdout.write("PASS  " + name + "\n");
}

function getFunction(source, name) {
  const marker = "function " + name + "(";
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, "Missing function: " + name);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("Unclosed function: " + name);
}

function runPersist({ stored = null, failRead = false, failWrite = false, win = false } = {}) {
  let saved = stored;
  let showSaveCalls = 0;
  const warnings = [];
  const sandbox = {
    localStorage: {
      getItem(key) {
        assert.equal(key, "snake-evolution-save");
        if (failRead) throw new Error("storage unavailable");
        return saved;
      },
      setItem(key, value) {
        assert.equal(key, "snake-evolution-save");
        if (failWrite) throw new Error("quota exceeded");
        saved = value;
      }
    },
    combo: 4,
    stats: { wardens: 2, elites: 1, supplyDrops: 3, contracts: 2 },
    evolution: () => 3,
    showSave: () => { showSaveCalls++; },
    console: { warn: (...args) => warnings.push(args) },
    Number,
    Math,
    JSON
  };
  vm.runInNewContext(getFunction(game, "persist"), sandbox);
  sandbox.persist(win);
  return { saved, showSaveCalls, warnings };
}

let result = runPersist({ stored: JSON.stringify({ runs: 2, wins: 1, combo: 5, wardens: 1, elites: 0, supplyDrops: 1, contracts: 0, evo: 2 }), win: true });
let record = JSON.parse(result.saved);
assert.equal(record.runs, 3);
assert.equal(record.wins, 2);
assert.equal(record.wardens, 3);
assert.equal(record.supplyDrops, 4);
assert.equal(record.evo, 3);
assert.equal(result.showSaveCalls, 1);
pass("run stats persist and accumulate correctly");

result = runPersist({ stored: "{invalid json" });
record = JSON.parse(result.saved);
assert.equal(record.runs, 1);
assert.equal(record.wins, 0);
pass("malformed saved JSON recovers to a fresh run record");

result = runPersist({ failRead: true });
assert.equal(result.showSaveCalls, 1);
assert.equal(JSON.parse(result.saved).runs, 1);
pass("storage read failure does not stop run finalization");

result = runPersist({ failWrite: true });
assert.equal(result.showSaveCalls, 1);
assert.equal(result.warnings.length, 1);
pass("storage quota/write failure does not stop result rendering");

assert.match(game, /function\s+move\s*\(/);
assert.match(game, /function\s+reset\s*\(/);
assert.match(game, /function\s+end\s*\(/);
assert.match(game, /function\s+win\s*\(/);
assert.match(game, /function\s+draw\s*\(/);
assert.match(game, /function\s+takeDamage\s*\(/);
pass("core movement, reset, collision damage, win and loss entry points exist");

for (const file of ["ultimate-gameplay-v1.js", "gameplay-update-v2.js", "arcade-polish-v1.js", "snake-rework-v2.js"]) {
  assert.ok(fs.existsSync(path.join(root, file)), "Missing gameplay layer: " + file);
  assert.ok(menu.includes(file), "Loader does not reference " + file);
}
assert.match(menu, /if\s*\(gameLoading\)\s*return/);
assert.match(menu, /if\s*\(bootFailed\)\s*return/);
assert.match(html, /meta-progression-v1\.js/);
pass("loader includes required gameplay layers and guards duplicate/failed boot");

process.stdout.write("\nStability regression checks passed.\n");
