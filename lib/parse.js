const RES_RE = /\b(2160|1440|1080|810|720|576|480)\s*[pP]\b|\b([48])\s*[kK]\b/;
const TAG_RE = /^(?:x26[45]|h\.?26[45]|avc|hevc|av1|10bit|8bit|hi10p|aac|flac|mp3|mp4|mkv|webm|ass|srt|chs|cht|jpsc|gb|big5|简繁|繁简|简日|繁日|简英|繁英|简体|繁体|内封|内嵌|外挂|字幕|合集|全集|修正|repack|proper|v\d+|bd|bdrip|hdtv|web-?dl|webrip|web|tv|fin|end|sp|ova|movie|剧场版)$/i;
const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };

export function normalizeText(input) {
  return String(input ?? "")
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTitle(input) {
  return normalizeText(input)
    .toLowerCase()
    .replace(/[\s_\-–—.:：·・,，!！?？'"“”‘’()[\]【】{}<>《》/\\|]+/g, "")
    .replace(/第[一二三四五六七八九十\d]+季/g, "")
    .replace(/\b(?:s|season)\s*\d{1,2}\b/g, "");
}

function parseSeasonInfo(text) {
  let m = /\bS(\d{1,2})\b(?!\s*E)/i.exec(text);
  if (m) return { season: Number(m[1]), explicit: true };
  m = /\bSeason\s*(\d{1,2})\b/i.exec(text);
  if (m) return { season: Number(m[1]), explicit: true };
  m = /第\s*([一二三四五六七八九十\d]{1,3})\s*季/.exec(text);
  if (m) {
    const raw = m[1];
    return { season: CN_NUM[raw] ?? Number(raw) ?? 1, explicit: true };
  }
  m = /\b(\d{1,2})(?:st|nd|rd|th)\s*Season\b/i.exec(text);
  if (m) return { season: Number(m[1]), explicit: true };
  return { season: 1, explicit: false };
}

export function extractAbsoluteEpisode(text) {
  const m = /[\[【]\s*\d{1,3}(?:\.5)?\s*[\(（]\s*(\d{1,3})(?:\.5)?\s*[\)）]/.exec(text);
  return m ? Number(m[1]) : undefined;
}

export function parseResolution(text) {
  const m = RES_RE.exec(text);
  if (!m) return "";
  if (m[1]) {
    const n = Number(m[1]);
    if (n >= 2160) return "2160p";
    if (n >= 1440) return "1440p";
    if (n >= 1080) return "1080p";
    if (n >= 720) return "720p";
    return `${n}p`;
  }
  if (m[2]) return `${m[2]}k`;
  return "";
}

export function parseVersion(text) {
  let best = { rank: 0, label: "" };
  const consider = (rank, label) => {
    if (rank > best.rank) best = { rank, label };
  };
  for (const m of text.matchAll(/\bv(\d{1,2})\b/gi)) {
    consider(100 + Number(m[1]) * 10, `v${Number(m[1])}`);
  }
  for (const m of text.matchAll(/\bREPACK\s*(\d{0,2})\b/gi)) {
    consider(50 + Number(m[1] || 1) * 5, `REPACK${m[1] || ""}`);
  }
  for (const m of text.matchAll(/\bPROPER\s*(\d{0,2})\b/gi)) {
    consider(50 + Number(m[1] || 1) * 5, `PROPER${m[1] || ""}`);
  }
  for (const m of text.matchAll(/修正版?/g)) {
    consider(45, "修正");
  }
  for (const m of text.matchAll(/\bVer\.?\s*(\d{1,2})\b/gi)) {
    consider(100 + Number(m[1]) * 10, `v${Number(m[1])}`);
  }
  return best;
}

function extractGroup(text) {
  const m = /^\s*[\[【]([^\]】]{1,50})[\]】]/.exec(text);
  if (!m) return "";
  const inner = m[1].trim();
  if (!inner || RES_RE.test(inner) || TAG_RE.test(inner)) return "";
  return inner;
}

function isTitleSegment(segment) {
  const s = segment.trim();
  if (!s) return false;
  if (RES_RE.test(s)) return false;
  if (TAG_RE.test(s)) return false;
  if (/^\d{1,3}(\.\d)?\s*(?:v\d+)?$/i.test(s)) return false;
  if (/^\d{1,3}\s*[-~]\s*\d{1,3}/.test(s)) return false;
  return /[\u3040-\u30ff\u3400-\u9fffA-Za-z]/.test(s);
}

function detectPack(text, season = 1) {
  const flags = [];
  let from;
  let to;
  let isPack = false;

  const multi = /\bS\s*(\d{1,2})\s*[+&/]\s*S\s*(\d{1,2})\b/i.exec(text);
  if (multi) {
    isPack = true;
    flags.push("multi-season");
  }

  if (!multi) {
    const range = /(^|[^\d])(\d{1,3}(?:\.5)?)\s*[-~～]\s*(\d{1,3}(?:\.5)?)(?=$|[^\d])/g;
    let m;
    while ((m = range.exec(text)) !== null) {
      const before = text.slice(Math.max(0, m.index - 6), m.index + m[1].length);
      if (/\bS\s*$/i.test(before) || /第\s*$/.test(before) || /季\s*$/.test(before)) continue;
      const a = Number(m[2]);
      const b = Number(m[3]);
      if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) continue;
      // "第三季 3 - 05" / "Season 3 - 05" is a season marker followed by an episode,
      // not the range 3-5. Require spaces around the dash for this guard so "01-12" still counts.
      if (a === season && /\s[-~～]\s/.test(m[0])) continue;
      if (b - a >= 2) {
        isPack = true;
        from = a;
        to = b;
        flags.push(`range:${a}-${b}`);
        break;
      }
    }
  }

  if (/全集|合集|总集编|总集篇|修正合集|\bBOX\b|TV全集|全\s*\d+\s*[集话話]|第[一二三四五六七八九十]+卷|\bVol(?:ume)?\.?\s*\d+\s*[-~]\s*\d+/i.test(text)) {
    isPack = true;
    flags.push("collection");
  }

  return { isPack, from, to, flags };
}

function extractEpisode(text, season) {
  const candidates = [];
  const push = (value, index) => {
    if (!Number.isFinite(value) || value < 0 || value > 999) return;
    if ([1080, 720, 480, 2160, 1920, 3840, 1440, 576, 810].includes(value)) return;
    if (value >= 1900 && value <= 2100) return;
    candidates.push({ value, index });
  };

  for (const m of text.matchAll(/\bS\d{1,2}E(\d{1,3}(?:\.\d)?)\b/gi)) {
    push(Number(m[1]), m.index);
  }
  for (const m of text.matchAll(/[\[【]\s*(?:EP?|E)?\s*(\d{1,3}(?:\.5)?)(?:\s*[vV]\d+)?(?:\s*[\(（]\s*\d{1,3}\s*[\)）])?\s*[\]】]/g)) {
    push(Number(m[1]), m.index);
  }
  for (const m of text.matchAll(/\bE(?:P)?\s*(\d{1,3}(?:\.5)?)\b/gi)) {
    push(Number(m[1]), m.index);
  }
  for (const m of text.matchAll(/第\s*(\d{1,3}(?:\.5)?)\s*[话話集]/g)) {
    push(Number(m[1]), m.index);
  }
  for (const m of text.matchAll(/\s[-–—]\s*(\d{1,3}(?:\.5)?)(?:\s*[vV]\d+)?(?=\s|[\[(（]|$)/g)) {
    push(Number(m[1]), m.index);
  }
  for (const m of text.matchAll(/(?:^|[\s\]】])(\d{1,3}(?:\.5)?)(?:\s*[vV]\d+)?\s*(?:END|FIN)?\s*(?:[\[(（]|$)/gi)) {
    push(Number(m[1]), m.index);
  }

  const filtered = candidates.filter((c) => {
    const before = text.slice(Math.max(0, c.index - 8), c.index);
    if (/(?:season|\bS)\s*$/i.test(before)) return false;
    if (/第\s*$/.test(before)) return false;
    return true;
  });
  if (!filtered.length) return undefined;
  filtered.sort((a, b) => a.index - b.index);
  // Prefer the last plausible number; titles end with the episode more often than not.
  return filtered[filtered.length - 1].value;
}

function extractTitle(text, group) {
  let work = text;
  if (group) {
    work = work.replace(/^\s*[\[【][^\]】]{1,50}[\]】]\s*/, "");
  }
  work = work.replace(/\.(?:mkv|mp4|avi|ts|webm|rmvb)$/i, "");

  const kept = [];
  for (const m of work.matchAll(/[\[【]([^\]】]*)[\]】]/g)) {
    if (isTitleSegment(m[1])) kept.push(m[1].trim());
  }
  // Un-bracketed text carries the real title in "Title - 04 [tags]" layouts;
  // bracket-only titles fall back to the first title-looking bracket.
  const plain = work.replace(/[\[【][^\]】]*[\]】]/g, " ").replace(/\s+/g, " ").trim();
  let title = plain && isTitleSegment(plain) ? plain : kept[0] || plain || work;

  title = title
    .replace(/^\s*[\[【][^\]】]*[\]】]\s*/, "")
    .replace(/\s+[-–—]\s*\d{1,3}(?:\.5)?(?:\s*[vV]\d+)?.*$/i, "")
    .replace(/\bS\d{1,2}E\d{1,3}(?:\.\d)?\b.*$/i, "")
    .replace(/\bS\d{1,2}\b(?!\s*E).*$/i, "")
    .replace(/\bSeason\s*\d{1,2}\b.*$/i, "")
    .replace(/第\s*[一二三四五六七八九十\d]{1,3}\s*季.*$/, "")
    .replace(/\s+\d{1,3}(?:\.5)?(?:\s*[vV]\d+)?\s*$/, "")
    .trim();

  const parts = title.split(/\s*\/\s*/).map((s) => s.trim()).filter(Boolean);
  const cjk = parts.find((p) => /[\u3400-\u9fff]/.test(p));
  if (cjk) title = cjk.replace(/[（(][^）)]*[）)]\s*$/, "").trim() || cjk;
  title = title.replace(/^[-\s_.]+|[-\s_.]+$/g, "").trim();
  return title || normalizeText(text).slice(0, 120);
}

/**
 * Parse a release title into the fields the policy engine needs.
 */
export function parseRelease(rawTitle) {
  const text = normalizeText(rawTitle);
  const group = extractGroup(text);
  const resolution = parseResolution(text);
  const seasonInfo = parseSeasonInfo(text);
  const season = seasonInfo.season;
  const pack = detectPack(text, season);
  const version = parseVersion(text);
  const episode = pack.isPack ? undefined : extractEpisode(text, season);
  const title = extractTitle(text, group);
  return {
    raw: text,
    group,
    title,
    titleKey: normalizeTitle(title),
    season,
    seasonExplicit: seasonInfo.explicit,
    episode,
    absoluteEpisode: extractAbsoluteEpisode(text),
    resolution,
    versionRank: version.rank,
    versionLabel: version.label,
    isPack: pack.isPack,
    packFrom: pack.from,
    packTo: pack.to,
    packFlags: pack.flags,
  };
}

export function formatEpisode(season, episode) {
  return `S${String(season || 1).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
}

export function episodeKey(season, episode) {
  return `${Number(season || 1)}-${Number(episode)}`;
}
