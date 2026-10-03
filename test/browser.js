// Finds Playwright and a Chromium to run the layout tests in.
// On your own machine:  npm install --no-save playwright  &&  npx playwright install chromium
// Or point at existing copies with PLAYWRIGHT_PATH and CHROMIUM_PATH.
const fs = require('fs');

function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_PATH, 'playwright', 'playwright-core',
    '/home/claude/.npm-global/lib/node_modules/playwright'].filter(Boolean);
  for (const t of tries) { try { return require(t); } catch (e) { /* next */ } }
  console.error('Layout tests need Playwright. Run:  npm install --no-save playwright && npx playwright install chromium');
  process.exit(1);
}

function launchOptions() {
  const exe = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome']
    .filter(Boolean).find(p => fs.existsSync(p));
  return exe ? { executablePath: exe } : {};
}

module.exports = { chromium: loadPlaywright().chromium, launchOptions };
