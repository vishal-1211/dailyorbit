# Round 4 requests (10 Oct 2026, at the Claude Build Day) — noted before building

Status: done. Released as The Daily Orbit 1.0.0 on 10 Oct 2026 (Vishal said "release once you are done").

| # | Request (Vishal's words, trimmed) | How it will be done |
|---|---|---|
| 1 | Make it more generic: your daily newspaper, not just astronomy | New app built from Astro Gazette's engine. Astro Gazette stays as it is. |
| 2 | Give the app a cool name | **The Daily Orbit** (news that orbits around you). One constant to change if you prefer another. |
| 3 | Sections such as Finance, Sports, Astronomy | Topics: World, India, Finance, Technology, Science, Sports, Astronomy, Health, Entertainment. Each topic has its own sub-sections (e.g. Finance → Markets, Economy, Companies, Personal finance, Crypto). |
| 4 | Generate a specific-topic paper OR a general paper with all topics | Newsstand home screen: pick "Everything" or one or more topics, then Generate. Topic papers get a topic masthead. |
| 5 | Pre-filled sources per topic that the user can manage like now | Sources window grouped by topic; feeds checked on 10 Oct 2026 (some publishers could not be checked from here and are marked). |
| 6 | Learning applies, and learns the user across topics | One shared model: learns which topics, publishers, sections and subjects you read, across every paper type. The general paper gives more room to topics you read most, but always keeps some of every topic. |
| 7 | All earlier UI/UX applies: page turning, memes, quiz etc. | Kept: buttons-only page turning, zoom, fit-width, continuous reader, quiz, did-you-know, memes, Page 3, Why this?, model check, privacy, Tor. Quiz/facts/memes extended to every topic; sky page and instruments page appear when Astronomy is in the paper. |
| 8 | Cooler interface and UI/UX | New look: newsstand home, topic colours and icons, new masthead and logo. |

Working rules still in force: note changes first; zero cost (no paid APIs); nothing about the reader leaves the laptop; no release until he says so.

# Round 5 requests (10 Oct 2026, 16:34) — noted before building

Status: done in version 1.1.0 (built, waiting for Vishal to say release).

| # | Request | How it will be done |
|---|---|---|
| 1 | **No. 1 priority:** printing "Everything" took 5 minutes. Make it much faster: caching or any design choice. | Read fewer, fresher stories per desk (chosen by date, never by taste, so privacy holds); fetch many more pages at once with shorter time-outs; keep a local cache of articles already read so the next paper reuses them; fetch sky data and pictures in parallel. Measure before and after. |
| 2 | Wallpaper still looks like Astro Gazette (galaxies). Change it or mix it by the topics selected. | New painted backdrops per desk (markets, globe, circuits, pitch, molecules, pulse, film, India), rotating among the desks in the paper on the desk; galaxies only when Astronomy is in it. |
| 3 | Publisher logos sometimes stretch/crop (ThePrint showed only "RI"). | Detect logo/placeholder pictures (same picture on several stories of a publisher, very wide or tiny images, "logo" in the address) and drop them; never crop a picture that is mostly text. |
