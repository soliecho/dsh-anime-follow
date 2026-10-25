import path from "node:path";
import { spawn } from "node:child_process";
import { AnimeFollowEngine } from "./engine.js";
import { Bangumi } from "./bgm.js";

export const name = "anime-follow";
export const inject = ["webServer"];

const PREFIX = "/api/anime-follow";
const MAX_BODY = 1024 * 1024;

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("请求体过大"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function apply(ctx) {
  const engine = new AnimeFollowEngine();
  const bgm = new Bangumi({
    proxy: engine.config.proxy,
    cacheFile: path.join(path.dirname(engine.stateFile), "cache", "bgm.json"),
    log: (level, message) => engine.log(level, message),
  });
  let pollTimer;
  let reconcileTimer;
  let stopped = false;

  const schedulePoll = () => {
    if (stopped) return;
    clearTimeout(pollTimer);
    const minutes = Math.max(5, Number(engine.config.pollMinutes) || 20);
    pollTimer = setTimeout(async () => {
      try {
        await engine.pollAll();
      } catch (err) {
        engine.log("error", `自动轮询失败: ${err.message}`);
      } finally {
        schedulePoll();
      }
    }, minutes * 60 * 1000);
  };

  const scheduleReconcile = () => {
    if (stopped) return;
    clearTimeout(reconcileTimer);
    const seconds = Math.max(30, Number(engine.config.reconcileSeconds) || 60);
    reconcileTimer = setTimeout(async () => {
      try {
        await engine.reconcile();
      } catch (err) {
        engine.log("warn", `qB 状态同步失败: ${err.message}`);
      } finally {
        scheduleReconcile();
      }
    }, seconds * 1000);
  };

  const handler = async (req, res) => {
    if (req.method === "OPTIONS") {
      sendJson(res, 204, {});
      return;
    }
    try {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      const route = url.pathname.startsWith(PREFIX) ? url.pathname.slice(PREFIX.length) || "/" : url.pathname;
      if (req.method === "GET" && route === "/state") {
        sendJson(res, 200, engine.snapshot());
        return;
      }
      if (req.method === "GET" && route === "/settings") {
        sendJson(res, 200, engine.publicConfig());
        return;
      }
      if (req.method === "POST" && route === "/settings") {
        const body = JSON.parse((await readBody(req)) || "{}");
        const saved = await engine.updateConfig(body);
        bgm.setProxy(saved.proxy);
        schedulePoll();
        scheduleReconcile();
        sendJson(res, 200, { ok: true, config: saved });
        return;
      }
      if (req.method === "GET" && route === "/search") {
        const q = url.searchParams.get("q") || "";
        const rows = await engine.search(q);
        sendJson(res, 200, { rows });
        return;
      }
      if (req.method === "GET" && route === "/anime") {
        const title = url.searchParams.get("title") || "";
        const subjectId = url.searchParams.get("subjectId");
        const groups = await engine.animeGroups({ title, subjectId: subjectId ? Number(subjectId) : null });
        sendJson(res, 200, { groups });
        return;
      }
      if (req.method === "POST" && route === "/subscribe") {
        const body = JSON.parse((await readBody(req)) || "{}");
        const sub = await engine.subscribe(body);
        sendJson(res, 200, { ok: true, sub });
        return;
      }
      if (req.method === "POST" && route === "/unsubscribe") {
        const body = JSON.parse((await readBody(req)) || "{}");
        await engine.unsubscribe(body.id);
        sendJson(res, 200, { ok: true });
        return;
      }
      if (req.method === "POST" && route === "/check") {
        const body = JSON.parse((await readBody(req)) || "{}");
        if (body.id) {
          const sub = engine.findSubscription(body.id);
          if (!sub) throw new Error("订阅不存在");
          await engine.pollSubscription(sub, { reason: "手动检查" });
          await engine.reconcile();
        } else {
          await engine.pollAll();
        }
        sendJson(res, 200, { ok: true });
        return;
      }
      if (req.method === "GET" && route === "/subject-groups") {
        const subjectId = Number(url.searchParams.get("subjectId"));
        if (!subjectId) throw new Error("缺少条目 ID");
        const title = url.searchParams.get("title") || "";
        const groups = await engine.animeGroups({ title, subjectId });
        sendJson(res, 200, { groups });
        return;
      }
      if (req.method === "GET" && route === "/bgm/suggest") {
        const limit = Math.max(1, Math.min(20, Number(url.searchParams.get("limit")) || 10));
        const data = await bgm.trending(limit);
        sendJson(res, 200, data);
        return;
      }
      if (req.method === "GET" && route === "/bgm/subject") {
        const id = Number(url.searchParams.get("id"));
        if (!id) throw new Error("缺少条目 ID");
        const subject = await bgm.subject(id);
        sendJson(res, 200, { subject });
        return;
      }
      if (req.method === "POST" && route === "/bgm/subjects") {
        const body = JSON.parse((await readBody(req)) || "{}");
        const subjects = await bgm.subjects(body.ids || []);
        sendJson(res, 200, { subjects });
        return;
      }
      if (req.method === "POST" && route === "/open") {
        const body = JSON.parse((await readBody(req)) || "{}");
        if (!body.id || !body.episode) throw new Error("缺少订阅或集数");
        const result = engine.resolveEpisodeFile(body.id, body.episode);
        if (!result.ok) {
          sendJson(res, 409, { error: result.reason, state: result.state });
          return;
        }
        const root = path.resolve(engine.config.saveRoot);
        const target = path.resolve(result.file);
        const lowerTarget = target.toLowerCase();
        const lowerRoot = root.toLowerCase();
        if (lowerTarget !== lowerRoot && !lowerTarget.startsWith(lowerRoot + path.sep)) {
          throw new Error("文件不在保存根目录内，已拒绝打开");
        }
        // 交给系统默认关联打开，等同于在资源管理器里双击；用户装什么播放器都能用。
        const opener = spawn("explorer.exe", [target], { detached: true, stdio: "ignore", windowsHide: true });
        opener.unref();
        sendJson(res, 200, { ok: true, kind: result.kind, file: target });
        return;
      }
      if (req.method === "POST" && route === "/test") {
        const result = await engine.test();
        sendJson(res, 200, result);
        return;
      }
      if (req.method === "GET" && route === "/log") {
        sendJson(res, 200, { log: engine.state.log.slice(-200).reverse() });
        return;
      }
      sendJson(res, 404, { error: `unknown route ${route}` });
    } catch (err) {
      sendJson(res, 500, { error: err?.message || String(err) });
    }
  };

  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: "prefix",
      path: PREFIX,
      handler: (req, res) => {
        handler(req, res).catch((err) => {
          if (!res.headersSent) sendJson(res, 500, { error: err.message });
          else res.end();
        });
      },
    });
    return () => {
      dispose?.();
    };
  });

  ctx.effect(() => {
    void (async () => {
      await engine.init();
      if (stopped) return;
      schedulePoll();
      scheduleReconcile();
      if (engine.config.runOnStart) {
        setTimeout(() => {
          if (!stopped) engine.pollAll().catch((err) => engine.log("error", `启动轮询失败: ${err.message}`));
        }, 5000);
      }
    })();
    return () => {
      stopped = true;
      clearTimeout(pollTimer);
      clearTimeout(reconcileTimer);
      bgm.dispose();
      engine.dispose();
    };
  });
}
