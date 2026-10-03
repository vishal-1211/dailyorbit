/* Feed parsing (RSS 2.0, RSS 1.0/RDF, Atom) using the browser's own XML parser. */
(function () {
  const AG = (window.AG = window.AG || {});

  // Named HTML entities are illegal in XML and break many real-world feeds.
  const XML_ENTITIES = /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g;

  function parseXml(text) {
    const parser = new DOMParser();
    let doc = parser.parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) {
      doc = parser.parseFromString(text.replace(XML_ENTITIES, '&amp;'), 'application/xml');
    }
    if (doc.getElementsByTagName('parsererror').length) return null;
    return doc;
  }

  // Match children by qualified name ("content:encoded") or bare local name.
  function kids(el, names) {
    const out = [];
    for (const c of el.children) {
      const qn = c.nodeName.toLowerCase();
      const ln = (c.localName || '').toLowerCase();
      if (names.some(n => n === qn || (!n.includes(':') && n === ln && !qn.includes(':')))) out.push(c);
    }
    return out;
  }
  const first = (el, names) => kids(el, names)[0] || null;
  const text = (el, names) => { const k = first(el, names); return k ? k.textContent.trim() : ''; };

  function parseDate(s) {
    if (!s) return NaN;
    let t = Date.parse(s);
    if (!isNaN(t)) return t;
    // e.g. "Thursday, 24 September 2026 at 15:00 CEST" or odd timezones
    const cleaned = s.replace(/^\w+,\s*/, '').replace(/\bat\b/, '').replace(/\b(CEST)\b/, '+0200').replace(/\b(CET)\b/, '+0100').replace(/\b(BST)\b/, '+0100').replace(/\s+/g, ' ');
    t = Date.parse(cleaned);
    return t;
  }

  function resolve(u, base) {
    try { return new URL(u, base).href; } catch { return ''; }
  }

  function imageFrom(item, base, html) {
    for (const m of kids(item, ['media:content', 'media:thumbnail'])) {
      const u = m.getAttribute('url');
      const type = (m.getAttribute('type') || m.getAttribute('medium') || 'image').toLowerCase();
      if (u && /image/.test(type)) return resolve(u, base);
    }
    const group = first(item, ['media:group']);
    if (group) { const i = imageFrom(group, base, ''); if (i) return i; }
    for (const e of kids(item, ['enclosure'])) {
      const u = e.getAttribute('url');
      if (u && /^image\//i.test(e.getAttribute('type') || 'image/')) return resolve(u, base);
    }
    if (html) {
      const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (m) return resolve(m[1].replace(/&amp;/g, '&'), base);
    }
    return '';
  }

  function atomLink(entry) {
    const links = kids(entry, ['link']);
    const alt = links.find(l => (l.getAttribute('rel') || 'alternate') === 'alternate' && l.getAttribute('href'));
    return (alt || links[0])?.getAttribute('href') || '';
  }

  /** Returns { title, items: [{title,url,published,author,summaryHtml,contentHtml,image}] } or null. */
  AG.parseFeed = function (xmlText, feedUrl) {
    const doc = parseXml(xmlText);
    if (!doc) return null;
    const root = doc.documentElement;
    const rootName = root.localName.toLowerCase();
    const items = [];
    let title = '';

    if (rootName === 'feed') {
      title = text(root, ['title']);
      for (const e of kids(root, ['entry'])) {
        const content = text(e, ['content']);
        const summary = text(e, ['summary']);
        const authorEl = first(e, ['author']);
        items.push({
          title: text(e, ['title']),
          url: resolve(atomLink(e), feedUrl),
          published: parseDate(text(e, ['published']) || text(e, ['updated'])),
          author: authorEl ? text(authorEl, ['name']) : '',
          summaryHtml: summary,
          contentHtml: content,
          image: imageFrom(e, feedUrl, content || summary)
        });
      }
    } else if (rootName === 'rss' || rootName === 'rdf') {
      const channel = first(root, ['channel']) || root;
      title = text(channel, ['title']);
      const itemEls = [...kids(channel, ['item']), ...kids(root, ['item'])];
      for (const it of itemEls) {
        const content = text(it, ['content:encoded']);
        const desc = text(it, ['description']);
        let link = text(it, ['link']);
        if (!link) { const g = first(it, ['guid']); if (g && /^https?:/.test(g.textContent.trim())) link = g.textContent.trim(); }
        items.push({
          title: text(it, ['title']),
          url: resolve(link, feedUrl),
          published: parseDate(text(it, ['pubdate']) || text(it, ['dc:date']) || text(it, ['a10:updated'])),
          author: text(it, ['dc:creator']) || text(it, ['author']),
          summaryHtml: desc,
          contentHtml: content,
          image: imageFrom(it, feedUrl, content || desc)
        });
      }
    } else {
      return null;
    }
    return { title, items: items.filter(i => i.url && i.title) };
  };

  /** Given an HTML page, find its advertised RSS/Atom feed URL. */
  AG.discoverFeed = function (html, pageUrl) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const link = doc.querySelector('link[rel~="alternate"][type*="rss"], link[rel~="alternate"][type*="atom"]');
    return link ? resolve(link.getAttribute('href'), pageUrl) : '';
  };

  AG.htmlToText = function (html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body?.textContent || '').replace(/\s+/g, ' ').trim();
  };

  /** Trim an excerpt to whole sentences (publishers often cut descriptions mid-word). */
  AG.tidyExcerpt = function (s, max = 280) {
    s = (s || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    if (s.length <= max && /[.!?”"’)]$/.test(s)) return s;
    const cut = s.slice(0, max);
    const m = cut.match(/^(.{60,}[.!?][”"’)]?)(\s|$)/);
    if (m) return m[1];
    const i = cut.lastIndexOf(' ');
    return (i > 40 ? cut.slice(0, i) : cut).replace(/[\s,;:\-–—]+$/, '') + '…';
  };

  AG.canonicalUrl = function (u) {
    try {
      const url = new URL(u);
      url.hash = '';
      for (const k of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid|mc_|ref$|src$)/i.test(k)) url.searchParams.delete(k);
      url.hostname = url.hostname.replace(/^www\./, '');
      return url.href.replace(/\/$/, '');
    } catch { return u; }
  };
})();
