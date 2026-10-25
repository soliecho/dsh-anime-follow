import { normalizeText, parseRelease } from "./parse.js";
import { safeName } from "./store.js";

const SIMPLIFIED_RE = /简体|简中|简日|简繁|简英|簡體|CHS|\bGB\b|[\[【]\s*简\s*[\]】]/i;
const TRADITIONAL_RE = /繁體|繁体|繁中|繁日|繁英|BIG5|CHT|正體|[\[【]\s*繁\s*[\]】]/i;

export function detectLanguageTag(title) {
  const text = normalizeText(title);
  if (/简日|簡日|CHS[_ ]?JPN|简日双语/i.test(text)) return "简日";
  if (/简繁|繁简|简繁日|CHS[_ ]?CHT/i.test(text)) return "简繁";
  if (/简英|CHS[_ ]?ENG/i.test(text)) return "简英";
  if (/简体|简中|簡體|CHS|\bGB\b/i.test(text)) return "简体";
  if (TRADITIONAL_RE.test(text)) return "繁体";
  return "未知";
}

/**
 * Decide whether a release title is an acceptable Chinese-subtitle release.
 * Returns { ok, tag, reason }. Rules are deliberately ordered and explainable.
 */
export function languageDecision(rawTitle, group, language = {}) {
  const text = normalizeText(rawTitle);
  const hasSimp = SIMPLIFIED_RE.test(text);
  const hasTrad = TRADITIONAL_RE.test(text);
  const tag = detectLanguageTag(text);
  const overrides = language.groupOverrides && typeof language.groupOverrides === "object"
    ? language.groupOverrides
    : {};
  const override = overrides[group];

  if (override === "deny") return { ok: false, tag, reason: "字幕组规则：排除" };
  if (override === "allow") return { ok: true, tag: tag === "未知" ? "简" : tag, reason: "字幕组规则：允许" };
  if (override === "dualScript") {
    if (hasSimp || hasTrad) return { ok: true, tag, reason: "字幕组规则：双语放行" };
    return { ok: false, tag, reason: "字幕组规则：未识别到中文" };
  }

  if (hasTrad && !hasSimp) {
    // 没有字幕组接手的新番往往只有 BAHA / ANi 等纯繁体资源，
    // 这类资源默认放行，可在设置里关闭。
    if (language.allowTraditional !== false) {
      return { ok: true, tag: "繁体", reason: "纯繁体（BAHA / ANi 等），已放行" };
    }
    return { ok: false, tag, reason: "仅繁体/CHT，排除" };
  }
  if (hasSimp && hasTrad) {
    const allowDual = language.allowDual !== false;
    return allowDual
      ? { ok: true, tag: tag === "未知" ? "简繁" : tag, reason: "简繁双语，含简体" }
      : { ok: false, tag, reason: "简繁双语，按严格规则排除" };
  }
  if (hasSimp) {
    return { ok: true, tag: tag === "未知" ? "简体" : tag, reason: "含简体标记" };
  }

  const unknown = language.unknown || "accept";
  if (language.mode === "strict" || unknown === "reject") {
    return { ok: false, tag, reason: "未识别到简体/简日标记" };
  }
  return { ok: true, tag: "简", reason: "无语言标记，按容错规则放行" };
}

export function resolutionWanted(candidate, wanted) {
  if (!wanted || wanted === "any") return true;
  const res = candidate.resolution || "";
  if (!res) return true;
  return res.toLowerCase() === String(wanted).toLowerCase();
}

export function resolutionScore(res) {
  const map = { "2160p": 4, "1440p": 3, "1080p": 2, "720p": 1, "480p": 0, "4k": 4, "8k": 5 };
  return map[String(res || "").toLowerCase()] ?? -1;
}

export function parseCandidate(resource, groupName) {
  const parsed = parseRelease(resource.title || "");
  const lang = languageDecision(resource.title || "", groupName || parsed.group, {});
  return { ...parsed, lang, resource };
}

/** 同一集里优先简体，繁体作为兜底。 */
export function languageRank(candidate) {
  const tag = candidate?.lang?.tag || detectLanguageTag(candidate?.raw || candidate?.resource?.title || "");
  return tag === "繁体" ? 0 : 1;
}

export function chooseBetter(a, b) {
  if (!a) return b;
  if (!b) return a;
  if ((b.versionRank || 0) !== (a.versionRank || 0)) return (b.versionRank || 0) > (a.versionRank || 0) ? b : a;
  const ar = resolutionScore(a.resolution);
  const br = resolutionScore(b.resolution);
  if (br !== ar) return br > ar ? b : a;
  const al = languageRank(a);
  const bl = languageRank(b);
  if (bl !== al) return bl > al ? b : a;
  const at = Date.parse(a.resource?.createdAt || 0);
  const bt = Date.parse(b.resource?.createdAt || 0);
  return bt > at ? b : a;
}

export function seasonEpisodeOffset(candidates) {
  const counts = new Map();
  for (const candidate of candidates) {
    const ep = Number(candidate.episode);
    const abs = Number(candidate.absoluteEpisode);
    if (!Number.isFinite(ep) || !Number.isFinite(abs) || abs <= ep) continue;
    const offset = abs - ep;
    counts.set(offset, (counts.get(offset) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
}

export function normalizeEpisodeNumber(candidate, offset) {
  const ep = Number(candidate.episode);
  if (!Number.isFinite(ep)) return ep;
  if (Number.isFinite(Number(candidate.absoluteEpisode)) && Number(candidate.absoluteEpisode) > ep) return ep;
  if (offset > 0 && ep > offset) return ep - offset;
  return ep;
}

export function renderName(template, fields) {
  const values = {
    title: fields.title || "未命名",
    season: String(fields.season ?? 1),
    "season:02": String(fields.season ?? 1).padStart(2, "0"),
    ep: String(fields.episode ?? 0),
    "ep:02": String(fields.episode ?? 0).padStart(2, "0"),
    ver: fields.versionLabel || "",
    group: fields.group || "未知字幕组",
    resolution: fields.resolution || "",
    lang: fields.lang || "简",
  };
  const raw = String(template || "{title} S{season:02}E{ep:02}{ver} [{group}]").replace(
    /\{(title|season|season:02|ep|ep:02|ver|group|resolution|lang)\}/g,
    (_m, key) => values[key] ?? "",
  );
  const compact = raw
    .replace(/\s+/g, " ")
    .replace(/\s*\[\s*\]/g, "")
    .replace(/\s*\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return safeName(compact, 160);
}
