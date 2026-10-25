import fs from "node:fs";
import path from "node:path";
import { QBittorrent } from "./qb.js";
import { AnimeGarden } from "./source.js";
import {
  languageDecision,
  chooseBetter,
  renderName,
  resolutionWanted,
  seasonEpisodeOffset,
  normalizeEpisodeNumber,
} from "./rules.js";
import { normalizeTitle, episodeKey } from "./parse.js";
import {
  CONFIG_FILE,
  STATE_FILE,
  loadConfig,
  saveConfig,
  loadState,
  saveState,
  ensureDir,
  safeName,
  pad2,
  clampNumber,
} from "./store.js";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function btihFromMagnet(magnet) {
  const m = /xt=urn:btih:([a-zA-Z0-9]+)/.exec(String(magnet || ""));
  if (!m) return "";
  const raw = m[1];
  if (/^[0-9a-fA-F]{40}$/.test(raw)) return raw.toLowerCase();
  if (/^[A-Za-z2-7]{32}$/.test(raw)) {
    let bits = "";
    for (const ch of raw.toUpperCase()) {
      const idx = BASE32.indexOf(ch);
      if (idx < 0) return "";
      bits += idx.toString(2).padStart(5, "0");
    }
    let hex = "";
    for (let i = 0; i + 4 <= bits.length; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }
    return hex.slice(0, 40);
  }
  return raw.toLowerCase();
}

function sameGroup(a, b) {
  const norm = (v) => String(v || "").toLowerCase().replace(/[\s_\-–—·・]/g, "");
  return norm(a) === norm(b);
}

function isVideoFile(name) {
  return /\.(mkv|mp4|avi|ts|webm|m2ts|mov)$/i.test(String(name || ""));
}

export class AnimeFollowEngine {
  constructor(options = {}) {
    this.configFile = options.configFile || CONFIG_FILE;
    this.stateFile = options.stateFile || STATE_FILE;
    this.config = options.config || loadConfig(this.configFile);
    this.state = options.state || loadState(this.stateFile);
    this.qb = new QBittorrent({
      url: this.config.qbUrl,
      username: this.config.qbUsername,
      password: this.config.qbPassword,
    });
    this.source = new AnimeGarden({ proxy: this.config.proxy });
    this.polling = false;
    this.lastPollAt = this.state.lastPollAt || "";
    this.qbTorrents = [];
    this.qbVersion = "";
    this.qbError = "";
    this.sourceError = "";
    this.timers = [];
    this.disposed = false;
  }

  async init() {
    ensureDir(path.dirname(this.stateFile));
    try {
      this.qbVersion = await this.qb.appVersion();
      this.qbError = "";
      await this.qb.createCategory(this.config.category, this.config.saveRoot);
    } catch (err) {
      this.qbError = err.message;
      this.log("error", `qBittorrent 连接失败: ${err.message}`);
    }
    try {
      await this.source.ping();
      this.sourceError = "";
    } catch (err) {
      this.sourceError = err.message;
      this.log("error", `资源站连接失败: ${err.message}`);
    }
  }

  dispose() {
    this.disposed = true;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }

  save() {
    if (!this.disposed) saveState(this.state, this.stateFile);
  }

  saveConfig() {
    saveConfig(this.config, this.configFile);
  }

  log(level, message, data) {
    const row = { at: new Date().toISOString(), level, message, ...(data ? { data } : {}) };
    this.state.log.push(row);
    if (this.state.log.length > 400) this.state.log.splice(0, this.state.log.length - 400);
  }

  publicConfig() {
    const { qbPassword, ...rest } = this.config;
    return { ...rest, qbPasswordSet: Boolean(qbPassword) };
  }

  snapshot() {
    const subscriptions = this.state.subscriptions.map((sub) => {
      const episodes = Object.values(sub.episodes || {});
      const done = episodes.filter((e) => e.state !== "replaced" && (e.state === "done" || e.progress >= 1)).length;
      const known = sub.maxEpisode || episodes.reduce((max, e) => Math.max(max, Number(e.episode) || 0), 0);
      const missing = [];
      const pending = [];
      for (let ep = 1; ep <= known; ep += 1) {
        const completed = episodes.some((e) => Number(e.episode) === ep && e.state !== "replaced" && (e.state === "done" || e.progress >= 1));
        const present = episodes.some((e) => Number(e.episode) === ep && e.state !== "replaced");
        if (!completed) missing.push(ep);
        if (!present) pending.push(ep);
      }
      return {
        id: sub.id,
        subjectId: sub.subjectId,
        title: sub.title,
        group: sub.group,
        season: sub.season,
        resolution: sub.resolution,
        enabled: sub.enabled !== false,
        createdAt: sub.createdAt,
        lastPollAt: sub.lastPollAt,
        lastBackfillAt: sub.lastBackfillAt,
        known,
        done,
        missing,
        pending,
        backfilling: Boolean(sub.backfilling),
        episodes: episodes
          .sort((a, b) => (Number(a.season) - Number(b.season)) || (Number(a.episode) - Number(b.episode)))
          .map((e) => ({
            season: e.season,
            episode: e.episode,
            versionLabel: e.versionLabel,
            state: e.state,
            progress: e.progress,
            file: e.file,
            error: e.error,
          })),
      };
    });
    return {
      config: this.publicConfig(),
      subscriptions,
      status: {
        qbVersion: this.qbVersion,
        qbError: this.qbError,
        sourceError: this.sourceError,
        lastPollAt: this.lastPollAt,
        polling: this.polling,
        qbTorrents: this.qbTorrents.length,
      },
      log: this.state.log.slice(-80).reverse(),
    };
  }

  async updateConfig(patch) {
    const next = { ...this.config, ...patch };
    if (patch.language) next.language = { ...this.config.language, ...patch.language };
    if (patch.naming) next.naming = { ...this.config.naming, ...patch.naming };
    if (!patch.qbPassword && this.config.qbPassword) next.qbPassword = this.config.qbPassword;
    next.pollMinutes = clampNumber(next.pollMinutes, 5, 1440, 20);
    next.reconcileSeconds = clampNumber(next.reconcileSeconds, 30, 3600, 60);
    next.maxAddsPerPoll = clampNumber(next.maxAddsPerPoll, 1, 20, 3);
    next.maxBackfill = clampNumber(next.maxBackfill, 1, 200, 24);
    this.config = next;
    this.saveConfig();
    this.qb = new QBittorrent({
      url: this.config.qbUrl,
      username: this.config.qbUsername,
      password: this.config.qbPassword,
    });
    this.source = new AnimeGarden({ proxy: this.config.proxy });
    await this.init();
    return this.publicConfig();
  }

  async search(keyword) {
    return this.source.search(keyword);
  }

  async animeGroups({ title, subjectId }) {
    const groups = await this.source.groupsFor({ title, subjectId, pages: 4 });
    return groups.map((group) => {
      let compatible = 0;
      const samples = group.samples || [];
      for (const sample of samples) {
        if (languageDecision(sample, group.name, this.config.language).ok) compatible += 1;
      }
      return { ...group, compatible };
    });
  }

  findSubscription(id) {
    return this.state.subscriptions.find((sub) => sub.id === id);
  }

  async subscribe({ subjectId, title, group, season, resolution }) {
    if (!title || !group) throw new Error("缺少番名或字幕组");
    const key = subjectId ? `s:${subjectId}` : `t:${normalizeTitle(title)}`;
    const exists = this.state.subscriptions.find((sub) => (subjectId && Number(sub.subjectId) === Number(subjectId)) || sub.key === key);
    if (exists) throw new Error(`已订阅「${exists.title}」；请先退订再换字幕组`);

    const sub = {
      id: `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      key,
      subjectId: subjectId ? Number(subjectId) : null,
      title: String(title).trim(),
      titleKey: normalizeTitle(title),
      group: String(group).trim(),
      season: Number(season) || 1,
      resolution: resolution || this.config.resolution || "1080p",
      enabled: true,
      createdAt: new Date().toISOString(),
      lastPollAt: "",
      lastBackfillAt: "",
      backfilling: true,
      maxEpisode: 0,
      episodes: {},
    };
    this.state.subscriptions.push(sub);
    this.save();
    this.log("info", `订阅《${sub.title}》· ${sub.group}`);
    setTimeout(() => {
      this.backfill(sub.id).catch((err) => this.log("error", `补齐失败: ${err.message}`));
    }, 50);
    return this.snapshot().subscriptions.find((s) => s.id === sub.id);
  }

  async unsubscribe(id) {
    const index = this.state.subscriptions.findIndex((sub) => sub.id === id);
    if (index < 0) throw new Error("订阅不存在");
    const [sub] = this.state.subscriptions.splice(index, 1);
    this.save();
    this.log("info", `退订《${sub.title}》· ${sub.group}`);
    return true;
  }

  hasInfohash(hash) {
    const target = String(hash || "").toLowerCase();
    if (!target) return true;
    for (const sub of this.state.subscriptions) {
      for (const ep of Object.values(sub.episodes || {})) {
        if (String(ep.infohash || "").toLowerCase() === target) return true;
        if (String(ep.qbHash || "").toLowerCase() === target) return true;
      }
    }
    return this.qbTorrents.some((t) => String(t.hash || "").toLowerCase() === target);
  }

  acceptable(sub, candidate) {
    if (candidate.isPack && !this.config.allowBatch) return { ok: false, reason: "整包/合集，默认跳过" };
    if (candidate.episode === undefined && !candidate.isPack) return { ok: false, reason: "未解析出集号" };
    if (!sameGroup(candidate.groupName, sub.group)) return { ok: false, reason: `不是目标字幕组（${candidate.groupName}）` };
    if (sub.subjectId && candidate.resource?.subjectId && Number(candidate.resource.subjectId) !== Number(sub.subjectId)) {
      return { ok: false, reason: "subjectId 不匹配" };
    }
    const candidateSeason = Number(candidate.season) || 1;
    const wantedSeason = Number(sub.season) || 1;
    if (candidate.seasonExplicit && candidateSeason !== wantedSeason) {
      return { ok: false, reason: `季号 ${candidateSeason} 不是 ${wantedSeason}` };
    }
    if (!candidate.seasonExplicit && wantedSeason > 1) {
      const sid = candidate.resource?.subjectId;
      if (!sid || Number(sid) !== Number(sub.subjectId)) {
        return { ok: false, reason: "无季号且 subjectId 不匹配" };
      }
    }
    if (!sub.subjectId) {
      const a = normalizeTitle(candidate.title);
      const b = normalizeTitle(sub.title);
      if (a && b && !a.includes(b) && !b.includes(a)) return { ok: false, reason: "番名不匹配" };
    }
    const lang = languageDecision(candidate.raw, sub.group, this.config.language);
    if (!lang.ok) return { ok: false, reason: lang.reason };
    if (!resolutionWanted(candidate, sub.resolution)) {
      return { ok: false, reason: `分辨率 ${candidate.resolution} 不是 ${sub.resolution}` };
    }
    return { ok: true, lang };
  }

  savePathFor(sub) {
    return path.join(this.config.saveRoot, safeName(sub.title), `Season ${pad2(sub.season)}`);
  }

  async addCandidate(sub, candidate, { reason = "" } = {}) {
    const magnet = candidate.resource?.magnet;
    if (!magnet) return { added: false, reason: "没有磁力链接" };
    const hash = btihFromMagnet(magnet);
    if (!hash) return { added: false, reason: "无法解析 infohash" };
    if (this.hasInfohash(hash)) return { added: false, reason: "已存在（infohash 查重）" };

    const season = Number(sub.season) || Number(candidate.season) || 1;
    const episode = Number(candidate.episode);
    if (!Number.isFinite(episode)) return { added: false, reason: "集号无效" };
    const key = episodeKey(season, episode);
    const previous = sub.episodes[key];
    if (previous && (previous.versionRank || 0) >= (candidate.versionRank || 0)) {
      return { added: false, reason: `已有同集 ${previous.versionLabel || "原版"}（版本不低）` };
    }

    const savePath = this.savePathFor(sub);
    const tags = [
      "anime-follow",
      `anime:${sub.subjectId || sub.id}`,
      `ep:${episode}`,
      `ver:${candidate.versionRank || 0}`,
    ].join(",");

    try {
      await this.qb.addMagnet({
        magnet,
        savePath,
        category: this.config.category,
        tags,
        contentLayout: "NoSubfolder",
      });
    } catch (err) {
      // Older qB builds may reject contentLayout; retry with the default layout.
      try {
        await this.qb.addMagnet({
          magnet,
          savePath,
          category: this.config.category,
          tags,
          contentLayout: "Original",
        });
      } catch (second) {
        throw new Error(`qB 添加失败: ${second.message}`);
      }
    }

    const entry = {
      season,
      episode,
      versionRank: candidate.versionRank || 0,
      versionLabel: candidate.versionLabel || "",
      title: candidate.raw,
      infohash: hash,
      qbHash: hash,
      group: sub.group,
      resolution: candidate.resolution || "",
      lang: this.acceptable(sub, candidate).lang?.tag || "简",
      state: "queued",
      progress: 0,
      file: "",
      renamed: false,
      addedAt: new Date().toISOString(),
      error: "",
    };
    if (previous) {
      previous.supersededBy = hash;
      previous.supersededAt = new Date().toISOString();
      entry.replaces = previous.infohash || previous.qbHash || "";
    }
    sub.episodes[key] = entry;
    sub.maxEpisode = Math.max(sub.maxEpisode || 0, episode);
    this.save();
    this.log("info", `添加 EP${episode}${entry.versionLabel ? " " + entry.versionLabel : ""} · ${sub.title} · ${sub.group}`, { reason });
    return { added: true, hash };
  }

  async backfill(id) {
    const sub = this.findSubscription(id);
    if (!sub) return;
    sub.backfilling = true;
    this.save();
    try {
      await this.reconcile();
      const candidates = await this.source.candidatesForSubscription(sub, 4);
      const accepted = [];
      for (const candidate of candidates) {
        const check = this.acceptable(sub, candidate);
        if (!check.ok) continue;
        if (candidate.episode === undefined) continue;
        accepted.push(candidate);
      }
      const offset = seasonEpisodeOffset(accepted);
      const byEpisode = new Map();
      for (const candidate of accepted) {
        const ep = normalizeEpisodeNumber(candidate, offset);
        if (!Number.isFinite(ep)) continue;
        const normalized = { ...candidate, episode: ep };
        const current = byEpisode.get(ep);
        byEpisode.set(ep, chooseBetter(current, normalized));
      }
      let added = 0;
      for (const ep of [...byEpisode.keys()].sort((a, b) => a - b)) {
        const candidate = byEpisode.get(ep);
        const key = episodeKey(sub.season, ep);
        const existing = sub.episodes[key];
        if (existing && (existing.versionRank || 0) >= (candidate.versionRank || 0)) continue;
        if (added >= this.config.maxBackfill) break;
        try {
          const result = await this.addCandidate(sub, candidate, { reason: "补齐" });
          if (result.added) added += 1;
        } catch (err) {
          this.log("error", `补齐 EP${ep} 失败: ${err.message}`);
        }
      }
      sub.lastBackfillAt = new Date().toISOString();
      sub.lastPollAt = new Date().toISOString();
      this.log("info", `补齐完成：${sub.title}，新增 ${added} 集`);
    } catch (err) {
      sub.lastError = err.message;
      this.log("error", `补齐失败: ${err.message}`);
    } finally {
      sub.backfilling = false;
      this.save();
    }
  }

  async pollSubscription(sub, { reason = "轮询" } = {}) {
    const candidates = await this.source.recentForSubscription(sub, { pages: 2 });
    const cutoff = Date.parse(sub.lastPollAt || 0) - 12 * 60 * 60 * 1000;
    const accepted = [];
    for (const candidate of candidates) {
      const check = this.acceptable(sub, candidate);
      if (!check.ok) continue;
      if (candidate.episode === undefined) continue;
      const created = Date.parse(candidate.resource?.createdAt || 0);
      if (Number.isFinite(created) && created < cutoff) continue;
      accepted.push(candidate);
    }
    const offset = seasonEpisodeOffset(accepted);
    const byEpisode = new Map();
    for (const candidate of accepted) {
      const ep = normalizeEpisodeNumber(candidate, offset);
      if (!Number.isFinite(ep)) continue;
      const normalized = { ...candidate, episode: ep };
      byEpisode.set(ep, chooseBetter(byEpisode.get(ep), normalized));
    }
    let added = 0;
    for (const ep of [...byEpisode.keys()].sort((a, b) => a - b)) {
      if (added >= this.config.maxAddsPerPoll) break;
      const candidate = byEpisode.get(ep);
      const key = episodeKey(sub.season, ep);
      const existing = sub.episodes[key];
      if (existing && (existing.versionRank || 0) >= (candidate.versionRank || 0)) continue;
      try {
        const result = await this.addCandidate(sub, candidate, { reason });
        if (result.added) added += 1;
      } catch (err) {
        this.log("error", `EP${ep} 添加失败: ${err.message}`);
      }
    }
    sub.lastPollAt = new Date().toISOString();
    this.save();
    return added;
  }

  async pollAll() {
    if (this.polling) return { skipped: true };
    this.polling = true;
    this.save();
    let added = 0;
    try {
      await this.reconcile();
      for (const sub of this.state.subscriptions) {
        if (sub.enabled === false) continue;
        try {
          added += await this.pollSubscription(sub);
        } catch (err) {
          sub.lastError = err.message;
          this.log("error", `轮询《${sub.title}》失败: ${err.message}`);
        }
      }
      this.lastPollAt = new Date().toISOString();
      this.state.lastPollAt = this.lastPollAt;
      this.save();
    } finally {
      this.polling = false;
      this.save();
    }
    return { added, at: this.lastPollAt };
  }

  async reconcile() {
    let torrents;
    try {
      torrents = await this.qb.torrents();
      this.qbError = "";
    } catch (err) {
      this.qbError = err.message;
      return;
    }
    this.qbTorrents = torrents;
    const map = new Map(torrents.map((t) => [String(t.hash || "").toLowerCase(), t]));
    let changed = false;
    for (const sub of this.state.subscriptions) {
      for (const [key, ep] of Object.entries(sub.episodes || {})) {
        const torrent = map.get(String(ep.qbHash || ep.infohash || "").toLowerCase());
        if (!torrent) {
          if (ep.state === "queued" || ep.state === "downloading") {
            ep.state = "missing";
            ep.error = "qB 中找不到任务";
            changed = true;
          }
          continue;
        }
        const progress = Number(torrent.progress || 0);
        ep.progress = progress;
        ep.state = progress >= 1 ? "done" : "downloading";
        ep.qbState = torrent.state;
        ep.savePath = torrent.save_path;
        if (progress >= 1 && !ep.renamed) {
          try {
            const renamed = await this.renameEpisode(sub, key, ep, torrent);
            if (renamed) changed = true;
          } catch (err) {
            ep.error = `重命名失败: ${err.message}`;
            this.log("warn", `重命名 EP${ep.episode} 失败: ${err.message}`);
          }
        }
        if (ep.supersededBy && progress >= 1) {
          const newEp = Object.values(sub.episodes).find((x) => x.infohash === ep.supersededBy || x.qbHash === ep.supersededBy);
          if (newEp && (newEp.progress || 0) >= 1) {
            try {
              await this.qb.delete([ep.qbHash || ep.infohash], true);
              ep.state = "replaced";
              ep.file = "";
              changed = true;
              this.log("info", `已用新版本替换 EP${ep.episode}（旧文件删除）`);
            } catch (err) {
              this.log("warn", `删除旧版本 EP${ep.episode} 失败: ${err.message}`);
            }
          }
        }
        if (changed) this.save();
      }
    }
    if (changed) this.save();
  }

  filenameFor(sub, ep) {
    return renderName(this.config.naming.template, {
      title: sub.title,
      season: sub.season,
      episode: ep.episode,
      versionLabel: ep.versionLabel,
      group: sub.group,
      resolution: ep.resolution || sub.resolution,
      lang: ep.lang || "简",
    });
  }

  async renameEpisode(sub, key, ep, torrent) {
    const files = await this.qb.files(ep.qbHash || ep.infohash);
    const videos = files.filter((f) => isVideoFile(f.name));
    if (videos.length !== 1) {
      // Batch packs: rename the folder, leave inner episode files alone for now.
      if (videos.length > 1) {
        const folder = this.filenameFor(sub, ep);
        try {
          await this.qb.renameTorrent(ep.qbHash || ep.infohash, folder);
          ep.renamed = true;
          ep.file = path.join(torrent.save_path || "", folder);
          this.save();
          return true;
        } catch (err) {
          ep.error = `合集目录重命名失败: ${err.message}`;
          return false;
        }
      }
      return false;
    }
    const file = videos[0];
    const oldName = file.name;
    const ext = (oldName.match(/\.[a-z0-9]{2,5}$/i) || [""])[0];
    const base = this.filenameFor(sub, ep);
    const newName = base.toLowerCase().endsWith(ext.toLowerCase()) ? base : `${base}${ext}`;
    if (oldName === newName) {
      ep.renamed = true;
      ep.file = path.join(torrent.save_path || "", newName);
      this.save();
      return false;
    }
    await this.qb.renameFile(ep.qbHash || ep.infohash, oldName, newName);
    ep.renamed = true;
    ep.file = path.join(torrent.save_path || "", newName);
    this.log("info", `重命名 EP${ep.episode}: ${newName}`);
    this.save();
    return true;
  }

  /** PotPlayer 路径：优先用设置里的，留空时在常见安装位置里找。 */
  playerPath() {
    const configured = String(this.config.playerPath || "").trim().replace(/^"|"$/g, "");
    if (configured && fs.existsSync(configured)) return configured;
    const roots = [process.env.ProgramFiles, process.env["ProgramFiles(x86)"], process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Programs") : ""]
      .filter(Boolean);
    const names = [
      path.join("DAUM", "PotPlayer", "PotPlayerMini64.exe"),
      path.join("DAUM", "PotPlayer", "PotPlayerMini.exe"),
      path.join("PotPlayer", "PotPlayerMini64.exe"),
    ];
    for (const root of roots) {
      for (const name of names) {
        const candidate = path.join(root, name);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
    return "";
  }

  /**
   * 找到某一集可播放的位置：优先使用已经重命名好的文件，
   * 找不到时按命名模板在季目录里反查，避免旧记录没有 file 字段。
   */
  resolveEpisodeFile(id, episode) {
    const sub = this.findSubscription(id);
    if (!sub) return { ok: false, reason: "订阅不存在", state: "none" };
    const num = Number(episode);
    const records = Object.values(sub.episodes || {})
      .filter((ep) => Number(ep.episode) === num && ep.state !== "replaced")
      .sort((a, b) => (Number(b.progress) || 0) - (Number(a.progress) || 0));
    const ep = records[0];
    if (!ep) return { ok: false, reason: "这一集还没有更新", state: "none" };
    const done = ep.state === "done" || Number(ep.progress) >= 1;
    if (!done) {
      const pct = Math.round((Number(ep.progress) || 0) * 100);
      const reason = ep.state === "missing"
        ? "任务已丢失，可点「立即检查」重试"
        : ep.state === "queued"
          ? "已加入 qB，还没开始下载"
          : `下载中（${pct}%）`;
      return { ok: false, reason, state: ep.state || "downloading" };
    }

    const seasonDir = this.savePathFor(sub);
    if (ep.file) {
      const candidate = path.isAbsolute(ep.file) ? ep.file : path.join(ep.savePath || seasonDir, ep.file);
      if (fs.existsSync(candidate)) {
        const stat = fs.statSync(candidate);
        return { ok: true, file: path.resolve(candidate), kind: stat.isDirectory() ? "dir" : "file", state: "done" };
      }
    }

    const dirs = [...new Set([ep.savePath, seasonDir].filter(Boolean))];
    const base = this.filenameFor(sub, ep).toLowerCase();
    const token = new RegExp(`[\\s._\\-\\[]e0*${num}(?!\\d)`, "i");
    for (const dir of dirs) {
      try {
        const videos = fs.readdirSync(dir, { withFileTypes: true })
          .filter((item) => item.isFile() && isVideoFile(item.name));
        const hit = videos.find((item) => item.name.toLowerCase().startsWith(base))
          || videos.find((item) => token.test(item.name));
        if (hit) {
          return { ok: true, file: path.resolve(path.join(dir, hit.name)), kind: "file", state: "done" };
        }
      } catch {
        // 目录不存在或不可读，继续尝试下一个
      }
    }
    return { ok: false, reason: "文件不存在，可能已被移动或删除", state: "done" };
  }

  async test() {
    const out = { qb: null, source: null, proxy: this.config.proxy };
    try {
      out.qb = { version: await this.qb.appVersion(), ok: true };
      await this.qb.createCategory(this.config.category, this.config.saveRoot);
    } catch (err) {
      out.qb = { ok: false, error: err.message };
    }
    try {
      await this.source.ping();
      out.source = { ok: true };
    } catch (err) {
      out.source = { ok: false, error: err.message };
    }
    return out;
  }
}
