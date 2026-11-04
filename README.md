# PP Trading Journey V4

A premium Apple-style, frosted-glass trading journal, deployable as a static GitHub Pages website, with an optional Supabase backend for real username-only authentication and private cloud sync.

## Highlights

- **Selected-account chart** on Overview and Insights — never combines different account currencies, balances or trades.
- **7D / 14D / 30D / All Time** equity timeline, with actual chronological time spacing.
- **Single status color:** entire line green when the selected account's all-time **net** P&L is positive, red when negative, neutral when flat. No alternating red/green trade segments.
- **Yellow peak dot** shows the highest positive cumulative profit visible in the selected period.
- **Inspect values:** tap/hover chart for the calendar date, that day's net P&L, and account cumulative net P&L.
- Historical P&L is carried into each date window instead of resetting the chart to zero. All Time spans earliest account history to today.
- The selected account is changed via the top-bar account switcher; same selected account is used for summary, chart, recent trades, analytics and funded rules.
- Premium bright pearl and dark themes; Add Trade with Buy/Sell, Profit/Loss and expandable optional fields; funded-account progress and risk limits; automated weekly/monthly/yearly performance certificates; journal, goals, calendar, risk calculator, and JSON backups.
- Optional **Supabase username/password signup and single-use recovery key** integration (requires backend setup). Never store real passwords client-side.

## Quick deploy

1. Extract ZIP so **`index.html` is at the root of your existing GitHub repository**.
2. Commit and push all files — especially `index.html`, `styles-v4.css` and the entire `js-v4/` folder.
3. GitHub Pages: Settings > Pages > Deploy from a branch > `main` / `(root)`.
4. After a successful deployment, look for **`V4 • ACCOUNT CHART`** at bottom-right. If missing, the old `index.html` is still being served.
5. If using Supabase, configure **`js-v4/config.js`** with the public project URL + public/anon key, and deploy the supplied SQL and Edge Function as needed. **Never** put the Supabase service-role key in a static frontend.

Detailed instructions (Hindi): [`DEPLOY_GUIDE_HINDI.md`](DEPLOY_GUIDE_HINDI.md).

## Local testing

From this folder:

```sh
python -m http.server 5500
```

Open `http://localhost:5500`. The local server must be running; opening localhost without a server produces `ERR_CONNECTION_REFUSED`.

To run offline code tests (Node.js):

```sh
npm test
```

## File layout

- `index.html` — live V4 entry point, static GitHub Pages compatible.
- `styles.css`, `styles-v3.css`, `styles-v4.css` — foundation + premium visuals + focused V4 chart styles.
- `js-v4/app.js` — navigation, data persistence, chart interactions and modal workflows.
- `js-v4/charts.js` — account-scoped equity series, smooth one-color SVG line, peak dot, tooltip data.
- `js-v4/views.js` — interface and 7D / 14D / 30D / All Time controls.
- `js-v4/data.js` — account models, demo data, stats and funded rules.
- `js-v4/auth.js`, `js-v4/config.js` — Supabase integration (configure before using real sign-in).
- `js-v4/certificates.js` — performance certificates and PNG export.
- `supabase/` — schema / Edge Function for secure username-based accounts.
- `tests/` — smoke and account-isolation regression tests.

## Notes

Data in demo mode is saved in local browser storage only and won't sync across devices. Real login and cloud saving require successful Supabase setup. The GitHub Pages website is public source code; do not embed secrets. Chart figures are realized P&L calculated from recorded trades, **after broker fees**, not broker API/live market prices. Funding challenge rules are estimates and do not replace prop-firm statements.
