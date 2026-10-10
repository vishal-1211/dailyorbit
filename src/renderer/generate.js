/* Edition generator: fetch feeds → window filter → extract full text → sections. */
(function () {
  const AG = (window.AG = window.AG || {});

  AG.SKY_URLS = { tle: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle', cad: 'https://ssd-api.jpl.nasa.gov/cad.api?dist-max=0.05&date-min=now&date-max=%2B60&sort=date&diameter=true&fullname=true' };

  function titleKey(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 10).join(' '); }

  // Small async pool
  function limiter(n) {
    let active = 0; const q = [];
    const next = () => { if (active >= n || !q.length) return; active++; const { fn, res, rej } = q.shift(); fn().then(res, rej).finally(() => { active--; next(); }); };
    return (fn) => new Promise((res, rej) => { q.push({ fn, res, rej }); next(); });
  }

  const FULLTEXT_WORDS = 150; // feed content this long is used as-is (no page fetch)
  const MIN_WORDS = 80;       // shorter extractions are treated as failures

  /**
   * @param {object} opts { plan, config, topics: ['all'] | ['finance', …], onProgress(evt), isCancelled() }
   * @returns {{ edition, considered: string[] }}
   */
  AG.generateEdition = async function ({ plan, config, topics = ['all'], onProgress = () => {}, isCancelled = () => false }) {
    const T0 = performance.now(), timing = {};
    const kind = AG.editionKind(topics);
    const wanted = kind === 'all' ? (config.settings.topics?.length ? config.settings.topics : AG.TOPICS.map(t => t.id)) : kind.split('+');
    const sources = config.sources.filter(s => s.enabled && wanted.includes(s.topic || 'astronomy'));
    // How many stories to read. A paper holds ~4 stories a page, so reading hundreds is wasted time.
    // Stories are chosen newest-first by date only — never by taste — so what the app asks publishers
    // for still says nothing about what you like.
    const multi = wanted.length > 2;
    const maxPer = Math.max(2, Math.min(50, Number(config.settings.maxPerSource) || 10));
    const perSource = multi ? Math.min(maxPer, 5) : maxPer;   // from one publisher
    const perTopic = multi ? 14 : 40;                        // from one desk
    const seen = new Set(plan.seen || []);
    const overlap = 6 * 60 * 60 * 1000; // re-check a few hours before the last edition; `seen` removes repeats
    const sinceCheck = plan.mode === 'since-last' ? plan.since - overlap : plan.since;
    const feedPool = limiter(24);
    const pagePool = limiter(20);
    // At most 3 pages at once from one site: polite, and avoids being slowed down.
    const hostBusy = new Map(), hostWait = new Map();
    const hostSlot = async (host) => { while ((hostBusy.get(host) || 0) >= 3) await new Promise(r => (hostWait.get(host) || hostWait.set(host, []).get(host)).push(r)); hostBusy.set(host, (hostBusy.get(host) || 0) + 1); };
    const hostFree = (host) => { hostBusy.set(host, hostBusy.get(host) - 1); const q = hostWait.get(host); if (q && q.length) q.shift()(); };
    const considered = [];
    const articles = [];
    const healed = [];
    const stats = sources.map(s => ({ id: s.id, name: s.name, topic: s.topic || 'astronomy', status: 'queued', found: 0, used: 0, paywalled: 0, failed: 0, cached: 0, error: '' }));
    const emit = () => onProgress({ stats: stats.map(s => ({ ...s })) });
    emit();

    // Sky data is independent of the news: start it now, in parallel.
    const wantsSky = wanted.includes('astronomy');
    const skyFetch = wantsSky ? Promise.all([window.api.fetchText(AG.SKY_URLS.tle, 15000), window.api.fetchText(AG.SKY_URLS.cad, 15000)]) : Promise.resolve([{ ok: false }, { ok: false }]);

    // ---- 1. all feeds at once
    const candidates = []; // { src, st, item, topic }
    await Promise.all(sources.map((src, idx) => feedPool(async () => {
      const st = stats[idx];
      if (isCancelled()) { st.status = 'cancelled'; emit(); return; }
      st.status = 'feed'; emit();

      let res = await window.api.fetchText(src.url, 15000);
      let feed = res.ok ? AG.parseFeed(res.text, res.finalUrl || src.url) : null;
      if (!feed && (res.ok || [404, 410, 301, 308].includes(res.status))) {
        // Self-repair: the publisher may have moved its feed. Look for the new address on their home page.
        try {
          const home = await window.api.fetchText(new URL(src.url).origin + '/', 12000);
          const found = home.ok ? AG.discoverFeed(home.text, home.finalUrl || src.url) : '';
          if (found && found !== src.url) { const r2 = await window.api.fetchText(found, 12000); const f2 = r2.ok ? AG.parseFeed(r2.text, found) : null; if (f2) { res = r2; feed = f2; healed.push({ id: src.id, name: src.name, url: found }); } }
        } catch { /* keep the original error */ }
      }
      if (!res.ok && !feed) { st.status = 'error'; st.error = res.error || `HTTP ${res.status}`; emit(); return; }
      if (!feed) { st.status = 'error'; st.error = 'Not a valid RSS/Atom feed'; emit(); return; }

      // Undated items (some feeds have none): treat as published now; "seen" stops repeats.
      for (const i of feed.items) if (isNaN(i.published) || !i.published) i.published = plan.until;
      let items = feed.items
        .filter(i => i.published >= sinceCheck && i.published <= plan.until + 3600e3)
        .filter(i => !seen.has(AG.canonicalUrl(i.url)));
      if (src.urlMatch) items = items.filter(i => i.url.includes(src.urlMatch));
      const topic = AG.topicById[src.topic] || AG.topicById.astronomy;
      if (src.topicOnly ?? src.astroOnly) items = items.filter(i => topic.keep.test(`${i.title} ${AG.htmlToText(i.summaryHtml).slice(0, 400)}`));
      items.sort((x, y) => y.published - x.published);
      for (const item of items.slice(0, perSource)) candidates.push({ src, st, item, topic });
      st.status = 'done'; emit();
    })));
    timing.feeds = performance.now() - T0;

    // ---- 2. choose: newest first within each desk, never more than the paper can use
    const chosen = [];
    for (const id of wanted) chosen.push(...candidates.filter(c => c.topic.id === id).sort((x, y) => y.item.published - x.item.published).slice(0, perTopic));
    for (const c of chosen) { c.st.found++; c.st.status = 'articles'; }
    emit();

    // ---- 3. full text: from the local cache when this story was read before, else fetch (many at once)
    const canons = chosen.map(c => AG.canonicalUrl(c.item.url));
    let cache = {}; try { cache = (await window.api.articleCacheGet(canons)) || {}; } catch { cache = {}; }
    const fresh = []; // new entries for the cache
    await Promise.all(chosen.map((c, ci) => pagePool(async () => {
      if (isCancelled()) return;
      const { src, st, item, topic } = c, canon = canons[ci];
      considered.push(canon);
      const summaryText = AG.htmlToText(item.summaryHtml);
      const feedFull = item.contentHtml ? AG.htmlToText(item.contentHtml) : '';
      let art = null;

      if (feedFull.split(' ').length >= FULLTEXT_WORDS) {
        const clean = AG.sanitizeHtml(item.contentHtml, item.url);
        const txt = clean.textContent.replace(/\s+/g, ' ').trim();
        art = { html: clean.innerHTML, words: txt.split(' ').length, image: item.image, excerpt: summaryText || txt.slice(0, 240), byline: item.author };
        // Drop the lead image from the body if it's the same picture we show on top.
        if (!art.image) { const im = clean.querySelector('img'); if (im) art.image = im.getAttribute('src'); }
      } else if (cache[canon]) {
        const hit = cache[canon];
        if (hit.paywalled) { st.paywalled++; emit(); return; }
        art = hit.art; st.cached++;
      } else {
        let host = ''; try { host = new URL(item.url).host; } catch { /* odd URL */ }
        await hostSlot(host);
        let page; try { page = await window.api.fetchText(item.url, 12000); } finally { hostFree(host); }
        if (page.ok) {
          const ex = AG.extractArticle(page.text, page.finalUrl || item.url);
          if (ex.paywalled) { st.paywalled++; fresh.push({ url: canon, paywalled: true }); emit(); return; }
          if (ex.words >= MIN_WORDS) { art = ex; fresh.push({ url: canon, art: { html: ex.html, words: ex.words, image: ex.image, excerpt: ex.excerpt, byline: ex.byline } }); }
        }
        if (!art) {
          // Couldn't read the full page (blocked / unusual layout): fall back to the feed's own text if substantial.
          const fallbackHtml = item.contentHtml || item.summaryHtml;
          const words = AG.htmlToText(fallbackHtml).split(' ').filter(Boolean).length;
          if (words >= 40) {
            const clean = AG.sanitizeHtml(fallbackHtml, item.url);
            art = { html: clean.innerHTML, words, image: item.image, excerpt: summaryText, byline: item.author, partial: words < FULLTEXT_WORDS };
          } else { st.failed++; emit(); return; }
        }
      }

      const excerpt = AG.tidyExcerpt((AG.htmlToText(art.excerpt || '') || summaryText).replace(/\s*(Continue reading|Read more).*$/i, ''));
      articles.push({
        id: Math.random().toString(36).slice(2, 10),
        title: AG.htmlToText(item.title),
        url: item.url,
        canon,
        source: src.name,
        sourceId: src.id,
        published: item.published,
        author: (art.byline || item.author || '').replace(/^by\s+/i, '').slice(0, 120),
        image: art.image || item.image || '',
        excerpt,
        html: art.html,
        words: art.words,
        partial: !!art.partial,
        topic: topic.id,
        section: AG.classifyIn(topic.id, AG.htmlToText(item.title), excerpt),
        read: false
      });
      st.used++; emit();
    })));
    for (const st of stats) if (st.status === 'articles') st.status = 'done';
    emit();
    if (fresh.length) window.api.articleCachePut(fresh).catch(() => {});
    timing.pages = performance.now() - T0 - timing.feeds;

    // De-duplicate the same story across sources (e.g. ESA + ESA/Webb press releases).
    const byTitle = new Map();
    for (const a of articles) {
      const k = titleKey(a.title);
      const prev = byTitle.get(k);
      if (!prev || (a.words > prev.words)) byTitle.set(k, a);
    }
    const unique = [...byTitle.values()];
    for (const a of articles) if (!unique.includes(a)) { const st = stats.find(s => s.id === a.sourceId); if (st) { st.used--; st.dupes = (st.dupes || 0) + 1; } }

    // Publisher logos and placeholder pictures are not news photos: drop pictures that are reused by
    // several stories (a site's default image), or whose address says logo / placeholder / default.
    const LOGO = /(logo|placeholder|default[-_]?(image|img|thumb|og)|favicon|sprite|fallback|no[-_]?image|og[-_]?default|share[-_]?image|brand)/i;
    const useCount = new Map(), key = (a) => `${a.sourceId}|${a.image}`; for (const a of unique) if (a.image) useCount.set(key(a), (useCount.get(key(a)) || 0) + 1);
    for (const a of unique) if (a.image && (useCount.get(key(a)) > 1 || LOGO.test(a.image.split('?')[0]))) a.image = '';

    // --- the brain takes over: understand, learn word meanings, group, judge, order
    const B = AG.Brain;
    B.sourceNames = Object.fromEntries(config.sources.map(s => [s.id, s.name]));
    unique.forEach(B.enrich);
    // Pre-trained language model, if it was installed with the app (runs on this laptop; nothing is sent).
    try {
      const ms = await window.api.embedStatus();
      if (ms?.available) {
        onProgress({ stats: stats.map(s => ({ ...s })), note: 'Reading the stories with the language model…' });
        const vecs = await window.api.embed(unique.map(a => `${a.title}. ${a.summary || a.excerpt || ''}`));
        if (Array.isArray(vecs) && vecs.length === unique.length) unique.forEach((a, i) => { a.vec = vecs[i]; });
      }
    } catch { /* fall back to the self-taught model */ }
    B.ingest(unique);            // learns astronomy vocabulary from everything downloaded (on this laptop)
    B.adaptSections(unique);     // stories the keyword rules couldn't place go to the nearest learned section
    B.cluster(unique);           // same story from several publishers = one bigger story
    const ranked = B.rank(unique, plan.until);
    for (const s of stats) { const h = (B.state.health[s.id] ||= { fails: 0 }); h.fails = s.status === 'error' ? h.fails + 1 : 0; s.failing = h.fails; }

    // --- public sky data (the same files for everyone; your location is never sent)
    if (wantsSky) onProgress({ stats: stats.map(s => ({ ...s })), note: 'Fetching orbit data for your sky page…' });
    const [tle, cad] = await skyFetch;
    let cadJson = null; try { const j = JSON.parse(cad.ok ? cad.text : 'null'); if (j && Array.isArray(j.fields)) cadJson = { fields: j.fields, data: (j.data || []).slice(0, 120) }; } catch { /* optional */ }
    const sky = { tle: tle.ok && /^1 \d{5}/m.test(tle.text) ? tle.text.slice(0, 60000) : null, cad: cadJson, fetchedAt: Date.now() };

    const edition = {
      id: new Date(plan.until).toISOString().replace(/[:.]/g, '-'),
      createdAt: Date.now(),
      since: plan.since,
      until: plan.until,
      mode: plan.mode,
      kind,
      topics: wanted,
      gapDays: plan.gapDays,
      windowDays: plan.windowDays,
      articles: ranked,
      stats,
      sky,
      timing: { ...timing, total: Math.round(performance.now() - T0) },
      taste: Object.fromEntries(AG.TOPICS.map(t => [t.id, B.topicAffinity(t.id)])) // the reader's leaning when this paper was printed
    };
    const skyNow = AG.skyFor ? AG.skyFor(config.settings.location, sky) : null;
    const soon = (skyNow?.events || []).filter(e => e.when - Date.now() < 12 * 864e5).map(e => e.kind);
    edition.extras = AG.Extras.build(edition, ranked.filter(a => !a.dup), { illum: skyNow?.tonight?.illum ?? AG.moonPhase(new Date()).illum, kinds: soon, topics: wanted });
    return { edition, considered, healed };
  };
})();
