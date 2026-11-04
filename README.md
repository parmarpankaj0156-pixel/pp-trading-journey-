# PP Trading Journey — V3 (GitHub-ready)

A premium, responsive trading journal with Apple-inspired pearl-glass UI and a new midnight theme. The public front end works on GitHub Pages. Real username-only accounts require the included Supabase Edge Function and database schema; GitHub Pages alone is **not** a secure authentication backend.

## V3 upgrades

- V3 proof-of-deployment badge at the bottom-right and **versioned asset filenames** (`styles-v3.css`, `js-v3/`) to reduce caching confusion.
- Clean 5-section primary sidebar, with the full journal, calendar, analytics, certificates and settings still present.
- Add Trade: account, Profit/Loss, Buy/Sell, gross P&L amount, fees, date/time and entry type all visible; advanced fields optional inside **+ More options**.
- Actual saved-trade equity graph: green increasing segments, red decreasing segments, yellow dot at the highest positive cumulative P&L, touch/mouse inspector with date + day P&L + cumulative P&L. No broker live market feed—this is an **equity/performance chart** built from journal entries.
- Account target and drawdown meters show exact amounts and percentages based on the account's saved starting balance and configured rules. No red progress on profitable/no-drawdown accounts.
- Existing daily optional / weekly, monthly, yearly certificate system retained, with logo, performance-dependent message and chart backdrop. They reflect **recorded trades**, not verified broker statements. Weekly/monthly/yearly reports are generated on opening the page; they are **not pre-rendered or delivered by a background server**.
- Theme switch in Settings, saved per workspace and locally. Includes high-contrast dark mode.
- New username-only login (no phone/email fields), unique usernames, 10+ character passwords and a one-time recovery key after registration, via Supabase Edge Functions. Recovery generates a **new key**; the old one is invalidated.

## Quick publish — GitHub Pages

1. Download ZIP and extract it.
2. **Back up existing demo data** with Settings → Export all data before modifying your old site. For connected accounts, also export JSON, as username accounts create separate auth identities.
3. Open your existing repository (`pp-trading-journey`) with **GitHub Desktop** (recommended). Copy everything from the extracted ZIP **into the repository root**, overwriting files, including **`index.html`**. Do not upload the ZIP itself or place an extra parent directory around the files.
4. Commit and **Push origin**. Then verify `index.html` has `styles-v3.css` and `js-v3/app.js`; `styles-v3.css` and the complete `js-v3/` folder must appear at repository root. Keeping the old `js/` and `styles-v2.css` in GitHub is harmless—the V3 `index.html` points to V3 assets.
5. Settings → Pages → Deploy from a branch → `main` and `/(root)` → Save. Check Actions → Pages deployment finished successfully.
6. Open `https://YOURUSERNAME.github.io/pp-trading-journey/` in a private tab or hard refresh. The tiny **V3 • NEW EXPERIENCE** badge at the lower right confirms the new `index.html` is live.
7. Explore Demo to check the updated interface **without** backend setup.

> `localhost` is not your public website address. GitHub Pages uses your `github.io` URL.

## Enable username/password/forgot-key cloud login

GitHub Pages serves static files; it cannot securely enforce unique usernames or hold recovery keys. The `supabase/functions/username-auth/index.ts` file is **server-side** and must run as a Supabase Edge Function, not in a public browser. Do **not** expose any service-role/secret key in GitHub or `js-v3/config.js`.

### Prerequisites

- A Supabase project (https://supabase.com), Supabase CLI (https://supabase.com/docs/guides/cli), and Node.js installed for `npx`.
- Ensure your Supabase project has enough Auth/database resources for your usage.

### Set up

1. In Supabase → SQL Editor, run the full `supabase/schema.sql` script (also safe as a one-time upgrade from the V2 schema). It enables private workspace storage, screenshot bucket policies, unique username registry and recovery hash storage.
2. On your PC, open terminal **inside this extracted project** (where `supabase/config.toml` lives) and use:

```bash
npx supabase login
npx supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
npx supabase functions deploy username-auth --no-verify-jwt
```

   The function needs to accept unauthenticated registration/login/recovery requests. `supabase/config.toml` also declares `verify_jwt=false`. This public endpoint must be protected with further anti-bot measures/CAPTCHA for significant public traffic; a simple username/IP throttle is included, not enterprise-grade abuse prevention.
3. Supabase automatically provides the Edge Function with environment variables including `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` on supported hosted projects. Confirm the function's server-side secrets are available in your environment. Never paste the service role key into public client files.
4. Open `js-v3/config.js` and set **only** your Supabase Project URL and public **anon/publishable** API key. Older `js/config.js` config from V2 is **not** loaded by V3. Copy safe public values into `js-v3/config.js`.

```javascript
export const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY';
```

5. Commit/push that config change to GitHub, then create a new account on the deployed site. Enter your name, unique username, password, and confirmation. The **recovery key is shown only once**. Copy it to a secure password manager/offline backup before continuing. For forgotten passwords, enter username + current recovery key + new password; the site gives you a new recovery key after recovery.
6. Test with **two different browsers**: register username A, try registering username A again (should say unavailable), log in correctly, log out, use recovery key to change password, and verify the old password and old recovery key no longer work.

### Important limitations

- Username-only credentials do not send email or SMS recovery. **If you lose both your password and recovery key, self-service account recovery is impossible.** A trusted site administrator may have other options, but never assume automatic recovery.
- Existing Supabase email-based V1/V2 auth users are **not automatically migrated**. Export JSON from your old account and import it into a new V3 username account if needed.
- Supabase SQL/backend setup is **required** for all real authentication, cloud workspace data, and screenshot storage. Before backend configuration, Demo is available but personal changes are stored in browser localStorage only. Avoid using it as your sole backup.
- Equity graph is derived from manually logged trades; broker live prices/floating drawdown/trailing firm-specific rules are not implemented.
- If hosting a public registration website at scale, add CAPTCHA, stronger rate limiting, monitoring, account-abuse mitigation, server auditing, and security review before production rollout.

## Files

- `index.html` — V3 entrypoint and build badge
- `styles.css` — base UI styles
- `styles-v3.css` — premium light/dark theme, V3 gauges, interactive chart and signup UI
- `js-v3/app.js` — browser state, trade events, theme settings and authentication screens
- `js-v3/views.js` — 12 views, form templates, account meters, recovery key UI
- `js-v3/charts.js` — real journal-based performance chart
- `js-v3/auth.js` — username API client, secure Supabase JWT session/refresh, RLS workspace and screenshot storage
- `js-v3/certificates.js` — optional daily, weekly/monthly/yearly report previews and PNG downloads
- `supabase/schema.sql` — workspace storage with RLS, private screenshot bucket, username registry, rate limit table
- `supabase/functions/username-auth/index.ts` — **server-only** unique username/auth/recovery implementation
- `supabase/config.toml` — Edge Function auth verification settings
- `tests/smoke.mjs` — deterministic Node checks (run `npm test`)

## Testing

```bash
npm test
```

Automated render/data checks pass. A live Supabase environment was not supplied, so full backend integration and browser visual deployment tests must be performed in your deployment. Make a JSON backup before upgrades.
