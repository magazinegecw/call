/**
 * HERO: MAGAZINE EDITORIAL TYPOGRAPHY WALL
 * Floating typography texture strictly constrained to perimeter safe zones.
 * Mathematically guarantees that floating words NEVER overlap or pass behind
 * the center headline text, subline, or Apply Now button on any screen.
 */
(function () {
  'use strict';

  const layer = document.getElementById('floating-cards-layer');
  const headlineWrap = document.querySelector('.hero-headline-wrap');
  if (!layer) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ── Magazine Editorial Vocabulary ── */
  const WORDS = [
    // Grand editorial watermarks
    { t: 'EDITORIAL',   desktop: 4.0, mobile: 1.45, w: 800 },
    { t: 'NARRATIVE',   desktop: 3.6, mobile: 1.35, w: 800 },
    { t: 'TYPOGRAPHY',  desktop: 3.2, mobile: 1.3,  w: 800 },
    { t: 'CHRONICLE',   desktop: 2.8, mobile: 1.25, w: 700 },
    { t: 'CULTURE',     desktop: 2.6, mobile: 1.2,  w: 700 },
    { t: 'DESIGN',      desktop: 2.4, mobile: 1.15, w: 700 },

    // Medium display terms
    { t: 'PRINT',       desktop: 2.2, mobile: 1.15, w: 700 },
    { t: 'PRESS',       desktop: 2.1, mobile: 1.1,  w: 700 },
    { t: 'GAZETTE',     desktop: 2.0, mobile: 1.1,  w: 700 },
    { t: 'HEADLINE',    desktop: 1.9, mobile: 1.05, w: 700 },
    { t: 'PUBLISH',     desktop: 1.85, mobile: 1.05, w: 600 },
    { t: 'ARCHIVE',     desktop: 1.8, mobile: 1.0,  w: 700 },
    { t: 'VISUAL',      desktop: 1.75, mobile: 1.0,  w: 600 },
    { t: 'FEATURE',     desktop: 1.7, mobile: 0.95, w: 700 },
    { t: 'SPREAD',      desktop: 1.6, mobile: 0.95, w: 600 },
    { t: 'MONTAGE',     desktop: 1.5, mobile: 0.9,  w: 600 },

    // Fine editorial tags & metadata
    { t: 'INK',         desktop: 1.3, mobile: 0.88, w: 700 },
    { t: 'STORY',       desktop: 1.25, mobile: 0.88, w: 600 },
    { t: 'CRAFT',       desktop: 1.2, mobile: 0.85, w: 600 },
    { t: 'VOICE',       desktop: 1.15, mobile: 0.85, w: 600 },
    { t: 'DRAFT',       desktop: 1.1, mobile: 0.82, w: 600 },
    { t: 'COVER',       desktop: 1.05, mobile: 0.82, w: 600 },
    { t: 'LAYOUT',      desktop: 1.0, mobile: 0.8,  w: 600 },
    { t: 'COLUMN',      desktop: 0.95, mobile: 0.8,  w: 500 },
    { t: 'SERIF',       desktop: 0.9, mobile: 0.78, w: 600 },
    { t: 'LENS',        desktop: 0.9, mobile: 0.78, w: 600 },

    // Rotated editorial text (vertical page gutters)
    { t: 'EDITORIAL',   desktop: 2.0, mobile: 1.1,  w: 700, rot: -90 },
    { t: 'PRINT',       desktop: 1.7, mobile: 1.0,  w: 700, rot: 90 },
    { t: 'DESIGN',      desktop: 1.8, mobile: 1.05, w: 700, rot: -90 },
    { t: 'ARCHIVE',     desktop: 1.5, mobile: 0.95, w: 700, rot: 90 },

    // Monospaced markers
    { t: 'VOL. 26',     desktop: 0.95, mobile: 0.72, w: 700, mono: true },
    { t: 'ISSUE 01',    desktop: 0.95, mobile: 0.72, w: 700, mono: true },
    { t: '26\u201427',  desktop: 0.9,  mobile: 0.7,  w: 700, mono: true },
    { t: 'GECW',        desktop: 0.9,  mobile: 0.7,  w: 800, mono: true },
    { t: 'EST. 1986',   desktop: 0.85, mobile: 0.68, w: 700, mono: true }
  ];

  /* ── State ── */
  let items = [];
  let mouse = { x: 0, y: 0 };
  let lerped = { x: 0, y: 0 };
  let rafId = null;
  let lastTs = 0;
  let cachedExcl = null;

  const rand = (a, b) => a + Math.random() * (b - a);

  function calcOpacity(size) {
    if (size >= 3.0) return rand(0.08, 0.12);
    if (size >= 1.8) return rand(0.12, 0.17);
    if (size >= 1.1) return rand(0.16, 0.24);
    return rand(0.20, 0.30);
  }

  /**
   * Calculate dynamic exclusion bounding box of the central hero headline wrap.
   * Elements must strictly stay outside this box at all times.
   */
  function getHeadlineExclusion() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw <= 768;

    if (!headlineWrap) {
      return {
        left: vw * 0.18,
        right: vw * 0.82,
        top: vh * 0.24,
        bottom: vh * 0.76
      };
    }

    const rect = headlineWrap.getBoundingClientRect();
    // Safety buffer around the headline container
    const padX = isMobile ? 14 : 32;
    const padY = isMobile ? 12 : 26;

    return {
      left: Math.max(0, rect.left - padX),
      right: Math.min(vw, rect.right + padX),
      top: Math.max(0, rect.top - padY),
      bottom: Math.min(vh, rect.bottom + padY)
    };
  }

  /**
   * Rebuild all floating typography elements outside the exclusion zone
   */
  function build() {
    layer.innerHTML = '';
    items = [];

    const isMobile = window.innerWidth <= 768;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const excl = getHeadlineExclusion();
    cachedExcl = excl;

    // Available space measurements
    const navBottom = isMobile ? 65 : 75;
    const topBandHeight = excl.top - navBottom;
    const bottomBandHeight = (vh - (isMobile ? 15 : 25)) - excl.bottom;
    const leftMarginWidth = excl.left;
    const rightMarginWidth = vw - excl.right;

    // Mobile: clean 16 items focused on top & bottom bands
    // Desktop: full 35 items distributed across all 4 zones
    const wordCount = isMobile ? 16 : WORDS.length;

    /* ── 1. Words ── */
    for (let i = 0; i < wordCount; i++) {
      const word = WORDS[i];
      const size = isMobile ? word.mobile : word.desktop;
      const rotation = word.rot || 0;

      const el = document.createElement('span');
      el.className = 'mag-word';
      if (word.mono) el.classList.add('mono');

      if (i % 8 === 2) {
        el.classList.add('accent');
      } else if (i % 7 === 4) {
        el.classList.add('underlined');
      }

      el.textContent = word.t;
      el.style.fontSize = size + 'rem';
      el.style.fontWeight = word.w;

      // Add to DOM first to accurately measure rendered dimensions
      layer.appendChild(el);
      const elemW = el.offsetWidth || (size * 16 * (word.t.length * 0.6));
      const elemH = el.offsetHeight || (size * 16 * 1.2);

      const ampX = rand(2, isMobile ? 5 : 10);
      const ampY = rand(2, isMobile ? 4 : 8);

      // Determine valid placement zones where element + motion fits outside exclusion
      // Zones: 0 = Top, 1 = Bottom, 2 = Left, 3 = Right
      const candidateZones = [];

      // Top band check
      if (topBandHeight > elemH + ampY * 2 + 8) {
        candidateZones.push(0);
      }
      // Bottom band check
      if (bottomBandHeight > elemH + ampY * 2 + 8) {
        candidateZones.push(1);
      }
      // Left column check (only if enough horizontal margin)
      if (leftMarginWidth > elemW + ampX * 2 + 12) {
        candidateZones.push(2);
      }
      // Right column check (only if enough horizontal margin)
      if (rightMarginWidth > elemW + ampX * 2 + 12) {
        candidateZones.push(3);
      }

      // Fallback: If margins are too narrow (e.g. mobile), default to Top (0) or Bottom (1)
      let zoneType;
      if (candidateZones.length > 0) {
        zoneType = candidateZones[i % candidateZones.length];
      } else {
        zoneType = (i % 2 === 0) ? 0 : 1;
      }

      let bx = 0;
      let by = 0;

      if (zoneType === 0) {
        // TOP BAND (between navbar and headline)
        const minY = navBottom + 4;
        const maxY = Math.max(minY, excl.top - elemH - ampY - 6);
        by = rand(minY, maxY);
        const minX = 12;
        const maxX = Math.max(minX, vw - elemW - ampX - 12);
        bx = rand(minX, maxX);
      } else if (zoneType === 1) {
        // BOTTOM BAND (below Apply button)
        const minY = excl.bottom + ampY + 8;
        const maxY = Math.max(minY, vh - elemH - ampY - (isMobile ? 18 : 25));
        by = rand(minY, maxY);
        // Avoid floating yellow badge on bottom-left on mobile
        const minX = isMobile ? Math.min(88, vw * 0.25) : 20;
        const maxX = Math.max(minX, vw - elemW - ampX - 20);
        bx = rand(minX, maxX);
      } else if (zoneType === 2) {
        // LEFT COLUMN (desktop)
        const minX = 8;
        const maxX = Math.max(minX, excl.left - elemW - ampX - 8);
        bx = rand(minX, maxX);
        const minY = Math.max(navBottom + 10, excl.top);
        const maxY = Math.max(minY, excl.bottom - elemH);
        by = rand(minY, maxY);
      } else {
        // RIGHT COLUMN (desktop)
        const minX = excl.right + ampX + 8;
        const maxX = Math.max(minX, vw - elemW - ampX - 12);
        bx = rand(minX, maxX);
        const minY = Math.max(navBottom + 10, excl.top);
        const maxY = Math.max(minY, excl.bottom - elemH);
        by = rand(minY, maxY);
      }

      const op = calcOpacity(size);

      items.push({
        el,
        baseX: bx,
        baseY: by,
        w: elemW,
        h: elemH,
        zoneType,
        targetOp: op,
        curOp: 0,
        rotation,
        ampX,
        ampY,
        freqX: rand(0.0003, 0.0007),
        freqY: rand(0.0003, 0.00065),
        phase: rand(0, Math.PI * 2),
        parallax: isMobile ? 0 : (size > 2.2 ? rand(12, 22) : (size > 1.2 ? rand(6, 12) : rand(2, 6))),
        revealed: false
      });
    }

    /* ── 2. Editorial Decorative Marks (Lines, Crosses, Dots) ── */
    const decorCount = isMobile ? 4 : 10;
    for (let d = 0; d < decorCount; d++) {
      const dType = d % 3;
      let del;

      if (dType === 0) {
        del = document.createElement('div');
        del.className = 'mag-line';
        del.style.width = rand(isMobile ? 24 : 40, isMobile ? 45 : 85) + 'px';
      } else if (dType === 1) {
        del = document.createElement('div');
        del.className = 'mag-cross';
      } else {
        del = document.createElement('div');
        del.className = 'mag-dot';
      }

      layer.appendChild(del);
      const dW = del.offsetWidth || 15;
      const dH = del.offsetHeight || 15;

      const zoneType = (d % 2 === 0) ? 0 : 1;
      let dx = 0;
      let dy = 0;

      if (zoneType === 0) {
        dy = rand(navBottom + 5, Math.max(navBottom + 6, excl.top - dH - 8));
        dx = rand(15, vw - dW - 15);
      } else {
        dy = rand(excl.bottom + 8, Math.max(excl.bottom + 10, vh - dH - 20));
        dx = rand(isMobile ? 90 : 25, vw - dW - 20);
      }

      const decorOp = isMobile ? rand(0.12, 0.18) : rand(0.14, 0.22);

      items.push({
        el: del,
        baseX: dx,
        baseY: dy,
        w: dW,
        h: dH,
        zoneType,
        targetOp: decorOp,
        curOp: 0,
        rotation: 0,
        ampX: rand(1.5, 4),
        ampY: rand(1, 3),
        freqX: rand(0.0004, 0.0008),
        freqY: rand(0.0003, 0.00075),
        phase: rand(0, Math.PI * 2),
        parallax: 0,
        revealed: false
      });
    }

    staggerReveal();
  }

  function staggerReveal() {
    if (reducedMotion) {
      items.forEach((it) => {
        it.curOp = it.targetOp;
        it.revealed = true;
        it.el.style.opacity = it.targetOp.toFixed(3);
        it.el.style.transform = `translate3d(${it.baseX.toFixed(0)}px, ${it.baseY.toFixed(0)}px, 0)` +
          (it.rotation ? ` rotate(${it.rotation}deg)` : '');
      });
      return;
    }

    items.forEach((it, idx) => {
      setTimeout(() => {
        it.revealed = true;
      }, 30 + idx * 20);
    });
  }

  function onMouseMove(e) {
    if (isTouch || reducedMotion) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouse.x = (e.clientX - cx) / cx;
    mouse.y = (e.clientY - cy) / cy;
  }

  /**
   * Main 60 fps Animation Loop with real-time perimeter boundary enforcement
   */
  function tick(ts) {
    if (!lastTs) lastTs = ts;
    const elapsed = ts;
    const excl = cachedExcl || getHeadlineExclusion();

    if (!isTouch && !reducedMotion) {
      lerped.x += (mouse.x - lerped.x) * 0.05;
      lerped.y += (mouse.y - lerped.y) * 0.05;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.revealed) continue;

      if (it.curOp < it.targetOp) {
        it.curOp = Math.min(it.targetOp, it.curOp + 0.01);
      }

      if (reducedMotion) {
        it.el.style.opacity = it.curOp.toFixed(3);
        continue;
      }

      // Drift calculation
      const driftX = Math.sin(elapsed * it.freqX + it.phase) * it.ampX;
      const driftY = Math.cos(elapsed * it.freqY + it.phase) * it.ampY;

      // Parallax offset
      const px = lerped.x * it.parallax;
      const py = lerped.y * (it.parallax * 0.85);

      let x = it.baseX + driftX + px;
      let y = it.baseY + driftY + py;

      // STRICT COLLISION ENFORCEMENT:
      // Guarantee the element never enters the central exclusion box
      if (it.zoneType === 0) {
        // Top zone: element's bottom must strictly stay above the headline top
        y = Math.min(y, excl.top - it.h - 4);
      } else if (it.zoneType === 1) {
        // Bottom zone: element's top must strictly stay below the Apply button
        y = Math.max(y, excl.bottom + 4);
      } else if (it.zoneType === 2) {
        // Left column: element's right edge must strictly stay left of the headline
        x = Math.min(x, excl.left - it.w - 4);
      } else if (it.zoneType === 3) {
        // Right column: element's left edge must strictly stay right of the headline
        x = Math.max(x, excl.right + 4);
      }

      // Subtle rotation drift
      const rotWobble = Math.sin(elapsed * 0.0003 + it.phase) * 1.2;
      const totalRot = it.rotation + rotWobble;

      // Organic breathing opacity
      const breathe = it.curOp * (0.93 + 0.07 * Math.sin(elapsed * 0.0009 + it.phase));

      it.el.style.opacity = breathe.toFixed(3);
      it.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${totalRot.toFixed(1)}deg)`;
    }

    rafId = requestAnimationFrame(tick);
  }

  /* ── Resize & Orientation Handler ── */
  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      build();
    }, 200);
  }

  /* ── Init ── */
  function init() {
    build();
    if (!reducedMotion) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onResize);
      rafId = requestAnimationFrame(tick);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
