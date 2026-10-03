// Default sources. All are free-to-read publishers; anything that turns out to be
// behind a paywall is detected and skipped article-by-article at generation time.
//
// astroOnly: keep only items that look like astronomy/space (for mixed feeds).
// urlMatch:  keep only items whose link contains this text (for site-wide feeds).
// Feeds verified 1 Oct 2026.

module.exports = [
  { id: 'nasa',        name: 'NASA',                     url: 'https://www.nasa.gov/feed/',                              enabled: true,  astroOnly: true  },
  { id: 'apod',        name: 'NASA · Picture of the Day', url: 'https://apod.nasa.gov/apod.rss',                         enabled: true,  astroOnly: false },
  { id: 'esa',         name: 'ESA · Space Science',      url: 'https://www.esa.int/rssfeed/Our_Activities/Space_Science', enabled: true,  astroOnly: false },
  { id: 'astronomy',   name: 'Astronomy Magazine',       url: 'https://www.astronomy.com/feed/',                          enabled: true,  astroOnly: false },
  { id: 'skytel',      name: 'Sky & Telescope',          url: 'https://skyandtelescope.org/astronomy-news/feed/',         enabled: true,  astroOnly: false },
  { id: 'universe',    name: 'Universe Today',           url: 'https://www.universetoday.com/feed/',                      enabled: true,  astroOnly: false },
  { id: 'badastro',    name: 'Bad Astronomy (Phil Plait)', url: 'https://rss.beehiiv.com/feeds/t0Uscv6JDz.xml',           enabled: true,  astroOnly: false },
  { id: 'swab',        name: 'Starts With A Bang (Ethan Siegel)', url: 'https://bigthink.com/feed/all', urlMatch: '/starts-with-a-bang/', enabled: true, astroOnly: false },
  { id: 'astrobites',  name: 'Astrobites',               url: 'https://astrobites.org/feed/',                             enabled: true,  astroOnly: false },
  { id: 'centauri',    name: 'Centauri Dreams',          url: 'https://www.centauri-dreams.org/feed/',                    enabled: true,  astroOnly: false },
  { id: 'aaav',        name: 'AAA Vadodara',             url: 'https://www.aaavadodara.org/feed/',                        enabled: true,  astroOnly: false },
  { id: 'webb',        name: 'ESA/Webb',                 url: 'https://esawebb.org/news/feed/',                           enabled: true,  astroOnly: false },
  { id: 'hubble',      name: 'ESA/Hubble',               url: 'https://esahubble.org/news/feed/',                         enabled: true,  astroOnly: false },
  { id: 'eso',         name: 'ESO',                      url: 'https://www.eso.org/public/news/feed/',                    enabled: true,  astroOnly: false },
  { id: 'earthsky',    name: 'EarthSky',                 url: 'https://earthsky.org/feed/',                               enabled: true,  astroOnly: true  },
  { id: 'physorg',     name: 'Phys.org · Astronomy',     url: 'https://phys.org/rss-feed/space-news/astronomy/',          enabled: true,  astroOnly: false },
  { id: 'spacecom',    name: 'Space.com',                url: 'https://www.space.com/feeds/all',                          enabled: false, astroOnly: true  },
  { id: 'planetary',   name: 'The Planetary Society',    url: 'https://www.planetary.org/rss/articles',                   enabled: false, astroOnly: false }
];

// Old default URLs that have since moved: upgraded automatically in existing installs.
module.exports.MOVED = {
  'https://skyandtelescope.org/feed/': 'https://skyandtelescope.org/astronomy-news/feed/'
};
