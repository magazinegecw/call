# Beginner-Friendly Google Apps Script & Form Setup Guide
### GECW Magazine & Newsletter Team Recruitment

This guide walks you step-by-step through deploying your Apps Script backend, testing it with your temporary test form, and verifying the end-to-end integration before touching the live recruitment form.

---

## 1. Quick Overview of What We Configured

| Setting | Value / Details |
| :--- | :--- |
| **Temporary Test Form ID** | `1PqQN_XX-nTyYlaUIKjjbAIFoDXEorImZw_FHD0tSYxE` |
| **Google OAuth Client ID** | `744983244688-6d38pk46c339nfoheleq6hon93556gbt.apps.googleusercontent.com` |
| **Backend Script File** | [`apps-script/Code.gs`](./Code.gs) |
| **Frontend Config File** | [`config.js`](../config.js) |

---

## 2. Key Technical Points Addressed

### A. Rating Choice Mapping (`- Beginner` vs `Beginner`)
- On the website UI, the rating buttons store `"Beginner"`, `"Intermediate"`, and `"Advanced"`.
- Your Google Form uses hyphenated choices: `"- Beginner"`, `"- Intermediate"`, and `"- Advanced"`.
- In `Code.gs`, the function `getMatchingRatingChoice()` inspects the question's actual choices on the Google Form. If the Google Form has `"- Beginner"`, it automatically maps it to `"- Beginner"`. This ensures choice compatibility on both test and original forms.

### B. Reliable Duplicate Checking
- `Code.gs` checks past form submissions for the verified Google account email.
- We added `LockService.getScriptLock()` to prevent race conditions (such as double-clicking "Submit" or opening two tabs).
- If the duplicate check fails or encounters an error, **it does not silently allow the duplicate**. It informs the applicant to try again in a moment.
- *Limitation*: If you manually delete a response from the linked Google Sheet instead of the Google Form itself, `FormApp.getResponses()` still counts the response in the Form's database until deleted from the Form's Responses tab.

### C. Verified Email Recording
- In Google Forms, when "Collect email addresses: Verified" is enabled, Google's server only captures the email when a user submits through Google's own web form. The Google Apps Script `FormApp` API cannot set the native `respondentEmail` field directly.
- `Code.gs` looks for an **"Email Address"** question and records the verified email. If your test form does not have an "Email Address" question, `Code.gs` creates one automatically so no email is ever lost.

### D. Cross-Origin Communication (GitHub Pages -> Apps Script)
- When JavaScript on GitHub Pages sends data to Google Apps Script, the request must use `Content-Type: text/plain;charset=utf-8`.
- If `Content-Type: application/json` is used, the browser sends an HTTP `OPTIONS` preflight request. Google Apps Script **fails** all `OPTIONS` requests, causing an instant CORS error in the browser.
- Using `text/plain` sends the request directly. Google Apps Script answers with an HTTP `302` redirect to `script.googleusercontent.com`, which carries `Access-Control-Allow-Origin: *`. The browser follows the redirect and successfully reads `response.json()`.
- *Limitation*: Aggressive tracker blockers (such as Brave Shields in strict mode or custom uBlock Origin rules) can sometimes block requests to `script.google.com`.

---

## 3. Step-by-Step Deployment Instructions (For Beginners)

### Step 1: Open Google Apps Script
1. Open your browser and go to: [https://script.google.com/home](https://script.google.com/home).
2. Click **"+ New project"** (top left).
3. At the top left, click **"Untitled project"** and rename it to:
   `GECW Magazine Form Backend`

### Step 2: Paste the Code
1. In the code editor, delete any existing code inside `Code.gs`.
2. Open [`apps-script/Code.gs`](./Code.gs) in your project, copy all the code, and paste it into the Apps Script editor.
3. Click the **Save** icon (diskette icon) or press `Ctrl + S`.

### Step 3: Deploy as a Web App
1. In the top right corner of the Apps Script editor, click the blue **"Deploy"** button -> select **"New deployment"**.
2. Click the gear icon (**Select type**) on the left -> choose **"Web app"**.
3. Fill in the fields:
   - **Description**: `v1.1 Test Form Deployment`
   - **Execute as**: `Me (your Google account)`
   - **Who has access**: `Anyone` *(Crucial: allows applicants to submit without needing special Google Workspace permissions)*.
4. Click **"Deploy"**.
5. Google will ask you to authorize access:
   - Click **"Authorize access"**.
   - Select your Google account.
   - Click **"Advanced"** (in small text at the bottom).
   - Click **"Go to GECW Magazine Form Backend (unsafe)"**.
   - Click **"Allow"**.
6. Copy the **Web app URL** (it ends with `/exec`, e.g. `https://script.google.com/macros/s/AKfycb.../exec`).

### Step 4: Paste Web App URL into `config.js`
Open `config.js` in your local project:
```javascript
const CONFIG = {
  GOOGLE_CLIENT_ID: "744983244688-6d38pk46c339nfoheleq6hon93556gbt.apps.googleusercontent.com",

  // PASTE YOUR WEB APP URL HERE:
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/YOUR_DEPLOYED_URL_HERE/exec",
  ...
};
```
Save `config.js`.

### Step 5: Test in Your Browser (Local Test)
1. Open your project in a local server (e.g. using VS Code Live Server at `http://127.0.0.1:5500` or `http://localhost:5500`).
2. Make sure `http://localhost` and your local dev port are added under **Authorized JavaScript origins** in Google Cloud Console.
3. Scroll down to the **Application Form** section:
   - You will see the **"Sign in with Google to Apply"** button.
   - Click it and sign in with your Google account.
   - Notice the badge changes to: `✓ Verified Google Account` with your name and email.
   - Notice Step 1 (Full Name) is automatically filled with your Google account name.
4. Fill in the rest of the steps:
   - Step 2 (Branch): Select your branch.
   - Step 3 (Year): Select your year.
   - Step 4 (Phone): Enter a valid 10-digit mobile number (e.g. `9847123456`).
   - Step 5 (Skills): Select one or more skills.
   - Step 6 (Software): Select one or more tools.
   - Step 7 (Rating): Select Beginner, Intermediate, or Advanced.
   - Step 8 (Other Talents): Enter any text or leave blank.
   - Step 9 (Declaration): Click the checkbox.
   - Step 10 (Review): Check the summary (your verified Google email will be shown).
5. Click **"Submit Application"**.
6. Watch the button change to "Submitting..." and then reveal the animated success screen!
7. Open your test Google Form (`1PqQN_XX-nTyYlaUIKjjbAIFoDXEorImZw_FHD0tSYxE`) and click **Responses**:
   - Verify that your response appears with all answers mapped accurately.
   - Verify that your verified Google email appears in the "Email Address" field.
   - Verify that the rating is mapped correctly (e.g. `"- Intermediate"`).
8. **Test Duplicate Prevention**: Try submitting a second application using the same Google account. Verify that the form displays:
   `"An application has already been submitted using this Google account (...)"`.

---

## 4. What to Do After Testing Succeeds

Only after you have tested and verified the submission on the temporary test form:
1. Message me: *"Testing succeeded on the test form. Let's switch to the original form."*
2. We will change `FORM_ID` in `Code.gs` to your original recruitment form ID and update the deployment.
3. We will then guide you on publishing the final code to GitHub Pages.
