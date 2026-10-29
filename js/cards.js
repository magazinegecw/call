/**
 * HERO: MAGAZINE EDITORIAL TYPOGRAPHY WALL
 * Strictly non-overlapping floating typography texture.
 * Uses Axis-Aligned Bounding Box (AABB) spatial reservation to mathematically
 * guarantee that cards NEVER overlap each other and NEVER overlap the central
 * hero headline, subline, or Apply button on any screen.
 */
(function () {
  'use strict';

  const layer = document.getElementById('floating-cards-layer');
  const headlineWrap = document.querySelector('.hero-headline-wrap');
  const hero = document.querySelector('.hero-section');
  if (!layer) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ── Magazine Editorial Vocabulary ── */
  const WORDS = [
    // Grand editorial watermarks
    { t: 'EDITORIAL',   desktop: 3.8, mobile: 1.35, w: 800 },
    { t: 'NARRATIVE',   desktop: 3.4, mobile: 1.25, w: 800 },
    { t: 'TYPOGRAPHY',  desktop: 3.0, mobile: 1.2,  w: 800 },
    { t: 'CHRONICLE',   desktop: 2.6, mobile: 1.15, w: 700 },
    { t: 'CULTURE',     desktop: 2.4, mobile: 1.1,  w: 700 },
    { t: 'DESIGN',      desktop: 2.2, mobile: 1.05, w: 700 },

    // Medium display terms
    { t: 'PRINT',       desktop: 2.1, mobile: 1.05, w: 700 },
    { t: 'PRESS',       desktop: 2.0, mobile: 1.0,  w: 700 },
    { t: 'GAZETTE',     desktop: 1.9, mobile: 1.0,  w: 700 },
    { t: 'HEADLINE',    desktop: 1.85, mobile: 0.95, w: 700 },
    { t: 'PUBLISH',     desktop: 1.8, mobile: 0.95, w: 600 },
    { t: 'ARCHIVE',     desktop: 1.75, mobile: 0.9,  w: 700 },
    { t: 'VISUAL',      desktop: 1.7, mobile: 0.9,  w: 600 },
    { t: 'FEATURE',     desktop: 1.6, mobile: 0.88, w: 700 },
    { t: 'SPREAD',      desktop: 1.5, mobile: 0.88, w: 600 },
    { t: 'MONTAGE',     desktop: 1.45, mobile: 0.85, w: 600 },

    // Fine editorial tags & metadata
    { t: 'INK',         desktop: 1.25, mobile: 0.82, w: 700 },
    { t: 'STORY',       desktop: 1.2,  mobile: 0.82, w: 600 },
    { t: 'CRAFT',       desktop: 1.15, mobile: 0.8,  w: 600 },
    { t: 'VOICE',       desktop: 1.1,  mobile: 0.8,  w: 600 },
    { t: 'DRAFT',       desktop: 1.05, mobile: 0.78, w: 600 },
    { t: 'COVER',       desktop: 1.0,  mobile: 0.78, w: 600 },
    { t: 'LAYOUT',      desktop: 0.95, mobile: 0.75, w: 600 },
    { t: 'COLUMN',      desktop: 0.9,  mobile: 0.75, w: 500 },
    { t: 'SERIF',       desktop: 0.85, mobile: 0.72, w: 600 },
    { t: 'LENS',        desktop: 0.85, mobile: 0.72, w: 600 },

    // Rotated vertical terms
    { t: 'EDITORIAL',   desktop: 1.9,  mobile: 1.0,  w: 700, rot: -90 },
    { t: 'PRINT',       desktop: 1.6,  mobile: 0.95, w: 700, rot: 90 },
    { t: 'DESIGN',      desktop: 1.7,  mobile: 0.95, w: 700, rot: -90 },
    { t: 'ARCHIVE',     desktop: 1.4,  mobile: 0.88, w: 700, rot: 90 },

    // Monospaced masthead markers
    { t: 'VOL. 26',     desktop: 0.9,  mobile: 0.7,  w: 700, mono: true },
    { t: 'ISSUE 01',    desktop: 0.9,  mobile: 0.7,  w: 700, mono: true },
    { t: '26\u201427',  desktop: 0.85, mobile: 0.68, w: 700, mono: true },
    { t: 'GECW',        desktop: 0.85, mobile: 0.68, w: 800, mono: true },
    { t: 'EST. 1986',   desktop: 0.8,  mobile: 0.65, w: 700, mono: true }
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
    if (size >= 2.8) return rand(0.08, 0.12);
    if (size >= 1.6) return rand(0.12, 0.17);
    if (size >= 1.0) return rand(0.16, 0.23);
    return rand(0.20, 0.28);
  }

  /**
   * Calculate central headline exclusion box with safety padding.
   * Uses relative coordinates to hero container so scrolling never distorts measurements.
   */
  function getHeadlineExclusion() {
    const heroRect = hero ? hero.getBoundingClientRect() : (layer ? layer.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
    const vw = heroRect.width || window.innerWidth;
    const vh = heroRect.height || window.innerHeight;
    const isMobile = vw <= 768;

    if (!headlineWrap) {
      return {
        left: vw * 0.16,
        right: vw * 0.84,
        top: vh * 0.22,
        bottom: vh * 0.78
      };
    }

    const rect = headlineWrap.getBoundingClientRect();
    const padX = isMobile ? 18 : 36;
    const padY = isMobile ? 16 : 30;

    const relLeft = rect.left - heroRect.left;
    const relTop = rect.top - heroRect.top;

    return {
      left: Math.max(0, relLeft - padX),
      right: Math.min(vw, relLeft + rect.width + padX),
      top: Math.max(0, relTop - padY),
      bottom: Math.min(vh, relTop + rect.height + padY)
    };
  }

  /**
   * Check if two Axis-Aligned Bounding Boxes overlap.
   */
  function boxesOverlap(a, b) {
    return !(
      a.right <= b.left ||
      a.left >= b.right ||
      a.bottom <= b.top ||
      a.top >= b.bottom
    );
  }

  /**
   * Check if a candidate bounding box collides with the headline exclusion
   * or any previously placed floating card.
   */
  function isColliding(candidate, placedBoxes, excl) {
    // 1. Check headline exclusion
    if (boxesOverlap(candidate, excl)) return true;

    // 2. Check all previously placed cards
    for (let i = 0; i < placedBoxes.length; i++) {
      if (boxesOverlap(candidate, placedBoxes[i])) return true;
    }

    return false;
  }

  /**
   * Rebuild all floating typography elements with guaranteed non-overlapping positions.
   */
  function build() {
    layer.innerHTML = '';
    items = [];

    const isMobile = window.innerWidth <= 768;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const excl = getHeadlineExclusion();
    cachedExcl = excl;

    // Spatial bounding box records for all placed items
    const placedBoxes = [];

    // Layout margins
    const navBottom = isMobile ? 65 : 75;
    const screenBottom = vh - (isMobile ? 18 : 25);
    const badgeAvoidRadius = isMobile ? 88 : 0; // avoid bottom-left badge on phone

    // Collision safety buffer: ensures items don't touch even during drift
    const safetyBuffer = isMobile ? 18 : 32;

    // Target element count based on screen capacity
    const maxTarget = isMobile ? 12 : 28;

    /* ── 1. Place Words ── */
    for (let i = 0; i < WORDS.length && items.length < maxTarget; i++) {
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

      // Append temporarily to measure accurate rendered dimensions
      layer.appendChild(el);
      const elemW = el.offsetWidth || 70;
      const elemH = el.offsetHeight || 22;

      // Motion drift amplitudes
      const ampX = rand(2, isMobile ? 4 : 8);
      const ampY = rand(1.5, isMobile ? 3 : 6);

      // Determine candidate zones where this element can fit
      // 0 = Top band, 1 = Bottom band, 2 = Left column, 3 = Right column
      const validZones = [];

      // Top band check
      if (excl.top - navBottom > elemH + ampY * 2 + 10) validZones.push(0);
      // Bottom band check
      if (screenBottom - excl.bottom > elemH + ampY * 2 + 10) validZones.push(1);
      // Left column check (desktop, or narrow items on phone)
      if (excl.left > elemW + ampX * 2 + 14) validZones.push(2);
      // Right column check (desktop, or narrow items on phone)
      if (vw - excl.right > elemW + ampX * 2 + 14) validZones.push(3);

      if (validZones.length === 0) {
        layer.removeChild(el);
        continue;
      }

      // Try candidate positions across the valid zones
      let placed = false;
      let chosenX = 0;
      let chosenY = 0;
      let chosenZone = 0;
      let chosenCandidateBox = null;

      // Try up to 40 random placements to find a collision-free spot
      const preferredZone = validZones[i % validZones.length];
      const searchZones = [preferredZone, ...validZones.filter(z => z !== preferredZone)];

      for (let zIdx = 0; zIdx < searchZones.length && !placed; zIdx++) {
        const zone = searchZones[zIdx];

        let minX = 0, maxX = 0, minY = 0, maxY = 0;

        if (zone === 0) {
          // Top band
          minY = navBottom + 6;
          maxY = Math.max(minY, excl.top - elemH - ampY - 8);
          minX = 12;
          maxX = Math.max(minX, vw - elemW - ampX - 12);
        } else if (zone === 1) {
          // Bottom band
          minY = excl.bottom + ampY + 8;
          maxY = Math.max(minY, screenBottom - elemH - ampY - 8);
          minX = isMobile ? badgeAvoidRadius : 18;
          maxX = Math.max(minX, vw - elemW - ampX - 18);
        } else if (zone === 2) {
          // Left column
          minX = 8;
          maxX = Math.max(minX, excl.left - elemW - ampX - 10);
          minY = Math.max(navBottom + 10, excl.top);
          maxY = Math.max(minY, excl.bottom - elemH);
        } else {
          // Right column
          minX = excl.right + ampX + 10;
          maxX = Math.max(minX, vw - elemW - ampX - 10);
          minY = Math.max(navBottom + 10, excl.top);
          maxY = Math.max(minY, excl.bottom - elemH);
        }

        if (maxX < minX || maxY < minY) continue;

        for (let attempt = 0; attempt < 35; attempt++) {
          const tryX = rand(minX, maxX);
          const tryY = rand(minY, maxY);

          // Bounding box with drift amplitude and safety buffer
          const candidate = {
            left: tryX - ampX - safetyBuffer,
            right: tryX + elemW + ampX + safetyBuffer,
            top: tryY - ampY - safetyBuffer,
            bottom: tryY + elemH + ampY + safetyBuffer
          };

          if (!isColliding(candidate, placedBoxes, excl)) {
            // Found a valid, completely non-overlapping position!
            placed = true;
            chosenX = tryX;
            chosenY = tryY;
            chosenZone = zone;
            chosenCandidateBox = candidate;
            break;
          }
        }
      }

      if (placed) {
        placedBoxes.push(chosenCandidateBox);
        const op = calcOpacity(size);

        items.push({
          el,
          baseX: chosenX,
          baseY: chosenY,
          w: elemW,
          h: elemH,
          zoneType: chosenZone,
          targetOp: op,
          curOp: 0,
          rotation,
          ampX,
          ampY,
          freqX: rand(0.0003, 0.00065),
          freqY: rand(0.0003, 0.0006),
          phase: rand(0, Math.PI * 2),
          parallax: isMobile ? 0 : (size > 2.0 ? rand(10, 18) : rand(3, 8)),
          revealed: false
        });
      } else {
        // No non-overlapping spot could be found: omit cleanly
        layer.removeChild(el);
      }
    }

    /* ── 2. Place Decorative Marks (Lines, Crosses, Dots) ── */
    const decorCount = isMobile ? 3 : 8;
    for (let d = 0; d < decorCount; d++) {
      const dType = d % 3;
      let del;

      if (dType === 0) {
        del = document.createElement('div');
        del.className = 'mag-line';
        del.style.width = rand(isMobile ? 22 : 35, isMobile ? 40 : 70) + 'px';
      } else if (dType === 1) {
        del = document.createElement('div');
        del.className = 'mag-cross';
      } else {
        del = document.createElement('div');
        del.className = 'mag-dot';
      }

      layer.appendChild(del);
      const dW = del.offsetWidth || 14;
      const dH = del.offsetHeight || 14;
      const ampX = 1.5;
      const ampY = 1.5;

      let placed = false;
      let chosenX = 0;
      let chosenY = 0;
      let chosenCandidate = null;

      for (let attempt = 0; attempt < 30; attempt++) {
        const zone = (attempt % 2 === 0) ? 0 : 1;
        let tryX = 0, tryY = 0;

        if (zone === 0) {
          tryY = rand(navBottom + 6, Math.max(navBottom + 8, excl.top - dH - 8));
          tryX = rand(15, vw - dW - 15);
        } else {
          tryY = rand(excl.bottom + 8, Math.max(excl.bottom + 10, screenBottom - dH - 12));
          tryX = rand(isMobile ? badgeAvoidRadius : 20, vw - dW - 20);
        }

        const candidate = {
          left: tryX - ampX - (isMobile ? 12 : 20),
          right: tryX + dW + ampX + (isMobile ? 12 : 20),
          top: tryY - ampY - (isMobile ? 12 : 20),
          bottom: tryY + dH + ampY + (isMobile ? 12 : 20)
        };

        if (!isColliding(candidate, placedBoxes, excl)) {
          placed = true;
          chosenX = tryX;
          chosenY = tryY;
          chosenCandidate = candidate;
          break;
        }
      }

      if (placed) {
        placedBoxes.push(chosenCandidate);
        const decorOp = isMobile ? rand(0.12, 0.16) : rand(0.14, 0.20);

        items.push({
          el: del,
          baseX: chosenX,
          baseY: chosenY,
          w: dW,
          h: dH,
          zoneType: (chosenY < excl.top ? 0 : 1),
          targetOp: decorOp,
          curOp: 0,
          rotation: 0,
          ampX,
          ampY,
          freqX: rand(0.0004, 0.0007),
          freqY: rand(0.0003, 0.00065),
          phase: rand(0, Math.PI * 2),
          parallax: 0,
          revealed: false
        });
      } else {
        layer.removeChild(del);
      }
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
      }, 25 + idx * 18);
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
   * Main 60 fps Animation Loop with boundary clamps
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
        it.curOp = Math.min(it.targetOp, it.curOp + 0.012);
      }

      if (reducedMotion) {
        it.el.style.opacity = it.curOp.toFixed(3);
        continue;
      }

      // Smooth drift
      const driftX = Math.sin(elapsed * it.freqX + it.phase) * it.ampX;
      const driftY = Math.cos(elapsed * it.freqY + it.phase) * it.ampY;

      // Parallax offset
      const px = lerped.x * it.parallax;
      const py = lerped.y * (it.parallax * 0.85);

      let x = it.baseX + driftX + px;
      let y = it.baseY + driftY + py;

      // Motion boundary clamp against headline
      if (it.zoneType === 0) {
        y = Math.min(y, excl.top - it.h - 4);
      } else if (it.zoneType === 1) {
        y = Math.max(y, excl.bottom + 4);
      } else if (it.zoneType === 2) {
        x = Math.min(x, excl.left - it.w - 4);
      } else if (it.zoneType === 3) {
        x = Math.max(x, excl.right + 4);
      }

      // Subtle rotation drift
      const rotWobble = Math.sin(elapsed * 0.0003 + it.phase) * 1.1;
      const totalRot = it.rotation + rotWobble;

      // Gentle breathing opacity
      const breathe = it.curOp * (0.94 + 0.06 * Math.sin(elapsed * 0.0009 + it.phase));

      it.el.style.opacity = breathe.toFixed(3);
      it.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${totalRot.toFixed(1)}deg)`;
    }

    rafId = requestAnimationFrame(tick);
  }

  /* ── Resize & Orientation Handler ── */
  let lastWidth = window.innerWidth;
  let resizeTimer;

  function onResize() {
    const currentWidth = window.innerWidth;
    // On mobile devices, scrolling vertically shows/hides the browser address bar,
    // which dispatches a window resize event. If width has not changed, ignore it
    // so typography cards never vanish or re-render during scroll.
    if (Math.abs(currentWidth - lastWidth) < 15) {
      return;
    }
    lastWidth = currentWidth;

    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      build();
    }, 250);
  }

  function onOrientationChange() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      lastWidth = window.innerWidth;
      build();
    }, 300);
  }

  /* ── Init ── */
  function init() {
    lastWidth = window.innerWidth;
    build();
    if (!reducedMotion) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onOrientationChange);
      rafId = requestAnimationFrame(tick);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
