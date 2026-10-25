import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const HOME = os.homedir();
export const DSH_DIR = path.join(HOME, ".dsh");
export const CONFIG_FILE = path.join(DSH_DIR, "anime-follow.json");
export const STATE_DIR = path.join(DSH_DIR, "anime-follow");
export const STATE_FILE = path.join(STATE_DIR, "state.json");

export const DEFAULT_CONFIG = {
  qbUrl: "http://127.0.0.1:8080",
  qbUsername: "",
  qbPassword: "",
  saveRoot: path.join(HOME, "Videos", "ANIME"),
  category: "动画",
  proxy: "http://127.0.0.1:7890",
  playerPath: "",
  pollMinutes: 20,
  reconcileSeconds: 60,
  runOnStart: true,
  resolution: "1080p",
  maxAddsPerPoll: 3,
  maxBackfill: 24,
  allowBatch: false,
  replaceMode: "after_complete",
  language: {
    mode: "tolerant",
    allowDual: true,
    // 没有字幕组接手的新番常常只有 BAHA / ANi 等纯繁体资源，默认放行。
    allowTraditional: true,
    unknown: "accept",
    allow: ["简体", "简中", "简日", "简繁", "简英", "CHS", "GB"],
    deny: ["繁體", "繁体", "繁中", "繁日", "繁英", "BIG5", "CHT"],
    groupOverrides: {},
  },
  naming: {
    template: "{title} S{season:02}E{ep:02}{ver} [{group}][{resolution}][{lang}]",
  },
};

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

export function writeJsonAtomic(file, value) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

function mergeDeep(base, patch) {
  if (Array.isArray(base) || Array.isArray(patch)) return patch ?? base;
  if (typeof base !== "object" || base === null) return patch ?? base;
  if (typeof patch !== "object" || patch === null) return patch ?? base;
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    out[key] = key in base ? mergeDeep(base[key], value) : value;
  }
  return out;
}

export function loadConfig(file = CONFIG_FILE) {
  const loaded = readJson(file, {});
  const merged = mergeDeep(DEFAULT_CONFIG, loaded);
  if (!merged.naming || typeof merged.naming.template !== "string") {
    merged.naming = { ...DEFAULT_CONFIG.naming };
  }
  if (!merged.language || typeof merged.language !== "object") {
    merged.language = { ...DEFAULT_CONFIG.language };
  }
  merged.language.allow = Array.isArray(merged.language.allow) ? merged.language.allow : [];
  merged.language.deny = Array.isArray(merged.language.deny) ? merged.language.deny : [];
  merged.language.groupOverrides = merged.language.groupOverrides && typeof merged.language.groupOverrides === "object"
    ? merged.language.groupOverrides
    : {};
  merged.pollMinutes = clampNumber(merged.pollMinutes, 5, 1440, 20);
  merged.reconcileSeconds = clampNumber(merged.reconcileSeconds, 30, 3600, 60);
  merged.maxAddsPerPoll = clampNumber(merged.maxAddsPerPoll, 1, 20, 3);
  merged.maxBackfill = clampNumber(merged.maxBackfill, 1, 200, 24);
  return merged;
}

export function saveConfig(config, file = CONFIG_FILE) {
  writeJsonAtomic(file, config);
}

export function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function emptyState() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    subscriptions: [],
    log: [],
  };
}

export function loadState(file = STATE_FILE) {
  const state = readJson(file, null);
  if (!state || typeof state !== "object") return emptyState();
  if (!Array.isArray(state.subscriptions)) state.subscriptions = [];
  if (!Array.isArray(state.log)) state.log = [];
  return state;
}

export function saveState(state, file = STATE_FILE) {
  writeJsonAtomic(file, state);
}

export function safeName(input, max = 90) {
  const text = String(input ?? "")
    .replace(/[\u0000-\u001f<>:"/\\|?*]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .trim();
  const clipped = text.slice(0, max).replace(/^[.\s]+|[.\s]+$/g, "");
  return clipped || "未命名";
}

export function pad2(n) {
  const num = Number(n);
  return Number.isFinite(num) ? String(num).padStart(2, "0") : "01";
}
