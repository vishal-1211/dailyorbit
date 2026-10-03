/* Typesetting: turns an edition into fixed-size newspaper pages, and a story into book pages.
   Pages are laid out with CSS multi-column; we detect overflow and split paragraphs by word
   (DOM Range) so text flows column → column → page, exactly like print. */
(function () {
  const AG = window.AG;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  AG.esc = esc;
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  const SECTION_META = {
    front: { name: 'Front Page', tag: '' },
    sky: { name: 'Skywatching', tag: 'What’s up in the night sky' },
    solar: { name: 'Solar System', tag: 'Planets, moons, comets and our star' },
    missions: { name: 'Missions & Spaceflight', tag: 'Launches, spacecraft and the people who fly them' },
    deep: { name: 'Deep Space', tag: 'Stars, galaxies and the cosmos beyond' },
    frontiers: { name: 'Frontiers', tag: 'Discoveries, history and everything in between' },
    almanac: { name: 'The Almanac', tag: '' }
  };
  AG.SECTION_META = SECTION_META;

  const fmt = (t, o) => new Date(t).toLocaleString(undefined, o);
  const readMins = (w) => Math.max(1, Math.round((w || 0) / 230));
  AG.readMins = readMins;
  const roman = (n) => { const m = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of m) while (n >= v) { s += r; n -= v; } return s || 'I'; };

  // ------------------------------------------------------------------ hyphenation
  // Lightweight English syllable heuristic (V-CV / VC-CV, digraphs kept together) that
  // inserts soft hyphens so justified narrow columns don't get rivers.
  const KEEP = new Set(['th', 'ch', 'sh', 'ph', 'wh', 'ck', 'ng', 'qu', 'gh', 'tr', 'pl', 'pr', 'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tw', 'wr']);
  const isV = (c) => 'aeiouy'.includes(c);
  function hyphenateWord(w) {
    if (w.length < 7 || /^[A-Z]{2,}/.test(w)) return w;
    const lw = w.toLowerCase(); const breaks = [];
    for (let i = 0; i < lw.length;) {
      if (!isV(lw[i])) { i++; continue; }
      let j = i + 1; while (j < lw.length && !isV(lw[j])) j++;
      if (j >= lw.length) break;
      const cl = lw.slice(i + 1, j);
      let pos = -1;
      if (cl.length === 1) pos = i + 1;
      else if (cl.length === 2) pos = KEEP.has(cl) ? i + 1 : i + 2;
      else if (cl.length > 2) pos = KEEP.has(cl.slice(-2)) ? j - 2 : j - 1;
      const rest = lw.slice(pos);
      if (pos >= 3 && lw.length - pos >= 3 && !/^[^aeiouy]{1,2}e[ds]$/.test(rest)) breaks.push(pos);
      i = j;
    }
    if (!breaks.length) return w;
    let out = '', last = 0;
    for (const b of breaks) { out += w.slice(last, b) + '­'; last = b; }
    return out + w.slice(last);
  }
  function hyphenate(root) {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = tw.nextNode())) n.nodeValue = n.nodeValue.replace(/[A-Za-z]{7,}/g, hyphenateWord);
  }

  // ------------------------------------------------------------------ measuring & splitting
  const over = (el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;

  function boundaries(p) {
    const out = []; const tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { const re = /\s+/g; let m; while ((m = re.exec(n.nodeValue))) out.push({ node: n, offset: m.index }); }
    return out;
  }
  function cut(p, b, first) {
    const r = document.createRange();
    if (first) { r.setStart(p, 0); r.setEnd(b.node, b.offset); } else { r.setStart(b.node, b.offset); r.setEnd(p, p.childNodes.length); }
    const el = p.cloneNode(false);
    el.appendChild(r.cloneContents());
    if (first) { el.classList.add('split'); el.querySelector('.st-end')?.remove(); }
    else {
      el.classList.remove('first', 'split'); el.classList.add('cont');
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const t = tw.nextNode(); if (t) t.nodeValue = t.nodeValue.replace(/^\s+/, '');
    }
    return el;
  }
  /** Split paragraph p so the first part fits into container; returns [first, rest] or null. */
  function splitToFit(p, container, min = 6) {
    const b = boundaries(p);
    let lo = min, hi = b.length - min, best = -1;
    if (hi < lo) return null;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const part = cut(p, b[mid], true);
      container.appendChild(part);
      const ok = !over(container);
      part.remove();
      if (ok) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return best < 0 ? null : [cut(p, b[best], true), cut(p, b[best], false)];
  }

  /** Flow blocks through pages. newPage() returns {el, flow}; pages must be attached to measure. */
  function paginate(blocks, newPage) {
    const pages = [];
    let cur = newPage(0); pages.push(cur);
    const q = [...blocks];
    let guard = 0;
    while (q.length && guard++ < 5000) {
      const b = q.shift();
      cur.flow.appendChild(b);
      if (!over(cur.flow)) continue;
      cur.flow.removeChild(b);
      let parts = null;
      if (b.classList.contains('st-p')) parts = splitToFit(b, cur.flow);
      if (parts) { cur.flow.appendChild(parts[0]); q.unshift(parts[1]); }
      else {
        if (!cur.flow.children.length) { // doesn't fit even on an empty page: place it anyway
          cur.flow.appendChild(b); cur = newPage(pages.length); pages.push(cur); continue;
        }
        const carry = [];
        while (cur.flow.lastElementChild?.dataset.keep && cur.flow.children.length > 1) { carry.unshift(cur.flow.lastElementChild); cur.flow.lastElementChild.remove(); }
        q.unshift(...carry, b);
      }
      cur = newPage(pages.length); pages.push(cur);
    }
    // Drop a trailing empty page
    if (pages.length > 1 && !pages[pages.length - 1].flow.children.length) { pages.pop().el.remove(); }
    return pages;
  }

  /** Fill a fixed box with blocks; returns the blocks that didn't fit. */
  function fillBox(box, blocks) {
    const q = [...blocks];
    while (q.length) {
      const b = q[0];
      box.appendChild(b);
      if (!over(box)) { q.shift(); continue; }
      box.removeChild(b);
      if (b.classList.contains('st-p')) { const parts = splitToFit(b, box, 5); if (parts) { box.appendChild(parts[0]); q[0] = parts[1]; } }
      break;
    }
    while (box.lastElementChild?.dataset.keep) { q.unshift(box.lastElementChild); box.lastElementChild.remove(); }
    return q;
  }

  // ------------------------------------------------------------------ images
  AG.preloadImages = function (urls, timeout = 6000) {
    const map = new Map();
    return Promise.all([...new Set(urls.filter(Boolean))].map(u => new Promise(res => {
      const img = new Image(); img.referrerPolicy = 'no-referrer';
      const t = setTimeout(() => res(), timeout);
      img.onload = () => { clearTimeout(t); if (img.naturalWidth > 60) map.set(u, img.naturalWidth / img.naturalHeight); res(); };
      img.onerror = () => { clearTimeout(t); res(); };
      img.src = u;
    }))).then(() => map);
  };

  function figure(src, ratio, caption, cls = '') {
    const f = h('figure', `st-fig ${cls}`);
    const img = h('img'); img.src = src; img.alt = ''; img.referrerPolicy = 'no-referrer'; img.style.aspectRatio = String(ratio); img.draggable = false;
    f.appendChild(img);
    if (caption) f.appendChild(h('figcaption', null, esc(caption)));
    f.dataset.keep = '1';
    return f;
  }

  // ------------------------------------------------------------------ story → blocks
  function sameImage(a, b) {
    const k = (u) => { try { return new URL(u).pathname.split('/').pop().replace(/[-_]\d+x\d+(?=\.)/, ''); } catch { return u; } };
    return a && b && k(a) === k(b);
  }
  function bodyBlocks(a, ratios, { maxFigs = 1, reader = false } = {}) {
    const src = AG.sanitizeHtml(a.html || '', a.url);
    const out = []; let figs = 0;
    const addFig = (img, cap) => {
      const s = img.getAttribute('src'); if (!s || sameImage(s, a.image) || figs >= maxFigs || !ratios.has(s)) return;
      figs++; out.push(figure(s, ratios.get(s), cap || ''));
      out[out.length - 1].dataset.keep = '';
    };
    for (const n of [...src.children]) {
      const tag = n.tagName;
      if (tag === 'P') {
        n.querySelectorAll('img').forEach(img => { addFig(img); img.remove(); });
        if (n.textContent.trim().length < 2) continue;
        n.className = 'st-p'; out.push(n);
      } else if (/^H[234]$/.test(tag)) {
        const s = h('h5', 'st-sub'); s.textContent = n.textContent.trim(); s.dataset.keep = '1'; if (s.textContent) out.push(s);
      } else if (tag === 'FIGURE' || tag === 'IMG') {
        const img = tag === 'IMG' ? n : n.querySelector('img');
        if (img) addFig(img, n.querySelector?.('figcaption')?.textContent.trim());
      } else if (tag === 'BLOCKQUOTE') {
        n.className = 'st-quote'; out.push(n);
      } else if (tag === 'UL' || tag === 'OL') {
        [...n.children].forEach((li, i) => { const p = h('p', 'st-p li', (tag === 'OL' ? `${i + 1}. ` : '• ') + li.innerHTML); out.push(p); });
      } else if (reader && (tag === 'TABLE' || tag === 'PRE')) {
        n.classList.add('st-block'); out.push(n);
      }
    }
    const paras = out.filter(b => b.classList.contains('st-p'));
    if (paras[0]) paras[0].classList.add('first');
    if (paras.length) paras[paras.length - 1].insertAdjacentHTML('beforeend', '<span class="st-end">■</span>');
    for (const p of paras) hyphenate(p);
    return out;
  }

  function storyHead(a, { tier = 2, sectionName = '' } = {}) {
    const hd = h('div', `st-head tier${tier}`);
    hd.dataset.keep = '1'; hd.dataset.story = a.id;
    const when = fmt(a.published, { weekday: 'short', day: 'numeric', month: 'short' });
    hd.innerHTML = `
      <div class="st-kicker">${esc(a.source)}${sectionName ? ` <span>· ${esc(sectionName)}</span>` : ''}</div>
      <h3 class="st-hl" data-open-story="${a.id}">${esc(a.title)}</h3>
      ${tier === 1 && a.excerpt ? `<p class="st-deck">${esc(a.excerpt)}</p>` : ''}
      <div class="st-by">${a.author ? `By ${esc(a.author)} · ` : ''}${esc(when)} · ${a.partial ? 'Summary' : `${readMins(a.words)} min read`}</div>`;
    return hd;
  }

  // Every face must be loaded before measuring, or text reflows (and overflows) once it arrives.
  let fontsLoaded = null;
  AG.fontsReady = () => (fontsLoaded ||= Promise.all([...document.fonts].map(f => f.load().catch(() => null))).then(() => document.fonts.ready));

  AG._ts = { h, esc, fmt, readMins, roman, hyphenate, over };

  // ------------------------------------------------------------------ the book reader
  AG.typesetStory = async function (a, geom, host, next) {
    await AG.fontsReady();
    const scale = { s: 0.88, m: 1, l: 1.13, xl: 1.28 }[geom.size || 'm'] || 1;
    const fontPx = Math.max(13, Math.min(geom.fit ? 27 : 23, geom.pageH / 44)) * scale;
    host.replaceChildren();
    const ratios = await AG.preloadImages([a.image, ...[...AG.sanitizeHtml(a.html || '', a.url).querySelectorAll('img')].map(i => i.getAttribute('src'))]);
    const blocks = [];
    const hd = h('div', 'rd-head');
    hd.innerHTML = `<div class="st-kicker">${esc(AG.SECTION_META[a.section]?.name || '')} <span>· ${esc(a.source)}</span></div>
      <h1>${esc(a.title)}</h1>${a.excerpt ? `<p class="st-deck">${esc(a.excerpt)}</p>` : ''}
      <div class="st-by">${a.author ? `By <b>${esc(a.author)}</b> · ` : ''}${esc(fmt(a.published, { weekday: 'long', day: 'numeric', month: 'long' }))}</div>`;
    blocks.push(hd);
    if (a.image && ratios.has(a.image)) blocks.push(figure(a.image, ratios.get(a.image), a.source, 'hero'));
    if (a.partial) blocks.push(h('div', 'rd-note', `Only a summary was available. <a data-open-url="${esc(a.url)}">Read the full story at ${esc(a.source)} ↗</a>`));
    const body = bodyBlocks(a, ratios, { maxFigs: 20, reader: true });
    // Don't repeat the deck if it's just the first paragraph
    const firstP = body.find(b => b.classList.contains('st-p'));
    const norm = (s) => (s || '').replace(/[­…\s]+/g, ' ').trim().toLowerCase().slice(0, 50);
    if (firstP && a.excerpt && norm(firstP.textContent).startsWith(norm(a.excerpt).slice(0, 40))) hd.querySelector('.st-deck')?.remove();
    blocks.push(...body);
    const end = h('div', 'rd-end', `<div class="rd-orn">✦ ✦ ✦</div>${next ? `<button class="rd-next" data-open-story="${next.id}"><small>Next story</small><span>${esc(next.title)}</span></button>` : '<div class="rd-fin">End of edition</div>'}`);
    blocks.push(end);

    const pages = paginate(blocks, (i) => {
      const el = h('div', 'rd-page');
      el.style.setProperty('--pw', `${geom.pageW}px`); el.style.setProperty('--ph', `${geom.pageH}px`); el.style.setProperty('--rd-size', `${fontPx}px`);
      el.innerHTML = `<header class="rd-folio"><span>${esc(a.source)}</span><span>${esc(a.title)}</span></header><div class="rd-flow flow"></div><footer class="rd-foot"><span>Page 00 of 00</span><span>00 min left in story</span></footer>`;
      host.appendChild(el);
      return { el, flow: el.querySelector('.rd-flow') };
    });
    const n = pages.length;
    const total = AG.readMins(a.words);
    pages.forEach((p, i) => {
      const [l, r] = p.el.querySelectorAll('.rd-foot span');
      l.textContent = `Page ${i + 1} of ${n}`;
      const left = Math.round(total * (1 - (i + 1) / n));
      r.textContent = i === n - 1 ? 'End of story' : left < 1 ? 'Less than a minute left' : `${left} min left in story`;
      p.el.remove();
    });
    return pages.map(p => p.el);
  };
})();
