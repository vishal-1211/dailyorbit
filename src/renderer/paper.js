/* The paper: designed pages built automatically from whatever the edition holds, up to a page limit
   (24 by default, set in Sources). Cover · Top stories · Page 3 (people) · topic / section pages ·
   Instruments and Your sky (when Astronomy is in the paper) · Fun & games · Back page.
   A general paper gives each topic pages in proportion to how much the reader reads it, with at
   least one page for every topic that has news.
   Each story prints its opening paragraphs; the whole story opens in the reader. */
(function () {
  const AG = window.AG;
  const { h, esc, fmt, readMins, roman } = AG._ts;
  const APP_NAME = 'The Daily Orbit';
  const SEC = new Proxy({}, { get: (_t, k) => AG.sectionName(k) }); // section key → name
  const initials = (n) => n.replace(/[^\p{L} ]/gu, '').split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const dstr = (t, o) => new Date(t).toLocaleString(undefined, o);

  function fitClamps(root) {
    root.querySelectorAll('.clamp').forEach(el => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 18;
      el.style.maxHeight = '';
      const lines = Math.floor((el.clientHeight + 1) / lh);
      if (lines < 1) el.style.display = 'none'; else { el.style.webkitLineClamp = String(lines); el.style.maxHeight = `${lines * lh}px`; } // max-height: or the next line peeks out below the ellipsis
    });
  }
  /** Cards that are still too tall for their slot give up, in order: summary, headline lines, meta line. */
  function fitCards(root) {
    root.querySelectorAll('.card, .cv-hero').forEach(c => {
      const tooTall = () => c.scrollHeight > c.clientHeight + 2;
      if (!tooTall()) return;
      const sum = c.querySelector('.card-sum, .cv-hero p'), hl = c.querySelector('.card-hl, h2'), meta = c.querySelector('.card-meta');
      if (sum) sum.style.display = 'none';
      for (const n of [3, 2]) { if (!tooTall()) break; if (hl) { hl.style.display = '-webkit-box'; hl.style.webkitBoxOrient = 'vertical'; hl.style.overflow = 'hidden'; hl.style.webkitLineClamp = String(n); } }
      if (tooTall() && meta) meta.style.display = 'none';
      if (tooTall()) { const im = c.querySelector('.card-img'); if (im && c.classList.contains('v-tile')) im.style.maxHeight = '40%'; }
    });
  }
  /** Remove trailing items until the box no longer overflows. Returns how many were dropped. */
  function trimToFit(box, sel = ':scope > *') {
    let dropped = 0;
    while (box.scrollHeight > box.clientHeight + 1) { const items = box.querySelectorAll(sel); if (items.length <= 1) break; items[items.length - 1].remove(); dropped++; }
    return dropped;
  }

  AG.typesetPaper = async function (ed, geom, host, ctx = {}) {
    await AG.fontsReady();
    const B = AG.Brain, log = ctx.log || {};
    const scale = { s: 0.9, m: 1, l: 1.1, xl: 1.22 }[geom.size || 'm'] || 1;
    const fontPx = Math.max(11.5, Math.min(geom.fit ? 24 : 19, geom.pageH / 54)) * scale;
    host.style.setProperty('--pw', `${geom.pageW}px`); host.style.setProperty('--ph', `${geom.pageH}px`);
    host.replaceChildren();

    const ratios = await AG.preloadImages(ed.articles.map(a => a.image));
    const all = ed.articles.map(a => B.enrich(a));
    const img = (a) => (ratios.has(a.image) ? a.image : '');
    const main = all.filter(a => !a.dup);
    if (!ed.extras) ed.extras = AG.Extras.build(ed, main, { illum: AG.moonPhase(new Date(ed.until)).illum });
    const X = ed.extras, byId = new Map(all.map(a => [a.id, a]));
    const topics = ed.topics && ed.topics.length ? ed.topics : ['astronomy'];
    const general = ed.kind === 'all' || topics.length > 1, single = !general ? AG.topicById[topics[0]] : null;
    const hasAstro = topics.includes('astronomy'), hasInstr = hasAstro && X.instruments && X.instruments.feature;
    const FIXED_PAGES = 5 + (hasInstr ? 1 : 0) + (hasAstro ? 1 : 0); // front, top, people, fun, back (+ instruments, sky)
    const topicOf = (a) => AG.topicById[a.topic || AG.sectionTopic(a.section) || 'astronomy'] || AG.TOPICS[0];
    const kick = (a) => general ? `<b class="tp-dot" style="--tc:${topicOf(a).color}">${esc(topicOf(a).name)}</b> · ${esc(a.source)}<span> · ${esc(SEC[a.section] || '')}</span>` : `${esc(a.source)}<span> · ${esc(SEC[a.section] || '')}</span>`;
    const pages = [];
    const dateShort = fmt(ed.until, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const newPage = (key, name, short, cls = '') => {
      const el = h('div', `np-page mp ${cls}`);
      el.style.setProperty('--pw', `${geom.pageW}px`); el.style.setProperty('--ph', `${geom.pageH}px`); el.style.setProperty('--np-size', `${fontPx}px`);
      el.dataset.section = key;
      el.innerHTML = `<div class="np-body"></div><footer class="mp-foot"><span>${APP_NAME}</span><span class="mp-pn"></span><span>${esc(dateShort)}</span></footer>`;
      host.appendChild(el);
      pages.push({ el, key, name, short });
      return el.querySelector('.np-body');
    };
    const band = (title, sub = '') => `<header class="mp-band"><h2>${esc(title)}</h2>${sub ? `<span>${esc(sub)}</span>` : ''}</header>`;

    const card = (a, variant = 'text', { sum = true } = {}) => {
      const im = img(a), also = (a.alsoBy || []).map(x => x.source);
      const pic = im && variant !== 'text' ? `<div class="card-img"><img src="${esc(im)}" alt="" draggable="false"></div>` : '';
      return `<article class="card v-${variant} ${a.read ? 'is-read' : ''} ${im && variant !== 'text' ? 'has-img' : ''}" data-sec="${a.section}" data-topic="${topicOf(a).id}" style="--tc:${topicOf(a).color}" data-story="${a.id}" data-open-story="${a.id}">
        ${pic}
        <div class="card-body">
          <div class="st-kicker">${kick(a)}${a.variety ? '<i class="tag">Something different</i>' : ''}${(a.coverage || 1) > 1 ? '<i class="tag hot">Big story</i>' : ''}</div>
          <h3 class="card-hl">${esc(a.title)}</h3>
          ${sum ? `<p class="card-sum clamp">${esc(a.lede || a.summary || a.excerpt || '')}</p>` : ''}
          <div class="card-meta">${a.partial ? 'Summary only' : `Continue reading · ${readMins(a.words)} min`}${also.length ? ` · also in ${esc(also.slice(0, 2).join(', '))}` : ''}<b class="read-tick">✓ read</b></div>
        </div>
      </article>`;
    };

    // ---------------------------------------------------------------- story allocation
    const pool = [...main];
    const take = (pred) => { const i = pool.findIndex(pred); return i < 0 ? null : pool.splice(i, 1)[0]; };
    const hero = take(a => img(a) && !a.partial) || take(() => true);
    const coverRow = []; for (let i = 0; i < (geom.pageW / (Math.max(11.5, Math.min(geom.fit ? 24 : 19, geom.pageH / 54)) * scale) >= 30 ? 3 : 2); i++) { const a = take(x => img(x)) || take(() => true); if (a) coverRow.push(a); }
    // How much fits depends on the page: count lines of body text available.
    const linesTall = geom.pageH / fontPx, colsWide = geom.pageW / fontPx;
    const maxPages = Math.max(8, Math.min(30, Number(ctx.maxPages) || 24));
    const nSide = linesTall >= 50 ? 3 : 2, SLOTS = 4; // fewer stories per page, more of each story
    const top = []; for (let i = 0; i < 1 + nSide; i++) { const a = take(() => true); if (a) top.push(a); }
    // Instruments page claims its related stories (if still unplaced)
    const instIds = hasInstr ? [...(X.instruments.stories || []), ...(X.instruments.news || [])] : [];
    const instStories = instIds.slice(0, 2).map(id => { const i = pool.findIndex(a => a.id === id); return i < 0 ? null : pool.splice(i, 1)[0]; }).filter(Boolean).slice(0, 2);
    const placedElsewhere = instIds.map(id => byId.get(id)).filter(a => a && !instStories.includes(a)).slice(0, 2 - instStories.length);
    // Sections: keep section order, best first inside each
    const secOrder = AG.SECTION_ORDER.map(x => x.key);
    // Topic order: the topics this reader reads most come first (the paper's own order breaks ties).
    const topicRank = [...topics].sort((x, y) => (B.topicAffinity(y) - B.topicAffinity(x)) || (AG.TOPICS.findIndex(t => t.id === x) - AG.TOPICS.findIndex(t => t.id === y)));
    const tIdx = (a) => { const i = topicRank.indexOf(topicOf(a).id); return i < 0 ? 99 : i; };
    const sectionStories = pool.sort((a, b) => (tIdx(a) - tIdx(b)) || (secOrder.indexOf(a.section) - secOrder.indexOf(b.section))).splice(0);
    let briefs = pool; // whatever is left

    // ---------------------------------------------------------------- 1 · cover
    const tonight = ctx.sky?.tonight, moon = AG.moonPhase(new Date());
    const nextBig = (ctx.sky?.events || []).find(e => e.when > Date.now() && e.kind !== 'moon' && e.visible && !e.far);
    {
      const b = newPage('front', 'Front page', 'Front', 'cover');
      const hi = hero && img(hero);
      b.innerHTML = `
        <header class="cv-mast">
          <div class="cv-top"><span>No. ${ed.number || 1} · Vol. ${roman(Math.max(1, new Date(ed.until).getFullYear() - 2025))}</span><span>${esc(fmt(ed.since, { day: 'numeric', month: 'short' }))} – ${esc(fmt(ed.until, { day: 'numeric', month: 'short' }))} · ${main.length} stories</span></div>
          <h1 class="cv-name"><span>Daily</span><i class="orb"></i><span>Orbit</span></h1>
          ${single ? `<div class="cv-edition" style="--tc:${single.color}">${single.icon} ${esc(single.name)} edition</div>` : `<div class="cv-edition all">${topics.map(id => AG.topicById[id]).filter(Boolean).map(t => `<i style="--tc:${t.color}">${t.icon} ${esc(t.name)}</i>`).join('')}</div>`}
          <div class="cv-date">${esc(fmt(ed.until, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</div>
        </header>
        ${hero ? `<article class="cv-hero ${hi ? 'has-img' : 'no-img'} ${hero.read ? 'is-read' : ''}" data-story="${hero.id}" data-open-story="${hero.id}" data-sec="${hero.section}">
          ${hi ? `<img src="${esc(hi)}" alt="" draggable="false">` : ''}
          <div class="cv-hero-text"><div class="st-kicker">${kick(hero)}${(hero.coverage || 1) > 1 ? '<i class="tag hot">Big story</i>' : ''}</div>
            <h2>${esc(hero.title)}</h2><p class="clamp">${esc(hero.lede || hero.summary || hero.excerpt || '')}</p><div class="card-meta">${readMins(hero.words)} min read<b class="read-tick">✓ read</b></div></div>
        </article>` : ''}
        <div class="cv-row n${coverRow.length}">${coverRow.map(a => card(a, 'tile')).join('')}</div>
        <div class="cv-foot">
          <div class="cv-tonight" data-goto-key="sky">${AG.moonSvg(tonight ? tonight.f : moon.f, Math.round(fontPx * 3.4))}
            <div><div class="st-kicker">Tonight${ctx.location ? ` · ${esc(ctx.location.name)}` : ''}</div><b>${esc(tonight ? tonight.phase : moon.name)}</b>
            <span>${tonight?.planets?.length ? esc(tonight.planets.slice(0, 2).map(p => `${p.name} ${p.when === 'evening' ? 'this evening' : 'before dawn'}`).join(' · ')) : `${Math.round((tonight ? tonight.illum : moon.illum) * 100)}% lit`}</span>
            ${nextBig ? `<em>Next: ${esc(nextBig.title)}, ${esc(dstr(nextBig.when, { day: 'numeric', month: 'short' }))}</em>` : ''}</div></div>
          <div class="cv-inside fit-list" id="cv-inside"></div>
        </div>`;
    }

    { // fit the nameplate to the page width
      const name = pages[0].el.querySelector('.cv-name'); let fs = geom.pageW * 0.11; name.style.fontSize = `${fs}px`;
      while (name.scrollWidth > name.clientWidth + 1 && fs > 16) { fs -= 1; name.style.fontSize = `${fs}px`; }
    }

    // ---------------------------------------------------------------- 2 · top stories
    if (top.length) {
      const b = newPage('top', 'Top stories', 'Top stories');
      const [lead, ...rest] = top;
      b.innerHTML = `${band('Top stories', 'Chosen for you from this edition')}
        <div class="tp-grid">
          <div class="tp-lead">${card(lead, 'feature')}</div>
          <div class="tp-side">${rest.map(a => card(a, 'side')).join('')}</div>
        </div>
        ${X.numbers?.length ? `<div class="num-strip">${X.numbers.slice(0, 4).map(n => `<div class="num" data-open-story="${n.storyId}"><b>${esc(n.value)}</b><i>${esc(n.unit)}</i><span class="clamp">${esc(n.label)}</span></div>`).join('')}</div>` : ''}`;
    }

    // ---------------------------------------------------------------- 3 · people
    {
      const b = newPage('people', 'Page 3 · People', 'People');
      const P = X.people, s = P.star;
      const more = AG.Content.PEOPLE.filter(p => p.id !== s.id && topics.includes(p.topic || 'astronomy')).sort((x, y) => ((x.id.charCodeAt(1) * (ed.number || 1)) % 17) - ((y.id.charCodeAt(1) * (ed.number || 1)) % 17)).slice(0, 6);
      b.innerHTML = `${band('Page 3', single ? `People of ${single.name.toLowerCase()}` : 'People in the news and in the history books')}
        <div class="pp-star"><div class="pp-avatar">${esc(initials(s.name))}</div>
          <div><div class="st-kicker">${s.birthday ? 'Born this week' : 'Star of the edition'}</div><h3>${esc(s.name)}</h3><div class="pp-role">${esc(s.role)} · ${esc(s.years)}</div><p>${esc(s.bio)}</p></div></div>
        <div class="pp-list fit-list">
          ${P.quoted.length ? `<div class="pp-h">In their own words</div>` : ''}
          ${P.quoted.map(q => `<blockquote class="pp-quote" data-open-story="${q.storyId}"><p>“${esc(q.quote)}”</p><footer><b>${esc(q.who)}</b>${q.role ? `, ${esc(q.role)}` : ''}<i>Read the story ›</i></footer></blockquote>`).join('')}
          ${P.inNews.length ? `<div class="pp-h">Also in this edition</div>${P.inNews.map(n => `<div class="pp-news" data-open-story="${n.storyId}"><b>${esc(n.person.name)}</b> appears in “${esc(n.storyTitle)}” ›</div>`).join('')}` : ''}
          <div class="pp-h">From the hall of fame</div>
          ${more.map(p => `<div class="pp-mini"><div class="pp-avatar sm">${esc(initials(p.name))}</div><div><b>${esc(p.name)}</b> <span>${esc(p.years)}</span><p>${esc(p.bio)}</p></div></div>`).join('')}
        </div>
        ${X.onThisDay?.length ? `<div class="otd"><div class="st-kicker">On this day in space</div>${X.onThisDay.slice(0, 2).map(o => `<p><b>${esc(o.date)}</b> ${esc(o.text)}</p>`).join('')}</div>` : ''}`;
    }

    // ---------------------------------------------------------------- sections / topics
    /** Lay `list` out over at most `maxN` pages. Returns how many stories were placed. */
    const fillPages = (list, maxN, { key = 'sections', topic = null } = {}) => {
      let i = 0, pageNo = 0;
      while (i < list.length && pageNo < maxN) {
        if (pageNo > 0 && list.length - i <= 2) break; // don't open a nearly empty page: these go to "In brief"
        const chunk = []; let used = 0;
        while (i < list.length) {
          const a = list[i], feature = chunk.length === 0 && !!img(a), cost = feature ? 2 : 1;
          if (used + cost > SLOTS) break;
          chunk.push([a, feature]); used += cost; i++;
        }
        const names = [...new Set(chunk.map(([a]) => SEC[a.section]))];
        const title = topic ? `${topic.icon} ${topic.name}` : names.slice(0, 3).join(' · ');
        const b = newPage(key, topic ? `${topic.name} · ${names.join(', ')}` : names.join(' · '), topic ? topic.name : (names.length > 2 ? 'Sections' : names.join(' & ')), topic ? 'topic-page' : '');
        if (topic) { b.parentElement.style.setProperty('--tc', topic.color); b.parentElement.dataset.topic = topic.id; }
        b.innerHTML = `${band(title, topic ? names.join(' · ') : '')}<div class="sec-grid rows${Math.ceil(used / 2)} of${SLOTS / 2}">${chunk.map(([a, f]) => card(a, f ? 'wide' : (img(a) ? 'side' : 'text'))).join('')}</div>`;
        pageNo++;
      }
      return i;
    };
    {
      const budget = Math.max(1, maxPages - FIXED_PAGES);
      if (!general) {
        const n = fillPages(sectionStories, budget);
        briefs = [...sectionStories.slice(n), ...briefs];
      } else {
        // Page budget per topic: one page for every topic with news first, then the rest by
        // (how much the reader reads the topic) × (how much news it has).
        const groups = topicRank.map(id => ({ t: AG.topicById[id], list: sectionStories.filter(a => topicOf(a).id === id) })).filter(g => g.t && g.list.length);
        const weight = (g) => Math.max(0.35, Math.min(3, 1 + 2.5 * B.topicAffinity(g.t.id)));
        const cap = (g) => Math.max(1, Math.ceil(g.list.length / 3));
        const count = new Map(); let left = budget;
        for (const g of groups) if (left > 0) { count.set(g, 1); left--; }
        while (left > 0) {
          let best = null, bs = 0;
          for (const g of groups) { const c = count.get(g) || 0; if (!c || c >= cap(g)) continue; const sc = weight(g) * g.list.length / (c + 1); if (sc > bs) { bs = sc; best = g; } }
          if (!best) break; count.set(best, count.get(best) + 1); left--;
        }
        const rest = [];
        for (const g of groups) { const n = count.get(g) ? fillPages(g.list, count.get(g), { key: `t-${g.t.id}`, topic: g.t }) : 0; rest.push(...g.list.slice(n)); }
        briefs = [...rest, ...briefs];
      }
    }

    // ---------------------------------------------------------------- instruments
    if (hasInstr) {
      const b = newPage('instruments', 'Great instruments', 'Instruments');
      const I = X.instruments, f = I.feature, linked = [...instStories, ...placedElsewhere];
      b.innerHTML = `${band('Eyes on the sky', 'Great optical instruments')}
        <div class="in-feature"><div class="st-kicker">${esc(f.kind)}</div><h3>${esc(f.name)}</h3>
          <div class="in-specs"><div><i>Size</i><b>${esc(f.size)}</b></div><div><i>Where</i><b>${esc(f.where)}</b></div><div><i>Since</i><b>${esc(f.since)}</b></div></div>
          <p>${esc(f.blurb)}</p></div>
        ${linked.length ? `<div class="in-news"><div class="pp-h">In this edition</div>${linked.map(a => card(a, 'side', { sum: true })).join('')}</div>` : ''}
        <div class="in-more fit-list"><div class="pp-h">More great instruments</div>${I.others.map(o => `<div class="in-mini"><b>${esc(o.name)}</b><span>${esc(o.size)} · ${esc(o.where)}</span><p>${esc(o.blurb)}</p></div>`).join('')}</div>`;
    }

    // ---------------------------------------------------------------- fun & games
    {
      const b = newPage('fun', 'Fun & games', 'Fun');
      const answered = log._quiz || {};
      b.innerHTML = `${band('Fun & games', 'Quiz, facts and a laugh')}
        <div class="fun-grid">
          <section class="quiz fit-list"><div class="pp-h">The Orbit quiz <span id="quiz-score"></span></div>
            ${X.quiz.map((q, qi) => { const a = answered[q.id]; return `<div class="qz ${a != null ? 'done' : ''}" data-q="${qi}"><p class="qz-q"><b>${qi + 1}.</b> ${esc(q.q)}</p>
              <div class="qz-opts">${q.options.map((o, oi) => `<button class="qz-o ${a != null && oi === q.answer ? 'right' : ''} ${a === oi && oi !== q.answer ? 'wrong' : ''}" data-act="quiz" data-q="${qi}" data-o="${oi}">${esc(o)}</button>`).join('')}</div>
              <p class="qz-note">${esc(q.note || '')}${q.storyId ? ` <a data-open-story="${q.storyId}">Read it ›</a>` : ''}</p></div>`; }).join('')}
          </section>
          <section class="fun-side fit-list">
            <div class="fun-block"><div class="pp-h">Did you know?</div>${X.didYouKnow.map(f => `<p class="dyk" ${f.storyId ? `data-open-story="${f.storyId}"` : ''}>${esc(f.text)}${f.storyId ? ` <i>${esc(f.source)} ›</i>` : ''}</p>`).join('')}</div>
            ${X.memes.map(m => `<div class="meme"><div class="meme-emoji">${m.emoji}</div><p>${esc(m.top)}</p><p class="meme-b">${esc(m.bottom)}</p></div>`).join('')}
            <div class="meme-more" data-open-url="${esc((X.memeLink || AG.Extras.MEME_LINK).url)}">${esc((X.memeLink || AG.Extras.MEME_LINK).label)} ↗</div>
            <div class="fun-block"><div class="pp-h">Fun facts</div>${X.funFacts.map(f => `<p class="dyk">${esc(f.text)}</p>`).join('')}</div>
          </section>
        </div>`;
    }

    // ---------------------------------------------------------------- your sky
    if (hasAstro) {
      const b = newPage('sky', 'Your sky', 'Your sky');
      const sky = ctx.sky, loc = ctx.location;
      const tm = (d) => (d ? dstr(d, { hour: 'numeric', minute: '2-digit' }) : '—');
      const now = Date.now();
      const soon = (sky?.events || []).filter(e => e.when > now - 36e5 && !e.far && e.when - now < 80 * 864e5);
      // Most important first (so the page keeps a mix when space runs out); re-sorted by date after fitting.
      const KW = { eclipse: 3, occ: 3, iss: 2.6, conj: 2, shower: 2, flyby: 1.6, moon: 1 }, seenKind = {};
      for (const e of soon) { const n = (seenKind[e.kind] = (seenKind[e.kind] || 0) + 1); e._pri = (e.big ? 3 : 0) + (KW[e.kind] || 1) - (n - 1) * 1.3 - (e.when - now) / (25 * 864e5); }
      soon.sort((x, y) => y._pri - x._pri);
      const far = (sky?.events || []).filter(e => e.far || e.when - now >= 80 * 864e5);
      const t = sky?.tonight;
      b.innerHTML = `${band('Your sky', loc ? `As seen from ${loc.name}` : 'Set your location in Sources')}
        ${t ? `<div class="sk-top">${AG.moonSvg(t.f, Math.round(geom.pageW * 0.17))}
          <div class="sk-moon"><div class="st-kicker">Tonight’s Moon</div><h3>${esc(t.phase)}</h3><p>${Math.round(t.illum * 100)}% lit · rises ${esc(tm(t.moonrise))} · sets ${esc(tm(t.moonset))}</p><p>Sunset ${esc(tm(t.sunset))} · Sunrise ${esc(tm(t.sunrise))}</p></div>
          <div class="sk-planets"><div class="st-kicker">Planets to spot</div>${t.planets.length ? t.planets.map(p => `<div><b>${esc(p.name)}</b> ${p.when === 'evening' ? 'after sunset' : 'before dawn'}, ${esc(p.where)}</div>`).join('') : '<div>None well placed tonight.</div>'}</div></div>` : '<p class="sk-none">Sky events could not be calculated.</p>'}
        <div class="pp-h">Coming up</div>
        <div class="sk-list fit-list" data-sort="1">${soon.map(e => `<div class="sk-ev ${e.big ? 'big' : ''} k-${e.kind}" data-when="${e.when}"><div class="sk-date"><b>${esc(dstr(e.when, { day: 'numeric' }))}</b><i>${esc(dstr(e.when, { month: 'short' }))}</i></div><div class="sk-icon">${e.icon}</div><div class="sk-txt"><b>${esc(e.title)}</b> <time>${esc(dstr(e.when, { weekday: 'short', hour: 'numeric', minute: '2-digit' }))}</time>${e.detail ? `<p>${esc(e.detail)}</p>` : ''}</div></div>`).join('')}</div>
        <div class="sk-far">${sky?.issState === 'old' ? '<p>🛰️ Space-station passes need fresh orbit data: print a new edition to update them.</p>' : sky?.issState === 'none' ? '<p>🛰️ Space-station passes will appear after your next printed edition.</p>' : ''}
          ${far.slice(0, 4).map(e => `<p>${e.icon} <b>${esc(dstr(e.when, { day: 'numeric', month: 'short', year: 'numeric' }))}</b> ${esc(e.title)}</p>`).join('')}
          <p class="sk-note">Worked out on your laptop for ${loc ? esc(loc.name) : 'your location'}; times use your laptop’s clock.</p></div>`;
    }

    // ---------------------------------------------------------------- back page
    {
      const b = newPage('back', 'Back page', 'Back page');
      const ex = B.explain(), mat = B.maturity();
      const windowText = ed.mode === 'first' ? `Your first edition: the best of the past ${ed.windowDays} days.`
        : ed.mode === 'capped' ? `You were away ${Math.round(ed.gapDays)} days. To spare you the backlog, this edition covers only the last ${ed.windowDays}.`
          : `Everything published since your previous edition on ${fmt(ed.since, { weekday: 'long', hour: 'numeric', minute: '2-digit' })}.`;
      const stats = (ed.stats || []).map(s => `<li class="${s.status === 'error' ? 'bad' : ''}"><span>${esc(s.name)}</span><i>${s.status === 'error' ? 'unavailable' : `${s.used}${s.paywalled ? ` · ${s.paywalled} paywalled` : ''}`}</i></li>`).join('');
      b.innerHTML = `${band(briefs.length ? 'In brief' : 'Back page', briefs.length ? `${briefs.length} more ${briefs.length === 1 ? 'story' : 'stories'}` : '')}
        ${briefs.length ? `<div class="br-list fit-list">${briefs.map(a => `<div class="br ${a.read ? 'is-read' : ''}" data-story="${a.id}" data-open-story="${a.id}"><b>${esc(a.title)}</b><span>${esc(a.source)} · ${readMins(a.words)} min<b class="read-tick">✓</b></span></div>`).join('')}</div>` : ''}
        <div class="bk-cols">
          <div><div class="pp-h">About this edition</div><p>${esc(windowText)}</p><p>${main.length} stories from ${new Set(main.map(a => a.sourceId)).size} publishers. Paywalled stories are skipped; the same story from several publishers is merged.</p>
            <div class="pp-h">What your paper has learned</div>
            <p>${mat < 0.1 ? 'Nothing yet. Open the stories you like, and tap 👍 or 👎 in the reader; the next edition starts adapting.' : `${ex.lessons} lessons so far, and ${ex.words.toLocaleString()} words picked up from its reading.${general ? ` Topics you read most: ${esc(topicRank.slice(0, 3).map(id => AG.topicById[id]?.name).join(', '))}.` : ''}`}</p>
            ${ex.likes.length ? `<div class="chips">${ex.likes.slice(0, 8).map(l => `<span>${esc(l)}</span>`).join('')}</div>` : ''}
            <p class="sk-note">About one story in five is deliberately outside your usual taste. All of this stays on your laptop.</p></div>
          <div><div class="pp-h">Sources</div><ul class="al-src fit-list">${stats}</ul></div>
        </div>
        <div class="al-colophon">Printed for Vishal · ${APP_NAME} ◉</div>`;
    }

    // ---------------------------------------------------------------- finish: numbers, index, fitting
    if (pages.length > maxPages) pages.splice(maxPages).forEach(p => p.el.remove());
    pages.forEach((p, i) => { p.label = String(i + 1); p.el.dataset.label = p.label; p.el.querySelector('.mp-pn').textContent = `${i + 1}`; });
    const inside = pages[0].el.querySelector('#cv-inside');
    const seenKey = new Set();
    inside.innerHTML = `<div class="st-kicker">Inside</div>` + pages.slice(1).filter(p => !seenKey.has(p.key) && seenKey.add(p.key)).map(p => `<div data-goto-page="${pages.indexOf(p)}"><b>${pages.indexOf(p) + 1}</b>${esc(p.key === 'sections' ? 'Sections' : p.short)}</div>`).join('');
    pages[0].el.querySelectorAll('[data-goto-key]').forEach(e => { const i = pages.findIndex(p => p.key === e.dataset.gotoKey); if (i >= 0) e.dataset.gotoPage = i; });
    const dropped = [];
    for (const p of pages) {
      [...p.el.querySelectorAll('.fit-list')].reverse().forEach(l => trimToFit(l, l.classList.contains('br-list') ? '.br' : l.classList.contains('sk-list') ? '.sk-ev' : l.classList.contains('quiz') ? '.qz' : ':scope > *'));
      p.el.querySelectorAll('.fit-list[data-sort]').forEach(l => [...l.children].sort((x, y) => Number(x.dataset.when) - Number(y.dataset.when)).forEach(c => l.appendChild(c)));
      fitClamps(p.el); fitCards(p.el); fitClamps(p.el);
    }
    { // say plainly how many briefs made it onto the page
      const back = pages[pages.length - 1].el, n = back.querySelectorAll('.br').length, sub = back.querySelector('.mp-band span');
      if (sub && briefs.length) sub.textContent = n < briefs.length ? `${n} of ${briefs.length} more stories · the rest are in “All stories”` : `${n} more ${n === 1 ? 'story' : 'stories'}`;
    }
    // Every story must be reachable from the paper: anything trimmed from "In brief" is reported.
    const shown = new Set(); pages.forEach(p => p.el.querySelectorAll('[data-story]').forEach(e => shown.add(e.dataset.story)));
    for (const a of main) if (!shown.has(a.id)) dropped.push(a.id);
    for (const p of pages) p.el.remove();
    return { pages: pages.map(p => p.el), meta: pages.map(({ label, key, name, short }) => ({ label, key, name, short })), hidden: dropped };
  };
})();
