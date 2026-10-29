# Magazine & Newsletter Team – Execom Call 26-27
### GOVT ENGINEERING COLLEGE WAYANAD · COLLEGE UNION 26-27

A production-quality, responsive, single-page recruitment website for the Magazine & Newsletter Team Executive Committee (Execom) of Govt Engineering College Wayanad (College Union 2026–27).

This website acts as a custom front-end for a Google Form: candidates experience an editorial UI with smooth transitions and floating cards, and their responses are automatically dispatched to the Google Form's `formResponse` endpoint.

---

## 🎨 Design & Experience Highlights

- **Hero Experience**: Warm cream aesthetic (`#EFEBE5`) with geometric sans typography (`Plus Jakarta Sans`), 28 floating magazine covers drifting continuously in two depth layers (blurred background vs sharp foreground) with cursor parallax lerp, fixed yellow circular shortcut badge, and clean navbar with search and language toggle.
- **Curtain Scroll Reveal**: Pinned hero transition where an editorial full-bleed panel (`assets/team.jpg`) slides upward as the user scrolls, featuring counter `01`, orange tag `Execom Call 26-27`, staggered mask headline reveals, CTA button, and catalog card.
- **Multi-Step Form Wizard**: 10-step wizard with smooth transitions, progress tracking, keyboard navigation (`Enter` to advance), custom accessible branch dropdown, single-select year cards, multi-select chips, segmented rating control, review summary, honeypot spam protection, double-submit guard, and animated success screen.
- **Accessibility & Performance**: Built with semantic HTML, full keyboard navigation, ARIA states, `prefers-reduced-motion` compliance, and smooth 60fps animations.

---

## 📁 Project Structure

```
├── index.html            # Main single-page application markup
├── config.js             # Google Form action URL and entry ID mappings
├── README.md             # Setup and deployment documentation
├── css/
│   ├── main.css          # CSS reset, typography, colors, and search modal
│   ├── hero.css          # Hero section, floating cards, yellow badge & navbar
│   ├── curtain.css       # Pinned scroll curtain transition & catalog card
│   ├── form.css          # Multi-step form wizard, chips, inputs, review card
│   └── responsive.css    # Breakpoints (360px-1920px) & reduced-motion rules
├── js/
│   ├── lenis-scroll.js   # Lenis smooth scroll + GSAP ticker sync + anchor scroll
│   ├── cards.js          # Floating image cards drift loop & parallax lerp
│   ├── curtain.js        # GSAP ScrollTrigger curtain slide-up reveal
│   ├── form.js           # Multi-step wizard, validation & Google Form submission
│   └── main.js           # App orchestration, search modal, language switcher
└── assets/
    ├── team.jpg          # Curtain section full-bleed editorial background
    └── floating/         # 30 magazine cover images (img1.jpg ... img30.jpg)
```

---

## ⚙️ Google Form Setup & Integration

The site submits candidate data directly to Google Forms via `fetch()` with `mode: "no-cors"`. Follow these steps to link your Google Form:

### Step 1: Create Your Google Form
Ensure your Google Form contains the following questions matching the form wizard:
1. **Full Name** (Short answer)
2. **Branch** (Dropdown or Short answer)
3. **Year of study** (Multiple choice)
4. **Contact Number** (Short answer)
5. **What are your skills?** (Checkboxes)
6. **Which software or apps are you familiar with?** (Checkboxes)
7. **How would you rate your skills?** (Multiple choice or Dropdown)
8. **Any other talents or skills you would like to mention?** (Paragraph)
9. **Declaration** (Checkboxes)

### Step 2: Retrieve the Form Action URL
1. Open your published Google Form (the public view link, e.g. `https://docs.google.com/forms/d/e/1FAIpQLSc_XXXXX/viewform`).
2. Replace `/viewform` at the end of the URL with `/formResponse`.
   Your action URL will look like:
   `https://docs.google.com/forms/d/e/1FAIpQLSc_XXXXX/formResponse`

### Step 3: Find the Entry IDs (`entry.XXXXXXXXXX`)
1. In the Google Form editor, click the **three vertical dots (⋮)** in the top right corner.
2. Select **"Get pre-filled link"**.
3. In the pre-filled view that opens, type unique placeholder values into each question:
   - Full Name: `TESTNAME`
   - Branch: select any option
   - Year: select any option
   - Phone: `9876543210`
   - Skills: select at least one checkbox
   - Software: select at least one checkbox
   - Rating: select any option
   - Other talents: `TESTTALENTS`
   - Declaration: check the box
4. Click **"Get link"** at the bottom, then click **"Copy Link"**.
5. Paste the copied link into a text editor. It will look like this:
   ```text
   https://docs.google.com/forms/d/e/1FAIpQLSc_XXXXX/viewform?usp=pp_url&entry.1045781292=TESTNAME&entry.2002638749=Computer+Science+%26+Engineering+(CSE)&entry.1065046570=Third+Year&entry.1166974658=9876543210&entry.839337160=Literary+Writing%2C+Proofreading+%26+Editing&entry.1453225298=Canva&entry.1982736451=Intermediate&entry.548291048=TESTTALENTS&entry.987123456=I+am+willing...
   ```
6. Extract each parameter name (`entry.1045781292`, `entry.2002638749`, etc.).

### Step 4: Configure `config.js`
Open `config.js` in your code editor and update the placeholders:

```javascript
const CONFIG = {
  // Paste your actual Google Form formResponse URL here
  FORM_ACTION_URL: "https://docs.google.com/forms/d/e/1FAIpQLSc_YOUR_REAL_FORM_ID/formResponse",

  // Map each field to its respective entry ID
  FIELDS: {
    fullName: "entry.1045781292",
    branch: "entry.2002638749",
    year: "entry.1065046570",
    phone: "entry.1166974658",
    skills: "entry.839337160",
    software: "entry.1453225298",
    rating: "entry.1982736451",
    otherTalents: "entry.548291048",
    declaration: "entry.987123456"
  }
};
```

> **Note on Checkboxes**: For questions with multiple selections (Skills, Software), `form.js` automatically appends the same entry key once for each checked item (`params.append(key, value)`), which Google Forms requires.

---

## 💻 Local Development & Testing

You can run the site locally using any lightweight HTTP static server:

### Using Python:
```bash
python -m http.server 8000
```
Then open your browser at `http://localhost:8000`.

### Using VS Code Live Server:
Right-click `index.html` and click **"Open with Live Server"**.

### Demo Mode:
While `config.js` contains the default placeholder `<FORM_ID>`, the site operates in **Demo Mode**. You can step through all questions and submit without network errors — the submission will be logged to your browser's developer console and display the success screen.

---

## 🚀 Deployment Guide

This project is completely static (HTML, CSS, JS) and requires no build step.

### Deploying to Netlify (Drag & Drop)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop the `MAGAZINE WEB` folder directly onto the browser window.
3. Your recruitment site is live in seconds! You can configure a custom subdomain (e.g. `gecw-magazine.netlify.app`).

### Deploying to GitHub Pages
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial release: GECW Magazine Execom Call 26-27"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. In your repository on GitHub, go to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
4. Select `main` and root folder `/` and click **Save**.
5. Your site will be published at `https://<your-username>.github.io/<repo-name>/`.

---

## 🛡️ Anti-Spam & Reliability Features
- **Honeypot Protection**: An invisible input field `company_website` detects automated bots and discards spurious submissions silently.
- **Double-Submit Guard**: The submission button is disabled and displays a loading spinner immediately upon submission.
- **Network Error State**: If a user is offline or experiences a network disconnection, an error banner with a "Retry Submission" button appears without clearing their entered data.

---

Govt Engineering College Wayanad · College Union 26-27 · Magazine & Newsletter Team

