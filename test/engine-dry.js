import path from "node:path";
import { AnimeFollowEngine } from "../lib/engine.js";
import { DEFAULT_CONFIG, emptyState } from "../lib/store.js";

const root = path.resolve("test/tmp");
const engine = new AnimeFollowEngine({
  config: {
    ...DEFAULT_CONFIG,
    saveRoot: root,
    proxy: "http://127.0.0.1:7890",
    maxBackfill: 30,
    maxAddsPerPoll: 5,
  },
  state: emptyState(),
  configFile: path.join(root, "config.json"),
  stateFile: path.join(root, "state.json"),
});

const added = [];
engine.qb = {
  async torrents() { return []; },
  async files() { return []; },
  async addMagnet(input) { added.push(input); return true; },
  async createCategory() {},
  async appVersion() { return "stub"; },
  async renameFile() {},
  async renameTorrent() {},
  async delete() {},
};

const sub = await engine.subscribe({
  subjectId: 568244,
  title: "药屋少女的呢喃",
  group: "豌豆字幕组",
  season: 3,
  resolution: "1080p",
});
console.log("sub", sub?.id, sub?.title, sub?.group);

for (let i = 0; i < 30; i += 1) {
  await new Promise((r) => setTimeout(r, 1000));
  if (!engine.findSubscription(sub.id)?.backfilling) break;
}

const snap = engine.snapshot();
const row = snap.subscriptions[0];
console.log("known", row.known, "done", row.done, "missing", row.missing, "episodes", row.episodes.length);
console.log("added", added.length);
for (const a of added.slice(0, 5)) console.log("  ", a.savePath, "|", a.tags);
for (const e of row.episodes.slice(0, 8)) console.log("EP", e.season, e.episode, e.versionLabel, e.state);
console.log("log", snap.log.slice(0, 6).map((l) => `${l.level}: ${l.message}`));
