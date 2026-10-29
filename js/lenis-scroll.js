/**
 * LENIS SMOOTH SCROLL INTEGRATION
 * Handles smooth scrolling and synchronization with GSAP ScrollTrigger
 */

(function () {
  'use strict';

  // Prevent browser from auto-scrolling to past positions on reload
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Ensure initial load stays at the hero section if no hash is set
  if (!window.location.hash || window.location.hash === '#hero') {
    window.scrollTo(0, 0);
  }

  let lenisInstance = null;

  function initLenis() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      console.log('Reduced motion preferred: Lenis smooth scroll disabled.');
      setupAnchorScrollNative();
      return;
    }

    if (typeof Lenis !== 'undefined') {
      lenisInstance = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        infinite: false
      });

      // Synchronize with GSAP ScrollTrigger if present
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        lenisInstance.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
          lenisInstance.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
      } else {
        // Fallback requestAnimationFrame loop
        function raf(time) {
          lenisInstance.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      }

      setupAnchorScrollWithLenis();
    } else {
      console.warn('Lenis library not detected from CDN. Using browser native smooth scrolling.');
      setupAnchorScrollNative();
    }
  }

  function setupAnchorScrollWithLenis() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        // Do not scroll for contact modal triggers
        if (this.classList.contains('contact-trigger') || targetId === '#contact') {
          return;
        }
        if (targetId && targetId !== '#') {
          const targetEl = document.querySelector(targetId);
          if (targetEl && lenisInstance) {
            e.preventDefault();
            lenisInstance.scrollTo(targetEl, {
              offset: 0,
              duration: 1.4,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });
          }
        }
      });
    });
  }

  function setupAnchorScrollNative() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        // Do not scroll for contact modal triggers
        if (this.classList.contains('contact-trigger') || targetId === '#contact') {
          return;
        }
        if (targetId && targetId !== '#') {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  // Expose helper globally
  window.AppScroll = {
    scrollTo: function (target, options) {
      if (lenisInstance) {
        lenisInstance.scrollTo(target, options);
      } else {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    getLenis: function () {
      return lenisInstance;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLenis);
  } else {
    initLenis();
  }
})();

