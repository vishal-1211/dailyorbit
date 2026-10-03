// Decides which time window an edition should cover.
//
// Rule (as requested):
//   * First ever run                      -> last N days (default 7)
//   * Last edition was within N days       -> everything since that edition
//   * Last edition was more than N days ago -> only the last N days (no backlog)

const DAY = 24 * 60 * 60 * 1000;

function planWindow(lastGeneratedAt, now = Date.now(), windowDays = 7) {
  const days = Math.max(1, Math.min(30, Number(windowDays) || 7));
  const cap = now - days * DAY;

  if (!lastGeneratedAt) {
    return { since: cap, until: now, mode: 'first', windowDays: days, gapDays: null };
  }
  const gapDays = (now - lastGeneratedAt) / DAY;
  if (lastGeneratedAt < cap) {
    return { since: cap, until: now, mode: 'capped', windowDays: days, gapDays };
  }
  return { since: lastGeneratedAt, until: now, mode: 'since-last', windowDays: days, gapDays };
}

module.exports = { planWindow, DAY };
