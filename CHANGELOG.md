# Changelog

Notable changes to The Daily Orbit. Versions follow [semantic versioning](https://semver.org/).

## [1.2.0] — 2026-10-10 (Build Day)

### Added
- **You & your paper** page: a taste chart per desk (now, and where each desk stood when the paper was printed) and a **"What left your laptop"** receipt listing every site contacted, with proof that no cookies, IDs, location or reading history were sent.
- **Listen**: reads a story aloud with the computer's own voices only (refuses online voices, so no text leaves the laptop).
- **PDF**: saves the whole paper, one page per sheet.
- **Compare**: for a story several publishers covered, shows how each one told it, side by side.
- **Demo paper (offline)** on the newsstand: a bundled sample edition for when there is no internet, with a learned taste to show.
- **▶ Briefing**: one click reads the edition's top five stories aloud in about two minutes (offline voices only).

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
- The launcher reuses an Electron runtime already on the laptop, then tries a download mirror, when GitHub downloads are blocked.

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

### Also in 1.0.0
Page turning on buttons only, continuous two-page reading, zoom and fit-width, "Why this?", model check and scorecard, optional pre-trained language model, privacy design and optional Tor, location-based sky page.

### Not yet verified on a real Windows install
The new feeds have only been checked from the build machine, not from the app on Windows. Also still to confirm there: the pre-trained model, the private network session and saved pictures, Tor routing, and the live orbit and asteroid data.
