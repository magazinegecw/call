/**
 * SECTION 3: APPLICATION FORM (MULTI-STEP WIZARD)
 * Multi-step navigation, validation, keyboard support, honeypot,
 * double-submit guard, review summary, and Google Form submission.
 */

(function () {
  'use strict';

  // Wizard state
  let currentStep = 1;
  const totalSteps = 10; // Steps 1-9 are fields; Step 10 is Review & Submit
  let isSubmitting = false;

  const formData = {
    fullName: '',
    branch: '',
    year: '',
    phone: '',
    skills: [],
    software: [],
    rating: 'Intermediate', // default sensible rating
    otherTalents: '',
    declaration: false
  };

  // DOM Elements
  const wizardContainer = document.querySelector('.wizard-card');
  const progressBar = document.querySelector('.wizard-progress-bar');
  const stepBadge = document.querySelector('.wizard-step-badge');
  const stepTotal = document.querySelector('.wizard-step-total');
  const btnBack = document.querySelector('.btn-wizard-back');
  const btnNext = document.querySelector('.btn-wizard-next');
  const btnSubmit = document.querySelector('.btn-wizard-submit');
  const honeypot = document.querySelector('.honeypot-field');
  const successCard = document.querySelector('.submission-success-card');
  const errorBanner = document.querySelector('.submission-error-banner');
  const btnRetry = document.querySelector('.btn-retry');

  // Input & Control Elements
  const inputFullName = document.getElementById('field-fullname');
  const inputPhone = document.getElementById('field-phone');
  const inputOtherTalents = document.getElementById('field-other-talents');
  const declarationCard = document.getElementById('card-declaration');
  const declarationCheckbox = document.getElementById('field-declaration');

  // Custom Dropdown for Branch
  const branchDropdownWrap = document.querySelector('.custom-dropdown-wrap');
  const branchTrigger = document.querySelector('.dropdown-trigger');
  const branchTriggerText = document.querySelector('.dropdown-trigger-text');
  const branchMenuList = document.querySelector('.dropdown-menu-list');
  const branchOptions = document.querySelectorAll('.dropdown-option-item');

  // Year Cards
  const yearCards = document.querySelectorAll('.year-card-choice');

  // Chips: Skills & Software
  const skillChips = document.querySelectorAll('.chip-choice[data-group="skills"]');
  const softwareChips = document.querySelectorAll('.chip-choice[data-group="software"]');

  // Segmented Rating Buttons
  const ratingButtons = document.querySelectorAll('.segment-btn');

  // Initialize Wizard
  function initWizard() {
    setupBranchDropdown();
    setupYearCards();
    setupChips();
    setupRatingSegments();
    setupDeclaration();
    setupNavigation();
    setupKeyboard();
    setupRetry();
    // Do not auto-focus on initial load so the page remains in the Hero section
    updateStepView(currentStep, false);
  }

  // -------------------------------------------------------------------------
  // STEP 2: CUSTOM BRANCH DROPDOWN
  // -------------------------------------------------------------------------
  function setupBranchDropdown() {
    if (!branchTrigger || !branchMenuList) return;

    branchTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = branchMenuList.classList.contains('open');
      if (isOpen) closeBranchDropdown();
      else openBranchDropdown();
    });

    branchOptions.forEach((option) => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = option.getAttribute('data-value');
        const text = option.textContent.trim();

        formData.branch = value;
        branchTriggerText.textContent = text;
        branchTriggerText.style.color = 'var(--text-dark)';

        branchOptions.forEach((opt) => opt.classList.remove('selected'));
        option.classList.add('selected');
        closeBranchDropdown();
        clearFieldError(2);
      });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!branchDropdownWrap.contains(e.target)) {
        closeBranchDropdown();
      }
    });

    // Keyboard navigation for dropdown
    branchTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openBranchDropdown();
        const first = branchMenuList.querySelector('.dropdown-option-item');
        if (first) first.focus();
      }
    });
  }

  function openBranchDropdown() {
    branchMenuList.classList.add('open');
    branchTrigger.classList.add('open');
    branchTrigger.setAttribute('aria-expanded', 'true');
  }

  function closeBranchDropdown() {
    branchMenuList.classList.remove('open');
    branchTrigger.classList.remove('open');
    branchTrigger.setAttribute('aria-expanded', 'false');
  }

  // -------------------------------------------------------------------------
  // STEP 3: YEAR CARDS
  // -------------------------------------------------------------------------
  function setupYearCards() {
    yearCards.forEach((card) => {
      card.addEventListener('click', () => {
        const val = card.getAttribute('data-value');
        formData.year = val;

        yearCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');

        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;

        clearFieldError(3);
      });
    });
  }

  // -------------------------------------------------------------------------
  // STEP 5 & 6: CHIPS (SKILLS & SOFTWARE)
  // -------------------------------------------------------------------------
  function setupChips() {
    // Skills Chips (Required, Min 1)
    skillChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const value = chip.getAttribute('data-value');
        const checkbox = chip.querySelector('input[type="checkbox"]');
        const idx = formData.skills.indexOf(value);

        if (idx === -1) {
          formData.skills.push(value);
          chip.classList.add('selected');
          if (checkbox) checkbox.checked = true;
        } else {
          formData.skills.splice(idx, 1);
          chip.classList.remove('selected');
          if (checkbox) checkbox.checked = false;
        }

        if (formData.skills.length > 0) {
          clearFieldError(5);
        }
      });
    });

    // Software Chips (Optional)
    softwareChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const value = chip.getAttribute('data-value');
        const checkbox = chip.querySelector('input[type="checkbox"]');
        const isNone = value.toLowerCase().includes('none');

        if (isNone) {
          // If clicking "None yet", clear all other software chips
          formData.software = [value];
          softwareChips.forEach((c) => {
            c.classList.remove('selected');
            const cb = c.querySelector('input[type="checkbox"]');
            if (cb) cb.checked = false;
          });
          chip.classList.add('selected');
          if (checkbox) checkbox.checked = true;
          return;
        }

        // Remove "None yet" if user chooses another software
        const noneIdx = formData.software.findIndex((s) => s.toLowerCase().includes('none'));
        if (noneIdx !== -1) {
          formData.software.splice(noneIdx, 1);
          softwareChips.forEach((c) => {
            if (c.getAttribute('data-value').toLowerCase().includes('none')) {
              c.classList.remove('selected');
              const cb = c.querySelector('input[type="checkbox"]');
              if (cb) cb.checked = false;
            }
          });
        }

        const idx = formData.software.indexOf(value);
        if (idx === -1) {
          formData.software.push(value);
          chip.classList.add('selected');
          if (checkbox) checkbox.checked = true;
        } else {
          formData.software.splice(idx, 1);
          chip.classList.remove('selected');
          if (checkbox) checkbox.checked = false;
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // STEP 7: SEGMENTED RATING CONTROL
  // -------------------------------------------------------------------------
  function setupRatingSegments() {
    ratingButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-value');
        formData.rating = val;

        ratingButtons.forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        clearFieldError(7);
      });
    });
  }

  // -------------------------------------------------------------------------
  // STEP 9: DECLARATION CHECKBOX CARD
  // -------------------------------------------------------------------------
  function setupDeclaration() {
    if (!declarationCard || !declarationCheckbox) return;

    declarationCard.addEventListener('click', () => {
      formData.declaration = !formData.declaration;
      declarationCheckbox.checked = formData.declaration;

      if (formData.declaration) {
        declarationCard.classList.add('selected');
        clearFieldError(9);
      } else {
        declarationCard.classList.remove('selected');
      }
    });
  }

  // -------------------------------------------------------------------------
  // NAVIGATION & BUTTON HANDLERS
  // -------------------------------------------------------------------------
  function setupNavigation() {
    btnNext.addEventListener('click', () => {
      goToNextStep();
    });

    btnBack.addEventListener('click', () => {
      goToPrevStep();
    });

    btnSubmit.addEventListener('click', () => {
      handleFinalSubmission();
    });
  }

  function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      // If user is focused on the wizard card and presses Enter
      if (e.key === 'Enter') {
        const activeEl = document.activeElement;
        // Don't auto-advance on textarea Enter unless Ctrl+Enter or Cmd+Enter
        if (activeEl && activeEl.tagName === 'TEXTAREA') {
          if (!e.ctrlKey && !e.metaKey) return;
        }

        // If inside the wizard and not submitted
        if (wizardContainer && wizardContainer.contains(activeEl)) {
          e.preventDefault();
          if (currentStep < totalSteps) {
            goToNextStep();
          } else if (currentStep === totalSteps) {
            handleFinalSubmission();
          }
        }
      }
    });
  }

  function setupRetry() {
    if (btnRetry) {
      btnRetry.addEventListener('click', () => {
        errorBanner.classList.remove('visible');
        handleFinalSubmission();
      });
    }
  }

  // -------------------------------------------------------------------------
  // STEP VALIDATION
  // -------------------------------------------------------------------------
  function validateCurrentStep() {
    let isValid = true;

    if (currentStep === 1) {
      // Full Name (required, min 2 chars)
      const val = inputFullName ? inputFullName.value.trim() : '';
      formData.fullName = val;
      if (!val || val.length < 2) {
        showFieldError(1, 'Please enter your full name (at least 2 letters).');
        isValid = false;
      }
    } else if (currentStep === 2) {
      // Branch (required)
      if (!formData.branch) {
        showFieldError(2, 'Please select your branch of engineering.');
        isValid = false;
      }
    } else if (currentStep === 3) {
      // Year (required)
      if (!formData.year) {
        showFieldError(3, 'Please select your current year of study.');
        isValid = false;
      }
    } else if (currentStep === 4) {
      // Contact Number (Indian 10-digit mobile)
      const rawVal = inputPhone ? inputPhone.value.trim() : '';
      // Clean leading +91, spaces, hyphens
      const cleaned = rawVal.replace(/^(\+91|91|0)/, '').replace(/[\s\-()]/g, '');
      const indianPhoneRegex = /^[6-9]\d{9}$/;

      if (!cleaned || !indianPhoneRegex.test(cleaned)) {
        showFieldError(4, 'Please enter a valid 10-digit Indian mobile number (e.g., 9876543210).');
        isValid = false;
      } else {
        formData.phone = cleaned;
      }
    } else if (currentStep === 5) {
      // Skills (required, min 1)
      if (!formData.skills || formData.skills.length === 0) {
        showFieldError(5, 'Please select at least one skill or "Willing to Learn".');
        isValid = false;
      }
    } else if (currentStep === 6) {
      // Software (optional)
      // Automatically valid
      isValid = true;
    } else if (currentStep === 7) {
      // Rating (required)
      if (!formData.rating) {
        showFieldError(7, 'Please select your skill proficiency level.');
        isValid = false;
      }
    } else if (currentStep === 8) {
      // Other Talents (optional)
      formData.otherTalents = inputOtherTalents ? inputOtherTalents.value.trim() : '';
      isValid = true;
    } else if (currentStep === 9) {
      // Declaration (required)
      if (!formData.declaration) {
        showFieldError(9, 'Please agree to the declaration before continuing.');
        isValid = false;
      }
    }

    return isValid;
  }

  function showFieldError(stepNum, message) {
    const errorEl = document.querySelector(`.step-${stepNum} .field-error-msg`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
    const input = document.querySelector(`.step-${stepNum} .form-input-text`);
    if (input) {
      input.classList.add('has-error');
      input.focus();
    }
  }

  function clearFieldError(stepNum) {
    const errorEl = document.querySelector(`.step-${stepNum} .field-error-msg`);
    if (errorEl) {
      errorEl.classList.remove('visible');
    }
    const input = document.querySelector(`.step-${stepNum} .form-input-text`);
    if (input) {
      input.classList.remove('has-error');
    }
  }

  // -------------------------------------------------------------------------
  // STEP TRANSITIONS & VIEW UPDATES
  // -------------------------------------------------------------------------
  function goToNextStep() {
    if (!validateCurrentStep()) return;

    if (currentStep < totalSteps) {
      currentStep++;
      updateStepView(currentStep, true);
    }
  }

  function goToPrevStep() {
    if (currentStep > 1) {
      currentStep--;
      updateStepView(currentStep, true);
    }
  }

  function goToStep(stepNum) {
    if (stepNum >= 1 && stepNum <= totalSteps) {
      currentStep = stepNum;
      updateStepView(currentStep, true);
    }
  }

  function updateStepView(stepNum, shouldFocus = false) {
    // Hide all steps
    const allSteps = document.querySelectorAll('.wizard-step');
    allSteps.forEach((s) => s.classList.remove('active'));

    // Show target step
    const targetStep = document.querySelector(`.step-${stepNum}`);
    if (targetStep) {
      targetStep.classList.add('active');
    }

    // Update Progress Bar & Counters
    const progressPercent = Math.round((stepNum / totalSteps) * 100);
    if (progressBar) {
      progressBar.style.width = `${progressPercent}%`;
    }
    if (stepBadge) {
      stepBadge.textContent = stepNum === totalSteps ? 'Final Review' : `Step ${stepNum} of ${totalSteps}`;
    }
    if (stepTotal) {
      stepTotal.textContent = `${progressPercent}% Complete`;
    }

    // Toggle Back / Next / Submit buttons
    if (btnBack) {
      btnBack.disabled = (stepNum === 1);
    }

    if (stepNum === totalSteps) {
      // Step 10: Review Summary
      btnNext.style.display = 'none';
      btnSubmit.style.display = 'inline-flex';
      renderReviewSummary();
    } else {
      btnNext.style.display = 'inline-flex';
      btnSubmit.style.display = 'none';
    }

    // Auto-focus primary input for the step only when user is interacting
    if (shouldFocus) {
      setTimeout(() => {
        if (stepNum === 1 && inputFullName) inputFullName.focus({ preventScroll: true });
        else if (stepNum === 4 && inputPhone) inputPhone.focus({ preventScroll: true });
        else if (stepNum === 8 && inputOtherTalents) inputOtherTalents.focus({ preventScroll: true });
      }, 150);
    }
  }

  // -------------------------------------------------------------------------
  // RENDER REVIEW SUMMARY (STEP 10)
  // -------------------------------------------------------------------------
  function renderReviewSummary() {
    const summaryContainer = document.querySelector('.review-summary-card');
    if (!summaryContainer) return;

    const skillsText = formData.skills.length > 0 ? formData.skills.join(', ') : 'None selected';
    const softwareText = formData.software.length > 0 ? formData.software.join(', ') : 'None specified';
    const talentsText = formData.otherTalents ? formData.otherTalents : 'None';

    summaryContainer.innerHTML = `
      <div class="review-item">
        <span class="review-label">Full Name</span>
        <span class="review-value">${escapeHtml(formData.fullName)}</span>
        <button type="button" class="review-edit-btn" data-step="1">Edit</button>
      </div>
      <div class="review-item">
        <span class="review-label">Branch</span>
        <span class="review-value">${escapeHtml(formData.branch)}</span>
        <button type="button" class="review-edit-btn" data-step="2">Edit</button>
      </div>
      <div class="review-item">
        <span class="review-label">Year of Study</span>
        <span class="review-value">${escapeHtml(formData.year)}</span>
        <button type="button" class="review-edit-btn" data-step="3">Edit</button>
      </div>
      <div class="review-item">
        <span class="review-label">Phone</span>
        <span class="review-value">+91 ${escapeHtml(formData.phone)}</span>
        <button type="button" class="review-edit-btn" data-step="4">Edit</button>
      </div>
      <div class="review-item">
        <span class="review-label">Skills</span>
        <span class="review-value">${escapeHtml(skillsText)}</span>
        <button type="button" class="review-edit-btn" data-step="5">Edit</button>
      </div>
      <div class="review-item">
        <span class="review-label">Software</span>
        <span class="review-value">${escapeHtml(softwareText)}</span>
        <button type="button" class="review-edit-btn" data-step="6">Edit</button>
      </div>
      <div class="review-item">
        <span class="review-label">Proficiency</span>
        <span class="review-value">${escapeHtml(formData.rating)}</span>
        <button type="button" class="review-edit-btn" data-step="7">Edit</button>
      </div>
      <div class="review-item">
        <span class="review-label">Other Talents</span>
        <span class="review-value">${escapeHtml(talentsText)}</span>
        <button type="button" class="review-edit-btn" data-step="8">Edit</button>
      </div>
      <div class="review-item">
        <span class="review-label">Declaration</span>
        <span class="review-value" style="color: var(--success-green);">&#10003; Confirmed &amp; Signed</span>
        <button type="button" class="review-edit-btn" data-step="9">Edit</button>
      </div>
    `;

    // Attach edit buttons
    summaryContainer.querySelectorAll('.review-edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const stepNum = parseInt(btn.getAttribute('data-step'), 10);
        goToStep(stepNum);
      });
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // -------------------------------------------------------------------------
  // GOOGLE FORM SUBMISSION
  // -------------------------------------------------------------------------
  async function handleFinalSubmission() {
    // Double-submit guard
    if (isSubmitting) return;

    // Honeypot check (anti-bot)
    if (honeypot && honeypot.value.trim() !== '') {
      console.warn('Bot submission blocked via honeypot.');
      // Quietly simulate success without submitting
      showSuccessScreen();
      return;
    }

    isSubmitting = true;
    setSubmitLoading(true);
    if (errorBanner) errorBanner.classList.remove('visible');

    // Build URLSearchParams
    const params = new URLSearchParams();
    const F = CONFIG.FIELDS;

    params.append(F.fullName, formData.fullName);
    params.append(F.branch, formData.branch);
    params.append(F.year, formData.year);
    params.append(F.phone, formData.phone);

    // Multi-select: append same entry key once per selected value
    formData.skills.forEach((skill) => {
      params.append(F.skills, skill);
    });

    formData.software.forEach((sw) => {
      params.append(F.software, sw);
    });

    params.append(F.rating, formData.rating);

    if (formData.otherTalents) {
      params.append(F.otherTalents, formData.otherTalents);
    }

    if (formData.declaration) {
      params.append(
        F.declaration,
        'I am willing to contribute to the Magazine & Newsletter Team in a role that suits my skills and interests, and I am ready to learn, collaborate, and take responsibility for the tasks assigned to me.'
      );
    }

    // Check if placeholder Google Form URL is in use
    const isPlaceholderUrl = CONFIG.FORM_ACTION_URL.includes('<FORM_ID>');

    if (isPlaceholderUrl) {
      console.warn('Submission aborted: FORM_ACTION_URL in config.js still contains placeholder <FORM_ID>.');
      isSubmitting = false;
      setSubmitLoading(false);
      if (errorBanner) {
        const errText = errorBanner.querySelector('.error-text');
        if (errText) {
          errText.textContent = 'Google Form endpoint not configured. Please replace <FORM_ID> and field entry IDs in config.js.';
        }
        errorBanner.classList.add('visible');
      }
      return;
    }

    // Submit to real Google Form formResponse endpoint with mode: "no-cors"
    try {
      await fetch(CONFIG.FORM_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      // In no-cors mode, the promise resolves on HTTP completion
      isSubmitting = false;
      setSubmitLoading(false);
      showSuccessScreen();
    } catch (err) {
      console.error('Submission failed with network error:', err);
      isSubmitting = false;
      setSubmitLoading(false);
      if (errorBanner) {
        errorBanner.classList.add('visible');
      }
    }
  }

  function setSubmitLoading(loading) {
    if (!btnSubmit) return;
    if (loading) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `
        <svg class="spinner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        <span>Submitting...</span>
      `;
    } else {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `
        <span>Submit Application</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    }
  }

  function showSuccessScreen() {
    // Hide wizard body & footer, show success card
    const wizardBody = document.querySelector('.wizard-body');
    const wizardFooter = document.querySelector('.wizard-footer');
    const wizardHeader = document.querySelector('.wizard-card-header');

    if (wizardBody) wizardBody.style.display = 'none';
    if (wizardFooter) wizardFooter.style.display = 'none';
    if (wizardHeader) wizardHeader.style.display = 'none';

    if (successCard) {
      const applicantNameEl = successCard.querySelector('.applicant-name-slot');
      if (applicantNameEl) applicantNameEl.textContent = formData.fullName;
      successCard.classList.add('visible');
    }

    // Scroll to success card smoothly
    if (window.AppScroll) {
      window.AppScroll.scrollTo(wizardContainer);
    }
  }

  // Public reset method if user wants to submit another
  window.resetWizard = function () {
    currentStep = 1;
    isSubmitting = false;
    formData.fullName = '';
    formData.branch = '';
    formData.year = '';
    formData.phone = '';
    formData.skills = [];
    formData.software = [];
    formData.rating = 'Intermediate';
    formData.otherTalents = '';
    formData.declaration = false;

    // Reset inputs
    if (inputFullName) inputFullName.value = '';
    if (inputPhone) inputPhone.value = '';
    if (inputOtherTalents) inputOtherTalents.value = '';
    if (branchTriggerText) {
      branchTriggerText.textContent = 'Select your branch...';
      branchTriggerText.style.color = 'var(--text-muted)';
    }
    branchOptions.forEach((o) => o.classList.remove('selected'));
    yearCards.forEach((c) => c.classList.remove('selected'));
    skillChips.forEach((c) => {
      c.classList.remove('selected');
      const cb = c.querySelector('input[type="checkbox"]');
      if (cb) cb.checked = false;
    });
    softwareChips.forEach((c) => {
      c.classList.remove('selected');
      const cb = c.querySelector('input[type="checkbox"]');
      if (cb) cb.checked = false;
    });
    ratingButtons.forEach((b) => {
      b.classList.toggle('selected', b.getAttribute('data-value') === 'Intermediate');
    });
    if (declarationCard) declarationCard.classList.remove('selected');
    if (declarationCheckbox) declarationCheckbox.checked = false;

    // Restore views
    const wizardBody = document.querySelector('.wizard-body');
    const wizardFooter = document.querySelector('.wizard-footer');
    const wizardHeader = document.querySelector('.wizard-card-header');

    if (wizardBody) wizardBody.style.display = 'flex';
    if (wizardFooter) wizardFooter.style.display = 'flex';
    if (wizardHeader) wizardHeader.style.display = 'flex';
    if (successCard) successCard.classList.remove('visible');

    updateStepView(1);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWizard);
  } else {
    initWizard();
  }
})();

