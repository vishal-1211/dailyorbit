// Mock publishers for the UI/engine test. URLs match the real default sources so the
// real config is exercised; the harness answers fetchText() from this map.
const H = 3600e3, D = 24 * H;
const now = Date.now();
const rfc = (t) => new Date(t).toUTCString();
const img = (k) => `https://img.test/${k}.png`;

const P = {
  omega: [
    'Omega Centauri is the largest globular star cluster known in the Milky Way, packing roughly ten million stars into a ball about 150 light-years across. Seen from the Southern Hemisphere it appears to the unaided eye as a fuzzy star, but even a small telescope resolves it into a glittering swarm.',
    'Recent studies suggest that Omega Centauri may be the stripped core of a small galaxy that merged with the Milky Way billions of years ago. Its stars span a wider range of ages and chemical compositions than those in typical globular clusters, a hint that it once formed stars over an extended period.',
    'In 2024 astronomers reported fast-moving stars near the cluster’s centre, strong evidence for an intermediate-mass black hole of at least 8,200 solar masses. Such black holes are the long-sought “missing link” between the stellar-mass black holes formed in supernovae and the supermassive giants in galactic nuclei.',
    'This image combines exposures taken over several nights to bring out the cluster’s colours: the brightest red giants glow orange, while hotter blue stragglers stand out against the crowded golden core.',
    'Omega Centauri lies about 17,000 light-years away in the constellation Centaurus. From latitudes south of about 30 degrees north, it can be seen low in the evening sky in late spring and early summer.'
  ],
  ghosts: [
    'When massive stars end their lives in supernova explosions, they leave behind expanding shells of gas that can glow for tens of thousands of years. A new mosaic assembled from Chandra and Webb observations shows five such remnants side by side, each at a different stage of its slow fade.',
    'The youngest of the five, only a few centuries old, still shows the sharp, bright edges of a shock wave ploughing into the surrounding gas at thousands of kilometres per second. The oldest has broken into faint, lacy filaments that are barely distinguishable from the background glow of the galaxy.',
    'By comparing the remnants, astronomers can trace how the energy of an explosion is gradually handed off to the interstellar medium — heating it, stirring it, and seeding it with heavy elements such as iron, silicon and oxygen that later find their way into new stars and planets.',
    'X-ray data reveal gas heated to millions of degrees, while infrared observations pick out dust grains that survived the blast. That dust is of particular interest: it suggests supernovae may be net producers of the solid material that builds rocky worlds.',
    '“Each of these objects is a snapshot,” one of the researchers noted. “Put together, they become a time-lapse of how a star’s death reshapes its neighbourhood.”'
  ],
  juice: [
    'ESA’s Jupiter Icy Moons Explorer, Juice, is set to swing past Earth for the third time as it continues its long, looping route to the giant planet. The manoeuvre will use Earth’s gravity to bend the spacecraft’s path and add speed without spending precious fuel.',
    'The flyby is one of several gravity assists on Juice’s eight-year journey, which has already taken it past the Moon and Earth together and past Venus. Each encounter is choreographed years in advance, with navigators refining the trajectory to within a few kilometres.',
    'Mission teams will use the close approach to switch on and calibrate several of Juice’s science instruments, observing Earth and the Moon as stand-ins for the icy worlds it will eventually study.',
    'Juice is due to arrive at Jupiter in 2031. Over the following years it will make dozens of flybys of Europa, Ganymede and Callisto before entering orbit around Ganymede — the first time a spacecraft will orbit a moon other than our own.',
    'Scientists hope to learn whether the subsurface oceans suspected beneath the moons’ icy crusts could provide environments suitable for life.'
  ],
  galaxy: [
    'Astronomers have found a galaxy whose inner disc rotates in the opposite direction to its outer regions, a rare configuration that points to a violent past.',
    'Using integral-field spectroscopy, the team measured the motions of stars and gas across the galaxy and found that the two components are separated by a sharp boundary about 6,000 light-years from the centre.',
    'The most likely explanation is that the galaxy captured a large cloud of gas — or swallowed a smaller companion — that was orbiting in the opposite sense. Over time, that material settled into its own disc and formed new stars that still carry the memory of their origin.',
    'Counter-rotating galaxies make up only a few percent of the disc galaxies astronomers have studied in detail, which makes each new example valuable for testing models of how galaxies grow by merging and accreting material.',
    'The researchers plan to use Webb to measure the ages of the stars in each disc and pin down when the collision happened.'
  ],
  harvest: [
    'The Full Moon nearest the autumnal equinox has a special name — the Harvest Moon — and a special trick. For a few nights around full, it rises only a little later each evening than the night before.',
    'Normally the Moon rises about 50 minutes later from one night to the next. Around the September equinox, however, the Moon’s path makes a shallow angle with the eastern horizon for observers at mid-northern latitudes, so the delay shrinks to as little as 20 or 30 minutes.',
    'In the days before electric light, that meant several evenings in a row with bright moonlight right after sunset — useful for farmers bringing in crops, which is how the name arose.',
    'The effect is stronger the farther north you live. Near the equator it almost disappears, while in Scandinavia the Moon can rise at nearly the same time for several nights running.',
    'This year the Harvest Moon falls on the night of September 26. Look east shortly after sunset to catch it climbing out of the twilight, when the so-called Moon illusion makes it look enormous.',
    'You don’t need any equipment to enjoy it, but binoculars will reveal the dark lunar seas and the bright rays splashing out from the crater Tycho.'
  ],
  calendar: [
    'Want to plan your observing sessions — or simply know when the next Full Moon will light up the night? Here are all the Full Moon dates and times for the rest of 2026, along with the traditional names associated with each.',
    'October’s Hunter’s Moon arrives on the 26th, followed by November’s Beaver Moon on the 24th. December closes out the year with the Cold Moon on the 24th, a Christmas Eve Full Moon for much of the world.',
    'Each Full Moon occurs when the Moon sits opposite the Sun in our sky. Because the Moon’s orbit is tilted by about 5 degrees, most months it passes just above or below Earth’s shadow — and only occasionally do the three bodies line up for a lunar eclipse.',
    'For deep-sky observers, the days around Full Moon are the worst time to hunt faint galaxies and nebulae. The week around New Moon offers the darkest skies.'
  ],
  roemer: [
    'On this date in 1644, Danish astronomer Ole Rømer was born in Aarhus. He is best remembered for making the first quantitative measurement of the speed of light.',
    'Working at the Paris Observatory in the 1670s, Rømer noticed that the eclipses of Jupiter’s moon Io came earlier than predicted when Earth was approaching Jupiter and later when Earth was moving away.',
    'He correctly reasoned that the discrepancy arose because light takes time to cross the changing distance between the two planets. His estimate — that light needs about 22 minutes to cross the diameter of Earth’s orbit — was too long, but it established that light travels at a finite speed.',
    'Rømer later served as Copenhagen’s chief of police, reformed the city’s street lighting and helped standardise Danish weights and measures.'
  ],
  jezero: [
    'New results from NASA’s Perseverance rover suggest that the water which once filled Jezero Crater on Mars behaved in far more complicated ways than a single lake fed by a single river.',
    'By studying layered rocks along the crater’s western fan, the science team found evidence for at least three distinct episodes of flowing water, separated by long dry intervals in which the sediments were eroded and reworked.',
    'Ground-penetrating radar from the rover’s RIMFAX instrument reveals buried channels and tilted layers beneath the surface — structures that match what geologists see in river deltas on Earth that were repeatedly flooded and exposed.',
    'The findings matter for the search for ancient life. A lake that came and went may have concentrated organic molecules in some layers while destroying them in others, so the team is using the new map to decide which rocks are most promising to sample.',
    'Several of the cores Perseverance has already sealed come from layers now thought to have been deposited during the wettest phase, making them priority targets for the future sample-return effort.'
  ],
  shock: [
    'Engineers at a Swiss university have designed a lightweight lattice structure that absorbs landing impacts far better than conventional crushable honeycomb, potentially making future Moon and Mars landers lighter and safer.',
    'The design uses a 3D-printed metal lattice whose cells collapse in a controlled sequence. Instead of spiking sharply on impact, the force on the payload rises smoothly and stays nearly constant, the ideal profile for protecting delicate instruments.',
    'In drop tests, the lattice absorbed about 40 percent more energy per kilogram than aluminium honeycomb of the same size. Because the geometry can be tuned cell by cell, the same approach could be tailored to different landers and gravity levels.',
    'The team is now working with a European space company to test the concept on a small lunar lander leg later next year.'
  ],
  dream: [
    'A team at Stanford has trained a spacecraft guidance system that learns to dock with a space station by rehearsing thousands of approaches in simulation — a process the researchers liken to dreaming.',
    'The system uses a world model that predicts how the spacecraft will respond to thruster firings. It practises inside that model, then transfers what it has learned to a real control loop.',
    'In laboratory tests using free-floating robots on an air-bearing table, the approach reached the docking port with fewer course corrections and less propellant than a conventional controller.',
    'The researchers stress that any such system would run alongside proven guidance software for years before being trusted on a crewed vehicle.'
  ],
  plasma: [
    'ESA and NASA’s Solar Orbiter has captured a towering column of twisting plasma rising from the Sun’s surface, one of the largest “solar tornadoes” ever seen in such detail.',
    'The structure stretched more than 100,000 kilometres above the photosphere — several times the diameter of Earth — and rotated for nearly two days before erupting into space.',
    'Despite the name, solar tornadoes are shaped by magnetic fields rather than winds. They mark the footpoints of prominences, great arches of cool, dense gas held aloft by the Sun’s tangled magnetism.',
    'Watching them evolve helps scientists understand how prominences become unstable, and why some of them launch coronal mass ejections that can trigger auroras and disrupt satellites when they reach Earth.'
  ],
  webb: [
    'The James Webb Space Telescope has produced a sweeping panorama of IC 348, a young star cluster in Perseus, revealing wisps of dust lit by hundreds of newborn stars.',
    'Among the discoveries are several free-floating brown dwarfs with masses only about twice that of Jupiter — some of the smallest objects ever found that formed like stars rather than planets.',
    'Their existence challenges models of star formation, which struggle to explain how a collapsing cloud of gas could fragment into such tiny pieces.',
    'The image also shows a mysterious infrared signature in some of the objects that astronomers have tentatively linked to a hydrocarbon molecule never before seen outside the Solar System.',
    'Follow-up spectroscopy with Webb’s NIRSpec instrument is already scheduled.'
  ],
  tde: [
    'Astronomers using ESO’s Very Large Telescope have watched a star being shredded by a supermassive black hole in a galaxy 215 million light-years away — one of the closest such events ever caught.',
    'When a star strays too close to a black hole, tidal forces stretch it into a thin stream of gas, a process astronomers call a tidal disruption event. About half the debris falls towards the black hole while the rest is flung outward.',
    'Because the team detected the flare early, they could follow how an outflow of material expanded and briefly obscured the X-ray glow from the inner regions, solving a long-standing puzzle about why many such events appear dimmer than expected.',
    'The observations were coordinated across several ESO instruments and space telescopes in the weeks after the discovery.'
  ],
  aurora: [
    'A large, complex sunspot group is rotating into view on the Sun’s Earth-facing side, and forecasters say it has already produced several strong flares.',
    'If the region launches a coronal mass ejection toward Earth over the next few days, skywatchers at mid-latitudes could get a chance to see the northern and southern lights this weekend.',
    'The best strategy is to find a dark location away from city lights, face the pole, and let your eyes adapt for at least 20 minutes. Phone cameras on a long-exposure setting often pick up colour that the eye misses.',
    'Space weather forecasts are notoriously uncertain beyond a day or two, so check the latest alerts before heading out.'
  ],
  planets: [
    'Early risers this week can see a lovely line-up of planets in the east before dawn. Brilliant Venus leads the way, with Jupiter higher up and reddish Mars in between.',
    'On Tuesday morning the waning crescent Moon slides past Jupiter, making the pair easy to spot even from a bright suburb.',
    'Saturn, meanwhile, is well placed all evening in the southeast. A small telescope shows its rings tilted only slightly from edge-on this year.'
  ],
  week: [
    'The Harvest Moon rises around sunset on Saturday, flooding the sky with light for most of the night. Use the brighter evenings to explore the Moon itself: the terminator region is where craters and mountains show the most relief.',
    'Look for the Summer Triangle — Vega, Deneb and Altair — sinking into the west after dark, while the Great Square of Pegasus climbs in the east, heralding autumn.',
    'Mercury is lost in the Sun’s glare this week, but Venus is unmissable at dawn, blazing at magnitude −4.',
    'Algol, the famous eclipsing variable in Perseus, dims to minimum brightness late on Friday night for observers in the Americas.'
  ]
};

function page({ title, paras, image, author, jsonld = '', paywallTeaser = false, site = 'Example' }) {
  const body = [...paras, ...paras.slice(1)].map(p => `<p>${p}</p>`).join('\n');
  return `<!doctype html><html><head><title>${title} | ${site}</title>
  <meta property="og:image" content="${image || ''}"><meta name="author" content="${author || ''}">
  <meta property="og:description" content="${paras[0].slice(0, 160)}">
  ${jsonld}
  <script>window.dataLayer=[];</script><style>.x{}</style></head>
  <body>
   <header class="site-header"><nav class="main-menu"><a href="/">Home</a><a href="/news">News</a><a href="/sky">Observing</a><a href="/subscribe">Subscribe</a></nav></header>
   <div class="breadcrumb"><a href="/">Home</a> › <a href="/news">News</a></div>
   <main><article class="post">
     <h1>${title}</h1>
     <div class="share-buttons"><a href="#">Share on X</a> <a href="#">Facebook</a></div>
     ${image ? `<figure class="wp-block-image"><img src="${image}" alt=""><figcaption>Credit: ${site}</figcaption></figure>` : ''}
     <div class="entry-content">
       ${paywallTeaser ? `<p>${paras[0]}</p><div class="paywall-overlay"><p>Subscribe to continue reading this Test Report.</p></div>` : body}
       <div class="newsletter-signup"><p>Sign up for our weekly newsletter!</p><form><input></form></div>
       <figure><img src="https://img.test/pixel.gif" width="1" height="1"></figure>
     </div>
     <div class="related-posts"><h3>Related</h3><ul><li><a href="/a">Another story</a></li><li><a href="/b">Yet another</a></li></ul></div>
   </article>
   <aside class="sidebar"><div class="widget">Popular: <a href="/x">Ten best telescopes</a></div></aside></main>
   <footer class="site-footer">© ${site} · <a href="/privacy">Privacy</a></footer>
  </body></html>`;
}

const pages = {};
function rssItem({ title, url, t, desc, content, image, author }) {
  return `<item><title>${title.replace(/&/g, '&amp;')}</title><link>${url}</link><pubDate>${rfc(t)}</pubDate>
    ${author ? `<dc:creator><![CDATA[${author}]]></dc:creator>` : ''}
    <description><![CDATA[${desc}]]></description>
    ${content ? `<content:encoded><![CDATA[${content}]]></content:encoded>` : ''}
    ${image ? `<media:content url="${image}" medium="image"/>` : ''}</item>`;
}
const rss = (title, items) => `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${title}</title><atom:link href="x" rel="self"/><link>https://x</link>${items.join('')}</channel></rss>`;

function summaryStory(site, base, slug, title, key, t, image, author, extra = {}) {
  const url = `${base}/${slug}/`;
  pages[url] = page({ title, paras: P[key], image, author, site, ...extra });
  return rssItem({ title, url, t, author, desc: `${P[key][0].slice(0, 180)}… <a href="${url}">Continue reading</a> &nbsp;`, image: extra.feedImage === false ? '' : image });
}

const feeds = {
  'https://www.nasa.gov/feed/': rss('NASA', [
    rssItem({ title: 'APOD: Globular Star Cluster Omega Centauri', url: 'https://www.nasa.gov/image-article/omega-centauri/', t: now - 15 * H, desc: 'Omega Centauri is the largest globular cluster in the Milky Way.', content: `<p><img src="${img('cluster')}"></p>` + [...P.omega, ...P.omega].map(p => `<p>${p}</p>`).join(''), author: 'NASA' }),
    rssItem({ title: 'Explosive Intensification for Hurricane Polo', url: 'https://www.nasa.gov/image-article/hurricane-polo/', t: now - 16 * H, desc: 'A storm in the eastern Pacific grew rapidly.', content: '<p>Weather content that should be filtered by the astronomy-only switch.</p>'.repeat(40) }),
    rssItem({ title: 'The Ghosts of Five Supernovas', url: 'https://www.nasa.gov/image-article/ghosts-five-supernovas/', t: now - 1.6 * D, desc: 'A new mosaic shows five supernova remnants.', content: `<figure><img src="${img('nebula')}"><figcaption>Credit: NASA/CXC/STScI</figcaption></figure>` + [...P.ghosts, '<h3>What comes next</h3>', ...P.ghosts].map(p => p.startsWith('<h3>') ? p : `<p>${p}</p>`).join(''), author: 'Lee Mohon' }),
    rssItem({ title: 'An Old Story From Ten Days Ago', url: 'https://www.nasa.gov/old/', t: now - 10 * D, desc: 'Too old for this edition.', content: '<p>Old news about the Moon.</p>'.repeat(40) })
  ]),
  'https://www.esa.int/rssfeed/Our_Activities/Space_Science': rss('ESA', [
    summaryStory('ESA', 'https://www.esa.int/Science_Exploration', 'Juice_to_fly_past_Earth', 'Juice to fly past Earth for third gravity assist', 'juice', now - 4 * D, img('planet'), ''),
    summaryStory('ESA', 'https://www.esa.int/Science_Exploration', 'A_galaxy_spinning_out_of_sync', 'A galaxy spinning out of sync', 'galaxy', now - 6.5 * D, img('galaxy'), '')
  ]),
  'https://www.astronomy.com/feed/': rss('Astronomy Magazine', [
    summaryStory('Astronomy', 'https://www.astronomy.com/observing', 'what-is-the-harvest-moon-effect', 'What is the Harvest Moon effect?', 'harvest', now - 5 * H, img('moon'), 'Alison Klesman'),
    summaryStory('Astronomy', 'https://www.astronomy.com/observing', '2026-full-moon-calendar', '2026 Full Moon calendar: When to see the Full Moon and phases', 'calendar', now - 6 * H, '', 'Astronomy Editors'),
    summaryStory('Astronomy', 'https://www.astronomy.com/science', 'sept-25-1644-the-birth-of-ole-roemer', 'Sept. 25, 1644: The birth of Ole Roemer', 'roemer', now - 6.5 * H, '', 'Michael E. Bakich'),
    summaryStory('Astronomy', 'https://www.astronomy.com/science', 'inside-the-race-to-image-an-exo-earth', 'Inside the race to image an exo-Earth', 'galaxy', now - 2 * D, img('nebula'), 'Staff', { jsonld: '<script type="application/ld+json">{"@type":"NewsArticle","isAccessibleForFree":false}</script>' })
  ]),
  'https://www.universetoday.com/feed/': rss('Universe Today', [
    summaryStory('Universe Today', 'https://www.universetoday.com/articles', 'perseverance-jezero-water', 'Perseverance Reveals How Complex Water Systems Shaped the Jezero Crater on Early Mars', 'jezero', now - 22 * H, img('planet'), 'Evan Gough'),
    summaryStory('Universe Today', 'https://www.universetoday.com/articles', 'swiss-shock-absorber', 'Swiss Engineers Just Designed a Better “Shock Absorber” for Spacecraft', 'shock', now - 1.3 * D, img('rocket'), 'Andy Tomaswick'),
    summaryStory('Universe Today', 'https://www.universetoday.com/articles', 'spacecraft-dream', 'Stanford Engineers Teach Spacecraft to “Dream” Their Way to the Space Station', 'dream', now - 1.5 * D, '', 'Andy Tomaswick'),
    summaryStory('Universe Today', 'https://www.universetoday.com/articles', 'solar-tornado', 'Solar Orbiter Spots a Giant Plasma Tornado on the Sun', 'plasma', now - 3 * D, img('sun'), 'Mark Thompson')
  ]),
  'https://esawebb.org/news/feed/': rss('ESA/Webb', [
    summaryStory('ESA/Webb', 'https://esawebb.org/news', 'weic2620', 'Webb reveals stunning panorama of star formation in IC 348', 'webb', now - 2.5 * D, img('nebula'), 'ESA/Webb')
  ]),
  'https://esahubble.org/news/feed/': rss('ESA/Hubble', [
    summaryStory('ESA/Hubble', 'https://esahubble.org/news', 'dup', 'Webb reveals stunning panorama of star formation in IC 348', 'webb', now - 2.5 * D, img('nebula'), '', {})
  ]),
  'https://www.eso.org/public/news/feed/': `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>ESO Press Releases</title>
    <entry><title>Astronomers catch a star being torn apart by a black hole</title><link rel="alternate" href="https://www.eso.org/public/news/eso2616/"/><published>${new Date(now - 3.5 * D).toISOString()}</published><author><name>ESO</name></author><summary>The VLT watched a tidal disruption event unfold.</summary></entry></feed>`,
  'https://earthsky.org/feed/': rss('EarthSky', [
    summaryStory('EarthSky', 'https://earthsky.org/sun', 'auroras-this-weekend', 'Auroras possible this weekend as big sunspot turns Earthward', 'aurora', now - 9 * H, img('aurora'), 'Deborah Byrd'),
    summaryStory('EarthSky', 'https://earthsky.org/tonight', 'planets-at-dawn', 'See the planets at dawn this week', 'planets', now - 2.2 * D, '', 'Kelly Kizer Whitt'),
    rssItem({ title: 'Best gardening tips for autumn', url: 'https://earthsky.org/earth/gardening/', t: now - D, desc: 'Plant bulbs now.' })
  ]),
  'https://skyandtelescope.org/feed/': rss('Sky & Telescope', [
    summaryStory('Sky & Telescope', 'https://skyandtelescope.org/observing', 'sky-at-a-glance', 'This Week’s Sky at a Glance, September 25 – October 3', 'week', now - 12 * H, '', 'Alan MacRobert'),
    summaryStory('Sky & Telescope', 'https://skyandtelescope.org/reviews', 'test-report-dobsonian', 'Test Report: A Premium 8-inch Dobsonian', 'galaxy', now - 3 * D, img('moon'), 'Staff', { paywallTeaser: true })
  ])
};
pages['https://www.eso.org/public/news/eso2616/'] = page({ title: 'Astronomers catch a star being torn apart by a black hole', paras: P.tde, image: img('galaxy'), author: 'ESO', site: 'ESO' });
pages['https://earthsky.org/earth/gardening/'] = page({ title: 'Gardening', paras: ['Plant bulbs.'], site: 'EarthSky' });

// A publisher that moved its feed: the app should find the new address from the home page by itself.
pages['https://skyandtelescope.org/'] = '<html><head><link rel="alternate" type="application/rss+xml" href="/feed/"></head><body>Sky & Telescope</body></html>';
// Public sky data (same for everyone)
const doy = (d) => Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5) + d.getUTCHours() / 24;
const ep = (() => { const d = new Date(now - 6 * H); return String(d.getUTCFullYear()).slice(2) + doy(d).toFixed(8).padStart(12, '0'); })();
feeds['https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle'] = `ISS (ZARYA)\n1 25544U 98067A   ${ep}  .00016717  00000-0  10270-3 0  9005\n2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.49560532    10\nCSS (TIANHE)\n1 48274U 21035A   ${ep}  .00020000  00000-0  23000-3 0  9990\n2 48274  41.4700 100.0000 0005000 300.0000  60.0000 15.60000000    10\n`;
const cd = (t) => { const d = new Date(t); return `${d.getUTCFullYear()}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()]}-${String(d.getUTCDate()).padStart(2, '0')} 08:30`; };
feeds['https://ssd-api.jpl.nasa.gov/cad.api?dist-max=0.05&date-min=now&date-max=%2B60&sort=date&diameter=true&fullname=true'] = JSON.stringify({ signature: {}, count: 2, fields: ['des', 'orbit_id', 'jd', 'cd', 'dist', 'dist_min', 'dist_max', 'v_rel', 'v_inf', 't_sigma_f', 'h', 'diameter', 'diameter_sigma', 'fullname'], data: [['2026 TA', '3', '0', cd(now + 9 * D), '0.0021', '0.002', '0.0022', '9.1', '9.0', '< 00:01', '27.1', null, null, '       (2026 TA)'], ['2019 XY', '1', '0', cd(now + 30 * D), '0.03', '0.03', '0.03', '5', '5', '00:01', '21.4', null, null, '       (2019 XY)']] });
// Optional stress test: a very busy week (set global.__BIG = n extra stories)
function bigFeed() {
  const topics = ['Mars rover finds', 'Webb telescope spots', 'New exoplanet shows', 'Black hole reveals', 'Lunar mission returns', 'Comet surprises with', 'Solar flare triggers', 'Galaxy survey maps', 'Rocket launch carries', 'Asteroid sample holds'];
  const items = [];
  for (let i = 0; i < (global.__BIG || 0); i++) {
    const adj = ['unexpected', 'ancient', 'frozen', 'violent', 'hidden', 'gigantic', 'faint', 'rapid', 'twisted', 'pristine', 'glowing', 'shattered', 'dusty', 'magnetic', 'buried', 'dense', 'hollow', 'spinning', 'cold', 'bright'];
    const obj = ['crater chemistry', 'dust ring', 'water plume', 'radio burst', 'methane cloud', 'iron core', 'gas filament', 'ice sheet', 'shock front', 'lava tube', 'stellar nursery', 'debris disk', 'plasma jet', 'carbon grains', 'tidal stream', 'polar vortex', 'magnetic loop'];
    const place = ['Orion', 'Jezero', 'Europa', 'Sagittarius', 'Ceres', 'Titan', 'Andromeda', 'Vesta', 'Triton', 'Perseus', 'Enceladus', 'Carina', 'Io'];
    const t = `${topics[i % topics.length]} ${adj[i % adj.length]} ${obj[i % obj.length]} near ${place[i % place.length]}`; const url = `https://phys.org/news/big-${i}.html`;
    pages[url] = page({ title: t, paras: [`${t}. ${P[Object.keys(P)[i % Object.keys(P).length]][(i >> 2) % 3]}`, ...P[Object.keys(P)[i % Object.keys(P).length]]], image: i % 3 ? img(['nebula', 'galaxy', 'planet', 'moon', 'sun', 'cluster', 'aurora', 'rocket'][i % 8]) : '', author: 'Staff', site: 'Phys.org' });
    items.push(rssItem({ title: t, url, t: now - (i + 1) * 2.5 * H, desc: `${t}… <a href="${url}">Continue reading</a>`, image: i % 3 ? img(['nebula', 'galaxy', 'planet', 'moon', 'sun', 'cluster', 'aurora', 'rocket'][i % 8]) : '', author: 'Staff' }));
  }
  return rss('Phys.org', items);
}
module.exports = function fetchText(url) {
  if (global.__BIG && url.includes('phys.org/rss-feed')) return { ok: true, status: 200, text: bigFeed(), finalUrl: url, contentType: 'application/rss+xml' };
  if (!global.__BIG && url.includes('phys.org')) return { ok: false, status: 403, error: 'HTTP 403', text: '' };
  const text = feeds[url] || pages[url];
  if (!text) return { ok: false, status: 404, error: 'HTTP 404', text: '' };
  return { ok: true, status: 200, text, finalUrl: url, contentType: feeds[url] ? 'application/rss+xml' : 'text/html' };
};
