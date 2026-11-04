# PP Trading Journey V3 — GitHub par updated website live kaise karein

## A. Pehle existing trading data ka backup

Old site: Settings → Export all data → JSON save karo. Demo data browser mein rehta hai; alag domain/browser se khud migrate nahi hota.

## B. Old GitHub website par naya design lagao

1. ZIP ko **Extract All** karo.
2. GitHub Desktop install karke apni `pp-trading-journey` repository **Clone** karo.
3. Extracted ZIP ke andar ke **sab files + folders** ko cloned repository ke **main/root folder** mein paste karo. `index.html` replace hona chahiye. Folder ke andar extra `PP_Trading_Journey_V3` folder mat banao.
4. GitHub Desktop mein changes dikhenge: `index.html` modified, `styles-v3.css` added, **`js-v3/`** added. **Commit to main**, phir **Push origin**.
5. GitHub repository → Settings → Pages → Deploy from a branch → main / (root).
6. Repository → Actions mein latest Pages deployment green hona chahiye.
7. Website `https://YOUR_USERNAME.github.io/pp-trading-journey/` Incognito mein kholo; bottom-right mein **V3 • NEW EXPERIENCE** dikhna chahiye.
8. Agar V3 badge nahi dikh raha: repository ka root `index.html` check karo. Usmein `styles-v3.css` aur `js-v3/app.js` hona **zaroori** hai. Sirf new files upload karne se website update nahi hoti agar old index.html reh jaye.

## C. Demo mode

Explore Demo → Overview, Add Trade, Accounts, Insights → Certificates aur Tools → Settings check kar sakte ho. Buy/Sell, dark/light, green/red chart aur yellow peak dot demo mein kaam karenge. Demo login real private account **nahi** hai.

## D. Unique username + forgot key + cloud data

Yeh GitHub ke static hosting se akela **possible nahi**. Supabase project/backend setup karna hoga.

1. Supabase Dashboard → SQL Editor → `supabase/schema.sql` ka entire code run karo.
2. PC mein extracted project ki directory terminal mein kholo.
3. Commands:

```bash
npx supabase login
npx supabase link --project-ref YOUR_SUPABASE_PROJECT_REF
npx supabase functions deploy username-auth --no-verify-jwt
```

4. `js-v3/config.js` file mein apna **Supabase URL aur public anon/publishable key** set karo. **Service role/secret key GitHub par kabhi mat dalo.**
5. Updated file GitHub par commit/push karo.
6. Website mein Create account → Name + unique Username + Password + Confirm password bharo. Key ek hi baar dikhayi jayegi; secure jagah rakho.
7. Forgot password mein Username + Forgot Key + New Password bharna. Password reset par **new key** save karna mandatory hai.

**NOTE:** Email/mobile field nahi hai aur email/SMS recovery bhi nahi hai. Password aur key dono kho gaye to self-service recover nahi kar sakte. Purane email login accounts automatically migrate nahi honge; old backup import karna hoga.

## E. Additional check

- GitHub Pages URL `github.io` hoga, `localhost` nahi.
- `index.html` direct root mein hai?
- `styles-v3.css` aur `js-v3/` files root mein hain?
- Actions ka latest deploy successful hai?
- Supabase auth backend setup ke bina signup disabled rahega, lekin Demo chalega.

Detailed instructions `README.md` mein hain.
