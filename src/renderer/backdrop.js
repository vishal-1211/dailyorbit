/* Backdrop: the sky behind the paper. Painted by the app itself (no downloads), matched to
   the night/day theme, and swapped for a new scene every few minutes with a slow cross-fade. */
(function () {
  const AG = (window.AG = window.AG || {});
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const ROTATE_MS = 6 * 60 * 1000;

  // Constellations as [stars [x,y,brightness], lines [a,b]] in a 0..1 box.
  const CONST = {
    Orion: [[[.3, .15, 3], [.68, .18, 2], [.58, .47, 2], [.5, .5, 2], [.42, .53, 2], [.35, .85, 2], [.72, .82, 3], [.5, .05, 1]], [[0, 4], [1, 2], [4, 3], [3, 2], [4, 5], [2, 6], [0, 7], [7, 1]]],
    'Ursa Major': [[[.9, .2, 2], [.88, .42, 2], [.65, .5, 2], [.6, .3, 1], [.42, .25, 2], [.25, .18, 2], [.05, .3, 2]], [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]]],
    Cassiopeia: [[[.05, .3, 2], [.28, .7, 2], [.5, .4, 2], [.72, .75, 2], [.95, .25, 2]], [[0, 1], [1, 2], [2, 3], [3, 4]]],
    Scorpius: [[[.7, .3, 3], [.78, .2, 1], [.85, .08, 2], [.9, .22, 2], [.9, .36, 1], [.62, .42, 1], [.55, .58, 2], [.5, .75, 1], [.4, .88, 2], [.25, .9, 1], [.15, .8, 2], [.12, .65, 2]], [[2, 1], [3, 1], [4, 1], [1, 0], [0, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11]]],
    Crux: [[[.5, .05, 2], [.5, .95, 3], [.1, .45, 2], [.9, .4, 2]], [[0, 1], [2, 3]]],
    Cygnus: [[[.5, .05, 3], [.5, .35, 2], [.5, .95, 2], [.1, .3, 2], [.9, .42, 2]], [[0, 1], [1, 2], [3, 1], [1, 4]]],
    Leo: [[[.2, .75, 3], [.22, .5, 2], [.3, .32, 1], [.42, .22, 2], [.5, .3, 1], [.6, .72, 1], [.95, .6, 2], [.7, .42, 2]], [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 1]]]
  };
  const PALETTES = [['#d8508c', '#5a78ff', '#ffbe6e'], ['#2fd6b0', '#3a6bff', '#f0c060'], ['#ff6a4d', '#a04dff', '#ffd27a'], ['#4dc3ff', '#7a5cff', '#ff8fb8']];

  function stars(ctx, W, H, r, n, day, band) {
    for (let i = 0; i < n; i++) {
      let x = r() * W, y = r() * H;
      if (band) { const t = r(), off = (r() + r() + r() - 1.5) * H * 0.22; x = t * W; y = H * (0.85 - t * 0.7) + off; }
      const big = r() > 0.975, rad = big ? 1.2 + r() : 0.3 + r() * 0.8, a = day ? 0.1 + r() * 0.25 : 0.25 + r() * 0.65;
      ctx.fillStyle = day ? `rgba(70,55,35,${a})` : (r() > 0.8 ? `rgba(255,216,170,${a})` : `rgba(222,230,255,${a})`);
      ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
      if (big && !day) { ctx.strokeStyle = `rgba(230,236,255,${a * 0.3})`; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke(); }
    }
  }
  function glow(ctx, W, H, x, y, rad, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, color + Math.round(alpha * 255).toString(16).padStart(2, '0')); g.addColorStop(1, color + '00');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  const SCENES = {
    nebula(ctx, W, H, r, day) {
      const pal = PALETTES[Math.floor(r() * PALETTES.length)];
      ctx.globalCompositeOperation = day ? 'multiply' : 'lighter';
      for (let i = 0; i < 9; i++) {
        const side = r() < 0.5 ? r() * 0.3 : 0.7 + r() * 0.3; // keep colour to the sides, behind the paper stays calm
        glow(ctx, W, H, side * W, r() * H, (0.18 + r() * 0.3) * W, pal[i % 3], day ? 0.1 : 0.13 + r() * 0.1);
      }
      ctx.globalCompositeOperation = 'source-over';
      stars(ctx, W, H, r, W * H / 2600, day);
    },
    milkyway(ctx, W, H, r, day) {
      ctx.globalCompositeOperation = day ? 'multiply' : 'lighter';
      for (let i = 0; i <= 12; i++) { const t = i / 12; glow(ctx, W, H, t * W, H * (0.85 - t * 0.7), H * 0.38, i % 3 ? '#8a96c8' : '#c8a070', day ? 0.05 : 0.07); }
      ctx.globalCompositeOperation = 'source-over';
      stars(ctx, W, H, r, W * H / 1500, day, true);
      stars(ctx, W, H, r, W * H / 5000, day);
    },
    constellations(ctx, W, H, r, day) {
      stars(ctx, W, H, r, W * H / 4200, day);
      const names = Object.keys(CONST).sort(() => r() - 0.5).slice(0, 4);
      const spots = [[0.02, 0.06], [0.76, 0.08], [0.03, 0.56], [0.77, 0.55]].sort(() => r() - 0.5);
      const ink = day ? '90,70,40' : '200,212,255';
      names.forEach((name, i) => {
        const [st, ln] = CONST[name];
        const s = Math.min(W * 0.2, H * 0.36), ox = spots[i][0] * W, oy = spots[i][1] * H, rot = (r() - 0.5) * 0.5;
        const P = st.map(([x, y]) => { const dx = (x - 0.5) * s, dy = (y - 0.5) * s; return [ox + s / 2 + dx * Math.cos(rot) - dy * Math.sin(rot), oy + s / 2 + dx * Math.sin(rot) + dy * Math.cos(rot)]; });
        ctx.strokeStyle = `rgba(${ink},${day ? 0.4 : 0.3})`; ctx.lineWidth = 1; ctx.setLineDash([]);
        for (const [a, b] of ln) { ctx.beginPath(); ctx.moveTo(...P[a]); ctx.lineTo(...P[b]); ctx.stroke(); }
        st.forEach(([, , m], k) => {
          if (!day) glow(ctx, W, H, P[k][0], P[k][1], 6 + m * 5, '#dfe6ff', 0.35);
          ctx.fillStyle = `rgba(${day ? '60,45,25' : '255,250,235'},${day ? 0.75 : 0.95})`; ctx.beginPath(); ctx.arc(P[k][0], P[k][1], 0.9 + m * 0.8, 0, 7); ctx.fill();
        });
        ctx.font = `italic 13px Fraunces, Georgia, serif`; ctx.fillStyle = `rgba(${ink},${day ? 0.6 : 0.5})`; ctx.textAlign = 'center';
        ctx.fillText(name.toUpperCase().split('').join(' '), ox + s / 2, oy + s + 18);
      });
      // faint celestial grid arcs
      ctx.strokeStyle = `rgba(${ink},${day ? 0.12 : 0.07})`; ctx.setLineDash([2, 6]);
      for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.arc(W / 2, H * 1.6, H * (0.5 + k * 0.32), 0, 7); ctx.stroke(); }
      ctx.setLineDash([]);
    },
    deepfield(ctx, W, H, r, day) {
      stars(ctx, W, H, r, W * H / 3200, day);
      for (let i = 0; i < 16; i++) {
        const x = (r() < 0.5 ? r() * 0.3 : 0.7 + r() * 0.3) * W, y = r() * H, a = 14 + r() * 40, b = a * (0.25 + r() * 0.5);
        ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 3.14); ctx.scale(1, b / a);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, a), c = day ? '120,90,50' : (r() > 0.5 ? '255,214,170' : '170,190,255');
        g.addColorStop(0, `rgba(${c},${day ? 0.3 : 0.55})`); g.addColorStop(0.35, `rgba(${c},${day ? 0.1 : 0.16})`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, a, 0, 7); ctx.fill(); ctx.restore();
      }
    }
  };
  const ORDER = Object.keys(SCENES);

  const B = (AG.Backdrop = { i: Math.floor(Math.random() * ORDER.length), seed: (Date.now() & 0xffffff) || 1, front: 0 });
  B.paint = function (cv) {
    const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1; cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const day = document.documentElement.dataset.theme === 'day';
    const bg = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.7);
    if (day) { bg.addColorStop(0, '#e2d9c6'); bg.addColorStop(1, '#b7ab93'); } else { bg.addColorStop(0, '#0d1324'); bg.addColorStop(1, '#03050b'); }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    SCENES[ORDER[B.i % ORDER.length]](ctx, W, H, rng(B.seed), day);
    cv.dataset.scene = ORDER[B.i % ORDER.length];
  };
  B.redraw = function () { const c = B.layers?.[B.front]; if (c) B.paint(c); };
  B.next = function (name) {
    if (!B.layers) return;
    B.i = name ? ORDER.indexOf(name) : B.i + 1; B.seed = (B.seed * 7919 + 13) & 0xffffff || 1;
    const incoming = 1 - B.front;
    B.paint(B.layers[incoming]);
    B.layers[incoming].classList.add('show'); B.layers[B.front].classList.remove('show');
    B.front = incoming;
  };
  B.start = function () {
    const host = document.getElementById('backdrop'); if (!host) return;
    B.layers = [...host.querySelectorAll('canvas')];
    B.paint(B.layers[0]); B.layers[0].classList.add('show');
    setInterval(() => { if (!document.hidden) B.next(); }, ROTATE_MS);
  };

  // Theme changes and window resizes already call AG.paintStars(): repaint the backdrop too.
  const old = AG.paintStars || (() => {});
  AG.paintStars = () => { old(); B.redraw(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', B.start); else B.start();
})();
