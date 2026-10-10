const { chromium, launchOptions } = require('./browser');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { planWindow, DAY } = require('../src/plan');
const DEFAULTS = require('../src/default-sources');
const fetchText = require('./fixtures');

const OUT = path.join(__dirname, 'shots');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const R = (f) => 'file://' + path.join(__dirname, '..', 'src', 'renderer', f);

// ---- in-memory stand-in for main.js (storage + network layer)
const store = { config: { settings: { windowDays: 7, maxPerSource: 15, theme: 'night', location: { name: 'Vadodara', lat: 22.3072, lon: 73.1812 } }, sources: DEFAULTS.map(s => ({ ...s })) }, state: { lastGeneratedAt: null, editionCount: 0, seen: {} }, editions: {}, learning: { state: null, logs: {} } };
const IMGDIR = path.join(__dirname, 'img');
const dataUrl = (u) => { const f = path.join(IMGDIR, path.basename(new URL(u).pathname)); return fs.existsSync(f) ? 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') : ''; };
function localize(e) {
  for (const a of e.articles) {
    if (/^https?:/.test(a.image || '')) a.image = dataUrl(a.image);
    a.html = String(a.html || '').replace(/<img\b[^>]*>/gi, (t) => { const m = t.match(/\ssrc="([^"]*)"/); const d = m && /^https?:/.test(m[1]) ? dataUrl(m[1].replace(/&amp;/g, '&')) : (m ? m[1] : ''); return d ? t.replace(m[1], d) : ''; });
  }
}
const fetched = []; const runLog = []; const rendererRequests = []; const articleCache = {}; let LATENCY = Number(process.env.LATENCY || 150); // ms per request, like a real network
const api = {
  getConfig: () => store.config, saveConfig: (c) => (store.config = c), resetSources: () => store.config,
  fetchText: async (u) => { fetched.push(u); runLog.push(u); if (LATENCY) await new Promise(r => setTimeout(r, LATENCY)); return fetchText(u); },
  netLogReset: () => { runLog.length = 0; },
  loadDemo: () => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'demo', 'demo-edition.json'), 'utf8')); } catch { return null; } },
  savePdf: () => ({ ok: true }),
  articleCacheGet: (urls) => { const o = {}; for (const u of urls) if (articleCache[u]) o[u] = articleCache[u]; return o; },
  articleCachePut: (list) => { for (const e of list) articleCache[e.url] = { t: Date.now(), ...(e.paywalled ? { paywalled: true } : { art: e.art }) }; },
  checkRoute: () => ({ ok: true, isTor: false }), endRun: () => null,
  planEdition: (kind = 'all') => ({ ...planWindow((store.state.lastByKind || {})[kind] || null, Date.now(), store.config.settings.windowDays), kind, lastByKind: { ...(store.state.lastByKind || {}) }, lastGeneratedAt: (store.state.lastByKind || {})[kind] || null, nextNumber: store.state.editionCount + 1, seen: Object.keys(store.state.seen) }),
  saveEdition: (e, considered) => { const hosts = {}; for (const u of runLog) { const h = new URL(u).hostname; hosts[h] = (hosts[h] || 0) + 1; } e.receipt = { requests: runLog.length, hosts, route: 'off' }; localize(e); store.state.editionCount++; e.number = store.state.editionCount; (store.state.lastByKind ||= {})[e.kind || 'all'] = e.until; for (const u of considered) store.state.seen[u] = Date.now(); store.editions[e.id] = e; return e; },
  listEditions: () => Object.values(store.editions).sort((a, b) => b.id.localeCompare(a.id)).map(e => ({ id: e.id, number: e.number, createdAt: e.createdAt, since: e.since, until: e.until, kind: e.kind || 'all', count: e.articles.length })),
  loadEdition: (id) => store.editions[id] || null, markRead: (id, aid) => { const a = store.editions[id]?.articles.find(x => x.id === aid); if (a) a.read = true; }, openExternal: () => null, openSources: () => null,
  // Stand-in for the optional pre-trained language model (the real one only runs inside the desktop app)
  embedStatus: () => ({ available: !process.env.NO_MODEL, reason: process.env.NO_MODEL ? 'model files are not installed' : '' }),
  embed: (texts) => process.env.NO_MODEL ? null : texts.map(t => { const v = new Array(64).fill(0); for (const w of String(t).toLowerCase().match(/[a-z]{4,}/g) || []) { let h = 7; for (const c of w) h = (h * 31 + c.charCodeAt(0)) >>> 0; v[h % 64] += 1; } const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1; return v.map(x => Math.round(x / n * 1e4) / 1e4); }),
  getLearning: () => store.learning, saveLearning: (d) => { store.learning = JSON.parse(JSON.stringify(d)); }, resetLearning: () => { store.learning = { state: null, logs: {} }; }
};

async function newPage(browser, file, vp = { width: 1440, height: 940 }) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); if (m.type() === 'info' && process.env.VERBOSE) console.log(m.text()); });
  page.on('request', r => { if (/^(https?|wss?):/i.test(r.url())) rendererRequests.push(r.url()); });
  await page.exposeFunction('__api', (name, args) => api[name](...(args || [])));
  await page.addInitScript(() => { const call = (n) => (...a) => window.__api(n, a); window.api = new Proxy({}, { get: (_t, n) => (n === 'onConfigChanged' || n === 'onLearningReset') ? () => {} : call(n) }); });
  await page.goto(R(file));
  return page;
}
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });
const settle = (page, ms = 900) => page.waitForTimeout(ms);
const hideToast = (page) => page.evaluate(() => document.querySelector('#toast').classList.add('hidden'));
const ready = (page) => page.waitForSelector('#paperview:not(.hidden) .slot .np-page', { timeout: 90000 });
const generate = async (page, picks = null) => {
  if (await page.isHidden('#welcome')) await page.click('#btn-generate');
  await page.waitForSelector('#welcome:not(.hidden)'); await settle(page, 300);
  if (picks) { await page.click('#ns-all'); for (const id of picks) await page.click(`.ns-topic[data-pick="${id}"]`); await settle(page, 200); }
  if (process.env.SHOT_NS) await shot(page, process.env.SHOT_NS);
  await page.click('#welcome-generate'); await page.waitForSelector('#press:not(.hidden)'); await page.waitForSelector('#press.hidden', { state: 'attached', timeout: 120000 }); await settle(page, 700); await hideToast(page); };

/** Walk every page of the paper: nothing may be cut off, and count what is on show. */
const audit = (page) => page.evaluate(() => {
  const { paper } = window.AG._debug, host = document.getElementById('typeset');
  const res = { pages: paper.book.pages.length, keys: paper.meta.map(m => m.key), overflow: [], stories: 0 };
  const ids = new Set();
  for (const pg of paper.book.pages) {
    const par = pg.parentNode, nx = pg.nextSibling; if (!pg.isConnected) host.appendChild(pg);
    const body = pg.querySelector('.np-body');
    if (body.scrollHeight > body.clientHeight + 2 || body.scrollWidth > body.clientWidth + 2) res.overflow.push(`${pg.dataset.label}:${pg.dataset.section}`);
    pg.querySelectorAll('.card, .cv-hero').forEach(c => { if (c.scrollHeight > c.clientHeight + 3) res.overflow.push(`${pg.dataset.label}:card:${c.querySelector('h2,h3')?.textContent.slice(0, 30)}`); });
    pg.querySelectorAll('[data-story]').forEach(e => ids.add(e.dataset.story));
    if (par) par.insertBefore(pg, nx); else pg.remove();
  }
  res.stories = ids.size; return res;
});

(async () => {
  const browser = await chromium.launch(launchOptions());
  const now = Date.now();
  assert.equal(planWindow(null, now).mode, 'first'); assert.equal(planWindow(now - DAY, now).mode, 'since-last'); assert.equal(planWindow(now - 12 * DAY, now).mode, 'capped');
  console.log('✓ edition window rules');

  if (process.env.BENCH) { // realistic-size Everything paper on a slow network
    global.__BENCH = true; LATENCY = Number(process.env.BENCH);
    const page = await newPage(browser, 'index.html'); await page.waitForSelector('#welcome:not(.hidden)');
    const t0 = Date.now(); await generate(page); await ready(page);
    const ed = Object.values(store.editions)[0];
    console.log(`BENCH ${LATENCY} ms/request: ${ed.stats.length} sources, ${fetched.length} requests, ${ed.articles.length} stories; engine ${(ed.timing.total / 1000).toFixed(1)} s (feeds ${(ed.timing.feeds / 1000).toFixed(1)} s, stories ${(ed.timing.pages / 1000).toFixed(1)} s); click-to-paper ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    await browser.close(); return;
  }
  // ---------- Edition 1
  const page = await newPage(browser, 'index.html');
  await page.waitForSelector('#welcome:not(.hidden)'); await settle(page, 500); await shot(page, '00-welcome');
  await generate(page); await ready(page);
  const ed1 = Object.values(store.editions)[0];
  const a1 = await audit(page);
  console.log(`  print time (simulated ${LATENCY} ms network): ${(ed1.timing.total / 1000).toFixed(1)} s (feeds ${(ed1.timing.feeds / 1000).toFixed(1)} s, stories ${(ed1.timing.pages / 1000).toFixed(1)} s)`);
  console.log(`Edition 1: ${ed1.articles.length} stories → ${a1.pages} pages [${a1.keys.join(', ')}], ${a1.stories} stories on the pages`);
  assert(a1.pages <= 24, 'never more than the page limit'); assert.deepEqual(a1.overflow, [], 'nothing cut off: ' + a1.overflow.join(' | '));
  for (const k of ['front', 'top', 'people', 'instruments', 'fun', 'sky', 'you', 'back']) assert(a1.keys.includes(k), 'missing page ' + k);
  if (false) { const d = JSON.parse(JSON.stringify(ed1)); d.demo = true; fs.mkdirSync(path.join(__dirname, '..', 'src', 'demo'), { recursive: true }); fs.writeFileSync(path.join(__dirname, '..', 'src', 'demo', 'demo-edition.json'), JSON.stringify(d)); console.log('  demo paper written'); }
  const healed = store.config.sources.find(s => s.id === 'skytel').url;
  assert.equal(healed, 'https://skyandtelescope.org/feed/', 'moved feed found and saved automatically'); console.log('✓ self-repair: a moved feed was found from the publisher’s home page');
  assert(ed1.sky.tle && ed1.sky.cad, 'sky data stored with the edition');
  const X = ed1.extras; console.log(`  extras: quiz ${X.quiz.length} (${X.quiz.filter(q => q.storyId).length} from this edition), did-you-know ${X.didYouKnow.length}, memes ${X.memes.map(m => m.id)}, star: ${X.people.star.name}, quoted ${X.people.quoted.length}, instrument: ${X.instruments.feature.name}, on this day ${X.onThisDay.length}`);
  assert(X.quiz.length >= 4 && X.memes.length === 2 && X.people.star && X.instruments.feature);
  assert.equal(ed1.articles.every(x => Array.isArray(x.vec)), !process.env.NO_MODEL, 'stories carry language-model vectors exactly when the model is installed');
  await shot(page, '01-cover');
  const turn = async (name) => { await page.keyboard.press('ArrowRight'); await settle(page, 1050); await shot(page, name); };
  await turn('02-top-people'); await turn('03-spread'); await turn('04-spread'); await turn('05-spread'); await turn('06-spread');

  // ---------- pages change only when asked: scrolling and dragging must not turn them
  await page.keyboard.press('Home'); await settle(page, 1000);
  const lbl = () => page.textContent('#p-label');
  const l0 = await lbl(); const bb = await page.locator('#stage .book').boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 400); await settle(page, 900);
  await page.mouse.move(bb.x + bb.width - 30, bb.y + 200); await page.mouse.down(); await page.mouse.move(bb.x + 60, bb.y + 220, { steps: 8 }); await page.mouse.up(); await settle(page, 900);
  await page.keyboard.press(' '); await page.keyboard.press('PageDown'); await settle(page, 900);
  assert.equal(await lbl(), l0, 'scrolling, dragging, Space and PageDown do not change the page');
  await page.click('#p-side-next'); await settle(page, 1000); assert.notEqual(await lbl(), l0, 'the arrow button does');
  await page.click('#p-side-prev'); await settle(page, 1000); assert.equal(await lbl(), l0);
  console.log('✓ pages change only with the arrow buttons / arrow keys, never by scrolling or dragging');

  // ---------- quiz: answer a question on the fun page
  const funIdx = a1.keys.indexOf('fun');
  await page.evaluate((i) => window.AG._debug.paper.book.jump(i), funIdx); await settle(page, 900);
  await page.click('#stage .qz[data-q="0"] .qz-o[data-o="1"]'); await settle(page, 300);
  assert(await page.$eval('#stage .qz[data-q="0"]', e => e.classList.contains('done')));
  assert.equal(await page.evaluate(() => window.AG.Brain.state.quiz.asked), 1);
  await shot(page, '07-fun-quiz-answered');
  const skyIdx = a1.keys.indexOf('sky');
  const skyText = await page.evaluate((i) => window.AG._debug.paper.book.pages[i].textContent, skyIdx);
  if (process.env.DBG) console.log(await page.evaluate(() => { const e = window.AG._debug.edition(); const r = window.AG.skyFor({ name: 'Vadodara', lat: 22.3072, lon: 73.1812 }, e.sky); return JSON.stringify({ cad: e.sky.cad && e.sky.cad.data.length, ev: r.events.map(x => x.kind + ':' + new Date(x.when).toISOString().slice(0, 10)) }); }), skyText.slice(-900));
  assert(/As seen from Vadodara/.test(skyText) && /Coming up/.test(skyText)); assert(/space station/i.test(skyText), 'station passes listed'); assert(/Asteroid/.test(skyText));
  console.log('✓ quiz is interactive; sky page lists events for Vadodara incl. station passes and asteroid flybys');

  // ---------- reading + learning: love the Mars story, dislike the launch-hardware one
  const pick = (re) => ed1.articles.find(a => re.test(a.title)).id;
  const mars = pick(/Jezero/), shock = pick(/Shock Absorber/), harvest = pick(/Harvest Moon effect/);
  const P = (id) => page.evaluate((x) => window.AG.Brain.personal(window.AG._debug.edition().articles.find(z => z.id === x)), id);
  const open = async (id) => { await page.evaluate((x) => window.AG._debug.open(x), id); await page.waitForSelector('#readerview:not(.hidden) .rd-page'); await settle(page, 500); };
  const p0 = { mars: await P(mars), shock: await P(shock) };
  await open(mars); await shot(page, '08-reader');
  await page.keyboard.press('End'); await settle(page, 700);
  await page.click('#r-up'); await settle(page, 200); await shot(page, '09-reader-thumb-up');
  await page.click('#r-why'); await settle(page, 300); await shot(page, '09b-why');
  assert(/interested in this story/.test(await page.textContent('#why-body'))); await page.click('#why-close');
  // continuous two-page reading
  await page.click('#r-cont'); await page.waitForSelector('#cont:not(.hidden) .cont-row'); await settle(page, 600); await hideToast(page);
  const rows = await page.$$eval('#cont .cont-row', r => r.map(x => x.children.length));
  assert(rows.length >= 2 && rows[0] === 2, 'two pages side by side, stacked: ' + rows);
  await page.evaluate(() => { const c = document.querySelector('#cont'); c.scrollTop = c.scrollHeight * 0.3; }); await settle(page, 400); await shot(page, '09c-continuous');
  await page.evaluate(() => { const c = document.querySelector('#cont'); c.scrollTop = c.scrollHeight; }); await settle(page, 400);
  assert.equal(await page.textContent('#r-left'), 'End of story');
  await page.keyboard.press('Escape'); await settle(page, 300);
  await open(shock); assert(await page.$('#cont:not(.hidden) .cont-row'), 'the switch stays on for the next story');
  await page.click('#r-cont'); await page.waitForSelector('#cont.hidden', { state: 'attached' }); await settle(page, 500);
  console.log('✓ continuous two-page reading: a switch that stays on until switched off');
  await page.click('#r-down'); await page.keyboard.press('Escape'); await settle(page, 300);
  if (false)   await open(harvest); await page.keyboard.press('End'); await settle(page, 600); await page.keyboard.press('Escape'); await settle(page, 1500);
  const p1 = { mars: await P(mars), shock: await P(shock) };
  console.log(`  taste: Mars story ${p0.mars.toFixed(2)} → ${p1.mars.toFixed(2)}, spacecraft-hardware story ${p0.shock.toFixed(2)} → ${p1.shock.toFixed(2)}`);
  assert(p1.mars > p0.mars && p1.shock < p0.shock, 'ratings change predicted taste');
  assert(store.learning.logs[ed1.id][mars].thumb === 1 && store.learning.logs[ed1.id][mars].completion === 1, 'log saved locally');
  console.log('✓ reading log and ratings saved locally and learned from at once');

  // ---------- Edition 2 (same public stories again): requests must be identical whatever was read
  const run1 = new Set(fetched); fetched.length = 0;
  store.state.seen = {}; store.state.lastByKind = {}; for (const k of Object.keys(articleCache)) delete articleCache[k]; // same starting point as edition 1
  await generate(page); await ready(page);
  const run2 = new Set(fetched);
  const eds = Object.values(store.editions).sort((a, b) => a.number - b.number), ed2 = eds[eds.length - 1];
  const rk = (ed, re) => ed.articles.findIndex(a => re.test(a.title)) + 1;
  console.log(`Edition 2: Mars story rank ${rk(ed1, /Jezero/)} → ${rk(ed2, /Jezero/)}; hardware story rank ${rk(ed1, /Shock Absorber/)} → ${rk(ed2, /Shock Absorber/)}; lessons ${Math.round(store.learning.state.n)}`);
  if (process.env.DBG) for (const e of [ed1, ed2]) console.log(e.number, e.articles.map(x => `${x.title.slice(0, 18)} q${x.q?.toFixed(1)} p${x.p?.toFixed(2)} r${x.rank?.toFixed(2)}${x.dup ? ' dup' : ''}`).join(' | '));
  assert(rk(ed2, /Shock Absorber/) > rk(ed1, /Shock Absorber/), 'disliked kind of story sinks');
  const moved = [...run2].filter(u => !run1.has(u) && !/skyandtelescope/.test(u)), gone = [...run1].filter(u => !run2.has(u) && !/skyandtelescope/.test(u));
  assert.deepEqual([moved, gone], [[], []], 'what the app asks the internet for does not depend on what was read');
  const logText = JSON.stringify(store.learning);
  assert(![...run2].some(u => /thumb|completion|opened|22\.30|73\.18|lat=|lon=/i.test(u)), 'no reading data or location in any request');
  const okHosts = ['nasa.gov', 'apod.nasa.gov', 'esa.int', 'astronomy.com', 'universetoday.com', 'esawebb.org', 'esahubble.org', 'eso.org', 'earthsky.org', 'phys.org', 'skyandtelescope.org', 'rss.beehiiv.com', 'bigthink.com', 'astrobites.org', 'centauri-dreams.org', 'aaavadodara.org', 'celestrak.org', 'ssd-api.jpl.nasa.gov',
    ...DEFAULTS.map(d => new URL(d.url).hostname.replace(/^www\./, '')), 'ndtvprofit.com', 'espncricinfo.com', 'skysports.com', 'aljazeera.com', 'ndtv.com', 'sciencedaily.com', 'npr.org', 'bollywoodhungama.com', 'theprint.in', 'techcrunch.com'];
  const odd = [...run1, ...run2].filter(u => !okHosts.includes(new URL(u).hostname.replace(/^www\./, '')));
  assert.deepEqual(odd, [], 'only public feed / story / sky-data addresses are requested');
  console.log(`✓ privacy: both editions made the same ${run2.size} public requests; none carries reading data or location (learning file is ${Math.round(logText.length / 1024)} KB, local only)`);
  const a2 = await audit(page); assert(a2.pages <= 24); assert.deepEqual(a2.overflow, []);
  await page.keyboard.press('End'); await settle(page, 1100); await shot(page, '10-back-page-learned');

  // ---------- all stories, zoom, fit width, day paper, leaving warning
  await page.click('#btn-all'); await settle(page, 300); await shot(page, '11-all-stories');
  assert.equal(await page.$$eval('#all-list .all-row', r => r.length), ed2.articles.length); await page.click('#all-close');
  await page.keyboard.press('Home'); await settle(page, 1000);
  await page.keyboard.press('ArrowRight'); await settle(page, 1000);
  await page.click('#p-zin'); await page.click('#p-zin'); await settle(page, 300); assert.equal(await page.textContent('#p-zoom'), '150%'); await shot(page, '12-zoom'); await page.click('#p-zoom');
  await page.click('#p-fit'); await page.waitForSelector('#p-fit.on'); await settle(page, 1500); await shot(page, '13-fit-width');
  { const lab = await page.textContent('#p-label'), top0 = await page.evaluate(() => document.querySelector('#stage').scrollTop);
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await settle(page, 700);
    const top1 = await page.evaluate(() => document.querySelector('#stage').scrollTop);
    await page.keyboard.press('ArrowUp'); await settle(page, 600); const top2 = await page.evaluate(() => document.querySelector('#stage').scrollTop);
    assert(top1 > top0 && top2 < top1 && (await page.textContent('#p-label')) === lab, `↑/↓ move the page without turning it (${top0} → ${top1} → ${top2})`);
    console.log('✓ ↑ / ↓ move the page up and down without turning it'); }
  const af = await audit(page); assert.deepEqual(af.overflow, [], 'fit-width layout'); await page.click('#p-fit'); await settle(page, 1200);
  await page.click('#btn-theme'); await settle(page, 700); await page.keyboard.press('Home'); await settle(page, 1000); await shot(page, '14-day-cover');
  await page.keyboard.press('ArrowRight'); await settle(page, 1000); await shot(page, '15-day-spread'); await page.click('#btn-theme'); await settle(page, 300);

  // ---------- a different city changes the sky page
  store.config.settings.location = { name: 'Sydney', lat: -33.8688, lon: 151.2093 };
  const syd = await newPage(browser, 'index.html'); await ready(syd);
  const sydText = await syd.evaluate(() => { const b = window.AG._debug.paper; return b.book.pages[b.meta.findIndex(m => m.key === 'sky')].textContent; });
  assert(/As seen from Sydney/.test(sydText)); await syd.close(); store.config.settings.location = { name: 'Vadodara', lat: 22.3072, lon: 73.1812 };
  console.log('✓ zoom, fit-width, day paper, all-stories list; sky page follows the chosen city');

  // ---------- one brain across topics: read Finance, and Finance moves up; then a Finance-only paper
  const finIds = ed2.articles.filter(a => a.topic === 'finance' && !a.dup).map(a => a.id);
  const affBefore = await page.evaluate(() => window.AG.Brain.topicAffinity('finance'));
  for (const id of finIds) { await open(id); await page.keyboard.press('End'); await settle(page, 400); await page.click('#r-up'); await settle(page, 200); await page.keyboard.press('Escape'); await settle(page, 400); }
  const sportsId = ed2.articles.find(a => a.topic === 'sports' && !a.dup).id; await open(sportsId); await page.click('#r-down'); await page.keyboard.press('Escape'); await settle(page, 400);
  const aff = await page.evaluate(() => ({ fin: window.AG.Brain.topicAffinity('finance'), sp: window.AG.Brain.topicAffinity('sports') }));
  assert(aff.fin > affBefore && aff.fin > aff.sp, 'reading Finance raises the Finance topic over the rest: ' + JSON.stringify(aff));
  store.state.seen = {};
  await page.click('#btn-generate'); await page.waitForSelector('#welcome:not(.hidden)'); await settle(page, 600);
  assert(await page.$('.ns-topic[data-pick="finance"] .ns-fav'), 'newsstand marks the topic you read most');
  await page.click('.ns-topic[data-pick="finance"]'); await settle(page, 300); await shot(page, '20-newsstand-finance');
  await page.click('#welcome-generate'); await page.waitForSelector('#press:not(.hidden)'); await page.waitForSelector('#press.hidden', { state: 'attached', timeout: 120000 }); await settle(page, 700); await hideToast(page); await ready(page);
  const edF = Object.values(store.editions).sort((a, b) => a.number - b.number).pop();
  const cachedF = edF.stats.reduce((n, x) => n + (x.cached || 0), 0);
  assert(cachedF > 0, 'the Finance paper reused stories already read for the Everything paper');
  const aF = await audit(page);
  assert.equal(edF.kind, 'finance'); assert(edF.articles.length && edF.articles.every(a => a.topic === 'finance'), 'a Finance paper holds only Finance');
  assert(!aF.keys.includes('sky') && !aF.keys.includes('instruments'), 'no sky or telescope pages in a Finance paper'); assert.deepEqual(aF.overflow, []);
  assert(/Finance edition/i.test(await page.evaluate(() => window.AG._debug.paper.book.pages[0].textContent)), 'masthead says Finance edition');
  await page.keyboard.press('Home'); await settle(page, 900); await shot(page, '21-finance-cover');
  await page.keyboard.press('ArrowRight'); await settle(page, 1000); await shot(page, '22-finance-spread');
  console.log(`✓ topics: one brain across topics (Finance ${aff.fin.toFixed(2)} vs Sports ${aff.sp.toFixed(2)}); Finance-only paper: ${edF.articles.length} stories (${cachedF} from the local cache, ${(edF.timing.total / 1000).toFixed(1)} s), ${aF.pages} pages [${aF.keys.join(', ')}]`);
  // the general paper now puts Finance before the topics read less
  store.state.seen = {}; store.state.lastByKind = {};
  await generate(page, []); await ready(page);
  const aG = await audit(page), order = aG.keys.filter(k => k.startsWith('t-'));
  const edG = Object.values(store.editions).sort((a, b) => a.number - b.number).pop(), firstOf = (t) => edG.articles.findIndex(a => a.topic === t);
  assert(firstOf('finance') >= 0 && firstOf('finance') < firstOf('sports'), `Finance ranks above Sports: ${firstOf('finance')} vs ${firstOf('sports')}`);
  { const edGc = Object.values(store.editions).sort((a, b) => a.number - b.number).pop(), lead = edGc.articles.find(a => (a.alsoBy || []).length);
    assert(lead, 'a story told by two publishers is merged'); await open(lead.id); assert(await page.isVisible('#r-others'), 'Compare button shows for a shared story');
    await page.click('#r-others'); await settle(page, 400); assert.equal(await page.$$eval('#why-body .cmp', x => x.length), 1 + lead.alsoBy.length); await shot(page, '24-compare');
    await page.click('#why-close'); await page.keyboard.press('Escape'); await settle(page, 400); console.log(`✓ compare: “${lead.title.slice(0, 40)}…” side by side from ${1 + lead.alsoBy.length} publishers`);
    if (process.env.DUMP_DEMO) { const d = JSON.parse(JSON.stringify(edGc)); d.demo = true; fs.mkdirSync(path.join(__dirname, '..', 'src', 'demo'), { recursive: true }); fs.writeFileSync(path.join(__dirname, '..', 'src', 'demo', 'demo-edition.json'), JSON.stringify(d)); console.log('  demo paper written'); } }
  console.log(`✓ the general paper follows your taste: first Finance story at #${firstOf('finance') + 1}, first Sports story at #${firstOf('sports') + 1}; topic pages ${order.map(k => k.slice(2)).join(' → ')}`);

  // ---------- narrow window (single page) and a very busy week (60+ stories)
  const small = await newPage(browser, 'index.html', { width: 1000, height: 720 }); await ready(small); await settle(small); await hideToast(small);
  const as = await audit(small); assert(as.pages <= 24); assert.deepEqual(as.overflow, [], 'narrow window'); await shot(small, '16-narrow-cover'); await shot(small, '16-narrow-cover'); await small.close();
  global.__BIG = 55; store.state.seen = {}; store.state.lastByKind = {}; store.config.settings.maxPerSource = 60;
  await page.keyboard.press('Home'); await generate(page, ['astronomy']); await ready(page);
  const edB = Object.values(store.editions).sort((a, b) => a.number - b.number).pop(), ab = await audit(page);
  console.log(`Busy week: ${edB.articles.length} stories → ${ab.pages} pages, ${ab.stories} on the pages, the rest in “All stories”`);
  assert(edB.articles.length >= 35, 'busy week size ' + edB.articles.length); assert(ab.pages > 12 && ab.pages <= 24, 'busy week uses more pages, within the limit: ' + ab.pages); assert.deepEqual(ab.overflow, []);
  await page.keyboard.press('ArrowRight'); await settle(page, 1000); await page.keyboard.press('ArrowRight'); await settle(page, 1000); await shot(page, '17-busy-sections');
  await page.keyboard.press('End'); await settle(page, 1100); await shot(page, '18-busy-back');
  global.__BIG = 0; await generate(page, []); await ready(page);
  for (const [w, hh] of [[1920, 1080], [1280, 800], [2560, 1400]]) { const p = await newPage(browser, 'index.html', { width: w, height: hh }); await ready(p); const r = await audit(p); assert(r.pages <= 24 && !r.overflow.length, `${w}x${hh}: ${r.overflow}`); await p.close(); }
  console.log('✓ page limit (24) holds on a 66-story week and at 1280, 1920 and 2560 px wide windows; nothing cut off');

  // ---------- sources window
  const sw = await newPage(browser, 'sources.html', { width: 860, height: 2300 }); await sw.waitForSelector('.src'); await settle(sw, 500); await shot(sw, '19-sources');
  assert(/lessons so far/.test(await sw.textContent('#learn-summary')));
  await sw.click('#learn-check'); await sw.waitForSelector('#check-result.ok'); const chk = await sw.textContent('#check-result');
  console.log('  model check:', chk.replace(/\s+/g, ' ').slice(0, 330));
  assert(/Language test/.test(chk) && /Taste test: it scores your 👍 stories at/.test(chk)); assert(/Scorecard/.test(await sw.textContent('#learn-score')));
  await sw.evaluate(() => document.querySelector('#learn-check').scrollIntoView({ block: 'center' })); await shot(sw, '19b-model-check');
  assert((process.env.NO_MODEL ? /self-taught/ : /pre-trained/).test(await sw.textContent('#learn-model')));
  assert.equal(await sw.$eval('#loc-city', e => e.value), 'Vadodara');
  await sw.selectOption('#loc-city', 'Leh'); await settle(sw, 300); assert.equal(store.config.settings.location.name, 'Leh');

  assert.equal(rendererRequests.length, 0, 'the app windows must never touch the network: ' + rendererRequests.slice(0, 3));
  console.log('✓ app windows made 0 network requests of their own');
  await browser.close();
  console.log('\nAll checks passed.');
})().catch(e => { console.error(e); process.exit(1); });
