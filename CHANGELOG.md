# Version 2.1.0 — released 3 Oct 2026

1. Proof the model works: scorecard after each edition (predicted vs what was actually opened), "Check the model now" in Sources (language test + taste test, says which model is in use), "Why this?" in the reader.
2. Source is now a git repository; tests no longer depend on this workspace's paths.
3. Pages change only by the arrow buttons or the ← → keys. Scrolling, dragging, edge clicks, Space and Page Up/Down no longer turn pages (a switch in Sources restores them).
4. More reading, smaller headings: cards print the story's opening paragraphs; page limit raised from 10 to 24 (adjustable 8–30); sections take as many pages as they need.
5. Continuous reading: a switch in the reader lays the story out as stacked two-page spreads to scroll through. Stays on or off as left.

# Version 2.0.1 — 3 Oct 2026

Fix: the launcher now downloads the Electron runtime itself when the install step did not, and falls back to npx; errors stay on screen.

# Version 2.0.0 — released 3 Oct 2026

All items below are in this release. Not yet verified on a real Windows install: the pre-trained language model, the private network session and saved pictures, Tor routing, and the live orbit/asteroid data addresses.

# Change log: round 2 (requested 1 Oct 2026)

Status: Batch A done in the working copy (NOT released). No release until Vishal says so.

Batch A done (1 Oct): 9 (S&T moved to /astronomy-news/feed/; old URL auto-upgraded), 8 (added APOD, Bad Astronomy, Starts With A Bang, Astrobites, Centauri Dreams, AAA Vadodara; added once to existing installs, removed ones stay removed), 7 (Fraunces headlines, Unbounded section heads/labels/drop caps), 2 (zoom 100–250% with pan, Ctrl+scroll, +/−/0 keys; Fit-width mode, W key; reader too), 12 basics (fonts bundled, renderer can't reach the network, private in-memory session, no cookies/referrer, all pictures saved at print time, Tor/proxy switch fail-closed, 'leaving the app' warning). Still to verify in real Electron on Windows: private session fetch, image protocol, Tor routing.

Item 11 follow-up (3 Oct): pre-trained model now wired as build-time download (scripts/fetch-model.js → models/, @huggingface/transformers 3.8.1 pinned, src/embedder.js in the main process, remote downloads disabled at run time, automatic fallback to the self-taught model; Sources shows which is in use). UNTESTED with the real model/library: this workspace cannot reach Hugging Face or npm. Tested here: fallback path, and the model path with stand-in vectors.

Batches B–E done (3 Oct), all in the working copy, NOT released: 4 (hard 10-page cap; card pages; All-stories list), 3+5 (modern paper: cover, top stories, Page 3 people, colour-coded sections, fun page with interactive quiz, did-you-know, fun facts, memes with link-out, by-the-numbers, on-this-day), 6 (auto summaries, story merging across publishers, ranking, adaptive sections and page count, self-repairing feeds), 10 (Eyes on the sky: 28 instrument profiles + related stories), 11 (on-device learning: reading log, 👍/👎, taste model, self-trained word vectors, variety slots, quiz difficulty, explain + reset; NOTE: a pre-trained ~25 MB language model could NOT be bundled from this workspace, so the model trains itself from downloaded articles instead), 13 (sky page for chosen city: Moon, planets, eclipses, conjunctions/occultations, transits, showers, ISS/Tiangong passes, asteroid flybys; location stays local). Unverified here: live CelesTrak and JPL data URLs, and everything that needs real Electron.

Batch B step 1 done (2 Oct): 1 (backdrop painted by the app: nebula, Milky Way, constellation chart, deep field; night and day versions; cross-fades to a new scene every 6 minutes; no downloads). Step 2 still to do: 4 (10-page cap).

| # | Request (Vishal's words, lightly trimmed) | Effort | Notes / open questions |
|---|---|---|---|
| 1 | Background is too clunky; match the theme and change it periodically (nebula, constellations…) | Medium | Rotating backdrops drawn by the app (nebula, constellation maps, star fields), tied to the night/day theme. |
| 2 | Reading is difficult; no zoom button to ease reading horizontally | Light | DECIDED: both. A zoom button on the current page, plus a fit-to-width single-page mode with bigger text. |
| 3 | Too much like an 80s newspaper with too many pages | Medium–Heavy | Part of one redesign with 4 and 5. |
| 4 | Content and pages must not exceed 10 | Medium | Hard cap of 10 pages. The paper shows the best stories and short summaries; full text stays in the reader. |
| 5 | Modern newspaper: images, quiz, did you know, page 3, fun facts, memes, etc. | Heavy | DECIDED: Page 3 = astronomy personalities (astronauts, scientists, people in the news). Memes = made by the app's own built-in generator (no paid AI); if it can't make a good one, a link to an external meme page instead. |
| 6 | Add intelligence so it adapts automatically instead of me asking for logic changes | Heavy | DECIDED: zero cost. No paid AI/API. Built-in logic only: auto story ranking, section balancing, quiz/facts/did-you-know generated from the articles plus a bundled fact library. |
| 7 | Funky font titles / attention-grabbing areas | Light | Display fonts for section heads, pull quotes, stat callouts. |
| 8 | Add AAA Vadodara, Bad Astronomy, and other worthwhile blogs/sites by default | Light | Need to verify feeds; Bad Astronomy is on Substack, so some posts may be paywalled. |
| 9 | Sky & Telescope link wasn't working; check it | Light | It refused automated requests (HTTP 403) during testing. Will investigate. |
| 10 | Add articles about great optical instruments out there (telescopes, observatories, etc.) | Medium | Instruments section/feature: built-in profiles of notable telescopes plus instrument stories from feeds. |
| 11 | Make it learn like a machine-learning model so it perfects itself with each edition | Medium–Heavy | DECIDED: yes to all three — private on-device reading log (with a Reset button), 👍/👎 buttons, and a free offline language model (~25 MB). Keep ~20% variety slots. HARD RULE (revised 1 Oct): inbound only. The app/model MAY download things to refine itself (model updates, fact datasets, reference pages), but all learning happens on the laptop and nothing about Vishal flows out. Requests must be generic (the same no matter what he reads, or based only on the edition's public stories), never built from his reading log or 👍/👎 — no personalised searches; download broadly and filter locally. No telemetry/analytics, no uploads, no cookies/IDs. Automated test checks every outgoing request for log data and fails if any is found. |
| 12 | No digital footprint: nobody should be able to tell "this person, on this machine, at this location, reads these things" | Medium | Plan: (a) keep fetching EVERY story in the window, not just ones he reads; (b) download & cache all article text and images at print time, so nothing loads when he reads a page; (c) bundle fonts locally (stop calling Google Fonts); (d) private network session: no cookies, no stored IDs, no referrer, same generic browser signature as everyone; (e) Electron/Chromium phone-home features off; (f) "Original" button warns it opens his browser; (g) DECIDED: optional switch in Settings to route all app traffic through Tor (or a VPN/proxy address); off by default; fail-closed (if Tor is unreachable, the app does NOT fall back to a direct connection). Honest limit: without (g), publishers/ISP can see his IP fetched their feeds, but not which stories he read. |
| 13 | Sky events for MY location (Vadodara or wherever I am): (1) moon phase, (2) upcoming occultations, flybys, transits, passes, (3) upcoming eclipses, (4) upcoming ISS and other satellite passes | Medium–Heavy | Plan: compute locally with open-source astronomy code bundled in the app (moon phase + rise/set, eclipses with local visibility, Mercury/Venus transits, Moon occulting planets/bright stars, planet conjunctions). ISS/satellite passes: download the public orbit file (same for everyone) and compute passes on the laptop. Asteroid/comet flybys: public close-approach list. LOCATION NEVER LEAVES THE LAPTOP: user picks a city from a bundled offline list or types coordinates; no IP or Windows/Google geolocation lookups. Shown in the Almanac/back page + a 'Tonight' box. |

## Suggested order (lightest first)
1. Batch A (light): 9, 8, 7, 2, plus privacy basics from 12 (fonts, cookies, image caching)
2. Batch B (medium): 1, 4
3. Batch C (heavy, one redesign): 3 + 5 + 6 + 10
4. Batch D: 11 (builds on the redesign's story ranking)
5. Batch E: 13 (sky events; feeds the redesigned Almanac)
