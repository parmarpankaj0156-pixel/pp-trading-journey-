# PP Trading Journey V5 — GitHub Update Guide (Hindi)

## V5 mein kya naya hai?

- Overview ke **Performance chart ke andar hi account choose** kar sakte ho. **7D / 14D / 30D / All Time** uske bagal mein hain. Insights page mein bhi ye controls hain.
- Selected account ke alawa kisi aur account ka P&L chart mein mix nahi hoga. Account switch karne se daily amount, stats, recent trades, calendar, funded target indicator sab update honge.
- Chart **overall account net profit** par green, net loss par red hai. Highest positive profit ka yellow peak dot hai. Click/tap se date, daily P&L aur running P&L dikhega.
- Chart ke niche **Best Day, Toughest Day, Active Days** ka chhota summary.
- Premium white glass, dark glass, soft hover lift, tap-press feedback aur improved mobile controls.
- Daily Pulse performance ke hisab se change hota hai. Purane Add Trade/certificates/journal/features preserved hain.
- Cloud load error ke waqt blank account silently create nahi hoga, taaki existing saved account overwrite na ho.

## STEP 1 — Backup zaroor lo

Purani live website mein **Settings → Export all data** se JSON file download karo. Isi backup ko safe rakho. GitHub source files aur tumhare saved trades alag cheezein hain.

## STEP 2 — SAME GitHub repository mein V5 update

**Recommended: GitHub Desktop** (sirf GitHub browser upload mein wrong folder ka risk hai):

1. GitHub Desktop install karo aur account login karo.
2. **File → Clone repository** mein existing `pp-trading-journey` select karo. Agar already clone hai, usi repository folder ko kholo.
3. V5 ZIP **Extract All** karo. Extracted folder ke **andar** `index.html`, `js-v5`, `styles-v5.css` etc. dikhni chahiye.
4. Extracted folder ke **andar ka poora content** cloned repository ke **root** mein paste karo. **Replace files in destination** select karo.
5. `index.html` ki old copy zaroor replace honi chahiye. Ab usme `./js-v5/app.js?v=5.0.0` aur `./styles-v5.css?v=5.0.0` hona chahiye.
6. **IMPORTANT FOR OLD SUPABASE USERS:** old `js-v4/config.js` se **sirf PUBLIC** Supabase URL aur publishable/anon key copy karke new `js-v5/config.js` mein add karo. Service-role/secret key GitHub par kabhi mat daalo. Backend SQL/Edge Function records ko bina check kiye reset mat karna.
7. GitHub Desktop → **Commit to main** → **Push origin**. Sirf local commit se live site update nahi hoti.
8. GitHub repo → **Actions** → latest **Pages** deployment successful (green) check karo.

## STEP 3 — Live website par V5 verify

1. Existing URL open karo — `https://USERNAME.github.io/pp-trading-journey/` (USERNAME ko replace karo). `localhost` URL GitHub Pages ke liye nahi hota.
2. Incognito tab mein kholo, ya **Ctrl + Shift + R** refresh karo.
3. Bottom-right **`V5 • GLASS EDITION`** label dikhna chahiye.
4. Overview → Performance chart mein **TRADING ACCOUNT** dropdown click karo; naya account select karo. Neeche **7D / 14D / 30D / All Time** choose karo.
5. New account ke chart, balance, calendar, challenge meters ko check karo.

**Agar V5 label nahi hai:** `index.html` replace nahi hui, wrong root/folder mein upload hua, deployment fail hua ya old GitHub Pages branch configured hai. `Settings → Pages` mein **main/(root)** verify karo.

## STEP 4 — Data saving ka important rule

- Demo account ki entries **sirf isi browser mein localStorage** par save hoti hain. Same domain/browser par code update ke baad aam taur par bani rehti hain; browser storage delete hone par chali ja sakti hain.
- Real username/password login, unique username aur private cloud sync ke liye **Supabase** setup aur deployment zaroori hai. GitHub Pages apne aap database ya secure login provide nahi karta.
- Agar cloud data temporarily load nahi hua, V5 blank workspace edit karne ke bajay sign-in retry karne dega. Ye unintentional overwrite se protection hai; successful cloud save ka substitute nahi hai.
- Backup JSON ko regularly download karke safe rakho.

## STEP 5 — Local test (optional)

Extracted V5 folder mein terminal kholo:

```
python -m http.server 5500
```

Tab browser mein `http://localhost:5500` kholo; command band karoge to localhost refused to connect dikh sakta hai. GitHub live site ke liye iski zarurat nahi.

## Troubleshooting

- Blank screen: browser console mein file path error check karo; `js-v5` folder upload hua hai ya nahi.
- Old design: `view-source:LIVE-URL` mein `js-v5` search karo.
- Login disabled: `js-v5/config.js`, Supabase SQL aur username-auth Edge Function setup missing ho sakta hai.
- Files upload karne ke baad bhi old data dikhna normal hai; naye app ka same saved demo workspace use karna intentional hai.
