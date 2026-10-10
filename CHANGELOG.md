# Changelog

Notable changes to The Daily Orbit. Versions follow [semantic versioning](https://semver.org/). Versions before 1.0.0 were released as The Astro Gazette (astronomy only) and are kept below for history.

## [1.2.0] — 2026-10-10 (Build Day)

### Added
- **You & your paper** page: a taste chart per desk (now, and where each desk stood when the paper was printed) and a **"What left your laptop"** receipt listing every site contacted, with proof that no cookies, IDs, location or reading history were sent.
- **Listen**: reads a story aloud with the computer's own voices only (refuses online voices, so no text leaves the laptop).
- **PDF**: saves the whole paper, one page per sheet.
- **Compare**: for a story several publishers covered, shows how each one told it, side by side.
- **Demo paper (offline)** on the newsstand: a bundled sample edition for when there is no internet.

## [1.1.0] — 2026-10-10

### Changed
- **Printing is much faster.** An Everything paper reads at most 5 stories per publisher and 14 per desk (40 for a single-desk paper), chosen newest-first by date only, so the requests still say nothing about your taste. Feeds load 24 at a time and stories 20 at a time (at most 3 per site), with shorter time-outs (15 s feeds, 12 s stories, 10 s pictures) so one slow site no longer holds up the paper. Orbit data loads alongside the news. At most 3 pictures per story and 160 per paper are saved, 16 at a time. Benchmark (49 publishers, 1.5 s per request): about 22 s from click to paper, against several minutes before.
- **Local article cache:** stories already read out of their pages are kept on this laptop for 8 days (`article-cache.json`), so a second paper the same day (say Finance after Everything) reuses them instead of downloading them again.
- **Backdrops per desk:** markets, globes, rangoli, circuits, molecules, pitch and track, heartbeat, film strips; galaxies only when Astronomy is in the paper. The backdrop follows the paper on the desk and the desks picked on the newsstand.
- Desks with only one or two stories share "Around the desks" pages instead of leaving near-empty pages.
- **↑ / ↓** move the page up and down (zoomed, fit-to-width, continuous reader); they never turn pages.
- Default city is now Mumbai (existing installs follow unless a city was picked by hand). Windows' location service is deliberately not used: it sends nearby Wi-Fi details to an online service.

### Fixed
- Publisher logos shown as story pictures, cropped to a few letters (e.g. ThePrint). Pictures reused across one publisher's stories, addresses that say logo/placeholder/default, tiny pictures and banners are no longer used as photos.
- The launcher reuses the Electron runtime already downloaded for The Astro Gazette, then tries a download mirror, when GitHub downloads are blocked.

## [1.0.0] — 2026-10-10 · The Daily Orbit

Built at the Claude Build Day in Mumbai.

### Added
- New name and look: **The Daily Orbit**, with a new logo, masthead and colour per desk.
- **Nine desks**: World, India, Finance, Technology, Science, Sports, Astronomy, Health, Entertainment, each with its own sections and a keyword filter for mixed feeds.
- **Newsstand** home screen: print **Everything** or any mix of desks. Each kind of paper keeps its own "since last edition" window; stories are never repeated across papers.
- About 70 pre-filled sources grouped by desk (checked 10 Oct 2026); Sources window with desk tabs, a desk picker for new sources, and a switch for which desks go into the Everything paper.
- **One brain across topics**: the learning model now knows topics. Topic preferences are kept relative, so liking one desk lifts it above the others. The Everything paper orders desks and shares out pages by what you read, while always giving every desk with news at least one page.
- Page 3 people, did-you-know facts, quiz questions and meme cards for every desk; the quiz and memes mix desks in a general paper.
- Topic papers get their own masthead ("Finance edition"); the telescope and sky pages appear only when Astronomy is in the paper.
- Undated feed items (e.g. Formula1.com) are now accepted.

### Kept from The Astro Gazette 2.1.0
Page turning on buttons only, continuous two-page reading, zoom and fit-width, "Why this?", model check and scorecard, pre-trained language model, privacy design and optional Tor.

### Not yet verified on a real Windows install
The new feeds have only been checked from the build machine, not from the app on Windows. The same items as before also remain unverified there (pre-trained model, private network session and saved pictures, Tor, live orbit and asteroid data).

## [2.1.0] — 2026-10-03

### Added
- Proof the model works: a scorecard after each edition, **Check the model now** in Sources (language test, taste test, which model is in use) and **Why this?** in the reader.
- Continuous reading: a switch in the reader that lays a story out as stacked two-page spreads to scroll through. It stays as left.
- Setting for the most pages in a paper (8–30).
- The source as a git repository, with documentation.

### Changed
- Pages turn only with the arrow buttons or the ← → keys. Scrolling, dragging, edge clicks, Space and Page Up/Down no longer turn pages; a setting restores them.
- More reading, smaller headings: stories on the pages print their opening paragraphs. Page limit raised from 10 to 24, and sections take as many pages as they need.
- Tests no longer depend on one machine's paths.

## [2.0.1] — 2026-10-03

### Fixed
- `Run Astro Gazette.bat` failed with "Windows cannot find node_modules/electron/electron.exe" when the install step had not downloaded Electron. The launcher now downloads it, falls back to `npx`, and keeps errors on screen.

## [2.0.0] — 2026-10-03

### Added
- A modern paper: front page, top stories, Page 3 (people in astronomy), colour-coded sections, Eyes on the sky (great optical instruments), Fun & games (quiz, did-you-know, fun facts, home-made memes), Your sky and a back page.
- Built-in intelligence at no cost: automatic summaries, key facts and numbers, merging of the same story from several publishers, ranking, adaptive sections, feeds that repair themselves when a publisher moves them.
- On-device learning from reading, 👍/👎 and quiz answers, with an optional pre-trained language model downloaded at install time.
- Your sky for any location: Moon phase, planets, eclipses, conjunctions and occultations, transits, meteor showers, space-station passes and asteroid flybys.
- Privacy by design: windows cannot reach the internet, a private in-memory fetch session without cookies or referrer, every picture saved at print time, bundled fonts, optional Tor or proxy routing that fails closed.
- Rotating painted backdrops (nebula, Milky Way, constellation chart, deep field) for night and day themes.
- Zoom with panning, and fit-to-width mode.
- New display fonts.
- Sources: APOD, Bad Astronomy, Starts With A Bang, Astrobites, Centauri Dreams, AAA Vadodara.
- **All stories** list for everything an edition collected.

### Changed
- Paper limited to 10 pages (raised in 2.1.0).

### Fixed
- Sky & Telescope feed address; existing installs are corrected automatically.

## [1.0.0]

- First version: **Generate edition** gathers free-to-read astronomy stories since the last edition (at most the last 7 days), skips paywalled ones, and shows them as a newspaper with sections and page-turn animation. Separate Sources window. Night and day themes.

## Not yet verified (Astro Gazette 2.x)

The automated tests run in a browser with a stand-in network. Still to be confirmed by hand: the pre-trained language model, the private network session and saved pictures, Tor routing, and the live orbit and asteroid data addresses.
