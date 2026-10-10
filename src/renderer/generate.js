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
    const kind = AG.editionKind(topics);
    const wanted = kind === 'all' ? (config.settings.topics?.length ? config.settings.topics : AG.TOPICS.map(t => t.id)) : kind.split('+');
    const sources = config.sources.filter(s => s.enabled && wanted.includes(s.topic || 'astronomy'));
    // A paper with many topics reads fewer stories per publisher, so it stays quick to print.
    const perTopic = wanted.length > 2 ? 0.6 : 1;
    const maxPer = Math.max(2, Math.round(Math.min(50, Number(config.settings.maxPerSource) || 10) * perTopic));
    const seen = new Set(plan.seen || []);
    const overlap = 6 * 60 * 60 * 1000; // re-check a few hours before the last edition; `seen` removes repeats
    const sinceCheck = plan.mode === 'since-last' ? plan.since - overlap : plan.since;
    const feedPool = limiter(4);
    const pagePool = limiter(6);
    const considered = [];
    const articles = [];
    const healed = [];
    const stats = sources.map(s => ({ id: s.id, name: s.name, topic: s.topic || 'astronomy', status: 'queued', found: 0, used: 0, paywalled: 0, failed: 0, error: '' }));
    const emit = () => onProgress({ stats: stats.map(s => ({ ...s })) });
    emit();

    await Promise.all(sources.map((src, idx) => feedPool(async () => {
      const st = stats[idx];
      if (isCancelled()) { st.status = 'cancelled'; emit(); return; }
      st.status = 'feed'; emit();

      let res = await window.api.fetchText(src.url);
      let feed = res.ok ? AG.parseFeed(res.text, res.finalUrl || src.url) : null;
      if (!feed && (res.ok || [404, 410, 301, 308].includes(res.status))) {
        // Self-repair: the publisher may have moved its feed. Look for the new address on their home page.
        try {
          const home = await window.api.fetchText(new URL(src.url).origin + '/');
          const found = home.ok ? AG.discoverFeed(home.text, home.finalUrl || src.url) : '';
          if (found && found !== src.url) { const r2 = await window.api.fetchText(found); const f2 = r2.ok ? AG.parseFeed(r2.text, found) : null; if (f2) { res = r2; feed = f2; healed.push({ id: src.id, name: src.name, url: found }); } }
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
      items.sort((a, b) => b.published - a.published);
      items = items.slice(0, maxPer);
      st.found = items.length;
      st.status = items.length ? 'articles' : 'done';
      emit();

      await Promise.all(items.map(item => pagePool(async () => {
        if (isCancelled()) return;
        const canon = AG.canonicalUrl(item.url);
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
        } else {
          const page = await window.api.fetchText(item.url);
          if (page.ok) {
            const ex = AG.extractArticle(page.text, page.finalUrl || item.url);
            if (ex.paywalled) { st.paywalled++; emit(); return; }
            if (ex.words >= MIN_WORDS) art = ex;
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
      if (st.status !== 'error') st.status = 'done';
      emit();
    })));

    // De-duplicate the same story across sources (e.g. ESA + ESA/Webb press releases).
    const byTitle = new Map();
    for (const a of articles) {
      const k = titleKey(a.title);
      const prev = byTitle.get(k);
      if (!prev || (a.words > prev.words)) byTitle.set(k, a);
    }
    const unique = [...byTitle.values()];
    for (const a of articles) if (!unique.includes(a)) { const st = stats.find(s => s.id === a.sourceId); if (st) { st.used--; st.dupes = (st.dupes || 0) + 1; } }

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
    const wantsSky = wanted.includes('astronomy');
    if (wantsSky) onProgress({ stats: stats.map(s => ({ ...s })), note: 'Fetching orbit data for your sky page…' });
    const [tle, cad] = wantsSky ? await Promise.all([window.api.fetchText(AG.SKY_URLS.tle), window.api.fetchText(AG.SKY_URLS.cad)]) : [{ ok: false }, { ok: false }];
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
      sky
    };
    const skyNow = AG.skyFor ? AG.skyFor(config.settings.location, sky) : null;
    const soon = (skyNow?.events || []).filter(e => e.when - Date.now() < 12 * 864e5).map(e => e.kind);
    edition.extras = AG.Extras.build(edition, ranked.filter(a => !a.dup), { illum: skyNow?.tonight?.illum ?? AG.moonPhase(new Date()).illum, kinds: soon, topics: wanted });
    return { edition, considered, healed };
  };
})();
