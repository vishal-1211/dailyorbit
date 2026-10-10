/* Sources configuration window. */
(function () {
  const AG = window.AG;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let cfg = null;
  let editing = null;
  let tab = 'all'; // which topic's sources are shown
  const testResults = {}; // id -> {cls, text}

  async function save() {
    cfg = await window.api.saveConfig(cfg);
    const s = $('#saved'); s.classList.add('show');
    clearTimeout(save._t); save._t = setTimeout(() => s.classList.remove('show'), 1400);
  }

  function render() {
    document.documentElement.dataset.theme = cfg.settings.theme === 'day' ? 'day' : 'night';
    const on = cfg.sources.filter(s => s.enabled).length;
    $('#src-count').textContent = `${on} of ${cfg.sources.length} on`;
    const inAll = new Set(cfg.settings.topics?.length ? cfg.settings.topics : AG.TOPICS.map(t => t.id));
    const count = (id) => cfg.sources.filter(s => (s.topic || 'astronomy') === id);
    $('#src-tabs').innerHTML = `<button class="src-tab ${tab === 'all' ? 'on' : ''}" data-tab="all">All topics</button>` + AG.TOPICS.map(t => { const c = count(t.id); return `<button class="src-tab ${tab === t.id ? 'on' : ''} ${inAll.has(t.id) ? '' : 'out'}" data-tab="${t.id}" style="--tc:${t.color}">${t.icon} ${esc(t.name)} <i>${c.filter(s => s.enabled).length}/${c.length}</i></button>`; }).join('');
    const tp = AG.topicById[tab];
    $('#src-topic-bar').innerHTML = tp ? `<label class="check"><input type="checkbox" data-act="in-all" ${inAll.has(tp.id) ? 'checked' : ''}> <span>Include ${esc(tp.name)} in the <b>Everything</b> paper <small>(${esc(tp.name)}-only papers work either way)</small></span></label>` : '<span class="hint" style="margin:0">Pick a topic above to see its sources, or browse them all here.</span>';
    if ($('#add-topic').options.length === 0) $('#add-topic').innerHTML = AG.TOPICS.map(t => `<option value="${t.id}">${t.icon} ${esc(t.name)}</option>`).join('');
    if (tp) $('#add-topic').value = tp.id;
    const shown = cfg.sources.filter(s => tab === 'all' || (s.topic || 'astronomy') === tab);
    $('#src-list').innerHTML = shown.map(s => {
      const tr = testResults[s.id];
      const edit = editing === s.id ? `
        <div class="src-edit">
          <label class="field"><span>Name</span><input data-edit-name value="${esc(s.name)}"></label>
          <label class="field"><span>Feed URL</span><input data-edit-url value="${esc(s.url)}"></label>
          <button class="primary" data-act="save-edit" data-id="${s.id}">Save</button>
        </div>` : '';
      return `
        <li class="src ${s.enabled ? '' : 'off'}">
          <label class="toggle" title="${s.enabled ? 'On' : 'Off'}"><input type="checkbox" data-act="toggle" data-id="${s.id}" ${s.enabled ? 'checked' : ''}><span></span></label>
          <div style="min-width:0">
            <div class="src-name">${tab === 'all' ? `<i class="pl-dot" style="--tc:${AG.topicById[s.topic || 'astronomy']?.color}" title="${esc(AG.topicById[s.topic || 'astronomy']?.name)}"></i>` : ''}${esc(s.name)} ${(s.topicOnly ?? s.astroOnly) ? `<span class="tag" title="Only ${esc(AG.topicById[s.topic || 'astronomy']?.name)} stories are kept from this source">topic filter</span>` : ''}</div>
            <div class="src-url">${esc(s.url)}</div>
          </div>
          <div class="src-actions">
            <button data-act="test" data-id="${s.id}">Test</button>
            <button data-act="edit" data-id="${s.id}">Edit</button>
            <button data-act="filter" data-id="${s.id}" title="Keep only stories that match this source's topic">${(s.topicOnly ?? s.astroOnly) ? 'Keep all' : 'Topic only'}</button>
            <button class="del" data-act="delete" data-id="${s.id}">Remove</button>
          </div>
          ${tr ? `<div class="src-test ${tr.cls}">${esc(tr.text)}</div>` : ''}
          ${edit}
        </li>`;
    }).join('');
    $('#set-days').value = cfg.settings.windowDays;
    $('#set-max').value = cfg.settings.maxPerSource;
    $('#set-pages').value = cfg.settings.maxPages || 24;
    $('#set-gestures').checked = !!cfg.settings.turnGestures;
    $('#set-theme').value = cfg.settings.theme;
    $('#hint-days').textContent = cfg.settings.windowDays;
    document.querySelectorAll('input[name="route"]').forEach(r => { r.checked = r.value === (cfg.settings.proxyMode || 'off'); });
    $('.custom-row').classList.toggle('hidden', cfg.settings.proxyMode !== 'custom');
    if (document.activeElement !== $('#proxy-url')) $('#proxy-url').value = cfg.settings.proxyUrl || '';
    $('#warn-original').checked = cfg.settings.warnOriginal !== false;
    renderLocation();
  }

  /** Fetch a URL; if it's a web page, discover its feed. Returns {feedUrl, feed} or throws. */
  async function resolveFeed(url) {
    const res = await window.api.fetchText(url);
    if (!res.ok) throw new Error(res.error || `HTTP ${res.status}`);
    let feed = AG.parseFeed(res.text, res.finalUrl || url);
    let feedUrl = url;
    if (!feed) {
      const found = AG.discoverFeed(res.text, res.finalUrl || url);
      if (!found) throw new Error('That page has no RSS/Atom feed I can find.');
      const r2 = await window.api.fetchText(found);
      if (!r2.ok) throw new Error(`Found feed ${found} but it returned ${r2.error || 'HTTP ' + r2.status}`);
      feed = AG.parseFeed(r2.text, found);
      if (!feed) throw new Error(`Found ${found} but it isn’t a readable feed.`);
      feedUrl = found;
    }
    return { feedUrl, feed };
  }

  function describe(feed) {
    const dated = feed.items.filter(i => !isNaN(i.published)).sort((a, b) => b.published - a.published);
    const weekAgo = Date.now() - 7 * 864e5;
    const recent = dated.filter(i => i.published >= weekAgo).length;
    const latest = dated[0];
    return `✓ ${feed.items.length} items · ${recent} in the last week${latest ? ` · latest: “${AG.htmlToText(latest.title).slice(0, 70)}” (${new Date(latest.published).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })})` : ''}`;
  }

  async function testSource(id) {
    const s = cfg.sources.find(x => x.id === id);
    testResults[id] = { cls: '', text: 'Testing…' }; render();
    try {
      const { feedUrl, feed } = await resolveFeed(s.url);
      if (feedUrl !== s.url) { s.url = feedUrl; await save(); }
      testResults[id] = { cls: 'ok', text: describe(feed) };
    } catch (e) {
      testResults[id] = { cls: 'bad', text: `✗ ${e.message}` };
    }
    render();
  }

  function normaliseUrl(u) {
    u = u.trim();
    if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { return new URL(u).href; } catch { return ''; }
  }

  async function addTest() {
    const out = $('#add-result');
    const url = normaliseUrl($('#add-url').value);
    if (!url) { out.className = 'test-result bad'; out.textContent = 'Enter a valid URL.'; return null; }
    out.className = 'test-result'; out.textContent = 'Checking…';
    try {
      const { feedUrl, feed } = await resolveFeed(url);
      $('#add-url').value = feedUrl;
      if (!$('#add-name').value.trim() && feed.title) $('#add-name').value = AG.htmlToText(feed.title).slice(0, 60);
      out.className = 'test-result ok'; out.textContent = `${describe(feed)}${feedUrl !== url ? ` · feed found at ${feedUrl}` : ''}`;
      return { feedUrl, feed };
    } catch (e) {
      out.className = 'test-result bad'; out.textContent = `✗ ${e.message}`;
      return null;
    }
  }

  async function addSave() {
    const ok = await addTest();
    if (!ok) return;
    const url = ok.feedUrl;
    if (cfg.sources.some(s => s.url === url)) { const out = $('#add-result'); out.className = 'test-result bad'; out.textContent = 'That feed is already in your list.'; return; }
    cfg.sources.push({ id: Math.random().toString(36).slice(2, 10), topic: $('#add-topic').value || 'world', name: $('#add-name').value.trim() || ok.feed.title || new URL(url).hostname, url, enabled: true, topicOnly: $('#add-astro').checked });
    await save();
    $('#add-name').value = ''; $('#add-url').value = ''; $('#add-astro').checked = false;
    const out = $('#add-result'); out.className = 'test-result ok'; out.textContent = 'Added — it will be included in your next edition.';
    render();
  }

  function renderLocation() {
    const loc = cfg.settings.location || {}, sel = $('#loc-city');
    if (!sel.options.length) {
      const groups = {}; for (const c of AG.Content.CITIES) (groups[c.country] ||= []).push(c);
      sel.innerHTML = '<option value="">Custom coordinates</option>' + Object.entries(groups).map(([k, v]) => `<optgroup label="${esc(k)}">${v.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}</optgroup>`).join('');
    }
    const match = AG.Content.CITIES.find(c => c.name === loc.name && Math.abs(c.lat - loc.lat) < 0.01);
    sel.value = match ? match.name : '';
    if (document.activeElement !== $('#loc-lat')) $('#loc-lat').value = loc.lat ?? '';
    if (document.activeElement !== $('#loc-lon')) $('#loc-lon').value = loc.lon ?? '';
  }
  async function renderLearning() {
    const L = await window.api.getLearning(); AG.Brain.load(L?.state);
    AG.Brain.sourceNames = Object.fromEntries(cfg.sources.map(s => [s.id, s.name]));
    const ex = AG.Brain.explain(), m = AG.Brain.maturity();
    $('#learn-summary').textContent = ex.lessons < 1 ? 'Nothing yet. Read a few stories and tap 👍 or 👎 in the reader; it starts adapting with the next edition.'
      : `${ex.lessons} lessons so far (${m >= 1 ? 'confident' : m > 0.4 ? 'getting there' : 'still early'}). It has also picked up ${ex.words.toLocaleString()} astronomy words from the articles it downloaded.${ex.quiz.asked ? ` Quiz: ${ex.quiz.correct} of ${ex.quiz.asked} right, so questions are getting ${ex.quiz.correct / ex.quiz.asked > 0.75 ? 'harder' : ex.quiz.correct / ex.quiz.asked < 0.4 ? 'easier' : 'a mix'}.` : ''}`;
    try { const ms = await window.api.embedStatus(); $('#learn-model').textContent = ms?.available ? 'Language model: pre-trained (all-MiniLM-L6-v2), running on this laptop.' : `Language model: self-taught. The pre-trained model is not in use (${ms?.reason || 'not installed'}).`; } catch { $('#learn-model').textContent = ''; }
    // Scorecard: its predictions (made before you read) against what you then did.
    const T = ex.track, pc = (x) => (x[0] ? Math.round(100 * x[1] / x[0]) : 0);
    $('#learn-score').textContent = !T || (T.top[0] + T.rest[0]) < 12 ? 'Scorecard: not enough reading yet. After two or three editions this will show how often its predictions matched what you actually opened.'
      : `Scorecard so far: of the stories it placed in the top third, you opened ${pc(T.top)}% (${T.top[1]} of ${T.top[0]}); of the rest, ${pc(T.rest)}% (${T.rest[1]} of ${T.rest[0]}).` + (T.hi[0] + T.lo[0] >= 8 ? ` Stories it expected you to like: ${pc(T.hi)}% opened. Stories it expected you to skip: ${pc(T.lo)}% opened.` : '') + ' The bigger the gap between those numbers, the better it is doing.';
    $('#learn-likes').className = 'learn up'; $('#learn-likes').innerHTML = ex.likes.length ? 'You seem to enjoy ' + ex.likes.map(x => `<span>${esc(x)}</span>`).join('') : '';
    $('#learn-dislikes').innerHTML = ex.dislikes.length ? 'Less interested in ' + ex.dislikes.map(x => `<span>${esc(x)}</span>`).join('') : '';
  }

  // A short, visible test of both halves of the model: language sense, and your taste.
  const PROBES = [
    ['A rover drills into ancient rock on Mars', 'Perseverance collects samples from a Martian crater', 'A company raises money to build rockets'],
    ['Astronomers photograph a distant spiral galaxy', 'Telescope reveals stars forming in a faraway galaxy', 'Astronauts repair a toilet on the space station'],
    ['How to watch the meteor shower this weekend', 'Shooting stars peak on Saturday night for skywatchers', 'New study of black hole jets using radio data'],
    ['A total solar eclipse will cross the country', 'The Moon will block the Sun for four minutes', 'Engineers test a new rocket engine']
  ];
  const cosine = (a, b) => { let d = 0, x = 0, y = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; } return d / (Math.sqrt(x * y) || 1); };
  async function runCheck() {
    const out = $('#check-result'); out.className = 'test-result'; out.textContent = 'Checking…';
    const L = await window.api.getLearning(); const B = AG.Brain; B.load(L?.state);
    const lines = []; const row = (ok, t) => lines.push(`<div class="checkline"><i>${ok === null ? '•' : ok ? '✓' : '✗'}</i><span>${t}</span></div>`);
    // 1. language sense
    const ms = await window.api.embedStatus();
    let vec; const kind = ms?.available ? 'pre-trained' : 'self-taught';
    if (ms?.available) { const flat = await window.api.embed(PROBES.flat()); vec = (i) => flat[i]; }
    else { const flat = PROBES.flat().map(t => B.docVec({ terms: B.tokenize(t).map(w => [w, 1]) })); vec = (i) => flat[i]; }
    let right = 0, known = 0;
    PROBES.forEach((p, k) => { const a = vec(k * 3), b = vec(k * 3 + 1), c = vec(k * 3 + 2); if (!a || !a.some(Boolean) || !b.some(Boolean) || !c.some(Boolean)) return; known++; if (cosine(a, b) > cosine(a, c)) right++; });
    row(null, `<b>Language model in use: ${kind}.</b>${ms?.available ? '' : ` (Pre-trained model not in use: ${esc(ms?.reason || 'not installed')}.)`}`);
    if (!known) row(null, 'Language test: it has not read enough yet to be tested. Print an edition or two first.');
    else row(right >= Math.ceil(known * 0.75), `Language test: asked to say which of two sentences is closer in meaning to a third, it got <b>${right} of ${known}</b> right.${known < PROBES.length ? ` (${PROBES.length - known} skipped: words it has not met yet.)` : ''}`);
    // 2. your taste: does it score the stories you rated the way you rated them?
    const eds = await window.api.listEditions(); let up = [], down = [], opened = [], skipped = [];
    for (const e of eds.slice(0, 6)) {
      const ed = await window.api.loadEdition(e.id), log = L?.logs?.[e.id] || {}; if (!ed) continue;
      for (const a of ed.articles) { const l = log[a.id]; if (!l) continue; B.enrich(a); const p = B.personal(a); if (l.thumb === 1) up.push(p); else if (l.thumb === -1) down.push(p); else if (l.opened) opened.push(p); else if (l.seen) skipped.push(p); }
    }
    const avg = (x) => Math.round(100 * x.reduce((s, v) => s + v, 0) / x.length);
    if (up.length && down.length) row(avg(up) > avg(down), `Taste test: it scores your 👍 stories at <b>${avg(up)}%</b> and your 👎 stories at <b>${avg(down)}%</b> on average (${up.length} and ${down.length} stories).`);
    else row(null, 'Taste test: rate at least one story 👍 and one 👎 in the reader, then run this again.');
    if (opened.length >= 3 && skipped.length >= 3) row(avg(opened) > avg(skipped), `It scores stories you opened at <b>${avg(opened)}%</b> and stories you saw but skipped at <b>${avg(skipped)}%</b>.`);
    row(null, `Lessons learned so far: <b>${Math.round(B.state.n)}</b>. Words it knows: <b>${Object.keys(B.state.terms).length.toLocaleString()}</b>.`);
    row(null, 'Note: the taste test checks stories it has already learned from, so it shows the model has absorbed your ratings. The scorecard above is the stricter test: it compares predictions made before you read with what you then did.');
    out.className = 'test-result ok'; out.innerHTML = lines.join('');
  }

  function wire() {
    $('#learn-check').addEventListener('click', runCheck);
    $('#loc-city').addEventListener('change', async (e) => {
      const c = AG.Content.CITIES.find(x => x.name === e.target.value); if (!c) return;
      cfg.settings.location = { name: c.name, lat: c.lat, lon: c.lon }; await save(); render();
    });
    const coords = async () => {
      const lat = parseFloat($('#loc-lat').value), lon = parseFloat($('#loc-lon').value), out = $('#loc-result');
      if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) { out.className = 'test-result bad'; out.textContent = 'Latitude must be between −90 and 90, longitude between −180 and 180 (east is positive).'; return; }
      out.className = 'test-result hidden';
      const near = AG.Content.CITIES.find(c => Math.abs(c.lat - lat) < 0.02 && Math.abs(c.lon - lon) < 0.02);
      cfg.settings.location = { name: near ? near.name : 'your location', lat, lon }; await save(); render();
    };
    $('#loc-lat').addEventListener('change', coords); $('#loc-lon').addEventListener('change', coords);
    $('#learn-reset').addEventListener('click', async () => {
      if (!confirm('Erase everything the paper has learned about your taste? This cannot be undone.')) return;
      await window.api.resetLearning(); renderLearning();
    });
    window.addEventListener('focus', renderLearning);

    $('#src-tabs').addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; editing = null; render(); } });
    $('#src-topic-bar').addEventListener('change', async (e) => {
      if (e.target.dataset.act !== 'in-all') return;
      const set = new Set(cfg.settings.topics?.length ? cfg.settings.topics : AG.TOPICS.map(t => t.id));
      e.target.checked ? set.add(tab) : set.delete(tab);
      if (!set.size) { e.target.checked = true; return; } // the Everything paper needs at least one topic
      cfg.settings.topics = AG.TOPICS.map(t => t.id).filter(id => set.has(id)); await save(); render();
    });
    $('#src-list').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const id = b.dataset.id;
      const s = cfg.sources.find(x => x.id === id);
      switch (b.dataset.act) {
        case 'test': return testSource(id);
        case 'edit': editing = editing === id ? null : id; return render();
        case 'filter': s.topicOnly = !(s.topicOnly ?? s.astroOnly); delete s.astroOnly; await save(); return render();
        case 'delete':
          cfg.sources = cfg.sources.filter(x => x.id !== id); delete testResults[id];
          await save(); return render();
        case 'save-edit': {
          const li = b.closest('.src');
          const name = li.querySelector('[data-edit-name]').value.trim();
          const url = normaliseUrl(li.querySelector('[data-edit-url]').value);
          if (name) s.name = name;
          if (url) s.url = url;
          editing = null; await save(); render(); return testSource(id);
        }
      }
    });
    $('#src-list').addEventListener('change', async (e) => {
      if (e.target.dataset.act !== 'toggle') return;
      const s = cfg.sources.find(x => x.id === e.target.dataset.id);
      s.enabled = e.target.checked;
      await save(); render();
    });
    $('#add-test').addEventListener('click', addTest);
    $('#add-save').addEventListener('click', addSave);
    $('#add-url').addEventListener('keydown', (e) => { if (e.key === 'Enter') addSave(); });

    const clampInt = (v, lo, hi, d) => { const n = parseInt(v, 10); return isNaN(n) ? d : Math.max(lo, Math.min(hi, n)); };
    $('#set-days').addEventListener('change', async (e) => { cfg.settings.windowDays = clampInt(e.target.value, 1, 30, 7); await save(); render(); });
    $('#set-pages').addEventListener('change', async (e) => { cfg.settings.maxPages = clampInt(e.target.value, 8, 30, 24); await save(); render(); });
    $('#set-gestures').addEventListener('change', async (e) => { cfg.settings.turnGestures = e.target.checked; await save(); });
    $('#set-max').addEventListener('change', async (e) => { cfg.settings.maxPerSource = clampInt(e.target.value, 1, 50, 15); await save(); render(); });
    $('#set-theme').addEventListener('change', async (e) => { cfg.settings.theme = e.target.value; await save(); render(); });
    document.querySelectorAll('input[name="route"]').forEach(r => r.addEventListener('change', async () => {
      cfg.settings.proxyMode = r.value; await save(); render(); $('#route-result').classList.add('hidden');
    }));
    $('#proxy-url').addEventListener('change', async (e) => {
      const v = e.target.value.trim();
      const out = $('#route-result');
      if (v && !/^(socks5|socks4|http|https):\/\/[A-Za-z0-9.-]+:\d{1,5}$/.test(v)) { out.className = 'test-result bad'; out.textContent = 'Use the form socks5://host:port or http://host:port'; return; }
      cfg.settings.proxyUrl = v; await save(); render();
    });
    $('#warn-original').addEventListener('change', async (e) => { cfg.settings.warnOriginal = e.target.checked; await save(); });
    $('#route-test').addEventListener('click', async () => {
      const out = $('#route-result');
      out.className = 'test-result'; out.textContent = 'Testing…';
      const r = await window.api.checkRoute();
      const mode = cfg.settings.proxyMode || 'off';
      if (!r.ok) { out.className = 'test-result bad'; out.textContent = mode === 'off' ? `✗ Couldn’t reach the internet (${r.error}).` : `✗ ${mode === 'tor' ? 'Tor' : 'The proxy'} isn’t reachable (${r.error}). The app will not connect until it is — open Tor Browser and try again.`; return; }
      if (r.isTor) { out.className = 'test-result ok'; out.textContent = '✓ Connected through Tor. Publishers can’t see your real internet address.'; }
      else { out.className = mode === 'tor' ? 'test-result bad' : 'test-result ok'; out.textContent = mode === 'off' ? '✓ Connected normally (not through Tor).' : '✓ Connected through your proxy. (It isn’t Tor, so how private this is depends on the proxy/VPN.)'; }
    });
    $('#reset').addEventListener('click', async () => {
      if (!confirm('Replace your source list with the defaults?')) return;
      cfg = await window.api.resetSources(); render();
    });
    window.api.onConfigChanged((c) => { cfg = c; render(); });
  }

  (async function boot() {
    cfg = await window.api.getConfig();
    wire();
    render();
    renderLearning();
  })();
})();
