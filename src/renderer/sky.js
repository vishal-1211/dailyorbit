/* Starfield backgrounds + tonight's Moon (computed locally, no network). */
(function () {
  const AG = (window.AG = window.AG || {});

  // Deterministic PRNG so the sky doesn't jump around on re-render.
  function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }

  AG.paintStars = function () {
    document.querySelectorAll('canvas.stars').forEach((cv, idx) => {
      const rect = cv.getBoundingClientRect();
      if (!rect.width) return;
      const dpr = window.devicePixelRatio || 1;
      cv.width = rect.width * dpr; cv.height = rect.height * dpr;
      const ctx = cv.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);
      const night = document.documentElement.dataset.theme !== 'day';
      const rand = rng(42 + idx);
      const density = parseFloat(cv.dataset.density || '1');
      const n = Math.round((rect.width * rect.height) / 2600 * density);
      for (let i = 0; i < n; i++) {
        const x = rand() * rect.width, y = rand() * rect.height;
        const big = rand() > 0.97;
        const r = big ? 1.1 + rand() * 0.8 : 0.3 + rand() * 0.7;
        const a = night ? 0.25 + rand() * 0.6 : 0.08 + rand() * 0.18;
        const warm = rand() > 0.8;
        ctx.fillStyle = night ? (warm ? `rgba(255,214,160,${a})` : `rgba(220,228,255,${a})`) : `rgba(60,50,35,${a})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        if (big && night) {
          ctx.strokeStyle = `rgba(230,236,255,${a * 0.35})`; ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
        }
      }
    });
  };

  // ---- Moon phase -------------------------------------------------------
  const SYNODIC = 29.530588853;
  const KNOWN_NEW = Date.UTC(2000, 0, 6, 18, 14);

  AG.moonPhase = function (date = new Date()) {
    const days = (date.getTime() - KNOWN_NEW) / 86400000;
    const f = ((days / SYNODIC) % 1 + 1) % 1; // 0 = new, 0.5 = full
    const illum = (1 - Math.cos(2 * Math.PI * f)) / 2;
    const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
    const name = names[Math.round(f * 8) % 8];
    const age = f * SYNODIC;
    const toFull = ((0.5 - f + 1) % 1) * SYNODIC;
    return { f, illum, name, age, toFull };
  };

  AG.moonSvg = function (f, size = 64) {
    const r = size / 2 - 2, cx = size / 2, cy = size / 2;
    const k = Math.cos(2 * Math.PI * f);
    const rx = Math.abs(k) * r;
    const top = `${cx},${cy - r}`, bot = `${cx},${cy + r}`;
    let d;
    if (f < 0.5) { // waxing: lit on the right
      d = `M${top} A${r},${r} 0 0 1 ${bot} A${rx},${r} 0 0 ${k > 0 ? 0 : 1} ${top}Z`;
    } else {       // waning: lit on the left
      d = `M${top} A${r},${r} 0 0 0 ${bot} A${rx},${r} 0 0 ${k > 0 ? 1 : 0} ${top}Z`;
    }
    return `<svg class="moon-svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
      <defs><radialGradient id="mg" cx="40%" cy="38%" r="70%"><stop offset="0" stop-color="var(--moon-lit-1)"/><stop offset="1" stop-color="var(--moon-lit-2)"/></radialGradient></defs>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--moon-dark)"/>
      <path d="${d}" fill="url(#mg)"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--moon-rim)" stroke-width="1"/>
    </svg>`;
  };
})();
