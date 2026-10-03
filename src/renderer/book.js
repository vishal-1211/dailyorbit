/* Book: shows pages as a two-page spread (or single page) and turns them with a 3D page flip.
   Supports animated turns, drag-to-turn following the pointer, and quick jumps. */
(function () {
  const AG = window.AG;
  const el = (tag, cls) => { const e = document.createElement(tag); e.className = cls; return e; };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  class Book {
    constructor(stage) {
      this.stage = stage;
      this.book = el('div', 'book');
      this.L = el('div', 'slot left');
      this.R = el('div', 'slot right');
      this.book.append(this.L, this.R);
      this.zwrap = el('div', 'zwrap');
      this.zwrap.appendChild(this.book);
      stage.appendChild(this.zwrap);
      this.zoom = 1;
      this.gestures = false; // when false, pages turn ONLY through turn()/jump() (buttons, arrow keys)
      this.pages = []; this.views = [[null, null]]; this.v = 0;
      this.busy = false; this.onChange = () => {};
    }

    load(pages, { pageW, pageH, spread, cover = false, startPage = 0 }) {
      Object.assign(this, { pages, pageW, pageH, spread, cover });
      this.book.style.width = `${(spread ? 2 : 1) * pageW}px`;
      this.book.style.height = `${pageH}px`;
      this.book.style.setProperty('--pw', `${pageW}px`);
      this.book.style.setProperty('--ph', `${pageH}px`);
      this.book.classList.toggle('is-spread', spread);
      this.R.style.left = spread ? `${pageW}px` : '0px';
      this.L.style.display = spread ? '' : 'none';
      this.views = this.buildViews();
      this.layoutZoom();
      this.show(Math.max(0, this.viewOf(startPage)));
    }

    buildViews() {
      const n = this.pages.length, v = [];
      if (!this.spread) { for (let i = 0; i < n; i++) v.push([null, i]); return v.length ? v : [[null, null]]; }
      let i = 0;
      if (this.cover) { v.push([null, 0]); i = 1; }
      for (; i < n; i += 2) v.push([i, i + 1 < n ? i + 1 : null]);
      return v.length ? v : [[null, null]];
    }
    viewOf(p) { return this.views.findIndex(v => v.includes(p)); }
    offset(v) {
      if (!this.spread) return 0;
      const [l, r] = this.views[v];
      if (l == null && r != null) return -this.pageW / 2;
      if (r == null && l != null) return this.pageW / 2;
      return 0;
    }
    place(slot, idx) {
      slot.replaceChildren();
      const has = idx != null && this.pages[idx];
      if (has) slot.appendChild(this.pages[idx]);
      slot.classList.toggle('empty', !has);
      slot.appendChild(el('div', 'spine'));
      if (has) slot.appendChild(el('div', 'corner'));
    }
    show(v) {
      this.v = v;
      const [l, r] = this.views[v];
      if (this.spread) this.place(this.L, l);
      this.place(this.R, r);
      this.book.style.transform = this.xf(this.offset(v));
      this.onChange(this);
    }
    // --- zoom & scrolling ------------------------------------------------
    xf(o) { return `scale(${this.zoom}) translateX(${o}px)`; }
    bookW() { return (this.spread ? 2 : 1) * this.pageW; }
    layoutZoom() {
      const z = this.zoom;
      this.zwrap.style.width = `${this.bookW() * z}px`;
      this.zwrap.style.height = `${this.pageH * z}px`;
      this.stage.classList.toggle('zoomed', z > 1.001);
      this.stage.classList.toggle('scrolls', this.scrollable());
    }
    scrollable() { const s = this.stage; return this.zoom > 1.001 || this.pageH > s.clientHeight - 8 || this.bookW() > s.clientWidth - 8; }
    setZoom(z, anchor) {
      z = Math.max(1, Math.min(2.5, Math.round(z * 100) / 100));
      if (Math.abs(z - this.zoom) < 0.001) return;
      const s = this.stage;
      const ax = anchor ? anchor.x : s.clientWidth / 2, ay = anchor ? anchor.y : s.clientHeight / 2;
      const fx = (s.scrollLeft + ax) / Math.max(1, s.scrollWidth), fy = (s.scrollTop + ay) / Math.max(1, s.scrollHeight);
      this.zoom = z;
      this.book.style.transform = this.xf(this.offset(this.v));
      this.layoutZoom();
      s.scrollLeft = fx * s.scrollWidth - ax; s.scrollTop = fy * s.scrollHeight - ay;
      this.onZoom?.(z);
    }
    atTop() { return this.stage.scrollTop <= 2; }
    atBottom() { const s = this.stage; return s.scrollTop + s.clientHeight >= s.scrollHeight - 2; }

    visible() { return this.views[this.v].filter(x => x != null); }
    canNext() { return this.v < this.views.length - 1; }
    canPrev() { return this.v > 0; }

    makeTurn(dir) {
      const from = this.v, to = from + dir;
      const cur = this.views[from], nxt = this.views[to];
      const pw = this.pageW;
      const leaf = el('div', 'leaf');
      const front = el('div', 'face front'), back = el('div', 'face back');
      const fShade = el('div', 'shade'), bShade = el('div', 'shade');
      const gloss = el('div', 'gloss');
      leaf.append(front, back);
      let fp, bp, under;
      if (this.spread) {
        if (dir > 0) { leaf.style.left = `${pw}px`; leaf.style.transformOrigin = 'left center'; fp = cur[1]; bp = nxt[0]; this.place(this.R, nxt[1]); under = this.R; front.classList.add('right'); back.classList.add('left'); }
        else { leaf.style.left = '0px'; leaf.style.transformOrigin = 'right center'; fp = cur[0]; bp = nxt[1]; this.place(this.L, nxt[0]); under = this.L; front.classList.add('left'); back.classList.add('right'); }
      } else {
        leaf.style.left = '0px'; leaf.style.transformOrigin = 'left center';
        if (dir > 0) { fp = cur[1]; this.place(this.R, nxt[1]); } else { fp = nxt[1]; this.place(this.R, cur[1]); }
        bp = null; under = this.R; front.classList.add('right');
      }
      if (fp != null) front.appendChild(this.pages[fp]); else front.classList.add('blank');
      if (bp != null) back.appendChild(this.pages[bp]); else back.classList.add('blank');
      front.append(el('div', 'spine'), fShade, gloss); back.append(el('div', 'spine'), bShade);
      const cast = el('div', 'cast'); under.appendChild(cast);
      this.book.appendChild(leaf);
      this.book.classList.add('turning');
      const o0 = this.offset(from), o1 = this.offset(to);

      const apply = (t) => {
        let ang;
        if (this.spread) ang = dir > 0 ? -180 * t : 180 * t;
        else ang = dir > 0 ? -180 * t : -180 * (1 - t);
        const a = Math.abs(ang) / 180; // 0 flat … 1 fully turned
        // A slight lift and skew near the vertical sells the paper bend.
        const lift = Math.sin(a * Math.PI);
        leaf.style.transform = `rotateY(${ang}deg) translateZ(${lift * 6}px) skewY(${(dir > 0 ? -1 : 1) * lift * 1.2}deg)`;
        fShade.style.opacity = (a * 0.7).toFixed(3);
        bShade.style.opacity = ((1 - a) * 0.7).toFixed(3);
        gloss.style.opacity = (lift * 0.35).toFixed(3);
        cast.style.opacity = (lift * 0.85).toFixed(3);
        cast.style.width = `${(0.15 + lift * 0.45) * 100}%`;
        if (!this.spread) leaf.style.opacity = a > 0.8 ? String(Math.max(0, 1 - (a - 0.8) / 0.2)) : '1';
        this.book.style.transform = this.xf(o0 + (o1 - o0) * t);
      };
      const done = (commit) => {
        leaf.remove(); cast.remove(); this.book.classList.remove('turning'); this.show(commit ? to : from);
        if (commit && this.scrollable()) this.stage.scrollTo({ top: dir > 0 ? 0 : this.stage.scrollHeight, behavior: 'instant' });
      };
      return { apply, done };
    }

    animate(turn, a, b, dur) {
      return new Promise(res => {
        const t0 = performance.now();
        const step = (now) => {
          const k = Math.min(1, (now - t0) / dur);
          turn.apply(a + (b - a) * ease(k));
          if (k < 1) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      });
    }

    async turn(dir, dur = 760) {
      if (this.busy || (dir > 0 ? !this.canNext() : !this.canPrev())) return false;
      this.busy = true;
      const t = this.makeTurn(dir);
      t.apply(0);
      await this.animate(t, 0, 1, dur);
      t.done(true);
      this.busy = false;
      return true;
    }

    // --- drag-to-turn
    dragStart(dir) {
      if (this.busy || (dir > 0 ? !this.canNext() : !this.canPrev())) return false;
      this.busy = true;
      this.drag = { turn: this.makeTurn(dir), t: 0 };
      this.drag.turn.apply(0);
      return true;
    }
    dragMove(t) { if (!this.drag) return; this.drag.t = Math.max(0, Math.min(1, t)); this.drag.turn.apply(this.drag.t); }
    async dragEnd(commit) {
      const d = this.drag; if (!d) return; this.drag = null;
      const target = commit ? 1 : 0;
      await this.animate(d.turn, d.t, target, 160 + 520 * Math.abs(target - d.t));
      d.turn.done(commit);
      this.busy = false;
    }

    // --- jump to any page (quick riffle for short hops, fade for long ones)
    async jump(pageIdx) {
      const v = this.viewOf(pageIdx);
      if (v < 0 || v === this.v || this.busy) return;
      const dist = v - this.v;
      if (Math.abs(dist) <= 2) { for (let i = 0; i < Math.abs(dist); i++) await this.turn(Math.sign(dist), 480); return; }
      this.busy = true;
      await this.book.animate([{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(3px)' }], { duration: 160, fill: 'forwards' }).finished;
      this.show(v);
      await this.book.animate([{ opacity: 0, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 220, fill: 'forwards' }).finished;
      this.busy = false;
    }

    /** Wire pointer, wheel and click gestures on the stage. onActivate(el) handles in-page links. */
    wire(onActivate) {
      const stage = this.stage;
      let st = null;
      stage.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        st = { x: e.clientX, y: e.clientY, t: performance.now(), target: e.target, drag: false, lx: e.clientX, lt: performance.now(), vx: 0,
          pan: this.zoom > 1.001, sl: stage.scrollLeft, stp: stage.scrollTop };
      });
      stage.addEventListener('pointermove', (e) => {
        if (!st) return;
        const dx = e.clientX - st.x, dy = e.clientY - st.y;
        if (st.pan) {
          if (!st.panning && Math.hypot(dx, dy) > 4) { st.panning = true; stage.setPointerCapture(e.pointerId); stage.classList.add('panning'); }
          if (st.panning) { stage.scrollLeft = st.sl - dx; stage.scrollTop = st.stp - dy; }
          return;
        }
        if (!this.gestures) return;
        if (!st.drag && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          const dir = dx < 0 ? 1 : -1;
          if (this.dragStart(dir)) { st.drag = true; st.dir = dir; stage.setPointerCapture(e.pointerId); stage.classList.add('dragging'); }
          else { st = null; return; }
        }
        if (st.drag) {
          const now = performance.now();
          st.vx = (e.clientX - st.lx) / Math.max(1, now - st.lt); st.lx = e.clientX; st.lt = now;
          const span = this.spread ? this.pageW * 1.7 : this.pageW * 1.1;
          this.dragMove(Math.abs(dx) / span);
        }
      });
      const end = (e) => {
        if (!st) return;
        const s = st; st = null;
        stage.classList.remove('dragging', 'panning');
        if (s.panning) return;
        if (s.drag) {
          const flick = Math.abs(s.vx) > 0.5 && Math.sign(-s.vx) === s.dir;
          this.dragEnd((this.drag?.t || 0) > 0.3 || flick);
          return;
        }
        if (e.type === 'pointercancel') return;
        if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > 6) return;
        const act = s.target.closest('[data-act],[data-open-url],[data-goto-page],[data-open-story]');
        if (act) { onActivate(act); return; }
        if (!this.gestures || this.zoom > 1.001) return; // turn with the arrow buttons / keys
        const r = this.book.getBoundingClientRect();
        const zone = Math.min(160, r.width * 0.2);
        if (e.clientX > r.right - zone) this.turn(1);
        else if (e.clientX < r.left + zone) this.turn(-1);
      };
      stage.addEventListener('pointerup', end);
      stage.addEventListener('pointercancel', end);

      let acc = 0, lock = 0;
      stage.addEventListener('wheel', (e) => {
        if (e.ctrlKey) { e.preventDefault(); const r = stage.getBoundingClientRect(); this.setZoom(this.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), { x: e.clientX - r.left, y: e.clientY - r.top }); return; }
        if (!this.gestures) return; // scrolling only ever scrolls; it never changes the page
        if (this.scrollable()) {
          // Scroll the page; only turn when you keep scrolling past the bottom (or top).
          const down = e.deltaY > 0;
          const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
          if (horizontal || (down && !this.atBottom()) || (!down && !this.atTop())) { acc = 0; return; }
        }
        e.preventDefault();
        if (performance.now() < lock || this.busy) return;
        acc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(acc) > 60) { const d = Math.sign(acc); acc = 0; lock = performance.now() + 450; this.turn(d); }
      }, { passive: false });
    }
  }
  AG.Book = Book;
})();
