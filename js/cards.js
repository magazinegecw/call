/**
 * HERO: MAGAZINE EDITORIAL TYPOGRAPHY WALL
 * Elegant editorial typography texture floating behind the hero headline.
 * Carefully balanced size & opacity for mobile and laptop to keep a clean,
 * modern magazine look with no harsh jumps or headline obstructions.
 */
(function () {
  'use strict';

  const layer = document.getElementById('floating-cards-layer');
  if (!layer) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch       = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ── Magazine Editorial Vocabulary ── */
  const WORDS = [
    // Grand editorial watermarks
    { t: 'EDITORIAL',   desktop: 4.2, mobile: 2.0, w: 800 },
    { t: 'NARRATIVE',   desktop: 3.8, mobile: 1.85, w: 800 },
    { t: 'TYPOGRAPHY',  desktop: 3.4, mobile: 1.75, w: 800 },
    { t: 'CHRONICLE',   desktop: 3.0, mobile: 1.65, w: 700 },
    { t: 'CULTURE',     desktop: 2.8, mobile: 1.55, w: 700 },
    { t: 'DESIGN',      desktop: 2.6, mobile: 1.5,  w: 700 },

    // Medium display terms
    { t: 'PRINT',       desktop: 2.4, mobile: 1.4,  w: 700 },
    { t: 'PRESS',       desktop: 2.2, mobile: 1.35, w: 700 },
    { t: 'GAZETTE',     desktop: 2.1, mobile: 1.3,  w: 700 },
    { t: 'HEADLINE',    desktop: 2.0, mobile: 1.3,  w: 700 },
    { t: 'PUBLISH',     desktop: 1.9, mobile: 1.25, w: 600 },
    { t: 'ARCHIVE',     desktop: 1.85, mobile: 1.2, w: 700 },
    { t: 'VISUAL',      desktop: 1.8, mobile: 1.2,  w: 600 },
    { t: 'FEATURE',     desktop: 1.75, mobile: 1.15, w: 700 },
    { t: 'SPREAD',      desktop: 1.65, mobile: 1.1,  w: 600 },
    { t: 'MONTAGE',     desktop: 1.55, mobile: 1.1,  w: 600 },

    // Fine editorial details & spot tags
    { t: 'INK',         desktop: 1.35, mobile: 1.0,  w: 700 },
    { t: 'STORY',       desktop: 1.3,  mobile: 0.95, w: 600 },
    { t: 'CRAFT',       desktop: 1.25, mobile: 0.95, w: 600 },
    { t: 'VOICE',       desktop: 1.2,  mobile: 0.9,  w: 600 },
    { t: 'DRAFT',       desktop: 1.15, mobile: 0.9,  w: 600 },
    { t: 'COVER',       desktop: 1.1,  mobile: 0.85, w: 600 },
    { t: 'LAYOUT',      desktop: 1.05, mobile: 0.85, w: 600 },
    { t: 'COLUMN',      desktop: 1.0,  mobile: 0.8,  w: 500 },
    { t: 'SERIF',       desktop: 0.95, mobile: 0.8,  w: 600 },
    { t: 'LENS',        desktop: 0.95, mobile: 0.8,  w: 600 },

    // Vertical rotated terms (editorial page gutter style)
    { t: 'EDITORIAL',   desktop: 2.1,  mobile: 1.35, w: 700, rot: -90 },
    { t: 'PRINT',       desktop: 1.7,  mobile: 1.2,  w: 700, rot: 90 },
    { t: 'DESIGN',      desktop: 1.8,  mobile: 1.25, w: 700, rot: -90 },
    { t: 'ARCHIVE',     desktop: 1.6,  mobile: 1.1,  w: 700, rot: 90 },

    // Monospaced masthead markers
    { t: 'VOL. 26',     desktop: 0.95, mobile: 0.75, w: 700, mono: true },
    { t: 'ISSUE 01',    desktop: 0.95, mobile: 0.75, w: 700, mono: true },
    { t: '26\u201427',  desktop: 0.9,  mobile: 0.75, w: 700, mono: true },
    { t: 'GECW',        desktop: 0.9,  mobile: 0.75, w: 800, mono: true },
    { t: 'EST. 1986',   desktop: 0.85, mobile: 0.7,  w: 700, mono: true }
  ];

  /* ── State variables ── */
  let items  = [];
  let mouse  = { x: 0, y: 0 };
  let lerped = { x: 0, y: 0 };
  let rafId  = null;
  let lastTs = 0;

  const rand = (a, b) => a + Math.random() * (b - a);

  /**
   * Balanced Opacity / Alpha calculation:
   * Raised slightly for clear visibility without overpowering the center content.
   */
  function calcOpacity(size) {
    if (size >= 3.0) return rand(0.08, 0.12);
    if (size >= 1.9) return rand(0.12, 0.18);
    if (size >= 1.2) return rand(0.17, 0.25);
    return rand(0.22, 0.32);
  }

  /**
   * Perimeter placement zones that strictly avoid the center headline
   * and the "Apply Now" button area.
   */
  function getZones(isMobile) {
    if (isMobile) {
      return [
        { xMin: 4,  xMax: 35, yMin: 5,  yMax: 18 },  // Top-left
        { xMin: 65, xMax: 96, yMin: 5,  yMax: 18 },  // Top-right
        { xMin: 30, xMax: 70, yMin: 3,  yMax: 14 },  // Top-center strip
        { xMin: 2,  xMax: 15, yMin: 22, yMax: 76 },  // Left margin column
        { xMin: 85, xMax: 98, yMin: 22, yMax: 76 },  // Right margin column
        { xMin: 4,  xMax: 35, yMin: 82, yMax: 95 },  // Bottom-left
        { xMin: 65, xMax: 96, yMin: 82, yMax: 95 },  // Bottom-right
        { xMin: 26, xMax: 74, yMin: 85, yMax: 97 }   // Bottom-center
      ];
    }
    return [
      { xMin: 3,  xMax: 26, yMin: 5,  yMax: 24 },   // Top-left
      { xMin: 74, xMax: 97, yMin: 5,  yMax: 24 },   // Top-right
      { xMin: 28, xMax: 72, yMin: 3,  yMax: 17 },   // Top-center
      { xMin: 2,  xMax: 18, yMin: 25, yMax: 76 },   // Left column
      { xMin: 82, xMax: 98, yMin: 25, yMax: 76 },   // Right column
      { xMin: 3,  xMax: 28, yMin: 78, yMax: 95 },   // Bottom-left
      { xMin: 72, xMax: 97, yMin: 78, yMax: 95 },   // Bottom-right
      { xMin: 26, xMax: 74, yMin: 82, yMax: 97 }    // Bottom-center
    ];
  }

  /**
   * Rebuild all floating typography elements
   */
  function build() {
    layer.innerHTML = '';
    items = [];

    const isMobile = window.innerWidth <= 768;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const zones = getZones(isMobile);

    const wordCount = isMobile ? 22 : WORDS.length;

    /* ── 1. Words ── */
    for (let i = 0; i < wordCount; i++) {
      const word = WORDS[i];
      const size = isMobile ? word.mobile : word.desktop;
      const rotation = word.rot || 0;

      const el = document.createElement('span');
      el.className = 'mag-word';
      if (word.mono) el.classList.add('mono');

      // Accent orange on select words
      if (i % 8 === 2) {
        el.classList.add('accent');
      } else if (i % 7 === 4) {
        el.classList.add('underlined');
      }

      el.textContent = word.t;
      el.style.fontSize = size + 'rem';
      el.style.fontWeight = word.w;

      const zone = zones[i % zones.length];
      const bx = (rand(zone.xMin, zone.xMax) / 100) * vw;
      const by = (rand(zone.yMin, zone.yMax) / 100) * vh;
      const op = calcOpacity(size);

      layer.appendChild(el);

      items.push({
        el: el,
        baseX: bx,
        baseY: by,
        targetOp: op,
        curOp: 0,
        rotation: rotation,
        ampX: rand(3, isMobile ? 7 : 12),
        ampY: rand(2, isMobile ? 6 : 10),
        freqX: rand(0.0003, 0.0007),
        freqY: rand(0.0003, 0.00065),
        phase: rand(0, Math.PI * 2),
        parallax: size > 2.5 ? rand(15, 26) : (size > 1.3 ? rand(8, 15) : rand(3, 8)),
        revealed: false
      });
    }

    /* ── 2. Editorial Decorative Marks (Lines, Crosses, Dots) ── */
    const decorCount = isMobile ? 6 : 12;
    for (let d = 0; d < decorCount; d++) {
      const dZone = zones[(wordCount + d) % zones.length];
      const dx = (rand(dZone.xMin, dZone.xMax) / 100) * vw;
      const dy = (rand(dZone.yMin, dZone.yMax) / 100) * vh;
      const dType = d % 3;
      let del;

      if (dType === 0) {
        del = document.createElement('div');
        del.className = 'mag-line';
        del.style.width = rand(isMobile ? 28 : 40, isMobile ? 55 : 95) + 'px';
      } else if (dType === 1) {
        del = document.createElement('div');
        del.className = 'mag-cross';
      } else {
        del = document.createElement('div');
        del.className = 'mag-dot';
      }

      layer.appendChild(del);

      const decorOp = isMobile ? rand(0.12, 0.18) : rand(0.14, 0.22);

      items.push({
        el: del,
        baseX: dx,
        baseY: dy,
        targetOp: decorOp,
        curOp: 0,
        rotation: 0,
        ampX: rand(2, 5),
        ampY: rand(1.5, 4),
        freqX: rand(0.0004, 0.0008),
        freqY: rand(0.0003, 0.00075),
        phase: rand(0, Math.PI * 2),
        parallax: rand(3, 8),
        revealed: false
      });
    }

    staggerReveal();
  }

  /**
   * Crisp staggered reveal
   */
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
      }, 35 + idx * 22);
    });
  }

  /* ── Mouse parallax handler ── */
  function onMouseMove(e) {
    if (isTouch || reducedMotion) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouse.x = (e.clientX - cx) / cx;
    mouse.y = (e.clientY - cy) / cy;
  }

  /* ── 60 fps Animation Loop ── */
  function tick(ts) {
    if (!lastTs) lastTs = ts;
    const elapsed = ts;

    if (!isTouch && !reducedMotion) {
      lerped.x += (mouse.x - lerped.x) * 0.05;
      lerped.y += (mouse.y - lerped.y) * 0.05;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.revealed) continue;

      // Smooth fade-in
      if (it.curOp < it.targetOp) {
        it.curOp = Math.min(it.targetOp, it.curOp + 0.008);
      }

      if (reducedMotion) {
        it.el.style.opacity = it.curOp.toFixed(3);
        continue;
      }

      // Drift calculation
      const driftX = Math.sin(elapsed * it.freqX + it.phase) * it.ampX;
      const driftY = Math.cos(elapsed * it.freqY + it.phase) * it.ampY;

      // Parallax
      const px = lerped.x * it.parallax;
      const py = lerped.y * (it.parallax * 0.85);

      const x = it.baseX + driftX + px;
      const y = it.baseY + driftY + py;

      // Subtle rotation drift
      const rotWobble = Math.sin(elapsed * 0.0003 + it.phase) * 1.3;
      const totalRot = it.rotation + rotWobble;

      // Gentle organic breathing
      const breathe = it.curOp * (0.93 + 0.07 * Math.sin(elapsed * 0.0009 + it.phase));

      it.el.style.opacity = breathe.toFixed(3);
      it.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${totalRot.toFixed(1)}deg)`;
    }

    rafId = requestAnimationFrame(tick);
  }

  /* ── Resize Debounce ── */
  let resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 250);
  }

  /* ── Init ── */
  function init() {
    build();
    if (!reducedMotion) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('resize', onResize);
      rafId = requestAnimationFrame(tick);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
