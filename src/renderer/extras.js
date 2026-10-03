/* The fun half of the paper, assembled automatically for each edition:
   quiz, did-you-know, by-the-numbers, memes, Page 3 people, great instruments, on this day.
   Built from this edition's stories first, topped up from the bundled library. */
(function (root) {
  const AG = (root.AG = root.AG || {});
  const X = (AG.Extras = {});
  const B = () => AG.Brain, C = () => AG.Content;
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mmdd = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const short = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)) + '…');

  // ------------------------------------------------------------------ quiz
  function numberQuestion(a) {
    for (const n of a.numbers || []) {
      const s = n.sentence; if (s.length > 190 || s.length < 50) continue;
      const m = n.value.match(/^([\d,.]+)\s*(.*)$/); if (!m) continue;
      const num = parseFloat(m[1].replace(/,/g, '')); if (!isFinite(num) || num === 0) continue;
      const scale = m[2] ? ' ' + m[2] : '';
      const fmt = (x) => { const r = x >= 100 ? Math.round(x / (x >= 1000 ? 100 : 10)) * (x >= 1000 ? 100 : 10) : x >= 10 ? Math.round(x) : Math.round(x * 10) / 10; return (m[1].includes(',') || r >= 10000 ? r.toLocaleString('en-US') : String(r)) + scale; };
      const right = `${m[1]}${scale}`, wrong = [...new Set(shuffle([0.1, 0.25, 0.5, 2, 4, 10]).map(k => fmt(num * k)))].filter(x => x !== right).slice(0, 3);
      if (wrong.length < 3) continue;
      const blanked = s.replace(n.value, '_____');
      if (blanked === s) continue;
      const options = shuffle([right, ...wrong]);
      return { id: 'e' + a.id, q: `From this edition — fill the gap: “${blanked}”`, options: options.map(o => `${o} ${n.unit}`), answer: options.indexOf(right), note: `From “${short(a.title, 70)}”.`, storyId: a.id };
    }
    return null;
  }
  X.quiz = function (articles) {
    const S = B().state, acc = S.quiz.asked >= 5 ? S.quiz.correct / S.quiz.asked : 0.55;
    const levels = acc > 0.75 ? [2, 3, 3] : acc < 0.4 ? [1, 1, 2] : [1, 2, 3]; // adapts to how the reader has been scoring
    const fromEdition = shuffle(articles.filter(a => !a.dup)).map(numberQuestion).filter(Boolean).slice(0, 2);
    const bank = [];
    for (const lv of levels) {
      const pick = B().pickFresh(C().QUIZ.filter(q => q.level === lv && !bank.includes(q)), 'usedQuiz', 1)[0];
      if (pick) { const opts = shuffle(pick.options); bank.push({ id: pick.id, q: pick.q, options: opts, answer: opts.indexOf(pick.options[pick.answer]), note: pick.note, level: pick.level }); }
    }
    return shuffle([...fromEdition, ...bank]).slice(0, 5);
  };

  // ------------------------------------------------------------------ did you know / numbers
  X.facts = function (articles) {
    const fromStories = [];
    for (const a of articles) if (!a.dup && a.facts?.[0] && fromStories.length < 3) fromStories.push({ text: a.facts[0], storyId: a.id, source: a.source });
    const lib = B().pickFresh(C().FACTS, 'usedFacts', 5).map(f => ({ text: f.text }));
    return { didYouKnow: [...fromStories, ...lib.slice(0, 2)].slice(0, 4), funFacts: lib.slice(2, 5) };
  };
  X.numbers = function (articles) {
    const out = [];
    for (const a of articles) { const n = (a.numbers || []).find(x => x.sentence.length < 200); if (n && !a.dup && out.length < 4) out.push({ value: n.value, unit: n.unit, label: short(n.sentence, 120), storyId: a.id }); }
    return out;
  };

  // ------------------------------------------------------------------ memes (caption cards made by the app)
  const MEMES = [
    ['moonfull', (c) => c.illum > 0.88, '🌕', 'Deep-sky observers: “Finally, a clear night!”', 'The Full Moon: “Allow me to introduce myself.”'],
    ['moonnew', (c) => c.illum < 0.08, '🌌', 'The Moon: takes the night off.', 'Every faint galaxy: “Our time to shine.”'],
    ['rover', (c) => /\b(rover|perseverance|curiosity)\b/.test(c.text), '🏎️', 'Rover: drives 100 metres in one day.', 'Mission control: “Fastest thing on Mars!”'],
    ['blackhole', (c) => /black hole/.test(c.text), '🕳️', 'Black hole diet plan:', '1. See star.  2. Eat star.  3. Burp X-rays.'],
    ['webb', (c) => /\b(webb|jwst)\b/.test(c.text), '📚', 'Webb: takes one picture.', 'Astronomers: “We may need to rewrite a chapter.”'],
    ['exoplanet', (c) => /exoplanet|light-years away/.test(c.text), '🧳', '“New planet found, only 40 light-years away!”', 'Me, tired from walking to the kitchen: “Road trip?”'],
    ['launch', (c) => /\b(launch|rocket|liftoff)\b/.test(c.text), '🚀', 'Launch scheduled: 9:00 sharp.', 'The weather, one valve and a boat in the range: “Let’s say Thursday.”'],
    ['flyby', (c) => /asteroid/.test(c.text) || c.kinds.has('flyby'), '🪨', 'Headline: “Asteroid to skim past Earth!”', 'The asteroid, several Moon-distances away: “I’m literally just passing.”'],
    ['shower', (c) => /meteor/.test(c.text) || c.kinds.has('shower'), '✈️', 'Forecast: 100 meteors an hour.', 'You, after 20 minutes outside: saw three. One was a plane.'],
    ['iss', (c) => c.kinds.has('iss') || /space station/.test(c.text), '🛰️', 'The space station: crosses your whole sky in five minutes.', 'You: still looking for your glasses.'],
    ['sun', (c) => /\b(solar flare|sunspot|coronal|aurora)\b/.test(c.text), '☀️', 'The Sun: sneezes.', 'Every satellite and power grid on Earth: “Bless you?!”'],
    ['saturn', (c) => /\b(saturn|jupiter)\b/.test(c.text), '🪐', 'Jupiter: “I have nearly 100 moons.”', 'Saturn: “That’s cute.”'],
    ['galaxy', (c) => /\b(andromeda|galax)/.test(c.text), '🧹', 'Andromeda: racing towards us at 110 km every second.', 'Arrival: in about 4 billion years. Plenty of time to tidy up.'],
    ['comet', (c) => /\bcomet\b/.test(c.text), '🫥', 'Forecast: “Comet of the century!”', 'The comet, on arrival:'],
    ['eclipse', (c) => /eclipse/.test(c.text) || c.kinds.has('eclipse'), '☁️', 'Sky event of the decade: tonight.', 'Clouds: “We heard there’s a party.”'],
    ['pluto', (c) => /\bpluto\b/.test(c.text), '💔', 'Pluto, 2006: demoted.', 'Pluto ever since: still has a heart.'],
    ['scope', () => true, '🔭', 'Me: “I only need one telescope.”', 'Also me, six months later: 🔭🔭🔭'],
    ['lamp', () => true, '💡', 'Starlight: travels a thousand years to reach your eye.', 'The streetlamp next door: “Not today.”'],
    ['todo', () => true, '🗞️', (c) => `This edition: ${c.n} stories about the universe.`, 'Your to-do list: “Am I a joke to you?”'],
    ['seeing', () => true, '🌬️', 'Telescope: perfectly collimated, cooled and aligned.', 'The atmosphere: “Let me wobble that for you.”']
  ];
  X.memes = function (articles, ctx = {}) {
    const c = { text: articles.map(a => `${a.title} ${a.excerpt || ''}`).join(' ').toLowerCase(), illum: ctx.illum ?? 0.5, kinds: new Set(ctx.kinds || []), n: articles.length };
    const used = (B().state.usedMemes ||= []);
    const fit = MEMES.filter(m => m[1](c)), specific = fit.filter(m => !['scope', 'lamp', 'todo', 'seeing'].includes(m[0]));
    let pool = [...specific, ...fit.filter(m => !specific.includes(m))].filter(m => !used.includes(m[0]));
    if (pool.length < 2) { used.length = 0; pool = fit; }
    const picks = pool.slice(0, 2);
    used.push(...picks.map(m => m[0])); if (used.length > 12) used.splice(0, used.length - 12);
    return picks.map(([id, , emoji, top, bottom]) => ({ id, emoji, top: typeof top === 'function' ? top(c) : top, bottom }));
  };
  X.MEME_LINK = { label: 'More space memes', url: 'https://www.reddit.com/r/astronomymemes/' };

  // ------------------------------------------------------------------ page 3: people
  X.people = function (articles, date) {
    const P = C().PEOPLE, today = mmdd(date);
    const near = P.find(p => p.born === today) || P.find(p => { if (!p.born) return false; const [m, d] = p.born.split('-').map(Number); const diff = Math.abs(new Date(date.getFullYear(), m - 1, d) - date) / 864e5; return diff <= 3; });
    const star = near ? { ...near, birthday: true } : B().pickFresh(P, 'usedPeople', 1)[0];
    if (near) (B().state.usedPeople ||= []).push(near.id);
    const quoted = [];
    for (const a of articles) for (const q of a.quotes || []) if (quoted.length < 3 && !quoted.some(x => x.who === q.who)) quoted.push({ ...q, quote: short(q.quote, 200), storyId: a.id, source: a.source });
    const inNews = [];
    for (const p of P) { if (p.id === star.id) continue; const last = p.name.split(' ').pop(); const hit = articles.find(a => new RegExp(`\\b${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(`${a.title} ${B().plain(a.html).slice(0, 8000)}`)); if (hit && last.length > 3 && inNews.length < 3) inNews.push({ person: p, storyId: hit.id, storyTitle: hit.title }); }
    return { star, quoted, inNews };
  };

  // ------------------------------------------------------------------ great instruments
  const INSTR_RE = { jwst: /\b(webb|jwst)\b/i, hst: /\bhubble\b/i, elt: /extremely large telescope|\belt\b/i, vlt: /very large telescope|\bvlt\b/i, keck: /\bkeck\b/i, gtc: /gran telescopio/i, subaru: /subaru telescope/i, lbt: /large binocular/i, salt: /southern african large/i, rubin: /rubin observatory|\blsst\b/i, gmt: /giant magellan/i, tmt: /thirty meter telescope|\btmt\b/i, gaia: /\bgaia\b/i, kepler: /kepler (space )?telescope|kepler mission/i, tess: /\btess\b/i, euclid: /\beuclid\b/i, roman: /roman space telescope/i, dot: /devasthal/i, hct: /hanle|himalayan chandra/i, uvit: /astrosat/i };
  const TELE = /\b(telescope|observatory|mirror|spectrograph|interferometer|first light|adaptive optics)\b/i;
  X.instruments = function (articles) {
    const I = C().INSTRUMENTS, used = (B().state.usedInstruments ||= []);
    const hits = I.map(ins => ({ ins, stories: INSTR_RE[ins.id] ? articles.filter(a => !a.dup && INSTR_RE[ins.id].test(`${a.title} ${a.excerpt || ''} ${(a.summary || '')}`)) : [] })).filter(h => h.stories.length);
    hits.sort((a, b) => (used.includes(a.ins.id) - used.includes(b.ins.id)) || b.stories.length - a.stories.length);
    let feature, stories = [];
    if (hits.length) { feature = hits[0].ins; stories = hits[0].stories.slice(0, 3).map(a => a.id); used.push(feature.id); if (used.length > 20) used.shift(); }
    else feature = B().pickFresh(I, 'usedInstruments', 1)[0];
    const others = B().pickFresh(I.filter(x => x.id !== feature.id), 'usedInstruments', 3);
    const news = articles.filter(a => !a.dup && !stories.includes(a.id) && TELE.test(a.title)).slice(0, 3).map(a => a.id);
    return { feature, stories, others, news };
  };

  X.onThisDay = function (date) {
    const D = C().ON_THIS_DAY, out = [];
    for (const off of [0, 1, -1, 2, -2, 3, -3]) { const d = new Date(+date + off * 864e5), t = D[mmdd(d)]; if (t) out.push({ date: d.toLocaleDateString(undefined, { day: 'numeric', month: 'long' }), text: t, today: off === 0 }); if (out.length >= 3) break; }
    return out;
  };

  /** Build all extras for an edition (stored with it, so reopening shows the same paper). */
  X.build = function (ed, ranked, ctx = {}) {
    const date = new Date(ed.until);
    return { v: 1, quiz: X.quiz(ranked), ...X.facts(ranked), numbers: X.numbers(ranked), memes: X.memes(ranked, ctx), people: X.people(ranked, date), instruments: X.instruments(ranked), onThisDay: X.onThisDay(date) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
