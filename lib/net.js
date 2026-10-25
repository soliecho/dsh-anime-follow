import http from "node:http";
import https from "node:https";
import tls from "node:tls";
import zlib from "node:zlib";

const agentCache = new Map();
const MAX_BODY = 24 * 1024 * 1024;

function isLoopbackHost(host) {
  const h = String(host || "").toLowerCase().replace(/^\[|\]$/g, "");
  return h === "localhost" || h === "::1" || h === "0.0.0.0" || /^127\./.test(h);
}

class ProxyAgent extends https.Agent {
  constructor(proxyUrl) {
    super({ keepAlive: true, maxSockets: 6 });
    this.proxy = new URL(proxyUrl);
    this.proxyAuth = this.proxy.username
      ? `Basic ${Buffer.from(`${decodeURIComponent(this.proxy.username)}:${decodeURIComponent(this.proxy.password)}`).toString("base64")}`
      : "";
  }

  createConnection(options, callback) {
    let settled = false;
    const done = (err, socket) => {
      if (settled) return;
      settled = true;
      callback(err, socket);
    };
    const targetHost = options.host;
    const targetPort = options.port || 443;
    const target = `${targetHost}:${targetPort}`;
    const connectReq = http.request({
      host: this.proxy.hostname,
      port: Number(this.proxy.port || (this.proxy.protocol === "https:" ? 443 : 80)),
      method: "CONNECT",
      path: target,
      headers: {
        Host: target,
        ...(this.proxyAuth ? { "Proxy-Authorization": this.proxyAuth } : {}),
      },
      agent: false,
      timeout: 20000,
    });
    connectReq.once("connect", (res, socket) => {
      if (res.statusCode !== 200) {
        socket.destroy();
        done(new Error(`proxy CONNECT failed: HTTP ${res.statusCode}`));
        return;
      }
      const tlsSocket = tls.connect(
        {
          socket,
          servername: options.servername || String(targetHost).replace(/^\[|\]$/g, ""),
        },
        () => done(null, tlsSocket),
      );
      tlsSocket.once("error", (err) => done(err));
      tlsSocket.once("close", () => {
        if (!settled) done(new Error("proxy TLS socket closed"));
      });
    });
    connectReq.once("timeout", () => connectReq.destroy(new Error("proxy connect timeout")));
    connectReq.once("error", (err) => done(err));
    connectReq.end();
  }
}

function proxyAgent(proxyUrl) {
  const key = String(proxyUrl);
  if (agentCache.has(key)) return agentCache.get(key);
  const agent = new ProxyAgent(key);
  agentCache.set(key, agent);
  return agent;
}

function decodeBody(buffer, encoding) {
  const enc = String(encoding || "").toLowerCase();
  try {
    if (enc.includes("br")) return zlib.brotliDecompressSync(buffer);
    if (enc.includes("gzip")) return zlib.gunzipSync(buffer);
    if (enc.includes("deflate")) return zlib.inflateSync(buffer);
  } catch {
    return buffer;
  }
  return buffer;
}

function normalizeHeaders(headers) {
  const out = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (value !== undefined && value !== null) out[key] = String(value);
  }
  return out;
}

/**
 * Small HTTPS client with explicit HTTP-proxy CONNECT support.
 * Returns { status, headers, text, url } and follows up to 5 redirects.
 */
export async function requestText(urlStr, options = {}) {
  const {
    method = "GET",
    headers = {},
    body,
    proxy = "",
    timeoutMs = 25000,
    redirects = 0,
  } = options;
  const url = new URL(urlStr);
  const useProxy = proxy && !isLoopbackHost(url.hostname);
  const isHttps = url.protocol === "https:";
  if (!isHttps && useProxy) {
    return requestViaHttpProxy(url, { ...options, method, headers, body, proxy });
  }
  const mod = isHttps ? https : http;
  const agent = isHttps && useProxy ? proxyAgent(proxy) : undefined;
  const requestHeaders = normalizeHeaders({
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 AnimeFollow/0.1",
    accept: "application/json, application/xml, text/xml, text/html, */*",
    "accept-encoding": "gzip, deflate, br",
    ...headers,
  });
  if (body !== undefined && requestHeaders["content-length"] === undefined) {
    requestHeaders["content-length"] = String(Buffer.byteLength(body));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (err, value) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(value);
    };
    const req = mod.request(
      url,
      { method, headers: requestHeaders, agent, timeout: timeoutMs },
      (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          if (redirects >= 5) return done(new Error("too many redirects"));
          const next = new URL(res.headers.location, url);
          const nextMethod = res.statusCode === 303 ? "GET" : method;
          requestText(next.href, {
            ...options,
            method: nextMethod,
            body: nextMethod === "GET" ? undefined : body,
            redirects: redirects + 1,
          }).then((value) => done(null, value), (err) => done(err));
          return;
        }
        const chunks = [];
        let size = 0;
        res.on("data", (chunk) => {
          size += chunk.length;
          if (size > MAX_BODY) {
            req.destroy(new Error(`response too large (>${MAX_BODY} bytes)`));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          const raw = Buffer.concat(chunks);
          done(null, {
            status: res.statusCode,
            headers: res.headers,
            text: decodeBody(raw, res.headers["content-encoding"]).toString("utf8"),
            url: url.href,
          });
        });
        res.on("error", (err) => done(err));
      },
    );
    req.on("timeout", () => req.destroy(new Error(`request timeout after ${timeoutMs}ms`)));
    req.on("error", (err) => done(err));
    if (body !== undefined) req.write(body);
    req.end();
  });
}

function requestViaHttpProxy(url, options) {
  const { method = "GET", headers = {}, body, proxy, timeoutMs = 25000 } = options;
  const p = new URL(proxy);
  const requestHeaders = normalizeHeaders({
    host: url.host,
    "user-agent": "Mozilla/5.0 AnimeFollow/0.1",
    accept: "*/*",
    ...headers,
  });
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: p.hostname,
        port: Number(p.port || 80),
        method,
        path: url.href,
        headers: requestHeaders,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            text: Buffer.concat(chunks).toString("utf8"),
            url: url.href,
          }),
        );
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("proxy request timeout")));
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

export async function requestJson(url, options = {}) {
  const res = await requestText(url, options);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`HTTP ${res.status} for ${url}: ${res.text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(res.text);
  } catch (err) {
    throw new Error(`invalid JSON from ${url}: ${err.message}`);
  }
}
