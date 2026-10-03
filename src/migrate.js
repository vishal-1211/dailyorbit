// Upgrades a saved config to the current set of default sources (pure function, unit-tested).
const LEGACY_DEFAULT_IDS = ['nasa', 'esa', 'astronomy', 'universe', 'webb', 'hubble', 'eso', 'earthsky', 'physorg', 'skytel', 'spacecom', 'planetary'];

function migrateSources(cfg, defaults, moved = {}) {
  const sources = (Array.isArray(cfg.sources) ? cfg.sources : []).map(s => ({ ...s }));
  let changed = false;
  for (const s of sources) {
    if (moved[s.url]) { s.url = moved[s.url]; changed = true; }
  }
  // New defaults are added once; defaults the user deliberately removed are not re-added.
  const seen = new Set(cfg.seenDefaults || LEGACY_DEFAULT_IDS);
  for (const d of defaults) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    if (!sources.some(s => s.id === d.id || s.url === d.url)) sources.push({ ...d });
    changed = true;
  }
  if (!cfg.seenDefaults) changed = true;
  return { sources, seenDefaults: [...seen], changed };
}
module.exports = { migrateSources, LEGACY_DEFAULT_IDS };
