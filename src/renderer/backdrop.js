/* Backdrop: the scene behind the paper, one per desk (galaxies only for Astronomy). Painted by the app itself (no downloads), matched to
   the night/day theme, and swapped for a new scene every few minutes with a slow cross-fade. */
(function () {
  const AG = (window.AG = window.AG || {});
  const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const ROTATE_MS = 3 * 60 * 1000;

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
  // ---------------------------------------------------------------- desk scenes (The Daily Orbit)
  // Each desk has its own painted scene, kept to the sides so the paper in the middle stays calm.
  const sideX = (r) => (r() < 0.5 ? r() * 0.26 : 0.74 + r() * 0.26);
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const tone = (day, hex) => (day ? '#5a4632' : hex);
  function haze(ctx, W, H, r, day, colors) {
    ctx.globalCompositeOperation = day ? 'multiply' : 'lighter';
    for (let i = 0; i < 6; i++) glow(ctx, W, H, sideX(r) * W, r() * H, (0.16 + r() * 0.22) * W, colors[i % colors.length], day ? 0.06 : 0.1);
    ctx.globalCompositeOperation = 'source-over';
  }
  function dust(ctx, W, H, r, day, n = 260) { for (let i = 0; i < n; i++) { ctx.fillStyle = day ? `rgba(70,55,35,${0.05 + r() * 0.12})` : `rgba(220,228,255,${0.06 + r() * 0.22})`; ctx.beginPath(); ctx.arc(r() * W, r() * H, 0.4 + r() * 0.8, 0, 7); ctx.fill(); } }
  const DESK = {
    finance(ctx, W, H, r, day) { // candlestick charts and a grid
      haze(ctx, W, H, r, day, ['#22c55e', '#0ea5e9', '#eab308']); dust(ctx, W, H, r, day, 120);
      for (const side of [0, 1]) {
        const x0 = side ? W * 0.76 : W * 0.02, w = W * 0.22, y0 = H * (0.12 + r() * 0.1), h = H * 0.7;
        ctx.strokeStyle = rgba(tone(day, '#9fb3c8'), day ? 0.14 : 0.08); ctx.lineWidth = 1;
        for (let k = 0; k <= 8; k++) { ctx.beginPath(); ctx.moveTo(x0, y0 + (h * k) / 8); ctx.lineTo(x0 + w, y0 + (h * k) / 8); ctx.stroke(); }
        let v = 0.5; const n = 26;
        for (let i = 0; i < n; i++) {
          const o = v, c = Math.min(0.95, Math.max(0.05, v + (r() - 0.48) * 0.12)), hi = Math.max(o, c) + r() * 0.04, lo = Math.min(o, c) - r() * 0.04; v = c;
          const x = x0 + (w * (i + 0.5)) / n, up = c >= o, col = up ? '#22c55e' : '#ef4444', Y = (q) => y0 + h * (1 - q);
          ctx.strokeStyle = rgba(tone(day, col), day ? 0.35 : 0.45); ctx.beginPath(); ctx.moveTo(x, Y(hi)); ctx.lineTo(x, Y(lo)); ctx.stroke();
          ctx.fillStyle = rgba(tone(day, col), day ? 0.25 : 0.35); ctx.fillRect(x - w / n / 3, Y(Math.max(o, c)), (w / n) * 0.66, Math.max(1.5, Math.abs(c - o) * h));
        }
      }
      ctx.font = '600 11px Inter, sans-serif'; ctx.fillStyle = rgba(tone(day, '#9fb3c8'), day ? 0.4 : 0.35);
      const tick = ['NIFTY 50 ▲', 'SENSEX ▲', 'GOLD ▼', 'USD/INR', 'BRENT ▼', 'NASDAQ ▲', 'BTC ▲', 'S&P 500'];
      for (let i = 0; i < 8; i++) ctx.fillText(tick[i], sideX(r) * W, (0.06 + r() * 0.9) * H);
    },
    world(ctx, W, H, r, day) { // wireframe globes and flight arcs
      haze(ctx, W, H, r, day, ['#4f8cff', '#14b8a6', '#6366f1']); dust(ctx, W, H, r, day);
      for (const [cx, cy] of [[W * 0.1, H * 0.62], [W * 0.9, H * 0.3]]) {
        const R = Math.min(W * 0.17, H * 0.32); ctx.strokeStyle = rgba(tone(day, '#8fb6ff'), day ? 0.22 : 0.2); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
        for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, R * Math.abs(Math.cos((k * Math.PI) / 6)), R, 0, 0, 7); ctx.stroke(); }
        for (let k = -2; k <= 2; k++) { const y = cy + (R * k) / 3, rr = Math.sqrt(R * R - ((R * k) / 3) ** 2); ctx.beginPath(); ctx.ellipse(cx, y, rr, rr * 0.18, 0, 0, 7); ctx.stroke(); }
      }
      ctx.setLineDash([3, 6]); ctx.strokeStyle = rgba(tone(day, '#ffd27a'), day ? 0.3 : 0.28);
      for (let i = 0; i < 5; i++) { const x1 = sideX(r) * W, y1 = r() * H, x2 = sideX(r) * W, y2 = r() * H; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - H * 0.2, x2, y2); ctx.stroke(); }
      ctx.setLineDash([]);
    },
    india(ctx, W, H, r, day) { // rangoli / mandala
      haze(ctx, W, H, r, day, ['#ff8a3d', '#22c55e', '#f43f5e']); dust(ctx, W, H, r, day, 150);
      for (const [cx, cy] of [[W * 0.1, H * 0.3], [W * 0.9, H * 0.72], [W * 0.92, H * 0.12]]) {
        const R = Math.min(W, H) * (0.11 + r() * 0.05);
        for (let ring = 1; ring <= 4; ring++) {
          const n = 8 + ring * 4, rr = (R * ring) / 4, col = ['#ff8a3d', '#fbbf24', '#22c55e', '#f43f5e'][ring - 1];
          ctx.strokeStyle = rgba(tone(day, col), day ? 0.3 : 0.32); ctx.lineWidth = 1;
          for (let k = 0; k < n; k++) { const t = (k / n) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(cx + Math.cos(t) * rr * 0.7, cy + Math.sin(t) * rr * 0.7, rr * 0.3, rr * 0.11, t, 0, 7); ctx.stroke(); }
        }
        ctx.fillStyle = rgba(tone(day, '#fbbf24'), day ? 0.3 : 0.35); ctx.beginPath(); ctx.arc(cx, cy, R * 0.08, 0, 7); ctx.fill();
      }
    },
    tech(ctx, W, H, r, day) { // circuit traces
      haze(ctx, W, H, r, day, ['#a78bfa', '#22d3ee', '#6366f1']); dust(ctx, W, H, r, day, 100);
      const g = 22; ctx.lineWidth = 1.2;
      for (let i = 0; i < 46; i++) {
        let x = Math.round((sideX(r) * W) / g) * g, y = Math.round((r() * H) / g) * g; const col = r() > 0.5 ? '#a78bfa' : '#22d3ee';
        ctx.strokeStyle = rgba(tone(day, col), day ? 0.28 : 0.3); ctx.beginPath(); ctx.moveTo(x, y);
        for (let k = 0; k < 5; k++) { if (r() > 0.5) x += (r() > 0.5 ? 1 : -1) * g * (1 + Math.floor(r() * 3)); else y += (r() > 0.5 ? 1 : -1) * g * (1 + Math.floor(r() * 3)); ctx.lineTo(x, y); }
        ctx.stroke(); ctx.fillStyle = rgba(tone(day, col), day ? 0.4 : 0.55); ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill();
      }
      ctx.font = '500 11px monospace'; ctx.fillStyle = rgba(tone(day, '#a78bfa'), day ? 0.3 : 0.25);
      for (let i = 0; i < 10; i++) ctx.fillText(Array.from({ length: 12 }, () => (r() > 0.5 ? '1' : '0')).join(''), sideX(r) * W, r() * H);
    },
    science(ctx, W, H, r, day) { // hexagonal molecules
      haze(ctx, W, H, r, day, ['#14b8a6', '#38bdf8', '#a3e635']); dust(ctx, W, H, r, day, 140);
      const hex = (cx, cy, s) => { ctx.beginPath(); for (let k = 0; k <= 6; k++) { const t = (Math.PI / 3) * k + Math.PI / 6; ctx[k ? 'lineTo' : 'moveTo'](cx + s * Math.cos(t), cy + s * Math.sin(t)); } ctx.stroke(); };
      for (let m = 0; m < 7; m++) {
        let cx = sideX(r) * W, cy = r() * H; const s = 18 + r() * 10, col = ['#14b8a6', '#38bdf8', '#a3e635'][m % 3];
        ctx.strokeStyle = rgba(tone(day, col), day ? 0.35 : 0.35); ctx.lineWidth = 1.2;
        for (let k = 0; k < 3 + Math.floor(r() * 3); k++) { hex(cx, cy, s); const t = Math.floor(r() * 6) * (Math.PI / 3); cx += Math.cos(t) * s * 1.73; cy += Math.sin(t) * s * 1.73; }
        ctx.fillStyle = rgba(tone(day, col), day ? 0.4 : 0.5); ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 7); ctx.fill();
      }
      for (let i = 0; i < 3; i++) { const cx = sideX(r) * W, cy = r() * H, R = 26 + r() * 14; ctx.strokeStyle = rgba(tone(day, '#7dd3fc'), day ? 0.3 : 0.28); for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.35, (k * Math.PI) / 3, 0, 7); ctx.stroke(); } }
    },
    sports(ctx, W, H, r, day) { // pitch lines and running track
      haze(ctx, W, H, r, day, ['#ef4444', '#22c55e', '#f59e0b']); dust(ctx, W, H, r, day, 100);
      ctx.strokeStyle = rgba(tone(day, '#e5e7eb'), day ? 0.25 : 0.16); ctx.lineWidth = 1.5;
      const fx = W * 0.02, fy = H * 0.18, fw = W * 0.2, fh = H * 0.64; ctx.strokeRect(fx, fy, fw, fh); ctx.beginPath(); ctx.moveTo(fx, fy + fh / 2); ctx.lineTo(fx + fw, fy + fh / 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(fx + fw / 2, fy + fh / 2, fw * 0.18, 0, 7); ctx.stroke(); ctx.strokeRect(fx + fw * 0.25, fy, fw * 0.5, fh * 0.14); ctx.strokeRect(fx + fw * 0.25, fy + fh * 0.86, fw * 0.5, fh * 0.14);
      for (let k = 0; k < 6; k++) { ctx.strokeStyle = rgba(tone(day, k % 2 ? '#ef4444' : '#f59e0b'), day ? 0.22 : 0.2); ctx.beginPath(); ctx.ellipse(W * 1.02, H * 0.55, W * (0.16 + k * 0.025), H * (0.3 + k * 0.045), 0, 0, 7); ctx.stroke(); }
      ctx.strokeStyle = rgba(tone(day, '#fde68a'), day ? 0.3 : 0.25); ctx.setLineDash([2, 7]); ctx.beginPath(); ctx.moveTo(W * 0.04, H * 0.92); ctx.quadraticCurveTo(W * 0.14, H * 0.02, W * 0.24, H * 0.5); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = rgba(tone(day, '#fde68a'), day ? 0.5 : 0.6); ctx.beginPath(); ctx.arc(W * 0.24, H * 0.5, 5, 0, 7); ctx.fill();
    },
    health(ctx, W, H, r, day) { // heartbeat lines and soft cells
      haze(ctx, W, H, r, day, ['#f472b6', '#fb7185', '#38bdf8']); dust(ctx, W, H, r, day, 100);
      for (let i = 0; i < 9; i++) { const cx = sideX(r) * W, cy = r() * H, R = 14 + r() * 30; ctx.strokeStyle = rgba(tone(day, '#f9a8d4'), day ? 0.25 : 0.22); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke(); ctx.fillStyle = rgba(tone(day, '#f472b6'), day ? 0.25 : 0.3); ctx.beginPath(); ctx.arc(cx + R * 0.2, cy - R * 0.1, R * 0.22, 0, 7); ctx.fill(); }
      for (const y of [H * 0.3, H * 0.75]) {
        ctx.strokeStyle = rgba(tone(day, '#fb7185'), day ? 0.35 : 0.4); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, y);
        for (let x = 0; x < W; x += 120) { if (x > W * 0.24 && x < W * 0.74) { ctx.lineTo(x + 120, y); continue; } ctx.lineTo(x + 40, y); ctx.lineTo(x + 50, y - 26); ctx.lineTo(x + 60, y + 30); ctx.lineTo(x + 70, y - 8); ctx.lineTo(x + 120, y); }
        ctx.stroke();
      }
    },
    culture(ctx, W, H, r, day) { // film strips and spotlights
      ctx.globalCompositeOperation = day ? 'multiply' : 'lighter';
      for (const x of [W * 0.08, W * 0.92]) { const g = ctx.createLinearGradient(x, 0, W / 2, H); g.addColorStop(0, rgba('#f59e0b', day ? 0.1 : 0.16)); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 20, 0); ctx.lineTo(x < W / 2 ? W * 0.32 : W * 0.68, H); ctx.lineTo(x < W / 2 ? W * 0.12 : W * 0.88, H); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over'; dust(ctx, W, H, r, day, 120);
      for (const x of [W * 0.03, W * 0.86]) {
        const w = W * 0.1; ctx.fillStyle = rgba(tone(day, '#1f2937'), day ? 0.12 : 0.5); ctx.fillRect(x, 0, w, H);
        ctx.fillStyle = rgba(tone(day, '#fde68a'), day ? 0.25 : 0.18); for (let y = 6; y < H; y += 22) { ctx.fillRect(x + 4, y, 8, 11); ctx.fillRect(x + w - 12, y, 8, 11); }
        ctx.strokeStyle = rgba(tone(day, '#fde68a'), day ? 0.25 : 0.2); for (let y = 10; y < H; y += 110) ctx.strokeRect(x + 18, y, w - 36, 90);
      }
    }
  };
  for (const [k, f] of Object.entries(DESK)) SCENES[k] = f;
  const ASTRO_SCENES = ['nebula', 'milkyway', 'constellations', 'deepfield'];
  const ALL_DESKS = ['world', 'india', 'finance', 'tech', 'science', 'sports', 'astronomy', 'health', 'culture'];
  let ORDER = [];
  /** Scenes for the desks in the paper on the desk: galaxies only when Astronomy is one of them. */
  function orderFor(topics) {
    const out = [];
    for (const t of topics && topics.length ? topics : ALL_DESKS) { if (t === 'astronomy') out.push(ASTRO_SCENES[Math.floor(Math.random() * 4)]); else if (DESK[t]) out.push(t); }
    return out.length ? out : ['world'];
  }
  ORDER = orderFor(ALL_DESKS);

  const B = (AG.Backdrop = { i: Math.floor(Math.random() * ORDER.length), seed: (Date.now() & 0xffffff) || 1, front: 0 });
  B.setTopics = function (topics) {
    const next = orderFor(topics), same = next.length === ORDER.length && next.every((x, k) => x === ORDER[k]);
    if (same) return; ORDER = next; B.i = Math.floor(Math.random() * ORDER.length) - 1; B.next();
  };
  B.paint = function (cv) {
    const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    const dpr = window.devicePixelRatio || 1; cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const day = document.documentElement.dataset.theme === 'day';
    const bg = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.7);
    if (day) { bg.addColorStop(0, '#e2d9c6'); bg.addColorStop(1, '#b7ab93'); } else { bg.addColorStop(0, '#0d1324'); bg.addColorStop(1, '#03050b'); }
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const name = ORDER[((B.i % ORDER.length) + ORDER.length) % ORDER.length];
    SCENES[name](ctx, W, H, rng(B.seed), day);
    cv.dataset.scene = name;
  };
  B.redraw = function () { const c = B.layers?.[B.front]; if (c) B.paint(c); };
  B.next = function (name) {
    if (!B.layers) return;
    B.i = name ? Math.max(0, ORDER.indexOf(name)) : B.i + 1; B.seed = (B.seed * 7919 + 13) & 0xffffff || 1;
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
