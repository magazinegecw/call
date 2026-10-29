/**
 * MAIN INTERACTIVITY & APPLICATION ORCHESTRATION
 * GEC Wayanad College Union 26-27 Magazine & Newsletter Team Execom Call
 */

(function () {
  'use strict';

  function initApp() {
    setupContactModal();
    setupYellowApplyBadge();
    setupBackToTop();
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();

