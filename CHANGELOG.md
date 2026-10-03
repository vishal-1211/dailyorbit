# Changelog

Notable changes to The Astro Gazette. Versions follow [semantic versioning](https://semver.org/).

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

## Not yet verified on a real Windows install

The automated tests run in a browser with a stand-in network. Still to be confirmed by hand: the pre-trained language model, the private network session and saved pictures, Tor routing, and the live orbit and asteroid data addresses.
