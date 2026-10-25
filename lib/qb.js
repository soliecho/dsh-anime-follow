import { requestText } from "./net.js";

function toForm(values) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export class QBittorrent {
  constructor(options = {}) {
    this.base = String(options.url || "http://127.0.0.1:8080").replace(/\/+$/, "");
    this.username = options.username || "";
    this.password = options.password || "";
    this.cookie = "";
    this.version = "";
  }

  async request(path, { method = "GET", form, retry = true } = {}) {
    const body = form !== undefined ? toForm(form) : undefined;
    const res = await requestText(`${this.base}${path}`, {
      method,
      proxy: "",
      timeoutMs: 20000,
      headers: {
        accept: "application/json, text/plain, */*",
        referer: this.base,
        origin: this.base,
        ...(this.cookie ? { cookie: this.cookie } : {}),
        ...(body !== undefined ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      },
      body,
    });
    const setCookie = res.headers["set-cookie"];
    if (setCookie) {
      const list = Array.isArray(setCookie) ? setCookie : [setCookie];
      const sid = list.map((v) => String(v).split(";")[0]).find((v) => v.startsWith("SID="));
      if (sid) this.cookie = sid;
    }
    if (res.status === 403 && retry) {
      await this.login();
      return this.request(path, { method, form, retry: false });
    }
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`qBittorrent HTTP ${res.status} ${path}: ${res.text.slice(0, 200)}`);
    }
    return res;
  }

  async login() {
    const form = toForm({ username: this.username, password: this.password });
    const res = await requestText(`${this.base}/api/v2/auth/login`, {
      method: "POST",
      proxy: "",
      timeoutMs: 15000,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        referer: this.base,
        origin: this.base,
      },
      body: form,
    });
    const setCookie = res.headers["set-cookie"];
    if (setCookie) {
      const list = Array.isArray(setCookie) ? setCookie : [setCookie];
      const sid = list.map((v) => String(v).split(";")[0]).find((v) => v.startsWith("SID="));
      if (sid) this.cookie = sid;
    }
    if (res.status !== 200 || !/ok/i.test(res.text)) {
      throw new Error(`qBittorrent 登录失败（HTTP ${res.status}）。可在 qB 中开启“对本地主机跳过认证”，或在设置里填写账号密码。`);
    }
  }

  async appVersion() {
    const res = await this.request("/api/v2/app/version");
    this.version = res.text.trim();
    return this.version;
  }

  async preferences() {
    const res = await this.request("/api/v2/app/preferences");
    return JSON.parse(res.text);
  }

  async torrents() {
    const res = await this.request("/api/v2/torrents/info");
    return JSON.parse(res.text);
  }

  async torrent(hash) {
    const res = await this.request(`/api/v2/torrents/info?hashes=${encodeURIComponent(hash)}`);
    const list = JSON.parse(res.text);
    return list[0];
  }

  async files(hash) {
    const res = await this.request(`/api/v2/torrents/files?hash=${encodeURIComponent(hash)}`);
    return JSON.parse(res.text);
  }

  async addMagnet({ magnet, savePath, category, tags, contentLayout = "NoSubfolder", paused = false }) {
    const form = {
      urls: magnet,
      savepath: savePath,
      category: category || "",
      tags: tags || "",
      autoTMM: "false",
      paused: paused ? "true" : "false",
      contentLayout,
    };
    const res = await this.request("/api/v2/torrents/add", { method: "POST", form });
    const text = String(res.text || "").trim();
    if (/^ok\.?$/i.test(text)) return true;
    try {
      const summary = JSON.parse(text);
      if (Array.isArray(summary.added_torrent_ids) && summary.added_torrent_ids.length > 0) return true;
      if (Number(summary.success_count) > 0 || Number(summary.pending_count) > 0) return true;
      if (Number(summary.failure_count) > 0) {
        throw new Error(`qBittorrent 拒绝添加: ${text.slice(0, 300)}`);
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        // Fall through to the generic error below.
      } else {
        throw err;
      }
    }
    throw new Error(`qBittorrent 添加失败: ${text.slice(0, 300)}`);
  }

  async renameFile(hash, oldPath, newPath) {
    const res = await this.request("/api/v2/torrents/renameFile", {
      method: "POST",
      form: { hash, oldPath, newPath },
    });
    if (res.status !== 200) throw new Error(`renameFile HTTP ${res.status}`);
    return true;
  }

  async renameTorrent(hash, name) {
    await this.request("/api/v2/torrents/rename", { method: "POST", form: { hash, name } });
  }

  async delete(hashes, deleteFiles = true) {
    await this.request("/api/v2/torrents/delete", {
      method: "POST",
      form: { hashes: Array.isArray(hashes) ? hashes.join("|") : hashes, deleteFiles: deleteFiles ? "true" : "false" },
    });
  }

  async createCategory(category, savePath) {
    try {
      await this.request("/api/v2/torrents/createCategory", {
        method: "POST",
        form: { category, savePath },
      });
    } catch (err) {
      if (!/already exists|409/i.test(String(err.message))) throw err;
    }
  }

  async setCategory(hashes, category) {
    await this.request("/api/v2/torrents/setCategory", {
      method: "POST",
      form: { hashes: Array.isArray(hashes) ? hashes.join("|") : hashes, category },
    });
  }

  async addTags(hashes, tags) {
    await this.request("/api/v2/torrents/addTags", {
      method: "POST",
      form: { hashes: Array.isArray(hashes) ? hashes.join("|") : hashes, tags },
    });
  }
}
