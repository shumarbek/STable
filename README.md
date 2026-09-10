# STable — Shaxsiy moliyaviy nazorat platformasi

STable — talabalar va oddiy foydalanuvchilar uchun aniq, xavfsiz va
qulay shaxsiy moliyaviy boshqaruv paneli. Har bir daromad va xarajat
aniq kategoriyalarga ajratilib qayd qilinadi, kundalik/haftalik/oylik
statistika hisoblanadi, haftalik hisobotlar avtomatik tayyorlanadi.

Batafsil arxitektura qarorlari uchun [ARCHITECTURE.md](./ARCHITECTURE.md)
ga qarang. Amalga oshirilgan/amalga oshirilmagan qismlar ro'yxati
uchun [PROGRESS.md](./PROGRESS.md) ga qarang.

## Texnologik stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript (strict),
  Tailwind CSS v4, shadcn/ui (base-ui asosida), Recharts, React Hook
  Form + Zod
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security, Edge
  Functions, pg_cron)
- **Hosting**: Cloudflare Pages (frontend), Supabase (backend)
- **PWA**: Web App Manifest + Service Worker, o'rnatiladigan
- **Mobile**: Capacitor (Android APK/AAB wrapper)

Hech qanday qo'shimcha backend server, Docker, Redis yoki microservice
ishlatilmaydi — arxitektura ataylab minimal va resource-efficient
qilib qurilgan.

## 1. Loyihani ishga tushirish (local development)

### Talablar

- Node.js 20+ (loyiha 24.x bilan sinovdan o'tgan)
- npm
- Supabase account (bepul reja yetarli)

### O'rnatish

```bash
npm install
```

### Muhit o'zgaruvchilari

`.env.example` faylidan nusxa olib `.env.local` yarating:

```bash
cp .env.example .env.local
```

`.env.local` ichida quyidagilarni to'ldiring (2-bo'limga qarang, qayerdan
olish kerakligi tushuntirilgan):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` faqat Edge Function muhitida kerak
bo'ladi (Supabase Dashboard'da alohida sozlanadi), Next.js
`.env.local`'ga yozish shart emas va yozilmasligi kerak — bu maxfiy
kalit, frontend bundle'ga chiqmasligi kerak.

### Dev serverni ishga tushirish

```bash
npm run dev
```

`http://localhost:3000` ochiladi.

## 2. Supabase loyihasini sozlash

1. [supabase.com](https://supabase.com) da bepul account yarating.
2. Yangi loyiha yarating (region: eng yaqinini tanlang, masalan
   Frankfurt yoki Singapore — Asia/Tashkent uchun kechikish kam
   bo'ladigan hududni tanlang).
3. **Project Settings → API** bo'limidan `Project URL` va
   `anon public` kalitni nusxalab `.env.local`ga qo'ying.
4. **Migratsiyalarni qo'llash** — ikki usul bor:

   **A. Supabase CLI orqali (tavsiya etiladi):**
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref your-project-ref
   supabase db push
   ```
   Bu `supabase/migrations/*.sql` fayllarini tartib bilan qo'llaydi.

   **B. Qo'lda (Dashboard orqali):**
   Supabase Dashboard → SQL Editor bo'limida `supabase/migrations/`
   papkasidagi har bir faylni raqamlangan tartibda (001, 002, ...)
   ketma-ket ishga tushiring.

5. **pg_cron va pg_net kengaytmalarini yoqish**: bu kengaytmalar
   `009_cron_and_account_deletion.sql` migratsiyasida
   `create extension if not exists` orqali avtomatik yoqiladi. Agar
   xatolik chiqsa, Supabase Dashboard → Database → Extensions bo'limida
   `pg_cron` va `pg_net`ni qo'lda yoqing (Free reja bu kengaytmalarni
   qo'llab-quvvatlaydi).

### Google OAuth sozlash

1. [Google Cloud Console](https://console.cloud.google.com/) da OAuth
   2.0 Client ID yarating (Web application turi).
2. Authorized redirect URI sifatida quyidagini qo'shing:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
3. Supabase Dashboard → Authentication → Providers → Google:
   - Client ID va Client Secret'ni kiriting.
   - **Client Secret hech qachon frontend kodga yoki `.env.local`ga
     yozilmaydi** — u faqat Supabase Dashboard'da saqlanadi.
4. Supabase Dashboard → Authentication → URL Configuration:
   - **Site URL**: production domeningiz (masalan
     `https://stable.pages.dev`), local development uchun
     `http://localhost:3000`.
   - **Redirect URLs**: `http://localhost:3000/auth/callback`,
     `https://stable.pages.dev/auth/callback` va h.k. har bir
     muhit uchun qo'shing.

### Email/Password autentifikatsiya

Supabase Auth email/password'ni default holda qo'llab-quvvatlaydi.
Email verification yoqilganligini tekshiring: Authentication →
Providers → Email → "Confirm email" yoqilgan bo'lishi kerak.

### Edge Functions (hisobni o'chirish uchun)

`delete_own_account_data` RPC barcha `public` schema ma'lumotlarini
tozalaydi, lekin `auth.users` yozuvini o'chirish uchun service-role
kalit kerak bo'ladi. Buning uchun Supabase Edge Function yarating:

```bash
supabase functions new delete-account
```

Function ichida (`supabase/functions/delete-account/index.ts`):
`supabase.auth.admin.deleteUser(userId)` chaqiring (service-role
client bilan). Keyin deploy qiling:

```bash
supabase functions deploy delete-account
```

## 3. Database schema

Barcha jadval, RLS policy, trigger va RPC funksiyalar
`supabase/migrations/` papkasida SQL fayllar sifatida saqlanadi:

| Fayl | Mazmuni |
|---|---|
| `001_extensions_and_profiles.sql` | profiles, 7-xonali public_user_id generatori |
| `002_accounts_and_categories.sql` | user_accounts, categories (hierarchical), tags |
| `003_transactions.sql` | transactions, transaction_items, transaction_tags, balans trigger, future-date reject trigger |
| `004_budgets_goals_subscriptions.sql` | budgets, budget_periods, goals, subscriptions |
| `005_reports_and_notifications.sql` | weekly_reports, report_items, notifications |
| `006_seed_default_categories.sql` | Default kategoriyalar (spec bo'yicha to'liq ro'yxat) |
| `007_dashboard_rpc_functions.sql` | Dashboard/analytics uchun SQL aggregatsiya funksiyalari |
| `008_weekly_report_generation.sql` | Haftalik hisobot generatori (idempotent) |
| `009_cron_and_account_deletion.sql` | pg_cron schedule, hisobni xavfsiz o'chirish |

Barcha user-owned jadvallarda RLS yoqilgan (`auth.uid() = user_id`
mantiqi bilan). Client hech qachon boshqa foydalanuvchi ma'lumotiga
kira olmaydi — bu database darajasida ta'minlanadi, frontend
tekshiruvi faqat UX uchun.

## 4. Cloudflare Pages'ga deploy qilish

1. Reponi GitHub/GitLab'ga push qiling.
2. [Cloudflare Pages](https://pages.cloudflare.com/) da yangi loyiha
   yarating, reponi ulang.
3. Build sozlamalari:
   - **Framework preset**: Next.js
   - **Build command**: `npx @cloudflare/next-on-pages@latest`
   - **Build output directory**: `.vercel/output/static`
4. Environment variables (Cloudflare Pages sozlamalarida):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   NEXT_PUBLIC_SITE_URL=https://your-app.pages.dev
   ```
5. Supabase Dashboard'da Redirect URLs ro'yxatiga production domenni
   qo'shing (yuqoridagi Google OAuth bo'limiga qarang).

**Muhim**: `@cloudflare/next-on-pages` Server Components, Server
Actions va Route Handlers'ni Cloudflare Workers muhitida ishlatish
uchun kerak. Agar loyiha kattalashib ketsa va Cloudflare limitlariga
tegib qolsa, muqobil variant sifatida Vercel yoki boshqa Next.js-mos
hosting ishlatilishi mumkin (lekin spec talabiga ko'ra Cloudflare
Pages asosiy variant).

## 5. Xarajatlar haqida shaffoflik

MVP bosqichida infra narxi **$0**:
- Supabase Free Plan (2 active project, 500MB DB, 50k MAU, va h.k.)
- Cloudflare Pages Free Plan (500 build/month, unlimited requests)

Ixtiyoriy tashqi xarajatlar (majburiy emas):
- **Custom domain** — domen provayderidan sotib olish narxi (agar
  `*.pages.dev` subdomeni yetarli bo'lmasa).
- **Google OAuth** — bepul, lekin agar loyiha Google verification
  talab qiladigan darajaga yetsa (>100 foydalanuvchi, sensitive
  scope'lar), qo'shimcha jarayon talab qilinishi mumkin.

Hech qanday to'lovli xizmat majburiy dependency emas.

## 6. PWA

Ilova PWA sifatida sozlangan:
- `public/manifest.webmanifest` — app metadata, ikonlar, shortcuts
- `public/sw.js` — service worker (app shell cache-first, navigatsiya
  network-first + fallback, API/data so'rovlari har doim network-only
  — moliyaviy ma'lumot hech qachon eskirgan holda cache'dan
  ko'rsatilmaydi)
- `src/features/pwa/` — SW registratsiya, network status banner,
  install prompt komponentlari

Foydalanuvchi brauzerdan "Add to Home Screen" orqali ilovani telefon
ekraniga o'rnatishi mumkin.

## 7. Android APK (Capacitor)

Loyiha `android/` papkasida Capacitor orqali o'rab olingan native
Android proekti bilan birga keladi.

### Nima uchun Capacitor WebView, alohida Kotlin emas

STable Server Components, Server Actions va middleware/proxy'ga
tayanadi (Supabase sessiyasi, xavfsiz server-side so'rovlar uchun).
Bu uni to'liq static HTML sifatida eksport qilishga imkon bermaydi.
Shu sababli Android ilovasi — production URL'ni yuklaydigan yengil
WebView wrapper, bu esa "bitta kod bazasi — ikki platforma" talabini
(spec 2-band) Kotlin'da business logikani takrorlamasdan bajaradi.

### Build qilishdan oldin

`capacitor.config.ts` faylida `server.url`ni production domeningizga
o'zgartiring:

```typescript
server: {
  url: "https://your-production-domain.pages.dev",
  androidScheme: "https",
}
```

Local development uchun (emulator/qurilmada `npm run dev`ni sinash
uchun) LAN IP manzilingizni ishlatishingiz mumkin:

```bash
CAPACITOR_SERVER_URL=http://192.168.1.50:3000 npx cap sync android
```

### APK qurish

Talablar: Android Studio (yoki Android SDK + Gradle), JDK 17+.

```bash
npx cap sync android
npx cap open android
```

Android Studio ochilgandan keyin:
- **Build → Build Bundle(s) / APK(s) → Build APK(s)** — debug APK
  uchun.
- Production/release uchun: **Build → Generate Signed Bundle / APK**,
  o'z keystore faylingiz bilan imzolang (keystore faylini reponi
  commit qilmang — `.gitignore`da allaqachon istisno qilingan).

### App identifikatorlari

- **App ID**: `uz.stable.app` (`capacitor.config.ts`)
- **App nomi**: STable
- Ikonlar va splash screen `@capacitor/assets` orqali generatsiya
  qilingan (`npx capacitor-assets generate --android`), agar
  ikonlarni yangilashni xohlasangiz `public/icons/` dagi manba
  rasmlarni almashtirib qayta generatsiya qiling.

## 8. Loyiha tuzilishi

```
src/
  app/                    # Next.js App Router
    (auth)/               # login, signup, onboarding, reset-password
    (app)/                # dashboard, transactions, calendar, ...
    api/                  # time, calendar/day route handlers
  components/ui/          # shadcn/ui komponentlari (base-ui asosida)
  features/               # domenga xos komponent+action+query'lar
    auth/ dashboard/ transactions/ calendar/ categories/ accounts/
    reports/ budgets/ goals/ subscriptions/ notifications/ profile/
    settings/ pwa/
  lib/
    supabase/             # client.ts, server.ts, middleware.ts
    calculations/         # money, date helperlar
    validators/           # zod schemalar
    time/                 # ishonchli server vaqti
  types/                  # domain type'lar
supabase/
  migrations/             # SQL migratsiyalar (001-009)
android/                  # Capacitor Android proekti
public/
  manifest.webmanifest, sw.js, icons/
```

## 9. Kod sifati

- TypeScript strict mode yoqilgan, `any` minimal ishlatilgan.
- Barcha pul hisob-kitoblari SQL tomonda (`SUM`, `GROUP BY`) amalga
  oshiriladi — frontendda floating-point orqali moliyaviy hisoblash
  yo'q.
- RLS — asosiy xavfsizlik chegarasi, frontend tekshiruvi faqat UX.
- Duplicate submit himoyasi: client-side disable + server-side
  idempotency key (unique constraint).

## 10. Testing (rejalashtirilgan, hali to'liq amalga oshirilmagan)

`PROGRESS.md` faylida hozirgi holat ko'rsatilgan. Testing
infratuzilmasi (Vitest/Jest unit testlar, Playwright E2E) keyingi
bosqichda qo'shiladi.
