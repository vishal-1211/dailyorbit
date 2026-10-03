/* Sky events for the reader's own location, calculated on this laptop.
   Uses the bundled astronomy-engine (Sun, Moon, planets, eclipses) and satellite.js (ISS).
   The location is only ever used here, in arithmetic; it is never part of any request. */
(function (root) {
  const AG = (root.AG = root.AG || {});
  const S = (AG.Sky = {});
  const A = () => root.Astronomy;
  const DAYMS = 864e5, HOUR = 36e5;
  const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  const compass = (az) => COMPASS[Math.round(((az % 360) + 360) % 360 / 45) % 8];
  const PHASES = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'];
  const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

  function alt(body, t, obs) { const e = A().Equator(body, t, obs, true, true); return A().Horizon(t, obs, e.ra, e.dec, 'normal'); }
  const sunAlt = (t, obs) => alt('Sun', t, obs).altitude;
  const dateOf = (x) => (x && x.date) || x;

  S.tonight = function (obs, now) {
    const As = A(), rs = (b, d) => dateOf(As.SearchRiseSet(b, obs, d, now, 1.5));
    const f = As.MoonPhase(now) / 360, illum = As.Illumination('Moon', now).phase_fraction;
    const names = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
    const sunset = rs('Sun', -1), sunrise = rs('Sun', +1);
    const planets = [];
    for (const p of PLANETS) {
      const eve = sunset && alt(p, new Date(sunset.getTime() + 1.25 * HOUR), obs), dawn = sunrise && alt(p, new Date(sunrise.getTime() - 1.25 * HOUR), obs);
      if (As.AngleFromSun(p, now) < 14) continue;
      if (eve && eve.altitude > 8) planets.push({ name: p, when: 'evening', where: compass(eve.azimuth) });
      else if (dawn && dawn.altitude > 8) planets.push({ name: p, when: 'before dawn', where: compass(dawn.azimuth) });
    }
    return { f, illum, phase: names[Math.round(f * 8) % 8], sunset, sunrise, moonrise: rs('Moon', +1), moonset: rs('Moon', -1), planets };
  };

  function moonPhases(now, days, out) {
    let q = A().SearchMoonQuarter(now);
    for (let i = 0; i < 8; i++) {
      const t = q.time.date; if (t - now > days * DAYMS) break;
      out.push({ when: +t, kind: 'moon', icon: ['🌑', '🌓', '🌕', '🌗'][q.quarter], title: PHASES[q.quarter], detail: '' });
      q = A().NextMoonQuarter(q);
    }
  }

  function eclipses(now, obs, place, out) {
    const As = A();
    let e = As.SearchLunarEclipse(now);
    for (let i = 0; i < 3 && e.peak.date - now < 550 * DAYMS; i++) {
      const up = alt('Moon', e.peak.date, obs).altitude > 2;
      const kind = { penumbral: 'Faint (penumbral) lunar eclipse', partial: 'Partial lunar eclipse', total: 'Total lunar eclipse' }[e.kind];
      out.push({ when: +e.peak.date, kind: 'eclipse', icon: '🌘', title: kind, visible: up, big: e.kind !== 'penumbral' && up,
        detail: up ? `Visible from ${place}${e.kind === 'total' ? `: the Moon stays fully in shadow for ${Math.round(e.sd_total * 2)} minutes` : e.kind === 'partial' ? `: ${Math.round(e.obscuration * 100)}% of the Moon is covered` : ', though the dimming is subtle'}.` : `Not visible from ${place}: the Moon is below the horizon.` });
      e = As.NextLunarEclipse(e.peak);
    }
    let s = As.SearchLocalSolarEclipse(now, obs), guard = 0;
    while (s.peak.altitude <= 0 && guard++ < 6) s = As.NextLocalSolarEclipse(s.peak.time, obs);
    if (s.peak.altitude > 0) {
      const kind = { partial: 'Partial solar eclipse', annular: 'Annular (“ring of fire”) solar eclipse', total: 'Total solar eclipse' }[s.kind];
      out.push({ when: +s.peak.time.date, kind: 'eclipse', icon: '🌞', title: `${kind} from ${place}`, visible: true, big: true, far: s.peak.time.date - now > 400 * DAYMS,
        detail: `The Moon covers ${Math.round(s.obscuration * 100)}% of the Sun at the peak. Never look at the Sun without proper eclipse glasses.` });
    }
    const g = As.SearchGlobalSolarEclipse(now);
    if (Math.abs(g.peak.date - s.peak.time.date) > DAYMS) out.push({ when: +g.peak.date, kind: 'eclipse', icon: '🌍', title: `${g.kind[0].toUpperCase() + g.kind.slice(1)} solar eclipse elsewhere on Earth`, visible: false, detail: `Not visible from ${place}.` });
    for (const p of ['Mercury', 'Venus']) {
      const t = As.SearchTransit(p, now);
      out.push({ when: +t.peak.date, kind: 'transit', icon: '⚫', title: `${p} crosses the face of the Sun`, far: true, visible: sunAlt(t.peak.date, obs) > 0, detail: `The next transit of ${p}. ${sunAlt(t.peak.date, obs) > 0 ? `The Sun will be up over ${place}.` : `The Sun will be down at ${place}.`}` });
    }
  }

  /** Moon passing close to (or in front of) planets and bright stars; planets meeting each other. */
  function meetings(now, obs, place, days, out) {
    const As = A(), stars = (AG.Content?.STARS || []);
    stars.forEach(([, ra, dec], i) => As.DefineStar(`Star${i + 1}`, ra, dec, 100));
    const targets = [...PLANETS.map(p => ({ name: p, body: p })), ...stars.map(([name], i) => ({ name, body: `Star${i + 1}`, star: true }))];
    const vec = (b, t) => As.Equator(b, t, obs, true, true).vec;
    const steps = Math.round(days * 24);
    const sep = targets.map(() => new Float32Array(steps + 1));
    const pairs = []; for (let i = 0; i < PLANETS.length; i++) for (let j = i + 1; j < PLANETS.length; j++) pairs.push([i, j, new Float32Array(steps + 1)]);
    for (let k = 0; k <= steps; k++) {
      const t = new Date(+now + k * HOUR), m = vec('Moon', t), pv = targets.map(x => vec(x.body, t));
      targets.forEach((_, i) => { sep[i][k] = As.AngleBetween(m, pv[i]); });
      for (const p of pairs) p[2][k] = As.AngleBetween(pv[p[0]], pv[p[1]]);
    }
    const night = (t) => sunAlt(t, obs) < -6;
    targets.forEach((x, i) => {
      for (let k = 1; k < steps; k++) {
        const d = sep[i][k]; if (!(d < sep[i][k - 1] && d <= sep[i][k + 1]) || d > 5) continue;
        // refine to the minute around the hourly minimum
        let best = { d, t: new Date(+now + k * HOUR) };
        for (let mnt = -60; mnt <= 60; mnt += 2) { const t = new Date(+now + k * HOUR + mnt * 6e4), dd = As.AngleBetween(vec('Moon', t), vec(x.body, t)); if (dd < best.d) best = { d: dd, t }; }
        if (best.d < 0.27 && alt('Moon', best.t, obs).altitude > 3) {
          out.push({ when: +best.t, kind: 'occ', icon: '🌙', big: true, visible: true, title: `The Moon hides ${x.name}`, detail: `An occultation seen from ${place}: ${x.name} slips behind the Moon${night(best.t) ? '' : ' (in daylight; a telescope is needed)'}.` });
          continue;
        }
        // otherwise a close pairing: find when it is best seen at night with the Moon up
        let seen = null;
        for (let h = -8; h <= 8; h++) { const t = new Date(+best.t + h * HOUR); if (!night(t) || alt('Moon', t, obs).altitude < 8) continue; const dd = As.AngleBetween(vec('Moon', t), vec(x.body, t)); if (dd < 5.5 && (!seen || dd < seen.d)) seen = { d: dd, t }; }
        if (seen && (!x.star || seen.d < 3.5) && (x.star || As.AngleFromSun(x.body, seen.t) > 12)) out.push({ when: +seen.t, kind: 'conj', icon: '✨', visible: true, title: `The Moon beside ${x.name}`, detail: `About ${seen.d < 1 ? 'one' : Math.round(seen.d)} finger-width${seen.d >= 1.5 ? 's' : ''} apart at arm’s length, in the ${compass(alt('Moon', seen.t, obs).azimuth)}.` });
      }
    });
    for (const [i, j, arr] of pairs) for (let k = 1; k < steps; k++) {
      const d = arr[k]; if (!(d < arr[k - 1] && d <= arr[k + 1]) || d > 2.2) continue;
      const t = new Date(+now + k * HOUR); if (As.AngleFromSun(PLANETS[i], t) < 14) continue;
      out.push({ when: +t, kind: 'conj', icon: '🪐', visible: true, big: d < 1, title: `${PLANETS[i]} meets ${PLANETS[j]}`, detail: `The two planets appear ${d < 0.5 ? 'almost touching' : `only ${d.toFixed(1)}° apart`}.` });
    }
  }

  function showers(now, days, out) {
    for (const s of AG.Content?.SHOWERS || []) {
      const [m, d] = s.peak.split('-').map(Number); let t = new Date(now.getFullYear(), m - 1, d, 23, 0);
      if (t < now - DAYMS) t = new Date(now.getFullYear() + 1, m - 1, d, 23, 0);
      if (t - now > days * DAYMS) continue;
      const lit = A().Illumination('Moon', t).phase_fraction;
      out.push({ when: +t, kind: 'shower', icon: '☄️', visible: true, big: s.rate >= 80 && lit < 0.5, title: `${s.name} meteor shower peaks`, detail: `Up to ${s.rate} meteors an hour under a dark sky${s.note ? ` (${s.note})` : ''}. ${lit < 0.3 ? 'The Moon is dim, so viewing is good.' : lit < 0.7 ? 'Some moonlight will hide the faintest meteors.' : 'A bright Moon will wash out the fainter meteors.'}` });
    }
  }

  S.parseTle = function (text) {
    const lines = String(text || '').split(/\r?\n/).map(l => l.trimEnd()).filter(Boolean), out = [];
    for (let i = 0; i + 2 < lines.length + 0; i++) if (lines[i + 1]?.startsWith('1 ') && lines[i + 2]?.startsWith('2 ')) { out.push({ name: lines[i].trim(), l1: lines[i + 1], l2: lines[i + 2] }); i += 2; }
    return out;
  };
  /** Visible passes of the space stations over the observer. */
  function passes(now, obs, place, sky, days, out) {
    const sat = root.satellite; if (!sat || !sky?.tle) return 'none';
    if (now - (sky.fetchedAt || 0) > 12 * DAYMS) return 'old';
    const want = [[/^ISS \(ZARYA\)/i, 'the International Space Station'], [/^CSS \(TIANHE\)/i, 'the Tiangong space station']];
    const site = { latitude: obs.latitude * Math.PI / 180, longitude: obs.longitude * Math.PI / 180, height: (obs.height || 0) / 1000 };
    for (const [re, label] of want) {
      const tle = S.parseTle(sky.tle).find(x => re.test(x.name)); if (!tle) continue;
      let rec; try { rec = sat.twoline2satrec(tle.l1, tle.l2); } catch { continue; }
      let cur = null, found = 0;
      for (let k = 0; k < days * 1440 && found < 4; k++) {
        const t = new Date(+now + k * 6e4), pv = sat.propagate(rec, t); if (!pv || !pv.position) continue;
        const look = sat.ecfToLookAngles(site, sat.eciToEcf(pv.position, sat.gstime(t)));
        const el = look.elevation * 180 / Math.PI, az = look.azimuth * 180 / Math.PI;
        if (el > 10) {
          if (!cur) cur = { start: t, azStart: az, max: 0, lit: 0, n: 0 };
          const sv = A().GeoVector('Sun', t, false), sl = Math.hypot(sv.x, sv.y, sv.z), u = [sv.x / sl, sv.y / sl, sv.z / sl], r = pv.position;
          const proj = r.x * u[0] + r.y * u[1] + r.z * u[2], perp = Math.hypot(r.x - proj * u[0], r.y - proj * u[1], r.z - proj * u[2]);
          cur.n++; if (proj > 0 || perp > 6378) cur.lit++;
          if (el > cur.max) { cur.max = el; cur.peak = t; }
          cur.end = t; cur.azEnd = az;
        } else if (cur) {
          const dark = sunAlt(cur.peak, obs) < -6;
          if (dark && cur.lit / cur.n > 0.5 && cur.max >= 25) {
            found++;
            out.push({ when: +cur.start, kind: 'iss', icon: '🛰️', visible: true, big: cur.max > 60, title: `See ${label} fly over`, detail: `Rises in the ${compass(cur.azStart)}, climbs ${cur.max > 70 ? 'almost overhead' : cur.max > 45 ? 'high in the sky' : 'about a third of the way up'} and leaves towards the ${compass(cur.azEnd)}. Visible for about ${Math.max(1, Math.round((cur.end - cur.start) / 6e4))} minutes as a bright, steady moving light.` });
          }
          cur = null;
        }
      }
    }
    return 'ok';
  }

  function flybys(now, sky, days, out) {
    const cad = sky?.cad; if (!cad || !Array.isArray(cad.fields) || !Array.isArray(cad.data)) return;
    const ix = Object.fromEntries(cad.fields.map((f, i) => [f, i]));
    const rows = cad.data.map(r => ({ name: String(r[ix.fullname] ?? r[ix.des] ?? '').trim().replace(/^\((.*)\)$/, '$1'), t: Date.parse(String(r[ix.cd]).replace(/^(\d{4})-(\w{3})-(\d{2}) (\d{2}:\d{2})$/, '$3 $2 $1 $4 UTC')), ld: parseFloat(r[ix.dist]) * 389.17, h: parseFloat(r[ix.h]), dia: parseFloat(r[ix.diameter]) }))
      .filter(r => r.name && !isNaN(r.t) && r.t > now - 0 && r.t - now < days * DAYMS && r.ld > 0);
    rows.sort((a, b) => a.ld - b.ld).slice(0, 4).forEach(r => {
      // size from brightness when no measured diameter (assumes a typical surface)
      const d = r.dia ? r.dia * 1000 : 1329000 / Math.sqrt(0.14) * Math.pow(10, -0.2 * r.h);
      const size = isNaN(d) ? '' : d < 1000 ? `roughly ${Math.max(1, Math.round(d / (d < 20 ? 1 : 5)) * (d < 20 ? 1 : 5))} m wide` : `about ${(d / 1000).toFixed(1)} km wide`;
      out.push({ when: r.t, kind: 'flyby', icon: '🪨', visible: false, title: `Asteroid ${r.name} passes Earth`, detail: `A safe pass at ${r.ld < 1 ? `${Math.round(r.ld * 384400).toLocaleString()} km, inside the Moon’s orbit` : `${r.ld.toFixed(1)} times the Moon’s distance`}${size ? `; ${size}` : ''}. Too faint to see without a telescope.` });
    });
  }

  const cache = new Map();
  /** Cached per place and hour (the sums take a few seconds). */
  AG.skyFor = function (location, sky) {
    if (!location) return null;
    const key = `${location.lat},${location.lon},${Math.floor(Date.now() / 36e5)},${sky?.fetchedAt || 0}`;
    if (!cache.has(key)) { cache.clear(); cache.set(key, S.compute(location, new Date(), sky)); }
    return cache.get(key);
  };

  /** Everything the Almanac needs. location = {name, lat, lon}; sky = {tle, cad, fetchedAt}. */
  S.compute = function (location, now = new Date(), sky = null, days = 45) {
    if (!A() || !location) return null;
    const obs = new (A().Observer)(location.lat, location.lon, 0), place = location.name, events = [];
    const run = (fn) => { try { return fn(); } catch (e) { console.warn('sky calc', e); return null; } };
    const tonight = run(() => S.tonight(obs, now));
    run(() => moonPhases(now, 30, events));
    run(() => eclipses(now, obs, place, events));
    run(() => meetings(now, obs, place, days, events));
    run(() => showers(now, 75, events));
    const issState = run(() => passes(now, obs, place, sky, 10, events)) || 'none';
    run(() => flybys(now, sky, 60, events));
    events.sort((a, b) => a.when - b.when);
    return { location, tonight, events, issState };
  };
})(typeof window !== 'undefined' ? window : globalThis);
