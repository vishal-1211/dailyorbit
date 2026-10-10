const { app, BrowserWindow, ipcMain, net, shell, nativeTheme, Menu, session, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { planWindow, DAY } = require('./plan');
const DEFAULT_SOURCES = require('./default-sources');

// ---------------------------------------------------------------------------
// Privacy: switch off Chromium background networking before anything starts.
// The app talks to the internet ONLY through the private "fetch" session below.
// ---------------------------------------------------------------------------
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-domain-reliability');
app.commandLine.appendSwitch('dns-prefetch-disable');
app.commandLine.appendSwitch('disable-features', 'Translate,MediaRouter,OptimizationHints,AutofillServerCommunication,NetworkTimeServiceQuerying,SpareRendererForSitePerProcess');
protocol.registerSchemesAsPrivileged([{ scheme: 'gzimg', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

// ---------------------------------------------------------------------------
// Storage (JSON files in the per-user app data folder)
// ---------------------------------------------------------------------------
const DATA = () => app.getPath('userData');
const CONFIG_FILE = () => path.join(DATA(), 'config.json');
const STATE_FILE = () => path.join(DATA(), 'state.json');
const EDITIONS_DIR = () => path.join(DATA(), 'editions');
const IMAGES_DIR = () => path.join(DATA(), 'images');
const LEARNING_FILE = () => path.join(DATA(), 'learning.json'); // the reading log and everything learned from it; never leaves this folder
const MAX_EDITIONS = 30;

const DEFAULT_SETTINGS = {
  windowDays: 7, maxPerSource: 10,
  topics: ['world', 'india', 'finance', 'tech', 'science', 'sports', 'astronomy', 'health', 'culture'], // topics in the "Everything" paper, theme: 'night', paperSize: 'm', readerSize: 'm',
  maxPages: 24,          // most pages a paper may have
  turnGestures: false,   // false = pages turn only with the arrow buttons / arrow keys
  readerContinuous: false, // reader: all pages of a story in one continuous two-page scroll
  proxyMode: 'off',   // 'off' (normal / system VPN) | 'tor' | 'custom'
  proxyUrl: '',       // for 'custom', e.g. socks5://127.0.0.1:1080
  warnOriginal: true, // warn before opening a story in the normal browser
  location: { name: 'Vadodara', lat: 22.3072, lon: 73.1812 } // used only for sky calculations on this laptop; never sent anywhere
};
const { migrateSources } = require('./migrate');
const embedder = require('./embedder');
// Pre-trained model files: beside the app in development, in the resources folder once installed.
const MODELS_DIR = () => (app.isPackaged ? path.join(process.resourcesPath, 'models') : path.join(__dirname, '..', 'models'));

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file); // atomic-ish: never leaves a half-written file
}

function cleanSource(s) {
  const out = {
    id: String(s.id || Math.random().toString(36).slice(2, 10)),
    name: String(s.name || s.url).slice(0, 80),
    url: String(s.url).trim(),
    enabled: !!s.enabled,
    topic: String(s.topic || 'astronomy').slice(0, 20),
    topicOnly: !!(s.topicOnly ?? s.astroOnly)
  };
  if (s.urlMatch) out.urlMatch = String(s.urlMatch).slice(0, 120);
  return out;
}

function getConfig() {
  const cfg = readJSON(CONFIG_FILE(), null);
  if (!cfg) {
    return { settings: { ...DEFAULT_SETTINGS }, sources: DEFAULT_SOURCES.map(s => ({ ...s })), seenDefaults: DEFAULT_SOURCES.map(s => s.id) };
  }
  const { sources, seenDefaults, changed } = migrateSources(cfg, DEFAULT_SOURCES, DEFAULT_SOURCES.MOVED);
  const out = { settings: { ...DEFAULT_SETTINGS, ...(cfg.settings || {}) }, sources, seenDefaults };
  if (changed) saveConfig(out);
  return out;
}
function saveConfig(cfg) {
  const clean = {
    settings: { ...DEFAULT_SETTINGS, ...(cfg.settings || {}) },
    sources: (cfg.sources || []).filter(s => s && s.url).map(cleanSource),
    seenDefaults: Array.isArray(cfg.seenDefaults) ? cfg.seenDefaults : DEFAULT_SOURCES.map(s => s.id)
  };
  writeJSON(CONFIG_FILE(), clean);
  return clean;
}

function getState() {
  // lastByKind: when each kind of paper ("all", "finance", "finance+sports"…) was last printed; seen is shared
  return { lastByKind: {}, editionCount: 0, seen: {}, ...readJSON(STATE_FILE(), {}) };
}

// ---------------------------------------------------------------------------
// Windows
// ---------------------------------------------------------------------------
let mainWin = null;
let sourcesWin = null;

const OVERLAY = {
  night: { color: '#0b0f1a', symbolColor: '#d8d2c2' },
  day: { color: '#f4efe4', symbolColor: '#1d1a16' }
};

function hardenContents(contents) {
  // The app's windows never navigate anywhere; links are opened only via the
  // explicit "Original" action (which the renderer confirms first).
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) e.preventDefault(); });
}

const webPrefs = () => ({
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
  spellcheck: false
});

function createMainWindow() {
  const theme = getConfig().settings.theme === 'day' ? 'day' : 'night';
  mainWin = new BrowserWindow({
    width: 1440, height: 940, minWidth: 960, minHeight: 640,
    backgroundColor: OVERLAY[theme].color,
    title: 'The Daily Orbit',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: { ...OVERLAY[theme], height: 44 },
    show: false,
    webPreferences: webPrefs()
  });
  hardenContents(mainWin.webContents);
  mainWin.once('ready-to-show', () => mainWin.show());
  mainWin.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWin.on('closed', () => { mainWin = null; });
}

function openSourcesWindow() {
  if (sourcesWin) { sourcesWin.focus(); return; }
  const theme = getConfig().settings.theme === 'day' ? 'day' : 'night';
  sourcesWin = new BrowserWindow({
    width: 860, height: 820, minWidth: 700, minHeight: 560,
    parent: mainWin || undefined,
    backgroundColor: OVERLAY[theme].color,
    title: 'Sources · The Daily Orbit',
    titleBarStyle: 'hidden',
    titleBarOverlay: { ...OVERLAY[theme], height: 44 },
    show: false,
    webPreferences: webPrefs()
  });
  hardenContents(sourcesWin.webContents);
  sourcesWin.once('ready-to-show', () => sourcesWin.show());
  sourcesWin.loadFile(path.join(__dirname, 'renderer', 'sources.html'));
  sourcesWin.on('closed', () => { sourcesWin = null; });
}

function applyTheme(theme) {
  const t = theme === 'day' ? 'day' : 'night';
  nativeTheme.themeSource = t === 'day' ? 'light' : 'dark';
  for (const w of [mainWin, sourcesWin]) {
    if (!w) continue;
    try { w.setTitleBarOverlay({ ...OVERLAY[t], height: 44 }); } catch { /* not supported on this OS */ }
    w.setBackgroundColor(OVERLAY[t].color);
  }
}

// ---------------------------------------------------------------------------
// Private network session
//   * in-memory only (nothing persists between app launches)
//   * no cookies sent or stored, no Referer/Origin, same generic Chrome signature
//     as millions of ordinary browsers
//   * optional Tor / custom proxy, fail-closed (never falls back to direct)
// ---------------------------------------------------------------------------
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const MAX_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
let netSes = null;

function setupNetSession() {
  netSes = session.fromPartition('gazette-fetch', { cache: false }); // no "persist:" prefix = memory only
  netSes.setUserAgent(UA, 'en-US,en');
  netSes.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
  netSes.webRequest.onBeforeSendHeaders((details, cb) => {
    const h = {};
    for (const [k, v] of Object.entries(details.requestHeaders)) {
      if (!/^(cookie|referer|origin|x-client-data|dnt|sec-ch-ua.*)$/i.test(k)) h[k] = v;
    }
    cb({ requestHeaders: h });
  });
  netSes.webRequest.onHeadersReceived((details, cb) => {
    const h = {};
    for (const [k, v] of Object.entries(details.responseHeaders || {})) if (!/^set-cookie2?$/i.test(k)) h[k] = v;
    cb({ responseHeaders: h });
  });
  return applyProxy(getConfig().settings);
}

const PROXY_RE = /^(socks5|socks4|http|https):\/\/[A-Za-z0-9.-]+:\d{1,5}$/;
async function applyProxy(settings) {
  if (!netSes) return;
  let cfg;
  if (settings.proxyMode === 'tor') {
    // Tor Browser listens on 9150, the Tor service on 9050. No "direct://" fallback.
    cfg = { mode: 'fixed_servers', proxyRules: 'socks5://127.0.0.1:9150,socks5://127.0.0.1:9050' };
  } else if (settings.proxyMode === 'custom' && PROXY_RE.test(settings.proxyUrl || '')) {
    cfg = { mode: 'fixed_servers', proxyRules: settings.proxyUrl };
  } else if (settings.proxyMode === 'custom') {
    cfg = { mode: 'fixed_servers', proxyRules: 'socks5://0.0.0.0:1' }; // invalid address: fail closed
  } else {
    cfg = { mode: 'system' }; // normal; a system-wide VPN applies automatically
  }
  await netSes.setProxy(cfg);
  await netSes.closeAllConnections();
}

function sesFetch(url, init) {
  if (typeof netSes.fetch !== 'function') throw new Error('This Electron version is too old for private fetching');
  return netSes.fetch(url, { ...init, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' });
}

async function fetchText(url, timeoutMs = 25000) {
  if (!/^https?:\/\//i.test(url)) return { ok: false, status: 0, error: 'Only http(s) URLs are allowed' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await sesFetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/rss+xml,application/atom+xml,*/*;q=0.8' }
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const text = buf.subarray(0, MAX_BYTES).toString('utf8');
    return { ok: res.ok, status: res.status, text, finalUrl: res.url || url, contentType: res.headers.get('content-type') || '' };
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Timed out' : String(err.message || err);
    const viaProxy = getConfig().settings.proxyMode !== 'off';
    return { ok: false, status: 0, error: viaProxy && /PROXY|SOCKS|ERR_CONNECTION_REFUSED/i.test(msg) ? 'Tor/proxy not reachable' : msg };
  } finally {
    clearTimeout(timer);
  }
}

async function checkRoute() {
  // A generic request every Tor user makes; it reveals nothing about what you read.
  const r = await fetchText('https://check.torproject.org/api/ip', 30000);
  if (!r.ok) return { ok: false, error: r.error || `HTTP ${r.status}` };
  try { const j = JSON.parse(r.text); return { ok: true, isTor: !!j.IsTor }; } catch { return { ok: false, error: 'Unexpected reply' }; }
}

// ---------------------------------------------------------------------------
// Image cache: every picture is downloaded when the edition is printed, so reading
// never touches the network (and publishers can't tell which stories you open).
// ---------------------------------------------------------------------------
const EXT = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg' };
const MIME = Object.fromEntries(Object.entries(EXT).map(([m, e]) => [e, m]));
const hashName = (u) => crypto.createHash('sha1').update(u).digest('hex').slice(0, 24);

async function cacheImage(url) {
  const base = hashName(url);
  const dir = IMAGES_DIR();
  const existing = fs.existsSync(dir) && fs.readdirSync(dir).find(f => f.startsWith(base + '.'));
  if (existing) return `gzimg://img/${existing}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await sesFetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'Accept': 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8' } });
    const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!res.ok || !EXT[type]) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200 || buf.length > MAX_IMAGE_BYTES) return null;
    fs.mkdirSync(dir, { recursive: true });
    const name = `${base}.${EXT[type]}`;
    fs.writeFileSync(path.join(dir, name), buf);
    return `gzimg://img/${name}`;
  } catch { return null; } finally { clearTimeout(timer); }
}

async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

const IMG_TAG = /<img\b[^>]*>/gi;
const SRC_ATTR = /\ssrc="([^"]*)"/i;
const unescapeAttr = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** Download every image of an edition and rewrite references to the local cache. */
async function localizeEdition(ed, maxImages = 300) {
  const want = [];
  for (const a of ed.articles || []) if (/^https?:/i.test(a.image || '')) want.push(a.image); // lead images first
  for (const a of ed.articles || []) {
    let n = 0;
    for (const tag of String(a.html || '').match(IMG_TAG) || []) {
      const m = tag.match(SRC_ATTR); if (m && /^https?:/i.test(m[1]) && n++ < 8) want.push(unescapeAttr(m[1]));
    }
  }
  const unique = [...new Set(want)].slice(0, maxImages);
  const map = new Map();
  const results = await pool(unique, 6, cacheImage);
  unique.forEach((u, i) => { if (results[i]) map.set(u, results[i]); });
  for (const a of ed.articles || []) {
    if (/^https?:/i.test(a.image || '')) a.image = map.get(a.image) || '';
    a.html = String(a.html || '').replace(IMG_TAG, (tag) => {
      const m = tag.match(SRC_ATTR);
      if (!m) return '';
      if (/^gzimg:/.test(m[1])) return tag;
      const local = map.get(unescapeAttr(m[1]));
      return local ? tag.replace(SRC_ATTR, ` src="${local}"`) : ''; // drop pictures we couldn't save
    });
  }
  return ed;
}

const hasRemoteImages = (ed) => (ed.articles || []).some(a => /^https?:/i.test(a.image || '') || /<img\b[^>]*\ssrc="https?:/i.test(a.html || ''));

function pruneImages() {
  try {
    const keep = new Set();
    for (const f of fs.readdirSync(EDITIONS_DIR())) {
      const txt = fs.readFileSync(path.join(EDITIONS_DIR(), f), 'utf8');
      for (const m of txt.matchAll(/gzimg:\/\/img\/([\w.]+)/g)) keep.add(m[1]);
    }
    for (const f of fs.readdirSync(IMAGES_DIR())) if (!keep.has(f)) fs.unlinkSync(path.join(IMAGES_DIR(), f));
  } catch { /* nothing to prune */ }
}

function registerImageProtocol() {
  protocol.handle('gzimg', (req) => {
    const name = decodeURIComponent(new URL(req.url).pathname.replace(/^\//, ''));
    if (!/^[a-f0-9]{24}\.\w+$/.test(name)) return new Response('', { status: 404 });
    const file = path.join(IMAGES_DIR(), name);
    if (!fs.existsSync(file)) return new Response('', { status: 404 });
    return new Response(fs.readFileSync(file), { headers: { 'content-type': MIME[name.split('.').pop()] || 'application/octet-stream', 'cache-control': 'no-store' } });
  });
}

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------
function broadcastConfig(saved) {
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send('config:changed', saved);
}

function registerIpc() {
  ipcMain.handle('config:get', () => getConfig());
  ipcMain.handle('config:save', async (_e, cfg) => {
    const before = getConfig().settings;
    const saved = saveConfig({ ...cfg, seenDefaults: getConfig().seenDefaults });
    applyTheme(saved.settings.theme);
    if (before.proxyMode !== saved.settings.proxyMode || before.proxyUrl !== saved.settings.proxyUrl) await applyProxy(saved.settings);
    broadcastConfig(saved);
    return saved;
  });
  ipcMain.handle('config:reset-sources', () => {
    const cfg = getConfig();
    cfg.sources = DEFAULT_SOURCES.map(s => ({ ...s }));
    cfg.seenDefaults = DEFAULT_SOURCES.map(s => s.id);
    const saved = saveConfig(cfg);
    broadcastConfig(saved);
    return saved;
  });

  ipcMain.handle('net:fetch', (_e, url) => fetchText(String(url)));
  ipcMain.handle('net:check-route', () => checkRoute());
  ipcMain.handle('net:end-run', async () => {
    // Forget anything a publisher may have left in the private session during this print run.
    await netSes.clearStorageData();
    await netSes.clearCache();
    await netSes.closeAllConnections();
  });

  ipcMain.handle('edition:plan', (_e, kind = 'all') => {
    const { settings } = getConfig();
    const state = getState();
    const k = /^[a-z+]{1,120}$/.test(String(kind)) ? String(kind) : 'all';
    const last = (state.lastByKind || {})[k] || null;
    return {
      ...planWindow(last, Date.now(), settings.windowDays),
      kind: k,
      lastGeneratedAt: last,
      lastByKind: state.lastByKind || {},
      nextNumber: (state.editionCount || 0) + 1,
      seen: Object.keys(state.seen || {})
    };
  });

  ipcMain.handle('edition:save', async (_e, edition, consideredUrls) => {
    await localizeEdition(edition);
    const state = getState();
    // Remember every URL that was in the window (even paywalled / failed ones)
    // so they don't reappear in the next edition. Forget entries after 21 days.
    const now = Date.now();
    const seen = {};
    for (const [u, t] of Object.entries(state.seen || {})) if (now - t < 21 * DAY) seen[u] = t;
    for (const u of consideredUrls || []) seen[u] = now;

    const kind = /^[a-z+]{1,120}$/.test(String(edition.kind)) ? edition.kind : 'all';
    const next = { lastByKind: { ...(state.lastByKind || {}), [kind]: edition.until }, editionCount: (state.editionCount || 0) + 1, seen };
    edition.number = next.editionCount;
    fs.mkdirSync(EDITIONS_DIR(), { recursive: true });
    writeJSON(path.join(EDITIONS_DIR(), `${edition.id}.json`), edition);
    writeJSON(STATE_FILE(), next);

    // Prune old back issues and the pictures only they used
    const files = fs.readdirSync(EDITIONS_DIR()).filter(f => f.endsWith('.json')).sort();
    for (const f of files.slice(0, Math.max(0, files.length - MAX_EDITIONS))) {
      try { fs.unlinkSync(path.join(EDITIONS_DIR(), f)); } catch { /* ignore */ }
    }
    pruneImages();
    return edition;
  });

  ipcMain.handle('edition:list', () => {
    try {
      return fs.readdirSync(EDITIONS_DIR()).filter(f => f.endsWith('.json')).sort().reverse().map(f => {
        const e = readJSON(path.join(EDITIONS_DIR(), f), null);
        return e && { id: e.id, number: e.number, createdAt: e.createdAt, since: e.since, until: e.until, kind: e.kind || 'all', count: (e.articles || []).length };
      }).filter(Boolean);
    } catch { return []; }
  });

  ipcMain.handle('edition:load', async (_e, id) => {
    if (!/^[\w-]+$/.test(String(id))) return null;
    const file = path.join(EDITIONS_DIR(), `${id}.json`);
    const ed = readJSON(file, null);
    // Editions printed by older versions still point at publishers' servers:
    // download ALL of their pictures once (never just the ones being viewed).
    if (ed && hasRemoteImages(ed)) { await localizeEdition(ed); writeJSON(file, ed); }
    return ed;
  });

  ipcMain.handle('edition:mark-read', (_e, id, articleId) => {
    if (!/^[\w-]+$/.test(String(id))) return;
    const file = path.join(EDITIONS_DIR(), `${id}.json`);
    const e = readJSON(file, null);
    if (!e) return;
    const a = (e.articles || []).find(x => x.id === articleId);
    if (a && !a.read) { a.read = true; writeJSON(file, e); }
  });

  ipcMain.handle('learning:get', () => readJSON(LEARNING_FILE(), { state: null, logs: {} }));
  ipcMain.handle('learning:save', (_e, data) => { if (data && typeof data === 'object') writeJSON(LEARNING_FILE(), { state: data.state || null, logs: data.logs || {} }); });
  ipcMain.handle('learning:reset', () => {
    try { fs.unlinkSync(LEARNING_FILE()); } catch { /* nothing to erase */ }
    for (const w of BrowserWindow.getAllWindows()) w.webContents.send('learning:reset');
  });

  ipcMain.handle('embed:status', () => embedder.init(MODELS_DIR()));
  ipcMain.handle('embed:texts', (_e, texts) => embedder.embed(MODELS_DIR(), Array.isArray(texts) ? texts : []));

  ipcMain.handle('open:external', (_e, url) => {
    if (/^https?:\/\//i.test(String(url))) shell.openExternal(String(url));
  });
  ipcMain.handle('window:sources', () => openSourcesWindow());
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWin) { if (mainWin.isMinimized()) mainWin.restore(); mainWin.focus(); }
  });
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    if (process.platform === 'win32') app.setAppUserModelId('com.vishal.dailyorbit');
    // The app's own windows may never touch the network: everything they show is local.
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_d, cb) => cb({ cancel: true }));
    session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
    registerImageProtocol();
    await setupNetSession();
    applyTheme(getConfig().settings.theme);
    registerIpc();
    createMainWindow();
    app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createMainWindow(); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
