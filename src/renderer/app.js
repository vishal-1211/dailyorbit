/* The Daily Orbit — app controller: newsstand, generation, the paper on the desk, the book reader. */
(function () {
  const AG = window.AG;
  const $ = (s) => document.querySelector(s);
  const esc = AG.esc;

  let config = null;
  let edition = null;
  let generating = false, cancelFlag = false;
  const SIZES = ['s', 'm', 'l', 'xl'];

  const paper = { book: null, meta: [], order: [] };
  const reader = { book: null, article: null, pages: [] };
  // What the paper learns lives only in this file's memory and in learning.json on this laptop.
  const learning = { logs: {} };
  AG._debug = { paper, reader, learning, edition: () => edition, open: (id) => openStory(id) };
  const B = AG.Brain;
  let saveT;
  function saveLearning(now = false) {
    clearTimeout(saveT);
    const go = () => window.api.saveLearning({ state: B.state, logs: learning.logs });
    if (now) return go(); saveT = setTimeout(go, 1200);
  }
  const logFor = (ed) => (learning.logs[ed.id] ||= {});
  const entry = (id) => (logFor(edition)[id] ||= {});
  function pruneLogs(keepIds) { for (const k of Object.keys(learning.logs)) if (!keepIds.includes(k)) delete learning.logs[k]; }

  const fmtDay = (t) => new Date(t).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const fmtShort = (t) => new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short' });

  function toast(msg, ms = 3800) {
    const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), ms);
  }
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme === 'day' ? 'day' : 'night';
    requestAnimationFrame(AG.paintStars);
  }
  function view(name) {
    $('#welcome').classList.toggle('hidden', name !== 'welcome');
    $('#paperview').classList.toggle('hidden', name === 'welcome' && !edition); // the newsstand floats over the paper once there is one
    $('#welcome').classList.toggle('over', name === 'welcome' && !!edition);
    $('#paperview').classList.toggle('behind', name === 'reader'); // kept laid out (for resizing) but not shown under the reader
    $('#readerview').classList.toggle('hidden', name !== 'reader');
  }

  const planText = (plan) => (plan.mode === 'first' ? `past ${plan.windowDays} days` : plan.mode === 'capped' ? `last ${plan.windowDays} days only` : `since ${fmtDay(plan.since)}`);
  async function refreshGenerateHint() {
    const plan = await window.api.planEdition(AG.editionKind(pickList()));
    $('#gen-sub').textContent = `${AG.kindLabel(plan.kind)} · ${planText(plan)}`;
    return plan;
  }

  // ------------------------------------------------------------------ geometry
  function geometry(stage, isReader, fit = false) {
    const W = stage.clientWidth - 56, H = stage.clientHeight - 40;
    if (fit) {
      // Fit to width: one big page, bigger type, scroll down to read, turn at the bottom.
      const pageW = Math.floor(Math.min(stage.clientWidth - 76, isReader ? 1000 : 1240));
      return { pageW, pageH: Math.floor(pageW / (isReader ? 0.68 : 0.72)), spread: false, fit: true };
    }
    const ratio = isReader ? 0.68 : 0.72;
    const minSpread = isReader ? 380 : 470;
    let pageH = H, pageW = Math.floor(H * ratio);
    if (pageW * 2 > W) { pageW = Math.floor(W / 2); pageH = Math.floor(pageW / ratio); }
    if (pageW >= minSpread) return { pageW, pageH, spread: true };
    pageH = H; pageW = Math.floor(Math.min(H * ratio, W)); pageH = Math.min(H, Math.floor(pageW / ratio));
    return { pageW, pageH, spread: false };
  }

  // ------------------------------------------------------------------ the paper
  async function renderEdition(ed, { startLabel = null } = {}) {
    edition = ed;
    view('paper');
    $('#brand-kind').textContent = ed.kind && ed.kind !== 'all' ? `· ${AG.kindLabel(ed.kind)}` : '';
    await document.fonts.ready;
    const stage = $('#stage');
    const g = geometry(stage, false, !!config.settings.paperFit);
    $('#typesetting').classList.remove('hidden');
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 20)));
    const t0 = performance.now();
    const location = config.settings.location;
    const sky = AG.skyFor(location, ed.sky);
    const { pages, meta } = await AG.typesetPaper(ed, { ...g, size: config.settings.paperSize || 'm' }, $('#typeset'), { log: logFor(ed), sky, location, maxPages: config.settings.maxPages });
    console.info(`Typeset ${pages.length} pages in ${Math.round(performance.now() - t0)} ms`);
    $('#typesetting').classList.add('hidden');
    paper.meta = meta;
    const start = startLabel ? Math.max(0, meta.findIndex(m => m.label === startLabel)) : 0;
    paper.book.load(pages, { ...g, cover: true, startPage: start });
    quizScore();

    // Page chips
    const seen = new Set();
    $('#p-sections').innerHTML = meta.map((m, i) => {
      if (seen.has(m.key)) return ''; seen.add(m.key);
      return `<button class="db-chip" data-goto-page="${i}" data-key="${m.key}" title="${esc(m.name)} · page ${m.label}"><b>${m.label}</b>${esc(m.key === 'sections' ? 'Sections' : m.short)}</button>`;
    }).join('');
    $('#btn-all span').textContent = `All stories (${ed.articles.length})`;
    $('#p-scrub').max = String(pages.length - 1);
    requestAnimationFrame(AG.paintStars);
  }

  function updatePaperBar(book) {
    const vis = book.visible();
    if (!vis.length || !paper.meta.length) return;
    const ms = vis.map(i => paper.meta[i]);
    $('#p-label').textContent = `Page ${ms.map(m => m.label).join('–')}`;
    $('#p-name').textContent = [...new Set(ms.flatMap(m => m.name.split(' · ')))].slice(0, 4).join(' · ');
    $('#p-count').textContent = `of ${paper.meta.length}`;
    // Stories on the pages in front of the reader count as "seen" (used for learning later).
    if (edition) { for (const i of vis) book.pages[i].querySelectorAll('[data-story]').forEach(e => { entry(e.dataset.story).seen = 1; }); saveLearning(); }
    $('#p-scrub').value = String(vis[0]);
    $('#p-prev').disabled = $('#p-side-prev').disabled = !book.canPrev();
    $('#p-next').disabled = $('#p-side-next').disabled = !book.canNext();
    const key = ms[ms.length - 1].key;
    document.querySelectorAll('#p-sections .db-chip').forEach(c => c.classList.toggle('active', c.dataset.key === key || ms.some(m => m.key === c.dataset.key)));
  }

  function currentLabel(book, meta) { const v = book.visible(); return v.length ? meta[v[0]].label : null; }

  // ------------------------------------------------------------------ reader
  function readingOrder() {
    // Paper order: stories as they appear on the pages
    const ids = [];
    for (const p of paper.book.pages) p.querySelectorAll('[data-story]').forEach(e => { if (!ids.includes(e.dataset.story)) ids.push(e.dataset.story); });
    for (const a of edition.articles) if (!ids.includes(a.id)) ids.push(a.id);
    return ids;
  }

  async function openStory(id, { fromEnd = false } = {}) {
    const a = edition.articles.find(x => x.id === id);
    if (!a) return;
    reader.article = a;
    reader.order = readingOrder();
    const idx = reader.order.indexOf(id);
    const next = edition.articles.find(x => x.id === reader.order[idx + 1]);
    view('reader');
    $('#r-title').textContent = a.title;
    $('#r-original').dataset.url = a.url;
    $('#r-prevstory').disabled = idx <= 0;
    $('#r-nextstory').disabled = !next;
    const stage = $('#rstage');
    const g = geometry(stage, true, !!config.settings.readerFit);
    const pages = await AG.typesetStory(a, { ...g, size: config.settings.readerSize || 'm' }, $('#typeset'), next);
    reader.pages = pages;
    const continuous = !!config.settings.readerContinuous;
    $('#cont').classList.toggle('hidden', !continuous); stage.classList.toggle('veiled', continuous); $('#r-cont').classList.toggle('on', continuous);
    if (continuous) { reader.book.load([], { ...g, cover: false }); buildCont(pages, g, fromEnd); }
    else { $('#cont').replaceChildren(); reader.book.load(pages, { ...g, cover: false, startPage: fromEnd ? pages.length - 1 : 0 }); }
    $('#r-scrub').max = String(pages.length - 1);
    if (!a.read) {
      a.read = true;
      window.api.markRead(edition.id, a.id);
      paper.book.pages.forEach(p => p.querySelectorAll(`[data-story="${a.id}"]`).forEach(e => e.classList.add('is-read')));
    }
    const l = entry(a.id); l.opened = 1; l.seen = 1;
    syncThumbs(); saveLearning();
  }
  function lesson() { if (edition) { B.learnFromLog(edition, logFor(edition), false); saveLearning(); } }
  function closeReader() { lesson(); view('paper'); }
  function syncThumbs() {
    const t = reader.article ? (entry(reader.article.id).thumb || 0) : 0;
    $('#r-up').classList.toggle('on', t === 1); $('#r-down').classList.toggle('on', t === -1);
  }
  function thumb(v) {
    if (!reader.article) return;
    const l = entry(reader.article.id); l.thumb = l.thumb === v ? 0 : v;
    syncThumbs(); lesson();
    if (l.thumb) toast(l.thumb === 1 ? 'Noted: more like this in future editions.' : 'Noted: fewer like this in future editions.', 2200);
  }
  function answerQuiz(el) {
    const qi = Number(el.dataset.q), oi = Number(el.dataset.o), q = edition.extras?.quiz?.[qi]; if (!q) return;
    const log = logFor(edition), done = (log._quiz ||= {}); if (done[q.id] != null) return;
    done[q.id] = oi; B.state.quiz.asked++; if (oi === q.answer) B.state.quiz.correct++;
    const box = el.closest('.qz'); box.classList.add('done');
    box.querySelectorAll('.qz-o').forEach((o, k) => { if (k === q.answer) o.classList.add('right'); else if (k === oi) o.classList.add('wrong'); });
    quizScore(); saveLearning();
  }
  function quizScore() {
    const qs = edition?.extras?.quiz || [], done = logFor(edition)._quiz || {};
    const n = qs.filter(q => done[q.id] != null).length, ok = qs.filter(q => done[q.id] === q.answer).length;
    paper.book.pages.forEach(p => { const s = p.querySelector('#quiz-score'); if (s) s.textContent = n ? `· ${ok} of ${n} right` : ''; });
  }
  function showAll() {
    const list = [...edition.articles].sort((x, y) => (y.rank ?? 0) - (x.rank ?? 0));
    $('#all-list').innerHTML = list.map(x => `<button class="all-row ${x.read ? 'is-read' : ''}" data-all="${x.id}"><b>${esc(x.title)}</b><span>${esc(x.source)} · ${AG.readMins(x.words)} min${x.read ? ' · ✓ read' : ''}${x.dup ? ' · same story as another above' : ''}</span></button>`).join('');
    $('#allstories').classList.remove('hidden');
  }
  function stepStory(d) {
    lesson();
    const i = reader.order.indexOf(reader.article.id);
    const id = reader.order[i + d]; if (id) openStory(id);
  }
  // ---- continuous reading: every page of the story in one two-page scroll, no page turns
  const cont = { per: 2, zoom: 1 };
  function buildCont(pages, g, fromEnd) {
    const box = $('#cont'), inner = document.createElement('div'); inner.className = 'cont-inner';
    cont.per = g.spread ? 2 : 1; cont.zoom = 1;
    for (let i = 0; i < pages.length; i += cont.per) { const row = document.createElement('div'); row.className = 'cont-row'; pages.slice(i, i + cont.per).forEach(p => row.appendChild(p)); inner.appendChild(row); }
    box.replaceChildren(inner); box.scrollTop = fromEnd ? box.scrollHeight : 0;
    $('#r-zoom').textContent = '100%'; $('#r-zout').disabled = true; $('#r-zin').disabled = false;
    updateContBar();
  }
  function contRow() {
    const box = $('#cont'), rows = [...box.querySelectorAll('.cont-row')], mid = box.scrollTop + box.clientHeight * 0.4;
    let r = 0; rows.forEach((row, i) => { if (row.offsetTop <= mid) r = i; });
    return { box, rows, r };
  }
  function updateContBar() {
    const { box, rows, r } = contRow(), n = reader.pages.length; if (!rows.length) return;
    const first = r * cont.per + 1, last = Math.min(n, first + cont.per - 1);
    const done = box.scrollHeight <= box.clientHeight + 4 ? 1 : Math.min(1, (box.scrollTop + box.clientHeight) / box.scrollHeight);
    $('#r-label').textContent = `Page ${first === last ? first : `${first}–${last}`} of ${n}`;
    const left = Math.round(AG.readMins(reader.article.words) * (1 - done));
    $('#r-left').textContent = done > 0.97 ? 'End of story' : left < 1 ? 'under a minute left' : `${left} min left`;
    $('#r-scrub').value = String(first - 1);
    const atTop = box.scrollTop <= 2, atEnd = box.scrollTop + box.clientHeight >= box.scrollHeight - 2;
    $('#r-prev').disabled = $('#r-side-prev').disabled = atTop; $('#r-next').disabled = $('#r-side-next').disabled = atEnd;
    if (edition && reader.article) { const l = entry(reader.article.id); l.completion = Math.max(l.completion || 0, done > 0.97 ? 1 : (last / n) * done); saveLearning(); }
  }
  function contStep(d) { const { box, rows, r } = contRow(); const t = rows[Math.max(0, Math.min(rows.length - 1, r + d))]; if (t) box.scrollTo({ top: (t.offsetTop - 16) * 1, behavior: 'smooth' }); }
  function contZoom(z) {
    cont.zoom = Math.max(1, Math.min(2.5, Math.round(z * 100) / 100));
    $('#cont .cont-inner').style.zoom = String(cont.zoom);
    $('#r-zoom').textContent = `${Math.round(cont.zoom * 100)}%`; $('#r-zout').disabled = cont.zoom <= 1; $('#r-zin').disabled = cont.zoom >= 2.5;
  }
  const isCont = () => !!config.settings.readerContinuous && !$('#readerview').classList.contains('hidden');
  function readerTurn(d) { if (config.settings.readerContinuous) contStep(d); else reader.book.turn(d); }
  async function toggleCont() {
    config.settings.readerContinuous = !config.settings.readerContinuous;
    config = await window.api.saveConfig(config);
    if (reader.article) await openStory(reader.article.id);
    toast(config.settings.readerContinuous ? 'Continuous reading is on: scroll down through the whole story.' : 'Continuous reading is off.', 2600);
  }
  function showWhy() {
    const x = reader.article; if (!x) return;
    const w = B.why(x), pos = edition.articles.indexOf(x) + 1, pct = Math.round(w.p * 100);
    const chips = (arr) => `<div class="chips">${arr.map(t => `<span>${esc(t)}</span>`).join('')}</div>`;
    $('#why-body').innerHTML = `
      <div>The paper’s guess: you’d be <b>${pct}%</b> interested in this story.</div><div class="why-meter"><span style="width:${pct}%"></span></div>
      ${w.lessons < 3 ? '<p>It has hardly learned anything yet, so this guess is close to a coin toss. For now it orders stories by freshness, length, pictures and how many publishers covered them.</p>' : `<p>Based on <b>${w.lessons}</b> lessons from your reading so far.</p>`}
      ${w.forIt.length ? `<p><b>In its favour</b></p>${chips(w.forIt)}` : ''}
      ${w.against.length ? `<p><b>Against it</b></p>${chips(w.against)}` : ''}
      <p>Placed <b>${pos}</b> of ${edition.articles.length} in this edition.${x.variety ? ' This one is a deliberate “something different” pick, outside your usual taste.' : ''}${(x.coverage || 1) > 1 ? ` ${x.coverage} publishers covered it, which pushed it up.` : ''}</p>
      <p>${x.vec ? 'Read with the pre-trained language model.' : 'Read with the self-taught model.'} Tap 👍 or 👎 to correct it.</p>`;
    $('#why').classList.remove('hidden');
  }

  function updateReaderBar(book) {
    if (config.settings.readerContinuous) return;
    const vis = book.visible(); if (!vis.length) return;
    const n = reader.pages.length;
    $('#r-label').textContent = `Page ${vis.map(i => i + 1).join('–')} of ${n}`;
    const last = vis[vis.length - 1];
    const left = Math.round(AG.readMins(reader.article.words) * (1 - (last + 1) / n));
    $('#r-left').textContent = last === n - 1 ? 'End of story' : left < 1 ? 'under a minute left' : `${left} min left`;
    $('#r-scrub').value = String(vis[0]);
    $('#r-prev').disabled = $('#r-side-prev').disabled = !book.canPrev(); $('#r-next').disabled = $('#r-side-next').disabled = !book.canNext();
    if (edition && reader.article) { const l = entry(reader.article.id); l.completion = Math.max(l.completion || 0, (last + 1) / n); saveLearning(); }
  }

  // ------------------------------------------------------------------ newsstand
  let pick = new Set(['all']);
  const pickList = () => [...pick];
  const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  async function renderNewsstand() {
    const plan = await window.api.planEdition(AG.editionKind(pickList()));
    const last = plan.lastByKind || {}, on = (id) => config.sources.filter(s => s.enabled && (s.topic || 'astronomy') === id).length;
    const inAll = new Set(config.settings.topics?.length ? config.settings.topics : AG.TOPICS.map(t => t.id));
    const fav = [...AG.TOPICS].map(t => [t.id, B.topicAffinity(t.id)]).sort((x, y) => y[1] - x[1]).filter(x => x[1] > 0.04).slice(0, 2).map(x => x[0]);
    $('#ns-eyebrow').textContent = `${greeting()}, Vishal · ${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}`;
    $('#ns-copy').textContent = `I gather free-to-read stories from the publishers you pick and print them as a paper made for you. Each kind of paper picks up where its last edition left off; away more than ${plan.windowDays} days, you only get the last ${plan.windowDays}.`;
    $('#ns-all-orbit').innerHTML = AG.TOPICS.filter(t => inAll.has(t.id)).map((t, i, arr) => `<i style="--tc:${t.color};--a:${(360 / arr.length) * i}deg">${t.icon}</i>`).join('') + '<span class="orb"></span>';
    $('#ns-all').classList.toggle('on', pick.has('all'));
    $('#ns-all-sub').textContent = last.all ? `Your daily paper · new since ${fmtDay(last.all)}` : 'Your daily paper: a little of every topic, more of what you read';
    $('#ns-grid').innerHTML = AG.TOPICS.map(t => {
      const n = on(t.id), l = last[t.id];
      return `<button class="ns-topic ${pick.has(t.id) ? 'on' : ''} ${n ? '' : 'empty'}" data-pick="${t.id}" style="--tc:${t.color}">
        <span class="ns-icon">${t.icon}</span><b>${esc(t.name)}</b><small>${esc(t.tag)}</small>
        <em>${n ? `${n} source${n === 1 ? '' : 's'}` : 'No sources on'}${l ? ` · since ${esc(fmtShort(l))}` : ''}</em>
        ${fav.includes(t.id) ? '<i class="ns-fav">You read this most</i>' : ''}<span class="ns-check">✓</span></button>`;
    }).join('');
    $('#ns-pick').innerHTML = `<b>${esc(AG.kindLabel(plan.kind))}</b> · ${esc(planText(plan))}`;
    $('#ns-close').classList.toggle('hidden', !edition);
  }
  async function openNewsstand() {
    if (generating) return;
    const saved = config.settings.lastPick; if (Array.isArray(saved) && saved.length) pick = new Set(saved);
    await renderNewsstand(); view('welcome'); requestAnimationFrame(AG.paintStars);
  }
  function closeNewsstand() { if (edition) view('paper'); }
  function togglePick(id) {
    if (id === 'all') pick = new Set(['all']);
    else { pick.delete('all'); pick.has(id) ? pick.delete(id) : pick.add(id); if (!pick.size) pick.add('all'); }
    renderNewsstand();
  }

  // ------------------------------------------------------------------ generation
  const STATUS = { queued: 'Waiting', feed: 'Reading feed…', articles: 'Fetching stories…', done: 'Done', error: 'Unavailable', cancelled: 'Cancelled' };
  async function generate() {
    if (generating) return;
    const topics = pickList(), kind = AG.editionKind(topics);
    generating = true; cancelFlag = false;
    $('#btn-generate').disabled = true;
    $('#press').classList.remove('hidden');
    try {
      config = await window.api.getConfig();
      const wantedTopics = kind === 'all' ? (config.settings.topics?.length ? config.settings.topics : AG.TOPICS.map(t => t.id)) : topics;
      if (!config.sources.some(s => s.enabled && wantedTopics.includes(s.topic || 'astronomy'))) { toast(`No sources are switched on for ${AG.kindLabel(kind)} — open Sources to pick some.`, 5000); return; }
      config.settings.lastPick = topics; config = await window.api.saveConfig(config);
      const plan = await window.api.planEdition(kind);
      $('#press-title').textContent = kind === 'all' ? 'Printing your daily paper…' : `Printing your ${AG.kindLabel(kind)} edition…`;
      $('#press-sub').textContent = plan.mode === 'since-last' ? `Stories since ${fmtDay(plan.since)}`
        : plan.mode === 'capped' ? `You’ve been away ${Math.round(plan.gapDays)} days — gathering just the last ${plan.windowDays}` : `Gathering the past ${plan.windowDays} days`;
      if (edition) B.learnFromLog(edition, logFor(edition), true); // the outgoing edition's final lessons
      const { edition: ed, considered, healed } = await AG.generateEdition({
        plan, config, topics, isCancelled: () => cancelFlag,
        onProgress: ({ stats, note }) => {
          if (note) $('#press-sub').textContent = note;
          const total = stats.length;
          const doneSrc = stats.filter(s => ['done', 'error', 'cancelled'].includes(s.status)).length;
          const artTotal = stats.reduce((n, s) => n + s.found, 0);
          const artDone = stats.reduce((n, s) => n + s.used + s.paywalled + s.failed, 0);
          const pct = total ? ((doneSrc / total) * 0.4 + (artTotal ? artDone / artTotal : doneSrc / total) * 0.6) * 100 : 100;
          $('#press-bar').style.width = `${Math.min(100, pct)}%`;
          $('#press-list').innerHTML = stats.map(s => {
            let label = STATUS[s.status] || s.status, cls = '';
            if (s.status === 'articles') label = `${s.used + s.paywalled + s.failed} / ${s.found} stories`;
            if (s.status === 'done') { label = s.found ? `${s.used} stor${s.used === 1 ? 'y' : 'ies'}${s.paywalled ? ` · ${s.paywalled} paywalled` : ''}` : 'Nothing new'; cls = 'ok'; }
            if (s.status === 'error') { label = s.error; cls = 'bad'; }
            const t = AG.topicById[s.topic];
            return `<li><span>${t ? `<i class="pl-dot" style="--tc:${t.color}" title="${esc(t.name)}"></i>` : ''}${esc(s.name)}</span><span class="st ${cls}">${esc(label)}</span></li>`;
          }).join('');
        }
      });
      if (cancelFlag) { toast('Printing cancelled — nothing was changed.'); return; }
      if (!ed.stats.some(s => s.status !== 'error')) { toast('Couldn’t reach any source. Check your internet connection and try again.', 6000); return; }
      if (!ed.articles.length) { toast(plan.mode === 'since-last' ? `You’re all caught up — nothing new since ${fmtDay(plan.since)}.` : 'No stories found in this window.', 5000); return; }
      $('#press-title').textContent = 'Saving pictures & setting the type…';
      const saved = await window.api.saveEdition(ed, considered);
      if (healed?.length) { // a publisher moved its feed and the app found the new address by itself
        for (const hfix of healed) { const src = config.sources.find(x => x.id === hfix.id); if (src) src.url = hfix.url; }
        config = await window.api.saveConfig(config);
      }
      pruneLogs((await window.api.listEditions()).map(e => e.id));
      await saveLearning(true);
      await renderEdition(saved);
      if (healed?.length) toast(`${healed.map(x => x.name).join(', ')} moved its feed; I found the new address and updated it.`, 6000);
      else
      toast(`Edition No. ${saved.number} is on your desk — ${saved.articles.length} stories.`);
    } catch (err) {
      console.error(err);
      toast(`Something went wrong while printing: ${err.message || err}`, 6000);
    } finally {
      try { await window.api.endRun(); } catch { /* ignore */ }
      generating = false;
      $('#press').classList.add('hidden');
      $('#btn-generate').disabled = false;
      refreshGenerateHint();
    }
  }

  async function toggleIssues() {
    const menu = $('#issues-menu');
    if (!menu.classList.contains('hidden')) { menu.classList.add('hidden'); return; }
    const list = await window.api.listEditions();
    menu.innerHTML = list.length
      ? list.map(e => `<button class="menu-item ${edition && e.id === edition.id ? 'active' : ''}" data-edition="${esc(e.id)}"><span>No. ${e.number} · ${esc(AG.kindLabel(e.kind || 'all'))}</span><small>${esc(fmtShort(e.since))} – ${esc(fmtShort(e.until))} · ${e.count} stories</small></button>`).join('')
      : '<div class="menu-empty">No back issues yet.</div>';
    menu.classList.remove('hidden');
  }

  async function toggleFit(which) {
    const key = which === 'paper' ? 'paperFit' : 'readerFit';
    config.settings[key] = !config.settings[key];
    config = await window.api.saveConfig(config);
    syncFitButtons();
    if (which === 'paper') { paper.book.setZoom(1); await renderEdition(edition, { startLabel: currentLabel(paper.book, paper.meta) }); }
    else { reader.book.setZoom(1); await openStory(reader.article.id); }
  }
  function syncFitButtons() {
    $('#p-fit').classList.toggle('on', !!config.settings.paperFit);
    $('#r-fit').classList.toggle('on', !!config.settings.readerFit);
  }

  // Leaving the app for the publisher's site is a normal, visible web visit, so ask first.
  function openOriginal(url) {
    if (config.settings.warnOriginal === false) return window.api.openExternal(url);
    const dlg = $('#confirm');
    let host = ''; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
    $('#confirm-host').textContent = host || 'the publisher’s website';
    $('#confirm-never').checked = false;
    dlg.classList.remove('hidden');
    const close = () => { dlg.classList.add('hidden'); $('#confirm-go').onclick = $('#confirm-cancel').onclick = null; };
    $('#confirm-cancel').onclick = close;
    $('#confirm-go').onclick = async () => {
      if ($('#confirm-never').checked) { config.settings.warnOriginal = false; config = await window.api.saveConfig(config); }
      close(); window.api.openExternal(url);
    };
  }

  async function changeSize(which, d) {
    const key = which === 'paper' ? 'paperSize' : 'readerSize';
    const i = Math.max(0, Math.min(SIZES.length - 1, SIZES.indexOf(config.settings[key] || 'm') + d));
    if (SIZES[i] === (config.settings[key] || 'm')) return;
    config.settings[key] = SIZES[i];
    config = await window.api.saveConfig(config);
    if (which === 'paper') await renderEdition(edition, { startLabel: currentLabel(paper.book, paper.meta) });
    else { const v = reader.book.visible()[0] / Math.max(1, reader.pages.length); await openStory(reader.article.id); reader.book.show(Math.max(0, reader.book.viewOf(Math.floor(v * reader.pages.length)))); }
  }

  // ------------------------------------------------------------------ wiring
  function wire() {
    paper.book = new AG.Book($('#stage'));
    paper.book.onChange = updatePaperBar;
    reader.book = new AG.Book($('#rstage'));
    reader.book.onChange = updateReaderBar;

    const activate = (el) => {
      if (el.dataset.act === 'quiz') return answerQuiz(el);
      if (el.dataset.openUrl) return openOriginal(el.dataset.openUrl);
      if (el.dataset.openStory) return openStory(el.dataset.openStory);
      if (el.dataset.gotoPage != null) return paper.book.jump(Number(el.dataset.gotoPage));
    };
    paper.book.wire(activate);
    reader.book.wire(activate);
    const applyGestures = () => { paper.book.gestures = reader.book.gestures = !!config.settings.turnGestures; };
    applyGestures(); AG._applyGestures = applyGestures;

    $('#btn-generate').addEventListener('click', openNewsstand);
    $('#welcome-generate').addEventListener('click', generate);
    $('#ns-all').addEventListener('click', () => togglePick('all'));
    $('#ns-grid').addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) togglePick(b.dataset.pick); });
    $('#ns-close').addEventListener('click', closeNewsstand);
    $('#btn-sources').addEventListener('click', () => window.api.openSources());
    $('#welcome-sources').addEventListener('click', () => window.api.openSources());
    $('#btn-theme').addEventListener('click', async () => {
      config.settings.theme = config.settings.theme === 'day' ? 'night' : 'day';
      applyTheme(config.settings.theme);
      config = await window.api.saveConfig(config);
    });
    $('#btn-issues').addEventListener('click', (e) => { e.stopPropagation(); toggleIssues(); });
    $('#press-cancel').addEventListener('click', () => { cancelFlag = true; $('#press-title').textContent = 'Stopping…'; });

    $('#p-prev').addEventListener('click', () => paper.book.turn(-1));
    $('#p-next').addEventListener('click', () => paper.book.turn(1));
    $('#p-scrub').addEventListener('change', (e) => paper.book.jump(Number(e.target.value)));
    $('#p-sections').addEventListener('click', (e) => { const c = e.target.closest('[data-goto-page]'); if (c) paper.book.jump(Number(c.dataset.gotoPage)); });
    $('#p-smaller').addEventListener('click', () => changeSize('paper', -1));
    $('#p-larger').addEventListener('click', () => changeSize('paper', 1));

    $('#r-back').addEventListener('click', closeReader);
    $('#r-prev').addEventListener('click', () => readerTurn(-1));
    $('#r-next').addEventListener('click', () => readerTurn(1));
    $('#r-side-prev').addEventListener('click', () => readerTurn(-1));
    $('#r-side-next').addEventListener('click', () => readerTurn(1));
    $('#p-side-prev').addEventListener('click', () => paper.book.turn(-1));
    $('#p-side-next').addEventListener('click', () => paper.book.turn(1));
    $('#r-scrub').addEventListener('change', (e) => { if (config.settings.readerContinuous) { const { box, rows } = contRow(); const t = rows[Math.floor(Number(e.target.value) / cont.per)]; if (t) box.scrollTo({ top: t.offsetTop - 16 }); } else reader.book.jump(Number(e.target.value)); });
    $('#cont').addEventListener('scroll', () => { if (config.settings.readerContinuous) updateContBar(); }, { passive: true });
    $('#cont').addEventListener('click', (e) => { const act = e.target.closest('[data-open-url],[data-open-story]'); if (act) activate(act); });
    $('#r-cont').addEventListener('click', toggleCont);
    $('#r-why').addEventListener('click', showWhy);
    $('#why-close').addEventListener('click', () => $('#why').classList.add('hidden'));
    $('#r-prevstory').addEventListener('click', () => stepStory(-1));
    $('#r-nextstory').addEventListener('click', () => stepStory(1));
    $('#r-original').addEventListener('click', (e) => openOriginal(e.currentTarget.dataset.url));
    $('#r-up').addEventListener('click', () => thumb(1));
    $('#r-down').addEventListener('click', () => thumb(-1));
    $('#btn-all').addEventListener('click', () => edition && showAll());
    $('#all-close').addEventListener('click', () => $('#allstories').classList.add('hidden'));
    $('#all-list').addEventListener('click', (e) => { const r = e.target.closest('[data-all]'); if (r) { $('#allstories').classList.add('hidden'); openStory(r.dataset.all); } });

    // Zoom & fit-to-width
    const zoomUi = (which, book) => {
      const p = which === 'paper' ? 'p' : 'r';
      book.onZoom = (z) => { $(`#${p}-zoom`).textContent = `${Math.round(z * 100)}%`; $(`#${p}-zout`).disabled = z <= 1; $(`#${p}-zin`).disabled = z >= 2.5; };
      book.onZoom(1);
      const c = () => which === 'reader' && config.settings.readerContinuous;
      $(`#${p}-zin`).addEventListener('click', () => (c() ? contZoom(cont.zoom + 0.25) : book.setZoom(book.zoom + 0.25)));
      $(`#${p}-zout`).addEventListener('click', () => (c() ? contZoom(cont.zoom - 0.25) : book.setZoom(book.zoom - 0.25)));
      $(`#${p}-zoom`).addEventListener('click', () => (c() ? contZoom(1) : book.setZoom(1)));
      $(`#${p}-fit`).addEventListener('click', () => toggleFit(which));
    };
    zoomUi('paper', paper.book);
    zoomUi('reader', reader.book);
    $('#r-smaller').addEventListener('click', () => changeSize('reader', -1));
    $('#r-larger').addEventListener('click', () => changeSize('reader', 1));

    document.addEventListener('click', async (e) => {
      const ed = e.target.closest('[data-edition]');
      if (ed) {
        $('#issues-menu').classList.add('hidden');
        const loaded = await window.api.loadEdition(ed.dataset.edition);
        if (loaded) await renderEdition(loaded);
        return;
      }
      if (!e.target.closest('.menu-wrap')) $('#issues-menu').classList.add('hidden');
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, select, textarea')) return;
      if (!$('#welcome').classList.contains('hidden')) { if (e.key === 'Escape') closeNewsstand(); else if (e.key === 'Enter') generate(); return; }
      const inReader = !$('#readerview').classList.contains('hidden');
      const inPaper = !inReader && !$('#paperview').classList.contains('hidden');
      const book = inReader ? reader.book : inPaper ? paper.book : null;
      if (!book) return;
      if (!$('#why').classList.contains('hidden')) { if (e.key === 'Escape') $('#why').classList.add('hidden'); return; }
      if (isCont()) { // continuous reader: keys scroll; arrows step a row
        const box = $('#cont');
        if ([' ', 'PageDown'].includes(e.key)) { e.preventDefault(); box.scrollBy({ top: box.clientHeight * 0.85, behavior: 'smooth' }); }
        else if (e.key === 'PageUp') { e.preventDefault(); box.scrollBy({ top: -box.clientHeight * 0.85, behavior: 'smooth' }); }
        else if (e.key === 'ArrowRight') contStep(1); else if (e.key === 'ArrowLeft') contStep(-1);
        else if (e.key === 'Home') box.scrollTo({ top: 0 }); else if (e.key === 'End') box.scrollTo({ top: box.scrollHeight });
        else if (e.key === 'Escape') closeReader();
        else if (e.key === '+' || e.key === '=') contZoom(cont.zoom + 0.25); else if (e.key === '-') contZoom(cont.zoom - 0.25); else if (e.key === '0') contZoom(1);
        return;
      }
      // Space / Page Up / Page Down only ever scroll the page in view; they never change the page.
      if ([' ', 'PageDown'].includes(e.key)) { e.preventDefault(); if (book.scrollable()) book.stage.scrollBy({ top: book.stage.clientHeight * 0.85, behavior: 'smooth' }); }
      else if (e.key === 'PageUp') { e.preventDefault(); if (book.scrollable()) book.stage.scrollBy({ top: -book.stage.clientHeight * 0.85, behavior: 'smooth' }); }
      else if (['ArrowDown', 'ArrowUp'].includes(e.key)) { /* native scroll */ }
      else if (e.key === 'ArrowRight') { e.preventDefault(); book.turn(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); book.turn(-1); }
      else if (e.key === 'Home') book.jump(0);
      else if (e.key === 'End') book.jump(book.pages.length - 1);
      else if (e.key === 'Escape' && !$('#confirm').classList.contains('hidden')) $('#confirm-cancel').click();
      else if (e.key === 'Escape' && !$('#allstories').classList.contains('hidden')) $('#allstories').classList.add('hidden');
      else if (e.key === 'Escape' && inReader) closeReader();
      else if (e.key === '+' || e.key === '=') book.setZoom(book.zoom + 0.25);
      else if (e.key === '-' || e.key === '_') book.setZoom(book.zoom - 0.25);
      else if (e.key === '0') book.setZoom(1);
      else if (e.key.toLowerCase() === 'w') toggleFit(inReader ? 'reader' : 'paper');
    });

    // Images that fail to load: hide their frame (layout already reserved).
    document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') e.target.style.visibility = 'hidden'; }, true);

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(async () => {
        AG.paintStars();
        if (!edition) return;
        const wasReading = !$('#readerview').classList.contains('hidden');
        const label = currentLabel(paper.book, paper.meta);
        await renderEdition(edition, { startLabel: label });
        if (wasReading && reader.article) await openStory(reader.article.id);
      }, 350);
    });

    window.api.onConfigChanged(async (cfg) => {
      const moved = JSON.stringify(cfg.settings.location) !== JSON.stringify(config.settings.location);
      const pagesChanged = cfg.settings.maxPages !== config.settings.maxPages;
      config = cfg; applyTheme(cfg.settings.theme); refreshGenerateHint(); AG._applyGestures();
      if ((moved || pagesChanged) && edition) await renderEdition(edition, { startLabel: currentLabel(paper.book, paper.meta) }); // sky page follows the new place
    });
    window.api.onLearningReset(() => { B.reset(); learning.logs = {}; if (edition) renderEdition(edition); toast('Everything the paper had learned has been erased.'); });
    window.addEventListener('beforeunload', () => saveLearning(true));
  }

  async function boot() {
    config = await window.api.getConfig();
    const L = await window.api.getLearning();
    B.load(L?.state); learning.logs = L?.logs || {};
    B.sourceNames = Object.fromEntries(config.sources.map(s => [s.id, s.name]));
    applyTheme(config.settings.theme);
    wire();
    syncFitButtons();
    const saved = config.settings.lastPick; if (Array.isArray(saved) && saved.length) pick = new Set(saved);
    await refreshGenerateHint();
    const list = await window.api.listEditions();
    const latest = list[0] && await window.api.loadEdition(list[0].id);
    if (latest) await renderEdition(latest); else await openNewsstand();
  }
  boot();
})();
