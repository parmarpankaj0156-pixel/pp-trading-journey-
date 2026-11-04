# PP Trading Journey V4 — GitHub par purani website replace karna

## 1. Backup
Purani site kholkar **Settings > Export all data** se JSON backup download karo. ZIP GitHub par replace karne se browser ka data automatically delete nahi hota, lekin backup zaroor rakhna.

## 2. Purane repository par update (IMPORTANT)
V4 se naya project / nayi repository mat banana agar existing URL same rakhna hai.

**Sabse reliable tarika GitHub Desktop:**
1. [GitHub Desktop](https://desktop.github.com/) install karo aur sign in karo.
2. **File > Clone repository** mein apna existing `pp-trading-journey` repo choose karo.
3. ZIP ko **Extract All** karo. Extracted folder ke **andar ki** files dekho.
4. Is folder ke contents (root `index.html`, `styles.css`, `styles-v3.css`, `styles-v4.css`, `js-v4` folder, assets, etc.) ko cloned repository ke main folder mein copy karo.
5. Windows puche to **Replace files in destination** dabao.
6. Agar V3 mein Supabase configured tha, **old `js-v3/config.js` ka public URL + publishable/anon key NEW `js-v4/config.js` mein set karo**. Service-role/secret key kabhi public GitHub par mat dalna.
7. GitHub Desktop mein changes dikhne chahiye. Message likho `Update PP Trading Journey V4` aur **Commit to main**, phir **Push origin**.

**Browser-only upload**: GitHub > existing repo > `Add file` > `Upload files` se files ko **same paths** par replace karna hai. `index.html` repository root mein hi hona chahiye; ZIP ko as a ZIP upload nahi karna. Agar drag-drop folders overwrite na ho paye, GitHub Desktop method use karo.

## 3. Confirm GitHub Pages
Repository > Settings > Pages > Source `Deploy from a branch`, Branch `main`, Folder `/(root)`.
Repository > Actions mein latest Pages deployment successful ho. Website ka URL pehle jaisa hi rahega.

## 4. V4 actually live hua kya?
- Live website private/incognito tab mein kholna.
- Bottom-right **V4 • ACCOUNT CHART** likha hona chahiye.
- Browser se `view-source:YOUR-LIVE-URL` open karke `js-v4/app.js` search kar sakte ho.
- Agar version purana hai: GitHub root `index.html` replace nahi hui, Pages kisi aur branch/folder ko serve kar raha hai ya old cache hai. Hard refresh `Ctrl + Shift + R` try karo.

## 5. New chart kaise use karna hai
1. Website ke top header se **account select** karo.
2. Overview ke Performance card mein selected account ka naam dikhna chahiye.
3. Chart buttons: **7D, 14D, 30D, All Time**. Dono Overview aur Insights mein same setting apply hogi.
4. Chart ka **single green/red color** selected account ki *overall cumulative net P&L* par depend karta hai (broker fees deduct karke), filtered window ke andar aane wale har win/loss par nahi. Zero P&L par neutral.
5. Top amount **all-time account net P&L** hai. Niche 7/14/30 days ka period change separately dikhata hai. All Time sabhi historical trades (up to today) dikhata hai.
6. Tooltip: mouse hover ya chart pe touch/click karne par day result aur cumulative net dikhte hain.
7. Yellow dot visible selected range ka highest positive cumulative P&L highlight karta hai.

## 6. Supabase / user accounts
GitHub Pages static frontend host karta hai. Real username/password + recovery key ke liye V3 se included Supabase schema aur Edge Function deploy karna zaroori hai. V4 code compatible hai, lekin Supabase credentials aur Edge Function alag setup karna hoga. Existing database ko dubara reset karne ki zaroorat nahi (schema migrate karne se pehle backup/SQL review karo).

## 7. Agar chart phir bhi purana dikhe
Mujhe live Pages URL aur GitHub repository URL bhejo; main public site ke root `index.html` aur assets compare karke bata sakta hoon kis path ka problem hai.
