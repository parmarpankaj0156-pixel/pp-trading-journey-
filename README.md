# PP Trading Journey — Version 2.0

**Premium pearl-white glass trading journal · GitHub Pages ready**

## What changed in v2

- Cleaner dashboard and short landing page with stronger text contrast and brighter glass accents.
- Only **five main sidebar destinations**: Overview, Journal, Accounts, Insights, Tools. Existing subpages remain accessible as tabs.
- Green segments for profitable chart movement, red for losing movement.
- **Quick Add Trade** shows account, profit/loss choice, gross P&L, broker fees, date/time, entry type; other inputs are inside **+ More options**, all optional.
- **Automatic weekly, monthly and yearly performance certificates**, plus an archive for completed periods.
- Daily certificate is **manual/optional**. Each certificate has the profile name, PP branding, performance-based message, actual stats, and a blurred performance chart across its background.
- Certificate **Download PNG** exports a 1600×900 image.
- Existing account, funded challenge, payout, risk, note, screenshot, export/import and (when configured) Supabase authentication features remain.

### Existing GitHub site: replace files safely

1. If your browser demo already contains important trades, open **Settings → Export backup** first.
2. If your GitHub site's `js/config.js` already contains real Supabase URL / public key, **keep those existing values**. The ZIP provides blank template values for new installations.
3. Extract the ZIP, and upload **the files and folders INSIDE the extracted folder** to your existing GitHub repository, on the `main` branch. Replace files with matching names; do not put the extracted folder itself inside the repository.
4. Confirm `index.html`, `styles.css`, **`styles-v2.css`**, `js/` and `assets/` are at the root. Commit.
5. Your existing GitHub Pages link stays the same. Hard-refresh with **Ctrl+Shift+R** after deployment.
6. Because the demo localStorage key and data schema are retained, existing demo data on the **same website origin** should still load; use the backup if you changed the domain or browser.

**Note:** These certificates are generated from recorded trades when the page is opened or refreshed; they do not require an always-running background server. Current incomplete periods are labeled *Live preview*. Completed periods with trades automatically appear in the archive.

**IMPORTANT:** GitHub Pages is public static hosting. Real login/signup and private cloud storage still require you to configure Supabase as described below. Publishing this ZIP alone will not enable private accounts.

---

# Original setup instructions

**A premium glassmorphism trading journal — ready for GitHub Pages.**

PP Trading Journey is a responsive, pearl-white personal trading workspace with glass cards, custom animated SVG charts, a funded-account tracker, searchable trade history, calendar, analytics, mood journaling, goals, payouts, risk calculator, and optional real email/password authentication with private cloud sync.

**No build tools, npm, React, paid hosting, or deployment pipeline are required.** Every file is plain HTML, CSS, SVG, or JavaScript; the site deploys directly from a GitHub repository.

## ▶ Try immediately (no login setup required)

1. Download and unzip the project.
2. Run a small local static server inside the project folder:

   ```bash
   python -m http.server 8000
   ```

3. Open http://localhost:8000 in a browser.
4. Click **Explore demo**. All sections are interactive. Demo edits save in **this browser's localStorage**, and can be exported/imported as JSON.

> Opening `index.html` by double-clicking may not work because browser security prevents ES modules from loading via `file://`. Use a local server or publish on GitHub Pages.

## 🚀 Deploy to GitHub Pages

1. Create a **new public GitHub repository** (for example `pp-trading-journey`).
2. Upload **the contents of this folder**, keeping `index.html`, `styles.css`, `js`, `assets`, and `supabase` at the **repository root**. Do not upload them inside an extra parent directory.
3. Commit the files to the `main` branch.
4. Go to **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
5. Choose **Branch: `main`**, Folder: **`/(root)`**, then **Save**.
6. After publication, your site will be at `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

The demo works immediately. For real accounts and syncing, complete the next section.

## 🔐 Enable REAL login / signup and private cloud data (Supabase)

GitHub Pages only hosts static files. **It cannot securely store user accounts or sync private journal data by itself.** For this, the project includes an optional Supabase backend with actual authentication, row-level security (RLS), and private screenshot storage.

### Step A — Create backend

1. Go to [supabase.com](https://supabase.com), create a project, and keep its database password private.
2. In the Supabase dashboard, open **SQL Editor**, paste the full contents of `supabase/schema.sql`, and **Run**. This creates `public.user_workspaces`, enables per-user RLS policies, and creates private storage bucket `trade-screenshots`.
3. Open **Authentication → Providers → Email** and enable email/password authentication. Choose whether new accounts must confirm their email.
4. Under **Authentication → URL Configuration**, set **Site URL** to your final website (for example `https://YOUR-USERNAME.github.io/YOUR-REPO/`). Add the same URL under **Redirect URLs** for password reset and email flows. For local testing, optionally add `http://localhost:8000/`.

### Step B — Connect frontend

1. In Supabase open **Project Settings → API Keys** (or the equivalent Connect / API settings in the current dashboard).
2. Copy the **Project URL** and the **publishable/anon key**.
3. Open `js/config.js` in your GitHub repository and change:

   ```js
   export const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
   export const SUPABASE_ANON_KEY = 'YOUR-PUBLISHABLE-KEY';
   ```

4. Commit. GitHub Pages publishes the new files. The login and signup forms now use real Supabase accounts.

**Security:** The public/publishable Supabase key is designed to be used in frontend applications when RLS is correctly configured. **Never put `service_role`, secret API keys, a database password, or any private token in `js/config.js` or GitHub.** Test a new account after applying the SQL policies. The SQL must be applied before storing private data.

### Data mode differences

| | Interactive demo | Cloud account |
|---|---|---|
| Login required | No | Yes, real email/password |
| Sample trades | Yes | No, starts empty |
| Data saved | Browser localStorage | Private Supabase workspace |
| Syncs between devices | No | Yes, after sign-in |
| Trade screenshots | Optimized JPEG stored locally | Private Supabase Storage with signed URLs |
| Export/import JSON | Yes | Yes |

**Demo records are not automatically moved into a cloud account.** To move your own demo entries, export JSON in Demo Settings, sign in to your cloud account, then import the backup in Settings. Import replaces the currently loaded workspace.

## ✨ Features included

| Screen | Features |
|---|---|
| Landing | Premium English hero, dashboard preview, feature highlights, login/signup buttons |
| Authentication | Real email login/signup (once Supabase is connected), forgot/reset password |
| Dashboard | Glass hero, net P&L, win rate, weekly results, profit factor, animated equity curve, account snapshot, recent trades, mini calendar |
| Add trade | Date, account, instrument, long/short, session, setup, realized P&L, risk, R:R, entry/exit/SL/TP, fees, mood, plan adherence, notes, chart screenshot |
| Trade history | Account-specific table, live search, outcome filters, detailed trade view, edit/delete |
| Accounts | Indian / Forex / Funded, 1-step / 2-step / Instant funded plans, configurable targets and limits, phase promotion and locks |
| Trading calendar | Monthly P&L heatmap, daily trade detail, previous/next month |
| Analytics | Equity curve, trade setup/symbol/session results, win/loss breakdown |
| Performance | Plan adherence, emotional-loss insights, best trades, execution review |
| Daily journal | Add, edit, delete reflections and moods |
| Goals & habits | Create goals, track progress, complete small daily habits |
| Withdrawals | Record payouts, statuses, notes, edit/delete |
| Risk calculator | Risk amount, position units, estimated lots, R:R and profit potential |
| Settings | Name, compact view, hide balances, JSON backup/import, demo reset, sign out |

### Important behavior of funded challenges

- A 2-step account starts in **Phase 1 → Phase 2 → Funded**. A 1-step account starts in Phase 1 then goes to Funded. An Instant account starts Funded.
- When a profit target is reached or a loss rule is breached, **new trade entry is locked** for that account. Existing trades remain accessible for reviews and edits.
- A passed phase can be advanced from the account card/detail. Each phase keeps its own trades and recalculates from a fresh stage P&L, rather than counting Phase 1 profits toward Phase 2.
- Challenge thresholds use **realized closed-trade P&L**. These calculations **do not** monitor floating/unrealized losses, trailing drawdown, intraday equity, consistency requirements, or other proprietary prop-firm rules. Compare the exact rules supplied by your firm manually before relying on a status.
- The application is **not linked to any broker** and does not place orders or import actual executions automatically.
- Trading and performance analysis is for personal recordkeeping, not financial advice.

### Important behavior of the risk calculator

Results are **estimates**. Position unit/lot calculations assume quoted price movement is in the account currency; default contract multiplier is `100000`, suited to the standard FX-lot convention for some USD-quoted instruments. **XAUUSD, indices, INR contracts, and other assets require their actual contract multipliers and currency conversions**. Fees, margin, slippage, and spread are excluded.

## 🎨 Customize branding and appearance

- **Brand name / landing English copy:** `js/views.js` (`landing`, `authView`).
- **Logo:** `assets/pp-logo.svg` — replace with your own SVG (keep the same filename), or update the path in `js/icons.js`.
- **Colors, glass, blur, typography, responsive rules:** `styles.css` (`:root`).
- **Starter demo data:** `js/data.js` (`demoWorkspace`).
- **App features / UI:** `js/views.js`.
- **Trade and form interactions, autosave:** `js/app.js`.
- **Account and chart calculations:** `js/data.js`, `js/charts.js`.
- **Auth and cloud storage calls:** `js/auth.js`, `js/config.js`.

Fonts are delivered from Google Fonts with a system-font fallback. All charts are custom SVG and work without a charting CDN.

## 🧪 Run a simple offline smoke test

With Node.js 20+ installed:

```bash
node tests/smoke.mjs
```

This tests demo fixture data, funded stage logic and rendering of main screens. It does not create a real Supabase account.

## 📂 Directory structure

```text
pp-trading-journey/
├── index.html               Website entry point
├── styles.css               Complete responsive design system
├── assets/
│   ├── pp-logo.svg
│   └── favicon.svg
├── js/
│   ├── app.js               Interactions, actions, local/cloud save
│   ├── auth.js              Supabase REST authentication and storage
│   ├── config.js            Set Supabase public URL and key here
│   ├── charts.js            Animated equity SVG, calendar, donuts, bars
│   ├── data.js              Trade/account models and demo data
│   ├── icons.js             Self-contained SVG icon set and brand
│   ├── utils.js             Helpers and exports
│   └── views.js             All pages, cards, tables, forms and modals
├── supabase/
│   └── schema.sql           Private workspace + screenshot RLS policies
├── tests/
│   └── smoke.mjs            Dependency-free rendering/logic checks
├── .nojekyll                GitHub Pages compatibility
├── 404.html                 Simple fallback redirect
└── DEPLOY_GUIDE_HINDI.md
```

## ⚠ Known scope and operational limitations

- A static frontend can't provide true secure login without configuring a backend. With blank `js/config.js` values, login/signup are intentionally disabled, rather than pretending to authenticate users.
- The basic cloud data model saves one workspace JSON document per user, autosaved after changes; simultaneous editing in multiple browser tabs/devices may overwrite the latest version. Keep exports before major imports/edits.
- Charts represent **closed journal entries only**, not broker-synced account equity or live balances.
- P&L is tracked in **each account's currency**, with no automatic FX conversion. Mixed-currency payouts are not added into a misleading grand total.
- Private screenshot objects are uploaded on new/edited entries; deleting or replacing a trade doesn't automatically garbage-collect old screenshot objects. They remain private and can be cleaned from Supabase Storage if needed.
- Web hosting and Supabase usage are governed by the respective providers' current terms and quotas.

---

**PP Trading Journey** — *Every trade tells a story. Make yours count.*
