# STable — Ishga tushirishdan production deploygacha to'liq qadamlar

Bu fayl — loyihani hozirgi holatidan (kod yozilgan, lekin database bo'sh,
hech qayerga deploy qilinmagan) to'liq ishlaydigan production mahsulotga
olib borish uchun **aniq bajarish tartibi**. Har bir qadamni tartib bilan
bajaring, keyingisiga o'tishdan oldin tekshirib oling.

Joriy holat: `.env.local`da Supabase URL/kalitlar bor, Supabase CLI
o'rnatilgan (`supabase --version` → 2.117.0). Endi davom etamiz.

---

## BOSQICH 1: Supabase database'ni tayyorlash

### 1.1 Supabase CLI orqali login qilish

```powershell
supabase login
```

Bu brauzerda ochiladi, Supabase account bilan tasdiqlaysiz.

### 1.2 Loyihani local kod bazasiga bog'lash (link)

`.env.local`dagi URL'dan project-ref'ni oling: 
`https://ochutxectqdvxtpwokez.supabase.co` → project-ref = `ochutxectqdvxtpwokez`

```powershell
cd D:\IT\WebApp\STable
supabase link --project-ref ochutxectqdvxtpwokez
```

Bu sizdan database parolini so'raydi (Supabase Dashboard → Project
Settings → Database → Connection string'da ko'rasiz, agar unutgan
bo'lsangiz "Reset database password" tugmasi bor).

### 1.3 Migratsiyalarni qo'llash

```powershell
supabase db push
```

Bu `supabase/migrations/001` dan `010`gacha bo'lgan barcha SQL
fayllarni tartib bilan Supabase database'ingizga qo'llaydi:
- profiles, user_accounts, categories, transactions va h.k. jadvallar
- RLS policy'lar
- Default kategoriyalar (seed)
- Dashboard/analytics RPC funksiyalari
- Haftalik hisobot generatori + pg_cron schedule

**Tekshirish**: Supabase Dashboard → Table Editor'ga kirib, `profiles`,
`transactions`, `categories` kabi jadvallar paydo bo'lganini ko'ring.
`categories` jadvalida ~150 qatordan iborat default kategoriyalar
bo'lishi kerak (`select count(*) from categories;` SQL Editor'da).

Agar xatolik chiqsa (masalan pg_cron kengaytmasi yo'q deb):
- Supabase Dashboard → Database → Extensions → `pg_cron` va `pg_net`ni
  qo'lda yoqing, keyin `supabase db push`ni qayta ishga tushiring.

### 1.4 Google OAuth sozlash

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 
   ga kiring, yangi loyiha yarating (yoki mavjudini tanlang).
2. **Create Credentials → OAuth client ID → Web application**.
3. **Authorized redirect URIs** ga qo'shing:
   ```
   https://ochutxectqdvxtpwokez.supabase.co/auth/v1/callback
   ```
4. Client ID va Client Secret'ni nusxalab oling.
5. Supabase Dashboard → **Authentication → Providers → Google**:
   - Enable qiling, Client ID va Client Secret'ni joylashtiring.
   - Saqlang.
6. Supabase Dashboard → **Authentication → URL Configuration**:
   - **Site URL**: hozircha `http://localhost:3000` (keyinroq
     production domenga o'zgartirasiz — 4-bosqichda).
   - **Redirect URLs** ga qo'shing: `http://localhost:3000/auth/callback`

### 1.5 Email tasdiqlashni tekshirish

Supabase Dashboard → Authentication → Providers → Email:
- "Confirm email" yoqilgan bo'lishi kerak (default yoqilgan bo'ladi).

### 1.6 Delete-account Edge Function yaratish

Hisobni o'chirish funksiyasi uchun (spec 75-band):

```powershell
supabase functions new delete-account
```

`supabase/functions/delete-account/index.ts` faylini shu mazmun bilan
to'ldiring:

```typescript
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No auth header" }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Verify the calling user's identity using their own JWT
  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 });
  }

  // Use the service role client only to delete the auth identity itself
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

Deploy qiling:

```powershell
supabase functions deploy delete-account
```

---

## BOSQICH 2: Local development'da to'liq test qilish

### 2.1 Dependencies o'rnatilganini tekshirish

```powershell
npm install
```

(Agar hali qilmagan bo'lsangiz — lekin loyiha allaqachon build bo'lgan
edi, demak bu bosqich allaqachon bajarilgan bo'lishi kerak.)

### 2.2 Dev serverni ishga tushiring

```powershell
npm run dev
```

`http://localhost:3000` ni brauzerda oching.

### 2.3 To'liq foydalanuvchi oqimini qo'lda sinab ko'ring

Bu **eng muhim tekshirish qadami** — quyidagilarni tartib bilan sinab
ko'ring:

1. **Ro'yxatdan o'tish**: `/signup` → email+parol bilan hisob yarating.
   - Emailingizga tasdiqlash xati kelishi kerak (Supabase default SMTP
     orqali, kunlik limit bor — test uchun yetarli).
   - Xatdagi havolani bosing → `/auth/callback` orqali qaytadi.
2. **Onboarding**: Ism, universitet kiriting → 7 xonali ID ko'rinishi
   kerak, nusxalash tugmasi ishlashi kerak.
3. **Dashboard**: Bo'sh holat ko'rsatilishi kerak ("Hali hech qanday
   xarajat yo'q").
4. **Xarajat qo'shish**: "+ Xarajat qo'shish" tugmasini bosing, summa
   va kategoriya tanlang, saqlang → dashboard'ga qaytishi va
   statistikaning yangilanishi kerak.
5. **Kalendar**: `/calendar` ochib, kelajakdagi kunlarni bosib
   bo'lmasligini tekshiring.
6. **Google orqali kirish**: Logout qilib, "Google orqali davom etish"
   tugmasini sinang.
7. **Parolni tiklash**: `/reset-password` orqali email yuborilishini
   tekshiring.
8. **Boshqa sahifalar**: `/transactions`, `/budgets`, `/goals`,
   `/subscriptions`, `/analytics`, `/reports`, `/profile`, `/settings`
   — barchasi xatosiz ochilishi kerak.

Agar biror joyda xato chiqsa (browser console'da qizil xato,
yoki "Xatolik yuz berdi" degan umumiy xabar), menga ekran
suratini yoki console xato matnini yuborsangiz, tuzataman.

### 2.4 Unit testlarni qayta tasdiqlash

```powershell
npm run test
```

33/33 test o'tishi kerak (avval tasdiqlangan).

---

## BOSQICH 3: GitHub'ga repo yuklash

Cloudflare Pages Git-based deploy talab qiladi, shuning uchun avval
GitHub'ga push qilamiz.

### 3.1 Git repo ishga tushirish

```powershell
cd D:\IT\WebApp\STable
git init
git add .
git status
```

`git status` chiqarganda **`.env.local` ro'yxatda ko'rinmasligi
kerak** (`.gitignore`da `.env*` bor) — shuni tekshiring, chunki u
yerda maxfiy kalitlaringiz bor.

### 3.2 Birinchi commit

```powershell
git commit -m "Initial STable implementation"
```

### 3.3 GitHub'da yangi repo yaratish

[github.com/new](https://github.com/new) ga kiring:
- Repository name: `stable` (yoki xohlagan nom)
- **Private** tanlang (moliyaviy ilova kodi, hozircha public qilish
  shart emas)
- "Initialize with README" belgisini **qo'ymang** (bizda allaqachon bor)

### 3.4 Remote qo'shish va push qilish

GitHub sizga ko'rsatgan buyruqlarni ishlatasiz, taxminan:

```powershell
git remote add origin https://github.com/<username>/stable.git
git branch -M main
git push -u origin main
```

---

## BOSQICH 4: Cloudflare Pages'ga deploy qilish

### 4.1 Cloudflare account

[dash.cloudflare.com](https://dash.cloudflare.com) da account
yarating (bepul).

### 4.2 Pages loyihasini yaratish

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**
2. GitHub account'ingizni ulang, `stable` repo'ni tanlang.
3. Build sozlamalari:
   - **Framework preset**: Next.js
   - **Build command**: 
     ```
     npx @cloudflare/next-on-pages@latest
     ```
   - **Build output directory**: 
     ```
     .vercel/output/static
     ```
   - **Root directory**: `/` (o'zgartirmang)

### 4.3 Environment variables qo'shish

Cloudflare Pages loyiha sozlamalarida → **Settings → Environment
variables** → Production va Preview uchun ikkalasiga ham qo'shing:

```
NEXT_PUBLIC_SUPABASE_URL = https://ochutxectqdvxtpwokez.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = (sizning anon key'ingiz)
NEXT_PUBLIC_SITE_URL = https://stable.pages.dev
```

(`NEXT_PUBLIC_SITE_URL`ni keyinroq haqiqiy domeningizga
yangilaysiz — hozircha Cloudflare bergan `*.pages.dev` manzilini
ishlatamiz.)

**`SUPABASE_SERVICE_ROLE_KEY`ni bu yerga QO'SHMANG** — u faqat Edge
Function ichida kerak, Cloudflare'ga hech qachon yuborilmaydi.

### 4.4 Deploy qiling

"Save and Deploy" tugmasini bosing. Build ~3-5 daqiqa davom etadi.
Muvaffaqiyatli bo'lsa, `https://stable.pages.dev` (yoki shunga
o'xshash) manzil beriladi.

### 4.5 Supabase'da production URL'ni qo'shish

Supabase Dashboard → Authentication → URL Configuration:
- **Site URL**ni production domeningizga o'zgartiring:
  `https://stable.pages.dev`
- **Redirect URLs**ga qo'shing: `https://stable.pages.dev/auth/callback`

Google Cloud Console → OAuth client → Authorized redirect URIs — bu
yerga qo'shimcha qo'shish shart emas, chunki Google har doim
Supabase'ning `auth/v1/callback` manziliga yo'naltiradi, u esa
Supabase ichida sizning Site URL'ingizga qaytaradi.

### 4.6 Production'da to'liq sinab ko'ring

`https://stable.pages.dev` ni oching, 2.3-bosqichdagi barcha
tekshiruvlarni **production URL'da** qayta bajaring (signup, login,
xarajat qo'shish, va h.k.).

---

## BOSQICH 5: Custom domain (ixtiyoriy)

Agar `*.pages.dev` o'rniga o'z domeningizni ishlatmoqchi bo'lsangiz:

1. Domenni Cloudflare'ga qo'shing (Cloudflare DNS orqali boshqarilishi
   kerak) yoki mavjud DNS provayderingizda CNAME record qo'shing.
2. Cloudflare Pages loyihasi → **Custom domains → Set up a domain**.
3. Domenni tasdiqlagandan keyin, `NEXT_PUBLIC_SITE_URL` va Supabase
   Site URL/Redirect URLs'ni yangi domenga yangilang (4.3 va 4.5
   bosqichlarini qayta bajaring).

Bu qadam **ixtiyoriy va pullik** (domen sotib olish narxi) — spec
talabiga ko'ra majburiy emas.

---

## BOSQICH 6: PWA sifatida o'rnatishni tekshirish

1. Telefon/kompyuter brauzerida production URL'ni oching.
2. Chrome/Edge'da manzil satrida "o'rnatish" belgisi chiqishi kerak,
   yoki ilova ichida ko'rsatiladigan install banner paydo bo'ladi.
3. O'rnatib, ekranga qo'shib ko'ring — "native-like" ishlashi kerak.

---

## BOSQICH 7: Android APK qurish (ixtiyoriy, keyinroq ham qilish mumkin)

### 7.1 Talablar

- [Android Studio](https://developer.android.com/studio) o'rnating
  (JDK 17+ bilan birga keladi).

### 7.2 Capacitor config'ni production URL'ga yangilash

`capacitor.config.ts` faylida:

```typescript
server: {
  url: "https://stable.pages.dev",  // haqiqiy production domeningiz
  androidScheme: "https",
},
```

### 7.3 Sync va build

```powershell
npx cap sync android
npx cap open android
```

Android Studio ochiladi. **Build → Build Bundle(s) / APK(s) → Build
APK(s)** orqali debug APK oling, telefoningizga o'rnatib sinab
ko'ring.

Play Store'ga chiqarish uchun signed release build kerak bo'ladi
(README.md 7-bo'limida batafsil).

---

## BOSQICH 8: Haftalik hisobot cron'ini tekshirish

pg_cron schedule allaqachon migratsiyada sozlangan (har dushanba
00:05 Asia/Tashkent). Buni tekshirish uchun:

Supabase Dashboard → SQL Editor:

```sql
select * from cron.job;
```

`weekly-report-generation` nomli job ko'rinishi kerak. Uni qo'lda
ishga tushirib sinash uchun:

```sql
select public.run_weekly_report_backfill(1);
```

Bu joriy foydalanuvchilar uchun o'tgan haftaning hisobotini
generatsiya qiladi (agar transaction bo'lsa). Keyin `/reports`
sahifasida ko'rinishini tekshiring.

---

## Qisqacha tartib (checklist)

- [ ] `supabase login` va `supabase link`
- [ ] `supabase db push` (10 migratsiya qo'llanadi)
- [ ] Google OAuth sozlash (Supabase + Google Console)
- [ ] `delete-account` Edge Function yaratish va deploy qilish
- [ ] Local'da to'liq foydalanuvchi oqimini sinab ko'rish
- [ ] `npm run test` — 33/33 o'tishi
- [ ] GitHub repo yaratish, kod push qilish
- [ ] Cloudflare Pages loyihasi yaratish, env var'lar qo'shish, deploy
- [ ] Supabase Site URL/Redirect URLs'ni production domenga yangilash
- [ ] Production'da to'liq sinab ko'rish
- [ ] (Ixtiyoriy) Custom domain ulash
- [ ] (Ixtiyoriy) PWA o'rnatishni sinash
- [ ] (Ixtiyoriy) Android APK qurish
- [ ] pg_cron ishlayotganini tekshirish

Har bir qadamda muammo chiqsa, xato matnini menga yuboring —
birgalikda tuzatamiz.
