/* The Gazette's brain: everything here runs on this laptop, with no network access.
   - text understanding: summaries, facts, numbers, quotes, story clusters
   - a small self-training model: learns word meanings from every article it downloads
     (random-indexing word vectors) and learns the reader's taste from what they open,
     finish, skip and rate (online logistic regression + a taste vector).
   Nothing in this file can make a request; it only reads/writes the local learning file. */
(function (root) {
  const AG = (root.AG = root.AG || {});
  const B = (AG.Brain = {});
  const DIM = 48, MAX_TERMS = 4000;

  // ------------------------------------------------------------------ text basics
  const STOP = new Set(('a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its just like may me might more most much must my new no nor not now of off on once one only or other our out over own said same say says she should so some such than that the their them then there these they this those through to too two under until up us very was we were what when where which while who whom why will with would year years you your according using used use via per among around many first last made make makes get got also however since still even well back much than then them called known found show shows showed study team researchers scientists astronomers').split(' '));
  const stem = (w) => w.length > 5 ? w.replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '') : w.length > 4 && !/ss$/.test(w) ? w.replace(/s$/, '') : w;
  B.tokenize = (text) => (String(text || '').toLowerCase().match(/[a-z][a-z'’-]{2,}/g) || []).map(w => w.replace(/['’-]/g, '')).filter(w => w.length > 2 && !STOP.has(w)).map(stem);

  const ABBR = /\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|St|vs|etc|Fig|No|U\.S|U\.K|e\.g|i\.e|approx|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.$/;
  B.sentences = function (text) {
    const parts = String(text || '').replace(/­/g, '').replace(/\s+/g, ' ').trim().split(/(?<=[.!?]["”’)]?)\s+(?=[A-Z“"‘(\d])/);
    const out = [];
    for (const p of parts) { if (out.length && ABBR.test(out[out.length - 1])) out[out.length - 1] += ' ' + p; else out.push(p); }
    return out.map(s => s.trim()).filter(s => s.length > 20);
  };
  B.plain = (html) => String(html || '').replace(/<(figcaption|script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<\/(p|h\d|li|blockquote)>/gi, '. ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+\./g, '.').replace(/\.{2,}/g, '.').replace(/\s+/g, ' ').trim();

  // ------------------------------------------------------------------ summaries & nuggets
  B.summarize = function (text, n = 2, title = '') {
    const sents = B.sentences(text).slice(0, 40);
    if (sents.length <= n) return sents.join(' ');
    const tf = new Map(); const tt = new Set(B.tokenize(title));
    const toks = sents.map(s => B.tokenize(s));
    for (const t of toks.flat()) tf.set(t, (tf.get(t) || 0) + 1);
    const scored = sents.map((s, i) => {
      const t = toks[i]; if (!t.length) return { i, s, v: -1 };
      let v = t.reduce((a, w) => a + Math.log(1 + tf.get(w)) + (tt.has(w) ? 1.2 : 0), 0) / Math.sqrt(t.length);
      v *= i === 0 ? 1.6 : i < 3 ? 1.2 : 1;
      if (s.length > 320 || s.length < 50) v *= 0.6;
      if (/^(but|and|however|that|this|it|they|he|she|these|those)\b/i.test(s)) v *= 0.7; // needs the previous sentence
      return { i, s, v };
    });
    return scored.sort((a, b) => b.v - a.v).slice(0, n).sort((a, b) => a.i - b.i).map(x => x.s).join(' ');
  };

  const NUM = /(?:about|around|roughly|nearly|almost|over|more than|at least|up to|some)?\s*((?:\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(?:\s*(?:million|billion|trillion|thousand|hundred))?)[\s-]*(light[- ]years?|kilometres?|kilometers?|km|miles|metres?|meters?|solar masses|times|percent|%|degrees|years?|days|hours|minutes|seconds|stars|galaxies|planets|moons|tons?|tonnes?|kelvin|°C|°F|AU|parsecs?|kg|mph|km\/s|km\/h)\b/i;
  const WOW = /\b(largest|biggest|smallest|oldest|youngest|fastest|hottest|coldest|brightest|farthest|closest|first|record|never before|only|most (?:massive|distant|powerful))\b/i;
  B.facts = function (text, title = '') {
    const out = [];
    B.sentences(text).forEach((s, i) => {
      if (s.length < 60 || s.length > 230 || /[“"”]/.test(s) || /\b(I|we|our|said|says)\b/.test(s)) return;
      if (/^(but|and|however|that|this|it|they|he|she|these|those|such|its|their)\b/i.test(s)) return;
      const hasNum = NUM.test(s), wow = WOW.test(s);
      if (!hasNum && !wow) return;
      out.push({ text: s, score: (hasNum ? 2 : 0) + (wow ? 2 : 0) + (i < 6 ? 0.5 : 0) - Math.abs(s.length - 140) / 140 });
    });
    return out.sort((a, b) => b.score - a.score).slice(0, 4);
  };
  B.numbers = function (text) {
    const out = [], seen = new Set();
    for (const s of B.sentences(text)) {
      const m = s.match(NUM); if (!m || s.length > 260) continue;
      const value = m[1].trim(), unit = m[2].toLowerCase().replace(/kilometers?|kilometres?/, 'km').replace(/meters?|metres?/, 'm');
      if (/^(19|20)\d\d$/.test(value.replace(/,/g, '')) || (/^years?$/.test(unit) && parseFloat(value) < 3)) continue;
      const key = value + unit; if (seen.has(key)) continue; seen.add(key);
      out.push({ value, unit, sentence: s, index: m.index });
    }
    return out.slice(0, 5);
  };
  const NAME = "([A-Z][a-zà-ÿ]+(?:[ -][A-Z][a-zà-ÿ'’]+){1,2})";
  B.quotes = function (text) {
    const out = [], t = String(text || '');
    const re = new RegExp(`[“"]([^“”"]{25,260})[,.!?]?[”"],?\\s+(?:said|says|explained|explains|noted|notes|added|adds)\\s+(?:Dr\\.?\\s+|Prof(?:essor)?\\.?\\s+)?${NAME}(?:,\\s+(?:an?|the)\\s+([^.,;]{6,90}))?`, 'g');
    const re2 = new RegExp(`[“"]([^“”"]{25,260})[,.!?]?[”"],?\\s+(?:Dr\\.?\\s+|Prof(?:essor)?\\.?\\s+)?${NAME}(?:,\\s+(?:an?|the)\\s+([^.,;]{6,90}),)?\\s+(?:said|says|explained|noted|added)`, 'g');
    for (const r of [re, re2]) { let m; while ((m = r.exec(t))) out.push({ quote: m[1].trim().replace(/,$/, ''), who: m[2].trim(), role: (m[3] || '').trim() }); }
    const seen = new Set();
    return out.filter(q => !/^(The|This|That|It|In|On|At|But|And|We|They)\b/.test(q.who) && !seen.has(q.who) && seen.add(q.who)).slice(0, 3);
  };

  /** The opening of the story as printed in the paper: whole sentences, up to about `max` characters. */
  B.lede = function (text, max = 1500) {
    const out = []; let n = 0;
    for (const s of B.sentences(text)) { if (n + s.length > max && out.length >= 2) break; out.push(s); n += s.length + 1; if (n >= max) break; }
    return out.join(' ');
  };
  /** Adds summary / facts / numbers / quotes to an article (idempotent). */
  B.enrich = function (a) {
    if (a.enriched) { if (a.lede == null) a.lede = B.lede(B.plain(a.html)); return a; }
    const text = B.plain(a.html);
    a.summary = B.summarize(text, 2, a.title) || a.excerpt || '';
    if (a.summary.length > 420) a.summary = B.summarize(text, 1, a.title);
    a.lede = B.lede(text);
    a.facts = B.facts(text, a.title).map(f => f.text);
    a.numbers = B.numbers(text).map(({ value, unit, sentence }) => ({ value, unit, sentence }));
    a.quotes = B.quotes(text);
    a.terms = topTerms(B.tokenize(`${a.title} ${a.title} ${text.slice(0, 6000)}`), 40);
    // remember a readable form of each word stem (for the "what it has learned" list)
    const surf = (B.state.surf ||= {}); for (const w of (`${a.title} ${text.slice(0, 3000)}`.toLowerCase().match(/[a-z][a-z'’-]{2,}/g) || [])) { const st = B.tokenize(w)[0]; if (st && !surf[st]) surf[st] = w.replace(/['’]s$/, ''); }
    a.enriched = 1;
    return a;
  };
  function topTerms(tokens, n) {
    const tf = new Map(); for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    return [...tf.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([t, c]) => [t, c]);
  }

  // ------------------------------------------------------------------ the model
  const fresh = () => ({ v: 1, n: 0, bias: 0, w: {}, docs: 0, terms: {}, profile: new Array(DIM).fill(0), profileX: null, centroids: {}, quiz: { asked: 0, correct: 0 }, selectors: {}, health: {}, trained: {}, usedFacts: [], usedQuiz: [], usedPeople: [], usedInstruments: [] });
  B.state = fresh();
  B.load = (s) => { B.state = { ...fresh(), ...(s && s.v === 1 ? s : {}) }; return B.state; };
  B.reset = () => { B.state = fresh(); return B.state; };
  B.maturity = () => Math.min(1, B.state.n / 25); // 0 = knows nothing yet, 1 = confident

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function indexVec(term) { // fixed sparse random signature of a word
    let h = hash(term) || 1; const v = [];
    for (let k = 0; k < 6; k++) { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; v.push([h % DIM, (h >>> 8) & 1 ? 1 : -1]); }
    return v;
  }
  const norm = (v) => { const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1; return v.map(x => x / n); };
  const normN = (v) => { let n = 0; for (const x of v) n += x * x; n = Math.sqrt(n) || 1; return v.map(x => x / n); };
  const dotN = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
  const dot = (a, b) => { let s = 0; for (let i = 0; i < DIM; i++) s += a[i] * b[i]; return s; };

  /** Learn word meanings from a batch of articles (which words keep company with which). */
  B.ingest = function (articles) {
    const S = B.state;
    for (const a of articles) {
      const terms = (a.terms || []).map(t => t[0]); if (terms.length < 5) continue;
      S.docs++;
      const sig = new Array(DIM).fill(0);
      for (const t of terms) for (const [i, s] of indexVec(t)) sig[i] += s;
      for (const t of terms) {
        const e = (S.terms[t] ||= { df: 0, c: new Array(DIM).fill(0) });
        e.df++;
        const own = indexVec(t);
        for (let i = 0; i < DIM; i++) e.c[i] = e.c[i] * 0.995 + sig[i];
        for (const [i, s] of own) e.c[i] -= s;
      }
    }
    const keys = Object.keys(S.terms);
    if (S.surf) for (const k of Object.keys(S.surf)) if (!S.terms[k]) delete S.surf[k];
    if (keys.length > MAX_TERMS) { // forget the rarest words
      keys.sort((x, y) => S.terms[y].df - S.terms[x].df).slice(MAX_TERMS).forEach(k => delete S.terms[k]);
    }
  };
  B.docVec = function (a) {
    const S = B.state, v = new Array(DIM).fill(0);
    for (const [t, c] of a.terms || []) {
      const e = S.terms[t]; if (!e) continue;
      const idf = Math.log(1 + S.docs / (1 + e.df)), u = norm(e.c);
      for (let i = 0; i < DIM; i++) v[i] += u[i] * idf * Math.sqrt(c);
    }
    return norm(v);
  };
  B.features = function (a) {
    const f = [`src:${a.sourceId}`, `sec:${a.section}`, `len:${a.words < 350 ? 'short' : a.words < 900 ? 'mid' : 'long'}`, a.image ? 'img:1' : 'img:0'];
    if (a.author) f.push(`au:${a.author.toLowerCase().slice(0, 40)}`);
    for (const t of new Set(B.tokenize(a.title))) f.push(`t:${t}`);
    for (const [t] of (a.terms || []).slice(0, 12)) f.push(`w:${t}`);
    return f;
  };
  const sig = (x) => 1 / (1 + Math.exp(-x));
  /** 0..1: how much this reader is expected to enjoy the story. */
  B.personal = function (a) {
    const S = B.state;
    const lin = S.bias + B.features(a).reduce((s, f) => s + (S.w[f] || 0), 0);
    // Meaning match: the pre-trained model's vector when the story has one, else the self-taught one.
    const useX = a.vec && S.profileX && S.profileX.length === a.vec.length;
    const sem = useX ? dotN(a.vec, normN(S.profileX)) * 1.2 : dot(B.docVec(a), norm(S.profile));
    return sig(lin + 2.5 * (isNaN(sem) ? 0 : sem));
  };
  /** One learning step. y: 1 liked … 0 not interested; weight: how sure we are. */
  B.learn = function (a, y, weight = 1) {
    const S = B.state, feats = B.features(a), p = B.personal(a), g = (y - p) * weight, lr = 0.25 / Math.sqrt(feats.length);
    S.bias += 0.05 * g;
    for (const f of feats) { S.w[f] = ((S.w[f] || 0) * 0.999) + lr * g; if (Math.abs(S.w[f]) < 1e-4) delete S.w[f]; }
    const dv = B.docVec(a); for (let i = 0; i < DIM; i++) S.profile[i] = S.profile[i] * 0.995 + 0.3 * g * dv[i];
    if (a.vec) { // taste vector in the pre-trained model's space
      if (!S.profileX || S.profileX.length !== a.vec.length) S.profileX = new Array(a.vec.length).fill(0);
      for (let i = 0; i < a.vec.length; i++) S.profileX[i] = Math.round((S.profileX[i] * 0.995 + 0.3 * g * a.vec[i]) * 1e5) / 1e5;
    }
    S.n += weight;
  };
  /** Turn one edition's reading log into lessons (once per article signal). */
  /** Turn one edition's reading log into lessons. `final` = the edition is over (a newer one exists),
      so stories that were in front of the reader but never opened now count as "not interested". */
  B.learnFromLog = function (ed, log, final = false) {
    const S = B.state, done = (S.trained[ed.id] ||= {});
    for (const a of ed.articles) {
      const l = log?.[a.id]; if (!l) continue;
      const key = `${l.opened ? 1 : 0}${Math.round((l.completion || 0) * 2)}${l.thumb || 0}`;
      if ((l.opened || l.thumb) && done[a.id] !== key) {
        done[a.id] = key; B.enrich(a);
        if (l.thumb === 1) B.learn(a, 1, 3);
        else if (l.thumb === -1) B.learn(a, 0, 3);
        else B.learn(a, (l.completion || 0) >= 0.5 ? 1 : 0.6, 0.6 + (l.completion || 0));
      }
      if (final && l.seen && !done['#' + a.id] && typeof a.p === 'number') { // scorecard uses the prediction made BEFORE this edition was read
        done['#' + a.id] = 1;
        const T = (S.track ||= { hi: [0, 0], lo: [0, 0], top: [0, 0], rest: [0, 0] }), liked = (l.opened && l.thumb !== -1) || l.thumb === 1 ? 1 : 0;
        const bucket = a.p >= 0.6 ? T.hi : a.p <= 0.4 ? T.lo : null; if (bucket) { bucket[0]++; bucket[1] += liked; }
        const pos = ed.articles.indexOf(a), half = pos < Math.ceil(ed.articles.length / 3) ? T.top : T.rest; half[0]++; half[1] += liked;
      }
      if (final && l.seen && !l.opened && !l.thumb && !done['~' + a.id]) { done['~' + a.id] = 1; B.enrich(a); B.learn(a, 0, 0.35); }
    }
    const ids = Object.keys(S.trained); if (ids.length > 40) ids.sort().slice(0, ids.length - 40).forEach(k => delete S.trained[k]);
  };
  B.explainLabel = function (f) { const S = B.state, srcName = B.sourceNames || {}, secName = { sky: 'skywatching', solar: 'the solar system', missions: 'missions', deep: 'deep space', frontiers: 'frontiers' }; const label = (f) => f.replace(/^src:(.*)$/, (_m, id) => srcName[id] || id).replace(/^sec:(.*)$/, (_m, k) => secName[k] || k).replace(/^(t|w):(.*)$/, (_m, _k, st) => (S.surf || {})[st] || st).replace(/^len:short/, 'short reads').replace(/^len:mid/, 'medium reads').replace(/^len:long/, 'long reads').replace(/^au:/, 'writer: ').replace(/^img:1/, 'stories with pictures').replace(/^img:0/, 'text-only stories'); return label(f); };
  /** Why a story got its score: the strongest reasons for and against, in plain words. */
  B.why = function (a) {
    const S = B.state, ex = B.explainLabel || ((f) => f);
    const parts = B.features(a).map(f => [f, S.w[f] || 0]).filter(x => Math.abs(x[1]) > 0.02 && !/^(w|t):.{0,3}$/.test(x[0]));
    const uniq = (arr) => [...new Map(arr.map(([f, w]) => [ex(f), w])).keys()];
    return { p: B.personal(a), lessons: Math.round(S.n), forIt: uniq(parts.filter(x => x[1] > 0).sort((x, y) => y[1] - x[1])).slice(0, 5), against: uniq(parts.filter(x => x[1] < 0).sort((x, y) => x[1] - y[1])).slice(0, 4) };
  };
  B.explain = function () {
    const S = B.state, e = Object.entries(S.w).filter(([f]) => !/^(w|t):.{0,3}$/.test(f)), label = B.explainLabel;
    const uniq = (arr) => [...new Map(arr.map(([f, w]) => [label(f), w])).entries()];
    return { lessons: Math.round(S.n), words: Object.keys(S.terms).length, track: S.track || null, likes: uniq(e.filter(x => x[1] > 0.03).sort((a, b) => b[1] - a[1])).slice(0, 12).map(x => x[0]), dislikes: uniq(e.filter(x => x[1] < -0.03).sort((a, b) => a[1] - b[1])).slice(0, 8).map(x => x[0]), quiz: S.quiz };
  };

  // ------------------------------------------------------------------ editorial judgement
  /** Group the same story told by several publishers; more coverage = bigger news. */
  B.cluster = function (articles) {
    const vecs = articles.map(a => { const m = new Map(); for (const t of B.tokenize(`${a.title} ${a.title} ${(a.excerpt || '').slice(0, 160)}`)) m.set(t, (m.get(t) || 0) + 1); return m; });
    const cos = (x, y) => { let d = 0, nx = 0, ny = 0; for (const [k, v] of x) { nx += v * v; if (y.has(k)) d += v * y.get(k); } for (const v of y.values()) ny += v * v; return d / (Math.sqrt(nx * ny) || 1); };
    const cid = articles.map((_, i) => i);
    for (let i = 0; i < articles.length; i++) for (let j = i + 1; j < articles.length; j++) if (cos(vecs[i], vecs[j]) > 0.6) { const from = cid[j], to = cid[i]; for (let k = 0; k < cid.length; k++) if (cid[k] === from) cid[k] = to; }
    const groups = new Map(); cid.forEach((c, i) => { if (!groups.has(c)) groups.set(c, []); groups.get(c).push(articles[i]); });
    for (const g of groups.values()) {
      g.sort((a, b) => (b.words + (b.image ? 300 : 0)) - (a.words + (a.image ? 300 : 0)));
      g.forEach((a, k) => { a.coverage = g.length; a.alsoBy = k === 0 ? g.slice(1).map(x => ({ id: x.id, source: x.source })) : []; a.dup = k > 0; });
    }
    return articles;
  };
  B.quality = function (a, until) {
    const ageH = Math.max(0, (until - a.published) / 3600e3);
    return (a.image ? 2 : 0) + (a.partial ? -3 : 0) + Math.min(2.5, a.words / 450) - Math.min(3, ageH / 56) + Math.min(3, ((a.coverage || 1) - 1) * 1.5) + ((a.facts || []).length ? 0.5 : 0);
  };
  /** Final order: editorial quality blended with learned taste, plus ~1 in 5 "variety" picks. */
  B.rank = function (articles, until) {
    const m = B.maturity(), alpha = 0.6 * m; // how much taste counts; grows as the model learns
    for (const a of articles) { a.q = B.quality(a, until); a.p = B.personal(a); }
    const qs = articles.map(a => a.q), qmin = Math.min(...qs), qr = (Math.max(...qs) - qmin) || 1;
    for (const a of articles) { a.rank = (1 - alpha) * ((a.q - qmin) / qr) + alpha * a.p - (a.dup ? 0.6 : 0); a.variety = false; }
    const pool = [...articles].sort((a, b) => b.rank - a.rank), out = [];
    const med = [...articles].map(a => a.p).sort((x, y) => x - y)[Math.floor(articles.length / 2)] ?? 0.5;
    while (pool.length) {
      let pick = 0;
      if (m > 0.15 && out.length % 5 === 4) { // surprise slot: best-quality story outside the reader's usual taste
        let best = -1, bq = -Infinity; pool.forEach((a, i) => { if (a.p <= med && a.p > 0.2 && !a.dup && a.q > bq) { bq = a.q; best = i; } }); // unfamiliar, but never something the reader has clearly turned down
        if (best > 0) { pick = best; pool[best].variety = true; }
      }
      out.push(pool.splice(pick, 1)[0]);
    }
    return out;
  };
  /** Sections adapt: stories the keyword rules can't place go to the nearest learned section. */
  B.adaptSections = function (articles) {
    const S = B.state;
    for (const a of articles) { if (a.section === 'frontiers') continue; const c = (S.centroids[a.section] ||= new Array(DIM).fill(0)), v = B.docVec(a); for (let i = 0; i < DIM; i++) c[i] = c[i] * 0.98 + v[i]; }
    for (const a of articles) {
      if (a.section !== 'frontiers') continue;
      const v = B.docVec(a); let best = null, bs = 0.35;
      for (const [k, c] of Object.entries(S.centroids)) { const s = dot(v, norm(c)); if (s > bs) { bs = s; best = k; } }
      if (best) { a.section = best; a.sectionLearned = true; }
    }
  };
  /** Pick items from a bundled library without repeating recent ones. */
  B.pickFresh = function (list, usedKey, n, idOf = (x) => x.id) {
    const used = (B.state[usedKey] ||= []);
    let pool = list.filter(x => !used.includes(idOf(x)));
    if (pool.length < n) { used.length = 0; pool = [...list]; }
    const out = [];
    for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    used.push(...out.map(idOf)); if (used.length > list.length * 0.8) used.splice(0, used.length - Math.floor(list.length * 0.8));
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
