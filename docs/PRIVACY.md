# Privacy design

The goal: the app may read the internet to make the paper better, but nobody outside can tell who is reading, from where, or what they like.

## What stays on the laptop

- Which stories were opened, how far they were read, ratings and quiz answers
- Everything the paper has learned from them
- The chosen location. Sky sums run locally; the location is never looked up online or sent
- Settings, sources and back issues

There are no accounts, no analytics, no crash reports and no update checks.

## What a publisher can see

A request for its public feed and for each article in the date window, from a generic reader, with:

- no cookies (none stored, none sent, `Set-Cookie` dropped)
- no `Referer` or `Origin`
- no stored identifiers: the network session lives in memory and is cleared after every print run

The app fetches every story in the window, not just the ones it prints or the reader opens, so the pattern of requests is the same whatever the reader's taste. Pictures are saved at print time, so reading makes no requests.

A publisher still sees the internet address the request came from, as any website does. To hide that as well, switch on **Sources → Privacy → Route through Tor** (needs Tor running) or use a VPN. With Tor or a proxy selected the app fails closed: if the route is down, it does not connect.

## What is enforced in code

| Rule | Where |
|---|---|
| Windows cannot make network requests | default session blocks `http/https/ws`; CSP `default-src 'none'` |
| Only the main process fetches, through a private in-memory session | `setupNetSession()` in `src/main.js` |
| Identifying headers removed | `onBeforeSendHeaders` / `onHeadersReceived` |
| Pictures served from disk | `gzimg://` protocol |
| The language model can never be downloaded at run time | `allowRemoteModels = false` in `src/embedder.js` |
| Fonts and libraries bundled | `src/renderer/fonts`, `src/renderer/vendor` |

`test/run.js` checks two of these on every run: two editions with different reading behaviour make the same set of requests, and the windows make none.

## The one exception

**Open original** opens a story on the publisher's site in the normal browser. That is an ordinary web visit, so the app asks first.

## Limits

- Installing the app downloads Electron and, optionally, the language model from npm and Hugging Face. That happens once, at install time, and says only that someone installed these common packages.
- Tor routing and the private session have automated tests only against a stand-in network, not a full audit.
