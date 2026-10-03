/* Article extraction + paywall detection + HTML sanitising.
   A compact "readability"-style extractor that runs on the browser DOM. */
(function () {
  const AG = (window.AG = window.AG || {});

  // ---------------------------------------------------------------- sanitiser
  const ALLOWED = new Set(['P', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'FIGURE', 'FIGCAPTION', 'IMG',
    'A', 'EM', 'STRONG', 'B', 'I', 'BR', 'HR', 'PRE', 'CODE', 'SUP', 'SUB', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH', 'CAPTION', 'SPAN', 'SMALL']);
  const DROP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA',
    'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'NAV', 'ASIDE', 'FOOTER', 'HEADER', 'DIALOG', 'TEMPLATE', 'LINK', 'META', 'MENU']);
  const MAP = { H1: 'H2', H5: 'H4', H6: 'H4', DIV: 'P', SECTION: 'P', ARTICLE: 'P', MAIN: 'P' };

  function bestImgSrc(img, base) {
    const cand = img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original') || img.getAttribute('src') || '';
    let src = cand;
    const srcset = img.getAttribute('data-srcset') || img.getAttribute('srcset');
    if ((!src || src.startsWith('data:')) && srcset) src = srcset.split(',').pop().trim().split(/\s+/)[0];
    if (!src || src.startsWith('data:')) return '';
    try { return new URL(src, base).href; } catch { return ''; }
  }

  function sanitizeNode(node, base, outDoc) {
    if (node.nodeType === 3) return outDoc.createTextNode(node.textContent);
    if (node.nodeType !== 1) return null;
    let tag = node.tagName.toUpperCase();
    if (DROP.has(tag)) return null;
    if (tag === 'PICTURE') { const img = node.querySelector('img'); return img ? sanitizeNode(img, base, outDoc) : null; }

    const children = () => { const f = outDoc.createDocumentFragment(); for (const c of node.childNodes) { const s = sanitizeNode(c, base, outDoc); if (s) f.appendChild(s); } return f; };

    // Block-ish wrappers: if they contain block children, unwrap; otherwise make a paragraph.
    if (MAP[tag] && (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE' || tag === 'MAIN')) {
      const hasBlock = node.querySelector('p,div,section,figure,ul,ol,h1,h2,h3,h4,h5,h6,blockquote,table,pre,img');
      if (hasBlock) return children();
    }
    if (MAP[tag]) tag = MAP[tag];
    if (!ALLOWED.has(tag)) return children(); // unwrap unknown tags, keep their text

    if (tag === 'IMG') {
      const src = bestImgSrc(node, base);
      if (!src || /(pixel|spacer|1x1|tracking|gravatar|avatar|logo)/i.test(src)) return null;
      const w = parseInt(node.getAttribute('width') || '0', 10);
      if (w && w < 80) return null;
      const img = outDoc.createElement('img');
      img.setAttribute('src', src);
      img.setAttribute('alt', (node.getAttribute('alt') || '').slice(0, 300));
      img.setAttribute('loading', 'lazy');
      return img;
    }
    const el = outDoc.createElement(tag);
    if (tag === 'A') {
      const href = node.getAttribute('href') || '';
      try { const abs = new URL(href, base).href; if (/^https?:/.test(abs)) el.setAttribute('href', abs); } catch { /* skip */ }
    }
    if (tag === 'TD' || tag === 'TH') { const cs = node.getAttribute('colspan'); if (cs && /^\d+$/.test(cs)) el.setAttribute('colspan', cs); }
    el.appendChild(children());
    return el;
  }

  function tidy(root) {
    // Remove empty paragraphs/spans and collapse nested paragraphs.
    root.querySelectorAll('p p').forEach(p => p.replaceWith(...p.childNodes));
    root.querySelectorAll('p, span, li, h2, h3, h4, figure, blockquote, a').forEach(el => {
      if (!el.textContent.trim() && !el.querySelector('img')) el.remove();
    });
    root.querySelectorAll('span').forEach(s => s.replaceWith(...s.childNodes));
    // Link-dense short blocks ("Related stories", tag lists)
    root.querySelectorAll('p, ul, ol').forEach(el => {
      const t = el.textContent.trim().length;
      if (!t) return;
      const linkT = [...el.querySelectorAll('a')].reduce((n, a) => n + a.textContent.trim().length, 0);
      if (t < 280 && linkT / t > 0.6) el.remove();
    });
    // Boilerplate phrases
    root.querySelectorAll('p').forEach(p => {
      const t = p.textContent.trim();
      if (t.length < 200 && /^(read more|related|advertisement|sign up|subscribe|share this|follow us|continue reading|the post .* appeared first on)/i.test(t)) p.remove();
    });
  }

  AG.sanitizeHtml = function (html, base) {
    const src = typeof html === 'string' ? new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body : html;
    const outDoc = document.implementation.createHTMLDocument('');
    const wrap = outDoc.createElement('div');
    for (const c of src.childNodes) { const s = sanitizeNode(c, base, outDoc); if (s) wrap.appendChild(s); }
    // Top-level loose text/inline nodes → wrap into paragraphs.
    const inline = [];
    const flush = () => { if (!inline.length) return; const p = outDoc.createElement('p'); inline[0].before(p); inline.forEach(n => p.appendChild(n)); inline.length = 0; };
    for (const n of [...wrap.childNodes]) {
      const block = n.nodeType === 1 && /^(P|H2|H3|H4|UL|OL|BLOCKQUOTE|FIGURE|IMG|HR|PRE|TABLE)$/.test(n.tagName);
      if (block) flush(); else if (n.nodeType === 3 && !n.textContent.trim()) continue; else inline.push(n);
    }
    flush();
    tidy(wrap);
    return wrap;
  };

  // ---------------------------------------------------------------- paywall
  const PAYWALL_CLASS = /\b(paywall|piano-(?:offer|paywall|template)|tp-(?:modal|container)|subscriber-only|subscribers-only|premium-(?:content|article|lock)|meteredContent|regwall|article-locked|locked-content|gated-content|member-only|members-only)\b/i;

  function checkPaywall(doc) {
    // 1) Structured data: isAccessibleForFree = false
    for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
      const raw = s.textContent || '';
      if (/"isAccessibleForFree"\s*:\s*(false|"false"|"False")/i.test(raw)) return { hard: true, reason: 'Marked subscriber-only by the publisher' };
    }
    // 2) Meta content tier
    const tier = doc.querySelector('meta[property="article:content_tier"], meta[name="article:content_tier"]');
    if (tier && /locked/i.test(tier.getAttribute('content') || '')) return { hard: true, reason: 'Locked content tier' };
    // 3) Paywall markup (only a signal; combined with thin text below)
    const marker = [...doc.querySelectorAll('[class],[id]')].some(el => PAYWALL_CLASS.test(`${el.className} ${el.id}`));
    return { hard: false, marker };
  }

  // ---------------------------------------------------------------- extractor
  const CONTENT_SELECTORS = [
    '[itemprop="articleBody"]', '.entry-content', '.post-content', '.article-body', '.article__body', '.article-content',
    '.story-body', '.c-article-body', '.wysiwyg', '.post-body', '.single-post-content', '.body-content',
    '.news-content', '.release-body', '.page-content article', 'article .content', '#article-body', 'article', 'main'
  ];
  const UNLIKELY = /(comment|share|social|related|newsletter|promo|advert|\bads?\b|sponsor|sidebar|breadcrumb|subscribe|popup|modal|cookie|consent|author-bio|widget|signup|recommend|more-stories|trending|toolbar|pagination|skip-link)/i;

  function textLen(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim().length; }

  function stripUnlikely(root) {
    root.querySelectorAll('script,style,noscript,iframe,form,nav,footer,aside,button,svg,header').forEach(e => e.remove());
    root.querySelectorAll('[class],[id],[role]').forEach(el => {
      if (!el.isConnected) return;
      const sig = `${typeof el.className === 'string' ? el.className : ''} ${el.id} ${el.getAttribute('role') || ''}`;
      if (UNLIKELY.test(sig) && !/(article|content|body|entry|post-?text)/i.test(sig) && textLen(el) < 1500) el.remove();
      else if (/^(navigation|banner|complementary|contentinfo|dialog)$/.test(el.getAttribute('role') || '')) el.remove();
    });
  }

  function scoreCandidate(doc) {
    const scores = new Map();
    for (const p of doc.querySelectorAll('p')) {
      const t = textLen(p);
      if (t < 40) continue;
      const s = 1 + (p.textContent.match(/,/g) || []).length + Math.min(3, Math.floor(t / 100));
      const parent = p.parentElement, grand = parent?.parentElement;
      if (parent) scores.set(parent, (scores.get(parent) || 0) + s);
      if (grand) scores.set(grand, (scores.get(grand) || 0) + s / 2);
    }
    let best = null, bestScore = 0;
    for (const [el, s] of scores) if (s > bestScore) { best = el; bestScore = s; }
    return best;
  }

  /** Extract a readable article from a page. */
  AG.extractArticle = function (html, url) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const meta = (sel) => doc.querySelector(sel)?.getAttribute('content')?.trim() || '';
    const out = {
      image: meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]') || '',
      excerpt: meta('meta[property="og:description"]') || meta('meta[name="description"]') || '',
      byline: meta('meta[name="author"]') || meta('meta[property="article:author"]') || (doc.querySelector('[rel="author"]')?.textContent.trim() || ''),
      published: Date.parse(meta('meta[property="article:published_time"]') || doc.querySelector('time[datetime]')?.getAttribute('datetime') || '') || NaN,
      html: '', words: 0, paywalled: false, reason: ''
    };
    if (out.image) { try { out.image = new URL(out.image, url).href; } catch { out.image = ''; } }
    if (/^https?:\/\//.test(out.byline)) out.byline = '';

    const pw = checkPaywall(doc);
    if (pw.hard) return { ...out, paywalled: true, reason: pw.reason };

    const rawText = (doc.body?.textContent || '').replace(/\s+/g, ' ').slice(0, 30000); // before cleanup strips subscribe boxes
    stripUnlikely(doc.body || doc.documentElement);

    let container = null;
    for (const sel of CONTENT_SELECTORS) {
      const els = [...doc.querySelectorAll(sel)];
      const best = els.sort((a, b) => textLen(b) - textLen(a))[0];
      if (best && textLen(best) > 600 && best.querySelectorAll('p').length >= 3) { container = best; break; }
    }
    const scored = scoreCandidate(doc);
    // Prefer the scored node if the selector hit is a huge wrapper (e.g. <main> with sidebars).
    if (!container || (scored && container.contains(scored) && textLen(scored) > textLen(container) * 0.7)) container = scored || container;
    if (!container) return { ...out, reason: 'No article text found' };

    const clean = AG.sanitizeHtml(container, url);
    // Drop duplicated lead image from the body
    if (out.image) {
      const firstImg = clean.querySelector('img');
      if (firstImg && sameImage(firstImg.getAttribute('src'), out.image) && !firstImg.closest('figure')?.querySelector('figcaption')) {
        (firstImg.closest('figure') || firstImg).remove();
      }
    }
    const txt = clean.textContent.replace(/\s+/g, ' ').trim();
    out.words = txt ? txt.split(' ').length : 0;
    out.html = clean.innerHTML;
    if (!out.excerpt) out.excerpt = txt.slice(0, 240);

    if (pw.marker && out.words < 250) return { ...out, html: '', paywalled: true, reason: 'Paywall detected (only a teaser is public)' };
    // Newsletter platforms (Substack, beehiiv, Ghost…) end teaser posts with an upgrade prompt.
    const tail = txt.slice(-600);
    if (out.words < 450 && /(this (post|content|article) is (only )?(for|available to) (paid|premium)|upgrade to (premium|paid)|subscribe to (continue|keep) reading|to read the rest of this (post|article|story)|premium subscribers? only|become a (paid|premium) (subscriber|member)|already a (paid|premium) subscriber)/i.test(tail + ' ' + rawText))
      return { ...out, html: '', paywalled: true, reason: 'Subscriber-only post' };
    return out;
  };

  function sameImage(a, b) {
    const key = (u) => { try { return new URL(u).pathname.split('/').pop().replace(/[-_]\d+x\d+(?=\.)/, '').replace(/\?.*$/, ''); } catch { return u; } };
    return key(a) === key(b);
  }
})();
