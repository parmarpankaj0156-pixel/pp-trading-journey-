# PP Trading Journey V5 — Glass Edition

A responsive, Apple-inspired trading journal for GitHub Pages. **V5 preserves your V4 account/trade data model** and adds an in-chart account picker, polished tactile glass interface and period-specific insights.

## New in V5

- **Chart account switcher lives *inside* the Performance panel** on Overview and Insights, next to **7D, 14D, 30D, All Time**. The previous duplicate topbar selector is removed on those two pages; it remains on other pages where you still need it.
- The active selection controls **all** relevant widgets: account equity, net P&L, win rate, daily pulse, calendar, trade list, insights and challenge meters.
- **Single-color cumulative equity** — green if selected account is in net profit, red if net loss, neutral at break-even. Yellow dot marks highest positive visible cumulative account profit. Hover/tap inspection shows date, daily P&L and cumulative P&L.
- **Compact per-period stats** — Best Day, Toughest Day, Active Days, based only on the selected account and range, with fees deducted.
- Pearl-white/deep-blue glass surfaces with stronger focus states, touch response, better readability and considerate hover/lift animations, including a floating chart cursor indicator.
- **Daily Pulse** message adapts to account performance instead of showing the same text to everyone.
- **Data-safety correction** — initial cloud workspace load failure no longer creates an editable empty workspace that could overwrite a real account; sign-in must be retried.

## Existing features retained

Quick Add Trade (including Buy/Sell and expandable optional fields), multi-account trading journal, funded challenge target/loss progress, trade screenshots, calendar, reports, weekly/monthly/yearly certificates and on-demand daily certificate, payout tracking, reflections, goals, risk calculator, JSON export/import, light/dark themes and optional username/password + one-time recovery-key backend.

## Deploy on existing GitHub Pages

1. **First export a JSON backup** inside the existing website: **Settings → Export all data**.
2. Extract the ZIP and **copy the contents, not the top-level folder or the ZIP**, into the root of the **same existing repository**. Prefer GitHub Desktop to replace matching files and push them.
3. `index.html` must be at the repository root, referencing `js-v5/app.js` and `styles-v5.css`. Those are **new cache-busting paths** so the browser loads V5 assets.
4. Check **Settings → Pages → `main` / `(root)`** and **Actions → latest Pages deployment green**.
5. Open site in private/incognito tab. Verify the bottom-right badge says **V5 • GLASS EDITION**. If it says V4 or earlier, the Pages branch/root index was not updated.
6. If real login was configured before: copy the previous **PUBLIC** Supabase project URL and publishable/anon key to `js-v5/config.js`. Never commit service-role or other secret keys. Backend SQL/Edge Function setup is still required for real username authentication.

See [DEPLOY_GUIDE_HINDI.md](DEPLOY_GUIDE_HINDI.md) for detailed Hindi instructions.

## Run locally

```sh
python -m http.server 5500
```

Then visit `http://localhost:5500`. The terminal must remain running. On GitHub Pages you do **not** use a localhost URL.

## Test

```sh
npm test
```

These are automated module/render/data tests; a full live-browser and deployed Supabase end-to-end test is **not** included. Make a backup before testing with private trading data.

## Core files

- `index.html` — site entry point
- `styles.css`, `styles-v3.css`, `styles-v4.css`, `styles-v5.css` — visual system
- `js-v5/app.js` — UI, chart interactions, persistence and event handling
- `js-v5/views.js` — components, account controls and insights
- `js-v5/charts.js` — P&L series, SVG chart and hover data
- `js-v5/data.js`, `js-v5/certificates.js` — account stats / certificates
- `js-v5/auth.js`, `js-v5/config.js`, `supabase/` — optional cloud integration
- `tests/` — Node module regression tests

### Data and privacy

The demo uses `localStorage` on the **current browser/device only**, retaining the same storage key as earlier versions. Installing a new ZIP or pushing new frontend code does not inherently erase this local data, but clearing site data, changing domains, using a different browser or resetting demo can. Real shared-device data and authenticated cloud sync require the supplied Supabase backend to be properly configured and tested. Charts represent **your manually recorded closed trades**, not broker-connected real-time prices. Always keep exported backups.
