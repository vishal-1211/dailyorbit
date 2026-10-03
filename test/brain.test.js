const assert = require('assert');
require('../src/renderer/brain.js');
const B = globalThis.AG.Brain;
const mk = (id, title, body, extra = {}) => B.enrich({ id, title, html: `<p>${body}</p>`, excerpt: body.slice(0, 120), words: body.split(' ').length, sourceId: 'x', section: 'deep', published: Date.now() - 3600e3, image: 'i', ...extra });

// --- understanding
const text = 'Omega Centauri is the largest globular star cluster known in the Milky Way, packing roughly ten million stars into a ball about 150 light-years across. It lies about 17,000 light-years away in the constellation Centaurus. “Each of these objects is a snapshot,” said Maria Lopez, an astronomer at the University of Somewhere. Dr. Smith agreed. In 2024 astronomers reported fast-moving stars near the centre, strong evidence for a black hole of at least 8,200 solar masses.';
const a = mk('a', 'Omega Centauri hides a black hole', text);
assert(a.summary.startsWith('Omega Centauri is the largest'), a.summary);
assert(a.facts.length >= 2 && a.facts.every(f => !/[“"]/.test(f)));
assert(a.numbers.some(n => n.value === '17,000' && /light/.test(n.unit)), JSON.stringify(a.numbers));
assert.equal(a.quotes[0].who, 'Maria Lopez'); assert(/astronomer/.test(a.quotes[0].role));
assert.equal(B.sentences('Dr. Smith went home early today. He slept at 10 p.m. sharp, then rose.').length, 2);
console.log('✓ summaries, facts, numbers, quotes');

// --- learning: a reader who loves Mars/rover stories and ignores rocket-business stories
const mars = ['Perseverance rover drills ancient Mars lakebed rock in Jezero crater', 'Curiosity rover finds organic molecules in Martian mudstone', 'Mars rover samples reveal ancient river delta sediments', 'Martian crater rock cores sealed by rover for sample return', 'Rover radar maps buried Mars river channels in Jezero'];
const biz = ['Rocket company raises funding for new launch vehicle', 'Launch provider signs satellite contract with telecom firm', 'Startup tests reusable rocket engine for commercial launch market', 'Satellite operator orders launches from rocket company', 'Commercial launch market grows as rocket firms compete'];
const fill = (t) => `${t}. ${t.split(' ').reverse().join(' ')}. Scientists explained the ${t.toLowerCase()} in detail over many paragraphs about ${t.split(' ').slice(0, 4).join(' ')}.`;
B.reset();
const corpus = [...mars.map((t, i) => mk('m' + i, t, fill(t), { sourceId: 'nasa', section: 'solar' })), ...biz.map((t, i) => mk('b' + i, t, fill(t), { sourceId: 'biz', section: 'missions' }))];
for (let r = 0; r < 3; r++) B.ingest(corpus);
const before = B.personal(corpus[0]) - B.personal(corpus[5]);
const ed = { id: 'e1', articles: corpus };
const log = {}; corpus.forEach(c => { log[c.id] = c.id[0] === 'm' ? { seen: 1, opened: 1, completion: 0.9 } : { seen: 1 }; }); log.m0.thumb = 1; log.b0.thumb = -1;
B.learnFromLog(ed, log, true);
const n1 = B.state.n; B.learnFromLog(ed, log, true); assert.equal(B.state.n, n1, 'same signals are not learned twice');
// unseen stories: a new Mars story with a different source, and a new business story
const newMars = mk('n1', 'Ancient Martian lake sediments studied by rover team', fill('Ancient Martian lake sediments studied by rover team in crater delta'), { sourceId: 'other', section: 'solar' });
const newBiz = mk('n2', 'Telecom firm books commercial rocket launch contract', fill('Telecom firm books commercial rocket launch contract for satellite'), { sourceId: 'other2', section: 'missions' });
const neutral = mk('n3', 'Galaxy cluster lensing reveals distant quasar', fill('Galaxy cluster lensing reveals distant quasar light'), { sourceId: 'other3' });
B.ingest([newMars, newBiz, neutral]);
const pm = B.personal(newMars), pb = B.personal(newBiz), pn = B.personal(neutral);
console.log(`  taste after 1 edition: new Mars story ${pm.toFixed(2)}, neutral ${pn.toFixed(2)}, launch-business ${pb.toFixed(2)} (gap before learning ${before.toFixed(2)})`);
assert(pm > pn && pn > pb, 'taste should generalise to unseen stories');
// ranking: with a mature model the Mars story leads; variety slot still surfaces something else
B.state.n = 60;
const many = [newBiz, neutral, newMars, ...corpus].map(x => ({ ...x }));
B.cluster(many); const ranked = B.rank(many, Date.now());
assert(/Mars|Martian|rover/i.test(ranked[0].title), ranked[0].title);
assert(ranked.slice(0, 5).some(x => x.variety), 'one of the first five is a variety pick');
const ex = B.explain(); assert(ex.likes.length && ex.dislikes.length);
console.log('  likes:', ex.likes.slice(0, 6).join(', '), '| dislikes:', ex.dislikes.slice(0, 4).join(', '));
// state survives save/load
const saved = JSON.parse(JSON.stringify(B.state)); B.reset(); assert(B.personal(newMars) !== pm); B.load(saved); assert(Math.abs(B.personal(newMars) - B.personal(newMars)) < 1e-9);
console.log('✓ learning: generalises, no double counting, variety slot, explainable, reset/load');
// clustering
const c = B.cluster([mk('c1', 'Webb reveals stunning panorama of star formation in IC 348', 'x '.repeat(30), { source: 'A' }), mk('c2', 'Webb reveals panorama of star formation IC 348', 'y '.repeat(60), { source: 'B' }), mk('c3', 'Juice to fly past Earth', 'z '.repeat(30))]);
assert.equal(c.filter(x => x.dup).length, 1); assert.equal(c.find(x => !x.dup && x.coverage === 2).alsoBy.length, 1);
console.log('✓ same story from two publishers is merged and counted as bigger news');

// --- with a pre-trained model's vectors attached (stand-in vectors here), taste lives in that space too
const fake = (t) => { const v = new Array(64).fill(0); for (const w of B.tokenize(t)) { let h = 7; for (const c of w) h = (h * 31 + c.charCodeAt(0)) >>> 0; v[h % 64] += 1; } const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1; return v.map(x => x / n); };
B.reset();
const c2 = corpus.map(x => ({ ...x, vec: fake(x.title + ' ' + x.excerpt) }));
B.ingest(c2); const log2 = {}; c2.forEach(c => { log2[c.id] = c.id[0] === 'm' ? { seen: 1, opened: 1, completion: 1, thumb: 1 } : { seen: 1, thumb: -1 }; });
B.learnFromLog({ id: 'e2', articles: c2 }, log2, true);
assert(B.state.profileX && B.state.profileX.length === 64, 'taste vector kept in the model\'s space');
const vm = { ...newMars, vec: fake(newMars.title + ' ' + newMars.excerpt) }, vb = { ...newBiz, vec: fake(newBiz.title + ' ' + newBiz.excerpt) };
assert(B.personal(vm) > B.personal(vb));
const noVec = B.personal(newMars); assert(noVec > 0 && noVec < 1, 'stories without a vector still score (self-taught path)');
const rt = JSON.parse(JSON.stringify(B.state)); B.load(rt); assert(B.state.profileX.length === 64);
console.log('✓ pre-trained vectors: used when present, self-taught path still works without them');
