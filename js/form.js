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

  // Google Identity State (Stored in memory only, never persisted to disk or storage)
  let googleIdToken = null;
  let googleUser = null;

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

  // Branch Cards
  const branchCards = document.querySelectorAll('.branch-card-choice');

  // Year Cards
  const yearCards = document.querySelectorAll('.year-card-choice');

  // Chips: Skills & Software
  const skillChips = document.querySelectorAll('.chip-choice[data-group="skills"]');
  const softwareChips = document.querySelectorAll('.chip-choice[data-group="software"]');

  // Segmented Rating Buttons
  const ratingButtons = document.querySelectorAll('.segment-btn');

  // Initialize Wizard
  function initWizard() {
    setupGoogleAuth();
    setupFormLock();
    setupBranchCards();
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
  // GOOGLE IDENTITY SERVICES (GIS) AUTHENTICATION
  // -------------------------------------------------------------------------
  function setupGoogleAuth() {
    const authBar = document.getElementById('google-auth-bar');
    const signinPrompt = document.getElementById('google-signin-prompt');
    const profileBadge = document.getElementById('google-profile-badge');
    const avatarEl = document.getElementById('google-user-avatar');
    const nameEl = document.getElementById('google-user-name');
    const emailEl = document.getElementById('google-user-email');
    const signoutBtn = document.getElementById('google-signout-btn');
    const btnWrap = document.getElementById('g-signin-btn-wrap');

    if (!authBar || !btnWrap) return;

    let retryCount = 0;
    function initGIS() {
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
        if (retryCount < 80) {
          retryCount++;
          setTimeout(initGIS, 150);
        }
        return;
      }

      if (!CONFIG.GOOGLE_CLIENT_ID) {
        console.warn('CONFIG.GOOGLE_CLIENT_ID is not configured.');
        return;
      }

      try {
        google.accounts.id.initialize({
          client_id: CONFIG.GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        google.accounts.id.renderButton(btnWrap, {
          theme: 'filled_black',
          size: 'medium',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 230
        });
      } catch (err) {
        console.warn('Error initializing Google Identity Services:', err);
      }
    }

    window.addEventListener('load', initGIS);

    function handleCredentialResponse(response) {
      if (!response || !response.credential) return;

      // Store raw ID token strictly in memory
      googleIdToken = response.credential;

      // Decode client payload strictly for immediate display
      // (Backend will independently and cryptographically verify with Google)
      try {
        const base64Url = googleIdToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        googleUser = JSON.parse(jsonPayload);
      } catch (e) {
        console.warn('Could not parse token payload for UI preview:', e);
        googleUser = { name: 'Google User', email: '', picture: '' };
      }

      // Update UI elements
      if (avatarEl) {
        if (googleUser && googleUser.picture) {
          avatarEl.src = googleUser.picture;
          avatarEl.style.display = 'block';
        } else {
          avatarEl.style.display = 'none';
        }
      }
      if (nameEl) nameEl.textContent = (googleUser && googleUser.name) ? googleUser.name : 'Applicant';
      if (emailEl) emailEl.textContent = (googleUser && googleUser.email) ? googleUser.email : '';

      if (signinPrompt) signinPrompt.style.display = 'none';
      if (profileBadge) profileBadge.style.display = 'flex';
      authBar.classList.remove('highlight-required');

      // Autofill full name if currently empty
      if (inputFullName && !inputFullName.value.trim() && googleUser && googleUser.name) {
        inputFullName.value = googleUser.name;
        formData.fullName = googleUser.name;
        clearFieldError(1);
      }

      // Unlock application form
      unlockForm();

      // If already on Review step, re-render to reflect signed-in account
      if (currentStep === 10) {
        renderReviewSummary();
      }
    }

    if (signoutBtn) {
      signoutBtn.addEventListener('click', () => {
        googleIdToken = null;
        googleUser = null;
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
          google.accounts.id.disableAutoSelect();
        }
        if (profileBadge) profileBadge.style.display = 'none';
        if (signinPrompt) signinPrompt.style.display = 'flex';
        // Re-lock application form
        lockForm();
        if (currentStep === 10) {
          renderReviewSummary();
        }
      });
    }

    initGIS();
  }

  // -------------------------------------------------------------------------
  // FORM LOCK (REQUIRE GOOGLE SIGN-IN TO ACCESS FILLING SECTION)
  // -------------------------------------------------------------------------
  function highlightAuthPrompt() {
    const authBar = document.getElementById('google-auth-bar');
    const lockCard = document.querySelector('.lock-notice-card');
    const alertEl = document.getElementById('google-prompt-alert');

    if (lockCard) {
      lockCard.classList.remove('shake');
      void lockCard.offsetWidth; // Force reflow
      lockCard.classList.add('shake');
      setTimeout(() => lockCard.classList.remove('shake'), 450);
    }

    if (alertEl) {
      alertEl.style.display = 'block';
    }

    if (authBar) {
      authBar.classList.remove('highlight-required');
      void authBar.offsetWidth; // Force reflow
      authBar.classList.add('highlight-required');
      authBar.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Focus Google Sign-in button wrapper if present
      const gBtnWrap = document.getElementById('g-signin-btn-wrap');
      if (gBtnWrap) {
        const btnIframe = gBtnWrap.querySelector('iframe');
        if (btnIframe) {
          try {
            btnIframe.focus();
          } catch (_) {}
        }
      }

      setTimeout(() => {
        authBar.classList.remove('highlight-required');
        if (alertEl) alertEl.style.display = 'none';
      }, 2500);
    }
  }

  function unlockForm() {
    const formEl = document.getElementById('recruitment-form');
    if (formEl) formEl.classList.remove('is-locked');
  }

  function lockForm() {
    const formEl = document.getElementById('recruitment-form');
    if (formEl) formEl.classList.add('is-locked');
  }

  function setupFormLock() {
    const lockOverlay = document.getElementById('form-lock-overlay');
    const lockBtn = document.getElementById('btn-lock-prompt');
    const formEl = document.getElementById('recruitment-form');

    function handleLockedTrigger(e) {
      if (!googleIdToken) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        highlightAuthPrompt();
      }
    }

    if (lockOverlay) {
      lockOverlay.addEventListener('click', handleLockedTrigger);
      lockOverlay.addEventListener('touchstart', handleLockedTrigger, { passive: false });
    }

    if (lockBtn) {
      lockBtn.addEventListener('click', handleLockedTrigger);
    }

    if (formEl) {
      // Intercept accidental keyboard focus or click underneath the overlay
      formEl.addEventListener('focusin', (e) => {
        if (!googleIdToken) {
          if (e.target && e.target.blur) e.target.blur();
          highlightAuthPrompt();
        }
      });
    }
  }

  // -------------------------------------------------------------------------
  // STEP 2: BRANCH OPTIONS
  // -------------------------------------------------------------------------
  function setupBranchCards() {
    branchCards.forEach((card) => {
      card.addEventListener('click', () => {
        const val = card.getAttribute('data-value');
        formData.branch = val;

        branchCards.forEach((c) => {
          c.classList.remove('selected');
          c.setAttribute('aria-checked', 'false');
          const radio = c.querySelector('input[type="radio"]');
          if (radio) radio.checked = false;
        });

        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;

        clearFieldError(2);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          card.click();
        }
      });
    });
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
          if (!googleIdToken) {
            highlightAuthPrompt();
            return;
          }
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
    if (!googleIdToken) {
      highlightAuthPrompt();
      return;
    }
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
        <span class="review-label">Google Account</span>
        <span class="review-value">${googleUser && googleUser.email ? `<span style="color: var(--success-green); font-weight: 700;">&#10003;</span> ${escapeHtml(googleUser.email)}` : `<span style="color: var(--error-red); font-weight: 600;">Not Signed In</span>`}</span>
        <button type="button" class="review-edit-btn" id="review-signin-btn">${googleIdToken ? 'Switch' : 'Sign In'}</button>
      </div>
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
        if (btn.id === 'review-signin-btn') {
          highlightAuthPrompt();
          return;
        }
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
  // GOOGLE FORM SUBMISSION VIA SECURE APPS SCRIPT BACKEND
  // -------------------------------------------------------------------------
  async function handleFinalSubmission() {
    // Double-submit guard
    if (isSubmitting) return;

    // Honeypot check (anti-bot)
    if (honeypot && honeypot.value.trim() !== '') {
      console.warn('Bot submission blocked via honeypot.');
      showSuccessScreen();
      return;
    }

    // Require Google Authentication before submitting
    if (!googleIdToken) {
      highlightAuthPrompt();
      if (errorBanner) {
        const errText = errorBanner.querySelector('.error-text');
        if (errText) {
          errText.textContent = 'Please sign in with your Google account before submitting your application.';
        }
        errorBanner.classList.add('visible');
      }
      return;
    }

    isSubmitting = true;
    setSubmitLoading(true);
    if (errorBanner) errorBanner.classList.remove('visible');

    // Check if Apps Script Web App URL is configured
    const isAppsScriptConfigured = CONFIG.APPS_SCRIPT_URL && !CONFIG.APPS_SCRIPT_URL.includes('<SCRIPT_ID>');

    if (!isAppsScriptConfigured) {
      console.warn('Submission aborted: APPS_SCRIPT_URL in config.js is not configured.');
      isSubmitting = false;
      setSubmitLoading(false);
      if (errorBanner) {
        const errText = errorBanner.querySelector('.error-text');
        if (errText) {
          errText.textContent = 'Apps Script backend is not configured yet. Deploy Code.gs and update APPS_SCRIPT_URL in config.js.';
        }
        errorBanner.classList.add('visible');
      }
      return;
    }

    try {
      const payload = {
        idToken: googleIdToken,
        formData: {
          fullName: formData.fullName,
          branch: formData.branch,
          year: formData.year,
          phone: formData.phone,
          skills: formData.skills,
          software: formData.software,
          rating: formData.rating,
          otherTalents: formData.otherTalents,
          declaration: formData.declaration
        }
      };

      // POST to Google Apps Script Web App
      // Notice: Content-Type is 'text/plain;charset=utf-8' to prevent preflight CORS OPTIONS failure
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result && result.status === 'success') {
        isSubmitting = false;
        setSubmitLoading(false);
        showSuccessScreen();
      } else {
        const errMsg = (result && result.message) ? result.message : 'Submission was rejected by the server.';
        throw new Error(errMsg);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      isSubmitting = false;
      setSubmitLoading(false);
      if (errorBanner) {
        const errText = errorBanner.querySelector('.error-text');
        if (errText) {
          errText.textContent = err.message || 'Submission failed. Please check your internet connection and try again.';
        }
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
    // Hide wizard body, footer, header & auth bar; show success card
    const wizardBody = document.querySelector('.wizard-body');
    const wizardFooter = document.querySelector('.wizard-footer');
    const wizardHeader = document.querySelector('.wizard-card-header');
    const authBar = document.getElementById('google-auth-bar');

    if (wizardBody) wizardBody.style.display = 'none';
    if (wizardFooter) wizardFooter.style.display = 'none';
    if (wizardHeader) wizardHeader.style.display = 'none';
    if (authBar) authBar.style.display = 'none';

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
    branchCards.forEach((c) => {
      c.classList.remove('selected');
      c.setAttribute('aria-checked', 'false');
      const radio = c.querySelector('input[type="radio"]');
      if (radio) radio.checked = false;
    });
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
    const authBar = document.getElementById('google-auth-bar');

    if (wizardBody) wizardBody.style.display = 'flex';
    if (wizardFooter) wizardFooter.style.display = 'flex';
    if (wizardHeader) wizardHeader.style.display = 'flex';
    if (authBar) authBar.style.display = '';
    if (successCard) successCard.classList.remove('visible');

    if (googleIdToken) {
      unlockForm();
      if (inputFullName && googleUser && googleUser.name) {
        inputFullName.value = googleUser.name;
        formData.fullName = googleUser.name;
      }
    } else {
      lockForm();
    }

    updateStepView(1);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWizard);
  } else {
    initWizard();
  }
})();

