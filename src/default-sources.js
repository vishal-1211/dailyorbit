// Default sources, grouped by topic. All are free-to-read publishers; anything behind a paywall is
// detected and skipped story by story when an edition is printed.
//
// topic:     which desk of the paper the source feeds
// topicOnly: keep only items that look like the topic (for mixed feeds)
// urlMatch:  keep only items whose link contains this text (for site-wide feeds)
// Feeds checked 10 Oct 2026 unless marked "not checkable from the build machine" (well-known feeds that
// the checking tool could not reach; the app reports any that fail and repairs moved ones itself).

module.exports = [
  { topic: 'world', id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', enabled: true, topicOnly: false },
  { topic: 'world', id: 'bbcworld', name: 'BBC · World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', enabled: true, topicOnly: false }, // not checkable from the build machine
  { topic: 'world', id: 'guardianworld', name: 'The Guardian · World', url: 'https://www.theguardian.com/world/rss', enabled: true, topicOnly: false }, // not checkable from the build machine
  { topic: 'world', id: 'nprworld', name: 'NPR · World', url: 'https://feeds.npr.org/1004/rss.xml', enabled: true, topicOnly: false },
  { topic: 'world', id: 'ndtvworld', name: 'NDTV · World', url: 'https://feeds.feedburner.com/ndtvnews-world-news', enabled: true, topicOnly: false },
  { topic: 'world', id: 'cbsworld', name: 'CBS News · World', url: 'https://www.cbsnews.com/latest/rss/world', enabled: false, topicOnly: false },
  { topic: 'world', id: 'skyworld', name: 'Sky News · World', url: 'https://feeds.skynews.com/feeds/rss/world.xml', enabled: false, topicOnly: false },
  { topic: 'world', id: 'dw', name: 'DW · World', url: 'https://rss.dw.com/rdf/rss-en-world', enabled: false, topicOnly: false }, // not checkable from the build machine
  { topic: 'india', id: 'ndtvindia', name: 'NDTV · India', url: 'https://feeds.feedburner.com/ndtvnews-india-news', enabled: true, topicOnly: false },
  { topic: 'india', id: 'theprint', name: 'ThePrint · India', url: 'https://theprint.in/category/india/feed/', enabled: true, topicOnly: false },
  { topic: 'india', id: 'scroll', name: 'Scroll.in', url: 'https://feeds.feedburner.com/ScrollinArticles.rss', enabled: true, topicOnly: false },
  { topic: 'india', id: 'hindu', name: 'The Hindu · National', url: 'https://www.thehindu.com/news/national/feeder/default.rss', enabled: true, topicOnly: false }, // not checkable from the build machine; some premium stories
  { topic: 'india', id: 'iexpress', name: 'Indian Express · India', url: 'https://indianexpress.com/section/india/feed/', enabled: false, topicOnly: false }, // not checkable from the build machine; some premium stories
  { topic: 'india', id: 'quint', name: 'The Quint', url: 'https://www.thequint.com/stories.rss', enabled: false, topicOnly: false },
  { topic: 'india', id: 'deccanchron', name: 'Deccan Chronicle', url: 'https://www.deccanchronicle.com/google_feeds.xml', enabled: false, topicOnly: true },
  { topic: 'finance', id: 'ndtvprofit', name: 'NDTV Profit', url: 'https://feeds.feedburner.com/ndtvprofit-latest', enabled: true, topicOnly: false },
  { topic: 'finance', id: 'printeco', name: 'ThePrint · Economy', url: 'https://theprint.in/category/economy/feed/', enabled: true, topicOnly: false },
  { topic: 'finance', id: 'livemint', name: 'Mint · Markets', url: 'https://www.livemint.com/rss/markets', enabled: true, topicOnly: false }, // not checkable from the build machine; some premium stories
  { topic: 'finance', id: 'bbcbiz', name: 'BBC · Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', enabled: true, topicOnly: false }, // not checkable from the build machine
  { topic: 'finance', id: 'nprbiz', name: 'NPR · Business', url: 'https://feeds.npr.org/1006/rss.xml', enabled: true, topicOnly: false },
  { topic: 'finance', id: 'marketwatch', name: 'MarketWatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', enabled: false, topicOnly: false }, // some metered stories
  { topic: 'finance', id: 'bsmarkets', name: 'Business Standard · Markets', url: 'https://www.business-standard.com/rss/markets-106.rss', enabled: false, topicOnly: false }, // many premium stories
  { topic: 'finance', id: 'skybiz', name: 'Sky News · Business', url: 'https://feeds.skynews.com/feeds/rss/business.xml', enabled: false, topicOnly: false },
  { topic: 'tech', id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', enabled: true, topicOnly: false },
  { topic: 'tech', id: 'engadget', name: 'Engadget', url: 'https://www.engadget.com/rss.xml', enabled: true, topicOnly: false },
  { topic: 'tech', id: 'ars', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', enabled: true, topicOnly: false }, // not checkable from the build machine
  { topic: 'tech', id: 'gadgets360', name: 'Gadgets 360', url: 'https://feeds.feedburner.com/gadgets360-latest', enabled: true, topicOnly: false },
  { topic: 'tech', id: 'verge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', enabled: false, topicOnly: false }, // not checkable from the build machine
  { topic: 'tech', id: 'nprtech', name: 'NPR · Technology', url: 'https://feeds.npr.org/1019/rss.xml', enabled: false, topicOnly: false },
  { topic: 'tech', id: 'techreview', name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', enabled: false, topicOnly: false }, // some metered stories
  { topic: 'science', id: 'sciencedaily', name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/all.xml', enabled: true, topicOnly: false },
  { topic: 'science', id: 'quanta', name: 'Quanta Magazine', url: 'https://www.quantamagazine.org/feed/', enabled: true, topicOnly: false },
  { topic: 'science', id: 'nprscience', name: 'NPR · Science', url: 'https://feeds.npr.org/1007/rss.xml', enabled: true, topicOnly: false },
  { topic: 'science', id: 'livescience', name: 'Live Science', url: 'https://www.livescience.com/feeds/all', enabled: true, topicOnly: false },
  { topic: 'science', id: 'bbcscience', name: 'BBC · Science', url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', enabled: false, topicOnly: false }, // not checkable from the build machine
  { topic: 'sports', id: 'cricinfo', name: 'ESPNcricinfo', url: 'https://www.cricinfo.com/rss/content/story/feeds/0.xml', enabled: true, topicOnly: false },
  { topic: 'sports', id: 'ndtvsports', name: 'NDTV Sports', url: 'https://feeds.feedburner.com/ndtvsports-latest', enabled: true, topicOnly: false },
  { topic: 'sports', id: 'skyfootball', name: 'Sky Sports · Football', url: 'https://www.skysports.com/rss/11095', enabled: true, topicOnly: false },
  { topic: 'sports', id: 'skyf1', name: 'Sky Sports · F1', url: 'https://www.skysports.com/rss/12433', enabled: true, topicOnly: false },
  { topic: 'sports', id: 'skytennis', name: 'Sky Sports · Tennis', url: 'https://www.skysports.com/rss/12110', enabled: true, topicOnly: false },
  { topic: 'sports', id: 'bbcsport', name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', enabled: false, topicOnly: false }, // not checkable from the build machine
  { topic: 'sports', id: 'f1com', name: 'Formula1.com', url: 'https://www.formula1.com/en/latest/all.xml', enabled: false, topicOnly: false }, // items carry no dates
  { topic: 'sports', id: 'guardiansport', name: 'The Guardian · Sport', url: 'https://www.theguardian.com/sport/rss', enabled: false, topicOnly: false }, // not checkable from the build machine
  { topic: 'health', id: 'nprhealth', name: 'NPR · Health', url: 'https://feeds.npr.org/1128/rss.xml', enabled: true, topicOnly: false },
  { topic: 'health', id: 'stat', name: 'STAT', url: 'https://www.statnews.com/feed/', enabled: true, topicOnly: false }, // some paid stories
  { topic: 'health', id: 'sdhealth', name: 'ScienceDaily · Health', url: 'https://www.sciencedaily.com/rss/health_medicine.xml', enabled: true, topicOnly: false },
  { topic: 'health', id: 'bbchealth', name: 'BBC · Health', url: 'https://feeds.bbci.co.uk/news/health/rss.xml', enabled: false, topicOnly: false }, // not checkable from the build machine
  { topic: 'culture', id: 'nprculture', name: 'NPR · Culture', url: 'https://feeds.npr.org/1008/rss.xml', enabled: true, topicOnly: false },
  { topic: 'culture', id: 'bhungama', name: 'Bollywood Hungama', url: 'https://www.bollywoodhungama.com/rss/news.xml', enabled: true, topicOnly: false },
  { topic: 'culture', id: 'skyent', name: 'Sky News · Entertainment', url: 'https://feeds.skynews.com/feeds/rss/entertainment.xml', enabled: true, topicOnly: false },
  { topic: 'culture', id: 'guardianculture', name: 'The Guardian · Culture', url: 'https://www.theguardian.com/culture/rss', enabled: false, topicOnly: false }, // not checkable from the build machine
  { topic: 'astronomy', id: 'nasa',        name: 'NASA',                     url: 'https://www.nasa.gov/feed/',                              enabled: true,  topicOnly: true  },
  { topic: 'astronomy', id: 'apod',        name: 'NASA · Picture of the Day', url: 'https://apod.nasa.gov/apod.rss',                         enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'esa',         name: 'ESA · Space Science',      url: 'https://www.esa.int/rssfeed/Our_Activities/Space_Science', enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'astronomy',   name: 'Astronomy Magazine',       url: 'https://www.astronomy.com/feed/',                          enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'skytel',      name: 'Sky & Telescope',          url: 'https://skyandtelescope.org/astronomy-news/feed/',         enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'universe',    name: 'Universe Today',           url: 'https://www.universetoday.com/feed/',                      enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'badastro',    name: 'Bad Astronomy (Phil Plait)', url: 'https://rss.beehiiv.com/feeds/t0Uscv6JDz.xml',           enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'swab',        name: 'Starts With A Bang (Ethan Siegel)', url: 'https://bigthink.com/feed/all', urlMatch: '/starts-with-a-bang/', enabled: true, topicOnly: false },
  { topic: 'astronomy', id: 'astrobites',  name: 'Astrobites',               url: 'https://astrobites.org/feed/',                             enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'centauri',    name: 'Centauri Dreams',          url: 'https://www.centauri-dreams.org/feed/',                    enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'aaav',        name: 'AAA Vadodara',             url: 'https://www.aaavadodara.org/feed/',                        enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'webb',        name: 'ESA/Webb',                 url: 'https://esawebb.org/news/feed/',                           enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'hubble',      name: 'ESA/Hubble',               url: 'https://esahubble.org/news/feed/',                         enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'eso',         name: 'ESO',                      url: 'https://www.eso.org/public/news/feed/',                    enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'earthsky',    name: 'EarthSky',                 url: 'https://earthsky.org/feed/',                               enabled: true,  topicOnly: true  },
  { topic: 'astronomy', id: 'physorg',     name: 'Phys.org · Astronomy',     url: 'https://phys.org/rss-feed/space-news/astronomy/',          enabled: true,  topicOnly: false },
  { topic: 'astronomy', id: 'spacecom',    name: 'Space.com',                url: 'https://www.space.com/feeds/all',                          enabled: false, topicOnly: true  },
  { topic: 'astronomy', id: 'planetary',   name: 'The Planetary Society',    url: 'https://www.planetary.org/rss/articles',                   enabled: false, topicOnly: false },
];

// Old default URLs that have since moved: upgraded automatically in existing installs.
module.exports.MOVED = {
  'https://skyandtelescope.org/feed/': 'https://skyandtelescope.org/astronomy-news/feed/'
};
