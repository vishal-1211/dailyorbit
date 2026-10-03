# The Astro Gazette

Your personal astronomy newspaper for Windows. Press **Generate edition** and it gathers the free-to-read astronomy stories from the sources you pick, reads the full articles, and prints them as a newspaper made for you.

## Getting started

You need **Node.js** (the LTS version from https://nodejs.org) — version 20 or newer.

| Want to… | Do this |
|---|---|
| Just run it | Double-click **`Run Astro Gazette.bat`** (first run installs Electron, ~1 min) |
| Install it like a normal app | Double-click **`Build Windows Installer.bat`**. When it finishes, the `dist` folder has `AstroGazette-Setup-<version>.exe` (installer with Start-menu + desktop shortcuts) and `AstroGazette-Portable-<version>.exe` (single file, no install) |

Or from a terminal: `npm install` then `npm start`.

## How the edition window works

The app remembers when you last printed an edition.

- **First edition** → stories from the past 7 days.
- **Last edition was less than 7 days ago** → everything published since that edition. Print today and again tomorrow, and tomorrow's paper holds only the new day's stories.
- **Away more than 7 days** → only the last 7 days. The paper tells you how long you were away.

If nothing is new, you get "You're all caught up" and your window isn't used up. If every source is unreachable (no internet), nothing changes either. The 7 days can be changed in **Sources → Edition settings** (1–30).

## Sources

Click **Sources** in the title bar to open the configuration window:

- Switch sources on/off, **Test** a feed, **Edit**, **Remove**.
- **Add a source**: paste a feed URL *or just the site's homepage* — the app finds the RSS feed for you.
- **Astro only** filter: for mixed feeds (e.g. NASA also posts Earth-science and weather), keeps only astronomy/space stories.

There are 18 default sources, among them NASA, ESA, ESO, Astronomy Magazine, Universe Today, EarthSky, Phys.org Astronomy, Sky & Telescope, APOD, Bad Astronomy, Starts With A Bang, Astrobites, Centauri Dreams and AAA Vadodara. The full list is in `src/default-sources.js`.

## Paywalls and full text

For each story in the window the app uses the feed's full text when the feed provides it (NASA does). Otherwise it opens the article page and extracts the story, stripping menus, ads, share buttons and "related" links. A story is **skipped** if:
- the publisher marks it subscriber-only (`isAccessibleForFree: false` / locked content tier), or
- the page shows a paywall and only a short teaser is public.

If a free page can't be read (some sites block automated readers), the feed's summary is shown instead with a link to the original. The footer of each edition lists, per source, how many stories were used, how many paywalled stories were skipped, and which sources couldn't be reached.

## The paper

Every edition is laid out automatically and sized to your window. It grows with the news: a quiet week is about 9 pages, a busy one up to 24. Change the limit in **Sources → Edition settings → Most pages in a paper** (8–30).

1. **Front page**: the lead story, three more, tonight's Moon for your city, and an index.
2. **Top stories**: the best of the edition, each with its opening paragraphs, plus "by the numbers".
3. **Page 3, People**: a star of the edition (born this week when possible), people quoted in this edition's stories, and "on this day".
4. **Sections** (as many pages as the stories need): Skywatching, Solar System, Missions, Deep Space, Frontiers, colour-coded.
5. **Eyes on the sky**: a great optical instrument profiled each edition, with related stories.
6. **Fun & games**: a 5-question quiz (some questions come from this edition), did-you-know, fun facts, and two home-made memes.
7. **Your sky**: Moon, planets, eclipses, Moon-and-planet meetings, meteor showers, space-station passes and asteroid flybys for your location.
8. **Back page**: stories that didn't fit as briefs, sources, and what the paper has learned.

**All stories** in the title bar lists everything the edition collected.

**Turning pages.** Pages change only when you ask: the arrow buttons at the sides of the paper, the buttons in the bar, or the **← / →** keys. **Home / End** jump to the first/last page. Scrolling, dragging, Space and Page Up/Down never turn a page; they only move around the page you are on. If you prefer the old behaviour, switch on **Sources → Edition settings → Also turn pages by dragging, clicking a page edge or scrolling**.

**Zoom.** **− / +** or Ctrl+scroll (drag to move around), **0** to reset. **W** toggles fit-to-width: one large page with bigger text that you scroll. **A− / A+** change the type size.

**Reading a story.** Click any story to open it in the reader. **👍 / 👎** tell the paper what you want more or less of. **Why this?** shows why the paper picked the story. The **continuous reading** switch (the four-squares button in the reader bar) lays the whole story out as two-page spreads, one under the other, so you scroll straight through instead of turning pages; the switch stays as you left it. **Esc** returns to the paper.

## How it learns (all on your laptop)

- It notes which stories you open, how far you read, which you skip, your 👍/👎 and your quiz answers.
- From that it trains a small model of your taste and uses it to order the next edition. About one story in five is deliberately outside your usual taste.
- It also learns astronomy vocabulary from every article it downloads, so it can tell that two stories are about similar things even when the words differ.
- Quiz difficulty follows your score. Sections, page count and layout follow the content.
- If a publisher moves its feed, the app looks for the new address on the publisher's home page and updates the source itself.
- **Sources → What your paper has learned** shows what it believes, with a button to erase it.

**Is the model doing its job?** Three places to look, all on your laptop:

- **Scorecard** (Sources → What your paper has learned). After each edition the paper compares what it predicted with what you actually did: how often you opened the stories it ranked high against the ones it ranked low. If the first number is not clearly above the second after a few editions, it is not learning.
- **Check the model now** (same card). A language test (does it know that "lunar eclipse" is closer to "Moon in Earth's shadow" than to "rocket launch"?) and a taste test (does it score your 👍 stories above your 👎 stories?). It also says whether the pre-trained model or the self-taught one is in use.
- **Why this?** in the reader. For any story: the model's score, and what counted for and against it.

**Pre-trained language model (optional, free).** The two `.bat` files download a small open model (all-MiniLM-L6-v2, about 25 MB) into the `models` folder the first time, and install the library that runs it. With it, the paper understands what a story is about from the first edition. It runs only on your laptop, and the app is locked so it cannot download anything for the model while running. If the download fails or the model can't load, the app uses its built-in self-taught model instead; **Sources → What your paper has learned** says which one is in use. To retry the download: `npm run fetch-model`.

## Your location and the sky page

Set your city (or coordinates) in **Sources → Your location**. Vadodara is the default. All sky calculations run on your laptop; the location is never sent anywhere and is never looked up online. Space-station passes and asteroid flybys use two public data files (the same for everyone) downloaded when an edition is printed, so they refresh with each new edition.

## Privacy

- The app's windows cannot reach the internet. Only the fetcher can, through a private session with no cookies, no stored IDs and no referrer.
- Every story in the date window is downloaded, not just the ones you read; pictures are saved at print time. Reading touches nothing online.
- Fonts and all code libraries are bundled.
- Optional: **Sources → Privacy → Route through Tor** hides your internet address from publishers (needs Tor Browser running; if Tor is unreachable the app does not connect).
- Opening a story on the publisher's site asks first, because that is an ordinary web visit.

## Where your data lives

`%APPDATA%\The Astro Gazette\` — `config.json` (sources, settings, location), `state.json` (last edition time, stories already shown), `editions\` (back issues), `images\` (saved pictures), `learning.json` (reading log and everything learned). Delete `state.json` to start fresh with a 7-day edition.

## Project layout

```
src/main.js              Windows, storage, private network session, picture cache, Tor/proxy
src/plan.js              The catch-up window rule
src/migrate.js           Upgrades saved sources when defaults change
src/default-sources.js   Default publisher list
src/preload.js           Bridge between the windows and main process
src/embedder.js          Optional pre-trained language model (runs locally, never downloads at run time)
scripts/fetch-model.js   Build-time download of that model into ./models
src/renderer/
  app.js        Controller: printing, reading log, thumbs, quiz, zoom, continuous reader
  generate.js   Builds an edition: fetch → extract → understand → rank → extras
  brain.js      Summaries, facts, quotes, story merging, ranking, on-device learning
  extras.js     Quiz, did-you-know, memes, Page 3, instruments, on this day
  content.js    Bundled library: people, instruments, facts, quiz bank, dates, cities
  skyevents.js  Location-based sky calculations
  paper.js      The paper layout
  typeset.js    Book-reader pagination and shared helpers
  book.js       Page-turn engine, zoom, fit-to-width
  backdrop.js   Rotating painted sky backgrounds
  feed.js, extract.js   Feed parsing, article extraction, paywall detection
  sources.html/.css/.js Sources, location, learning and privacy window
  vendor/       astronomy-engine and satellite.js (MIT licences included)
  fonts/        Bundled fonts (SIL Open Font Licence files included)
```

## Tests

```
node test/brain.test.js     the learning model
node test/sky.test.js       sky calculations
node test/run.js            the whole app in a browser, with a stand-in for the network
```

The first two need only Node. The third needs Playwright (`npm install --no-save playwright && npx playwright install chromium`); screenshots go to `test/shots/`.

## Licence

MIT (see `LICENSE`). Bundled fonts are under the SIL Open Font Licence and the two astronomy libraries under MIT; their licence files sit next to them.
