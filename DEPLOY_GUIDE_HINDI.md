# PP Trading Journey V2 — Existing GitHub Website Update

Ye **replacement ZIP** hai. Existing repository ka naam ya link change karna zaroori nahi hai.

1. Purani website me **Settings → Export backup** kar lo (agar demo data important hai).
2. New ZIP **Extract All** karo.
3. Extracted folder ke **andar ki saari files aur folders** upload/replace karo, including NEW `styles-v2.css` and `js/certificates.js`. `index.html` repo root me hona chahiye.
4. Existing GitHub repo → **Add file → Upload files**; matching file names replace/commit karo. Agar web uploader replacement rokta hai, file editor ya GitHub Desktop se same path wali files update karo.
5. **Commit changes** karo. Pages already enabled ho to website automatically new version se deploy hogi.
6. Website kholo aur **Ctrl+Shift+R** press karo. Old browser cache clear hoga.
7. Check: sidebar me 5 tabs, Add Trade me + More options, Insights → Certificates.

⚠️ Agar real Supabase login pehle se connected tha, apne existing GitHub `js/config.js` me jo URL aur publishable/anon key hai unhe preserve karo. Blank ZIP config upload kar doge to login connection band ho jayega. **Never commit service-role or secret keys.**

Website open karne ke liye GitHub Pages ka URL use karo, `localhost` nahi. `localhost` sirf tab chalega jab tumhare computer par local server run ho.

**Demo vs Login:** ZIP upload se landing page/demo live ho jata hai. Real signup/login ke liye separately Supabase credentials + SQL schema setup karna hota hai.

---

# PP Trading Journey — GitHub Par Website Kaise Upload Karein

## 1. Website live karna (easy, no coding required)

1. ZIP extract karo.
2. GitHub par login karke **New repository** banao, jaise `pp-trading-journey`.
3. Repository ke andar **Add file → Upload files** choose karo.
4. Extract folder ke **andar ki saari files aur folders** upload karo. Dhyan rahe **index.html repository ke root mein ho**, extra nested folder mein nahin.
5. **Commit changes** karo.
6. Repository ki **Settings → Pages** kholo.
7. **Source = Deploy from a branch**, **Branch = main**, **Folder = /(root)** select karke **Save** karo.
8. GitHub Pages URL par website kholkar **Explore demo** click karo. Website demo mode mein turant kaam karegi.

## 2. Real login/signup kaise on karein

GitHub Pages sirf frontend website host karta hai. Real login aur private data sync ke liye Supabase connect karna zaroori hai.

1. supabase.com par ek free/paid project create karo (apni need ke hisaab se).
2. Supabase **SQL Editor** mein ZIP ki `supabase/schema.sql` file ka poora SQL run karo.
3. **Authentication → Providers → Email** mein email auth enable karo.
4. **Authentication → URL Configuration** mein apni GitHub Pages URL ko Site URL aur Redirect URLs mein set karo.
5. Supabase project ka **Project URL** aur **publishable/anon key** copy karo.
6. GitHub par `js/config.js` file edit karo:

   ```js
   export const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
   export const SUPABASE_ANON_KEY = 'YOUR-PUBLISHABLE-KEY';
   ```

7. Commit karo. Ab real email/password signup aur login chalega.

**IMPORTANT:** `service_role` key, database password, ya private key GitHub par **kabhi upload mat karna**. Sirf publishable/anon key use karni hai. `schema.sql` ki RLS security policies enable honi chahiye.

## 3. Demo aur real account mein difference

**Demo mode:** website explore karo, trades add karo, charts dekho. Data sirf usi browser mein rahega.

**Cloud mode:** Supabase setup ke baad sign up karo. Har trader ki private journal data Supabase mein save hogi aur login karne par devices ke beech mil sakti hai.

Demo se cloud move karna ho: **Settings → Export all data** se JSON backup download karo. Cloud mein login karke **Settings → Import a backup** use karo (ye current cloud data replace karega).

## 4. Website edit kahan karni hai?

- Logo: `assets/pp-logo.svg`
- Theme colors, glass effects, motion: `styles.css`
- Home page message / layout / section: `js/views.js`
- App functionality: `js/app.js`
- Sample account aur trades: `js/data.js`
- Login backend details: `js/config.js`

### Note

Funded-account loss/pass status sirf journal ke closed-trade P&L ke hisaab se hai. Floating losses, trailing drawdown aur different firm rules ka real-time verification website nahi karti. Broker se automatic trades import bhi nahi hota.
