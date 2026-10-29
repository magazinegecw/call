/**
 * GOVT ENGINEERING COLLEGE WAYANAD - COLLEGE UNION 26-27
 * Magazine & Newsletter Team – Execom Call
 * Google Form Integration Configuration
 */

const CONFIG = {
  // Google OAuth 2.0 Web Client ID
  GOOGLE_CLIENT_ID: "744983244688-6d38pk46c339nfoheleq6hon93556gbt.apps.googleusercontent.com",

  // Google Apps Script Web App Deployment URL
  // Replace with your deployed Web App URL (e.g. "https://script.google.com/macros/s/AKfycbx.../exec")
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxLoTAa-GdgBl28oTnYFuHqwd_TN0L7zccCEwqm-NnKOwBGXcUSCsYkN2BwiJkJhU6C/exec",

  // Fallback direct Google Form action URL (legacy / backup)
  FORM_ACTION_URL: "https://docs.google.com/forms/d/e/<FORM_ID>/formResponse",

  // Field Entry IDs from your Google Form (entry.XXXXXXXXXX)
  // See README.md for instructions on how to find each entry ID using the "Get pre-filled link" method.
  FIELDS: {
    fullName: "entry.1000000001",      // TODO: Replace with your Google Form entry ID for Full Name
    branch: "entry.1000000002",        // TODO: Replace with your Google Form entry ID for Branch
    year: "entry.1000000003",          // TODO: Replace with your Google Form entry ID for Year of study
    phone: "entry.1000000004",         // TODO: Replace with your Google Form entry ID for Contact Number
    skills: "entry.1000000005",        // TODO: Replace with your Google Form entry ID for Skills (multi-select)
    software: "entry.1000000006",      // TODO: Replace with your Google Form entry ID for Familiar Software (multi-select)
    rating: "entry.1000000007",        // TODO: Replace with your Google Form entry ID for Skill Rating
    otherTalents: "entry.1000000008",  // TODO: Replace with your Google Form entry ID for Other Talents
    declaration: "entry.1000000009"    // TODO: Replace with your Google Form entry ID for Declaration
  },

  // Metadata
  METADATA: {
    college: "Govt Engineering College Wayanad",
    union: "College Union 26-27",
    wing: "Magazine & Newsletter Team",
    edition: "Execom Call 26-27"
  }
};

// Export for module environments if needed
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}

