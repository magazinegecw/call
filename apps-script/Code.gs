/**
 * GOVT ENGINEERING COLLEGE WAYANAD - COLLEGE UNION 26-27
 * Magazine & Newsletter Team – Execom Recruitment
 * Google Apps Script Web App Backend (V1.2 - Verified Student Email Fix)
 *
 * Key Capabilities:
 * 1. Cryptographically verifies Google ID Token via Google's OAuth2 tokeninfo.
 * 2. Extracts trusted student email from the token (never trusts browser payload).
 * 3. Never substitutes owner or hardcoded email for the student's email.
 * 4. Explicitly maps student email into the "Email Address" question.
 * 5. Handles hyphenated/non-hyphenated rating choices dynamically.
 * 6. Enforces reliable duplicate check on the student's email using Script Lock.
 * 7. Returns clean CORS-friendly JSON to the GitHub Pages frontend.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

// Exact Google OAuth Web Client ID
const GOOGLE_CLIENT_ID = "744983244688-6d38pk46c339nfoheleq6hon93556gbt.apps.googleusercontent.com";

// Target Google Form ID:
// Currently set to your TEMPORARY TEST FORM ID.
// (Do not change this to your original form until you have tested end-to-end).
const FORM_ID = "1PqQN_XX-nTyYlaUIKjjbAIFoDXEorImZw_FHD0tSYxE";

// Duplicate Policy:
// Set to false to allow only ONE submission per verified student Google account.
// If an applicant tries to submit again, they receive a friendly duplicate notice.
const ALLOW_DUPLICATE_SUBMISSIONS = false;

// =============================================================================
// ALLOWED CHOICES (STRICT SERVER-SIDE VALIDATION)
// =============================================================================

const ALLOWED_BRANCHES = [
  "Electronics & Communication Engineering (ECE)",
  "Electrical & Electronics Engineering (EEE)",
  "Computer Science & Engineering (CSE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)"
];

const ALLOWED_YEARS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year"
];

// Handles both hyphenated ("- Beginner") and clean ("Beginner") ratings
const ALLOWED_RATINGS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "- Beginner",
  "- Intermediate",
  "- Advanced"
];

const ALLOWED_SKILLS = [
  "Literary Writing, Proofreading & Editing",
  "Magazine & Newsletter Design",
  "Graphic Design & Poster Making",
  "Photo & Video Editing",
  "Digital Drawing & Illustration",
  "Animation & Motion Graphics",
  "AR Development & Programming",
  "Willing to Learn"
];

const ALLOWED_SOFTWARE = [
  "Canva",
  "Adobe Creative Suite (Photoshop, Illustrator, InDesign, etc.)",
  "Picsart",
  "Snapseed",
  "CapCut",
  "VN Video Editor",
  "Premiere Pro",
  "After Effects",
  "Blender",
  "Unity",
  "AR Development Tools",
  "Digital Drawing Apps",
  "None yet, but willing to learn"
];

// =============================================================================
// WEB APP HTTP HANDLERS
// =============================================================================

/**
 * GET Handler: Health check endpoint.
 * Lets you verify the web app deployment in your browser by clicking its URL.
 */
function doGet(e) {
  return createJsonResponse({
    status: "ok",
    service: "GECW Magazine & Newsletter Recruitment Backend",
    formId: FORM_ID,
    timestamp: new Date().toISOString()
  });
}

/**
 * POST Handler: Main Form Submission endpoint.
 * Receives { idToken, formData } sent from GitHub Pages.
 */
function doPost(e) {
  // Use ScriptLock to prevent concurrent duplicate submissions (race conditions)
  const lock = LockService.getScriptLock();
  const lockAcquired = lock.tryLock(15000); // Wait up to 15 seconds

  if (!lockAcquired) {
    return createJsonResponse({
      status: "error",
      code: "SERVER_BUSY",
      message: "The server is currently processing another application. Please wait a few seconds and try again."
    });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: "error",
        code: "EMPTY_PAYLOAD",
        message: "No data received in request."
      });
    }

    // 1. Parse JSON payload
    let body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return createJsonResponse({
        status: "error",
        code: "INVALID_JSON",
        message: "Malformed JSON payload: " + parseErr.message
      });
    }

    const idToken = body.idToken;
    const formData = body.formData || {};

    if (!idToken) {
      return createJsonResponse({
        status: "error",
        code: "UNAUTHENTICATED",
        message: "Missing Google ID token. Please sign in with Google to apply."
      });
    }

    // 2. Verify Google ID token cryptographically with Google OAuth servers
    const tokenInfo = verifyGoogleIdToken(idToken);
    if (!tokenInfo.valid) {
      return createJsonResponse({
        status: "error",
        code: "TOKEN_VERIFICATION_FAILED",
        message: tokenInfo.error || "Google authentication verification failed. Please sign in again."
      });
    }

    // Extract student's verified email directly from Google's cryptographic token
    // (Never trusts browser-supplied email, never uses script owner's email)
    const verifiedStudentEmail = tokenInfo.email.toLowerCase().trim();

    // 3. Strict Server-Side Validation
    const validationError = validateFormData(formData);
    if (validationError) {
      return createJsonResponse({
        status: "error",
        code: "VALIDATION_ERROR",
        message: validationError
      });
    }

    // 4. Open Google Form
    let form;
    try {
      form = FormApp.openById(FORM_ID);
    } catch (formOpenErr) {
      console.error("Could not open Google Form:", formOpenErr);
      return createJsonResponse({
        status: "error",
        code: "FORM_OPEN_FAILED",
        message: "Could not open target Google Form. Verify FORM_ID is correct and script has permission: " + formOpenErr.message
      });
    }

    // 5. Enforce Duplicate Submission Policy against the student's verified email
    if (!ALLOW_DUPLICATE_SUBMISSIONS) {
      try {
        const isDuplicate = checkDuplicateSubmission(form, verifiedStudentEmail);
        if (isDuplicate) {
          return createJsonResponse({
            status: "error",
            code: "DUPLICATE_SUBMISSION",
            message: "An application has already been submitted using this Google account (" + verifiedStudentEmail + "). If you need to make changes, please contact the union team."
          });
        }
      } catch (dupCheckErr) {
        console.error("Duplicate check failed:", dupCheckErr);
        // Do not silently allow duplicates if the check threw an error
        return createJsonResponse({
          status: "error",
          code: "DUPLICATE_CHECK_FAILED",
          message: "Unable to verify prior submission status. Please try submitting again in a moment. (" + dupCheckErr.message + ")"
        });
      }
    }

    // 6. Map responses & submit to Google Form
    submitToGoogleForm(form, formData, verifiedStudentEmail);

    // 7. Success Response returning student's verified email
    return createJsonResponse({
      status: "success",
      email: verifiedStudentEmail,
      message: "Application submitted successfully!"
    });

  } catch (globalErr) {
    console.error("Fatal error in doPost:", globalErr);
    return createJsonResponse({
      status: "error",
      code: "SERVER_ERROR",
      message: "Server error occurred while processing application: " + globalErr.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

// =============================================================================
// TOKEN VERIFICATION
// =============================================================================

function verifyGoogleIdToken(idToken) {
  try {
    const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken);
    const response = UrlFetchApp.fetch(url, {
      method: "GET",
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      return { valid: false, error: "Google OAuth server rejected ID token (HTTP " + response.getResponseCode() + ")." };
    }

    const payload = JSON.parse(response.getContentText());

    // Audience Check (must match our exact Web Client ID)
    if (payload.aud !== GOOGLE_CLIENT_ID) {
      return { valid: false, error: "Audience mismatch in ID token." };
    }

    // Issuer Check
    const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
    if (!validIssuers.includes(payload.iss)) {
      return { valid: false, error: "Untrusted token issuer." };
    }

    // Expiration Check
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && Number(payload.exp) < nowInSeconds) {
      return { valid: false, error: "Google ID token has expired. Please sign in again." };
    }

    // Verified Email Check
    if (payload.email_verified !== "true" && payload.email_verified !== true) {
      return { valid: false, error: "Google account email is not verified." };
    }

    if (!payload.email) {
      return { valid: false, error: "No email address found in ID token." };
    }

    return {
      valid: true,
      email: payload.email,
      name: payload.name || "",
      picture: payload.picture || ""
    };
  } catch (err) {
    return { valid: false, error: "Token verification error: " + err.toString() };
  }
}

// =============================================================================
// STRICT SERVER-SIDE VALIDATION
// =============================================================================

function validateFormData(data) {
  // 1. Full Name
  if (!data.fullName || typeof data.fullName !== "string") {
    return "Please enter your official full name.";
  }
  const cleanName = data.fullName.trim();
  if (cleanName.length < 2 || cleanName.length > 100) {
    return "Full Name must be between 2 and 100 characters.";
  }

  // 2. Branch
  if (!data.branch || !ALLOWED_BRANCHES.includes(data.branch)) {
    return "Please select a valid branch from the options.";
  }

  // 3. Year of study
  if (!data.year || !ALLOWED_YEARS.includes(data.year)) {
    return "Please select a valid year of study.";
  }

  // 4. Contact Number (10-digit Indian mobile)
  const phoneClean = (data.phone || "").toString().replace(/[\s\-\+]/g, "");
  const phonePattern = /^(91)?([6-9]\d{9})$/;
  if (!phonePattern.test(phoneClean)) {
    return "Please enter a valid 10-digit Indian mobile number.";
  }

  // 5. Skills (Required, at least 1, must be in allowed list)
  if (!Array.isArray(data.skills) || data.skills.length === 0) {
    return "Please select at least one skill or role.";
  }
  for (let s = 0; s < data.skills.length; s++) {
    if (!ALLOWED_SKILLS.includes(data.skills[s])) {
      return "Invalid skill selected: " + data.skills[s];
    }
  }

  // 6. Software (Optional, but if selected, each must be in allowed list)
  if (Array.isArray(data.software) && data.software.length > 0) {
    for (let sw = 0; sw < data.software.length; sw++) {
      if (!ALLOWED_SOFTWARE.includes(data.software[sw])) {
        return "Invalid software choice: " + data.software[sw];
      }
    }
  }

  // 7. Rating
  if (!data.rating || !ALLOWED_RATINGS.includes(data.rating)) {
    return "Please select a valid skill proficiency rating.";
  }

  // 8. Other Talents (Optional string, max 2000 chars)
  if (data.otherTalents && typeof data.otherTalents === "string" && data.otherTalents.length > 2000) {
    return "Other talents text exceeds 2000 characters limit.";
  }

  // 9. Declaration (Required)
  const isDeclTrue = data.declaration === true || data.declaration === "true" ||
    (typeof data.declaration === "string" && data.declaration.toLowerCase().includes("willing"));
  if (!isDeclTrue) {
    return "You must confirm and accept the declaration to submit.";
  }

  return null; // Valid
}

// =============================================================================
// RELIABLE DUPLICATE SUBMISSION CHECK
// =============================================================================

function checkDuplicateSubmission(form, verifiedStudentEmail) {
  const targetEmail = verifiedStudentEmail.toLowerCase().trim();
  const responses = form.getResponses();

  for (let i = 0; i < responses.length; i++) {
    const resp = responses[i];

    // Check responses inside the dedicated "Email Address" question
    const itemResponses = resp.getItemResponses();
    for (let j = 0; j < itemResponses.length; j++) {
      const item = itemResponses[j].getItem();
      const title = item.getTitle().toLowerCase().trim();
      if (title === "email address" || title === "email" || title.includes("email")) {
        const val = (itemResponses[j].getResponse() || "").toString().toLowerCase().trim();
        if (val === targetEmail) {
          return true; // Found previous submission for this student email
        }
      }
    }
  }

  return false;
}

// =============================================================================
// FORM RESPONSE SUBMISSION ENGINE
// =============================================================================

function submitToGoogleForm(form, data, verifiedStudentEmail) {
  const formResponse = form.createResponse();
  const items = form.getItems();

  let emailMapped = false;
  let fullNameMapped = false;
  let branchMapped = false;
  let yearMapped = false;
  let phoneMapped = false;
  let skillsMapped = false;
  let softwareMapped = false;
  let ratingMapped = false;
  let otherTalentsMapped = false;
  let declarationMapped = false;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rawTitle = item.getTitle().trim();
    const title = rawTitle.toLowerCase();
    const type = item.getType();

    // 1. Dedicated Email Address Question (Target student's verified email)
    if (!emailMapped && (title === "email address" || title === "email" || title.includes("email") || title.includes("google account"))) {
      if (type === FormApp.ItemType.TEXT) {
        formResponse.withItemResponse(item.asTextItem().createResponse(verifiedStudentEmail));
        emailMapped = true;
        console.log("Successfully mapped student email (" + verifiedStudentEmail + ") to: " + rawTitle);
        continue;
      } else if (type === FormApp.ItemType.PARAGRAPH_TEXT) {
        formResponse.withItemResponse(item.asParagraphTextItem().createResponse(verifiedStudentEmail));
        emailMapped = true;
        console.log("Successfully mapped student email (" + verifiedStudentEmail + ") to paragraph: " + rawTitle);
        continue;
      }
    }

    // 2. Full Name
    if (!fullNameMapped && (title === "full name" || title.includes("name"))) {
      if (type === FormApp.ItemType.TEXT) {
        formResponse.withItemResponse(item.asTextItem().createResponse(data.fullName.trim()));
        fullNameMapped = true;
        continue;
      }
    }

    // 3. Branch
    if (!branchMapped && title.includes("branch")) {
      if (type === FormApp.ItemType.LIST) {
        formResponse.withItemResponse(item.asListItem().createResponse(data.branch));
        branchMapped = true;
        continue;
      } else if (type === FormApp.ItemType.MULTIPLE_CHOICE) {
        formResponse.withItemResponse(item.asMultipleChoiceItem().createResponse(data.branch));
        branchMapped = true;
        continue;
      } else if (type === FormApp.ItemType.TEXT) {
        formResponse.withItemResponse(item.asTextItem().createResponse(data.branch));
        branchMapped = true;
        continue;
      }
    }

    // 4. Year of Study
    if (!yearMapped && (title.includes("year") || title.includes("batch"))) {
      if (type === FormApp.ItemType.MULTIPLE_CHOICE) {
        formResponse.withItemResponse(item.asMultipleChoiceItem().createResponse(data.year));
        yearMapped = true;
        continue;
      } else if (type === FormApp.ItemType.LIST) {
        formResponse.withItemResponse(item.asListItem().createResponse(data.year));
        yearMapped = true;
        continue;
      } else if (type === FormApp.ItemType.TEXT) {
        formResponse.withItemResponse(item.asTextItem().createResponse(data.year));
        yearMapped = true;
        continue;
      }
    }

    // 5. Contact Number / Phone
    if (!phoneMapped && (title.includes("phone") || title.includes("contact") || title.includes("mobile") || title.includes("whatsapp"))) {
      if (type === FormApp.ItemType.TEXT) {
        formResponse.withItemResponse(item.asTextItem().createResponse(data.phone.toString().trim()));
        phoneMapped = true;
        continue;
      }
    }

    // 6. Skills (Checkboxes)
    if (!skillsMapped && (title.includes("skill") && !title.includes("rate") && !title.includes("other"))) {
      if (type === FormApp.ItemType.CHECKBOX) {
        const skillsList = Array.isArray(data.skills) ? data.skills : [data.skills];
        formResponse.withItemResponse(item.asCheckboxItem().createResponse(skillsList));
        skillsMapped = true;
        continue;
      }
    }

    // 7. Software (Checkboxes)
    if (!softwareMapped && (title.includes("software") || title.includes("app") || title.includes("tools"))) {
      if (type === FormApp.ItemType.CHECKBOX) {
        const swList = (Array.isArray(data.software) && data.software.length > 0)
          ? data.software
          : ["None yet, but willing to learn"];
        formResponse.withItemResponse(item.asCheckboxItem().createResponse(swList));
        softwareMapped = true;
        continue;
      }
    }

    // 8. Rating / Proficiency (Handles hyphenated "- Beginner" vs non-hyphenated "Beginner")
    if (!ratingMapped && (title.includes("rate") || title.includes("proficiency") || title.includes("level"))) {
      const mappedRating = getMatchingRatingChoice(item, data.rating);
      if (type === FormApp.ItemType.MULTIPLE_CHOICE) {
        formResponse.withItemResponse(item.asMultipleChoiceItem().createResponse(mappedRating));
        ratingMapped = true;
        continue;
      } else if (type === FormApp.ItemType.LIST) {
        formResponse.withItemResponse(item.asListItem().createResponse(mappedRating));
        ratingMapped = true;
        continue;
      } else if (type === FormApp.ItemType.TEXT) {
        formResponse.withItemResponse(item.asTextItem().createResponse(mappedRating));
        ratingMapped = true;
        continue;
      }
    }

    // 9. Other Talents / Comments
    if (!otherTalentsMapped && (title.includes("other") || title.includes("talent") || title.includes("mention"))) {
      if (type === FormApp.ItemType.PARAGRAPH_TEXT) {
        formResponse.withItemResponse(item.asParagraphTextItem().createResponse(data.otherTalents || "None"));
        otherTalentsMapped = true;
        continue;
      } else if (type === FormApp.ItemType.TEXT) {
        formResponse.withItemResponse(item.asTextItem().createResponse(data.otherTalents || "None"));
        otherTalentsMapped = true;
        continue;
      }
    }

    // 10. Declaration
    if (!declarationMapped && (title.includes("declaration") || title.includes("commit") || title.includes("willing"))) {
      if (type === FormApp.ItemType.CHECKBOX) {
        const choices = item.asCheckboxItem().getChoices();
        const choiceVal = (choices.length > 0) ? [choices[0].getValue()] : ["I Agree"];
        formResponse.withItemResponse(item.asCheckboxItem().createResponse(choiceVal));
        declarationMapped = true;
        continue;
      }
    }
  }

  // Safety Verification: Ensure email was mapped
  if (!emailMapped) {
    console.warn("WARNING: The Google Form does not have an 'Email Address' question. Attempting to add it dynamically.");
    try {
      const emailItem = form.addTextItem();
      emailItem.setTitle("Email Address");
      emailItem.setHelpText("Verified Google Account Email (Auto-recorded)");
      formResponse.withItemResponse(emailItem.createResponse(verifiedStudentEmail));
      emailMapped = true;
    } catch (addErr) {
      console.error("Could not append email item:", addErr);
    }
  }

  // Submit response directly into Google Form
  formResponse.submit();
}

/**
 * Dynamically resolves the rating choice to match the exact wording on the Google Form.
 * Supports "- Beginner", "Beginner", "- Intermediate", etc.
 */
function getMatchingRatingChoice(item, rawRating) {
  const clean = (rawRating || "").replace(/^[\-\s]+/, "").trim().toLowerCase();

  let choices = [];
  if (item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) {
    choices = item.asMultipleChoiceItem().getChoices();
  } else if (item.getType() === FormApp.ItemType.LIST) {
    choices = item.asListItem().getChoices();
  }

  for (let i = 0; i < choices.length; i++) {
    const val = choices[i].getValue();
    const valClean = val.replace(/^[\-\s]+/, "").trim().toLowerCase();
    if (valClean === clean) {
      return val; // Returns exact choice from form (e.g. "- Beginner")
    }
  }

  // If no choices match or item is plain text, format as "- Capitalized"
  const cap = clean.charAt(0).toUpperCase() + clean.slice(1);
  return "- " + cap;
}

// =============================================================================
// CORS & JSON RESPONSE HELPER
// =============================================================================

function createJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
