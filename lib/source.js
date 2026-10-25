import { requestText } from "./net.js";
import { parseRelease, normalizeTitle } from "./parse.js";
import { detectLanguageTag, seasonEpisodeOffset } from "./rules.js";

const BASE = "https://api.animes.garden";

export class AnimeGarden {
  constructor(options = {}) {
    this.proxy = options.proxy || "";
    this.timeoutMs = options.timeoutMs || 25000;
    this.cache = new Map();
  }

  async request(path, { method = "GET", body } = {}) {
    const url = `${BASE}${path}`;
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const res = await requestText(url, {
          method,
          proxy: this.proxy,
          timeoutMs: this.timeoutMs,
          headers: {
            accept: "application/json",
            ...(body !== undefined ? { "content-type": "application/json" } : {}),
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        if (res.status < 200 || res.status >= 300) {
          throw new Error(`AnimeGarden HTTP ${res.status}: ${res.text.slice(0, 200)}`);
        }
        try {
          return JSON.parse(res.text);
        } catch (err) {
          throw new Error(`AnimeGarden returned invalid JSON: ${err.message}`);
        }
      } catch (err) {
        lastError = err;
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
      }
    }
    throw lastError;
  }

  async ping() {
    const json = await this.request("/resources?pageSize=1");
    return json?.status === "OK";
  }

  async search(keyword) {
    const q = String(keyword || "").trim();
    if (!q) return [];
    const json = await this.request(`/resources?type=${encodeURIComponent("动画")}&pageSize=100`, {
      method: "POST",
      body: { include: [q] },
    });
    return this.groupSearchResults(json.resources || []);
  }

  groupSearchResults(resources) {
    const map = new Map();
    for (const item of resources) {
      if (!item || !item.title) continue;
      if (item.type && item.type !== "动画") continue;
      const parsed = parseRelease(item.title);
      const key = item.subjectId ? `s:${item.subjectId}` : `t:${parsed.titleKey}`;
      let row = map.get(key);
      if (!row) {
        row = {
          key,
          subjectId: item.subjectId ?? null,
          title: parsed.title,
          titleRaw: item.title,
          latestAt: item.createdAt || "",
          count: 0,
          groups: new Map(),
          seasons: new Map(),
        };
        map.set(key, row);
      }
      row.count += 1;
      if (item.createdAt && item.createdAt > row.latestAt) row.latestAt = item.createdAt;
      if (this.isChineseTitle(parsed.title) && !this.isChineseTitle(row.title)) row.title = parsed.title;
      if (parsed.season) row.seasons.set(parsed.season, (row.seasons.get(parsed.season) || 0) + 1);
      const groupName = item.fansub?.name || item.publisher?.name || parsed.group || "未知字幕组";
      let group = row.groups.get(groupName);
      if (!group) {
        group = {
          name: groupName,
          count: 0,
          latestAt: "",
          episodes: new Set(),
          languages: new Map(),
          resolutions: new Map(),
          samples: [],
          sample: item.title,
        };
        row.groups.set(groupName, group);
      }
      group.count += 1;
      if (group.samples.length < 12) group.samples.push(item.title);
      if (item.createdAt && item.createdAt > group.latestAt) group.latestAt = item.createdAt;
      if (parsed.episode !== undefined) group.episodes.add(parsed.episode);
      const tag = detectLanguageTag(item.title);
      group.languages.set(tag, (group.languages.get(tag) || 0) + 1);
      if (parsed.resolution) group.resolutions.set(parsed.resolution, (group.resolutions.get(parsed.resolution) || 0) + 1);
    }

    const rows = [...map.values()].map((row) => ({
      key: row.key,
      subjectId: row.subjectId,
      title: row.title,
      titleRaw: row.titleRaw,
      latestAt: row.latestAt,
      count: row.count,
      season: [...row.seasons.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 1,
      groups: [...row.groups.values()]
        .map((group) => ({
          name: group.name,
          count: group.count,
          latestAt: group.latestAt,
          episodeCount: group.episodes.size,
          latestEpisode: group.episodes.size ? Math.max(...group.episodes) : null,
          langTag: [...group.languages.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "未知",
          resolution: [...group.resolutions.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "",
          sample: group.sample,
          samples: group.samples || [],
        }))
        .sort((a, b) => b.count - a.count || String(b.latestAt).localeCompare(String(a.latestAt))),
    }));
    rows.sort((a, b) => b.count - a.count || String(b.latestAt).localeCompare(String(a.latestAt)));
    return rows.slice(0, 20);
  }

  isChineseTitle(text) {
    return /[\u3400-\u9fff]/.test(String(text || ""));
  }

  async resourcesFor({ title, subjectId, fansub, pages = 6 }) {
    const out = [];
    const seen = new Set();
    const bySubject = Boolean(subjectId);
    for (let page = 1; page <= pages; page += 1) {
      const params = new URLSearchParams({
        type: "动画",
        pageSize: "100",
        page: String(page),
      });
      if (fansub) params.set("fansub", fansub);
      // 有 subjectId 时按条目精确取全部资源；不要再叠加标题关键词，
      // 否则「中文名 + 日文名」这类组合标题会把同条目的其它字幕组过滤掉。
      if (bySubject) params.set("subject", String(subjectId));
      const json = await this.request(`/resources?${params.toString()}`, {
        method: "POST",
        body: bySubject ? {} : { include: [title] },
      });
      const items = json.resources || [];
      for (const item of items) {
        if (!item || !item.title) continue;
        const id = item.id ?? `${item.provider}:${item.providerId}`;
        if (seen.has(id)) continue;
        seen.add(id);
        if (bySubject) {
          if (item.subjectId && Number(item.subjectId) !== Number(subjectId)) continue;
          out.push(item);
          continue;
        }
        const parsed = parseRelease(item.title);
        const a = normalizeTitle(parsed.title);
        const b = normalizeTitle(title);
        if (a && b && !a.includes(b) && !b.includes(a)) continue;
        out.push(item);
      }
      if (json.pagination?.complete || items.length === 0) break;
    }
    if (bySubject && out.length === 0) {
      // 老资源可能没有 subjectId，退回标题搜索。
      return this.resourcesFor({ title, fansub, pages });
    }
    return out;
  }

  async groupsFor({ title, subjectId, pages = 6 }) {
    const cacheKey = `${subjectId || ""}|${normalizeTitle(title)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.at < 5 * 60 * 1000) return cached.value;

    const resources = await this.resourcesFor({ title, subjectId, pages });
    const targetSeason = (() => {
      if (!subjectId) return 1;
      const counts = new Map();
      for (const item of resources) {
        if (!item.subjectId || Number(item.subjectId) !== Number(subjectId)) continue;
        const season = parseRelease(item.title).season || 1;
        counts.set(season, (counts.get(season) || 0) + 1);
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 1;
    })();
    const filtered = resources.filter((item) => {
      if (!subjectId) return true;
      if (item.subjectId) return Number(item.subjectId) === Number(subjectId);
      const parsed = parseRelease(item.title);
      if (parsed.seasonExplicit) return parsed.season === targetSeason;
      return targetSeason === 1;
    });
    const globalOffset = seasonEpisodeOffset(filtered.map((item) => parseRelease(item.title)));
    const groups = new Map();
    for (const item of filtered) {
      const parsed = parseRelease(item.title);
      if (parsed.isPack) continue;
      const groupName = item.fansub?.name || item.publisher?.name || parsed.group || "未知字幕组";
      let row = groups.get(groupName);
      if (!row) {
        row = {
          name: groupName,
          count: 0,
          episodes: new Set(),
          languages: new Map(),
          resolutions: new Map(),
          seasons: new Map(),
          latestAt: "",
          samples: [],
          sample: item.title,
        };
        groups.set(groupName, row);
      }
      row.count += 1;
      if (row.samples.length < 12) row.samples.push(item.title);
      if (item.createdAt && item.createdAt > row.latestAt) row.latestAt = item.createdAt;
      if (parsed.episode !== undefined) row.episodes.add(parsed.episode);
      if (parsed.season) row.seasons.set(parsed.season, (row.seasons.get(parsed.season) || 0) + 1);
      const tag = detectLanguageTag(item.title);
      row.languages.set(tag, (row.languages.get(tag) || 0) + 1);
      if (parsed.resolution) row.resolutions.set(parsed.resolution, (row.resolutions.get(parsed.resolution) || 0) + 1);
    }
    const value = [...groups.values()]
      .map((row) => {
        const offset = globalOffset || seasonEpisodeOffset((row.samples || []).map((title) => parseRelease(title)));
        const episodes = [...row.episodes]
          .map((ep) => (offset > 0 && ep > offset ? ep - offset : ep))
          .filter((ep, index, list) => list.indexOf(ep) === index)
          .sort((a, b) => a - b);
        return {
          name: row.name,
          count: row.count,
          episodeCount: episodes.length,
          latestEpisode: episodes.length ? episodes[episodes.length - 1] : null,
          episodes,
          langTag: [...row.languages.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "未知",
          resolution: [...row.resolutions.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "",
          season: targetSeason,
          latestAt: row.latestAt,
          sample: row.sample,
          samples: row.samples || [],
        };
      })
      .sort((a, b) => b.count - a.count || String(b.latestAt).localeCompare(String(a.latestAt)));
    this.cache.set(cacheKey, { at: Date.now(), value });
    return value;
  }

  async candidatesForSubscription(sub, pages = 4) {
    const resources = await this.resourcesFor({
      title: sub.title,
      subjectId: sub.subjectId,
      fansub: sub.group,
      pages,
    });
    return resources.map((item) => {
      const parsed = parseRelease(item.title);
      return { ...parsed, resource: item, groupName: item.fansub?.name || item.publisher?.name || parsed.group };
    });
  }

  async recentForSubscription(sub, { pages = 2 } = {}) {
    return this.candidatesForSubscription(sub, pages);
  }
}
