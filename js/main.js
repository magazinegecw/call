/**
 * MAIN INTERACTIVITY & APPLICATION ORCHESTRATION
 * GEC Wayanad College Union 26-27 Magazine & Newsletter Team Execom Call
 */

(function () {
  'use strict';

  function initApp() {
    setupSearchModal();
    setupContactModal();
    setupYellowApplyBadge();
    setupBackToTop();
    setupKeyboardShortcuts();
  }

  // -------------------------------------------------------------------------
  // SEARCH MODAL / QUICK INFO DIALOG
  // -------------------------------------------------------------------------
  function setupSearchModal() {
    const searchBtn = document.querySelector('.nav-search-btn');
    const modal = document.getElementById('search-info-modal');
    const closeBtn = document.querySelector('.modal-close-btn');

    if (!searchBtn || !modal) return;

    function openModal() {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      const searchInput = modal.querySelector('.modal-search-input');
      if (searchInput) {
        searchInput.value = '';
        setTimeout(() => searchInput.focus(), 100);
      }
    }

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    searchBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Simple instant filter in search modal
    const searchInput = modal.querySelector('.modal-search-input');
    const items = modal.querySelectorAll('.modal-result-item');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        items.forEach((item) => {
          const text = item.textContent.toLowerCase();
          item.style.display = text.includes(query) ? 'flex' : 'none';
        });
      });
    }

    // Escape closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  // -------------------------------------------------------------------------
  // CONTACT UNION MEMBERS MODAL
  // -------------------------------------------------------------------------
  function setupContactModal() {
    const triggers = document.querySelectorAll('.contact-trigger, a[href="#contact"]');
    const modal = document.getElementById('contact-modal');
    if (!modal) return;
    const closeBtn = modal.querySelector('.contact-modal-close-btn');

    function openModal(e) {
      if (e) e.preventDefault();
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    triggers.forEach((btn) => {
      btn.addEventListener('click', openModal);
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  // -------------------------------------------------------------------------
  // YELLOW APPLY BADGE & CURTAIN CTA SHORTCUTS
  // -------------------------------------------------------------------------
  function setupYellowApplyBadge() {
    const yellowBadge = document.querySelector('.floating-apply-badge');
    const heroApplyBtn = document.querySelector('.hero-apply-btn');
    const curtainApplyBtn = document.querySelector('.curtain-cta-btn');
    const catalogCard = document.querySelector('.curtain-catalog-card');

    function scrollToForm(e) {
      if (e) e.preventDefault();
      const applySection = document.getElementById('apply');
      if (applySection) {
        if (window.AppScroll) {
          window.AppScroll.scrollTo(applySection);
        } else {
          applySection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }

    if (yellowBadge) yellowBadge.addEventListener('click', scrollToForm);
    if (heroApplyBtn) heroApplyBtn.addEventListener('click', scrollToForm);
    if (curtainApplyBtn) curtainApplyBtn.addEventListener('click', scrollToForm);
    if (catalogCard) catalogCard.addEventListener('click', scrollToForm);
  }

  // -------------------------------------------------------------------------
  // BACK TO TOP BUTTON
  // -------------------------------------------------------------------------
  function setupBackToTop() {
    const btn = document.querySelector('.footer-back-to-top');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.AppScroll) {
        window.AppScroll.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // -------------------------------------------------------------------------
  // KEYBOARD ACCESSIBILITY HELPER
  // -------------------------------------------------------------------------
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K opens search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchBtn = document.querySelector('.nav-search-btn');
        if (searchBtn) searchBtn.click();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();

