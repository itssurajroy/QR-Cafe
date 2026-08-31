# QR Café — Face-to-Face Demo Script (Show, Don't Tell)

> Run this LIVE on a phone/laptop in front of the owner. For every point,
> actually OPEN the screen — don't just describe it. Let them touch it.
> Updated for the **2-plan SaaS**: Basic ₹399 / Pro ₹799, 30-day free trial.

---

## Step 0 — Open the landing page (30 sec)

"Sir, phone nikaaliye. Ye hamari site — qrcafe.app." (open `/`)
"Yahan saaf likha hai: QR ordering, KDS, GST billing. Aur neeche do plan —
**Basic ₹399** aur **Pro ₹799**. Pehla 30 din bilkul free."

👉 **SHOW:** `/` marketing page with the two pricing cards (Basic / Pro) + "Start free trial".

---

## Step 1 — Self-signup LIVE (the "wow" of SaaS) (1 min)

"Ab main aapko khud sign-up karwata hoon — humare paas account banana padta hai."
(open `/onboarding`)
"Step 1: café name + GST details + accent color. Step 2: kitne table + starter menu.
Step 3: **plan chuniye** — Basic ya Pro — aur apna email/password."

👉 **SHOW:** pick **Pro**, fill details, "Launch My Café".
"Dekhiye — 10 second mein aapki café ban gayi, email verify karo, aur aap `/admin` mein."

👉 **SHOW:** auto-login → `/admin` dashboard with a "Trial: 30 days left" badge.

"Matlab abhi se order lena shuru kar sakte hain — paise baad mein."

---

## Step 2 — Show the customer side (the order) (30 sec)

"Ab main customer banke dikhata hoon." (open `/c/<slug>`, tap a table, tap items)
"Customer QR scan kare → `/c/slug` khulega → table chune → item tap → order."

👉 **SHOW:** table pick → `MenuClient` → add to cart → "Place Order" → "Order sent to kitchen".

"Unhe app download nahi karni. Bas scan + tap."

---

## Step 3 — Kitchen screen (KDS) — Pro feature (30 sec)

"Ye dekhiye chef wali screen." (open `/kds`)
"Abhi ka order red/pending mein hai. Ban gaya toh 'Mark Ready' → green."

👉 **SHOW:** /kds live order → Mark Ready.

⚠️ **If you signed up on Basic:** show the upgrade screen instead —
"KDS Pro mein hai. Basic mein sirf QR order + counter POS milta hai. Upgrade karne se
ye screen activate ho jayegi." Then switch plan to Pro (Step 6) to reveal KDS.

"Iska matlab waiter bhaag-bhaag order nahi le jata, galat likhne ka chance hi nahi."

---

## Step 4 — Counter / POS billing (1 min)

"Ab billing — counter par." (open `/pos`)
"Table select → items → bill auto banta hai. 'Settle' dabao..."

👉 **SHOW:** /pos → table → 2-3 items → bill live → Settle → GST receipt auto-opens.

---

## Step 5 — The GST receipt (the proof) (1 min)

"Ye aapka bill — bilkul dukaan wala thermal receipt:"
- "Upar **shop name, address, GSTIN, phone** — jo aapne signup mein diya tha"
- "Invoice no `POS/2026/000123` — har bill alag"
- "Har item ke saath **HSN code**"
- "Neeche **CGST + SGST alag-alag** — aapke tax % se"
- "**Amount in words** — 'Rupees Five Hundred Only'"
- "Customer ne kitna dia, **change** kitna"

👉 **SHOW:** printed/onscreen receipt. "GST bill bina accountant ke apne aap banta hai."

---

## Step 6 — Admin, branding & billing (1 min)

"Admin mein menu/price badalna, naya item — sab yahan." (open `/admin`)
"Pro mein **branding** bhi hai: apna logo, tagline, accent color — receipt aur menu par
aapka rang chhaiyega." (edit Settings → save → show on `/c/slug`)

" Aur **billing** — trial khatam hone par yahan se ₹799 (ya ₹399) bharna hai."
(open `/admin/billing`)
"Subscribe dabao → Razorpay → card se monthly auto-debit. Na bharo toh 30 din baad
order band ho jayega, lekin admin khula rahega."

👉 **SHOW:** `/admin/billing` with plan badge + "Subscribe" button + trial countdown.

---

## Step 7 — The close, on the same screen (30 sec)

"Toh dekha aapne: khud sign-up, order bina galti, kitchen clear, GST bill ready.
Price bilkul clear:

- 🟡 **Basic ₹399/mo** — 10 table tak, 50 item tak, QR order + counter POS.
- 🟢 **Pro ₹799/mo** — unlimited table/item + KDS + branding + analytics.
- 🎁 **Pehla 30 din FREE** — card nahi, commitment nahi.
- ₹799 (ya ₹399) bharo ya chhod do — **lock-in nahi, koi jhook nahi.**

"Chalo abhi aapki café khud banate hain? Phone mein 2 minute." 

👉 **ACTION:** hand them the phone at `/onboarding`, let them create their own café.

---

## Quick demo checklist (keep open while presenting)
- [ ] Landing `/` with Basic/Pro pricing
- [ ] Self-signup at `/onboarding` (pick plan) → `/admin` with trial badge
- [ ] `/c/<slug>` → pick table → order placed
- [ ] /kds shows order → Mark Ready (or Basic upgrade screen)
- [ ] /pos → items → Settle
- [ ] GST receipt (name/GSTIN/CGST-SGST/HSN/words/change)
- [ ] /admin branding edit (Pro) reflects on menu
- [ ] /admin/billing shows plan + Subscribe
- [ ] Say pricing: Basic ₹399 / Pro ₹799, 30-day free, leave anytime
