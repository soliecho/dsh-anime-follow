import fs from "node:fs";
import path from "node:path";
import { requestText } from "./net.js";
import { ensureDir, readJson, writeJsonAtomic } from "./store.js";

const API = "https://api.bgm.tv";
// bangumi 要求 UA 带应用名（含个人 ID），见 https://github.com/bangumi/api/blob/master/docs-raw/user%20agent.md
const UA = "soliecho/dsh-anime-follow/0.1 (https://www.npmjs.com/package/@soliecho/dsh-anime-follow)";

const SUBJECT_TTL = 24 * 60 * 60 * 1000;
const TREND_TTL = 6 * 60 * 60 * 1000;
const TREND_DAYS = 180;
const TREND_LIMIT = 10;
const MIN_INTERVAL = 250;
const TIMEOUT = 12000;
const MAX_ENTRIES = 400;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function infoValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : item && (item.v || item.value) ? String(item.v || item.value) : ""))
      .filter(Boolean)
      .join(" / ");
  }
  if (value && typeof value === "object") return String(value.v || value.value || "");
  return value == null ? "" : String(value);
}

export function normalizeSubject(raw) {
  if (!raw || !raw.id) return null;
  const images = raw.images || {};
  const rating = raw.rating || {};
  return {
    id: Number(raw.id),
    name: raw.name || "",
    nameCn: raw.name_cn || "",
    summary: raw.summary || "",
    date: raw.date || "",
    platform: raw.platform || "",
    eps: Number(raw.eps) || 0,
    totalEpisodes: Number(raw.total_episodes) || 0,
    score: rating.score == null ? null : Number(rating.score),
    rank: rating.rank == null ? null : Number(rating.rank),
    ratingTotal: Number(rating.total) || 0,
    tags: Array.isArray(raw.tags)
      ? raw.tags.slice(0, 12).map((tag) => ({ name: tag.name, count: Number(tag.count) || 0 }))
      : [],
    infobox: Array.isArray(raw.infobox)
      ? raw.infobox
        .map((row) => ({ key: row.key || "", value: infoValue(row.value) }))
        .filter((row) => row.key && row.value)
        .slice(0, 16)
      : [],
    images: {
      small: images.small || "",
      grid: images.grid || images.medium || images.small || "",
      large: images.large || images.medium || "",
      medium: images.medium || "",
    },
    collection: raw.collection || null,
    url: `https://bgm.tv/subject/${raw.id}`,
    nsfw: Boolean(raw.nsfw),
  };
}

function normalizeTrendItem(raw) {
  return {
    id: Number(raw.id),
    title: raw.name_cn || raw.name || "",
    name: raw.name || "",
    date: raw.date || "",
    score: raw.rating?.score == null ? null : Number(raw.rating.score),
    image: raw.images?.grid || raw.images?.small || "",
  };
}

export class Bangumi {
  constructor(options = {}) {
    this.proxy = options.proxy || "";
    this.cacheFile = options.cacheFile || "";
    this.log = options.log || (() => {});
    this.memory = new Map();
    this.disk = null;
    this.dirty = false;
    this.saveTimer = null;
    this.lastRequestAt = 0;
    this.disposed = false;
  }

  setProxy(proxy) {
    const next = proxy || "";
    if (next !== this.proxy) this.proxy = next;
  }

  dispose() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.flush();
    this.disposed = true;
  }

  loadDisk() {
    if (this.disk) return this.disk;
    const raw = this.cacheFile ? readJson(this.cacheFile, {}) : {};
    const now = Date.now();
    const entries = [];
    for (const [key, value] of Object.entries(raw || {})) {
      if (!value || typeof value !== "object") continue;
      if (!Number.isFinite(value.at) || now - value.at > 7 * 24 * 60 * 60 * 1000) continue;
      entries.push([key, value]);
    }
    entries.sort((a, b) => b[1].at - a[1].at);
    this.disk = Object.fromEntries(entries.slice(0, MAX_ENTRIES));
    return this.disk;
  }

  get(key, ttl) {
    const now = Date.now();
    const hit = this.memory.get(key);
    if (hit && now - hit.at < ttl) return hit.value;
    const stored = this.loadDisk()[key];
    if (stored && now - stored.at < ttl) {
      this.memory.set(key, stored);
      return stored.value;
    }
    return null;
  }

  set(key, value) {
    const row = { at: Date.now(), value };
    this.memory.set(key, row);
    if (!this.cacheFile) return;
    const disk = this.loadDisk();
    disk[key] = row;
    this.dirty = true;
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.flush();
    }, 900);
  }

  flush() {
    if (!this.dirty || !this.cacheFile || this.disposed) {
      this.dirty = false;
      return;
    }
    try {
      ensureDir(path.dirname(this.cacheFile));
      writeJsonAtomic(this.cacheFile, this.loadDisk());
      this.dirty = false;
    } catch (err) {
      this.log("warn", `bgm 缓存写入失败: ${err.message}`);
    }
  }

  async gate() {
    const wait = this.lastRequestAt + MIN_INTERVAL - Date.now();
    if (wait > 0) await sleep(wait);
    this.lastRequestAt = Date.now();
  }

  async request(pathname, options = {}) {
    if (!this.proxy) throw new Error("未配置代理，bgm.tv 无法访问（设置 → 下载代理）");
    const { method = "GET", body } = options;
    const url = `${API}${pathname}`;
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.gate();
      try {
        const res = await requestText(url, {
          method,
          proxy: this.proxy,
          timeoutMs: TIMEOUT,
          headers: {
            "user-agent": UA,
            accept: "application/json",
            ...(body !== undefined ? { "content-type": "application/json" } : {}),
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        if (res.status === 404) {
          const err = new Error("bgm 条目不存在");
          err.code = 404;
          throw err;
        }
        if (res.status === 429) throw new Error("bgm 请求过于频繁");
        if (res.status < 200 || res.status >= 300) throw new Error(`bgm HTTP ${res.status}`);
        try {
          return JSON.parse(res.text);
        } catch {
          throw new Error("bgm 返回的不是 JSON");
        }
      } catch (err) {
        if (err.code === 404) throw err;
        lastError = err;
        if (attempt < 2) await sleep(700 * (attempt + 1));
      }
    }
    throw lastError;
  }

  async subject(id) {
    const num = Number(id);
    if (!Number.isFinite(num) || num <= 0) throw new Error("无效的条目 ID");
    const key = `s:${num}`;
    const cached = this.get(key, SUBJECT_TTL);
    if (cached) return cached;
    const raw = await this.request(`/v0/subjects/${num}`);
    const subject = normalizeSubject(raw);
    if (subject) this.set(key, subject);
    return subject;
  }

  async subjects(ids) {
    const unique = [...new Set((ids || []).map(Number).filter((id) => Number.isFinite(id) && id > 0))].slice(0, 30);
    const out = {};
    let cursor = 0;
    const worker = async () => {
      while (cursor < unique.length) {
        const id = unique[cursor];
        cursor += 1;
        const cached = this.get(`s:${id}`, SUBJECT_TTL);
        if (cached) {
          out[id] = cached;
          continue;
        }
        try {
          const subject = await this.subject(id);
          if (subject) out[id] = subject;
        } catch {
          // 单个条目失败不影响其它条目
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
    return out;
  }

  async trending(limit = TREND_LIMIT) {
    const size = Math.max(1, Math.min(20, Number(limit) || TREND_LIMIT));
    const key = `trend:${size}`;
    const cached = this.get(key, TREND_TTL);
    if (cached) return cached;

    const from = new Date(Date.now() - TREND_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    let items = [];
    let source = "heat";
    try {
      const json = await this.request(`/v0/search/subjects?limit=${size}`, {
        method: "POST",
        body: { keyword: "", sort: "heat", filter: { type: [2], air_date: [">=" + from] } },
      });
      items = (json.data || []).filter((item) => item && !item.nsfw).map(normalizeTrendItem);
    } catch (err) {
      this.log("warn", `bgm 近期注目失败，回退到每日放送: ${err.message}`);
      source = "calendar";
      const days = await this.request("/calendar");
      const flat = [];
      for (const day of days || []) {
        for (const item of day.items || []) {
          if (!item || item.nsfw) continue;
          const collection = item.collection || {};
          flat.push({
            item,
            weight: (Number(collection.doing) || 0) * 3 + (Number(collection.collect) || 0),
          });
        }
      }
      flat.sort((a, b) => b.weight - a.weight);
      const seen = new Set();
      for (const row of flat) {
        if (items.length >= size) break;
        if (seen.has(row.item.id)) continue;
        seen.add(row.item.id);
        items.push(normalizeTrendItem(row.item));
      }
    }
    items = items.filter((item) => item.id && item.title).slice(0, size);
    const value = { at: Date.now(), source, items };
    this.set(key, value);
    return value;
  }
}
