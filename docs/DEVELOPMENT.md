# Development

## Requirements

- Node.js 20 or newer
- Windows for building the installer (the app itself also starts on macOS and Linux with `npm start`, untested)

## Run from source

```
npm install
npm run fetch-model     # optional: downloads the 25 MB language model into ./models
npm start
```

`Run Daily Orbit.bat` does the same three steps.

## Tests

```
node test/brain.test.js     learning model
node test/sky.test.js       sky calculations
node test/run.js            whole app in a browser with a stand-in network
npm test                    all three
```

The first two need only Node. `test/run.js` needs Playwright:

```
npm install --no-save playwright
npx playwright install chromium
```

or set `PLAYWRIGHT_PATH` and `CHROMIUM_PATH` to existing copies. It replaces `window.api` with a fake that serves feeds from `test/fixtures.js`, prints several editions, reads them like a user and checks layout, learning and privacy. Screenshots go to `test/shots/` (not committed). Set `NO_MODEL=1` to test without the pre-trained model stand-in.

What the tests cannot cover: real Electron behaviour (private session, `gzimg://`, Tor), the real language model, and live publisher pages. Check those by hand on Windows.

## Build the installer

```
npm run dist
```

or `Build Windows Installer.bat`. Output in `dist/`: an NSIS installer and a portable exe.

## Release steps

1. Update `CHANGELOG.md`.
2. Set the version in `package.json`.
3. `npm test`.
4. Commit, then `git tag vX.Y.Z` and push with `--tags`.
5. Build the installer on Windows and attach it to a GitHub release.

## Conventions

- Plain JavaScript, no framework, no build step for the renderer. Scripts attach to a global `AG` object and load in the order listed in `index.html`.
- `brain.js` must stay free of DOM and Electron calls so it runs under Node.
- New renderer code must not use the network. Add a call in `preload.js` and handle it in `main.js`.
- Anything about the reader goes in `learning.json` only.

## Adding a default source

Add a line to `src/default-sources.js`. Existing installs are offered it once (`src/migrate.js`). If a publisher moves its feed, add the old and new address to `MOVED`.
